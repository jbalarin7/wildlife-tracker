import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import OccurrenceCard from '../components/OccurrenceCard'

const PAGE_SIZE = 12

export default function OccurrenceList() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
    if (category) params.set('category', category)
    if (q) params.set('q', q)

    apiFetch(`/occurrences?${params}`)
      .then((data) => {
        setItems(data.items)
        setTotal(data.total)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, category, q])

  function handleSearch(e) {
    e.preventDefault()
    setQ(inputQ)
    setPage(0)
  }

  function handleCategory(val) {
    setCategory(val)
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-forest-800">Sightings</h1>
        <Link
          to="/occurrences/new"
          className="bg-forest-700 hover:bg-forest-600 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Log sighting
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search species…"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
          <button
            type="submit"
            className="bg-forest-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-600 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category filter */}
        <div className="flex items-center gap-2 text-sm">
          {['', 'fauna', 'flora'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-3 py-2 rounded-md font-medium border transition-colors ${
                category === cat
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-forest-500'
              }`}
            >
              {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <div className="text-5xl mb-3">🔭</div>
          <p>No sightings found.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {total} result{total !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((occ) => (
              <OccurrenceCard key={occ.id} occurrence={occ} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
