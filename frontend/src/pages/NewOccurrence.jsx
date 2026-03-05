import L from 'leaflet'
import { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

function CoordPicker({ coords, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return coords ? <Marker position={[coords.lat, coords.lng]} /> : null
}

function todayLocal() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export default function NewOccurrence() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [coords, setCoords] = useState(null)
  const [category, setCategory] = useState('fauna')
  const [commonName, setCommonName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [observedAt, setObservedAt] = useState(todayLocal())
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!coords) {
      setError('Click on the map to set the location.')
      return
    }
    setError('')
    setLoading(true)

    const form = new FormData()
    form.append('category', category)
    form.append('common_name', commonName)
    if (scientificName) form.append('scientific_name', scientificName)
    form.append('observed_at', new Date(observedAt).toISOString())
    form.append('latitude', coords.lat)
    form.append('longitude', coords.lng)
    if (description) form.append('description', description)
    for (const file of files) {
      form.append('images', file)
    }

    try {
      const data = await apiFetch('/occurrences', {
        method: 'POST',
        body: form,
        token,
      })
      navigate(`/occurrences/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-forest-800 mb-6">Log a sighting</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map picker */}
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Click the map to pin the observation location.
          </p>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '440px' }}>
            <MapContainer
              center={[-14.235, -51.925]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CoordPicker coords={coords} onChange={setCoords} />
            </MapContainer>
          </div>
          {coords ? (
            <p className="mt-2 text-xs text-forest-700 font-medium">
              📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">No location selected yet</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="flex gap-3">
              {['fauna', 'flora'].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="accent-forest-700"
                  />
                  <span className="text-sm capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Common name *</label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="e.g. Giant Otter"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Scientific name</label>
            <input
              type="text"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              placeholder="e.g. Pteronura brasiliensis"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Observed at *</label>
            <input
              type="datetime-local"
              required
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Behaviour, habitat, count…"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Photos{' '}
              <span className="text-gray-400 font-normal">(JPEG/PNG/WebP, max 5 MB each)</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-forest-100 file:text-forest-700 hover:file:bg-forest-200 cursor-pointer"
            />
            {files.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-700 hover:bg-forest-600 text-white py-2.5 rounded-md font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save sighting'}
          </button>
        </form>
      </div>
    </div>
  )
}
