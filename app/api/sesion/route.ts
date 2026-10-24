import { timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ErrorApi } from '@/lib/errores'
import { responder } from '@/lib/server/http'
import { COOKIE, USUARIOS_DEMO, claveDemo, crearToken, opcionesCookie, sesionActual } from '@/lib/sesion'

const loginSchema = z.object({ email: z.string().trim().toLowerCase(), clave: z.string() })

const iguales = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function GET() {
  return responder(async () => ({ usuario: await sesionActual() }))
}

export function POST(req: Request) {
  return responder(async () => {
    const cuerpo = loginSchema.safeParse(await req.json().catch(() => null))
    if (!cuerpo.success) throw new ErrorApi(400, 'Ingresá correo y clave')
    const u = USUARIOS_DEMO.find((x) => x.email === cuerpo.data.email)
    // Misma respuesta si el usuario no existe o la clave no coincide.
    if (!u || !iguales(cuerpo.data.clave, claveDemo())) throw new ErrorApi(401, 'Correo o clave incorrectos')
    ;(await cookies()).set(COOKIE, crearToken(u.email), opcionesCookie)
    return { usuario: { email: u.email, nombre: u.nombre, rol: u.rol } }
  })
}

export function DELETE() {
  return responder(async () => {
    ;(await cookies()).delete(COOKIE)
    return { ok: true }
  })
}
