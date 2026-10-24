export type Moneda = 'ARS' | 'USD'
export type Origen = 'portal' | 'agente'
export type EstadoDecision = 'aprobado' | 'observado' | 'rechazado'
export type EstadoLicitacion = 'abierto' | EstadoDecision

export interface ItemCotizacion {
  descripcion: string
  sku_modelo?: string
  cantidad: number
  unidad: string
  precio_unitario: number
}

export interface CondicionesCotizacion {
  iva_incluido: boolean
  plazo_entrega_dias: number
  forma_pago: string
  garantia: string
}

export interface Cotizacion {
  pedido_id: string
  proveedor_id: string
  cuit: string
  fecha_emision: string
  validez_dias: number
  moneda: Moneda
  tipo_cambio_usado?: number
  origen: Origen
  fuente?: string
  adjunto_url?: string
  items: ItemCotizacion[]
  condiciones: CondicionesCotizacion
}

export interface CotizacionRegistrada extends Cotizacion {
  id: string
  hash: string
}

export interface FuenteReferencia {
  url: string
  fecha: string
  precio: number
}

export interface Referencia {
  valor: number
  metodo: string
  fuentes: FuenteReferencia[]
}

export interface Decision {
  id: string
  pedido_id: string
  fecha: string
  estado: EstadoDecision
  motivo: string
  referencia: Referencia
  saldo_partida_antes: number
  saldo_partida_despues: number
  hash_prev: string
  hash: string
}

export interface Partida {
  id: string
  codigo: string
  nombre: string
  asignado: number
  ejecutado: number
}

export interface Proveedor {
  id: string
  nombre: string
  cuit: string
}

export interface Licitacion {
  id: string
  descripcion: string
  partida_id: string
  estado: EstadoLicitacion
  fecha_cierre: string
  monto_estimado: number
  proveedor_adjudicado_id?: string
}

export interface LicitacionResumen extends Licitacion {
  partida: Partida
}

export interface CotizacionPublica extends CotizacionRegistrada {
  proveedor_nombre: string
  total_ars: number
  desvio: number | null
}

export interface LicitacionDetalle {
  licitacion: Licitacion
  partida: Partida
  decision: Decision | null
  cantidad_ofertas: number
  /** null mientras el pedido está abierto (ofertas selladas). */
  cotizaciones: CotizacionPublica[] | null
  puntos_referencia: number
  referencia_concluyente: boolean
}

export interface ProyeccionPartida extends Partida {
  proyeccion: number
  desvio_proyectado: number
}

export interface RankingProveedor extends Proveedor {
  desvio_promedio: number | null
  cotizaciones: number
  observaciones: number
}

export interface ConfirmacionCotizacion {
  id: string
  hash: string
  recibida: string
}
