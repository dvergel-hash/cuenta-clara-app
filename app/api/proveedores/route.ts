import { responder } from '@/lib/server/http'
import { listarProveedores } from '@/lib/server/repositorio'

export function GET() {
  return responder(listarProveedores)
}
