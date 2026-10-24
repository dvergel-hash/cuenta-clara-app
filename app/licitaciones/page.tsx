import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EstadoBadge } from '@/components/indicadores'
import { FiltrosLicitaciones } from '@/components/licitaciones/filtros'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ESTADOS, getLicitaciones, getPartidas } from '@/lib/api'
import { formatoFecha, formatoMoneda } from '@/lib/format'

export const metadata: Metadata = { title: 'Licitaciones' }

export default async function LicitacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; partida?: string }>
}) {
  const { estado, partida } = await searchParams
  const [licitaciones, partidas] = await Promise.all([getLicitaciones({ estado, partida }), getPartidas()])

  return (
    <>
      <PageHeader
        eyebrow="Compras estatales"
        title="Licitaciones"
        description="Pedidos de cotización publicados por el organismo. Cada decisión queda sellada en un registro verificable."
      />

      <section aria-labelledby="titulo-listado" className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Suspense>
            <FiltrosLicitaciones estados={ESTADOS} partidas={partidas} />
          </Suspense>
          <p id="titulo-listado" className="text-sm text-muted-foreground" aria-live="polite">
            {licitaciones.length} {licitaciones.length === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="pl-4">Pedido</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto estimado</TableHead>
                <TableHead>Partida</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-4">Cierre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licitaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No hay pedidos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
              {licitaciones.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="pl-4">
                    <Link
                      href={`/licitaciones/${l.id}`}
                      className="font-mono text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {l.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">{l.descripcion}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(l.monto_estimado)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="font-mono text-xs text-muted-foreground">{l.partida.codigo}</span>
                    <span className="block text-sm">{l.partida.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={l.estado} />
                  </TableCell>
                  <TableCell className="pr-4 font-mono text-sm tabular-nums">{formatoFecha(l.fecha_cierre)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  )
}
