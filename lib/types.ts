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
  /** Fecha de inscripción del CUIT (YYYY-MM-DD). */
  fecha_alta?: string
}

export interface Licitacion {
  id: string
  descripcion: string
  partida_id: string
  estado: EstadoLicitacion
  fecha_cierre: string
  monto_estimado: number
  proveedor_adjudicado_id?: string
  organismo?: string
  rubro?: string
}

export type TipoSenal = 'concentracion' | 'espejo' | 'oferta_unica' | 'fraccionamiento' | 'proveedor_nuevo'

export interface SenalAlerta {
  tipo: TipoSenal
  titulo: string
  detalle: string
  /** Otras licitaciones que forman parte del patrón. */
  relacionadas?: string[]
}

export type CategoriaObservacion = 'precio' | 'proveedor' | 'especificaciones' | 'plazo' | 'otra'
export type EstadoObservacion = 'pendiente' | 'publicada' | 'descartada'

/** Lo que se publica de una observación: nunca el contacto ni el código de seguimiento. */
export interface ObservacionPublica {
  licitacion_id: string
  categoria: CategoriaObservacion
  descripcion: string
  evidencia_url?: string
  creada: string
}

export interface SeguimientoObservacion {
  codigo: string
  licitacion_id: string
  categoria: CategoriaObservacion
  estado: EstadoObservacion
  creada: string
  revisada?: string
}

export interface ConfirmacionObservacion {
  codigo: string
  estado: 'pendiente'
  creada: string
}

export interface LicitacionResumen extends Licitacion {
  partida: Partida
}

export interface CotizacionPublica extends CotizacionRegistrada {
  proveedor_nombre: string
  total_ars: number
  desvio: number | null
}

export type CanalBusqueda = 'web' | 'correo' | 'catalogo' | 'mensajeria'
export type ResultadoBusqueda = 'cotizacion' | 'referencia' | 'descartada' | 'sin_respuesta'

/** Cada consulta que un agente hizo para obtener cotizaciones o precios de referencia. */
export interface BusquedaAgente {
  id: string
  pedido_id: string
  agente: string
  fecha: string
  canal: CanalBusqueda
  consulta: string
  /** URL consultada o contacto del proveedor. Se oculta mientras el pedido esté abierto. */
  destino: string | null
  resultado: ResultadoBusqueda
  precio?: number
  cotizacion_id?: string
  nota?: string
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
  busquedas: BusquedaAgente[]
  /** null mientras el pedido está abierto: las señales se calculan sobre ofertas publicadas. */
  senales: SenalAlerta[] | null
  observaciones_publicadas: number
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

/** Importes por partida, separando estimaciones, ofertas y montos adjudicados. */
export interface DesglosePartida extends Partida {
  /** Pedidos abiertos: suma de montos estimados. Las ofertas siguen selladas. */
  abiertas: number
  estimado_abierto: number
  /** Pedidos ya cerrados: suma de la menor oferta recibida en cada uno. */
  cerradas: number
  ofertado_cerrado: number
  /** Pedidos aprobados: suma del total de la oferta adjudicada. */
  adjudicadas: number
  adjudicado: number
}
