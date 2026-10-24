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
  EstadoObservacion,
  FuenteReferencia,
  Licitacion,
  ObservacionPublica,
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
  { id: 'PT-332', codigo: '3.3.2', nombre: 'Mantenimiento de calles y caminos', asignado: 240 * M, ejecutado: 150 * M },
  { id: 'PT-335', codigo: '3.3.5', nombre: 'Limpieza, aseo y fumigación', asignado: 160 * M, ejecutado: 112 * M },
  { id: 'PT-395', codigo: '3.9.5', nombre: 'Servicio de comedores y viandas escolares', asignado: 380 * M, ejecutado: 262 * M },
  { id: 'PT-258', codigo: '2.5.8', nombre: 'Combustibles para servicios urbanos', asignado: 110 * M, ejecutado: 71 * M },
  { id: 'PT-361', codigo: '3.6.1', nombre: 'Publicidad y propaganda', asignado: 55 * M, ejecutado: 37 * M },
  { id: 'PT-252', codigo: '2.5.2', nombre: 'Productos farmacéuticos y medicinales', asignado: 150 * M, ejecutado: 104 * M },
  { id: 'PT-437', codigo: '4.3.7', nombre: 'Equipos de comunicación y redes', asignado: 95 * M, ejecutado: 61 * M },
  { id: 'PT-349', codigo: '3.4.9', nombre: 'Estudios, investigaciones y consultorías', asignado: 48 * M, ejecutado: 19 * M },
]

export const proveedores: Proveedor[] = [
  { id: 'PRV-01', nombre: 'Papelera Andina S.A.', cuit: '30712345671', fecha_alta: '2009-03-12' },
  { id: 'PRV-02', nombre: 'Distribuidora Centro SRL', cuit: '30709876542', fecha_alta: '2012-07-02' },
  { id: 'PRV-03', nombre: 'Insumos del Litoral SRL', cuit: '30715558883', fecha_alta: '2014-11-20' },
  { id: 'PRV-04', nombre: 'Oficina Total S.A.', cuit: '30701122334', fecha_alta: '2008-05-06' },
  { id: 'PRV-05', nombre: 'Tecnored Soluciones S.A.', cuit: '30716677885', fecha_alta: '2015-02-17' },
  { id: 'PRV-06', nombre: 'Servicios Integrales Patagonia SRL', cuit: '30704433226', fecha_alta: '2011-09-30' },
  { id: 'PRV-07', nombre: 'Limpieza Norte Coop. Ltda.', cuit: '30708899117', fecha_alta: '2010-04-14' },
  { id: 'PRV-08', nombre: 'Combustibles del Sur S.A.', cuit: '30702244668', fecha_alta: '2007-08-22' },
  { id: 'PRV-09', nombre: 'Viales del Arroyo Seco SRL', cuit: '30721000091', fecha_alta: '2014-06-03' },
  { id: 'PRV-10', nombre: 'Pavimentos Ñandubay S.A.', cuit: '30721000105', fecha_alta: '2011-03-28' },
  { id: 'PRV-11', nombre: 'Asfaltos Cuatro Vientos SRL', cuit: '30721000113', fecha_alta: '2017-10-09' },
  { id: 'PRV-12', nombre: 'Brillo Austral Servicios SRL', cuit: '30721000121', fecha_alta: '2016-01-19' },
  { id: 'PRV-13', nombre: 'Higiene Total Delta SRL', cuit: '30721000130', fecha_alta: '2019-05-07' },
  { id: 'PRV-14', nombre: 'Aseo Integral Los Tilos Coop. Ltda.', cuit: '30721000148', fecha_alta: '2013-08-26' },
  { id: 'PRV-15', nombre: 'Cocina Escolar Quebracho SRL', cuit: '30721000156', fecha_alta: '2015-04-14' },
  { id: 'PRV-16', nombre: 'Viandas del Valle Hondo S.A.', cuit: '30721000164', fecha_alta: '2012-02-01' },
  { id: 'PRV-17', nombre: 'Sabores de la Llanura Coop. Ltda.', cuit: '30721000172', fecha_alta: '2018-09-12' },
  { id: 'PRV-18', nombre: 'Surtidora Pampa Gris S.A.', cuit: '30721000180', fecha_alta: '2010-11-30' },
  { id: 'PRV-19', nombre: 'Lubricantes Río Manso SRL', cuit: '30721000199', fecha_alta: '2013-06-18' },
  { id: 'PRV-20', nombre: 'Estación Cruce Tres Lagunas S.A.', cuit: '30721000202', fecha_alta: '2009-12-04' },
  { id: 'PRV-21', nombre: 'Agencia Faro de Papel Comunicación SRL', cuit: '30721000210', fecha_alta: '2016-07-21' },
  { id: 'PRV-22', nombre: 'Droguería Alcanfor del Sur S.A.', cuit: '30721000229', fecha_alta: '2012-10-15' },
  { id: 'PRV-23', nombre: 'Insumos Médicos Ceibo Rojo SRL', cuit: '30721000237', fecha_alta: '2017-03-02' },
  { id: 'PRV-24', nombre: 'Distribuidora Sanitaria Ñire SRL', cuit: '30721000245', fecha_alta: '2014-01-27' },
  { id: 'PRV-25', nombre: 'Nodo Brújula Tecnologías SRL', cuit: '30721000253', fecha_alta: '2026-08-18' },
  { id: 'PRV-26', nombre: 'Redes Totora S.A.', cuit: '30721000261', fecha_alta: '2010-05-11' },
  { id: 'PRV-27', nombre: 'Datacentro Mburucuyá SRL', cuit: '30721000270', fecha_alta: '2016-12-06' },
  { id: 'PRV-28', nombre: 'Consultora Horizonte Calchaquí SRL', cuit: '30721000288', fecha_alta: '2015-08-31' },
  { id: 'PRV-29', nombre: 'Estudio Prisma Territorial SRL', cuit: '30721000296', fecha_alta: '2013-04-09' },
]

const ORG = {
  hacienda: 'Municipalidad de Villa Ceibal Alto · Secretaría de Hacienda',
  obras: 'Municipalidad de Villa Ceibal Alto · Secretaría de Obras y Servicios Públicos',
  educacion: 'Municipalidad de Villa Ceibal Alto · Secretaría de Educación',
  comunicacion: 'Municipalidad de Laguna Quieta · Secretaría de Comunicación y Eventos',
  salud: 'Municipalidad de Laguna Quieta · Secretaría de Salud',
  modernizacion: 'Municipalidad de Cerro Tolvanes · Secretaría de Modernización',
  planeamiento: 'Municipalidad de Cerro Tolvanes · Secretaría de Planeamiento',
  obrasTolvanes: 'Municipalidad de Cerro Tolvanes · Secretaría de Obras Públicas',
}

export const RUBROS = {
  bacheo: 'Bacheo y obras viales menores',
  limpieza: 'Limpieza y mantenimiento',
  viandas: 'Viandas escolares',
  combustible: 'Combustible',
  publicidad: 'Publicidad oficial y eventos',
  salud: 'Insumos de salud',
  informatica: 'Informática',
  consultorias: 'Consultorías',
  oficina: 'Insumos de oficina',
  edificios: 'Mantenimiento de edificios',
}

const clasificacion: Record<string, Pick<Licitacion, 'organismo' | 'rubro'>> = {
  'PED-2026-0147': { organismo: ORG.modernizacion, rubro: RUBROS.informatica },
  'PED-2026-0126': { organismo: ORG.hacienda, rubro: RUBROS.combustible },
  'PED-2026-0132': { organismo: ORG.hacienda, rubro: RUBROS.oficina },
  'PED-2026-0121': { organismo: ORG.hacienda, rubro: RUBROS.oficina },
  'PED-2026-0118': { organismo: ORG.obras, rubro: RUBROS.edificios },
  'PED-2026-0109': { organismo: ORG.obras, rubro: RUBROS.limpieza },
  'PED-2026-0148': { organismo: ORG.obras, rubro: RUBROS.limpieza },
  'PED-2026-0149': { organismo: ORG.obras, rubro: RUBROS.bacheo },
  'PED-2026-0150': { organismo: ORG.obras, rubro: RUBROS.limpieza },
  'PED-2026-0151': { organismo: ORG.educacion, rubro: RUBROS.viandas },
  'PED-2026-0152': { organismo: ORG.hacienda, rubro: RUBROS.combustible },
  'PED-2026-0153': { organismo: ORG.obras, rubro: RUBROS.limpieza },
  'PED-2026-0154': { organismo: ORG.comunicacion, rubro: RUBROS.publicidad },
  'PED-2026-0155': { organismo: ORG.obras, rubro: RUBROS.limpieza },
  'PED-2026-0156': { organismo: ORG.salud, rubro: RUBROS.salud },
  'PED-2026-0157': { organismo: ORG.salud, rubro: RUBROS.salud },
  'PED-2026-0158': { organismo: ORG.salud, rubro: RUBROS.salud },
  'PED-2026-0159': { organismo: ORG.modernizacion, rubro: RUBROS.informatica },
  'PED-2026-0160': { organismo: ORG.planeamiento, rubro: RUBROS.consultorias },
  'PED-2026-0161': { organismo: ORG.obrasTolvanes, rubro: RUBROS.bacheo },
}

export const licitaciones: Licitacion[] = ([
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
  ...nuevasLicitaciones(),
] as Licitacion[]).map((l) => ({ ...l, ...clasificacion[l.id] }))

function nuevasLicitaciones(): Licitacion[] {
  const l = (
    id: string, descripcion: string, partida_id: string, fecha_cierre: string, monto: number,
    estado: Licitacion['estado'] = 'aprobado', proveedor_adjudicado_id?: string,
  ): Licitacion => ({ id, descripcion, partida_id, estado, fecha_cierre, monto_estimado: monto * M, proveedor_adjudicado_id })
  return [
    l('PED-2026-0148', 'Limpieza integral Delegación Barrio Norte (6 meses)', 'PT-335', '2026-10-01', 10, 'aprobado', 'PRV-12'),
    l('PED-2026-0149', 'Bacheo con concreto asfáltico en caliente, calles del centro (1.800 m²)', 'PT-332', '2026-10-02', 36, 'aprobado', 'PRV-09'),
    l('PED-2026-0150', 'Limpieza integral Centro Cívico Municipal (6 meses)', 'PT-335', '2026-10-05', 12.5, 'aprobado', 'PRV-12'),
    l('PED-2026-0151', 'Viandas escolares para 9 escuelas primarias (40 días hábiles)', 'PT-395', '2026-10-06', 67, 'aprobado', 'PRV-15'),
    l('PED-2026-0152', 'Nafta y gasoil para flota de servicios urbanos (12.000 litros)', 'PT-258', '2026-10-07', 20, 'aprobado', 'PRV-18'),
    l('PED-2026-0153', 'Limpieza integral Corralón y Talleres Municipales (6 meses)', 'PT-335', '2026-10-09', 15, 'aprobado', 'PRV-12'),
    l('PED-2026-0154', 'Campaña de comunicación Fiesta del Río Quieto (vía pública y radio)', 'PT-361', '2026-10-09', 16, 'aprobado', 'PRV-21'),
    l('PED-2026-0155', 'Limpieza integral Biblioteca y Casa de la Cultura (6 meses)', 'PT-335', '2026-10-13', 9, 'aprobado', 'PRV-12'),
    l('PED-2026-0156', 'Guantes de nitrilo para centros de atención primaria (3.400 cajas)', 'PT-252', '2026-10-13', 14.8, 'aprobado', 'PRV-22'),
    l('PED-2026-0157', 'Jeringas descartables 5 ml con aguja (165.000 unidades)', 'PT-252', '2026-10-14', 14.9, 'aprobado', 'PRV-22'),
    l('PED-2026-0158', 'Gasas estériles 10x10 para guardias (62.000 sobres)', 'PT-252', '2026-10-15', 14.7, 'aprobado', 'PRV-22'),
    l('PED-2026-0159', 'Switches PoE y access points para la red municipal', 'PT-437', '2026-10-16', 33, 'aprobado', 'PRV-25'),
    l('PED-2026-0160', 'Consultoría para el plan de movilidad urbana sostenible', 'PT-349', '2026-10-19', 10, 'observado'),
    l('PED-2026-0161', 'Bacheo y sellado de juntas en accesos rurales (2.400 m²)', 'PT-332', '2026-11-12', 46, 'abierto'),
  ]
}

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
  ...nuevasCotizaciones(),
]

function nuevasCotizaciones(): CotizacionRegistrada[] {
  type Extra = Partial<Pick<Cotizacion, 'origen' | 'fuente' | 'validez_dias'>> & { condiciones?: CondicionesCotizacion }
  const una = (
    id: string, pedido: string, proveedor: string, fecha_emision: string,
    descripcion: string, cantidad: number, unidad: string, precio: number, plazo: number, extra: Extra = {},
  ) =>
    cotizacion(id, pedido, proveedor, {
      fecha_emision, validez_dias: extra.validez_dias ?? 15, moneda: 'ARS', origen: extra.origen ?? 'portal',
      fuente: extra.fuente, items: [item(descripcion, cantidad, unidad, precio)],
      condiciones: extra.condiciones ?? condiciones(plazo),
    })
  const servicio = (plazo = 0) =>
    condiciones(plazo, { forma_pago: 'Mensual, a 30 días de la factura', garantia: 'Reposición del servicio en 24 h' })
  const limpieza = (id: string, pedido: string, proveedor: string, fecha: string, sede: string, mensual: number) =>
    una(id, pedido, proveedor, fecha, `Servicio de limpieza integral, ${sede}`, 6, 'mes', mensual, 0, { condiciones: servicio() })
  const sinGarantia = (plazo: number) => condiciones(plazo, { garantia: 'No aplica', forma_pago: 'Contado contra entrega' })

  return [
    limpieza('COT-0148-01', 'PED-2026-0148', 'PRV-12', '2026-09-26', 'Delegación Barrio Norte', 1_625_000),
    limpieza('COT-0148-02', 'PED-2026-0148', 'PRV-14', '2026-09-27', 'Delegación Barrio Norte', 1_675_000),
    limpieza('COT-0148-03', 'PED-2026-0148', 'PRV-13', '2026-09-29', 'Delegación Barrio Norte', 2_300_000),

    una('COT-0149-01', 'PED-2026-0149', 'PRV-09', '2026-09-28', 'Bacheo con concreto asfáltico en caliente, espesor 5 cm', 1800, 'm²', 19_200, 30, { condiciones: condiciones(30, { garantia: '24 meses sobre la carpeta' }) }),
    una('COT-0149-02', 'PED-2026-0149', 'PRV-10', '2026-09-29', 'Bacheo con concreto asfáltico en caliente, espesor 5 cm', 1800, 'm²', 19_900, 25, { condiciones: condiciones(25, { garantia: '24 meses sobre la carpeta' }) }),
    una('COT-0149-03', 'PED-2026-0149', 'PRV-11', '2026-09-30', 'Bacheo con concreto asfáltico en caliente, espesor 5 cm', 1800, 'm²', 20_600, 35, { condiciones: condiciones(35, { garantia: '18 meses sobre la carpeta' }) }),

    limpieza('COT-0150-01', 'PED-2026-0150', 'PRV-12', '2026-09-30', 'Centro Cívico Municipal', 2_040_000),
    limpieza('COT-0150-02', 'PED-2026-0150', 'PRV-14', '2026-10-01', 'Centro Cívico Municipal', 2_140_000),
    limpieza('COT-0150-03', 'PED-2026-0150', 'PRV-13', '2026-10-02', 'Centro Cívico Municipal', 2_750_000),

    una('COT-0151-01', 'PED-2026-0151', 'PRV-15', '2026-10-01', 'Vianda escolar caliente con postre, menú aprobado por nutrición', 21_600, 'vianda', 3020, 0, { condiciones: servicio() }),
    una('COT-0151-02', 'PED-2026-0151', 'PRV-16', '2026-10-02', 'Vianda escolar caliente con postre, menú aprobado por nutrición', 21_600, 'vianda', 3110, 0, { condiciones: servicio() }),
    una('COT-0151-03', 'PED-2026-0151', 'PRV-17', '2026-10-03', 'Vianda escolar caliente con postre, menú aprobado por nutrición', 21_600, 'vianda', 3200, 0, { condiciones: servicio(), origen: 'agente', fuente: 'Correo electrónico al agente de compras' }),

    una('COT-0152-01', 'PED-2026-0152', 'PRV-18', '2026-10-03', 'Combustible (nafta súper y gasoil grado 2), retiro en estación', 12_000, 'litro', 1642, 2, { condiciones: sinGarantia(2), validez_dias: 7 }),
    una('COT-0152-02', 'PED-2026-0152', 'PRV-19', '2026-10-04', 'Combustible (nafta súper y gasoil grado 2), retiro en estación', 12_000, 'litro', 1651, 2, { condiciones: sinGarantia(2), validez_dias: 7 }),
    una('COT-0152-03', 'PED-2026-0152', 'PRV-20', '2026-10-05', 'Combustible (nafta súper y gasoil grado 2), retiro en estación', 12_000, 'litro', 1656, 2, { condiciones: sinGarantia(2), validez_dias: 7, origen: 'agente', fuente: 'Lista de precios publicada por el proveedor' }),

    limpieza('COT-0153-01', 'PED-2026-0153', 'PRV-12', '2026-10-05', 'Corralón y Talleres Municipales', 2_400_000),
    limpieza('COT-0153-02', 'PED-2026-0153', 'PRV-14', '2026-10-06', 'Corralón y Talleres Municipales', 2_500_000),
    limpieza('COT-0153-03', 'PED-2026-0153', 'PRV-13', '2026-10-07', 'Corralón y Talleres Municipales', 3_500_000),

    una('COT-0154-01', 'PED-2026-0154', 'PRV-21', '2026-10-08', 'Campaña integral: 40 pantallas de vía pública, 3 radios locales, 4 semanas', 1, 'campaña', 18_400_000, 10, { condiciones: condiciones(10, { garantia: 'Informe de pauta certificado' }) }),

    limpieza('COT-0155-01', 'PED-2026-0155', 'PRV-12', '2026-10-08', 'Biblioteca y Casa de la Cultura', 1_420_000),
    limpieza('COT-0155-02', 'PED-2026-0155', 'PRV-14', '2026-10-09', 'Biblioteca y Casa de la Cultura', 1_500_000),
    limpieza('COT-0155-03', 'PED-2026-0155', 'PRV-13', '2026-10-10', 'Biblioteca y Casa de la Cultura', 2_050_000),

    una('COT-0156-01', 'PED-2026-0156', 'PRV-22', '2026-10-09', 'Guantes de nitrilo talle M, caja x100', 3400, 'caja', 4300, 5),
    una('COT-0156-02', 'PED-2026-0156', 'PRV-23', '2026-10-10', 'Guantes de nitrilo talle M, caja x100', 3400, 'caja', 4500, 7),
    una('COT-0156-03', 'PED-2026-0156', 'PRV-24', '2026-10-11', 'Guantes de nitrilo talle M, caja x100', 3400, 'caja', 4620, 10, { origen: 'agente', fuente: 'Correo electrónico al agente de compras' }),

    una('COT-0157-01', 'PED-2026-0157', 'PRV-22', '2026-10-10', 'Jeringa descartable 5 ml con aguja 21G', 165_000, 'unidad', 90, 5),
    una('COT-0157-02', 'PED-2026-0157', 'PRV-23', '2026-10-12', 'Jeringa descartable 5 ml con aguja 21G', 165_000, 'unidad', 94.5, 7),

    una('COT-0158-01', 'PED-2026-0158', 'PRV-22', '2026-10-12', 'Gasa estéril 10x10 cm, sobre x10', 62_000, 'sobre', 232, 5),
    una('COT-0158-02', 'PED-2026-0158', 'PRV-24', '2026-10-13', 'Gasa estéril 10x10 cm, sobre x10', 62_000, 'sobre', 246, 8),

    cotizacion('COT-0159-01', 'PED-2026-0159', 'PRV-25', {
      fecha_emision: '2026-10-12', validez_dias: 10, moneda: 'ARS', origen: 'portal',
      items: [
        item('Switch 48 puertos PoE+ administrable capa 2', 20, 'unidad', 1_450_000),
        item('Access point Wi-Fi 6 de interior', 70, 'unidad', 200_000),
      ],
      condiciones: condiciones(20),
    }),
    cotizacion('COT-0159-02', 'PED-2026-0159', 'PRV-26', {
      fecha_emision: '2026-10-13', validez_dias: 15, moneda: 'ARS', origen: 'portal',
      items: [
        item('Switch 48 puertos PoE+ administrable capa 2', 20, 'unidad', 1_620_000),
        item('Access point Wi-Fi 6 de interior', 70, 'unidad', 215_000),
      ],
      condiciones: condiciones(30, { garantia: '36 meses' }),
    }),
    cotizacion('COT-0159-03', 'PED-2026-0159', 'PRV-27', {
      fecha_emision: '2026-10-14', validez_dias: 15, moneda: 'ARS', origen: 'portal',
      items: [
        item('Switch 48 puertos PoE+ administrable capa 2', 20, 'unidad', 1_700_000),
        item('Access point Wi-Fi 6 de interior', 70, 'unidad', 232_000),
      ],
      condiciones: condiciones(25, { garantia: '36 meses' }),
    }),

    una('COT-0160-01', 'PED-2026-0160', 'PRV-28', '2026-10-15', 'Diagnóstico, encuestas origen-destino y plan de movilidad (informe final)', 1, 'servicio', 9_600_000, 120, { condiciones: condiciones(120, { garantia: 'No aplica', forma_pago: '30 % anticipo, 70 % contra informe final' }) }),
    una('COT-0160-02', 'PED-2026-0160', 'PRV-29', '2026-10-17', 'Plan de movilidad urbana con modelización de tránsito (informe final)', 1, 'servicio', 12_800_000, 150, { condiciones: condiciones(150, { garantia: 'No aplica', forma_pago: 'Tres pagos contra entregables' }) }),

    una('COT-0161-01', 'PED-2026-0161', 'PRV-10', '2026-10-20', 'Bacheo y sellado de juntas con emulsión asfáltica', 2400, 'm²', 19_800, 40),
    una('COT-0161-02', 'PED-2026-0161', 'PRV-11', '2026-10-22', 'Bacheo y sellado de juntas con emulsión asfáltica', 2400, 'm²', 20_900, 45),
  ]
}

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
  ...fuentesNuevas(),
}

function fuentesNuevas(): Record<string, FuenteReferencia[]> {
  const tres = (base: [string, string, string], fechas: [string, string, string], precios: [number, number, number]) =>
    base.map((url, i) => ({ url, fecha: fechas[i], precio: precios[i] * M }))
  const limpieza = (slug: string, fechas: [string, string, string], precios: [number, number, number]) =>
    tres(
      [
        `https://preciostestigo.example.org/servicios/limpieza-integral/${slug}`,
        `https://camara-servicios-generales.example.org/tarifas/2026-t4/limpieza-${slug}`,
        `https://compras-intermunicipales.example.org/adjudicaciones/limpieza/${slug}`,
      ],
      fechas,
      precios,
    )
  return {
    'PED-2026-0148': limpieza('sede-600m2-6-meses', ['2026-09-24', '2026-09-25', '2026-09-28'], [9.6, 9.9, 10.2]),
    'PED-2026-0149': tres(
      [
        'https://observatorio-vial.example.org/costos/bacheo-caliente-m2-2026-09',
        'https://preciostestigo.example.org/obras/bacheo-asfaltico-5cm',
        'https://compras-intermunicipales.example.org/adjudicaciones/bacheo/1800m2',
      ],
      ['2026-09-25', '2026-09-28', '2026-09-30'],
      [34.2, 35.1, 36.0],
    ),
    'PED-2026-0150': limpieza('sede-800m2-6-meses', ['2026-09-29', '2026-09-30', '2026-10-02'], [12.0, 12.4, 12.7]),
    'PED-2026-0151': tres(
      [
        'https://preciostestigo.example.org/alimentacion/vianda-escolar-caliente',
        'https://red-comedores-escolares.example.org/costos/2026-10/vianda-con-postre',
        'https://compras-intermunicipales.example.org/adjudicaciones/viandas/21600',
      ],
      ['2026-09-30', '2026-10-01', '2026-10-03'],
      [64.8, 66.0, 67.4],
    ),
    'PED-2026-0152': tres(
      [
        'https://precios-surtidor.example.org/region-centro/2026-10-02',
        'https://preciostestigo.example.org/combustibles/flota-12000-litros',
        'https://compras-intermunicipales.example.org/adjudicaciones/combustible/12000l',
      ],
      ['2026-10-02', '2026-10-03', '2026-10-05'],
      [19.1, 19.5, 20.2],
    ),
    'PED-2026-0153': limpieza('sede-1100m2-6-meses', ['2026-10-03', '2026-10-05', '2026-10-07'], [14.1, 14.5, 14.9]),
    'PED-2026-0154': tres(
      [
        'https://tarifario-medios.example.org/via-publica/pantallas-40-4-semanas',
        'https://preciostestigo.example.org/comunicacion/campana-radio-local',
        'https://compras-intermunicipales.example.org/adjudicaciones/publicidad/fiesta-local',
      ],
      ['2026-10-02', '2026-10-05', '2026-10-07'],
      [15.2, 16.0, 16.8],
    ),
    'PED-2026-0155': limpieza('sede-500m2-6-meses', ['2026-10-07', '2026-10-08', '2026-10-10'], [8.4, 8.7, 8.9]),
    'PED-2026-0156': tres(
      [
        'https://preciostestigo.example.org/salud/guantes-nitrilo-caja-100',
        'https://observatorio-medicamentos.example.org/insumos/guantes-nitrilo-m',
        'https://compras-intermunicipales.example.org/adjudicaciones/salud/guantes-3400',
      ],
      ['2026-10-08', '2026-10-09', '2026-10-11'],
      [14.0, 14.4, 14.9],
    ),
    'PED-2026-0157': tres(
      [
        'https://preciostestigo.example.org/salud/jeringa-5ml-aguja-21g',
        'https://observatorio-medicamentos.example.org/insumos/jeringa-5ml',
        'https://compras-intermunicipales.example.org/adjudicaciones/salud/jeringas-165000',
      ],
      ['2026-10-09', '2026-10-10', '2026-10-12'],
      [14.3, 14.7, 15.2],
    ),
    'PED-2026-0158': tres(
      [
        'https://preciostestigo.example.org/salud/gasa-esteril-10x10',
        'https://observatorio-medicamentos.example.org/insumos/gasa-10x10-sobre',
        'https://compras-intermunicipales.example.org/adjudicaciones/salud/gasas-62000',
      ],
      ['2026-10-10', '2026-10-12', '2026-10-13'],
      [13.9, 14.5, 14.8],
    ),
    'PED-2026-0159': tres(
      [
        'https://preciostestigo.example.org/informatica/switch-48-poe-ap-wifi6',
        'https://mayorista-redes.example.org/catalogo/kit-20-switch-70-ap',
        'https://compras-intermunicipales.example.org/adjudicaciones/redes/switches-ap',
      ],
      ['2026-10-10', '2026-10-13', '2026-10-14'],
      [30.5, 32.0, 33.4],
    ),
    'PED-2026-0161': tres(
      [
        'https://observatorio-vial.example.org/costos/sellado-juntas-m2-2026-10',
        'https://preciostestigo.example.org/obras/bacheo-emulsion-rural',
        'https://compras-intermunicipales.example.org/adjudicaciones/bacheo/2400m2',
      ],
      ['2026-10-19', '2026-10-21', '2026-10-22'],
      [46.1, 47.0, 48.2],
    ),
  }
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
  {
    id: 'DEC-2026-006', pedido_id: 'PED-2026-0148', fecha: '2026-10-02T10:15:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Brillo Austral Servicios SRL, oferta de menor monto (2,3 % por debajo de la referencia). La oferta de Higiene Total Delta SRL presenta un desvío de 38,3 %.',
  },
  {
    id: 'DEC-2026-007', pedido_id: 'PED-2026-0149', fecha: '2026-10-03T11:40:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Viales del Arroyo Seco SRL, oferta de menor monto (2,5 % por debajo de la referencia). Las tres ofertas quedan dentro del 5 % de la referencia.',
  },
  {
    id: 'DEC-2026-008', pedido_id: 'PED-2026-0150', fecha: '2026-10-06T09:50:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Brillo Austral Servicios SRL, oferta de menor monto (2,5 % por debajo de la referencia). La oferta de Higiene Total Delta SRL presenta un desvío de 31,5 %.',
  },
  {
    id: 'DEC-2026-009', pedido_id: 'PED-2026-0151', fecha: '2026-10-07T13:05:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Cocina Escolar Quebracho SRL, oferta de menor monto (2,0 % por debajo de la referencia). Menú validado por el área de nutrición escolar.',
  },
  {
    id: 'DEC-2026-010', pedido_id: 'PED-2026-0152', fecha: '2026-10-08T10:30:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Surtidora Pampa Gris S.A., oferta de menor monto (0,3 % por debajo de la referencia).',
  },
  {
    id: 'DEC-2026-011', pedido_id: 'PED-2026-0153', fecha: '2026-10-10T09:30:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Brillo Austral Servicios SRL, oferta de menor monto (2,0 % por debajo de la referencia). La oferta de Higiene Total Delta SRL presenta un desvío de 42,9 %.',
  },
  {
    id: 'DEC-2026-012', pedido_id: 'PED-2026-0154', fecha: '2026-10-10T15:10:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Agencia Faro de Papel Comunicación SRL, única oferta presentada, 12,2 % por encima de la referencia. El evento tiene fecha fija y no admite nueva convocatoria.',
  },
  {
    id: 'DEC-2026-013', pedido_id: 'PED-2026-0155', fecha: '2026-10-14T09:00:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Brillo Austral Servicios SRL, oferta de menor monto (3,2 % por debajo de la referencia). La oferta de Higiene Total Delta SRL presenta un desvío de 39,8 %.',
  },
  {
    id: 'DEC-2026-014', pedido_id: 'PED-2026-0156', fecha: '2026-10-14T11:30:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Droguería Alcanfor del Sur S.A., oferta de menor monto (0,9 % por debajo de la referencia). Compra directa: monto inferior al umbral de licitación.',
  },
  {
    id: 'DEC-2026-015', pedido_id: 'PED-2026-0157', fecha: '2026-10-15T12:20:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Droguería Alcanfor del Sur S.A., oferta de menor monto, igual a la referencia. Compra directa: monto inferior al umbral de licitación.',
  },
  {
    id: 'DEC-2026-016', pedido_id: 'PED-2026-0158', fecha: '2026-10-16T10:45:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Droguería Alcanfor del Sur S.A., oferta de menor monto (0,8 % por debajo de la referencia). Compra directa: monto inferior al umbral de licitación.',
  },
  {
    id: 'DEC-2026-017', pedido_id: 'PED-2026-0159', fecha: '2026-10-19T14:00:00-03:00', estado: 'aprobado',
    motivo: 'Se adjudica a Nodo Brújula Tecnologías SRL, oferta de menor monto, 12,6 % por encima de la referencia. Las otras dos ofertas superan la referencia en más de 24 %.',
  },
  {
    id: 'DEC-2026-018', pedido_id: 'PED-2026-0160', fecha: '2026-10-21T16:20:00-03:00', estado: 'observado',
    motivo: 'Referencia no concluyente: no se hallaron servicios comparables publicados (2 puntos de comparación, se requieren 3). Se solicita a la Secretaría de Planeamiento un presupuesto oficial detallado antes de adjudicar.',
  },
]

function construirRegistro(): Decision[] {
  const licitacionDe = (pedido: string) => licitaciones.find((l) => l.id === pedido)!
  const montoDe = (base: (typeof decisionesBase)[number]) => {
    const licitacion = licitacionDe(base.pedido_id)
    const adjudicada = cotizaciones.find(
      (c) => c.pedido_id === base.pedido_id && c.proveedor_id === licitacion.proveedor_adjudicado_id,
    )
    return base.estado === 'aprobado' && adjudicada ? totalCotizacion(adjudicada) : 0
  }

  // El saldo de cada partida se reconstruye hacia atrás desde el saldo actual,
  // para que varias decisiones sobre la misma partida queden encadenadas.
  const saldoDespues = new Map<string, number>()
  const corriente = new Map(partidas.map((p) => [p.id, p.asignado - p.ejecutado]))
  for (const base of [...decisionesBase].reverse()) {
    const partidaId = licitacionDe(base.pedido_id).partida_id
    const despues = corriente.get(partidaId)!
    saldoDespues.set(base.id, despues)
    corriente.set(partidaId, despues + montoDe(base))
  }

  let previo = GENESIS
  return decisionesBase.map((base) => {
    const propias = cotizaciones.filter((c) => c.pedido_id === base.pedido_id)
    const fuentes = fuentesWeb[base.pedido_id] ?? []
    const valor = Math.round(mediana([...propias.map(totalCotizacion), ...fuentes.map((f) => f.precio)]))
    const montoAdjudicado = montoDe(base)
    const saldoActual = saldoDespues.get(base.id)!

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
  {
    pedido_id: 'PED-2026-0160', agente: AGENTE_PRECIOS, fecha: '2026-10-16T11:10:00-03:00', canal: 'web',
    consulta: 'consultoría plan de movilidad urbana sostenible municipio 60.000 habitantes honorarios',
    destino: 'https://compras-intermunicipales.example.org/adjudicaciones/consultorias/movilidad',
    resultado: 'descartada', precio: 31_500_000, nota: 'Incluye diseño de red de transporte público y obra; alcance no comparable.',
  },
  {
    pedido_id: 'PED-2026-0160', agente: AGENTE_PRECIOS, fecha: '2026-10-16T11:35:00-03:00', canal: 'web',
    consulta: 'encuesta origen-destino municipal precio por hogar',
    destino: 'https://observatorio-movilidad.example.org/costos/encuestas-od',
    resultado: 'descartada', nota: 'Solo cotiza la encuesta, no el plan completo.',
  },
  {
    pedido_id: 'PED-2026-0160', agente: AGENTE_COMPRAS, fecha: '2026-10-14T09:20:00-03:00', canal: 'correo',
    consulta: 'Solicitud de cotización: plan de movilidad urbana sostenible con encuestas origen-destino',
    destino: 'propuestas@consultora-meridiano.example.org',
    resultado: 'sin_respuesta', nota: 'Sin respuesta dentro del plazo de 72 h.',
  },
  {
    pedido_id: 'PED-2026-0154', agente: AGENTE_COMPRAS, fecha: '2026-10-05T10:00:00-03:00', canal: 'correo',
    consulta: 'Invitación a cotizar: campaña de comunicación Fiesta del Río Quieto',
    destino: 'comercial@agencia-cardumen.example.org',
    resultado: 'sin_respuesta', nota: 'La agencia informó que no llega a cumplir la fecha del evento.',
  },
  {
    pedido_id: 'PED-2026-0161', agente: AGENTE_COMPRAS, fecha: '2026-10-18T15:40:00-03:00', canal: 'correo',
    consulta: 'Solicitud de cotización: 2.400 m² de bacheo y sellado de juntas en accesos rurales',
    destino: 'obras@viales-arroyo-seco.example.org',
    resultado: 'sin_respuesta', nota: 'Pedido abierto: se espera respuesta hasta el cierre.',
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

export interface ObservacionSemilla extends ObservacionPublica {
  codigo: string
  estado: EstadoObservacion
  revisada?: string
}

export const observaciones: ObservacionSemilla[] = [
  {
    codigo: 'CC-7Q4M-K2PA', licitacion_id: 'PED-2026-0155', categoria: 'proveedor', estado: 'publicada',
    descripcion: 'Es la cuarta limpieza seguida que gana la misma empresa en el municipio. Pido que se publique cómo se invitó a otros oferentes.',
    creada: '2026-10-15T19:22:00-03:00', revisada: '2026-10-17T10:05:00-03:00',
  },
  {
    codigo: 'CC-3HXN-8TWE', licitacion_id: 'PED-2026-0154', categoria: 'plazo', estado: 'publicada',
    descripcion: 'El pedido estuvo abierto solo cuatro días hábiles, por eso se presentó una sola agencia. Para el próximo evento convendría publicarlo antes.',
    evidencia_url: 'https://diario-laguna-quieta.example.org/2026/10/fiesta-del-rio-agencia',
    creada: '2026-10-12T08:40:00-03:00', revisada: '2026-10-13T12:30:00-03:00',
  },
  {
    codigo: 'CC-9DFR-5VJM', licitacion_id: 'PED-2026-0152', categoria: 'precio', estado: 'publicada',
    descripcion: 'Las tres estaciones cotizaron casi el mismo precio por litro, con diferencias de centavos. Sería bueno revisar si son empresas vinculadas.',
    creada: '2026-10-09T21:15:00-03:00', revisada: '2026-10-11T09:45:00-03:00',
  },
  {
    codigo: 'CC-W2LC-6RZB', licitacion_id: 'PED-2026-0157', categoria: 'especificaciones', estado: 'pendiente',
    descripcion: 'Se compraron guantes, jeringas y gasas en tres pedidos separados la misma semana y a la misma droguería. Podría haber sido una sola licitación.',
    creada: '2026-10-20T17:02:00-03:00',
  },
  {
    codigo: 'CC-K8PT-4NYS', licitacion_id: 'PED-2026-0149', categoria: 'otra', estado: 'descartada',
    descripcion: 'En mi cuadra el bache sigue igual desde hace meses, nadie vino a arreglarlo todavía y ya reclamé dos veces.',
    creada: '2026-10-05T13:30:00-03:00', revisada: '2026-10-06T09:10:00-03:00',
  },
]
