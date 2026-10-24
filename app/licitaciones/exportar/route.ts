import { getLicitaciones } from '@/lib/api'
import { aCsv, filtrar, leerFiltros, ordenar } from '@/lib/listado'

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const filtros = leerFiltros(params)
  try {
    const lics = ordenar(filtrar(await getLicitaciones(), filtros), filtros.orden, filtros.dir)
    return new Response(aCsv(lics), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="licitaciones.csv"',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return Response.json({ error: 'No se pudo generar la exportación' }, { status: 503 })
  }
}
