import { API_URL } from './config'

export const api = {
  getMe: async (token: string) => {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.json()
  },
}

export async function apiPost(endpoint: string, body: any, timeoutMs = 60000) {
  const token = localStorage.getItem('token')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = `Server error (${res.status})`
      try {
        const errData = await res.json()
        if (errData?.detail) detail = errData.detail
      } catch {}
      throw new Error(detail)
    }

    return await res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with fewer items.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}