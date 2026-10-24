'use client'

import { ArrowRight, Bot, ChevronDown, Info, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { selectClass } from '@/components/form-styles'
import { Input } from '@/components/ui/input'
import { PROMPT_SINTESIS } from '@/lib/agentes'
import { MIN_PUNTOS_REFERENCIA } from '@/lib/calculos'
import { cn } from '@/lib/utils'

const MODELOS = [
  { id: 'claude-haiku-5-5', etiqueta: 'Claude Haiku 5.5', nota: 'Rápido y económico' },
  { id: 'claude-sonnet-5-5', etiqueta: 'Claude Sonnet 5.5', nota: 'Equilibrado' },
  { id: 'claude-opus-5-5', etiqueta: 'Claude Opus 5.5', nota: 'Máxima capacidad de análisis' },
] as const

type Agente = {
  id: string
  nombre: string
  canal: string
  fuentes: string
  consulta: string
  modelo: (typeof MODELOS)[number]['id']
  prompt: string
  activo: boolean
  /** Agente de análisis (no busca precios): se muestra con otro ícono. */
  analisis?: boolean
}
type Paso = { id: string; titulo: string; detalle: string; parametro?: { label: string; valor: string; unidad: string } }

const AGENTES_INICIALES: Agente[] = [
  {
    id: 'web',
    nombre: 'Agente de precios web',
    canal: 'Web',
    fuentes: 'Comercios y marketplaces públicos',
    consulta: 'Precio de lista de {descripcion} en Argentina, con IVA',
    modelo: 'claude-haiku-5-5',
    prompt:
      'Sos un agente que busca precios de referencia en la web para compras públicas argentinas. Buscá el precio de lista del producto pedido, con IVA incluido y en pesos. Descartá resultados sin fecha, sin precio visible o de otra región. Registrá siempre la URL y la fecha de la consulta. Si no encontrás al menos un precio confiable, respondé "sin resultado"; no estimes ni inventes valores.',
    activo: true,
  },
  {
    id: 'correo',
    nombre: 'Agente de pedidos por correo',
    canal: 'Correo',
    fuentes: 'Proveedores inscriptos en el rubro',
    consulta: 'Solicitud de cotización de {descripcion}, cantidad {cantidad}',
    modelo: 'claude-haiku-5-5',
    prompt:
      'Sos un agente que redacta y registra pedidos de cotización por correo a proveedores inscriptos en el rubro. Escribí un mensaje breve y formal con la descripción, la cantidad y la fecha límite de respuesta. No negocies ni adelantes montos estimados. Registrá cada envío y cada respuesta recibida, o la ausencia de respuesta.',
    activo: true,
  },
  {
    id: 'catalogo',
    nombre: 'Agente de catálogos',
    canal: 'Catálogo',
    fuentes: 'Catálogos de convenios marco',
    consulta: 'Buscar {descripcion} en catálogos vigentes',
    modelo: 'claude-sonnet-5-5',
    prompt:
      'Sos un agente que consulta catálogos de convenios marco vigentes. Buscá el producto pedido, compará especificaciones equivalentes y devolvé precio, proveedor y vigencia del catálogo. Si hay más de una variante posible, listalas todas y no elijas una por tu cuenta.',
    activo: true,
  },
  {
    id: 'mensajeria',
    nombre: 'Agente de mensajería',
    canal: 'Mensajería',
    fuentes: 'Contactos comerciales verificados',
    consulta: 'Consulta de disponibilidad y precio de {descripcion}',
    modelo: 'claude-haiku-5-5',
    prompt:
      'Sos un agente que consulta disponibilidad y precio por mensajería a contactos comerciales verificados. Mantené un tono formal y breve. Registrá la respuesta textual y descartá cualquier precio que no incluya condiciones de entrega e IVA.',
    activo: false,
  },
  {
    id: 'sintesis',
    nombre: 'Agente de síntesis y dictamen',
    canal: 'Análisis interno',
    fuentes: 'Ofertas publicadas, señales de alerta y referencia',
    consulta: 'Sintetizar {licitacion} con sus señales y su desvío',
    modelo: 'claude-opus-5-5',
    prompt: PROMPT_SINTESIS,
    activo: true,
    analisis: true,
  },
]

const PASOS: Paso[] = [
  { id: 'publicar', titulo: 'Publicar pedido', detalle: 'El funcionario carga la licitación y queda abierta.' },
  {
    id: 'buscar',
    titulo: 'Búsqueda de precios',
    detalle: 'Los agentes activos consultan sus fuentes y registran cada búsqueda.',
    parametro: { label: 'Puntos mínimos de referencia', valor: String(MIN_PUNTOS_REFERENCIA), unidad: 'precios' },
  },
  { id: 'sellar', titulo: 'Ofertas selladas', detalle: 'Cada cotización recibe un hash y no se muestra hasta el cierre.' },
  { id: 'cierre', titulo: 'Cierre y dictamen', detalle: 'Se compara contra la referencia y se emite una decisión encadenada.' },
  {
    id: 'senales',
    titulo: 'Señales de alerta',
    detalle: 'Concentración, oferta única, fraccionamiento y proveedor nuevo.',
    parametro: { label: 'Desvío que dispara observación', valor: '25', unidad: '%' },
  },
]

export function ConfiguracionAgentes() {
  const [agentes, setAgentes] = useState(AGENTES_INICIALES)
  const [parametros, setParametros] = useState<Record<string, string>>(
    Object.fromEntries(PASOS.filter((p) => p.parametro).map((p) => [p.id, p.parametro!.valor])),
  )
  const [guardado, setGuardado] = useState(false)

  const cambiar = (id: string, parche: Partial<Agente>) => {
    setAgentes((a) => a.map((x) => (x.id === id ? { ...x, ...parche } : x)))
    setGuardado(false)
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="flex items-start gap-2 rounded-md border border-border bg-info-soft p-3 text-sm text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        Configuración de demostración: muestra dónde el organismo ajustaría a los agentes y al flujo. Los cambios no se
        guardan ni afectan las licitaciones existentes.
      </p>

      <section aria-labelledby="titulo-flujo" className="flex flex-col gap-4">
        <h2 id="titulo-flujo" className="text-lg font-semibold tracking-tight">
          Flujo de una licitación
        </h2>
        <ol className="grid gap-3 lg:grid-cols-5">
          {PASOS.map((p, i) => (
            <li key={p.id} className="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <span className="font-mono text-xs text-muted-foreground">Paso {i + 1}</span>
              <h3 className="text-sm font-semibold">{p.titulo}</h3>
              <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{p.detalle}</p>
              {p.parametro && (
                <label className="mt-auto flex flex-col gap-1 text-xs font-medium">
                  {p.parametro.label}
                  <span className="flex items-center gap-2">
                    <Input
                      value={parametros[p.id]}
                      inputMode="numeric"
                      onChange={(e) => {
                        setParametros((v) => ({ ...v, [p.id]: e.target.value }))
                        setGuardado(false)
                      }}
                      className="w-20 font-mono"
                    />
                    <span className="font-normal text-muted-foreground">{p.parametro.unidad}</span>
                  </span>
                </label>
              )}
              {i < PASOS.length - 1 && (
                <ArrowRight
                  className="absolute -right-2.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-background text-muted-foreground lg:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="titulo-agentes" className="flex flex-col gap-4">
        <h2 id="titulo-agentes" className="text-lg font-semibold tracking-tight">
          Agentes de búsqueda y análisis
        </h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Los modelos y prompts son una vista de configuración de demostración: todavía no se ejecutan.
        </p>
        <ul className="grid gap-4 md:grid-cols-2">
          {agentes.map((a) => (
            <li
              key={a.id}
              className={cn('flex flex-col gap-3 rounded-lg border bg-card p-4', a.activo ? 'border-border' : 'border-dashed')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-info-soft text-primary">
                    {a.analisis ? (
                      <Sparkles className="size-4" aria-hidden="true" />
                    ) : (
                      <Bot className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <h3 className="text-sm font-semibold">{a.nombre}</h3>
                    <span className="text-xs text-muted-foreground">Canal: {a.canal}</span>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={a.activo}
                    onChange={(e) => cambiar(a.id, { activo: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                  {a.activo ? 'Activo' : 'Inactivo'}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Fuentes: {a.fuentes}</p>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Consulta base
                <Input
                  value={a.consulta}
                  disabled={!a.activo}
                  onChange={(e) => cambiar(a.id, { consulta: e.target.value })}
                  className="font-mono text-xs"
                />
              </label>
              <details className="group rounded-md border border-border bg-muted/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium [&::-webkit-details-marker]:hidden">
                  <span>
                    Modelo y prompt
                    <span className="ml-2 font-normal text-muted-foreground">
                      {MODELOS.find((m) => m.id === a.modelo)?.etiqueta}
                    </span>
                  </span>
                  <ChevronDown
                    className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="flex flex-col gap-3 border-t border-border p-3">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Modelo
                    <select
                      value={a.modelo}
                      disabled={!a.activo}
                      onChange={(e) => cambiar(a.id, { modelo: e.target.value as Agente['modelo'] })}
                      className={selectClass}
                    >
                      {MODELOS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.etiqueta} · {m.nota}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Prompt del agente
                    <textarea
                      value={a.prompt}
                      disabled={!a.activo}
                      rows={6}
                      onChange={(e) => cambiar(a.id, { prompt: e.target.value })}
                      className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-xs font-normal leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
                    />
                  </label>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setGuardado(true)}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Guardar configuración
        </button>
        {guardado && (
          <p role="status" className="text-sm text-muted-foreground">
            Guardada en la sesión de demostración.
          </p>
        )}
      </div>
    </div>
  )
}
