import { ExternalLink, Lock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatoFecha, formatoMoneda } from '@/lib/format'
import type { BusquedaAgente, CanalBusqueda, ResultadoBusqueda } from '@/lib/types'
import { cn } from '@/lib/utils'

const resultados: Record<ResultadoBusqueda, { label: string; clase: string }> = {
  cotizacion: { label: 'Cotización obtenida', clase: 'bg-info-soft text-primary border-primary/20' },
  referencia: { label: 'Precio de referencia', clase: 'bg-ok-soft text-ok border-ok/25' },
  descartada: { label: 'Descartada', clase: 'bg-warn-soft text-warn border-warn/30' },
  sin_respuesta: { label: 'Sin respuesta', clase: 'bg-secondary text-secondary-foreground border-border' },
}

const canales: Record<CanalBusqueda, string> = {
  web: 'Web',
  correo: 'Correo',
  catalogo: 'Catálogo',
  mensajeria: 'Mensajería',
}

const hora = (iso: string) => iso.slice(11, 16)

function Destino({ destino }: { destino: string | null }) {
  if (!destino) return <span className="text-muted-foreground">Reservado</span>
  if (!destino.startsWith('http')) return <span>{destino}</span>
  const { hostname, pathname } = new URL(destino)
  return (
    <a
      href={destino}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-xs items-center gap-1 font-mono text-xs text-primary underline-offset-4 hover:underline"
    >
      <span className="truncate">
        {hostname}
        {pathname}
      </span>
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  )
}

export function BusquedasAgentes({ busquedas, sellado }: { busquedas: BusquedaAgente[]; sellado: boolean }) {
  if (busquedas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
        Los agentes no registraron búsquedas para este pedido.
      </p>
    )
  }

  const resumen = (Object.keys(resultados) as ResultadoBusqueda[])
    .map((r) => ({ r, n: busquedas.filter((b) => b.resultado === r).length }))
    .filter(({ n }) => n > 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Cada consulta que los agentes hicieron a proveedores y sitios web para obtener cotizaciones y precios de
          referencia, en orden cronológico.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Resumen por resultado">
          {resumen.map(({ r, n }) => (
            <li
              key={r}
              className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums', resultados[r].clase)}
            >
              {n} · {resultados[r].label}
            </li>
          ))}
        </ul>
      </div>

      {sellado && (
        <div className="flex items-start gap-3 rounded-md border border-dashed border-primary/30 bg-info-soft p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-pretty leading-relaxed">
            Pedido abierto: los destinos y precios obtenidos se publican al abrirse el sobre.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <caption className="sr-only">Búsquedas realizadas por los agentes</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Agente · canal</TableHead>
              <TableHead>Consulta</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="text-right">Precio obtenido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {busquedas.map((b) => (
              <TableRow key={b.id} className="align-top">
                <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                  {formatoFecha(b.fecha)}
                  <span className="block text-muted-foreground">{hora(b.fecha)}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {b.agente}
                  <span className="block text-xs text-muted-foreground">{canales[b.canal]}</span>
                </TableCell>
                <TableCell className="min-w-56 max-w-sm whitespace-normal">
                  <span className="text-pretty">{b.consulta}</span>
                  {b.nota && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{b.nota}</span>}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Destino destino={b.destino} />
                  {b.cotizacion_id && (
                    <span className="mt-1 block font-mono text-xs text-muted-foreground">{b.cotizacion_id}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold',
                      resultados[b.resultado].clase,
                    )}
                  >
                    {resultados[b.resultado].label}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {b.precio !== undefined ? (
                    <span className={cn(b.resultado === 'descartada' && 'text-muted-foreground line-through')}>
                      {formatoMoneda(b.precio)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
