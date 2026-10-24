import { ArrowLeft, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EstadoBadge } from '@/components/indicadores'
import { CotizacionesTabla } from '@/components/licitacion/cotizaciones-tabla'
import { DecisionPanel } from '@/components/licitacion/decision-panel'
import { ReferenciaPanel } from '@/components/licitacion/referencia-panel'
import { VerificarIntegridad } from '@/components/licitacion/verificar-integridad'
import { getLicitacion } from '@/lib/api'
import { formatoFecha, formatoMoneda } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Pedido ${id}` }
}

export default async function LicitacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detalle = await getLicitacion(id)
  if (!detalle) notFound()

  const { licitacion, partida, decision, cotizaciones, cantidad_ofertas } = detalle

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/licitaciones"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a licitaciones
      </Link>

      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-sm font-medium text-muted-foreground">{licitacion.id}</p>
          <EstadoBadge estado={licitacion.estado} />
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{licitacion.descripcion}</h1>
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Partida</dt>
            <dd>
              <span className="font-mono">{partida.codigo}</span> · {partida.nombre}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Monto estimado</dt>
            <dd className="font-mono tabular-nums">{formatoMoneda(licitacion.monto_estimado)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Cierre</dt>
            <dd className="font-mono tabular-nums">{formatoFecha(licitacion.fecha_cierre)}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="titulo-cotizaciones" className="flex flex-col gap-4">
        <h2 id="titulo-cotizaciones" className="text-lg font-semibold">
          Cotizaciones recibidas
        </h2>
        {cotizaciones === null ? (
          <div className="flex items-start gap-4 rounded-lg border border-dashed border-primary/30 bg-info-soft p-5">
            <Lock className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
                {cantidad_ofertas} {cantidad_ofertas === 1 ? 'oferta recibida' : 'ofertas recibidas'}
              </p>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Las ofertas están selladas hasta el cierre del {formatoFecha(licitacion.fecha_cierre)}. Proveedores,
                montos y referencia se publican al abrirse el sobre.
              </p>
              <Link
                href={`/portal?pedido=${licitacion.id}`}
                className="mt-2 w-fit text-sm font-medium text-primary underline underline-offset-4"
              >
                Cotizar este pedido desde el portal
              </Link>
            </div>
          </div>
        ) : (
          <CotizacionesTabla cotizaciones={cotizaciones} adjudicadoId={licitacion.proveedor_adjudicado_id} />
        )}
      </section>

      {decision && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ReferenciaPanel
            referencia={decision.referencia}
            puntos={detalle.puntos_referencia}
            concluyente={detalle.referencia_concluyente}
          />
          <DecisionPanel decision={decision} />
        </div>
      )}

      <VerificarIntegridad pedidoId={licitacion.id} />
    </div>
  )
}
