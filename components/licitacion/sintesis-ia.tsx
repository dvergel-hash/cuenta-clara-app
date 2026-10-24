'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SintesisIA({ id }: { id: string }) {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<{ texto: string; modelo: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generar() {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`/api/licitaciones/${encodeURIComponent(id)}/sintesis`, { method: 'POST' })
      const cuerpo = (await res.json().catch(() => null)) as { texto?: string; modelo?: string; error?: string } | null
      if (!res.ok || !cuerpo?.texto) throw new Error(cuerpo?.error ?? 'No pudimos generar la síntesis')
      setResultado({ texto: cuerpo.texto, modelo: cuerpo.modelo ?? '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos generar la síntesis')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section
      aria-labelledby="titulo-sintesis"
      className="flex flex-col gap-4 rounded-xl border border-border bg-[linear-gradient(120deg,var(--card),var(--cian-soft))] p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-sintesis" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-cian-strong" aria-hidden="true" />
          Síntesis con IA
        </h2>
        <Button type="button" onClick={generar} disabled={cargando}>
          {cargando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {resultado ? 'Volver a generar' : 'Generar síntesis'}
        </Button>
      </div>
      {!resultado && !error && (
        <p className="text-sm text-muted-foreground">
          El agente de síntesis resume las ofertas, el desvío y las señales de alerta de esta licitación.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {resultado && (
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="text-pretty leading-relaxed">{resultado.texto}</p>
          <p className="text-xs text-muted-foreground">
            Generado por IA ({resultado.modelo}) a partir de los datos publicados. Puede contener errores y no
            reemplaza la decisión de la persona responsable.
          </p>
        </div>
      )}
    </section>
  )
}
