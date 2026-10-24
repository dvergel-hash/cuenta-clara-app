import { pedidoIdRequerido, responder } from '@/lib/server/http'
import { listarBusquedas } from '@/lib/server/repositorio'

export function GET(req: Request) {
  return responder(() => listarBusquedas(pedidoIdRequerido(req)))
}
