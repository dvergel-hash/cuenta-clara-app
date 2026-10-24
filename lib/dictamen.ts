import { MIN_PUNTOS_REFERENCIA } from './calculos'
import { formatoMoneda, formatoPorcentaje } from './format'
import type { Decision, LicitacionDetalle } from './types'

export interface Dictamen {
  numero: string
  fecha: string
  visto: string
  considerandos: string[]
  precios: PrecioObtenido[]
  decision: Decision
}

export interface PrecioObtenido {
  id: string
  fuente: string
  tipo: 'Oferta · portal' | 'Oferta · agente' | 'Referencia'
  monto: number
  desvio: number | null
  menor: boolean
}

const dominio = (destino: string | null) => {
  if (!destino?.startsWith('http')) return destino
  return new URL(destino).hostname.replace(/^www\./, '')
}

const listar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`)

/** Redacta el dictamen a partir del registro de decisión y de los datos públicos del pedido. */
export function construirDictamen(detalle: LicitacionDetalle): Dictamen | null {
  const { licitacion, partida, decision, cotizaciones, busquedas, puntos_referencia, referencia_concluyente } = detalle
  if (!decision || !cotizaciones) return null

  const porPortal = cotizaciones.filter((c) => c.origen === 'portal').length
  const porAgente = cotizaciones.length - porPortal
  const contar = (r: string) => busquedas.filter((b) => b.resultado === r).length

  const pl = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

  const considerandos: string[] = [
    `Que ${cotizaciones.length === 1 ? 'se recibió' : 'se recibieron'} ${pl(cotizaciones.length, 'oferta', 'ofertas')}: ${porPortal} a través del portal de proveedores y ${porAgente} ${porAgente === 1 ? 'obtenida' : 'obtenidas'} por agentes de compras.`,
    `Que los agentes realizaron ${pl(busquedas.length, 'búsqueda', 'búsquedas')}: ${pl(contar('cotizacion'), 'derivó en cotización', 'derivaron en cotizaciones')}, ${pl(contar('referencia'), 'aportó precio de referencia', 'aportaron precios de referencia')}, ${pl(contar('descartada'), 'se descartó por no ser comparable', 'se descartaron por no ser comparables')} y ${pl(contar('sin_respuesta'), 'no obtuvo respuesta', 'no obtuvieron respuesta')}.`,
    referencia_concluyente
      ? `Que el precio de referencia se fijó en ${formatoMoneda(decision.referencia.valor)}, calculado como ${decision.referencia.metodo.toLowerCase()} (${puntos_referencia} puntos de comparación).`
      : `Que la referencia no resulta concluyente, al contar con ${puntos_referencia} puntos de comparación frente a un mínimo de ${MIN_PUNTOS_REFERENCIA}.`,
  ]

  const menor = cotizaciones[0]
  if (menor) {
    considerandos.push(
      `Que la oferta de menor monto corresponde a ${menor.proveedor_nombre} por ${formatoMoneda(menor.total_ars)}${
        menor.desvio !== null ? `, con un desvío de ${formatoPorcentaje(menor.desvio)} respecto de la referencia` : ''
      }.`,
    )
  }

  const altas = cotizaciones.filter((c) => c.desvio !== null && c.desvio > 0.25)
  if (altas.length) {
    considerandos.push(
      `Que ${altas.length === 1 ? 'la oferta de' : 'las ofertas de'} ${listar(altas.map((c) => c.proveedor_nombre))} ${
        altas.length === 1 ? 'presenta' : 'presentan'
      } un desvío superior al 25 % respecto de la referencia.`,
    )
  }

  considerandos.push(
    decision.saldo_partida_antes === decision.saldo_partida_despues
      ? `Que la partida ${partida.codigo} (${partida.nombre}) registra un saldo de ${formatoMoneda(decision.saldo_partida_antes)}, que no se ve afectado por esta decisión.`
      : `Que la partida ${partida.codigo} (${partida.nombre}) registraba un saldo de ${formatoMoneda(decision.saldo_partida_antes)}, que pasa a ${formatoMoneda(decision.saldo_partida_despues)} con esta adjudicación.`,
  )

  const valorReferencia = decision.referencia.valor
  const desvioRef = (precio: number) => (valorReferencia ? precio / valorReferencia - 1 : null)
  const urlsFuentes = new Set(decision.referencia.fuentes.map((f) => f.url))
  const precios: PrecioObtenido[] = [
    ...cotizaciones.map((c) => ({
      id: c.id,
      fuente: c.proveedor_nombre,
      tipo: c.origen === 'portal' ? ('Oferta · portal' as const) : ('Oferta · agente' as const),
      monto: c.total_ars,
      desvio: c.desvio,
      menor: c.id === menor?.id,
    })),
    ...decision.referencia.fuentes.map((f) => ({
      id: f.url,
      fuente: dominio(f.url) ?? f.url,
      tipo: 'Referencia' as const,
      monto: f.precio,
      desvio: desvioRef(f.precio),
      menor: false,
    })),
    ...busquedas
      .filter((b) => b.resultado === 'referencia' && b.precio !== undefined && !urlsFuentes.has(b.destino ?? ''))
      .map((b) => ({
        id: b.id,
        fuente: dominio(b.destino) ?? b.agente,
        tipo: 'Referencia' as const,
        monto: b.precio as number,
        desvio: desvioRef(b.precio as number),
        menor: false,
      })),
  ]

  return {
    numero: decision.id.replace('DEC', 'DICT'),
    precios,
    fecha: decision.fecha,
    visto: `El pedido ${licitacion.id}, "${licitacion.descripcion}", imputado a la partida ${partida.codigo}, con un monto estimado de ${formatoMoneda(licitacion.monto_estimado)}.`,
    considerandos,
    decision,
  }
}
