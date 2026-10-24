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
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
