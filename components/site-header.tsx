'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ETIQUETA_ROL, type Rol, type Usuario } from '@/lib/roles'
import { cn } from '@/lib/utils'

const secciones: { href: string; label: string; roles?: Rol[] }[] = [
  { href: '/licitaciones', label: 'Licitaciones' },
  { href: '/mapa', label: 'Mapa' },
  { href: '/presupuesto', label: 'Presupuesto' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/portal', label: 'Portal de proveedores', roles: ['proveedor', 'admin'] },
  { href: '/ciudadano', label: 'Ciudadanía' },
  { href: '/agentes', label: 'Agentes y flujos', roles: ['admin'] },
]

export function SiteHeader({ usuario }: { usuario: Usuario | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function salir() {
    await fetch('/api/sesion', { method: 'DELETE' })
    router.push('/licitaciones')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="h-1 bg-primary" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/licitaciones" className="flex items-center gap-3 rounded-sm">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-md bg-primary font-mono text-sm font-medium text-primary-foreground"
          >
            CC
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Cuenta Clara</span>
            <span className="text-xs text-muted-foreground">Trazabilidad de compras públicas</span>
          </span>
        </Link>
        <nav aria-label="Secciones principales" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-1">
            {secciones
              .filter((s) => !s.roles || (usuario && s.roles.includes(usuario.rol)))
              .map((s) => {
              const activo = pathname === s.href || pathname.startsWith(`${s.href}/`)
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={activo ? 'page' : undefined}
                    className={cn(
                      'block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      activo
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {usuario ? (
            <>
              <span className="flex flex-col leading-tight">
                <span className="font-medium">{usuario.nombre}</span>
                <span className="text-xs text-muted-foreground">{ETIQUETA_ROL[usuario.rol]}</span>
              </span>
              <button
                type="button"
                onClick={salir}
                className="h-8 rounded-md border border-border px-3 font-medium transition-colors hover:bg-muted"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
