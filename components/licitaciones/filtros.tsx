'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { etiquetaEstado } from '@/components/indicadores'
import { selectClass } from '@/components/form-styles'
import type { EstadoLicitacion, Partida } from '@/lib/types'

export function FiltrosLicitaciones({ estados, partidas }: { estados: EstadoLicitacion[]; partidas: Partida[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pendiente, startTransition] = useTransition()

  function actualizar(clave: 'estado' | 'partida', valor: string) {
    const siguiente = new URLSearchParams(params.toString())
    if (valor) siguiente.set(clave, valor)
    else siguiente.delete(clave)
    const query = siguiente.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  return (
    <form
      role="search"
      aria-label="Filtrar licitaciones"
      aria-busy={pendiente}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-estado" className="text-sm font-medium">
          Estado
        </label>
        <select
          id="filtro-estado"
          className={selectClass}
          value={params.get('estado') ?? ''}
          onChange={(e) => actualizar('estado', e.target.value)}
        >
          <option value="">Todos</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {etiquetaEstado(e)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-partida" className="text-sm font-medium">
          Partida
        </label>
        <select
          id="filtro-partida"
          className={`${selectClass} sm:w-72`}
          value={params.get('partida') ?? ''}
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
    </form>
  )
}
