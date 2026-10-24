import { ExternalLink } from 'lucide-react'
import { MIN_PUNTOS_REFERENCIA } from '@/lib/calculos'
import { formatoFecha, formatoMoneda } from '@/lib/format'
import type { Referencia } from '@/lib/types'
import { Panel } from './panel'

export function ReferenciaPanel({
  referencia,
  puntos,
  concluyente,
}: {
  referencia: Referencia
  puntos: number
  concluyente: boolean
}) {
  return (
    <Panel titulo="Precio de referencia" id="referencia">
      <div className="flex flex-col gap-1">
        {concluyente ? (
          <p className="font-mono text-2xl font-medium tabular-nums">{formatoMoneda(referencia.valor)}</p>
        ) : (
          <>
            <p className="text-2xl font-semibold text-warn">No concluyente</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hay {puntos} {puntos === 1 ? 'punto' : 'puntos'} de comparación; se requieren al menos{' '}
              {MIN_PUNTOS_REFERENCIA}. No se calcula desvío.
            </p>
          </>
        )}
      </div>

      <dl className="grid gap-1 text-sm">
        <dt className="text-muted-foreground">Método</dt>
        <dd>{referencia.metodo}</dd>
      </dl>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Fuentes web ({referencia.fuentes.length})</h3>
        {referencia.fuentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin fuentes web registradas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {referencia.fuentes.map((f) => (
              <li key={f.url} className="flex flex-col gap-1 px-3 py-2.5">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
                >
                  {f.url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
                <span className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span>Consultada el {formatoFecha(f.fecha)}</span>
                  <span className="font-mono tabular-nums text-foreground">{formatoMoneda(f.precio)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}
