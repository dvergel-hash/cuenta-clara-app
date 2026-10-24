'use client'

import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatoFechaHora, formatoMoneda, formatoMonedaEn } from '@/lib/format'
import type { ConfirmacionCotizacion } from '@/lib/types'

export type DatosComprobante = ConfirmacionCotizacion & {
  pedido: string
  moneda: 'ARS' | 'USD'
  total: number
  tipoCambio?: number
  cierre?: string
}

export function Confirmacion({ confirmacion, onNueva }: { confirmacion: DatosComprobante; onNueva: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => titulo.current?.focus(), [])

  return (
    <section aria-labelledby="titulo-confirmacion" className="flex max-w-2xl flex-col gap-5 rounded-lg border border-ok/30 bg-card p-6">
      <div className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 size-6 shrink-0 text-ok" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 id="titulo-confirmacion" ref={titulo} tabIndex={-1} className="text-xl font-semibold outline-none">
            Cotización recibida
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tu oferta para el pedido <span className="font-mono text-foreground">{confirmacion.pedido}</span> quedó
            sellada. Guardá este comprobante.
          </p>
        </div>
      </div>

      <dl className="grid gap-4 rounded-md bg-muted/60 p-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Comprobante</dt>
          <dd className="font-mono">{confirmacion.id}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Total declarado ({confirmacion.moneda})</dt>
          <dd className="font-mono tabular-nums">{formatoMonedaEn(confirmacion.total, confirmacion.moneda)}</dd>
          {confirmacion.tipoCambio && (
            <dd className="font-mono text-xs text-muted-foreground tabular-nums">
              TC {confirmacion.tipoCambio} · ≈ {formatoMoneda(confirmacion.total * confirmacion.tipoCambio)}
            </dd>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Hora de recepción</dt>
          <dd className="font-mono">
            <time dateTime={confirmacion.recibida}>{formatoFechaHora(confirmacion.recibida, true)} h</time>
          </dd>
        </div>
        {confirmacion.cierre && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Cierre del pedido</dt>
            <dd className="font-mono">
              <time dateTime={confirmacion.cierre}>{formatoFechaHora(confirmacion.cierre)} h</time>
            </dd>
          </div>
        )}
        <div className="flex flex-col gap-0.5 sm:col-span-2">
          <dt className="text-muted-foreground">Hash SHA-256 de la oferta</dt>
          <dd className="break-all font-mono text-xs leading-relaxed">{confirmacion.hash}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onNueva}>Cargar otra cotización</Button>
        <Link href={`/licitaciones/${confirmacion.pedido}`} className={buttonVariants({ variant: 'outline' })}>
          Ver el pedido
        </Link>
      </div>
    </section>
  )
}
