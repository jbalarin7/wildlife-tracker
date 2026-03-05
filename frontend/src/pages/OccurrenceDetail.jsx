import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const CATEGORY_COLOR = {
  fauna: 'bg-amber-100 text-amber-800',
  flora: 'bg-green-100 text-green-800',
}

export default function OccurrenceDetail() {
  const { id } = useParams()
  const [occurrence, setOccurrence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    apiFetch(`/occurrences/${id}`)
      .then(setOccurrence)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="text-center text-gray-500 py-20">Loading…</div>
  }

  if (error || !occurrence) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || 'Not found'}</p>
        <Link to="/list" className="mt-4 inline-block text-forest-600 hover:underline text-sm">
          ← Back to list
        </Link>
      </div>
    )
  }

  const images = occurrence.images ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/list" className="text-forest-600 hover:underline text-sm mb-6 inline-block">
        ← Back to list
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Image gallery */}
        {images.length > 0 ? (
          <div className="relative">
            <img
              src={`/api${images[imgIdx]}`}
              alt={occurrence.common_name}
              className="w-full h-72 object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === imgIdx ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  ‹
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-40 bg-forest-50 flex items-center justify-center text-5xl">
            {occurrence.category === 'fauna' ? '🦊' : '🌿'}
          </div>
        )}

        <div className="p-6 grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {occurrence.common_name}
                </h1>
                {occurrence.scientific_name && (
                  <p className="text-gray-500 italic text-sm mt-0.5">{occurrence.scientific_name}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${
                  CATEGORY_COLOR[occurrence.category] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {occurrence.category}
              </span>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-gray-500 min-w-[100px]">Observed</dt>
                <dd className="text-gray-900">{new Date(occurrence.observed_at).toLocaleString()}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 min-w-[100px]">Logged by</dt>
                <dd className="text-gray-900">{occurrence.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 min-w-[100px]">Coordinates</dt>
                <dd className="text-gray-900 font-mono text-xs">
                  {occurrence.latitude.toFixed(5)}, {occurrence.longitude.toFixed(5)}
                </dd>
              </div>
            </dl>

            {occurrence.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{occurrence.description}</p>
              </div>
            )}
          </div>

          {/* Mini map */}
          <div className="rounded-lg overflow-hidden border border-gray-200 h-56">
            <MapContainer
              center={[occurrence.latitude, occurrence.longitude]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[occurrence.latitude, occurrence.longitude]} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
