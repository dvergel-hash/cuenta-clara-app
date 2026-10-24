import { ErrorApi } from '@/lib/errores'
import { licitacionSchema } from '@/lib/schemas'
import { responder } from '@/lib/server/http'
import { listarLicitaciones, registrarLicitacion } from '@/lib/server/repositorio'
import { exigirRolApi } from '@/lib/sesion'

export function GET() {
  return responder(listarLicitaciones)
}

export function POST(req: Request) {
  return responder(async () => {
    await exigirRolApi(['admin'])
    const cuerpo = await req.json().catch(() => {
      throw new ErrorApi(400, 'El cuerpo debe ser JSON válido')
    })
    const resultado = licitacionSchema.safeParse(cuerpo)
    if (!resultado.success) {
      const primero = resultado.error.issues[0]
      throw new ErrorApi(422, `${primero.path.join('.') || 'licitación'}: ${primero.message}`)
    }
    return registrarLicitacion(resultado.data)
  }, 201)
}
