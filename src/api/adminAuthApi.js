import { API_BASE_URL } from './client'

async function handleJsonResponse(response) {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    try {
      const data = await response.json()
      message = data.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/admin-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })
  return handleJsonResponse(res)
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE_URL}/api/admin-auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleJsonResponse(res)
}

export async function getAdminSession() {
  const res = await fetch(`${API_BASE_URL}/api/admin-auth/me`, {
    method: 'GET',
    credentials: 'include',
  })
  return handleJsonResponse(res)
}
