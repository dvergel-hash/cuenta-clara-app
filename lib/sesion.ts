import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ErrorApi } from './errores'
import type { Rol, Usuario } from './roles'

/**
 * Acceso de demostración: usuarios fijos y una cookie firmada. No es autenticación de producción
 * (no hay base de usuarios, recuperación de clave ni límite de intentos).
 */
export const COOKIE = 'cc_sesion'
const DURACION_S = 8 * 3600

export const USUARIOS_DEMO: (Usuario & { demo: true })[] = [
  { email: 'admin@cuentaclara.demo', nombre: 'Laura Benítez', rol: 'admin', demo: true },
  { email: 'proveedor@cuentaclara.demo', nombre: 'Proveedor de ejemplo', rol: 'proveedor', demo: true },
  { email: 'ciudadano@cuentaclara.demo', nombre: 'Vecino de ejemplo', rol: 'ciudadano', demo: true },
]

export const claveDemo = () => process.env.DEMO_PASSWORD ?? 'cuentaclara'
const secreto = () => process.env.SESSION_SECRET ?? process.env.SEED_TOKEN ?? 'cuenta-clara-demo'

const firmar = (carga: string) => createHmac('sha256', secreto()).update(carga).digest('base64url')

export function crearToken(email: string, ahora = Date.now()) {
  const carga = `${email}|${Math.floor(ahora / 1000) + DURACION_S}`
  return `${Buffer.from(carga).toString('base64url')}.${firmar(carga)}`
}

export function usuarioDeToken(token: string | undefined, ahora = Date.now()): Usuario | null {
  if (!token) return null
  const [cargaB64, firma] = token.split('.')
  if (!cargaB64 || !firma) return null
  const carga = Buffer.from(cargaB64, 'base64url').toString()
  const esperada = Buffer.from(firmar(carga))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null
  const [email, expira] = carga.split('|')
  if (Number(expira) * 1000 < ahora) return null
  const u = USUARIOS_DEMO.find((x) => x.email === email)
  return u ? { email: u.email, nombre: u.nombre, rol: u.rol } : null
}

export async function sesionActual(): Promise<Usuario | null> {
  return usuarioDeToken((await cookies()).get(COOKIE)?.value)
}

export const opcionesCookie = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: DURACION_S }

/** Rutas internas únicamente: evita redirecciones abiertas desde ?desde=. */
export const rutaSegura = (desde: string | undefined) =>
  desde && desde.startsWith('/') && !desde.startsWith('//') && !desde.includes('\\') ? desde : '/licitaciones'

/** Para páginas: redirige al login si no hay sesión o el rol no alcanza. */
export async function exigirRol(roles: Rol[], desde: string) {
  const u = await sesionActual()
  if (!u) redirect(`/login?desde=${encodeURIComponent(desde)}`)
  if (!roles.includes(u.rol)) redirect(`/login?desde=${encodeURIComponent(desde)}&sin_permiso=1`)
  return u
}

/** Para Route Handlers: lanza 401/403 como el resto de la API. */
export async function exigirRolApi(roles: Rol[]) {
  const u = await sesionActual()
  if (!u) throw new ErrorApi(401, 'Iniciá sesión para continuar')
  if (!roles.includes(u.rol)) throw new ErrorApi(403, 'Tu rol no tiene permiso para esta acción')
  return u
}
