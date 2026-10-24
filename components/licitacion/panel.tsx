export function Panel({ titulo, id, children }: { titulo: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`titulo-${id}`} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <h2 id={`titulo-${id}`} className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h2>
      {children}
    </section>
  )
}
