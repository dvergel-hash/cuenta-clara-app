import type { Metadata } from 'next'
import { Luz } from '@/components/indicadores'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DesglosePartidas } from '@/components/presupuesto/desglose-partidas'
import { getDesglosePartidas, getProyeccionPresupuesto } from '@/lib/api'
import { FECHA_CORTE, MESES_TRANSCURRIDOS, type Semaforo } from '@/lib/calculos'
import { formatoFecha, formatoMoneda, formatoPorcentajeSinSigno } from '@/lib/format'

export const metadata: Metadata = { title: 'Presupuesto' }

function clasificar(desvio: number): { nivel: Semaforo; etiqueta: string } {
  const abs = Math.abs(desvio)
  const tipo = desvio > 0 ? 'Déficit' : 'Superávit'
  if (abs <= 0.05) return { nivel: 'verde', etiqueta: 'En línea' }
  if (abs <= 0.15) return { nivel: 'amarillo', etiqueta: `${tipo} ${formatoPorcentajeSinSigno(abs)}` }
  return { nivel: 'rojo', etiqueta: `${tipo} ${formatoPorcentajeSinSigno(abs)}` }
}

export default async function PresupuestoPage() {
  const [partidas, desglose] = await Promise.all([getProyeccionPresupuesto(), getDesglosePartidas()])
  const totales = partidas.reduce(
    (acc, p) => ({
      asignado: acc.asignado + p.asignado,
      ejecutado: acc.ejecutado + p.ejecutado,
      proyeccion: acc.proyeccion + p.proyeccion,
    }),
    { asignado: 0, ejecutado: 0, proyeccion: 0 },
  )

  return (
    <>
      <PageHeader
        eyebrow="Ejercicio 2026"
        title="Ejecución presupuestaria"
        description={
          <>
            Ejecutado al {formatoFecha(FECHA_CORTE)} ({MESES_TRANSCURRIDOS} de 12 meses). La proyección al cierre es
            lineal: ejecutado ÷ {MESES_TRANSCURRIDOS} × 12.
          </>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <caption className="sr-only">Partidas presupuestarias con proyección al cierre del ejercicio</caption>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-4">Partida</TableHead>
              <TableHead className="text-right">Asignado</TableHead>
              <TableHead className="text-right">Ejecutado</TableHead>
              <TableHead className="w-40">Avance</TableHead>
              <TableHead className="text-right">Proyección al cierre</TableHead>
              <TableHead className="pr-4">Proyectado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partidas.map((p) => {
              const avance = p.ejecutado / p.asignado
              const { nivel, etiqueta } = clasificar(p.desvio_proyectado)
              return (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 whitespace-normal">
                    <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
                    <span className="block">{p.nombre}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(p.asignado)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(p.ejecutado)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${formatoPorcentajeSinSigno(avance)} ejecutado`}
                      >
                        <div className="barra h-full rounded-full bg-gradient-to-r from-primary to-cian" style={{ width: `${Math.min(avance, 1) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatoPorcentajeSinSigno(avance)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(p.proyeccion)}</TableCell>
                  <TableCell className="pr-4">
                    <Luz nivel={nivel} etiqueta={etiqueta} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4 font-semibold">Total</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(totales.asignado)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(totales.ejecutado)}</TableCell>
              <TableCell />
              <TableCell className="text-right font-mono tabular-nums">{formatoMoneda(totales.proyeccion)}</TableCell>
              <TableCell className="pr-4" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Semáforo: verde si la proyección queda dentro de ±5 % del asignado, amarillo entre 5 % y 15 %, rojo más de 15 %.
        Déficit indica que la proyección supera lo asignado; superávit, que queda por debajo.
      </p>

      <DesglosePartidas partidas={desglose} />
    </>
  )
}
