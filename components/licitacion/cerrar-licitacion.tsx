'use client'

import { Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function CerrarLicitacion({
  id,
  puedeCerrar,
  disponibleDesde,
}: {
  id: string
  puedeCerrar: boolean
  /** Fecha legible desde la que se puede cerrar (cuando todavía no se puede). */
  disponibleDesde: string
}) {
  const router = useRouter()
  const dialogo = useRef<HTMLDialogElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/licitaciones/${encodeURIComponent(id)}/cerrar`, { method: 'POST' })
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(cuerpo?.error ?? 'No pudimos cerrar la licitación')
      dialogo.current?.close()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cerrar la licitación')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!puedeCerrar} onClick={() => dialogo.current?.showModal()}>
          <Lock className="size-4" aria-hidden="true" />
          Cerrar y emitir dictamen
        </Button>
        <p className="text-sm text-muted-foreground">
          {puedeCerrar
            ? 'Abre las ofertas selladas y registra la decisión.'
            : `Las ofertas siguen selladas: se podrá cerrar a partir del ${disponibleDesde}.`}
        </p>
      </div>

      <dialog
        ref={dialogo}
        aria-labelledby="cerrar-titulo"
        className="m-auto w-[min(92vw,28rem)] rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/40"
        onClose={() => setError(null)}
      >
        <h2 id="cerrar-titulo" className="text-lg font-semibold">
          ¿Cerrar la licitación {id}?
        </h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Se abren las ofertas y se emite la decisión. Queda registrada en la cadena con su hash y{' '}
          <strong className="text-foreground">no se puede deshacer</strong>.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={enviando} onClick={() => dialogo.current?.close()}>
            Cancelar
          </Button>
          <Button type="button" disabled={enviando} onClick={confirmar}>
            {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Cerrar y emitir dictamen
          </Button>
        </div>
      </dialog>
    </div>
  )
}
