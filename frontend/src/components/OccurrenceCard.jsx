import { Link } from 'react-router-dom'

const CATEGORY_COLOR = {
  fauna: 'bg-amber-100 text-amber-800',
  flora: 'bg-green-100 text-green-800',
}

export default function OccurrenceCard({ occurrence }) {
  const { id, category, common_name, scientific_name, observed_at, description, images, email } =
    occurrence

  const thumb = (images ?? [])[0]

  return (
    <Link
      to={`/occurrences/${id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {thumb ? (
        <img
          src={`/api${thumb}`}
          alt={common_name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-forest-50 flex items-center justify-center text-4xl">
          {category === 'fauna' ? '🦊' : '🌿'}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{common_name}</h3>
            {scientific_name && (
              <p className="text-xs text-gray-500 italic">{scientific_name}</p>
            )}
          </div>
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[category] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {category}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {new Date(observed_at).toLocaleDateString()} · {email}
        </p>
        {description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </Link>
  )
}
