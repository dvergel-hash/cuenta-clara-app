'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { selectClass } from '@/components/form-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enviarCotizacion } from '@/lib/api'
import { formatoFecha, formatoMoneda } from '@/lib/format'
import { cotizacionSchema } from '@/lib/schemas'
import type { ConfirmacionCotizacion, Cotizacion } from '@/lib/types'
import { Campo } from './campo'
import { Confirmacion } from './confirmacion'

type PedidoOpcion = { id: string; descripcion: string; cierre: string }
type ItemForm = { key: number; descripcion: string; sku_modelo: string; cantidad: string; unidad: string; precio_unitario: string }
type Errores = Record<string, string>

const MAX_ADJUNTO = 10 * 1024 * 1024

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v.replace(',', '.')))
const itemVacio = (key: number): ItemForm => ({
  key,
  descripcion: '',
  sku_modelo: '',
  cantidad: '',
  unidad: 'unidad',
  precio_unitario: '',
})

export function FormularioCotizacion({ pedidos, pedidoInicial }: { pedidos: PedidoOpcion[]; pedidoInicial: string }) {
  const uid = useId()
  const [pedidoId, setPedidoId] = useState(pedidoInicial)
  const [cuit, setCuit] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [tipoCambio, setTipoCambio] = useState('')
  const [validez, setValidez] = useState('30')
  const [items, setItems] = useState<ItemForm[]>([itemVacio(0)])
  const [siguienteKey, setSiguienteKey] = useState(1)
  const [ivaIncluido, setIvaIncluido] = useState(true)
  const [plazo, setPlazo] = useState('')
  const [formaPago, setFormaPago] = useState('')
  const [garantia, setGarantia] = useState('')
  const [adjunto, setAdjunto] = useState<File | null>(null)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<(ConfirmacionCotizacion & { pedido: string; total: number }) | null>(null)

  const pedido = pedidos.find((p) => p.id === pedidoId)
  const tc = moneda === 'USD' ? num(tipoCambio) : 1
  const total = items.reduce((s, i) => s + (num(i.cantidad) || 0) * (num(i.precio_unitario) || 0), 0)

  function actualizarItem(key: number, campo: keyof Omit<ItemForm, 'key'>, valor: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [campo]: valor } : i)))
  }

  function agregarItem() {
    setItems((prev) => [...prev, itemVacio(siguienteKey)])
    setSiguienteKey((k) => k + 1)
  }

  function construir(): Cotizacion {
    return {
      pedido_id: pedidoId,
      proveedor_id: cuit ? `PROV-${cuit}` : '',
      cuit,
      fecha_emision: new Date().toISOString().slice(0, 10),
      validez_dias: num(validez),
      moneda,
      tipo_cambio_usado: moneda === 'USD' && tipoCambio.trim() !== '' ? num(tipoCambio) : undefined,
      origen: 'portal',
      adjunto_url: adjunto?.name,
      items: items.map((i) => ({
        descripcion: i.descripcion,
        sku_modelo: i.sku_modelo.trim() || undefined,
        cantidad: num(i.cantidad),
        unidad: i.unidad,
        precio_unitario: num(i.precio_unitario),
      })),
      condiciones: {
        iva_incluido: ivaIncluido,
        plazo_entrega_dias: num(plazo),
        forma_pago: formaPago,
        garantia,
      },
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorEnvio(null)
    const datos = construir()
    const resultado = cotizacionSchema.safeParse(datos)
    const nuevos: Errores = {}
    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const clave = issue.path.join('.')
        if (!nuevos[clave]) nuevos[clave] = issue.message
      }
    }
    if (adjunto && adjunto.size > MAX_ADJUNTO) nuevos.adjunto_url = 'El adjunto no puede superar 10 MB'
    setErrores(nuevos)

    if (Object.keys(nuevos).length > 0) {
      const primero = Object.keys(nuevos)[0]
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-campo="${primero}"]`)?.focus())
      return
    }

    setEnviando(true)
    try {
      const r = await enviarCotizacion(datos)
      setConfirmacion({ ...r, pedido: pedidoId, total: total * (moneda === 'USD' ? tc : 1) })
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo enviar la cotización')
    } finally {
      setEnviando(false)
    }
  }

  if (confirmacion) {
    return (
      <Confirmacion
        confirmacion={confirmacion}
        onNueva={() => {
          setConfirmacion(null)
          setItems([itemVacio(siguienteKey)])
          setSiguienteKey((k) => k + 1)
          setAdjunto(null)
        }}
      />
    )
  }

  const err = (clave: string) => errores[clave]

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
      <div className="flex flex-col gap-8">
        <Seccion titulo="Pedido y proveedor">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id={`${uid}-pedido`} label="Pedido" error={err('pedido_id')} className="sm:col-span-2">
              {(p) => (
                <select {...p} data-campo="pedido_id" className={selectClass} value={pedidoId} onChange={(e) => setPedidoId(e.target.value)}>
                  {pedidos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} · {o.descripcion}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo id={`${uid}-cuit`} label="CUIT" hint="11 dígitos, sin guiones" error={err('cuit')}>
              {(p) => (
                <Input
                  {...p}
                  data-campo="cuit"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  className="font-mono"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                />
              )}
            </Campo>
            <Campo id={`${uid}-validez`} label="Validez de la oferta (días)" error={err('validez_dias')}>
              {(p) => <Input {...p} data-campo="validez_dias" type="number" min={1} step={1} value={validez} onChange={(e) => setValidez(e.target.value)} />}
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Moneda">
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">Moneda</legend>
              <div className="flex gap-2">
                {(['ARS', 'USD'] as const).map((m) => (
                  <label
                    key={m}
                    className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card text-sm font-medium has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/40"
                  >
                    <input type="radio" name="moneda" value={m} checked={moneda === m} onChange={() => setMoneda(m)} className="sr-only" />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>
            {moneda === 'USD' && (
              <Campo id={`${uid}-tc`} label="Tipo de cambio usado (ARS por USD)" error={err('tipo_cambio_usado')}>
                {(p) => (
                  <Input {...p} data-campo="tipo_cambio_usado" type="number" min={0} step="0.01" inputMode="decimal" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} />
                )}
              </Campo>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Ítems" descripcion={`Precios unitarios en ${moneda}.`}>
          {err('items') && <p className="text-sm text-danger">{err('items')}</p>}
          <ol className="flex flex-col gap-4">
            {items.map((item, idx) => {
              const base = `${uid}-item-${item.key}`
              const e = (c: string) => err(`items.${idx}.${c}`)
              return (
                <li key={item.key} className="flex flex-col gap-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xs font-medium text-muted-foreground">Ítem {idx + 1}</h3>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                      >
                        <Trash2 aria-hidden="true" />
                        Quitar<span className="sr-only"> ítem {idx + 1}</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-6">
                    <Campo id={`${base}-desc`} label="Descripción" error={e('descripcion')} className="sm:col-span-4">
                      {(p) => <Input {...p} data-campo={`items.${idx}.descripcion`} value={item.descripcion} onChange={(ev) => actualizarItem(item.key, 'descripcion', ev.target.value)} />}
                    </Campo>
                    <Campo id={`${base}-sku`} label="Modelo / SKU" optional className="sm:col-span-2">
                      {(p) => <Input {...p} className="font-mono" value={item.sku_modelo} onChange={(ev) => actualizarItem(item.key, 'sku_modelo', ev.target.value)} />}
                    </Campo>
                    <Campo id={`${base}-cant`} label="Cantidad" error={e('cantidad')} className="sm:col-span-2">
                      {(p) => <Input {...p} data-campo={`items.${idx}.cantidad`} type="number" min={0} step="any" inputMode="decimal" value={item.cantidad} onChange={(ev) => actualizarItem(item.key, 'cantidad', ev.target.value)} />}
                    </Campo>
                    <Campo id={`${base}-unidad`} label="Unidad" error={e('unidad')} className="sm:col-span-2">
                      {(p) => <Input {...p} data-campo={`items.${idx}.unidad`} value={item.unidad} onChange={(ev) => actualizarItem(item.key, 'unidad', ev.target.value)} />}
                    </Campo>
                    <Campo id={`${base}-precio`} label="Precio unitario" error={e('precio_unitario')} className="sm:col-span-2">
                      {(p) => <Input {...p} data-campo={`items.${idx}.precio_unitario`} type="number" min={0} step="0.01" inputMode="decimal" value={item.precio_unitario} onChange={(ev) => actualizarItem(item.key, 'precio_unitario', ev.target.value)} />}
                    </Campo>
                  </div>
                </li>
              )
            })}
          </ol>
          <Button type="button" variant="outline" onClick={agregarItem} className="w-fit">
            <Plus aria-hidden="true" />
            Agregar ítem
          </Button>
        </Seccion>

        <Seccion titulo="Condiciones">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
              <input type="checkbox" className="size-4 accent-primary" checked={ivaIncluido} onChange={(e) => setIvaIncluido(e.target.checked)} />
              Los precios incluyen IVA
            </label>
            <Campo id={`${uid}-plazo`} label="Plazo de entrega (días)" hint="0 si es inmediato" error={err('condiciones.plazo_entrega_dias')}>
              {(p) => <Input {...p} data-campo="condiciones.plazo_entrega_dias" type="number" min={0} step={1} value={plazo} onChange={(e) => setPlazo(e.target.value)} />}
            </Campo>
            <Campo id={`${uid}-pago`} label="Forma de pago" hint="Por ejemplo: 30 días fecha factura" error={err('condiciones.forma_pago')}>
              {(p) => <Input {...p} data-campo="condiciones.forma_pago" value={formaPago} onChange={(e) => setFormaPago(e.target.value)} />}
            </Campo>
            <Campo id={`${uid}-garantia`} label="Garantía" hint="Por ejemplo: 12 meses oficial" error={err('condiciones.garantia')} className="sm:col-span-2">
              {(p) => <Input {...p} data-campo="condiciones.garantia" value={garantia} onChange={(e) => setGarantia(e.target.value)} />}
            </Campo>
            <Campo id={`${uid}-adjunto`} label="Adjunto" hint="PDF o imagen, hasta 10 MB" optional error={err('adjunto_url')} className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  data-campo="adjunto_url"
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)}
                />
              )}
            </Campo>
          </div>
        </Seccion>
      </div>

      <aside className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-6">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumen</h2>
        {pedido && (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-mono font-medium">{pedido.id}</span>
            <span className="text-muted-foreground">Cierra el {formatoFecha(pedido.cierre)}</span>
          </div>
        )}
        <dl className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Total de la oferta</dt>
          <dd className="font-mono text-xl font-medium tabular-nums">
            {moneda === 'USD' ? `USD ${total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : formatoMoneda(total)}
          </dd>
          {moneda === 'USD' && Number.isFinite(tc) && tc > 0 && (
            <dd className="font-mono text-sm text-muted-foreground tabular-nums">≈ {formatoMoneda(total * tc)}</dd>
          )}
        </dl>
        <p className="text-xs leading-relaxed text-muted-foreground">Origen: portal. La oferta no es visible hasta el cierre.</p>
        <div aria-live="assertive" className="text-sm">
          {Object.keys(errores).length > 0 && <p className="text-danger">Revisá los campos marcados.</p>}
          {errorEnvio && <p className="text-danger">{errorEnvio}</p>}
        </div>
        <Button type="submit" size="lg" disabled={enviando} className="w-full">
          {enviando ? 'Enviando…' : 'Enviar cotización'}
        </Button>
      </aside>
    </form>
  )
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <legend className="sr-only">{titulo}</legend>
      <div className="flex flex-col gap-0.5">
        <h2 aria-hidden="true" className="text-base font-semibold">{titulo}</h2>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children}
    </fieldset>
  )
}
