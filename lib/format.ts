const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const porcentaje = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

const dolares = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatoMoneda = (v: number) => moneda.format(v)
export const formatoMonedaEn = (v: number, m: 'ARS' | 'USD') => (m === 'USD' ? dolares.format(v) : moneda.format(v))

/** Pedidos sin hora explícita cierran a las 23:59 hora de Argentina. */
export function fechaCierre(iso: string) {
  return new Date(iso.length > 10 ? iso : `${iso}T23:59:00-03:00`)
}

export function formatoFechaHora(fecha: Date | string, conSegundos = false) {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return d.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(conSegundos ? { second: '2-digit' } : {}),
    hour12: false,
  })
}
export const formatoPorcentaje = (v: number) => porcentaje.format(v)
const porcentajeSinSigno = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 })
export const formatoPorcentajeSinSigno = (v: number) => porcentajeSinSigno.format(v)
export const formatoNumero = (v: number) => numero.format(v)

export function formatoFecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

export function formatoCuit(cuit: string) {
  return cuit.length === 11 ? `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}` : cuit
}

export const hashCorto = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`
