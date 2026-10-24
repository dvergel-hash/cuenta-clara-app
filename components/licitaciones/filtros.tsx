'use client'

import { ChevronDown, Download, Search, SlidersHorizontal, X } from 'lucide-react'
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
  const [mas, setMas] = useState(
    ['montoMin', 'montoMax', 'cierreDesde', 'cierreHasta'].some((c) => params.get(c)),
  )

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
  const avanzados = (["montoMin", "montoMax", "cierreDesde", "cierreHasta"] as const).filter((c) => valor(c)).length
  const campo = 'flex flex-col gap-1.5'
  const etiqueta = 'text-xs font-medium text-muted-foreground'

  return (
    <form
      role="search"
      aria-label="Filtrar licitaciones"
      aria-busy={pendiente}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault()
        actualizar('q', q)
      }}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="filtro-q" className="sr-only">
            Buscar
          </label>
          <span id="filtro-q-ayuda" className="sr-only">
            Busca en pedido, descripción, organismo, rubro y partida
          </span>
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="filtro-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q.trim() !== valor('q') && actualizar('q', q)}
            placeholder="Buscar licitación" aria-describedby="filtro-q-ayuda"
            className="h-10 pl-9"
          />
        </div>
        <label htmlFor="filtro-estado" className="sr-only">
          Estado
        </label>
        <select
          id="filtro-estado"
          className={`${selectClass} h-10 lg:w-48`}
          value={valor('estado')}
          onChange={(e) => actualizar('estado', e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {etiquetaEstado(e)}
            </option>
          ))}
          <option value={ESTADOS_CON_ALERTA}>Observados o rechazados</option>
        </select>
        <label htmlFor="filtro-partida" className="sr-only">
          Partida
        </label>
        <select
          id="filtro-partida"
          className={`${selectClass} h-10 lg:w-56`}
          value={valor('partida')}
          onChange={(e) => actualizar('partida', e.target.value)}
        >
          <option value="">Todas las partidas</option>
          {partidas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMas((m) => !m)}
            aria-expanded={mas}
            aria-controls="filtros-avanzados"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Más filtros
            {avanzados > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                {avanzados}
              </span>
            )}
            <ChevronDown className={`size-4 transition-transform ${mas ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <a
            href={exportar}
            download
            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sr-only sm:hidden">Exportar CSV</span>
          </a>
        </div>
      </div>

      {mas && (
        <div id="filtros-avanzados" className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      )}

      {hayFiltros && (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
            <X className="size-4" aria-hidden="true" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </form>
  )
}
