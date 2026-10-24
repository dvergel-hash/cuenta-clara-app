import { EstadoBadge } from '@/components/indicadores'
import { formatoFecha, formatoMoneda, hashCorto } from '@/lib/format'
import type { Decision } from '@/lib/types'
import { Panel } from './panel'

export function DecisionPanel({ decision }: { decision: Decision }) {
  const variacion = decision.saldo_partida_despues - decision.saldo_partida_antes

  return (
    <Panel titulo="Decisión" id="decision">
      <div className="flex flex-wrap items-center gap-3">
        <EstadoBadge estado={decision.estado} className="text-sm" />
        <span className="text-sm text-muted-foreground">
          {formatoFecha(decision.fecha)} · <span className="font-mono">{decision.id}</span>
        </span>
      </div>

      <blockquote className="border-l-2 border-primary/40 pl-4 text-pretty leading-relaxed">{decision.motivo}</blockquote>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border text-sm">
        <div className="flex flex-col gap-1 bg-card p-3">
          <dt className="text-muted-foreground">Saldo de partida antes</dt>
          <dd className="font-mono tabular-nums">{formatoMoneda(decision.saldo_partida_antes)}</dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-3">
          <dt className="text-muted-foreground">Saldo de partida después</dt>
          <dd className="font-mono tabular-nums">{formatoMoneda(decision.saldo_partida_despues)}</dd>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-2 bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground">Afectación</dt>
          <dd className="font-mono tabular-nums">{variacion === 0 ? 'Sin afectación' : formatoMoneda(variacion)}</dd>
        </div>
      </dl>

      <p className="break-all font-mono text-xs text-muted-foreground">
        <span className="sr-only">Hash del registro: </span>
        <span aria-hidden="true">hash </span>
        <span title={decision.hash}>{hashCorto(decision.hash)}</span>
      </p>
    </Panel>
  )
}
