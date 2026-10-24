'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { selectClass } from '@/components/form-styles'
import { Campo } from '@/components/portal/campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { crearLicitacion } from '@/lib/api'
import { formatoMoneda } from '@/lib/format'
import { licitacionSchema } from '@/lib/schemas'
import type { Partida } from '@/lib/types'

type Errores = Partial<Record<string, string>>

const mañana = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

export function FormularioLicitacion({ partidas }: { partidas: Partida[] }) {
  const router = useRouter()
  const [errores, setErrores] = useState<Errores>({})
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [partidaId, setPartidaId] = useState('')
  const partida = partidas.find((p) => p.id === partidaId)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const monto = String(f.get('monto_estimado') ?? '').trim()
    const r = licitacionSchema.safeParse({
      descripcion: f.get('descripcion'),
      partida_id: f.get('partida_id'),
      organismo: f.get('organismo'),
      rubro: f.get('rubro'),
      monto_estimado: monto === '' ? Number.NaN : Number(monto.replace(',', '.')),
      fecha_cierre: f.get('fecha_cierre'),
    })
    if (!r.success) {
      const nuevos: Errores = {}
      for (const issue of r.error.issues) nuevos[String(issue.path[0])] ??= issue.message
      setErrores(nuevos)
      document.getElementById(`lic-${Object.keys(nuevos)[0]}`)?.focus()
      return
    }
    setErrores({})
    setErrorEnvio(null)
    setEnviando(true)
    try {
      const creada = await crearLicitacion(r.data)
      router.push(`/licitaciones/${creada.id}`)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No pudimos crear la licitación')
      setEnviando(false)
    }
  }

  const saldo = partida ? partida.asignado - partida.ejecutado : null

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-2xl flex-col gap-5">
      <Campo
        id="lic-descripcion"
        label="Descripción del pedido"
        hint="Qué se necesita comprar, con cantidades. Es lo que verán los proveedores."
        error={errores.descripcion}
      >
        {(p) => (
          <textarea
            {...p}
            name="descripcion"
            rows={3}
            maxLength={300}
            className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
          />
        )}
      </Campo>

      <Campo
        id="lic-partida_id"
        label="Partida presupuestaria"
        hint={saldo !== null ? `Saldo disponible: ${formatoMoneda(saldo)}` : undefined}
        error={errores.partida_id}
      >
        {(p) => (
          <select
            {...p}
            name="partida_id"
            value={partidaId}
            onChange={(e) => setPartidaId(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Elegí una partida
            </option>
            {partidas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.codigo} · {x.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="lic-organismo" label="Organismo" optional error={errores.organismo}>
          {(p) => <Input {...p} name="organismo" />}
        </Campo>
        <Campo id="lic-rubro" label="Rubro" optional error={errores.rubro}>
          {(p) => <Input {...p} name="rubro" />}
        </Campo>
        <Campo id="lic-monto_estimado" label="Monto estimado (ARS)" error={errores.monto_estimado}>
          {(p) => <Input {...p} name="monto_estimado" inputMode="decimal" placeholder="0" />}
        </Campo>
        <Campo
          id="lic-fecha_cierre"
          label="Fecha de cierre"
          hint="Hasta ese día reciben ofertas selladas."
          error={errores.fecha_cierre}
        >
          {(p) => <Input {...p} name="fecha_cierre" type="date" min={mañana()} />}
        </Campo>
      </div>

      {errorEnvio && (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorEnvio}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="w-fit">
        {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Publicar licitación
      </Button>
    </form>
  )
}
