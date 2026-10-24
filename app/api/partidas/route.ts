import { responder } from '@/lib/server/http'
import { listarPartidas } from '@/lib/server/repositorio'

export function GET() {
  return responder(listarPartidas)
}
