import { ErrorApi, ErrorConexion } from '../errores'

export async function responder(fn: () => Promise<unknown>, status = 200) {
  try {
    return Response.json(await fn(), { status })
  } catch (e) {
    if (e instanceof ErrorApi) return Response.json({ error: e.message }, { status: e.status })
    if (e instanceof ErrorConexion) {
      console.error('[api] base de datos no disponible:', e.message)
      return Response.json({ error: 'La base de datos no está disponible' }, { status: 503 })
    }
    console.error('[api] error inesperado:', e)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}

export function pedidoIdRequerido(req: Request) {
  const pedidoId = new URL(req.url).searchParams.get('pedido_id')?.trim()
  if (!pedidoId) throw new ErrorApi(400, 'Falta el parámetro pedido_id')
  return pedidoId
}
