'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { selectClass } from '@/components/form-styles'
import { Campo } from '@/components/portal/campo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enviarObservacion } from '@/lib/api'
import { formatoFechaHora } from '@/lib/format'
import { CATEGORIAS_OBSERVACION, observacionSchema } from '@/lib/schemas'
import type { CategoriaObservacion, ConfirmacionObservacion } from '@/lib/types'

const ETIQUETAS: Record<CategoriaObservacion, string> = {
  precio: 'Precio',
  proveedor: 'Proveedor',
  especificaciones: 'Especificaciones',
  plazo: 'Plazo',
  otra: 'Otra',
}

type Errores = Partial<Record<string, string>>

export function FormularioObservacion({
  licitaciones,
  inicial,
}: {
  licitaciones: { id: string; descripcion: string }[]
  inicial: string
}) {
  const [errores, setErrores] = useState<Errores>({})
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState<ConfirmacionObservacion | null>(null)
  const [largo, setLargo] = useState(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const datos = {
      licitacion_id: f.get('licitacion_id'),
      categoria: f.get('categoria') || undefined,
      descripcion: f.get('descripcion'),
      evidencia_url: f.get('evidencia_url'),
      contacto: f.get('contacto'),
      acepta_publicacion: f.get('acepta_publicacion') === 'on',
      sitio_web: f.get('sitio_web') || undefined,
    }
    const r = observacionSchema.safeParse(datos)
    if (!r.success) {
      const nuevos: Errores = {}
      for (const issue of r.error.issues) nuevos[String(issue.path[0])] ??= issue.message
      setErrores(nuevos)
      document.getElementById(`obs-${Object.keys(nuevos)[0]}`)?.focus()
      return
    }
    setErrores({})
    setErrorEnvio(null)
    setEnviando(true)
    try {
      setConfirmacion(await enviarObservacion(r.data))
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No pudimos enviar la observación')
    } finally {
      setEnviando(false)
    }
  }

  if (confirmacion) {
    return (
      <section
        aria-live="polite"
        className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-ok" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Recibimos tu observación</h2>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Código de seguimiento</p>
          <p className="font-mono text-2xl font-semibold tracking-wider">{confirmacion.codigo}</p>
        </div>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Guardalo: es la única forma de consultar el estado. Quedó como <strong>pendiente</strong> desde el{' '}
          {formatoFechaHora(confirmacion.creada)} y se publica solo después de revisarla.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/ciudadano/seguimiento?codigo=${confirmacion.codigo}`} className={buttonVariants()}>
            Consultar estado
          </Link>
          <Button variant="outline" onClick={() => setConfirmacion(null)}>
            Enviar otra
          </Button>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-2xl flex-col gap-5">
      <Campo id="obs-licitacion_id" label="Licitación" error={errores.licitacion_id}>
        {(p) => (
          <select {...p} name="licitacion_id" defaultValue={inicial} className={selectClass}>
            <option value="" disabled>
              Elegí una licitación
            </option>
            {licitaciones.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} · {l.descripcion}
              </option>
            ))}
          </select>
        )}
      </Campo>

      <fieldset className="flex flex-col gap-2" aria-describedby={errores.categoria ? 'obs-categoria-error' : undefined}>
        <legend className="mb-1 text-sm font-medium">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_OBSERVACION.map((c, i) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-info-soft"
            >
              <input
                type="radio"
                name="categoria"
                value={c}
                id={i === 0 ? 'obs-categoria' : undefined}
                className="accent-primary"
              />
              {ETIQUETAS[c]}
            </label>
          ))}
        </div>
        {errores.categoria && (
          <p id="obs-categoria-error" className="text-xs font-medium text-danger">
            {errores.categoria}
          </p>
        )}
      </fieldset>

      <Campo
        id="obs-descripcion"
        label="Descripción"
        hint={`Qué observaste y por qué. Mínimo 30 caracteres (${largo}).`}
        error={errores.descripcion}
      >
        {(p) => (
          <textarea
            {...p}
            name="descripcion"
            rows={5}
            maxLength={2000}
            onChange={(e) => setLargo(e.target.value.trim().length)}
            className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
          />
        )}
      </Campo>

      <Campo id="obs-evidencia_url" label="Enlace de evidencia" optional error={errores.evidencia_url}>
        {(p) => <Input {...p} name="evidencia_url" type="url" inputMode="url" placeholder="https://" />}
      </Campo>

      <Campo
        id="obs-contacto"
        label="Contacto"
        optional
        hint="Podés dejarlo vacío y enviar de forma anónima. Nunca se publica."
        error={errores.contacto}
      >
        {(p) => <Input {...p} name="contacto" autoComplete="email" />}
      </Campo>

      {/* Honeypot: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="obs-sitio_web">Sitio web</label>
        <input id="obs-sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-sm leading-relaxed">
          <input
            id="obs-acepta_publicacion"
            type="checkbox"
            name="acepta_publicacion"
            className="mt-1 size-4 accent-primary"
            aria-invalid={errores.acepta_publicacion ? true : undefined}
            aria-describedby={errores.acepta_publicacion ? 'obs-acepta-error' : undefined}
          />
          Entiendo que la observación será pública después de su revisión (sin mi contacto).
        </label>
        {errores.acepta_publicacion && (
          <p id="obs-acepta-error" className="text-xs font-medium text-danger">
            {errores.acepta_publicacion}
          </p>
        )}
      </div>

      {errorEnvio && (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorEnvio}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="w-fit">
        {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Enviar observación
      </Button>
    </form>
  )
}
