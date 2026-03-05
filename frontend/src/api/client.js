const BASE = '/api'

/**
 * Thin fetch wrapper.
 *
 * @param {string} path  - e.g. '/auth/login'
 * @param {object} opts
 * @param {string}  [opts.method='GET']
 * @param {object|FormData} [opts.body]    - plain object → JSON; FormData → multipart
 * @param {string}  [opts.token]           - Bearer token
 * @returns {Promise<any>}  parsed JSON response
 * @throws  {Error}  with message from API `detail` field on non-2xx
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let requestBody
  if (body instanceof FormData) {
    requestBody = body
    // Do NOT set Content-Type — browser sets it with the correct boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: requestBody,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (data && (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))) ||
      `HTTP ${res.status}`
    throw new Error(message)
  }

  return data
}
