import { ErrorApi } from '@/lib/errores'
import { observacionSchema } from '@/lib/schemas'
import { responder } from '@/lib/server/http'
import { hashIp, listarObservacionesPublicadas, registrarObservacion } from '@/lib/server/repositorio'

export function GET(req: Request) {
  return responder(() => {
    const id = new URL(req.url).searchParams.get('licitacion_id')?.trim()
    if (!id) throw new ErrorApi(400, 'Falta el parámetro licitacion_id')
    return listarObservacionesPublicadas(id)
  })
}

function ipDe(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconocida'
}

export function POST(req: Request) {
  return responder(async () => {
    const cuerpo = await req.json().catch(() => {
      throw new ErrorApi(400, 'El cuerpo debe ser JSON válido')
    })
    const resultado = observacionSchema.safeParse(cuerpo)
    if (!resultado.success) {
      const primero = resultado.error.issues[0]
      throw new ErrorApi(422, `${primero.path.join('.') || 'observación'}: ${primero.message}`)
    }
    const { sitio_web, ...observacion } = resultado.data
    // Honeypot completado: respondemos como si se hubiera guardado para no darle pistas al bot.
    if (sitio_web) {
      return { codigo: 'CC-0000-0000', estado: 'pendiente', creada: new Date().toISOString() }
    }
    return registrarObservacion(observacion, await hashIp(ipDe(req)))
  }, 201)
}
