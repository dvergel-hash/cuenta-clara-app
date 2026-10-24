'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Campo } from '@/components/portal/campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ETIQUETA_ROL, type Rol } from '@/lib/roles'

type Cuenta = { email: string; nombre: string; rol: Rol }

export function FormularioLogin({ cuentas, desde, clave }: { cuentas: Cuenta[]; desde: string; clave: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const res = await fetch('/api/sesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clave: pass }),
      })
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(cuerpo?.error ?? 'No pudimos iniciar sesión')
      router.push(desde)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión')
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={entrar} noValidate className="flex max-w-md flex-col gap-5">
        <Campo id="login-email" label="Correo">
          {(p) => (
            <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <Campo id="login-clave" label="Clave">
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          )}
        </Campo>
        {error && (
          <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={enviando} className="w-fit">
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Ingresar
        </Button>
      </form>

      <aside aria-labelledby="demo-titulo" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 id="demo-titulo" className="text-sm font-semibold">
          Cuentas de demostración
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Acceso de demostración, no es autenticación de producción. Elegí una cuenta para completar el formulario.
        </p>
        <ul className="flex flex-col gap-2">
          {cuentas.map((c) => (
            <li key={c.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(c.email)
                  setPass(clave)
                }}
                className="flex w-full flex-col rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">{ETIQUETA_ROL[c.rol]}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
