import { semaforoDesvio, type Semaforo } from '@/lib/calculos'
import { formatoPorcentaje } from '@/lib/format'
import type { EstadoLicitacion, Origen } from '@/lib/types'
import { cn } from '@/lib/utils'

const estilosEstado: Record<EstadoLicitacion, { label: string; clase: string }> = {
  abierto: { label: 'Abierto', clase: 'bg-info-soft text-primary border-primary/20' },
  aprobado: { label: 'Aprobado', clase: 'bg-ok-soft text-ok border-ok/25' },
  observado: { label: 'Observado', clase: 'bg-warn-soft text-warn border-warn/30' },
  rechazado: { label: 'Rechazado', clase: 'bg-danger-soft text-danger border-danger/25' },
}

export const etiquetaEstado = (e: EstadoLicitacion) => estilosEstado[e].label

export function EstadoBadge({ estado, className }: { estado: EstadoLicitacion; className?: string }) {
  const { label, clase } = estilosEstado[estado]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        clase,
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function OrigenBadge({ origen }: { origen: Origen }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[0.7rem] font-medium uppercase tracking-wide',
        origen === 'portal'
          ? 'border-primary/30 bg-card text-primary'
          : 'border-border bg-secondary text-secondary-foreground',
      )}
    >
      {origen}
    </span>
  )
}

const estilosSemaforo: Record<Semaforo, string> = {
  verde: 'bg-ok',
  amarillo: 'bg-warn',
  rojo: 'bg-danger',
}

const textoSemaforo: Record<Semaforo, string> = {
  verde: 'text-ok',
  amarillo: 'text-warn',
  rojo: 'text-danger',
}

export function Luz({ nivel, etiqueta }: { nivel: Semaforo; etiqueta: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-medium', textoSemaforo[nivel])}>
      <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', estilosSemaforo[nivel])} />
      {etiqueta}
    </span>
  )
}

const nivelLegible: Record<Semaforo, string> = {
  verde: 'dentro del rango',
  amarillo: 'desvío moderado',
  rojo: 'desvío alto',
}

export function DesvioSemaforo({ desvio }: { desvio: number | null }) {
  if (desvio === null) return <span className="text-muted-foreground">—</span>
  const nivel = semaforoDesvio(desvio)
  return (
    <span className="inline-flex items-center gap-2">
      <Luz nivel={nivel} etiqueta={formatoPorcentaje(desvio)} />
      <span className="sr-only">({nivelLegible[nivel]})</span>
    </span>
  )
}
