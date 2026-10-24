import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioObservacion } from '@/components/ciudadano/formulario-observacion'
import { PageHeader } from '@/components/page-header'
import { getLicitaciones } from '@/lib/api'

export const metadata: Metadata = { title: 'Observar una licitación' }

export default async function CiudadanoPage({ searchParams }: { searchParams: Promise<{ licitacion?: string }> }) {
  const [{ licitacion }, licitaciones] = await Promise.all([searchParams, getLicitaciones()])
  const inicial = licitaciones.some((l) => l.id === licitacion) ? licitacion : ''

  return (
    <>
      <PageHeader
        eyebrow="Ciudadanía"
        title="Observar una licitación"
        description="Si algo de una compra te llama la atención, contalo. Cada observación se revisa antes de publicarse y no hace falta identificarse."
      >
        <Link
          href="/ciudadano/seguimiento"
          className="w-fit text-sm font-medium text-primary underline underline-offset-4"
        >
          Ya tengo un código de seguimiento
        </Link>
      </PageHeader>
      <FormularioObservacion
        licitaciones={licitaciones.map((l) => ({ id: l.id, descripcion: l.descripcion }))}
        inicial={inicial ?? ''}
      />
    </>
  )
}
