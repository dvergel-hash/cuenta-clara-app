import { MIN_PUNTOS_REFERENCIA, proyeccionLineal, totalCotizacion } from './calculos'
import * as mock from './mock'
import { canonico, sha256 } from './sha256'
import type {
  ConfirmacionCotizacion,
  Cotizacion,
  CotizacionRegistrada,
  Decision,
  EstadoLicitacion,
  Licitacion,
  LicitacionDetalle,
  LicitacionResumen,
  Partida,
  ProyeccionPartida,
  Proveedor,
  RankingProveedor,
} from './types'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '')

/** true cuando no hay API configurada y se usan los datos sintéticos. */
export const modoDemo = API_BASE === ''

async function obtener<T>(ruta: string): Promise<T> {
  const res = await fetch(`${API_BASE}${ruta}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${ruta}`)
  return res.json() as Promise<T>
}

const fuente = {
  partidas: () => (modoDemo ? Promise.resolve(mock.partidas) : obtener<Partida[]>('/partidas')),
  proveedores: () => (modoDemo ? Promise.resolve(mock.proveedores) : obtener<Proveedor[]>('/proveedores')),
  licitaciones: () => (modoDemo ? Promise.resolve(mock.licitaciones) : obtener<Licitacion[]>('/licitaciones')),
  cotizaciones: (pedidoId?: string) =>
    modoDemo
      ? Promise.resolve(pedidoId ? mock.cotizaciones.filter((c) => c.pedido_id === pedidoId) : mock.cotizaciones)
      : obtener<CotizacionRegistrada[]>(
          pedidoId ? `/cotizaciones?pedido_id=${encodeURIComponent(pedidoId)}` : '/cotizaciones',
        ),
  decisiones: (variante: 'original' | 'alterado' = 'original') =>
    modoDemo
      ? Promise.resolve(variante === 'alterado' ? mock.registroAlterado : mock.registro)
      : obtener<Decision[]>('/decisiones'),
}

export const ESTADOS: EstadoLicitacion[] = ['abierto', 'aprobado', 'observado', 'rechazado']

export async function getPartidas(): Promise<Partida[]> {
  return fuente.partidas()
}

export async function getLicitaciones(filtros: { estado?: string; partida?: string } = {}): Promise<LicitacionResumen[]> {
  const [lics, parts] = await Promise.all([fuente.licitaciones(), fuente.partidas()])
  return lics
    .filter((l) => !filtros.estado || l.estado === filtros.estado)
    .filter((l) => !filtros.partida || l.partida_id === filtros.partida)
    .map((l) => ({ ...l, partida: parts.find((p) => p.id === l.partida_id)! }))
    .sort((a, b) => b.fecha_cierre.localeCompare(a.fecha_cierre))
}

export async function getLicitacionesAbiertas(): Promise<LicitacionResumen[]> {
  return getLicitaciones({ estado: 'abierto' })
}

export async function getLicitacion(id: string): Promise<LicitacionDetalle | null> {
  const [lics, parts, provs, cots, decs] = await Promise.all([
    fuente.licitaciones(),
    fuente.partidas(),
    fuente.proveedores(),
    fuente.cotizaciones(id),
    fuente.decisiones(),
  ])
  const licitacion = lics.find((l) => l.id === id)
  if (!licitacion) return null
  const partida = parts.find((p) => p.id === licitacion.partida_id)!
  const propias = cots.filter((c) => c.pedido_id === id)

  // Ofertas selladas: los montos nunca salen de esta capa mientras el pedido esté abierto.
  if (licitacion.estado === 'abierto') {
    return {
      licitacion,
      partida,
      decision: null,
      cantidad_ofertas: propias.length,
      cotizaciones: null,
      puntos_referencia: 0,
      referencia_concluyente: false,
    }
  }

  const decision = decs.find((d) => d.pedido_id === id) ?? null
  const puntos = propias.length + (decision?.referencia.fuentes.length ?? 0)
  const concluyente = decision !== null && puntos >= MIN_PUNTOS_REFERENCIA
  const referencia = decision?.referencia.valor ?? 0

  return {
    licitacion,
    partida,
    decision,
    cantidad_ofertas: propias.length,
    cotizaciones: propias
      .map((c) => {
        const total = totalCotizacion(c)
        return {
          ...c,
          proveedor_nombre: provs.find((p) => p.id === c.proveedor_id)?.nombre ?? c.proveedor_id,
          total_ars: total,
          desvio: concluyente && referencia > 0 ? (total - referencia) / referencia : null,
        }
      })
      .sort((a, b) => a.total_ars - b.total_ars),
    puntos_referencia: puntos,
    referencia_concluyente: concluyente,
  }
}

export async function getProyeccionPresupuesto(): Promise<ProyeccionPartida[]> {
  const parts = await fuente.partidas()
  return parts.map((p) => {
    const proyeccion = proyeccionLineal(p.ejecutado)
    return { ...p, proyeccion, desvio_proyectado: (proyeccion - p.asignado) / p.asignado }
  })
}

export async function getRankingProveedores(): Promise<RankingProveedor[]> {
  const proveedores = await fuente.proveedores()
  const lics = await fuente.licitaciones()
  const cerradas = lics.filter((l) => l.estado !== 'abierto')
  const detalles = await Promise.all(cerradas.map((l) => getLicitacion(l.id)))
  const cotizaciones = detalles.flatMap((d) => d?.cotizaciones ?? [])

  return proveedores
    .map((p) => {
      const propias = cotizaciones.filter((c) => c.proveedor_id === p.id)
      const conDesvio = propias.filter((c) => c.desvio !== null).map((c) => c.desvio as number)
      return {
        ...p,
        cotizaciones: propias.length,
        desvio_promedio: conDesvio.length ? conDesvio.reduce((a, b) => a + b, 0) / conDesvio.length : null,
        observaciones: conDesvio.filter((d) => d > 0.25).length,
      }
    })
    .sort((a, b) => (b.desvio_promedio ?? -Infinity) - (a.desvio_promedio ?? -Infinity))
}

export async function getRegistro(variante: 'original' | 'alterado' = 'original'): Promise<Decision[]> {
  const registros = await fuente.decisiones(variante)
  return [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export async function enviarCotizacion(cotizacion: Cotizacion): Promise<ConfirmacionCotizacion> {
  const datos: Cotizacion = { ...cotizacion, origen: 'portal' }

  if (modoDemo) {
    await new Promise((r) => setTimeout(r, 700))
    const hash = sha256(canonico(datos))
    return { id: `COT-${hash.slice(0, 8).toUpperCase()}`, hash, recibida: new Date().toISOString() }
  }

  const res = await fetch(`${API_BASE}/cotizaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
  const respuesta = (await res.json()) as Partial<ConfirmacionCotizacion>
  return {
    id: respuesta.id ?? 'sin-id',
    hash: respuesta.hash ?? sha256(canonico(datos)),
    recibida: respuesta.recibida ?? new Date().toISOString(),
  }
}
