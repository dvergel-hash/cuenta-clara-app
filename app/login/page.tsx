import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioLogin } from '@/components/login/formulario-login'
import { PageHeader } from '@/components/page-header'
import { claveDemo, rutaSegura, sesionActual, USUARIOS_DEMO } from '@/lib/sesion'

export const metadata: Metadata = { title: 'Ingresar' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; sin_permiso?: string }>
}) {
  const { desde, sin_permiso } = await searchParams
  const destino = rutaSegura(desde)
  if ((await sesionActual()) && !sin_permiso) redirect(destino)

  return (
    <>
      <PageHeader
        eyebrow="Acceso"
        title="Ingresar"
        description="Administración, proveedores y ciudadanía tienen accesos distintos. La consulta pública de licitaciones no requiere ingresar."
      />
      {sin_permiso && (
        <p role="alert" className="mb-6 rounded-md bg-warn-soft p-3 text-sm text-warn">
          Tu cuenta actual no tiene permiso para esa sección. Ingresá con otra cuenta.
        </p>
      )}
      <FormularioLogin
        cuentas={USUARIOS_DEMO.map(({ email, nombre, rol }) => ({ email, nombre, rol }))}
        desde={destino}
        clave={claveDemo()}
      />
    </>
  )
}
