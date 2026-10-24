import { ErrorApi } from '@/lib/errores'
import { cotizacionSchema } from '@/lib/schemas'
import { pedidoIdRequerido, responder } from '@/lib/server/http'
import { listarCotizaciones, registrarCotizacion } from '@/lib/server/repositorio'
import { exigirRolApi } from '@/lib/sesion'

const MAX_ITEMS = 200

export function GET(req: Request) {
  return responder(() => listarCotizaciones(pedidoIdRequerido(req)))
}

export function POST(req: Request) {
  return responder(async () => {
    await exigirRolApi(['proveedor', 'admin'])
    const cuerpo = await req.json().catch(() => {
      throw new ErrorApi(400, 'El cuerpo debe ser JSON válido')
    })
    // El origen lo fija el servidor: todo lo que entra por este endpoint es del portal.
    const resultado = cotizacionSchema.safeParse({ ...(cuerpo as object), origen: 'portal' })
    if (!resultado.success) {
      const primero = resultado.error.issues[0]
      throw new ErrorApi(422, `${primero.path.join('.') || 'cotización'}: ${primero.message}`)
    }
    if (resultado.data.items.length > MAX_ITEMS) throw new ErrorApi(422, `Máximo ${MAX_ITEMS} ítems por cotización`)
    return registrarCotizacion(resultado.data)
  }, 201)
}
