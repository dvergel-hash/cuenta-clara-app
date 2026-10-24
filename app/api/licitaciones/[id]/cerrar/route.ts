import { responder } from '@/lib/server/http'
import { cerrarLicitacion } from '@/lib/server/repositorio'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return responder(() => cerrarLicitacion(id))
}
