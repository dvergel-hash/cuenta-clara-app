import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioLicitacion } from '@/components/licitaciones/formulario-licitacion'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { getPartidas } from '@/lib/api'
import { exigirRol } from '@/lib/sesion'

export const metadata: Metadata = { title: 'Nueva licitación' }
export const dynamic = 'force-dynamic'

export default async function NuevaLicitacionPage() {
  await exigirRol(['admin'], '/licitaciones/nueva')
  const partidas = await getPartidas()

  return (
    <>
      <PageHeader
        eyebrow="Compras estatales"
        title="Nueva licitación"
        description="Publicá un pedido de cotización desde cero. Queda abierto para recibir ofertas selladas hasta la fecha de cierre."
      >
        <Link href="/agentes" className={buttonVariants({ variant: 'outline' })}>
          Configurar agentes y flujos
        </Link>
      </PageHeader>
      <FormularioLicitacion partidas={partidas} />
    </>
  )
}
