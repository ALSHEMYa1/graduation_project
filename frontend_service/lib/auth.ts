const TOKEN_KEY = 'token'
const TOKEN_TYPE_KEY = 'token_type'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function getTokenType(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_TYPE_KEY) || sessionStorage.getItem(TOKEN_TYPE_KEY)
}

export function setSession(token: string, tokenType: string, remember: boolean) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_TYPE_KEY)
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(TOKEN_TYPE_KEY, tokenType)
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_TYPE_KEY)
}
