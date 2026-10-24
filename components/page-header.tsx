export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="relative isolate mb-8 flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,var(--info-soft),var(--card)_55%,var(--cian-soft))] px-6 py-6 shadow-sm md:flex-row md:items-end md:justify-between md:px-8 md:py-8">
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 -z-10 size-44 rounded-full bg-cian/20 blur-2xl"
      />
      <div className="flex max-w-3xl flex-col gap-1.5">
        {eyebrow && (
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        )}
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description && (
          <p className="text-pretty leading-relaxed text-muted-foreground md:text-lg">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
