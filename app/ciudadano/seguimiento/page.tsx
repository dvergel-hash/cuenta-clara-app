import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { consultarObservacion } from '@/lib/api'
import { formatoFechaHora } from '@/lib/format'
import type { EstadoObservacion } from '@/lib/types'

export const metadata: Metadata = { title: 'Seguimiento de observación' }

const ESTADOS: Record<EstadoObservacion, { etiqueta: string; texto: string; clase: string }> = {
  pendiente: {
    etiqueta: 'Pendiente',
    texto: 'Todavía no fue revisada.',
    clase: 'bg-warn-soft text-warn',
  },
  publicada: {
    etiqueta: 'Publicada',
    texto: 'Fue revisada y ya figura en el detalle de la licitación.',
    clase: 'bg-ok-soft text-ok',
  },
  descartada: {
    etiqueta: 'Descartada',
    texto: 'Fue revisada y no se publicó.',
    clase: 'bg-muted text-muted-foreground',
  },
}

export default async function SeguimientoPage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo: crudo } = await searchParams
  const codigo = crudo?.trim().toUpperCase()
  const resultado = codigo ? await consultarObservacion(codigo) : undefined

  return (
    <>
      <PageHeader
        eyebrow="Ciudadanía"
        title="Seguimiento de observación"
        description="Ingresá el código que recibiste al enviar tu observación."
      />
      <div className="flex max-w-xl flex-col gap-6">
        <form method="get" className="flex flex-col gap-1.5">
          <label htmlFor="codigo" className="text-sm font-medium">
            Código de seguimiento
          </label>
          <div className="flex gap-2">
            <Input
              id="codigo"
              name="codigo"
              defaultValue={codigo}
              placeholder="CC-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
              required
            />
            <Button type="submit">Consultar</Button>
          </div>
        </form>

        {resultado === null && (
          <p role="alert" className="rounded-md bg-danger-soft p-4 text-sm text-danger">
            No encontramos una observación con el código <span className="font-mono">{codigo}</span>.
          </p>
        )}

        {resultado && (
          <section aria-live="polite" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-lg font-semibold">{resultado.codigo}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${ESTADOS[resultado.estado].clase}`}>
                {ESTADOS[resultado.estado].etiqueta}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{ESTADOS[resultado.estado].texto}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Licitación</dt>
              <dd>
                <Link
                  href={`/licitaciones/${resultado.licitacion_id}`}
                  className="font-mono text-primary underline underline-offset-4"
                >
                  {resultado.licitacion_id}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="capitalize">{resultado.categoria}</dd>
              <dt className="text-muted-foreground">Enviada</dt>
              <dd className="font-mono tabular-nums">{formatoFechaHora(resultado.creada)}</dd>
              {resultado.revisada && (
                <>
                  <dt className="text-muted-foreground">Revisada</dt>
                  <dd className="font-mono tabular-nums">{formatoFechaHora(resultado.revisada)}</dd>
                </>
              )}
            </dl>
          </section>
        )}
      </div>
    </>
  )
}
