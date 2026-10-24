import { responder } from '@/lib/server/http'
import { listarLicitaciones } from '@/lib/server/repositorio'

export function GET() {
  return responder(listarLicitaciones)
}
