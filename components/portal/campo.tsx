import { cn } from '@/lib/utils'

type ControlProps = {
  id: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function Campo({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
  children: (props: ControlProps) => React.ReactNode
}) {
  const descripciones = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': descripciones || undefined })}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
