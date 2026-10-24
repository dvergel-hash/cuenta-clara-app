import type { BusquedaAgente, CotizacionRegistrada, Decision, Licitacion, Partida, Proveedor } from './types'

/** Lo único que se publica de las ofertas mientras el pedido está abierto. */
export interface OfertasSelladas {
  pedido_id: string
  estado: 'abierto'
  cantidad: number
}

export type RespuestaCotizaciones = CotizacionRegistrada[] | OfertasSelladas

export function esSellada(r: RespuestaCotizaciones): r is OfertasSelladas {
  return !Array.isArray(r)
}

/** Mientras el pedido esté abierto, las búsquedas se publican sin precio, destino ni notas. */
export function ocultarBusqueda({ precio: _p, cotizacion_id: _c, nota: _n, ...b }: BusquedaAgente): BusquedaAgente {
  return { ...b, destino: null }
}

/** Contrato común de las fuentes de datos (base, API HTTP o mock). */
export interface Fuente {
  partidas(): Promise<Partida[]>
  proveedores(): Promise<Proveedor[]>
  licitaciones(): Promise<Licitacion[]>
  cotizaciones(pedidoId: string): Promise<RespuestaCotizaciones>
  busquedas(pedidoId: string): Promise<BusquedaAgente[]>
  decisiones(): Promise<Decision[]>
}
