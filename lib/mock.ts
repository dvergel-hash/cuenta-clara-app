import { GENESIS, hashDecision, mediana, totalCotizacion } from './calculos'
import { canonico, sha256 } from './sha256'
import type {
  BusquedaAgente,
  CanalBusqueda,
  CondicionesCotizacion,
  Cotizacion,
  CotizacionRegistrada,
  Decision,
  EstadoDecision,
  FuenteReferencia,
  Licitacion,
  Partida,
  Proveedor,
} from './types'

const M = 1_000_000

export const partidas: Partida[] = [
  { id: 'PT-211', codigo: '2.1.1', nombre: 'Alimentos para personas', asignado: 180 * M, ejecutado: 133 * M },
  { id: 'PT-221', codigo: '2.2.1', nombre: 'Prendas de vestir y uniformes', asignado: 42 * M, ejecutado: 30.5 * M },
  { id: 'PT-231', codigo: '2.3.1', nombre: 'Papel de escritorio y cartón', asignado: 36 * M, ejecutado: 26.1 * M },
  { id: 'PT-256', codigo: '2.5.6', nombre: 'Combustibles y lubricantes', asignado: 95 * M, ejecutado: 89 * M },
  { id: 'PT-291', codigo: '2.9.1', nombre: 'Elementos de limpieza', asignado: 24 * M, ejecutado: 17.6 * M },
  { id: 'PT-292', codigo: '2.9.2', nombre: 'Útiles de escritorio, oficina y enseñanza', asignado: 28 * M, ejecutado: 20.2 * M },
  { id: 'PT-296', codigo: '2.9.6', nombre: 'Repuestos y accesorios', asignado: 30 * M, ejecutado: 22.8 * M },
  { id: 'PT-311', codigo: '3.1.1', nombre: 'Energía eléctrica', asignado: 150 * M, ejecutado: 113 * M },
  { id: 'PT-331', codigo: '3.3.1', nombre: 'Mantenimiento y reparación de edificios', asignado: 120 * M, ejecutado: 91 * M },
  { id: 'PT-333', codigo: '3.3.3', nombre: 'Mantenimiento de maquinaria y equipo', asignado: 64 * M, ejecutado: 47 * M },
  { id: 'PT-346', codigo: '3.4.6', nombre: 'Servicios de informática', asignado: 70 * M, ejecutado: 52 * M },
  { id: 'PT-351', codigo: '3.5.1', nombre: 'Transporte', asignado: 38 * M, ejecutado: 28.9 * M },
  { id: 'PT-353', codigo: '3.5.3', nombre: 'Imprenta, publicaciones y reproducciones', asignado: 18 * M, ejecutado: 13.2 * M },
  { id: 'PT-392', codigo: '3.9.2', nombre: 'Servicios de vigilancia', asignado: 160 * M, ejecutado: 121 * M },
  { id: 'PT-436', codigo: '4.3.6', nombre: 'Equipo de computación', asignado: 210 * M, ejecutado: 102 * M },
]

export const proveedores: Proveedor[] = [
  { id: 'PRV-01', nombre: 'Papelera Andina S.A.', cuit: '30712345671' },
  { id: 'PRV-02', nombre: 'Distribuidora Centro SRL', cuit: '30709876542' },
  { id: 'PRV-03', nombre: 'Insumos del Litoral SRL', cuit: '30715558883' },
  { id: 'PRV-04', nombre: 'Oficina Total S.A.', cuit: '30701122334' },
  { id: 'PRV-05', nombre: 'Tecnored Soluciones S.A.', cuit: '30716677885' },
  { id: 'PRV-06', nombre: 'Servicios Integrales Patagonia SRL', cuit: '30704433226' },
  { id: 'PRV-07', nombre: 'Limpieza Norte Coop. Ltda.', cuit: '30708899117' },
  { id: 'PRV-08', nombre: 'Combustibles del Sur S.A.', cuit: '30702244668' },
]

export const licitaciones: Licitacion[] = [
  {
    id: 'PED-2026-0147',
    descripcion: 'Notebooks 14" para escuelas técnicas (120 unidades)',
    partida_id: 'PT-436',
    estado: 'abierto',
    fecha_cierre: '2026-11-05',
    monto_estimado: 132 * M,
  },
  {
    id: 'PED-2026-0126',
    descripcion: 'Gasoil grado 2 para flota oficial (8.000 litros)',
    partida_id: 'PT-256',
    estado: 'rechazado',
    fecha_cierre: '2026-09-28',
    monto_estimado: 13.5 * M,
  },
  {
    id: 'PED-2026-0132',
    descripcion: 'Tóner para impresoras láser (150 unidades)',
    partida_id: 'PT-296',
    estado: 'observado',
    fecha_cierre: '2026-09-10',
    monto_estimado: 7.5 * M,
  },
  {
    id: 'PED-2026-0121',
    descripcion: 'Resmas de papel A4 75 g (2.000 resmas)',
    partida_id: 'PT-231',
    estado: 'aprobado',
    fecha_cierre: '2026-08-14',
    monto_estimado: 16 * M,
    proveedor_adjudicado_id: 'PRV-01',
  },
  {
    id: 'PED-2026-0118',
    descripcion: 'Mantenimiento preventivo de ascensores (12 meses)',
    partida_id: 'PT-333',
    estado: 'aprobado',
    fecha_cierre: '2026-07-30',
    monto_estimado: 18 * M,
    proveedor_adjudicado_id: 'PRV-06',
  },
  {
    id: 'PED-2026-0109',
    descripcion: 'Insumos de limpieza para edificios centrales (trimestre)',
    partida_id: 'PT-291',
    estado: 'aprobado',
    fecha_cierre: '2026-06-18',
    monto_estimado: 1.5 * M,
    proveedor_adjudicado_id: 'PRV-07',
  },
]

const condiciones = (
  plazo: number,
  extra: Partial<CondicionesCotizacion> = {},
): CondicionesCotizacion => ({
  iva_incluido: true,
  plazo_entrega_dias: plazo,
  forma_pago: 'Transferencia a 30 días de la factura',
  garantia: '12 meses',
  ...extra,
})

function cotizacion(
  id: string,
  pedido_id: string,
  proveedor_id: string,
  datos: Omit<Cotizacion, 'pedido_id' | 'proveedor_id' | 'cuit'>,
): CotizacionRegistrada {
  const proveedor = proveedores.find((p) => p.id === proveedor_id)
  if (!proveedor) throw new Error(`Proveedor inexistente: ${proveedor_id}`)
  const c: Cotizacion = { pedido_id, proveedor_id, cuit: proveedor.cuit, ...datos }
  return { ...c, id, hash: sha256(canonico(c)) }
}

const item = (descripcion: string, cantidad: number, unidad: string, precio_unitario: number, sku_modelo?: string) => ({
  descripcion,
  sku_modelo,
  cantidad,
  unidad,
  precio_unitario,
})

export const cotizaciones: CotizacionRegistrada[] = [
  // PED-2026-0147 (abierto, ofertas selladas)
  cotizacion('COT-0147-01', 'PED-2026-0147', 'PRV-05', {
    fecha_emision: '2026-10-20', validez_dias: 30, moneda: 'USD', tipo_cambio_usado: 1250, origen: 'portal',
    items: [item('Notebook 14" i5, 16 GB RAM, 512 GB SSD', 120, 'unidad', 890, 'TN-NB14-I5')],
    condiciones: condiciones(45, { garantia: '24 meses on-site' }),
  }),
  cotizacion('COT-0147-02', 'PED-2026-0147', 'PRV-04', {
    fecha_emision: '2026-10-21', validez_dias: 15, moneda: 'ARS', origen: 'agente', fuente: 'Correo electrónico al agente de compras',
    items: [item('Notebook 14" Ryzen 5, 16 GB RAM, 512 GB SSD', 120, 'unidad', 1_080_000, 'OT-R5-14')],
    condiciones: condiciones(30),
  }),
  cotizacion('COT-0147-03', 'PED-2026-0147', 'PRV-03', {
    fecha_emision: '2026-10-22', validez_dias: 10, moneda: 'ARS', origen: 'portal',
    items: [item('Notebook 14" i5, 16 GB RAM, 512 GB SSD', 120, 'unidad', 1_450_000)],
    condiciones: condiciones(60),
  }),
  cotizacion('COT-0147-04', 'PED-2026-0147', 'PRV-02', {
    fecha_emision: '2026-10-23', validez_dias: 20, moneda: 'ARS', origen: 'portal',
    items: [item('Notebook 14" i5, 8+8 GB RAM, 512 GB SSD', 120, 'unidad', 1_120_000)],
    condiciones: condiciones(40),
  }),

  // PED-2026-0126 (rechazado)
  cotizacion('COT-0126-01', 'PED-2026-0126', 'PRV-08', {
    fecha_emision: '2026-09-24', validez_dias: 7, moneda: 'ARS', origen: 'portal',
    items: [item('Gasoil grado 2, entrega en tanque propio', 8000, 'litro', 1720)],
    condiciones: condiciones(5, { garantia: 'No aplica', forma_pago: 'Contado contra entrega' }),
  }),

  // PED-2026-0132 (observado)
  cotizacion('COT-0132-01', 'PED-2026-0132', 'PRV-03', {
    fecha_emision: '2026-09-05', validez_dias: 15, moneda: 'ARS', origen: 'portal',
    items: [item('Tóner compatible 26A', 150, 'unidad', 65_000, 'CF226A-C')],
    condiciones: condiciones(10, { garantia: '6 meses' }),
  }),
  cotizacion('COT-0132-02', 'PED-2026-0132', 'PRV-04', {
    fecha_emision: '2026-09-06', validez_dias: 10, moneda: 'ARS', origen: 'agente', fuente: 'Lista de precios publicada por el proveedor',
    items: [item('Tóner compatible 26A', 150, 'unidad', 49_500, 'CF226A-C')],
    condiciones: condiciones(7, { iva_incluido: false, garantia: '6 meses' }),
  }),

  // PED-2026-0121 (aprobado, ofertas por portal y por agente)
  cotizacion('COT-0121-01', 'PED-2026-0121', 'PRV-01', {
    fecha_emision: '2026-08-08', validez_dias: 30, moneda: 'ARS', origen: 'portal',
    items: [item('Resma A4 75 g, 500 hojas', 2000, 'resma', 7650, 'PA-A4-75')],
    condiciones: condiciones(7, { garantia: 'Reposición por fallas de fabricación' }),
  }),
  cotizacion('COT-0121-02', 'PED-2026-0121', 'PRV-02', {
    fecha_emision: '2026-08-09', validez_dias: 15, moneda: 'ARS', origen: 'agente', fuente: 'Correo electrónico al agente de compras',
    items: [item('Resma A4 75 g, 500 hojas', 2000, 'resma', 7900)],
    condiciones: condiciones(10, { garantia: 'Reposición por fallas de fabricación' }),
  }),
  cotizacion('COT-0121-03', 'PED-2026-0121', 'PRV-03', {
    fecha_emision: '2026-08-10', validez_dias: 10, moneda: 'ARS', origen: 'portal',
    items: [item('Resma A4 75 g, 500 hojas', 2000, 'resma', 10_400)],
    condiciones: condiciones(15, { garantia: 'Sin garantía' }),
  }),
  cotizacion('COT-0121-04', 'PED-2026-0121', 'PRV-04', {
    fecha_emision: '2026-08-11', validez_dias: 20, moneda: 'ARS', origen: 'agente', fuente: 'Catálogo web del proveedor',
    items: [item('Resma A4 75 g, 500 hojas', 2000, 'resma', 8300, 'OT-RES-A4')],
    condiciones: condiciones(5, { garantia: 'Reposición por fallas de fabricación' }),
  }),

  // PED-2026-0118 (aprobado)
  cotizacion('COT-0118-01', 'PED-2026-0118', 'PRV-06', {
    fecha_emision: '2026-07-22', validez_dias: 30, moneda: 'ARS', origen: 'portal',
    items: [item('Mantenimiento preventivo mensual, 6 ascensores', 12, 'mes', 1_450_000)],
    condiciones: condiciones(0, { forma_pago: 'Mensual, a 15 días de la factura', garantia: 'Repuestos: 6 meses' }),
  }),
  cotizacion('COT-0118-02', 'PED-2026-0118', 'PRV-03', {
    fecha_emision: '2026-07-25', validez_dias: 15, moneda: 'ARS', origen: 'portal',
    items: [item('Mantenimiento preventivo mensual, 6 ascensores', 12, 'mes', 1_950_000)],
    condiciones: condiciones(0, { forma_pago: 'Mensual, por adelantado', garantia: 'Repuestos: 3 meses' }),
  }),

  // PED-2026-0109 (aprobado)
  cotizacion('COT-0109-01', 'PED-2026-0109', 'PRV-07', {
    fecha_emision: '2026-06-12', validez_dias: 20, moneda: 'ARS', origen: 'portal',
    items: [
      item('Lavandina concentrada', 600, 'litro', 1150),
      item('Detergente neutro', 400, 'litro', 1900),
    ],
    condiciones: condiciones(5, { garantia: 'No aplica' }),
  }),
  cotizacion('COT-0109-02', 'PED-2026-0109', 'PRV-03', {
    fecha_emision: '2026-06-13', validez_dias: 10, moneda: 'ARS', origen: 'agente', fuente: 'Presupuesto enviado por WhatsApp al agente',
    items: [
      item('Lavandina concentrada', 600, 'litro', 1550),
      item('Detergente neutro', 400, 'litro', 2550),
    ],
    condiciones: condiciones(10, { garantia: 'No aplica' }),
  }),
  cotizacion('COT-0109-03', 'PED-2026-0109', 'PRV-02', {
    fecha_emision: '2026-06-14', validez_dias: 15, moneda: 'ARS', origen: 'portal',
    items: [
      item('Lavandina concentrada', 600, 'litro', 1200),
      item('Detergente neutro', 400, 'litro', 1950),
    ],
    condiciones: condiciones(7, { garantia: 'No aplica' }),
  }),
]

const fuentesWeb: Record<string, FuenteReferencia[]> = {
  'PED-2026-0126': [
    { url: 'https://precios.combustibles.ejemplo.gob.ar/gasoil-g2/region-centro', fecha: '2026-09-25', precio: 13.4 * M },
  ],
  'PED-2026-0132': [
    { url: 'https://tienda.insumos-ejemplo.com.ar/toner-26a-compatible', fecha: '2026-09-04', precio: 7.2 * M },
    { url: 'https://mayorista.ejemplo.com.ar/catalogo/toner/cf226a', fecha: '2026-09-05', precio: 7.5 * M },
  ],
  'PED-2026-0121': [
    { url: 'https://mercado.ejemplo.com.ar/resma-a4-75g-caja-x10', fecha: '2026-08-10', precio: 15.8 * M },
    { url: 'https://precios-testigo.ejemplo.gob.ar/papel/resma-a4-75g', fecha: '2026-08-11', precio: 15.5 * M },
    { url: 'https://libreria-mayorista.ejemplo.com.ar/papel/resma-a4', fecha: '2026-08-12', precio: 16.1 * M },
  ],
  'PED-2026-0118': [
    { url: 'https://precios-testigo.ejemplo.gob.ar/servicios/mantenimiento-ascensores', fecha: '2026-07-20', precio: 17.9 * M },
    { url: 'https://camara-ascensores.ejemplo.org.ar/tarifas-referencia-2026', fecha: '2026-07-21', precio: 18.2 * M },
  ],
  'PED-2026-0109': [
    { url: 'https://mercado.ejemplo.com.ar/limpieza/combo-institucional', fecha: '2026-06-10', precio: 1.52 * M },
  ],
}

const decisionesBase: { id: string; pedido_id: string; fecha: string; estado: EstadoDecision; motivo: string }[] = [
  {
    id: 'DEC-2026-001',
    pedido_id: 'PED-2026-0109',
    fecha: '2026-06-20T14:05:00-03:00',
    estado: 'aprobado',
    motivo:
      'Se adjudica a Limpieza Norte Coop. Ltda., oferta de menor monto total, 4,0 % por debajo del precio de referencia. Cumple plazo y condiciones solicitadas.',
  },
  {
    id: 'DEC-2026-002',
    pedido_id: 'PED-2026-0118',
    fecha: '2026-08-01T10:40:00-03:00',
    estado: 'aprobado',
    motivo:
      'Se adjudica a Servicios Integrales Patagonia SRL, oferta de menor monto (3,6 % por debajo de la referencia). La oferta restante presenta un desvío de 29,6 % respecto de la referencia.',
  },
  {
    id: 'DEC-2026-003',
    pedido_id: 'PED-2026-0121',
    fecha: '2026-08-16T12:15:00-03:00',
    estado: 'aprobado',
    motivo:
      'Se adjudica a Papelera Andina S.A., oferta de menor monto total (3,2 % por debajo de la referencia). Se verificó saldo suficiente en la partida 2.3.1.',
  },
  {
    id: 'DEC-2026-004',
    pedido_id: 'PED-2026-0132',
    fecha: '2026-09-12T16:30:00-03:00',
    estado: 'observado',
    motivo:
      'La oferta de menor monto (Oficina Total S.A.) no incluye IVA y la siguiente (Insumos del Litoral SRL) presenta un desvío de 30,7 % respecto de la referencia. Se solicita a los oferentes aclaración de condiciones antes de adjudicar.',
  },
  {
    id: 'DEC-2026-005',
    pedido_id: 'PED-2026-0126',
    fecha: '2026-09-30T09:20:00-03:00',
    estado: 'rechazado',
    motivo:
      'Saldo insuficiente en la partida 2.5.6: disponible $ 6.000.000 frente a una oferta de $ 13.760.000. Además, la referencia no es concluyente (solo 2 puntos de comparación).',
  },
]

function construirRegistro(): Decision[] {
  let previo = GENESIS
  return decisionesBase.map((base) => {
    const licitacion = licitaciones.find((l) => l.id === base.pedido_id)!
    const partida = partidas.find((p) => p.id === licitacion.partida_id)!
    const propias = cotizaciones.filter((c) => c.pedido_id === base.pedido_id)
    const fuentes = fuentesWeb[base.pedido_id] ?? []
    const valor = Math.round(mediana([...propias.map(totalCotizacion), ...fuentes.map((f) => f.precio)]))
    const adjudicada = propias.find((c) => c.proveedor_id === licitacion.proveedor_adjudicado_id)
    const montoAdjudicado = base.estado === 'aprobado' && adjudicada ? totalCotizacion(adjudicada) : 0
    const saldoActual = partida.asignado - partida.ejecutado

    const sinHash: Omit<Decision, 'hash'> = {
      ...base,
      referencia: {
        valor,
        metodo: `Mediana de ${propias.length} cotizaciones recibidas y ${fuentes.length} fuentes web`,
        fuentes,
      },
      saldo_partida_antes: saldoActual + montoAdjudicado,
      saldo_partida_despues: saldoActual,
      hash_prev: previo,
    }
    const hash = hashDecision(sinHash)
    previo = hash
    return { ...sinHash, hash }
  })
}

export const registro: Decision[] = construirRegistro()

const AGENTE_COMPRAS = 'Agente de compras'
const AGENTE_PRECIOS = 'Agente de precios'

function canalDeFuente(fuente = ''): CanalBusqueda {
  const f = fuente.toLowerCase()
  if (f.includes('correo')) return 'correo'
  if (f.includes('whatsapp')) return 'mensajeria'
  return 'catalogo'
}

const busquedasExtra: Omit<BusquedaAgente, 'id'>[] = [
  {
    pedido_id: 'PED-2026-0147', agente: AGENTE_PRECIOS, fecha: '2026-10-21T09:12:00-03:00', canal: 'web',
    consulta: 'notebook 14" i5 16GB 512GB SSD precio mayorista', destino: 'https://mercado.ejemplo.com.ar/notebooks/14-i5-16gb',
    resultado: 'referencia', precio: 118_800_000,
  },
  {
    pedido_id: 'PED-2026-0147', agente: AGENTE_PRECIOS, fecha: '2026-10-21T09:20:00-03:00', canal: 'web',
    consulta: 'notebook 14" i5 16GB precio testigo organismos', destino: 'https://precios-testigo.ejemplo.gob.ar/informatica/notebook-14',
    resultado: 'referencia', precio: 124_500_000,
  },
  {
    pedido_id: 'PED-2026-0147', agente: AGENTE_COMPRAS, fecha: '2026-10-19T15:02:00-03:00', canal: 'correo',
    consulta: 'Solicitud de cotización: 120 notebooks 14" i5/Ryzen 5, 16 GB RAM', destino: 'ventas@tecnored.ejemplo.com.ar',
    resultado: 'sin_respuesta', nota: 'El proveedor ofertó luego por el portal.',
  },
  {
    pedido_id: 'PED-2026-0126', agente: AGENTE_COMPRAS, fecha: '2026-09-22T11:30:00-03:00', canal: 'correo',
    consulta: 'Solicitud de cotización: 8.000 l de gasoil grado 2 con entrega', destino: 'comercial@distribuidoracentro.ejemplo.com.ar',
    resultado: 'sin_respuesta', nota: 'Sin respuesta dentro del plazo de 48 h.',
  },
  {
    pedido_id: 'PED-2026-0126', agente: AGENTE_PRECIOS, fecha: '2026-09-25T10:05:00-03:00', canal: 'web',
    consulta: 'precio gasoil grado 2 surtidor región centro', destino: 'https://surtidores.ejemplo.com.ar/precios/gasoil',
    resultado: 'descartada', precio: 14_100_000, nota: 'Precio minorista en surtidor; no incluye entrega en tanque propio.',
  },
  {
    pedido_id: 'PED-2026-0132', agente: AGENTE_PRECIOS, fecha: '2026-09-04T14:40:00-03:00', canal: 'web',
    consulta: 'tóner 26A original HP precio', destino: 'https://tienda.ejemplo.com.ar/hp/cf226a-original',
    resultado: 'descartada', precio: 16_200_000, nota: 'Producto original; el pedido admite compatibles. No comparable.',
  },
  {
    pedido_id: 'PED-2026-0121', agente: AGENTE_PRECIOS, fecha: '2026-08-10T16:22:00-03:00', canal: 'web',
    consulta: 'resma A4 80g caja x10 precio', destino: 'https://mercado.ejemplo.com.ar/resma-a4-80g',
    resultado: 'descartada', precio: 19_400_000, nota: 'Gramaje distinto (80 g); no comparable con lo solicitado.',
  },
  {
    pedido_id: 'PED-2026-0118', agente: AGENTE_COMPRAS, fecha: '2026-07-18T09:45:00-03:00', canal: 'correo',
    consulta: 'Solicitud de cotización: mantenimiento preventivo de 6 ascensores, 12 meses', destino: 'contacto@elevar.ejemplo.com.ar',
    resultado: 'sin_respuesta', nota: 'La empresa informó que no presta servicio en la zona.',
  },
]

function construirBusquedas(): BusquedaAgente[] {
  const porAgente = cotizaciones
    .filter((c) => c.origen === 'agente')
    .map((c): Omit<BusquedaAgente, 'id'> => {
      const proveedor = proveedores.find((p) => p.id === c.proveedor_id)!
      const principal = c.items[0]
      return {
        pedido_id: c.pedido_id,
        agente: AGENTE_COMPRAS,
        fecha: `${c.fecha_emision}T10:00:00-03:00`,
        canal: canalDeFuente(c.fuente),
        consulta: `Solicitud de cotización: ${principal.cantidad} ${principal.unidad} · ${principal.descripcion}`,
        destino: proveedor.nombre,
        resultado: 'cotizacion',
        precio: totalCotizacion(c),
        cotizacion_id: c.id,
        nota: c.fuente,
      }
    })

  const web = Object.entries(fuentesWeb).flatMap(([pedido_id, fuentes]) => {
    const licitacion = licitaciones.find((l) => l.id === pedido_id)!
    return fuentes.map(
      (f): Omit<BusquedaAgente, 'id'> => ({
        pedido_id,
        agente: AGENTE_PRECIOS,
        fecha: `${f.fecha}T12:00:00-03:00`,
        canal: 'web',
        consulta: `${licitacion.descripcion} precio`,
        destino: f.url,
        resultado: 'referencia',
        precio: f.precio,
      }),
    )
  })

  return [...porAgente, ...web, ...busquedasExtra]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((b, i) => ({ ...b, id: `BUS-${String(i + 1).padStart(3, '0')}` }))
}

export const busquedas: BusquedaAgente[] = construirBusquedas()

/** Variante para la demo: el registro 3 fue modificado después de sellado, sin recalcular su hash. */
export const registroAlterado: Decision[] = registro.map((d, i) =>
  i === 2 ? { ...d, saldo_partida_despues: d.saldo_partida_despues + 2_500_000 } : d,
)
