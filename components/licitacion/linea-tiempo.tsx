import { Bot, CalendarClock, FileCheck2, Gavel, Inbox } from 'lucide-react'
import { EstadoBadge } from '@/components/indicadores'
import { fechaCierre, formatoFecha, formatoFechaHora, formatoMoneda, hashCorto } from '@/lib/format'
import type { LicitacionDetalle } from '@/lib/types'

type Evento = {
  clave: string
  cuando: Date
  /** Fechas sin hora (cierre, emisión) se muestran sin ella. */
  soloFecha?: boolean
  futuro?: boolean
  icono: typeof Bot
  titulo: React.ReactNode
  detalle?: React.ReactNode
}

const CANAL = { web: 'web', correo: 'correo', catalogo: 'catálogo', mensajeria: 'mensajería' } as const
const RESULTADO = {
  cotizacion: 'obtuvo una cotización',
  referencia: 'registró un precio de referencia',
  descartada: 'descartó un resultado',
  sin_respuesta: 'no obtuvo respuesta',
} as const

/** Arma el historial solo con lo que el sistema registra; no inventa fechas ni responsables. */
export function construirEventos(d: LicitacionDetalle, ahora = new Date()): Evento[] {
  const eventos: Evento[] = []

  for (const b of d.busquedas) {
    eventos.push({
      clave: b.id,
      cuando: new Date(b.fecha),
      icono: Bot,
      titulo: (
        <>
          {b.agente} {RESULTADO[b.resultado]}
        </>
      ),
      detalle: `Canal ${CANAL[b.canal]}${b.precio ? ` · ${formatoMoneda(b.precio)}` : ''}`,
    })
  }

  for (const c of d.cotizaciones ?? []) {
    eventos.push({
      clave: c.id,
      cuando: new Date(`${c.fecha_emision.slice(0, 10)}T12:00:00-03:00`),
      soloFecha: true,
      icono: Inbox,
      titulo: <>Oferta de {c.proveedor_nombre}</>,
      detalle: `Emitida el ${formatoFecha(c.fecha_emision)} · ${formatoMoneda(c.total_ars)} · origen ${c.origen}`,
    })
  }

  const cierre = fechaCierre(d.licitacion.fecha_cierre)
  eventos.push({
    clave: 'cierre',
    cuando: cierre,
    soloFecha: true,
    futuro: cierre.getTime() > ahora.getTime(),
    icono: CalendarClock,
    titulo: cierre.getTime() > ahora.getTime() ? 'Cierre previsto de ofertas' : 'Cierre de ofertas',
    detalle:
      d.cotizaciones === null
        ? `${d.cantidad_ofertas} ${d.cantidad_ofertas === 1 ? 'oferta sellada' : 'ofertas selladas'} hasta esa fecha`
        : undefined,
  })

  if (d.decision) {
    eventos.push({
      clave: d.decision.id,
      cuando: new Date(d.decision.fecha),
      icono: d.decision.estado === 'aprobado' ? FileCheck2 : Gavel,
      titulo: (
        <span className="inline-flex flex-wrap items-center gap-2">
          Decisión registrada <EstadoBadge estado={d.decision.estado} />
        </span>
      ),
      detalle: (
        <>
          <span className="block">{d.decision.motivo}</span>
          <span className="mt-1 block font-mono text-xs">
            Registro {d.decision.id} · hash {hashCorto(d.decision.hash)}
          </span>
        </>
      ),
    })
  }

  return eventos.sort((a, b) => a.cuando.getTime() - b.cuando.getTime())
}

export function LineaTiempo({ detalle }: { detalle: LicitacionDetalle }) {
  const eventos = construirEventos(detalle)

  return (
    <section aria-labelledby="titulo-historial" className="flex flex-col gap-4">
      <h2 id="titulo-historial" className="text-lg font-semibold">
        Historial de la licitación
      </h2>
      <ol className="flex flex-col">
        {eventos.map((e, i) => (
          <li key={e.clave} className="relative flex gap-4 pb-6 last:pb-0">
            {i < eventos.length - 1 && (
              <span aria-hidden="true" className="absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-px bg-border" />
            )}
            <span
              aria-hidden="true"
              className={
                e.futuro
                  ? 'grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-primary/40 bg-card text-primary'
                  : 'grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-primary'
              }
            >
              <e.icono className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-1">
              <p className="text-sm font-medium">{e.titulo}</p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {e.soloFecha ? formatoFecha(e.cuando.toISOString()) : formatoFechaHora(e.cuando)}
                {e.futuro && ' · pendiente'}
              </p>
              {e.detalle && <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{e.detalle}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-muted-foreground">
        El historial muestra qué ocurrió y cuándo. El sistema todavía no registra qué persona ejecutó cada acción.
      </p>
    </section>
  )
}
