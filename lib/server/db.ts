import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { ErrorApi, ErrorConexion } from '../errores'

let cliente: NeonQueryFunction<false, false> | null = null

export function db() {
  const url = process.env.DATABASE_URL
  if (!url) throw new ErrorConexion('DATABASE_URL no está configurada')
  cliente ??= neon(url)
  return cliente
}

/** Errores de Postgres traen un SQLSTATE de 5 caracteres; cualquier otra falla es de conexión. */
function sqlstate(e: unknown): string | null {
  const code = (e as { code?: unknown })?.code
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : null
}

export function traducirError(e: unknown): Error {
  if (e instanceof ErrorApi || e instanceof ErrorConexion) return e
  const code = sqlstate(e)
  if (code === '23505') return new ErrorApi(409, 'El registro ya existe o fue modificado por otra operación')
  if (code === '23503') return new ErrorApi(422, 'Referencia inexistente')
  if (code === '23514') return new ErrorApi(422, 'Los datos no cumplen las restricciones de la base')
  if (code) return e instanceof Error ? e : new Error(String(e))
  return new ErrorConexion()
}
