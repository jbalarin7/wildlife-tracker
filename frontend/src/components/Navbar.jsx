import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-white' : 'text-forest-100 hover:text-white'
    }`

  return (
    <nav className="bg-forest-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-wide">
          <span className="text-2xl">🐾</span>
          Wildlife Tracker
        </Link>

        <div className="flex items-center gap-6">
          <NavLink to="/" className={linkClass} end>
            Map
          </NavLink>
          <NavLink to="/list" className={linkClass}>
            List
          </NavLink>

          {user ? (
            <>
              <NavLink to="/occurrences/new" className={linkClass}>
                + Log Sighting
              </NavLink>
              <span className="text-forest-100 text-sm hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-forest-100 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/auth/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink
                to="/auth/register"
                className="text-sm bg-forest-600 hover:bg-forest-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
