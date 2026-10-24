import { canonico, sha256 } from './sha256'
import type { Cotizacion, Decision } from './types'

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
