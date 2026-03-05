import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-forest-700">
        Authenticating…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return children
}
