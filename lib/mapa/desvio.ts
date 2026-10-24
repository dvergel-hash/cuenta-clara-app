import type { LicitacionGeo } from './datos'

export type NivelDesvio = 'critico' | 'advertencia' | 'normal' | 'ahorro'

export const NIVELES: Record<NivelDesvio, { etiqueta: string; rango: string; color: string }> = {
  critico: { etiqueta: 'Crítico', rango: 'más de +25%', color: '#EF4444' },
  advertencia: { etiqueta: 'Advertencia', rango: '+5% a +25%', color: '#F59E0B' },
  normal: { etiqueta: 'Normal', rango: '0% a +5%', color: '#10B981' },
  ahorro: { etiqueta: 'Ahorro', rango: 'menos de 0%', color: '#3B82F6' },
}

export const ORDEN_NIVELES: NivelDesvio[] = ['critico', 'advertencia', 'normal', 'ahorro']

export function desvioPorcentual(l: Pick<LicitacionGeo, 'presupuestoOficial' | 'costoEjecutado'>) {
  return ((l.costoEjecutado - l.presupuestoOficial) / l.presupuestoOficial) * 100
}

export function nivelDesvio(desvio: number): NivelDesvio {
  if (desvio < 0) return 'ahorro'
  if (desvio <= 5) return 'normal'
  if (desvio <= 25) return 'advertencia'
  return 'critico'
}

const formatoMillones = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

export function montoCompacto(monto: number) {
  const abs = Math.abs(monto)
  if (abs >= 1_000_000_000) return `$${formatoMillones.format(monto / 1_000_000_000)} mil M`
  if (abs >= 1_000_000) return `$${formatoMillones.format(monto / 1_000_000)} M`
  return `$${formatoMillones.format(monto)}`
}

export function desvioTexto(desvio: number) {
  const signo = desvio > 0 ? '+' : desvio < 0 ? '−' : ''
  return `${signo}${Math.abs(desvio).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
