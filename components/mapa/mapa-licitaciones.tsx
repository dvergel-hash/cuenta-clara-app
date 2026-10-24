'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { CircleMarker as LeafletCircleMarker } from 'leaflet'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LicitacionGeo } from '@/lib/mapa/datos'
import { NIVELES, desvioPorcentual, montoCompacto, nivelDesvio } from '@/lib/mapa/desvio'
import { InsigniaDesvio } from './insignia-desvio'

const CENTRO_ARGENTINA: [number, number] = [-38.4161, -63.6167]

type Props = {
  licitaciones: LicitacionGeo[]
  seleccionadaId: string | null
  solicitudCentrado: number
  onVerDetalle: (id: string) => void
}

export default function MapaLicitaciones({ licitaciones, seleccionadaId, solicitudCentrado, onVerDetalle }: Props) {
  const marcadores = useRef(new Map<string, LeafletCircleMarker>())

  return (
    <MapContainer
      center={CENTRO_ARGENTINA}
      zoom={4}
      minZoom={3}
      scrollWheelZoom
      className="size-full"
      aria-label="Mapa de licitaciones públicas en Argentina"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {licitaciones.map((l) => {
        const desvio = desvioPorcentual(l)
        const color = NIVELES[nivelDesvio(desvio)].color
        const activa = l.id === seleccionadaId
        return (
          <CircleMarker
            key={l.id}
            center={[l.lat, l.lng]}
            radius={activa ? 13 : 9}
            pathOptions={{
              color: activa ? '#0f172a' : '#ffffff',
              weight: activa ? 3 : 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            ref={(m) => {
              if (m) marcadores.current.set(l.id, m)
              else marcadores.current.delete(l.id)
            }}
          >
            <Popup minWidth={240} maxWidth={280}>
              <div className="flex flex-col gap-2 font-sans text-foreground">
                <div className="flex flex-col gap-0.5">
                  <p className="font-mono text-[11px] text-muted-foreground">{l.id}</p>
                  <p className="text-sm font-semibold leading-snug">{l.titulo}</p>
                  <p className="text-xs text-muted-foreground">{l.organismo}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  <dt className="text-muted-foreground">Oficial</dt>
                  <dd className="text-right font-mono">{montoCompacto(l.presupuestoOficial)}</dd>
                  <dt className="text-muted-foreground">Ejecutado</dt>
                  <dd className="text-right font-mono">{montoCompacto(l.costoEjecutado)}</dd>
                </dl>
                <div className="flex items-center justify-between gap-2">
                  <InsigniaDesvio desvio={desvio} />
                  <button
                    type="button"
                    onClick={() => onVerDetalle(l.id)}
                    className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
      <Centrador
        licitaciones={licitaciones}
        seleccionadaId={seleccionadaId}
        solicitud={solicitudCentrado}
        marcadores={marcadores}
      />
    </MapContainer>
  )
}

function Centrador({
  licitaciones,
  seleccionadaId,
  solicitud,
  marcadores,
}: {
  licitaciones: LicitacionGeo[]
  seleccionadaId: string | null
  solicitud: number
  marcadores: React.RefObject<Map<string, LeafletCircleMarker>>
}) {
  const map = useMap()

  useEffect(() => {
    if (!solicitud || !seleccionadaId) return
    const l = licitaciones.find((x) => x.id === seleccionadaId)
    if (!l) return
    map.flyTo([l.lat, l.lng], Math.max(map.getZoom(), 9), { duration: 0.8 })
    const marcador = marcadores.current.get(l.id)
    const abrir = () => marcador?.openPopup()
    map.once('moveend', abrir)
    return () => {
      map.off('moveend', abrir)
    }
    // Only react to explicit centering requests, not every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitud])

  return null
}
