import { AlertTriangle, Clock, FolderOpen, Wallet, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { formatoMoneda } from '@/lib/format'
import { DIAS_POR_VENCER, ESTADOS_CON_ALERTA, type ResumenListado } from '@/lib/listado'
import { cn } from '@/lib/utils'

type Tarjeta = {
  titulo: string
  valor: string
  nota: string
  href: string
  activa: boolean
  icono: LucideIcon
  /** Ocupa todo el ancho en móvil: el monto necesita espacio. */
  ancha?: boolean
  tono: { texto: string; fondo: string; borde: string }
}

const TONOS = {
  primario: { texto: 'text-primary', fondo: 'bg-info-soft', borde: 'border-t-primary' },
  neutro: { texto: 'text-foreground', fondo: 'bg-secondary', borde: 'border-t-foreground/40' },
  aviso: { texto: 'text-warn', fondo: 'bg-warn-soft', borde: 'border-t-warn' },
  alerta: { texto: 'text-danger', fondo: 'bg-danger-soft', borde: 'border-t-danger' },
}

export function ResumenLicitaciones({
  resumen,
  estado,
  venceEn,
}: {
  resumen: ResumenListado
  estado: string
  venceEn: number | null
}) {
  const tarjetas: Tarjeta[] = [
    {
      titulo: 'Pedidos abiertos',
      valor: String(resumen.abiertas),
      nota: 'Reciben ofertas selladas',
      href: '?estado=abierto',
      activa: estado === 'abierto' && venceEn === null,
      icono: FolderOpen,
      tono: TONOS.primario,
    },
    {
      titulo: 'Monto estimado abierto',
      ancha: true,
      valor: formatoMoneda(resumen.montoAbierto),
      nota: 'Estimación, no adjudicado',
      href: '?estado=abierto&orden=monto',
      activa: false,
      icono: Wallet,
      tono: TONOS.neutro,
    },
    {
      titulo: 'Próximos a vencer',
      valor: String(resumen.porVencer),
      nota: `Cierran en ${DIAS_POR_VENCER} días o menos`,
      href: `?estado=abierto&venceEn=${DIAS_POR_VENCER}&orden=cierre&dir=asc`,
      activa: venceEn !== null,
      icono: Clock,
      tono: TONOS.aviso,
    },
    {
      titulo: 'Observados o rechazados',
      valor: String(resumen.conAlerta),
      nota: 'Con decisión que requiere atención',
      href: `?estado=${ESTADOS_CON_ALERTA}`,
      activa: estado === ESTADOS_CON_ALERTA,
      icono: AlertTriangle,
      tono: TONOS.alerta,
    },
  ]

  return (
    <section aria-label="Resumen" className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Link
          key={t.titulo}
          href={t.href}
          aria-current={t.activa ? 'true' : undefined}
          className={cn(
            t.ancha && 'col-span-2 sm:col-span-1',
            'group flex flex-col gap-3 rounded-xl border border-t-4 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
            t.tono.borde,
            t.activa ? 'ring-2 ring-primary' : 'border-x-border border-b-border',
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground sm:text-sm">{t.titulo}</span>
            <span className={cn('hidden size-8 shrink-0 place-items-center rounded-lg sm:grid', t.tono.fondo, t.tono.texto)}>
              <t.icono className="size-4" aria-hidden="true" />
            </span>
          </span>
          <span className={cn('font-mono text-2xl font-semibold tabular-nums leading-none xl:text-3xl', t.tono.texto)}>
            {t.valor}
          </span>
          <span className="text-xs text-muted-foreground">{t.nota}</span>
        </Link>
      ))}
    </section>
  )
}
