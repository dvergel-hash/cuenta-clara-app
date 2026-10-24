import { ArrowLeft, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EstadoBadge } from '@/components/indicadores'
import { BusquedasAgentes } from '@/components/licitacion/busquedas-agentes'
import { CotizacionesTabla } from '@/components/licitacion/cotizaciones-tabla'
import { DictamenDocumento } from '@/components/licitacion/dictamen'
import { LineaTiempo } from '@/components/licitacion/linea-tiempo'
import { type Pestana, PestanasLicitacion } from '@/components/licitacion/pestanas'
import { construirDictamen } from '@/lib/dictamen'
import { DecisionPanel } from '@/components/licitacion/decision-panel'
import { ReferenciaPanel } from '@/components/licitacion/referencia-panel'
import { SenalesAlerta } from '@/components/licitacion/senales-alerta'
import { VerificarIntegridad } from '@/components/licitacion/verificar-integridad'
import { CerrarLicitacion } from '@/components/licitacion/cerrar-licitacion'
import { SintesisIA } from '@/components/licitacion/sintesis-ia'
import { getLicitacion } from '@/lib/api'
import { sesionActual } from '@/lib/sesion'
import { fechaCierre, formatoFecha, formatoMoneda } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Pedido ${id}` }
}

const PESTANAS: Pestana[] = ['resumen', 'dictamen', 'busquedas']

export default async function LicitacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  const [detalle, usuario] = await Promise.all([getLicitacion(id), sesionActual()])
  if (!detalle) notFound()

  const { licitacion, partida, decision, cotizaciones, cantidad_ofertas } = detalle
  const dictamen = construirDictamen(detalle)
  const inicial = PESTANAS.find((p) => p === tab) ?? 'resumen'

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/licitaciones"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a licitaciones
      </Link>

      <header className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-sm font-medium text-muted-foreground">{licitacion.id}</p>
          <EstadoBadge estado={licitacion.estado} />
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{licitacion.descripcion}</h1>
        <dl className="grid gap-x-8 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Partida</dt>
            <dd>
              <span className="font-mono">{partida.codigo}</span> · {partida.nombre}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Monto estimado</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums">{formatoMoneda(licitacion.monto_estimado)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Cierre</dt>
            <dd className="font-mono tabular-nums">{formatoFecha(licitacion.fecha_cierre)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Observaciones ciudadanas</dt>
            <dd className="flex items-baseline gap-2">
              <span className="font-mono tabular-nums">
                {detalle.observaciones_publicadas} {detalle.observaciones_publicadas === 1 ? 'publicada' : 'publicadas'}
              </span>
              <Link
                href={`/ciudadano?licitacion=${licitacion.id}`}
                className="text-primary underline underline-offset-4"
              >
                Observar
              </Link>
            </dd>
          </div>
        </dl>
        {usuario?.rol === 'admin' && licitacion.estado === 'abierto' && (
          <CerrarLicitacion
            id={licitacion.id}
            puedeCerrar={Date.now() >= fechaCierre(licitacion.fecha_cierre).getTime()}
            disponibleDesde={formatoFecha(licitacion.fecha_cierre)}
          />
        )}
      </header>

      <PestanasLicitacion
        inicial={inicial}
        cantidadBusquedas={detalle.busquedas.length}
        dictamen={
          dictamen ? (
            <DictamenDocumento dictamen={dictamen} />
          ) : (
            <div className="flex items-start gap-4 rounded-lg border border-dashed border-primary/30 bg-info-soft p-5">
              <Lock className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-pretty leading-relaxed text-muted-foreground">
                El dictamen de evaluación se emite después de la apertura de sobres del{' '}
                {formatoFecha(licitacion.fecha_cierre)}.
              </p>
            </div>
          )
        }
        busquedas={<BusquedasAgentes busquedas={detalle.busquedas} sellado={cotizaciones === null} />}
        resumen={
          <>
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

      {usuario?.rol === 'admin' && licitacion.estado !== 'abierto' && <SintesisIA id={licitacion.id} />}

      <SenalesAlerta senales={detalle.senales} />

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

      <LineaTiempo detalle={detalle} />

      <VerificarIntegridad pedidoId={licitacion.id} />
          </>
        }
      />
    </div>
  )
}
