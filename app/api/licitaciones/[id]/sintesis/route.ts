import { getLicitacion } from '@/lib/api'
import { ErrorApi } from '@/lib/errores'
import { responder } from '@/lib/server/http'
import { exigirRolApi } from '@/lib/sesion'
import { generarSintesis } from '@/lib/sintesis'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return responder(async () => {
    await exigirRolApi(['admin'])
    const detalle = await getLicitacion(id)
    if (!detalle) throw new ErrorApi(404, `No existe el pedido ${id}`)
    return generarSintesis(detalle)
  })
}
