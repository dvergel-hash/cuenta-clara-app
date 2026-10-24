import { cn } from '@/lib/utils'

/** Marca: barras de gasto que crecen y un tilde de verificación en cian. */
export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('size-10 shrink-0', className)}>
      <defs>
        <linearGradient id="cc-fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.45 0.11 255)" />
          <stop offset="1" stopColor="oklch(0.26 0.07 258)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cc-fondo)" />
      <rect x="8" y="23" width="6" height="9" rx="1.5" fill="#fff" opacity=".75" />
      <rect x="17" y="17" width="6" height="15" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="26" y="10" width="6" height="22" rx="1.5" fill="#fff" />
      <circle cx="11" cy="12" r="5.5" fill="var(--cian)" />
      <path
        d="M8.4 12.2l1.8 1.8 3.4-3.6"
        fill="none"
        stroke="oklch(0.26 0.07 258)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className, subtitulo = true }: { className?: string; subtitulo?: boolean }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <LogoMarca />
      <span className="flex flex-col leading-tight">
        <span className="text-xl font-semibold tracking-tight">
          <span className="text-navy">Cuenta</span> <span className="text-cian-strong">Clara</span>
        </span>
        {subtitulo && (
          <span className="hidden text-xs text-muted-foreground sm:block">Trazabilidad de compras públicas</span>
        )}
      </span>
    </span>
  )
}
