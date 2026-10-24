import { ArrowDown, ArrowUp, ArrowUpDown, Info } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EstadoBadge } from '@/components/indicadores'
import { FiltrosLicitaciones } from '@/components/licitaciones/filtros'
import { ResumenLicitaciones } from '@/components/licitaciones/resumen'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ESTADOS, datosDemo, getLicitaciones, getPartidas } from '@/lib/api'
import { formatoFecha, formatoMoneda } from '@/lib/format'
import {
  aQuery,
  filtrar,
  hayFiltros,
  leerFiltros,
  ordenar,
  paginar,
  resumir,
  type ColumnaOrden,
  type ParamsCrudos,
} from '@/lib/listado'

export const metadata: Metadata = { title: 'Licitaciones' }

const COLUMNAS: { clave: ColumnaOrden; titulo: string; clase?: string }[] = [
  { clave: 'id', titulo: 'Pedido', clase: 'pl-4' },
  { clave: 'descripcion', titulo: 'Descripción' },
  { clave: 'monto', titulo: 'Monto estimado', clase: 'text-right' },
  { clave: 'partida', titulo: 'Partida' },
  { clave: 'estado', titulo: 'Estado' },
  { clave: 'cierre', titulo: 'Cierre', clase: 'pr-4' },
]

export default async function LicitacionesPage({ searchParams }: { searchParams: Promise<ParamsCrudos> }) {
  const filtros = leerFiltros(await searchParams)
  const [todas, partidas] = await Promise.all([getLicitaciones(), getPartidas()])

  const ahora = new Date()
  const filtradas = ordenar(filtrar(todas, filtros, ahora), filtros.orden, filtros.dir)
  const { items, pagina, paginas } = paginar(filtradas, filtros.pagina)
  const conFiltros = hayFiltros(filtros)
  const f = { ...filtros, pagina }

  return (
    <>
      <PageHeader
        eyebrow="Compras estatales"
        title="Licitaciones"
        description="Pedidos de cotización publicados por el organismo. Cada decisión queda sellada en un registro verificable."
      >
        <Link href="/licitaciones/nueva" className={buttonVariants()}>
          Nueva licitación
        </Link>
      </PageHeader>

      {datosDemo() && (
        <p
          role="note"
          className="mb-6 flex items-start gap-2 rounded-md border border-warn/30 bg-warn-soft p-3 text-sm text-warn"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Datos de demostración: la base de datos no está conectada, se muestran registros sintéticos.
        </p>
      )}

      <ResumenLicitaciones resumen={resumir(todas, ahora)} estado={filtros.estado} venceEn={filtros.venceEn} />

      <section aria-labelledby="titulo-listado" className="flex flex-col gap-4">
        <Suspense>
          <FiltrosLicitaciones estados={ESTADOS} partidas={partidas} hayFiltros={conFiltros} />
        </Suspense>
        <p id="titulo-listado" className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'pedido' : 'pedidos'}
          {conFiltros && ` de ${todas.length}`}
        </p>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {COLUMNAS.map((c) => {
                  const activa = filtros.orden === c.clave
                  const siguiente = activa && filtros.dir === 'asc' ? 'desc' : 'asc'
                  const Icono = !activa ? ArrowUpDown : filtros.dir === 'asc' ? ArrowUp : ArrowDown
                  return (
                    <TableHead
                      key={c.clave}
                      className={c.clase}
                      aria-sort={activa ? (filtros.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <Link
                        href={`/licitaciones${aQuery(f, { orden: c.clave, dir: siguiente, pagina: undefined })}`}
                        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground"
                      >
                        {c.titulo}
                        <Icono className={activa ? 'size-3.5' : 'size-3.5 opacity-40'} aria-hidden="true" />
                      </Link>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <p>
                      {todas.length === 0
                        ? 'Todavía no hay licitaciones publicadas.'
                        : 'Ningún pedido coincide con los filtros.'}
                    </p>
                    <p className="mt-3">
                      {conFiltros ? (
                        <Link href="/licitaciones" className="font-medium text-primary underline underline-offset-4">
                          Limpiar filtros
                        </Link>
                      ) : (
                        <Link href="/licitaciones/nueva" className="font-medium text-primary underline underline-offset-4">
                          Publicar la primera licitación
                        </Link>
                      )}
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="pl-4">
                    <Link
                      href={`/licitaciones/${l.id}`}
                      className="font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {l.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal font-medium leading-snug">{l.descripcion}</TableCell>
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

        {paginas > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-sm">
            {pagina > 1 ? (
              <Link href={`/licitaciones${aQuery(f, { pagina: pagina - 1 })}`} className={buttonVariants({ variant: 'outline' })}>
                Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Página {pagina} de {paginas}
            </span>
            {pagina < paginas ? (
              <Link href={`/licitaciones${aQuery(f, { pagina: pagina + 1 })}`} className={buttonVariants({ variant: 'outline' })}>
                Siguiente
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </>
  )
}
