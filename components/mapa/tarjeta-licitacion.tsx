import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LicitacionGeo } from '@/lib/mapa/datos'
import { NIVELES, desvioPorcentual, montoCompacto, nivelDesvio } from '@/lib/mapa/desvio'
import { formatoFecha } from '@/lib/format'
import { InsigniaDesvio } from './insignia-desvio'

export function TarjetaLicitacion({
  licitacion: l,
  activa,
  onCentrar,
}: {
  licitacion: LicitacionGeo
  activa: boolean
  onCentrar: () => void
}) {
  const desvio = desvioPorcentual(l)
  const color = NIVELES[nivelDesvio(desvio)].color
  const proporcion = Math.min(l.costoEjecutado / l.presupuestoOficial, 1.5) / 1.5

  return (
    <article
      id={`tarjeta-${l.id}`}
      aria-current={activa ? 'true' : undefined}
      className={cn(
        'flex scroll-mt-4 flex-col gap-3 rounded-lg border bg-card p-4 transition-colors',
        activa ? 'border-primary ring-2 ring-primary/25' : 'border-border',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-mono text-xs text-muted-foreground">
            {l.id} · {formatoFecha(l.fecha)}
          </p>
          <h3 className="text-pretty text-sm font-semibold leading-snug">{l.titulo}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {l.organismo} · {l.localidad}, {l.provincia}
          </p>
        </div>
        <InsigniaDesvio desvio={desvio} />
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">
            Oficial <span className="font-mono text-foreground">{montoCompacto(l.presupuestoOficial)}</span>
          </span>
          <span className="text-muted-foreground">
            Ejecutado <span className="font-mono text-foreground">{montoCompacto(l.costoEjecutado)}</span>
          </span>
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${proporcion * 100}%`, backgroundColor: color }} />
          <div className="absolute inset-y-0 w-px bg-foreground" style={{ left: `${(1 / 1.5) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">{l.categoria}</span>
        <Button variant="outline" size="sm" onClick={onCentrar}>
          <Crosshair aria-hidden="true" />
          Centrar en mapa
        </Button>
      </div>
    </article>
  )
}
