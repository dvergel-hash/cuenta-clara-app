import type { Metadata } from 'next'
import { DesvioSemaforo } from '@/components/indicadores'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getRankingProveedores } from '@/lib/api'
import { MIN_PUNTOS_REFERENCIA } from '@/lib/calculos'
import { formatoCuit } from '@/lib/format'

export const metadata: Metadata = { title: 'Proveedores' }

export default async function ProveedoresPage() {
  const ranking = await getRankingProveedores()

  return (
    <>
      <PageHeader
        eyebrow="Proveedores del Estado"
        title="Desvío respecto de la referencia"
        description="Ranking de proveedores según el desvío promedio de sus cotizaciones respecto del precio de referencia de cada pedido."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <caption className="sr-only">Proveedores ordenados por desvío promedio respecto de la referencia</caption>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-12 pl-4">#</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Desvío promedio</TableHead>
                <TableHead className="text-right">Cotizaciones</TableHead>
                <TableHead className="pr-4 text-right">Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{formatoCuit(p.cuit)}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {p.desvio_promedio === null ? (
                      <span className="text-sm text-muted-foreground">Sin datos comparables</span>
                    ) : (
                      <DesvioSemaforo desvio={p.desvio_promedio} />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{p.cotizaciones}</TableCell>
                  <TableCell className="pr-4 text-right font-mono tabular-nums">{p.observaciones}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <aside aria-labelledby="titulo-metodologia" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed">
          <h2 id="titulo-metodologia" className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Metodología
          </h2>
          <p>
            Para cada pedido cerrado se calcula un precio de referencia: la mediana de las cotizaciones recibidas y de
            los precios relevados en fuentes web.
          </p>
          <p>
            El desvío de una cotización es su monto total menos la referencia, dividido por la referencia. El desvío
            promedio es la media simple de esos valores para cada proveedor.
          </p>
          <p>
            Solo se consideran pedidos con al menos {MIN_PUNTOS_REFERENCIA} puntos de comparación. Las ofertas de
            pedidos abiertos no se incluyen.
          </p>
          <p>Una observación se registra cuando una cotización supera la referencia en más de 25 %.</p>
          <p className="text-muted-foreground">
            Un desvío respecto de la referencia es un indicador estadístico para orientar el control; no implica, por sí
            solo, una irregularidad.
          </p>
        </aside>
      </div>
    </>
  )
}
