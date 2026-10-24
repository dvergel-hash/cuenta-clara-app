import { modoDemo } from '@/lib/api'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-medium text-foreground">Los datos de esta demo son sintéticos</p>
        <p>
          Cuenta Clara · Fuente de datos:{' '}
          <span className="font-mono text-xs">{modoDemo ? 'mock local' : 'API pública'}</span>
        </p>
      </div>
    </footer>
  )
}
