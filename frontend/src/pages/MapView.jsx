import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'

// Fix default marker icons broken by Vite asset processing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const FAUNA_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const FLORA_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function BboxLoader({ onFeatures }) {
  const map = useMap()

  const load = useCallback(() => {
    const b = map.getBounds()
    apiFetch(
      `/map/geojson?min_lat=${b.getSouth()}&max_lat=${b.getNorth()}&min_lng=${b.getWest()}&max_lng=${b.getEast()}`
    )
      .then((data) => onFeatures(data.features ?? []))
      .catch(() => {})
  }, [map, onFeatures])

  useMapEvents({ moveend: load, zoomend: load })

  useEffect(() => {
    load()
  }, [load])

  return null
}

export default function MapView() {
  const [features, setFeatures] = useState([])

  return (
    <div className="relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
          Fauna
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Flora
        </div>
      </div>

      <MapContainer
        center={[-14.235, -51.925]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BboxLoader onFeatures={setFeatures} />

        {features.map((f) => {
          const [lng, lat] = f.geometry.coordinates
          const { id, category, common_name, observed_at } = f.properties
          return (
            <Marker
              key={id}
              position={[lat, lng]}
              icon={category === 'fauna' ? FAUNA_ICON : FLORA_ICON}
            >
              <Popup>
                <div className="text-sm min-w-[140px]">
                  <p className="font-semibold">{common_name}</p>
                  <p className="text-gray-500 capitalize">{category}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(observed_at).toLocaleDateString()}
                  </p>
                  <Link
                    to={`/occurrences/${id}`}
                    className="mt-2 inline-block text-forest-600 hover:underline text-xs font-medium"
                  >
                    View details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
