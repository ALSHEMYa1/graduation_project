import { API_URL } from './config'

const BASE = `${API_URL}/admin`

function headers() {
  const token = localStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function del(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function patch(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function put(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const adminApi = {
  getDashboard: () => get('/dashboard'),
  getUsers: () => get('/users'),
  updateUser: (id: number, data: any) => patch(`/users/${id}`, data),
  deleteUser: (id: number) => del(`/users/${id}`),
  getDocuments: () => get('/documents'),
  deleteDocument: (id: number) => del(`/documents/${id}`),
  getAiUsage: () => get('/ai-usage'),
  getAnalytics: () => get('/analytics'),
  getLogs: () => get('/logs'),
  getSettings: () => get('/settings'),
  updateSettings: (data: any) => put('/settings', data),
}
