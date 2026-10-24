import { GENESIS, MIN_PUNTOS_REFERENCIA, hashDecision, mediana, semaforoDesvio, totalCotizacion } from '../calculos'
import { ErrorApi } from '../errores'
import { fechaCierre, formatoMoneda } from '../format'
import * as mock from '../mock'
import { ocultarBusqueda, type Fuente, type RespuestaCotizaciones } from '../publicacion'
import type { CotizacionInput } from '../schemas'
import { canonico, sha256 } from '../sha256'
import type {
  BusquedaAgente,
  ConfirmacionCotizacion,
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
    const filas = await db()`SELECT id, nombre, cuit FROM proveedores ORDER BY nombre`
    return filas as Proveedor[]
  })
}

export function listarLicitaciones() {
  return consultar(async () => {
    const filas = await db()`
      SELECT id, descripcion, partida_id, estado, fecha_cierre, monto_estimado, proveedor_adjudicado_id
      FROM licitaciones ORDER BY fecha_cierre DESC`
    return filas.map((f) => sinNulos<Licitacion>(f))
  })
}

async function buscarLicitacion(id: string) {
  const [fila] = await db()`
    SELECT id, descripcion, partida_id, estado, fecha_cierre, monto_estimado, proveedor_adjudicado_id
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

export const fuenteDb: Fuente = {
  partidas: listarPartidas,
  proveedores: listarProveedores,
  licitaciones: listarLicitaciones,
  cotizaciones: listarCotizaciones,
  busquedas: listarBusquedas,
  decisiones: listarDecisiones,
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
      sql`SELECT id, nombre, cuit FROM proveedores`,
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
      ...mock.proveedores.map(
        (p) => sql`INSERT INTO proveedores (id, nombre, cuit) VALUES (${p.id}, ${p.nombre}, ${p.cuit}) ON CONFLICT DO NOTHING`,
      ),
      ...mock.licitaciones.map(
        (l) => sql`INSERT INTO licitaciones (id, descripcion, partida_id, estado, fecha_cierre, monto_estimado, proveedor_adjudicado_id)
                   VALUES (${l.id}, ${l.descripcion}, ${l.partida_id}, ${l.estado}, ${l.fecha_cierre}, ${l.monto_estimado},
                           ${l.proveedor_adjudicado_id ?? null}) ON CONFLICT (id) DO NOTHING`,
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
    ]
    await sql.transaction(consultas)

    const [conteo] = await sql`
      SELECT (SELECT count(*) FROM partidas)::int AS partidas, (SELECT count(*) FROM proveedores)::int AS proveedores,
             (SELECT count(*) FROM licitaciones)::int AS licitaciones, (SELECT count(*) FROM cotizaciones)::int AS cotizaciones,
             (SELECT count(*) FROM busquedas)::int AS busquedas, (SELECT count(*) FROM decisiones)::int AS decisiones`
    return conteo as Record<string, number>
  })
}
