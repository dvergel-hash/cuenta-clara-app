import Link from 'next/link'
import { formatoMoneda } from '@/lib/format'
import { DIAS_POR_VENCER, ESTADOS_CON_ALERTA, type ResumenListado } from '@/lib/listado'
import { cn } from '@/lib/utils'

type Tarjeta = { titulo: string; valor: string; nota: string; href: string; activa: boolean; tono: string }

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
      tono: 'text-primary',
    },
    {
      titulo: 'Monto estimado abierto',
      valor: formatoMoneda(resumen.montoAbierto),
      nota: 'Estimación, no adjudicado',
      href: '?estado=abierto&orden=monto',
      activa: false,
      tono: 'text-foreground',
    },
    {
      titulo: 'Próximos a vencer',
      valor: String(resumen.porVencer),
      nota: `Cierran en ${DIAS_POR_VENCER} días o menos`,
      href: `?estado=abierto&venceEn=${DIAS_POR_VENCER}&orden=cierre&dir=asc`,
      activa: venceEn !== null,
      tono: 'text-warn',
    },
    {
      titulo: 'Observados o rechazados',
      valor: String(resumen.conAlerta),
      nota: 'Con decisión que requiere atención',
      href: `?estado=${ESTADOS_CON_ALERTA}`,
      activa: estado === ESTADOS_CON_ALERTA,
      tono: 'text-danger',
    },
  ]

  return (
    <section aria-label="Resumen" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Link
          key={t.titulo}
          href={t.href}
          aria-current={t.activa ? 'true' : undefined}
          className={cn(
            'flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring',
            t.activa ? 'border-primary ring-1 ring-primary' : 'border-border',
          )}
        >
          <span className="text-sm text-muted-foreground">{t.titulo}</span>
          <span className={cn('font-mono text-2xl font-semibold tabular-nums', t.tono)}>{t.valor}</span>
          <span className="text-xs text-muted-foreground">{t.nota}</span>
        </Link>
      ))}
    </section>
  )
}
