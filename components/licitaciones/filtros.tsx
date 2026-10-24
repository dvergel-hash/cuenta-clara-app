'use client'

import { Download, Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { etiquetaEstado } from '@/components/indicadores'
import { selectClass } from '@/components/form-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ESTADOS_CON_ALERTA } from '@/lib/listado'
import type { EstadoLicitacion, Partida } from '@/lib/types'

const CLAVES = ['q', 'estado', 'partida', 'montoMin', 'montoMax', 'cierreDesde', 'cierreHasta', 'venceEn'] as const

export function FiltrosLicitaciones({
  estados,
  partidas,
  hayFiltros,
}: {
  estados: EstadoLicitacion[]
  partidas: Partida[]
  hayFiltros: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pendiente, startTransition] = useTransition()
  const [q, setQ] = useState(params.get('q') ?? '')

  function navegar(siguiente: URLSearchParams) {
    siguiente.delete('pagina')
    const query = siguiente.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  function actualizar(clave: (typeof CLAVES)[number], valor: string) {
    const siguiente = new URLSearchParams(params.toString())
    if (valor.trim()) siguiente.set(clave, valor.trim())
    else siguiente.delete(clave)
    navegar(siguiente)
  }

  function limpiar() {
    setQ('')
    const siguiente = new URLSearchParams(params.toString())
    for (const c of CLAVES) siguiente.delete(c)
    navegar(siguiente)
  }

  const exportar = `/licitaciones/exportar${params.toString() ? `?${params.toString()}` : ''}`
  const valor = (c: (typeof CLAVES)[number]) => params.get(c) ?? ''
  const campo = 'flex flex-col gap-1.5'
  const etiqueta = 'text-sm font-medium'

  return (
    <form
      role="search"
      aria-label="Filtrar licitaciones"
      aria-busy={pendiente}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault()
        actualizar('q', q)
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className={`${campo} flex-1`}>
          <label htmlFor="filtro-q" className={etiqueta}>
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="filtro-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => q.trim() !== valor('q') && actualizar('q', q)}
              placeholder="Pedido, descripción, organismo, rubro o partida"
              className="pl-8"
            />
          </div>
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={campo}>
          <label htmlFor="filtro-estado" className={etiqueta}>
            Estado
          </label>
          <select
            id="filtro-estado"
            className={selectClass}
            value={valor('estado')}
            onChange={(e) => actualizar('estado', e.target.value)}
          >
            <option value="">Todos</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {etiquetaEstado(e)}
              </option>
            ))}
            <option value={ESTADOS_CON_ALERTA}>Observados o rechazados</option>
          </select>
        </div>
        <div className={campo}>
          <label htmlFor="filtro-partida" className={etiqueta}>
            Partida
          </label>
          <select
            id="filtro-partida"
            className={selectClass}
            value={valor('partida')}
            onChange={(e) => actualizar('partida', e.target.value)}
          >
            <option value="">Todas</option>
            {partidas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={campo}>
          <label htmlFor="filtro-montoMin" className={etiqueta}>
            Monto desde (ARS)
          </label>
          <Input
            id="filtro-montoMin"
            inputMode="numeric"
            key={valor('montoMin')}
            defaultValue={valor('montoMin')}
            onBlur={(e) => e.target.value.trim() !== valor('montoMin') && actualizar('montoMin', e.target.value)}
          />
        </div>
        <div className={campo}>
          <label htmlFor="filtro-montoMax" className={etiqueta}>
            Monto hasta (ARS)
          </label>
          <Input
            id="filtro-montoMax"
            inputMode="numeric"
            key={valor('montoMax')}
            defaultValue={valor('montoMax')}
            onBlur={(e) => e.target.value.trim() !== valor('montoMax') && actualizar('montoMax', e.target.value)}
          />
        </div>
        <div className={campo}>
          <label htmlFor="filtro-cierreDesde" className={etiqueta}>
            Cierre desde
          </label>
          <Input
            id="filtro-cierreDesde"
            type="date"
            value={valor('cierreDesde')}
            onChange={(e) => actualizar('cierreDesde', e.target.value)}
          />
        </div>
        <div className={campo}>
          <label htmlFor="filtro-cierreHasta" className={etiqueta}>
            Cierre hasta
          </label>
          <Input
            id="filtro-cierreHasta"
            type="date"
            value={valor('cierreHasta')}
            onChange={(e) => actualizar('cierreHasta', e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          {hayFiltros && (
            <Button type="button" variant="outline" onClick={limpiar}>
              <X className="size-4" aria-hidden="true" />
              Limpiar filtros
            </Button>
          )}
          <a
            href={exportar}
            download
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar CSV
          </a>
        </div>
      </div>
    </form>
  )
}
