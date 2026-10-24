'use client'

import { Check, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getRegistro, modoDemo } from '@/lib/api'
import { verificarCadena, type ResultadoIntegridad } from '@/lib/calculos'
import { formatoFecha, hashCorto } from '@/lib/format'
import type { Decision } from '@/lib/types'
import { cn } from '@/lib/utils'

export function VerificarIntegridad({ pedidoId }: { pedidoId: string }) {
  const [simularAlteracion, setSimularAlteracion] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estado, setEstado] = useState<{ registros: Decision[]; resultado: ResultadoIntegridad } | null>(null)

  async function verificar() {
    setVerificando(true)
    setError(null)
    try {
      const registros = await getRegistro(simularAlteracion ? 'alterado' : 'original')
      setEstado({ registros, resultado: verificarCadena(registros) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo obtener el registro')
    } finally {
      setVerificando(false)
    }
  }

  const resultado = estado?.resultado
  const indiceRoto = resultado && !resultado.integro ? resultado.indice : -1

  return (
    <section aria-labelledby="titulo-integridad" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-integridad" className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Registro de decisiones
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cada decisión incluye el hash SHA-256 de la anterior. Si alguien modifica un registro, la cadena se rompe en
          ese punto.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={verificar} disabled={verificando} size="lg" className="px-4">
          <ShieldCheck aria-hidden="true" />
          {verificando ? 'Verificando…' : 'Verificar integridad'}
        </Button>
        {modoDemo && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={simularAlteracion}
              onChange={(e) => {
                setSimularAlteracion(e.target.checked)
                setEstado(null)
              }}
            />
            Usar variante alterada (demo)
          </label>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {error && <p className="text-sm text-danger">{error}</p>}
        {resultado &&
          (resultado.integro ? (
            <div className="flex items-start gap-3 rounded-md border border-ok/30 bg-ok-soft p-3 text-ok">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                <strong className="block text-base">Íntegro</strong>
                <span className="text-sm">Se verificaron {resultado.total} registros; todos los hashes coinciden.</span>
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-danger">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                <strong className="block text-base">Alterado</strong>
                <span className="text-sm">
                  La cadena se rompe en el registro {resultado.indice + 1} de {resultado.total} (
                  <span className="font-mono">{resultado.registro.id}</span>,{' '}
                  {resultado.registro.pedido_id}).{' '}
                  {resultado.razon === 'contenido'
                    ? 'Su contenido no coincide con el hash sellado.'
                    : 'No apunta al hash del registro anterior.'}
                </span>
              </p>
            </div>
          ))}

        {estado && (
          <ol className="flex flex-col divide-y divide-border rounded-md border border-border text-sm">
            {estado.registros.map((r, i) => {
              const roto = indiceRoto !== -1 && i >= indiceRoto
              const esQuiebre = i === indiceRoto
              return (
                <li
                  key={r.id}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2',
                    r.pedido_id === pedidoId && 'bg-accent/60',
                    esQuiebre && 'bg-danger-soft',
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {r.pedido_id}
                      {r.pedido_id === pedidoId && <span className="font-normal text-muted-foreground"> · este pedido</span>}
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground" title={r.hash}>
                      {formatoFecha(r.fecha)} · {hashCorto(r.hash)}
                    </span>
                  </span>
                  {roto ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                      <X className="size-4" aria-hidden="true" />
                      {esQuiebre ? 'Quiebre' : 'No verificable'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
                      <Check className="size-4" aria-hidden="true" />
                      OK
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
