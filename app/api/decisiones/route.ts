import { responder } from '@/lib/server/http'
import { listarDecisiones } from '@/lib/server/repositorio'

export function GET() {
  return responder(listarDecisiones)
}
