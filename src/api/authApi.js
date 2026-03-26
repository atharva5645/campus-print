import { apiFetch } from './client'

export function ensureDemoUser(payload) {
  return apiFetch('/api/auth/demo-user', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function ensureAdminDemoUser(payload) {
  return apiFetch('/api/auth/demo-admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
