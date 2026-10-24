'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type Pestana = 'resumen' | 'dictamen' | 'busquedas'

export function PestanasLicitacion({
  inicial,
  cantidadBusquedas,
  resumen,
  dictamen,
  busquedas,
}: {
  inicial: Pestana
  cantidadBusquedas: number
  resumen: React.ReactNode
  dictamen: React.ReactNode
  busquedas: React.ReactNode
}) {
  return (
    <Tabs
      defaultValue={inicial}
      onValueChange={(valor) => {
        const url = new URL(window.location.href)
        if (valor === 'resumen') url.searchParams.delete('tab')
        else url.searchParams.set('tab', String(valor))
        window.history.replaceState(null, '', url)
      }}
      className="gap-6"
    >
      <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border pb-1">
        <TabsTrigger value="resumen" className="flex-none px-3">
          Resumen
        </TabsTrigger>
        <TabsTrigger value="dictamen" className="flex-none px-3">
          Dictamen
        </TabsTrigger>
        <TabsTrigger value="busquedas" className="flex-none px-3">
          Búsquedas de agentes
          <span className="rounded-full bg-secondary px-1.5 font-mono text-xs tabular-nums text-secondary-foreground">
            {cantidadBusquedas}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="resumen" className="flex flex-col gap-8 text-base">
        {resumen}
      </TabsContent>
      <TabsContent value="dictamen" className="text-base">
        {dictamen}
      </TabsContent>
      <TabsContent value="busquedas" className="text-base">
        {busquedas}
      </TabsContent>
    </Tabs>
  )
}
