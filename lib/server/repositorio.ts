import { GENESIS, MIN_PUNTOS_REFERENCIA, hashDecision, mediana, semaforoDesvio, totalCotizacion } from '../calculos'
import { ErrorApi } from '../errores'
import { fechaCierre, formatoMoneda } from '../format'
import * as mock from '../mock'
import { ocultarBusqueda, type Fuente, type RespuestaCotizaciones } from '../publicacion'
import type { CotizacionInput, ObservacionInput } from '../schemas'
import { canonico, sha256 } from '../sha256'
import type {
  BusquedaAgente,
  ConfirmacionCotizacion,
  ConfirmacionObservacion,
  ObservacionPublica,
  SeguimientoObservacion,
  Cotizacion,
  CotizacionRegistrada,
  Decision,
  EstadoDecision,
  FuenteReferencia,
  Licitacion,
  Partida,
  Proveedor,
} from '../types'
import { db, traducirError } from './db'

type Fila = Record<string, unknown>

/** Postgres devuelve null en columnas opcionales; los tipos (y los hashes) usan campos ausentes. */
function sinNulos<T>(fila: Fila): T {
  return Object.fromEntries(Object.entries(fila).filter(([, v]) => v !== null)) as T
}

async function consultar<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    throw traducirError(e)
  }
}

const porcentaje = (v: number) => `${(Math.abs(v) * 100).toFixed(1).replace('.', ',')} %`

/** ISO 8601 con offset de Argentina, igual al formato de los registros existentes. */
function isoArgentina(fecha: Date) {
  return `${new Date(fecha.getTime() - 3 * 3_600_000).toISOString().slice(0, 19)}-03:00`
}

// ---------- Lecturas ----------

export function listarPartidas() {
  return consultar(async () => {
    const filas = await db()`SELECT id, codigo, nombre, asignado, ejecutado FROM partidas ORDER BY codigo`
    return filas as Partida[]
  })
}

export function listarProveedores() {
  return consultar(async () => {
    const filas = await db()`SELECT id, nombre, cuit, fecha_alta FROM proveedores ORDER BY nombre`
    return filas.map((f) => sinNulos<Proveedor>(f))
  })
}

export function listarLicitaciones() {
  return consultar(async () => {
    const filas = await db()`
      SELECT id, descripcion, partida_id, estado, fecha_cierre, monto_estimado, proveedor_adjudicado_id, organismo, rubro
      FROM licitaciones ORDER BY fecha_cierre DESC`
    return filas.map((f) => sinNulos<Licitacion>(f))
  })
}

async function buscarLicitacion(id: string) {
  const [fila] = await db()`
    SELECT id, descripcion, partida_id, estado, fecha_cierre, monto_estimado, proveedor_adjudicado_id, organismo, rubro
    FROM licitaciones WHERE id = ${id}`
  if (!fila) throw new ErrorApi(404, `No existe el pedido ${id}`)
  return sinNulos<Licitacion>(fila)
}

async function cotizacionesDe(pedidoId: string) {
  const filas = await db()`
    SELECT id, hash, pedido_id, proveedor_id, cuit, fecha_emision, validez_dias, moneda,
           tipo_cambio_usado, origen, fuente, adjunto_url, items, condiciones
    FROM cotizaciones WHERE pedido_id = ${pedidoId} ORDER BY recibida, id`
  return filas.map((f) => sinNulos<CotizacionRegistrada>(f))
}

/** Mientras el pedido esté abierto solo se informa la cantidad de ofertas. */
export function listarCotizaciones(pedidoId: string): Promise<RespuestaCotizaciones> {
  return consultar(async () => {
    const licitacion = await buscarLicitacion(pedidoId)
    if (licitacion.estado === 'abierto') {
      const [{ cantidad }] = await db()`SELECT count(*)::int AS cantidad FROM cotizaciones WHERE pedido_id = ${pedidoId}`
      return { pedido_id: pedidoId, estado: 'abierto', cantidad: cantidad as number }
    }
    return cotizacionesDe(pedidoId)
  })
}

async function busquedasDe(pedidoId: string) {
  const filas = await db()`
    SELECT id, pedido_id, agente, fecha, canal, consulta, destino, resultado, precio, cotizacion_id, nota
    FROM busquedas WHERE pedido_id = ${pedidoId} ORDER BY fecha::timestamptz, id`
  return filas.map((f) => ({ ...sinNulos<BusquedaAgente>(f), destino: (f.destino as string | null) ?? null }))
}

export function listarBusquedas(pedidoId: string) {
  return consultar(async () => {
    const licitacion = await buscarLicitacion(pedidoId)
    const busquedas = await busquedasDe(pedidoId)
    return licitacion.estado === 'abierto' ? busquedas.map(ocultarBusqueda) : busquedas
  })
}

const SELECT_DECISION = `
  SELECT id, pedido_id, fecha, estado, motivo, referencia,
         saldo_partida_antes, saldo_partida_despues, hash_prev, hash
  FROM decisiones`

export function listarDecisiones() {
  return consultar(async () => {
    const filas = await db().query(`${SELECT_DECISION} ORDER BY fecha::timestamptz, id`)
    return filas as Decision[]
  })
}

const isoUtc = (v: unknown) => new Date(v as string).toISOString()

/** Solo publicadas, y sin contacto ni código: nada que permita identificar a quien observó. */
export function listarObservacionesPublicadas(licitacionId: string) {
  return consultar(async () => {
    const filas = await db()`
      SELECT licitacion_id, categoria, descripcion, evidencia_url, creada
      FROM observaciones WHERE licitacion_id = ${licitacionId} AND estado = 'publicada'
      ORDER BY creada DESC`
    return filas.map((f) => sinNulos<ObservacionPublica>({ ...f, creada: isoUtc(f.creada) }))
  })
}

export function consultarSeguimiento(codigo: string) {
  return consultar(async () => {
    const [fila] = await db()`
      SELECT codigo, licitacion_id, categoria, estado, creada, revisada
      FROM observaciones WHERE codigo = ${codigo}`
    if (!fila) throw new ErrorApi(404, `No encontramos una observación con el código ${codigo}`)
    return sinNulos<SeguimientoObservacion>({
      ...fila,
      creada: isoUtc(fila.creada),
      revisada: fila.revisada ? isoUtc(fila.revisada) : null,
    })
  })
}

export const LIMITE_OBSERVACIONES_POR_HORA = 3

// Sin I, O, 0 ni 1: el código se dicta y se copia a mano.
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generarCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const c = Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('')
  return `CC-${c.slice(0, 4)}-${c.slice(4)}`
}

/** La IP nunca se guarda: solo un hash con pimienta, suficiente para contar envíos por hora. */
export function hashIp(ip: string) {
  return sha256(`observaciones:${process.env.SEED_TOKEN ?? ''}:${ip}`)
}

export function registrarObservacion(
  entrada: Omit<ObservacionInput, 'sitio_web'>,
  ipHash: string,
): Promise<ConfirmacionObservacion> {
  return consultar(async () => {
    const sql = db()
    await buscarLicitacion(entrada.licitacion_id)
    const [{ recientes }] = await sql`
      SELECT count(*)::int AS recientes FROM observaciones
      WHERE ip_hash = ${ipHash} AND creada > now() - interval '1 hour'`
    if ((recientes as number) >= LIMITE_OBSERVACIONES_POR_HORA) {
      throw new ErrorApi(429, 'Llegaste al límite de 3 observaciones por hora. Probá de nuevo más tarde.')
    }

    for (let intento = 0; intento < 3; intento++) {
      const codigo = generarCodigo()
      const [fila] = await sql`
        INSERT INTO observaciones (codigo, licitacion_id, categoria, descripcion, evidencia_url, contacto,
                                   acepta_publicacion, estado, ip_hash)
        VALUES (${codigo}, ${entrada.licitacion_id}, ${entrada.categoria}, ${entrada.descripcion},
                ${entrada.evidencia_url ?? null}, ${entrada.contacto ?? null}, true, 'pendiente', ${ipHash})
        ON CONFLICT (codigo) DO NOTHING
        RETURNING creada`
      if (fila) return { codigo, estado: 'pendiente', creada: isoUtc(fila.creada) }
    }
    throw new Error('No se pudo generar un código de seguimiento único')
  })
}

export const fuenteDb: Fuente = {
  partidas: listarPartidas,
  proveedores: listarProveedores,
  licitaciones: listarLicitaciones,
  cotizaciones: listarCotizaciones,
  busquedas: listarBusquedas,
  decisiones: listarDecisiones,
  observaciones: listarObservacionesPublicadas,
}

// ---------- Escrituras ----------

export function registrarCotizacion(entrada: CotizacionInput): Promise<ConfirmacionCotizacion> {
  return consultar(async () => {
    const sql = db()
    const licitacion = await buscarLicitacion(entrada.pedido_id)
    if (licitacion.estado !== 'abierto') {
      throw new ErrorApi(409, `El pedido ${licitacion.id} ya no recibe ofertas (estado: ${licitacion.estado})`)
    }
    if (Date.now() > fechaCierre(licitacion.fecha_cierre).getTime()) {
      throw new ErrorApi(409, `El pedido ${licitacion.id} venció el ${licitacion.fecha_cierre}`)
    }

    // Un CUIT ya registrado siempre se asocia a su proveedor, sin importar el id que mande el cliente.
    const [registrado] = await sql`SELECT id FROM proveedores WHERE cuit = ${entrada.cuit}`
    const datos: Cotizacion = {
      ...entrada,
      proveedor_id: (registrado?.id as string | undefined) ?? `PROV-${entrada.cuit}`,
      origen: 'portal',
      ...(entrada.moneda === 'ARS' ? { tipo_cambio_usado: undefined } : {}),
    }
    const limpio = JSON.parse(JSON.stringify(datos)) as Cotizacion
    const hash = sha256(canonico(limpio))
    const id = `COT-${hash.slice(0, 8).toUpperCase()}`

    try {
      const [fila] = await sql`
        INSERT INTO cotizaciones (id, hash, pedido_id, proveedor_id, cuit, fecha_emision, validez_dias, moneda,
                                  tipo_cambio_usado, origen, fuente, adjunto_url, items, condiciones)
        VALUES (${id}, ${hash}, ${limpio.pedido_id}, ${limpio.proveedor_id}, ${limpio.cuit}, ${limpio.fecha_emision},
                ${limpio.validez_dias}, ${limpio.moneda}, ${limpio.tipo_cambio_usado ?? null}, 'portal',
                ${limpio.fuente ?? null}, ${limpio.adjunto_url ?? null},
                ${JSON.stringify(limpio.items)}::jsonb, ${JSON.stringify(limpio.condiciones)}::jsonb)
        RETURNING recibida`
      return { id, hash, recibida: new Date(fila.recibida as string).toISOString() }
    } catch (e) {
      const error = traducirError(e)
      if (error instanceof ErrorApi && error.status === 409) {
        throw new ErrorApi(409, 'Ya se recibió una cotización idéntica para este pedido')
      }
      throw error
    }
  })
}

interface Evaluacion {
  estado: EstadoDecision
  motivo: string
  ganadora: (CotizacionRegistrada & { total: number }) | null
}

function evaluar(
  ofertas: (CotizacionRegistrada & { total: number })[],
  referencia: number,
  puntos: number,
  saldo: number,
  partida: Partida,
  nombre: (id: string) => string,
): Evaluacion {
  if (ofertas.length === 0) {
    return { estado: 'rechazado', motivo: 'No se recibieron ofertas dentro del plazo.', ganadora: null }
  }
  const ganadora = ofertas[0]
  const desvio = referencia > 0 ? (ganadora.total - referencia) / referencia : 0
  const relacion = `${porcentaje(desvio)} ${desvio <= 0 ? 'por debajo' : 'por encima'} de la referencia`

  if (ganadora.total > saldo) {
    return {
      estado: 'rechazado',
      motivo: `Saldo insuficiente en la partida ${partida.codigo}: disponible ${formatoMoneda(saldo)} frente a una oferta de ${formatoMoneda(ganadora.total)}.`,
      ganadora,
    }
  }
  if (puntos < MIN_PUNTOS_REFERENCIA) {
    return {
      estado: 'observado',
      motivo: `La referencia no es concluyente (solo ${puntos} ${puntos === 1 ? 'punto' : 'puntos'} de comparación; se requieren ${MIN_PUNTOS_REFERENCIA}). Se solicita ampliar la búsqueda de precios antes de adjudicar.`,
      ganadora,
    }
  }
  if (!ganadora.condiciones.iva_incluido) {
    return {
      estado: 'observado',
      motivo: `La oferta de menor monto (${nombre(ganadora.proveedor_id)}) no incluye IVA. Se solicita aclaración de condiciones antes de adjudicar.`,
      ganadora,
    }
  }
  if (semaforoDesvio(desvio) === 'rojo') {
    return {
      estado: 'observado',
      motivo: `La oferta de menor monto (${nombre(ganadora.proveedor_id)}) está ${relacion}. Se solicita justificación del precio antes de adjudicar.`,
      ganadora,
    }
  }
  return {
    estado: 'aprobado',
    motivo: `Se adjudica a ${nombre(ganadora.proveedor_id)}, oferta de menor monto total (${relacion}). Se verificó saldo suficiente en la partida ${partida.codigo}.`,
    ganadora,
  }
}

export function cerrarLicitacion(id: string, ahora = new Date()): Promise<Decision> {
  return consultar(async () => {
    const sql = db()
    const licitacion = await buscarLicitacion(id)
    if (licitacion.estado !== 'abierto') throw new ErrorApi(409, `El pedido ${id} ya fue cerrado (${licitacion.estado})`)
    if (ahora.getTime() < fechaCierre(licitacion.fecha_cierre).getTime()) {
      throw new ErrorApi(409, `El pedido ${id} recibe ofertas hasta el ${licitacion.fecha_cierre}; no puede cerrarse antes`)
    }

    const [[partida], provs, cotizaciones, busquedas, [ultima], [{ cantidad }]] = await Promise.all([
      sql`SELECT id, codigo, nombre, asignado, ejecutado FROM partidas WHERE id = ${licitacion.partida_id}`,
      sql`SELECT id, nombre, cuit, fecha_alta FROM proveedores`,
      cotizacionesDe(id),
      busquedasDe(id),
      sql`SELECT hash FROM decisiones ORDER BY fecha::timestamptz DESC, id DESC LIMIT 1`,
      sql`SELECT count(*)::int AS cantidad FROM decisiones`,
    ])
    const p = partida as Partida
    const nombre = (pid: string) => (provs as Proveedor[]).find((x) => x.id === pid)?.nombre ?? pid

    const ofertas = cotizaciones
      .map((c) => ({ ...c, total: totalCotizacion(c) }))
      .sort((a, b) => a.total - b.total)
    const fuentes: FuenteReferencia[] = busquedas
      .filter((b) => b.resultado === 'referencia' && typeof b.precio === 'number')
      .map((b) => ({ url: b.destino ?? b.consulta, fecha: b.fecha.slice(0, 10), precio: b.precio as number }))
    const valores = [...ofertas.map((o) => o.total), ...fuentes.map((f) => f.precio)]
    const referencia = mediana(valores)
    const saldo = p.asignado - p.ejecutado

    const { estado, motivo, ganadora } = evaluar(ofertas, referencia, valores.length, saldo, p, nombre)
    const adjudicada = estado === 'aprobado' && ganadora ? ganadora : null

    const sinHash: Omit<Decision, 'hash'> = {
      id: `DEC-${ahora.getFullYear()}-${String((cantidad as number) + 1).padStart(3, '0')}`,
      pedido_id: id,
      fecha: isoArgentina(ahora),
      estado,
      motivo,
      referencia: {
        valor: referencia,
        metodo: `Mediana de ${valores.length} valores (${ofertas.length} ofertas y ${fuentes.length} fuentes externas)`,
        fuentes,
      },
      saldo_partida_antes: saldo,
      saldo_partida_despues: adjudicada ? saldo - adjudicada.total : saldo,
      hash_prev: (ultima?.hash as string | undefined) ?? GENESIS,
    }
    const decision: Decision = { ...sinHash, hash: hashDecision(sinHash) }

    // hash_prev y pedido_id son UNIQUE: si otro cierre ganó la carrera, la transacción entera falla.
    await sql.transaction([
      ...(adjudicada
        ? [
            sql`INSERT INTO proveedores (id, nombre, cuit) VALUES (${adjudicada.proveedor_id}, ${`Proveedor CUIT ${adjudicada.cuit}`}, ${adjudicada.cuit})
                ON CONFLICT DO NOTHING`,
          ]
        : []),
      sql`INSERT INTO decisiones (id, pedido_id, fecha, estado, motivo, referencia, saldo_partida_antes,
                                  saldo_partida_despues, hash_prev, hash)
          VALUES (${decision.id}, ${id}, ${decision.fecha}, ${estado}, ${motivo}, ${JSON.stringify(decision.referencia)}::jsonb,
                  ${decision.saldo_partida_antes}, ${decision.saldo_partida_despues}, ${decision.hash_prev}, ${decision.hash})`,
      sql`UPDATE licitaciones SET estado = ${estado}, proveedor_adjudicado_id = ${adjudicada?.proveedor_id ?? null}
          WHERE id = ${id} AND estado = 'abierto'`,
      ...(adjudicada ? [sql`UPDATE partidas SET ejecutado = ejecutado + ${adjudicada.total} WHERE id = ${p.id}`] : []),
    ])
    return decision
  })
}

/** Carga idempotente de los datos sintéticos: lo que ya existe no se toca. */
export function sembrar() {
  return consultar(async () => {
    const sql = db()
    const consultas = [
      ...mock.partidas.map(
        (p) => sql`INSERT INTO partidas (id, codigo, nombre, asignado, ejecutado)
                   VALUES (${p.id}, ${p.codigo}, ${p.nombre}, ${p.asignado}, ${p.ejecutado}) ON CONFLICT (id) DO NOTHING`,
      ),
      // Las columnas agregadas después (fecha_alta, organismo, rubro) se completan si están vacías;
      // el resto de lo ya existente no se toca.
      ...mock.proveedores.map(
        (p) => sql`INSERT INTO proveedores (id, nombre, cuit, fecha_alta) VALUES (${p.id}, ${p.nombre}, ${p.cuit}, ${p.fecha_alta ?? null})
                   ON CONFLICT (id) DO UPDATE SET fecha_alta = COALESCE(proveedores.fecha_alta, EXCLUDED.fecha_alta)`,
      ),
      ...mock.licitaciones.map(
        (l) => sql`INSERT INTO licitaciones (id, descripcion, partida_id, estado, fecha_cierre, monto_estimado,
                                             proveedor_adjudicado_id, organismo, rubro)
                   VALUES (${l.id}, ${l.descripcion}, ${l.partida_id}, ${l.estado}, ${l.fecha_cierre}, ${l.monto_estimado},
                           ${l.proveedor_adjudicado_id ?? null}, ${l.organismo ?? null}, ${l.rubro ?? null})
                   ON CONFLICT (id) DO UPDATE SET organismo = COALESCE(licitaciones.organismo, EXCLUDED.organismo),
                                                  rubro = COALESCE(licitaciones.rubro, EXCLUDED.rubro)`,
      ),
      ...mock.cotizaciones.map(
        (c) => sql`INSERT INTO cotizaciones (id, hash, pedido_id, proveedor_id, cuit, fecha_emision, validez_dias, moneda,
                                             tipo_cambio_usado, origen, fuente, adjunto_url, items, condiciones)
                   VALUES (${c.id}, ${c.hash}, ${c.pedido_id}, ${c.proveedor_id}, ${c.cuit}, ${c.fecha_emision}, ${c.validez_dias},
                           ${c.moneda}, ${c.tipo_cambio_usado ?? null}, ${c.origen}, ${c.fuente ?? null}, ${c.adjunto_url ?? null},
                           ${JSON.stringify(c.items)}::jsonb, ${JSON.stringify(c.condiciones)}::jsonb) ON CONFLICT DO NOTHING`,
      ),
      ...mock.busquedas.map(
        (b) => sql`INSERT INTO busquedas (id, pedido_id, agente, fecha, canal, consulta, destino, resultado, precio, cotizacion_id, nota)
                   VALUES (${b.id}, ${b.pedido_id}, ${b.agente}, ${b.fecha}, ${b.canal}, ${b.consulta}, ${b.destino},
                           ${b.resultado}, ${b.precio ?? null}, ${b.cotizacion_id ?? null}, ${b.nota ?? null}) ON CONFLICT (id) DO NOTHING`,
      ),
      ...mock.registro.map(
        (d) => sql`INSERT INTO decisiones (id, pedido_id, fecha, estado, motivo, referencia, saldo_partida_antes,
                                           saldo_partida_despues, hash_prev, hash)
                   VALUES (${d.id}, ${d.pedido_id}, ${d.fecha}, ${d.estado}, ${d.motivo}, ${JSON.stringify(d.referencia)}::jsonb,
                           ${d.saldo_partida_antes}, ${d.saldo_partida_despues}, ${d.hash_prev}, ${d.hash}) ON CONFLICT DO NOTHING`,
      ),
      ...mock.observaciones.map(
        (o) => sql`INSERT INTO observaciones (codigo, licitacion_id, categoria, descripcion, evidencia_url, acepta_publicacion,
                                              estado, ip_hash, creada, revisada)
                   VALUES (${o.codigo}, ${o.licitacion_id}, ${o.categoria}, ${o.descripcion}, ${o.evidencia_url ?? null}, true,
                           ${o.estado}, 'semilla', ${o.creada}::timestamptz, ${o.revisada ?? null}::timestamptz)
                   ON CONFLICT (codigo) DO NOTHING`,
      ),
    ]
    await sql.transaction(consultas)

    const [conteo] = await sql`
      SELECT (SELECT count(*) FROM partidas)::int AS partidas, (SELECT count(*) FROM proveedores)::int AS proveedores,
             (SELECT count(*) FROM licitaciones)::int AS licitaciones, (SELECT count(*) FROM cotizaciones)::int AS cotizaciones,
             (SELECT count(*) FROM busquedas)::int AS busquedas, (SELECT count(*) FROM decisiones)::int AS decisiones,
             (SELECT count(*) FROM observaciones)::int AS observaciones`
    return conteo as Record<string, number>
  })
}
