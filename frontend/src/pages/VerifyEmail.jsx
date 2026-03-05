import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }
    apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setMessage(data.message)
        setStatus('success')
      })
      .catch((err) => {
        setMessage(err.message)
        setStatus('error')
      })
  }, [token])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-forest-50 px-4">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4 animate-spin inline-block">⏳</div>
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-forest-800 mb-2">Email verified!</h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <Link
              to="/auth/login"
              className="inline-block bg-forest-700 hover:bg-forest-600 text-white px-6 py-2 rounded-md font-medium transition-colors text-sm"
            >
              Sign in
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Verification failed</h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <Link
              to="/auth/register"
              className="inline-block text-forest-600 hover:underline text-sm"
            >
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
