import type { Metadata } from 'next'
import { ConfiguracionAgentes } from '@/components/agentes/configuracion-agentes'
import { PageHeader } from '@/components/page-header'
import { exigirRol } from '@/lib/sesion'

export const metadata: Metadata = { title: 'Agentes y flujos' }

export default async function AgentesPage() {
  await exigirRol(['admin'], '/agentes')
  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Agentes y flujos"
        description="Qué agentes buscan precios de referencia, con qué consultas, y cómo avanza cada licitación hasta su dictamen."
      />
      <ConfiguracionAgentes />
    </>
  )
}
