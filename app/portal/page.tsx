import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { FormularioCotizacion } from '@/components/portal/formulario-cotizacion'
import { getLicitacionesAbiertas } from '@/lib/api'

export const metadata: Metadata = { title: 'Portal de proveedores' }

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const [{ pedido }, abiertas] = await Promise.all([searchParams, getLicitacionesAbiertas()])
  const pedidoInicial = abiertas.some((l) => l.id === pedido) ? pedido : abiertas[0]?.id

  return (
    <>
      <PageHeader
        eyebrow="Portal de proveedores"
        title="Cotizar un pedido abierto"
        description="Tu oferta queda sellada hasta el cierre del pedido. Al enviarla recibís un comprobante con su hash."
      />
      {abiertas.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          No hay pedidos abiertos en este momento.
        </p>
      ) : (
        <FormularioCotizacion
          pedidos={abiertas.map((l) => ({ id: l.id, descripcion: l.descripcion, cierre: l.fecha_cierre }))}
          pedidoInicial={pedidoInicial ?? ''}
        />
      )}
    </>
  )
}
