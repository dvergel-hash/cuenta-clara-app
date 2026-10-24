import { fechaCierre } from './format'
import type { EstadoLicitacion, LicitacionResumen } from './types'

export const POR_PAGINA = 10
export const DIAS_POR_VENCER = 7
export const ESTADOS_CON_ALERTA = 'observado,rechazado'

export type ColumnaOrden = 'id' | 'descripcion' | 'monto' | 'partida' | 'estado' | 'cierre'
const COLUMNAS: ColumnaOrden[] = ['id', 'descripcion', 'monto', 'partida', 'estado', 'cierre']

export interface FiltrosListado {
  q: string
  /** Uno o varios estados separados por coma. */
  estado: string
  partida: string
  montoMin: number | null
  montoMax: number | null
  cierreDesde: string
  cierreHasta: string
  /** Solo pedidos abiertos que cierran en los próximos N días. */
  venceEn: number | null
  orden: ColumnaOrden
  dir: 'asc' | 'desc'
  pagina: number
}

export type ParamsCrudos = Record<string, string | string[] | undefined>

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
const entero = (v: string | string[] | undefined) => {
  const n = Number(texto(v).replace(',', '.'))
  return texto(v) !== '' && Number.isFinite(n) && n >= 0 ? n : null
}
const fecha = (v: string | string[] | undefined) => (/^\d{4}-\d{2}-\d{2}$/.test(texto(v)) ? texto(v) : '')

export function leerFiltros(p: ParamsCrudos): FiltrosListado {
  const orden = texto(p.orden) as ColumnaOrden
  const pagina = Math.floor(entero(p.pagina) ?? 1)
  return {
    q: texto(p.q),
    estado: texto(p.estado),
    partida: texto(p.partida),
    montoMin: entero(p.montoMin),
    montoMax: entero(p.montoMax),
    cierreDesde: fecha(p.cierreDesde),
    cierreHasta: fecha(p.cierreHasta),
    venceEn: entero(p.venceEn),
    orden: COLUMNAS.includes(orden) ? orden : 'cierre',
    dir: texto(p.dir) === 'asc' ? 'asc' : 'desc',
    pagina: Math.max(1, pagina),
  }
}

/** Serializa filtros no vacíos a query string; `cambios` pisa valores (undefined/'' los quita). */
export function aQuery(f: FiltrosListado, cambios: Partial<Record<string, string | number | undefined>> = {}) {
  const base: Record<string, string | number | null | undefined> = {
    q: f.q,
    estado: f.estado,
    partida: f.partida,
    montoMin: f.montoMin,
    montoMax: f.montoMax,
    cierreDesde: f.cierreDesde,
    cierreHasta: f.cierreHasta,
    venceEn: f.venceEn,
    orden: f.orden === 'cierre' ? undefined : f.orden,
    dir: f.dir === 'desc' ? undefined : f.dir,
    pagina: f.pagina > 1 ? f.pagina : undefined,
    ...cambios,
  }
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const diasHastaCierre = (cierre: string, ahora: Date) =>
  (fechaCierre(cierre).getTime() - ahora.getTime()) / 86_400_000

export function filtrar(lics: LicitacionResumen[], f: FiltrosListado, ahora = new Date()) {
  const estados = f.estado ? f.estado.split(',') : []
  const q = normalizar(f.q)
  return lics.filter((l) => {
    if (estados.length && !estados.includes(l.estado)) return false
    if (f.partida && l.partida_id !== f.partida) return false
    if (f.montoMin !== null && l.monto_estimado < f.montoMin) return false
    if (f.montoMax !== null && l.monto_estimado > f.montoMax) return false
    if (f.cierreDesde && l.fecha_cierre.slice(0, 10) < f.cierreDesde) return false
    if (f.cierreHasta && l.fecha_cierre.slice(0, 10) > f.cierreHasta) return false
    if (f.venceEn !== null) {
      const d = diasHastaCierre(l.fecha_cierre, ahora)
      if (l.estado !== 'abierto' || d < 0 || d > f.venceEn) return false
    }
    if (q) {
      const pajar = normalizar(
        [l.id, l.descripcion, l.organismo, l.rubro, l.partida.codigo, l.partida.nombre].filter(Boolean).join(' '),
      )
      if (!q.split(/\s+/).every((t) => pajar.includes(t))) return false
    }
    return true
  })
}

const ORDEN_ESTADO: Record<EstadoLicitacion, number> = { abierto: 0, observado: 1, rechazado: 2, aprobado: 3 }

export function ordenar(lics: LicitacionResumen[], orden: ColumnaOrden, dir: 'asc' | 'desc') {
  const clave = (l: LicitacionResumen): string | number => {
    switch (orden) {
      case 'id':
        return l.id
      case 'descripcion':
        return normalizar(l.descripcion)
      case 'monto':
        return l.monto_estimado
      case 'partida':
        return l.partida.codigo
      case 'estado':
        return ORDEN_ESTADO[l.estado]
      case 'cierre':
        return l.fecha_cierre
    }
  }
  const signo = dir === 'asc' ? 1 : -1
  return [...lics].sort((a, b) => {
    const x = clave(a)
    const y = clave(b)
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')
    return c * signo || a.id.localeCompare(b.id)
  })
}

export function paginar<T>(items: T[], pagina: number, porPagina = POR_PAGINA) {
  const paginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(pagina, paginas)
  return { items: items.slice((actual - 1) * porPagina, actual * porPagina), pagina: actual, paginas }
}

export interface ResumenListado {
  abiertas: number
  montoAbierto: number
  porVencer: number
  conAlerta: number
}

export function resumir(lics: LicitacionResumen[], ahora = new Date()): ResumenListado {
  const abiertas = lics.filter((l) => l.estado === 'abierto')
  return {
    abiertas: abiertas.length,
    montoAbierto: abiertas.reduce((s, l) => s + l.monto_estimado, 0),
    porVencer: abiertas.filter((l) => {
      const d = diasHastaCierre(l.fecha_cierre, ahora)
      return d >= 0 && d <= DIAS_POR_VENCER
    }).length,
    conAlerta: lics.filter((l) => l.estado === 'observado' || l.estado === 'rechazado').length,
  }
}

const celda = (v: string | number | undefined) => {
  const s = String(v ?? '')
  // Evita que Excel interprete el contenido como fórmula.
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",;\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

export function aCsv(lics: LicitacionResumen[]) {
  const filas = [
    ['id', 'descripcion', 'organismo', 'rubro', 'partida_codigo', 'partida', 'estado', 'monto_estimado_ars', 'fecha_cierre'],
    ...lics.map((l) => [
      l.id,
      l.descripcion,
      l.organismo,
      l.rubro,
      l.partida.codigo,
      l.partida.nombre,
      l.estado,
      l.monto_estimado,
      l.fecha_cierre.slice(0, 10),
    ]),
  ]
  // BOM para que Excel abra bien los acentos.
  return `﻿${filas.map((f) => f.map(celda).join(',')).join('\r\n')}\r\n`
}

export function hayFiltros(f: FiltrosListado) {
  return Boolean(
    f.q || f.estado || f.partida || f.montoMin !== null || f.montoMax !== null || f.cierreDesde || f.cierreHasta || f.venceEn !== null,
  )
}
