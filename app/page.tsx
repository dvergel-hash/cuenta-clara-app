import { ArrowRight, Bot, Eye, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLicitaciones } from '@/lib/api'
import { formatoMoneda } from '@/lib/format'
import { resumir, type ResumenListado } from '@/lib/listado'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inicio' }
export const dynamic = 'force-dynamic'

const PILARES: { icono: LucideIcon; titulo: string; texto: string; enlace: string; href: string }[] = [
  {
    icono: ShieldCheck,
    titulo: 'Trazabilidad verificable',
    texto:
      'Cada decisión queda en un registro encadenado con hash. Cualquiera puede verificar que no fue alterado después de sellado.',
    enlace: 'Ver licitaciones',
    href: '/licitaciones',
  },
  {
    icono: Bot,
    titulo: 'Agentes y señales de alerta',
    texto:
      'Los agentes buscan precios de referencia y el sistema marca concentración de proveedores, oferta única, fraccionamiento y proveedores nuevos.',
    enlace: 'Ver agentes y flujos',
    href: '/agentes',
  },
  {
    icono: Eye,
    titulo: 'Control ciudadano',
    texto:
      'Cualquier persona puede observar una compra sin identificarse. Cada observación se revisa antes de publicarse.',
    enlace: 'Observar una compra',
    href: '/ciudadano',
  },
]

async function cargarResumen(): Promise<{ resumen: ResumenListado; total: number } | null> {
  try {
    const lics = await getLicitaciones()
    return { resumen: resumir(lics), total: lics.length }
  } catch {
    return null
  }
}

function Cifra({ valor, etiqueta, i }: { valor: string; etiqueta: string; i: number }) {
  return (
    <div className="aparecer flex min-w-0 flex-col gap-1" style={{ '--i': i + 3 } as React.CSSProperties}>
      <dd className="font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl xl:text-3xl">{valor}</dd>
      <dt className="text-sm text-white/70">{etiqueta}</dt>
    </div>
  )
}

export default async function InicioPage() {
  const datos = await cargarResumen()

  return (
    <div className="flex flex-col gap-12">
      <section
        aria-labelledby="titulo-inicio"
        className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,oklch(0.26_0.07_258),oklch(0.38_0.09_255)_55%,oklch(0.5_0.1_235))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-cian/30 blur-3xl"
        />

        <div className="flex max-w-3xl flex-col gap-6">
          <p
            className="aparecer inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-cian"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            <span className="size-1.5 rounded-full bg-cian" aria-hidden="true" />
            Trazabilidad de compras públicas
          </p>
          <h1
            id="titulo-inicio"
            className="aparecer text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            Más que saber en qué se gasta: <span className="text-cian">entenderlo</span> y poder controlarlo.
          </h1>
          <p
            className="aparecer max-w-2xl text-pretty text-lg leading-relaxed text-white/80"
            style={{ '--i': 2 } as React.CSSProperties}
          >
            Cuenta Clara conecta licitaciones, presupuesto y proveedores en un solo lugar, para detectar desvíos y
            verificar cada decisión.
          </p>
          <div className="aparecer flex flex-wrap gap-3" style={{ '--i': 3 } as React.CSSProperties}>
            <Link
              href="/licitaciones"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 font-medium text-navy shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver licitaciones
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/ciudadano"
              className="inline-flex h-11 items-center rounded-lg border border-white/30 px-5 font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Observar una compra
            </Link>
          </div>
        </div>

        {datos && (
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/15 pt-8 xl:grid-cols-4">
            <Cifra i={0} valor={String(datos.total)} etiqueta="Pedidos publicados" />
            <Cifra i={1} valor={String(datos.resumen.abiertas)} etiqueta="Abiertos a ofertas" />
            <Cifra i={2} valor={formatoMoneda(datos.resumen.montoAbierto)} etiqueta="Monto estimado abierto" />
            <Cifra i={3} valor={String(datos.resumen.conAlerta)} etiqueta="Observados o rechazados" />
          </dl>
        )}
      </section>

      <section aria-labelledby="titulo-pilares" className="flex flex-col gap-6">
        <h2 id="titulo-pilares" className="text-2xl font-semibold tracking-tight">
          Cómo ayuda Cuenta Clara
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {PILARES.map((p, i) => (
            <li
              key={p.titulo}
              className={cn(
                'aparecer group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md',
              )}
              style={{ '--i': i + 4 } as React.CSSProperties}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-cian-soft text-cian-strong">
                <p.icono className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold">{p.titulo}</h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">{p.texto}</p>
              <Link
                href={p.href}
                className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {p.enlace}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
