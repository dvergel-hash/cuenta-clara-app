import { FileText } from 'lucide-react'
import { EstadoBadge, etiquetaEstado } from '@/components/indicadores'
import type { Dictamen } from '@/lib/dictamen'
import { formatoFecha, hashCorto } from '@/lib/format'

export function DictamenDocumento({ dictamen }: { dictamen: Dictamen }) {
  const { decision } = dictamen

  return (
    <article
      aria-labelledby="titulo-dictamen"
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-lg border border-border bg-card p-6 text-card-foreground md:p-10"
    >
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Comisión Evaluadora de Ofertas
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="titulo-dictamen" className="text-xl font-semibold tracking-tight">
            Dictamen de evaluación <span className="font-mono">{dictamen.numero}</span>
          </h2>
          <p className="font-mono text-sm tabular-nums text-muted-foreground">{formatoFecha(dictamen.fecha)}</p>
        </div>
      </header>

      <section aria-labelledby="dictamen-visto" className="flex flex-col gap-2">
        <h3 id="dictamen-visto" className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          Visto
        </h3>
        <p className="text-pretty leading-relaxed">{dictamen.visto}</p>
      </section>

      <section aria-labelledby="dictamen-considerando" className="flex flex-col gap-3">
        <h3 id="dictamen-considerando" className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          Considerando
        </h3>
        <ol className="flex list-decimal flex-col gap-3 pl-5 leading-relaxed marker:font-mono marker:text-muted-foreground">
          {dictamen.considerandos.map((c) => (
            <li key={c} className="text-pretty pl-1">
              {c}
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="dictamen-resuelve"
        className="flex flex-col gap-3 rounded-md border border-border bg-muted/50 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="dictamen-resuelve" className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            Por ello, se dictamina
          </h3>
          <EstadoBadge estado={decision.estado} className="text-sm" />
        </div>
        <p className="text-pretty leading-relaxed">
          <span className="font-semibold">{etiquetaEstado(decision.estado)}.</span> {decision.motivo}
        </p>
      </section>

      <footer className="flex flex-col gap-4 border-t border-border pt-6 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="size-4" aria-hidden="true" />
          <span>
            Registro <span className="font-mono">{decision.id}</span>
          </span>
        </div>
        <p className="break-all font-mono text-xs text-muted-foreground">
          <span className="sr-only">Hash del registro: </span>
          <span aria-hidden="true">hash </span>
          <span title={decision.hash}>{hashCorto(decision.hash)}</span>
        </p>
      </footer>
    </article>
  )
}
