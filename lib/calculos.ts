import { canonico, sha256 } from './sha256'
import type { Cotizacion, CotizacionRegistrada, Decision, Licitacion, Proveedor, SenalAlerta } from './types'

export const GENESIS = '0'.repeat(64)
export const MESES_TRANSCURRIDOS = 9
export const FECHA_CORTE = '2026-09-30'
export const MIN_PUNTOS_REFERENCIA = 3

export function totalCotizacion(c: Pick<Cotizacion, 'items' | 'moneda' | 'tipo_cambio_usado'>) {
  const subtotal = c.items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0)
  return c.moneda === 'USD' ? subtotal * (c.tipo_cambio_usado ?? 1) : subtotal
}

export function mediana(valores: number[]) {
  if (valores.length === 0) return 0
  const orden = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2
}

export type Semaforo = 'verde' | 'amarillo' | 'rojo'

export function semaforoDesvio(desvio: number): Semaforo {
  if (desvio <= 0.1) return 'verde'
  if (desvio <= 0.25) return 'amarillo'
  return 'rojo'
}

export function proyeccionLineal(ejecutado: number) {
  return (ejecutado / MESES_TRANSCURRIDOS) * 12
}

export function hashDecision(d: Omit<Decision, 'hash'> & { hash?: string }) {
  const { hash: _omitido, ...contenido } = d
  return sha256(canonico(contenido))
}

export type ResultadoIntegridad =
  | { integro: true; total: number }
  | {
      integro: false
      total: number
      indice: number
      registro: Decision
      razon: 'contenido' | 'enlace'
    }

/** Monto a partir del cual corresponde licitación pública en lugar de compra directa. */
export const UMBRAL_LICITACION = 15_000_000
export const MIN_RACHA_CONCENTRACION = 4
export const MIN_COMPRAS_FRACCIONAMIENTO = 3
export const TOLERANCIA_ESPEJO = 0.01
export const DIAS_PROVEEDOR_NUEVO = 90
export const VENTANA_FRACCIONAMIENTO_DIAS = 7
/** Una compra está "apenas bajo el umbral" si queda entre este porcentaje del umbral y el umbral. */
export const FRANJA_FRACCIONAMIENTO = 0.8

export const AVISO_SENALES = 'Una señal de alerta no prueba una irregularidad: indica que la compra merece revisión.'

const DIA_MS = 86_400_000

function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(hasta.slice(0, 10)) - Date.parse(desde.slice(0, 10))) / DIA_MS)
}

const pct = (v: number) =>
  `${(v * 100).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
const pesos = (v: number) => `$ ${Math.round(v).toLocaleString('es-AR')}`
const fechaCorta = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')

function enumerar(nombres: string[]) {
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

export interface ContextoSenales {
  licitacion: Licitacion
  /** Ofertas del propio pedido, ya publicadas. */
  cotizaciones: CotizacionRegistrada[]
  licitaciones: Licitacion[]
  decisiones: Decision[]
  proveedores: Proveedor[]
}

/**
 * Detecta patrones que justifican revisar una compra cerrada. Cada regla es independiente
 * y usa solo datos públicos: licitaciones, adjudicaciones, ofertas y fechas de alta de proveedores.
 */
export function detectarSenales(ctx: ContextoSenales): SenalAlerta[] {
  const { licitacion, cotizaciones, licitaciones, decisiones, proveedores } = ctx
  const nombre = (id?: string) => proveedores.find((p) => p.id === id)?.nombre ?? id ?? 'Proveedor'
  const decisionDe = (pedido: string) => decisiones.find((d) => d.pedido_id === pedido)
  const montoAdjudicado = (pedido: string) => {
    const d = decisionDe(pedido)
    return d && d.estado === 'aprobado' ? d.saldo_partida_antes - d.saldo_partida_despues : 0
  }
  const adjudicadasDelRubro = licitaciones
    .filter((l) => l.estado === 'aprobado' && l.proveedor_adjudicado_id && l.rubro && l.rubro === licitacion.rubro)
    .sort((a, b) => a.fecha_cierre.localeCompare(b.fecha_cierre) || a.id.localeCompare(b.id))

  const senales: SenalAlerta[] = []

  const ganador = licitacion.estado === 'aprobado' ? licitacion.proveedor_adjudicado_id : undefined
  if (ganador) {
    const i = adjudicadasDelRubro.findIndex((l) => l.id === licitacion.id)
    if (i >= 0) {
      let inicio = i
      let fin = i
      while (inicio > 0 && adjudicadasDelRubro[inicio - 1].proveedor_adjudicado_id === ganador) inicio--
      while (fin < adjudicadasDelRubro.length - 1 && adjudicadasDelRubro[fin + 1].proveedor_adjudicado_id === ganador) fin++
      const racha = adjudicadasDelRubro.slice(inicio, fin + 1)
      if (racha.length >= MIN_RACHA_CONCENTRACION) {
        senales.push({
          tipo: 'concentracion',
          titulo: 'Concentración de adjudicaciones',
          detalle: `${nombre(ganador)} ganó ${racha.length} compras seguidas del rubro ${licitacion.rubro?.toLowerCase()}, entre el ${fechaCorta(racha[0].fecha_cierre)} y el ${fechaCorta(racha.at(-1)!.fecha_cierre)}.`,
          relacionadas: racha.map((l) => l.id).filter((id) => id !== licitacion.id),
        })
      }
    }
  }

  const ofertas = cotizaciones
    .map((c) => ({ proveedor: c.proveedor_id, total: totalCotizacion(c) }))
    .filter((o) => o.total > 0)
    .sort((a, b) => a.total - b.total)
  let grupoEspejo: typeof ofertas = []
  for (let i = 0; i < ofertas.length; i++) {
    let j = i
    while (j + 1 < ofertas.length && (ofertas[j + 1].total - ofertas[i].total) / ofertas[i].total < TOLERANCIA_ESPEJO) j++
    const grupo = ofertas.slice(i, j + 1)
    if (new Set(grupo.map((o) => o.proveedor)).size >= 2 && grupo.length > grupoEspejo.length) grupoEspejo = grupo
  }
  if (grupoEspejo.length >= 2) {
    const diferencia = (grupoEspejo.at(-1)!.total - grupoEspejo[0].total) / grupoEspejo[0].total
    senales.push({
      tipo: 'espejo',
      titulo: 'Ofertas espejo',
      detalle: `${grupoEspejo.length} ofertas de ${enumerar(grupoEspejo.map((o) => nombre(o.proveedor)))} difieren como máximo un ${pct(diferencia)} entre sí. Precios tan parejos entre competidores independientes son poco habituales.`,
    })
  }

  if (cotizaciones.length === 1) {
    senales.push({
      tipo: 'oferta_unica',
      titulo: 'Oferta única',
      detalle: `Solo se presentó ${nombre(cotizaciones[0].proveedor_id)}. Sin competencia, el precio no se contrasta con otras ofertas.`,
    })
  }

  if (ganador) {
    const enFranja = (monto: number) => monto >= UMBRAL_LICITACION * FRANJA_FRACCIONAMIENTO && monto < UMBRAL_LICITACION
    if (enFranja(montoAdjudicado(licitacion.id))) {
      const grupo = adjudicadasDelRubro.filter(
        (l) =>
          l.proveedor_adjudicado_id === ganador &&
          Math.abs(diasEntre(licitacion.fecha_cierre, l.fecha_cierre)) < VENTANA_FRACCIONAMIENTO_DIAS &&
          enFranja(montoAdjudicado(l.id)),
      )
      const suma = grupo.reduce((acc, l) => acc + montoAdjudicado(l.id), 0)
      if (grupo.length >= MIN_COMPRAS_FRACCIONAMIENTO && suma >= UMBRAL_LICITACION) {
        senales.push({
          tipo: 'fraccionamiento',
          titulo: 'Posible fraccionamiento',
          detalle: `${grupo.length} compras a ${nombre(ganador)} en menos de ${VENTANA_FRACCIONAMIENTO_DIAS} días, cada una apenas bajo el umbral de licitación (${pesos(UMBRAL_LICITACION)}). Juntas suman ${pesos(suma)}.`,
          relacionadas: grupo.map((l) => l.id).filter((id) => id !== licitacion.id),
        })
      }
    }
  }

  const referencia = decisionDe(licitacion.id)?.referencia.valor ?? 0
  for (const c of cotizaciones) {
    const alta = proveedores.find((p) => p.id === c.proveedor_id)?.fecha_alta
    if (!alta) continue
    const dias = diasEntre(alta, c.fecha_emision)
    if (dias < 0 || dias >= DIAS_PROVEEDOR_NUEVO) continue
    const desvio = referencia > 0 ? totalCotizacion(c) / referencia - 1 : null
    const precio = desvio !== null && desvio > 0.1 ? ` Su oferta está ${pct(desvio)} por encima de la referencia.` : ''
    senales.push({
      tipo: 'proveedor_nuevo',
      titulo: 'Proveedor recién inscripto',
      detalle: `${nombre(c.proveedor_id)} inscribió su CUIT el ${fechaCorta(alta)}, ${dias} días antes de ofertar.${precio}`,
    })
  }

  return senales
}

export function verificarCadena(registros: Decision[]): ResultadoIntegridad {
  let previo = GENESIS
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i]
    if (r.hash_prev !== previo) {
      return { integro: false, total: registros.length, indice: i, registro: r, razon: 'enlace' }
    }
    if (hashDecision(r) !== r.hash) {
      return { integro: false, total: registros.length, indice: i, registro: r, razon: 'contenido' }
    }
    previo = r.hash
  }
  return { integro: true, total: registros.length }
}
