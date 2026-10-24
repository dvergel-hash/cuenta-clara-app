import { responder } from '@/lib/server/http'
import { cerrarLicitacion } from '@/lib/server/repositorio'
import { exigirRolApi } from '@/lib/sesion'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return responder(async () => {
    await exigirRolApi(['admin'])
    return cerrarLicitacion(id)
  })
}
