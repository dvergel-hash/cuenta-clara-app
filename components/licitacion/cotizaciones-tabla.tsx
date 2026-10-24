import { DesvioSemaforo, OrigenBadge } from '@/components/indicadores'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatoCuit, formatoMoneda } from '@/lib/format'
import type { CotizacionPublica } from '@/lib/types'

export function CotizacionesTabla({
  cotizaciones,
  adjudicadoId,
}: {
  cotizaciones: CotizacionPublica[]
  adjudicadoId?: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <caption className="sr-only">Cotizaciones recibidas, ordenadas por monto total</caption>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="pl-4">Proveedor</TableHead>
            <TableHead>CUIT</TableHead>
            <TableHead className="text-right">Monto total</TableHead>
            <TableHead className="text-right">Plazo</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead className="pr-4">Desvío vs. referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotizaciones.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-4 whitespace-normal">
                <span className="font-medium">{c.proveedor_nombre}</span>
                {c.proveedor_id === adjudicadoId && (
                  <span className="ml-2 rounded-sm bg-ok-soft px-1.5 py-0.5 text-xs font-semibold text-ok">
                    Adjudicada
                  </span>
                )}
                {!c.condiciones.iva_incluido && (
                  <span className="block text-xs text-muted-foreground">Sin IVA incluido</span>
                )}
                {c.fuente && <span className="block text-xs text-muted-foreground">Vía: {c.fuente}</span>}
              </TableCell>
              <TableCell className="font-mono text-sm tabular-nums">{formatoCuit(c.cuit)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatoMoneda(c.total_ars)}
                {c.moneda === 'USD' && (
                  <span className="block text-xs text-muted-foreground">USD · TC {c.tipo_cambio_usado}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {c.condiciones.plazo_entrega_dias === 0 ? 'Inmediato' : `${c.condiciones.plazo_entrega_dias} días`}
              </TableCell>
              <TableCell>
                <OrigenBadge origen={c.origen} />
              </TableCell>
              <TableCell className="pr-4 tabular-nums">
                <DesvioSemaforo desvio={c.desvio} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Semáforo: verde hasta 10 %, amarillo entre 10 % y 25 %, rojo más de 25 % respecto de la referencia.
      </p>
    </div>
  )
}
