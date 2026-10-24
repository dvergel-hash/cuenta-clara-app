import { AlertTriangle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { AVISO_SENALES } from '@/lib/calculos'
import type { SenalAlerta } from '@/lib/types'

export function SenalesAlerta({ senales }: { senales: SenalAlerta[] | null }) {
  return (
    <section aria-labelledby="titulo-senales" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-senales" className="text-lg font-semibold">
          Señales de alerta
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{AVISO_SENALES}</p>
      </div>

      {senales === null ? (
        <p className="text-sm text-muted-foreground">
          Las señales se calculan cuando se publican las ofertas, después del cierre.
        </p>
      ) : senales.length === 0 ? (
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-ok" aria-hidden="true" />
          No se detectaron señales para esta compra.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {senales.map((s) => (
            <li key={s.tipo} className="flex gap-3 rounded-md bg-warn-soft p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">{s.titulo}</p>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{s.detalle}</p>
                {s.relacionadas && s.relacionadas.length > 0 && (
                  <p className="flex flex-wrap gap-x-2 text-sm">
                    <span className="text-muted-foreground">Relacionadas:</span>
                    {s.relacionadas.map((id) => (
                      <Link
                        key={id}
                        href={`/licitaciones/${id}`}
                        className="font-mono text-primary underline underline-offset-4"
                      >
                        {id}
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
