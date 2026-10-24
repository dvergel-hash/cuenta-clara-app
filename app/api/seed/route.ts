import { timingSafeEqual } from 'node:crypto'
import { ErrorApi } from '@/lib/errores'
import { responder } from '@/lib/server/http'
import { sembrar } from '@/lib/server/repositorio'

function tokenValido(recibido: string | null, esperado: string) {
  if (!recibido) return false
  const a = Buffer.from(recibido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function POST(req: Request) {
  return responder(async () => {
    const esperado = process.env.SEED_TOKEN
    if (!esperado) throw new ErrorApi(503, 'SEED_TOKEN no está configurado')
    if (!tokenValido(req.headers.get('x-seed-token'), esperado)) throw new ErrorApi(401, 'Token inválido')
    return { ok: true, filas: await sembrar() }
  })
}
