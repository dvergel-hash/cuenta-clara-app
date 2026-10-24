import { responder } from '@/lib/server/http'
import { consultarSeguimiento } from '@/lib/server/repositorio'

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  return responder(() => consultarSeguimiento(codigo.trim().toUpperCase()))
}
