'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { AlertTriangle, DollarSign, Filter, MapPin, Search, TrendingUp, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { selectClass } from '@/components/form-styles'
import { CATEGORIAS, type LicitacionGeo } from '@/lib/mapa/datos'
import { NIVELES, ORDEN_NIVELES, desvioPorcentual, desvioTexto, montoCompacto, nivelDesvio, type NivelDesvio } from '@/lib/mapa/desvio'
import { cn } from '@/lib/utils'
import { TarjetaLicitacion } from './tarjeta-licitacion'

const MapaLicitaciones = dynamic(() => import('./mapa-licitaciones'), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-muted text-sm text-muted-foreground">Cargando mapa…</div>
  ),
})

function normalizar(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function TableroMapa({ licitaciones }: { licitaciones: LicitacionGeo[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [nivel, setNivel] = useState<NivelDesvio | 'todos'>('todos')
  const [provincia, setProvincia] = useState('todas')
  const [categoria, setCategoria] = useState('todas')
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [solicitudCentrado, setSolicitudCentrado] = useState(0)

  const provincias = useMemo(
    () => [...new Set(licitaciones.map((l) => l.provincia))].sort((a, b) => a.localeCompare(b, 'es')),
    [licitaciones],
  )

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return licitaciones
      .filter((l) => {
        if (nivel !== 'todos' && nivelDesvio(desvioPorcentual(l)) !== nivel) return false
        if (provincia !== 'todas' && l.provincia !== provincia) return false
        if (categoria !== 'todas' && l.categoria !== categoria) return false
        if (!q) return true
        return normalizar(`${l.titulo} ${l.organismo} ${l.provincia} ${l.localidad} ${l.id}`).includes(q)
      })
      .sort((a, b) => desvioPorcentual(b) - desvioPorcentual(a))
  }, [licitaciones, busqueda, nivel, provincia, categoria])

  const kpis = useMemo(() => {
    const desvios = filtradas.map(desvioPorcentual)
    const promedio = desvios.length ? desvios.reduce((a, b) => a + b, 0) / desvios.length : 0
    const sobrecosto = filtradas.reduce((t, l) => t + Math.max(l.costoEjecutado - l.presupuestoOficial, 0), 0)
    const criticas = desvios.filter((d) => nivelDesvio(d) === 'critico').length
    return { total: filtradas.length, promedio, sobrecosto, criticas }
  }, [filtradas])

  const hayFiltros = busqueda || nivel !== 'todos' || provincia !== 'todas' || categoria !== 'todas'

  function centrar(id: string) {
    setSeleccionadaId(id)
    setSolicitudCentrado((n) => n + 1)
  }

  function verDetalle(id: string) {
    setSeleccionadaId(id)
    requestAnimationFrame(() =>
      document.getElementById(`tarjeta-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    )
  }

  function limpiar() {
    setBusqueda('')
    setNivel('todos')
    setProvincia('todas')
    setCategoria('todas')
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border lg:h-[calc(100dvh-10rem)] lg:min-h-[36rem]">
      <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Mapa de desvíos presupuestarios</h1>
        </div>
        <ul aria-label="Referencias de color" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {ORDEN_NIVELES.map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: NIVELES[n].color }} />
              <span className="font-medium text-foreground">{NIVELES[n].etiqueta}</span>
              {NIVELES[n].rango}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section aria-label="Mapa" className="relative z-0 h-[60vh] min-h-80 lg:h-auto lg:w-3/5">
          <MapaLicitaciones
            licitaciones={filtradas}
            seleccionadaId={seleccionadaId}
            solicitudCentrado={solicitudCentrado}
            onVerDetalle={verDetalle}
          />
        </section>

        <aside
          aria-label="Licitaciones mapeadas"
          className="flex min-h-0 flex-col border-t border-border bg-background lg:w-2/5 lg:border-l lg:border-t-0"
        >
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <dl className="grid grid-cols-3 gap-2">
              <Kpi icono={MapPin} etiqueta="Mapeadas" valor={String(kpis.total)} />
              <Kpi
                icono={TrendingUp}
                etiqueta="Desvío prom."
                valor={desvioTexto(kpis.promedio)}
                color={NIVELES[nivelDesvio(kpis.promedio)].color}
              />
              <Kpi icono={DollarSign} etiqueta="Sobrecosto" valor={montoCompacto(kpis.sobrecosto)} />
            </dl>
            {kpis.criticas > 0 && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle aria-hidden="true" className="size-4" style={{ color: NIVELES.critico.color }} />
                <span>
                  <span className="font-medium text-foreground">{kpis.criticas}</span>{' '}
                  {kpis.criticas === 1 ? 'licitación supera' : 'licitaciones superan'} el +25% del presupuesto oficial.
                </span>
              </p>
            )}

            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="busqueda-mapa" className="sr-only">
                Buscar por palabra clave, provincia u organismo
              </label>
              <Input
                id="busqueda-mapa"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar obra, provincia u organismo"
                className="pl-8"
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Filter aria-hidden="true" className="size-3.5" />
                Nivel de desvío
              </legend>
              <div className="flex flex-wrap gap-1.5">
                <Chip activo={nivel === 'todos'} onClick={() => setNivel('todos')}>
                  Todos
                </Chip>
                {ORDEN_NIVELES.map((n) => (
                  <Chip key={n} activo={nivel === n} onClick={() => setNivel(n)} color={NIVELES[n].color}>
                    {NIVELES[n].etiqueta}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Provincia
                <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className={selectClass}>
                  <option value="todas">Todas</option>
                  {provincias.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Categoría
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={selectClass}>
                  <option value="todas">Todas</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            <p aria-live="polite">
              {filtradas.length} de {licitaciones.length} · ordenadas por desvío
            </p>
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiar}>
                <X aria-hidden="true" />
                Limpiar
              </Button>
            )}
          </div>

          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {filtradas.map((l) => (
              <li key={l.id}>
                <TarjetaLicitacion licitacion={l} activa={l.id === seleccionadaId} onCentrar={() => centrar(l.id)} />
              </li>
            ))}
            {filtradas.length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Ninguna licitación coincide con los filtros.
              </li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  )
}

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  color,
}: {
  icono: typeof MapPin
  etiqueta: string
  valor: string
  color?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icono aria-hidden="true" className="size-3.5" style={color ? { color } : undefined} />
        {etiqueta}
      </dt>
      <dd className="truncate font-mono text-base font-medium">{valor}</dd>
    </div>
  )
}

function Chip({
  activo,
  onClick,
  color,
  children,
}: {
  activo: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        activo
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted',
      )}
    >
      {color && <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  )
}
