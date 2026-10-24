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
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        {eyebrow && (
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}
