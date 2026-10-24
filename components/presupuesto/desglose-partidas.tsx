import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatoMoneda } from '@/lib/format'
import type { DesglosePartida } from '@/lib/types'

const suma = (ps: DesglosePartida[], k: keyof DesglosePartida) => ps.reduce((s, p) => s + (p[k] as number), 0)

function Importe({ valor, cantidad, unidad, plural }: { valor: number; cantidad: number; unidad: string; plural: string }) {
  if (cantidad === 0) return <span className="text-muted-foreground">—</span>
  return (
    <>
      <span className="block font-mono tabular-nums">{formatoMoneda(valor)}</span>
      <span className="block text-xs text-muted-foreground">
        {cantidad} {cantidad === 1 ? unidad : plural}
      </span>
    </>
  )
}

export function DesglosePartidas({ partidas }: { partidas: DesglosePartida[] }) {
  return (
    <section aria-labelledby="titulo-desglose" className="mt-12 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-desglose" className="text-lg font-semibold tracking-tight">
          Compras por partida
        </h2>
        <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Cada columna mide algo distinto y no se suman entre sí: lo <strong>estimado</strong> es un cálculo del
          organismo antes de recibir ofertas, lo <strong>ofertado</strong> es la menor oferta recibida y lo{' '}
          <strong>adjudicado</strong> es el monto de la oferta elegida.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <caption className="sr-only">Importes estimados, ofertados y adjudicados por partida</caption>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-4">Partida</TableHead>
              <TableHead className="text-right">Asignado</TableHead>
              <TableHead className="text-right">Estimado en pedidos abiertos</TableHead>
              <TableHead className="text-right">Ofertado en pedidos cerrados</TableHead>
              <TableHead className="pr-4 text-right">Adjudicado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partidas.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 whitespace-normal">
                  <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
                  <span className="block">{p.nombre}</span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(p.asignado)}</TableCell>
                <TableCell className="text-right">
                  <Importe valor={p.estimado_abierto} cantidad={p.abiertas} unidad="pedido" plural="pedidos" />
                </TableCell>
                <TableCell className="text-right">
                  <Importe valor={p.ofertado_cerrado} cantidad={p.cerradas} unidad="pedido" plural="pedidos" />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Importe valor={p.adjudicado} cantidad={p.adjudicadas} unidad="adjudicación" plural="adjudicaciones" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4 font-semibold">Total</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(suma(partidas, 'asignado'))}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatoMoneda(suma(partidas, 'estimado_abierto'))}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatoMoneda(suma(partidas, 'ofertado_cerrado'))}
              </TableCell>
              <TableCell className="pr-4 text-right font-mono tabular-nums">{formatoMoneda(suma(partidas, 'adjudicado'))}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Mientras un pedido está abierto sus ofertas permanecen selladas, por eso solo se muestra su monto estimado.
      </p>
    </section>
  )
}
