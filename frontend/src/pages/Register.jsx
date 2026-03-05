import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: { email, password },
      })
      setSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-forest-50 px-4">
        <div className="bg-white shadow-md rounded-xl w-full max-w-md p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-forest-800 mb-2">Check your email</h2>
          <p className="text-gray-600 text-sm mb-4">{success.message}</p>
          {/* Dev mode: show the verification link directly */}
          {success.verification_link && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-left">
              <p className="text-xs text-gray-500 mb-1 font-medium">Dev verification link:</p>
              <Link
                to={success.verification_link}
                className="text-xs text-forest-600 underline break-all"
              >
                {success.verification_link}
              </Link>
            </div>
          )}
          <Link
            to="/auth/login"
            className="mt-6 inline-block text-sm text-forest-600 hover:underline font-medium"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-forest-50 px-4">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-forest-800 mb-6">Create account</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-gray-400 font-normal">(min 8 chars)</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-700 hover:bg-forest-600 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-forest-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
