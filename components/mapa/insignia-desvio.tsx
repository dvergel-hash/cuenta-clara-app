import { cn } from '@/lib/utils'
import { NIVELES, desvioTexto, nivelDesvio } from '@/lib/mapa/desvio'

export function InsigniaDesvio({ desvio, className }: { desvio: number; className?: string }) {
  const nivel = NIVELES[nivelDesvio(desvio)]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-xs font-medium text-foreground',
        className,
      )}
      style={{ borderColor: nivel.color, backgroundColor: `${nivel.color}1f` }}
    >
      <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: nivel.color }} />
      {desvioTexto(desvio)}
      <span className="sr-only">, nivel {nivel.etiqueta}</span>
    </span>
  )
}
