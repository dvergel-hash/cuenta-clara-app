import type { Metadata } from 'next'
import { TableroMapa } from '@/components/mapa/tablero-mapa'
import { LICITACIONES_GEO } from '@/lib/mapa/datos'

export const metadata: Metadata = {
  title: 'Mapa de licitaciones',
  description:
    'Mapa interactivo de licitaciones públicas en Argentina con el desvío entre presupuesto oficial y costo ejecutado.',
}

export default function MapaPage() {
  return <TableroMapa licitaciones={LICITACIONES_GEO} />
}
