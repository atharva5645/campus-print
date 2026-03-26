import { apiFetch } from './client'

export function getServices() {
  return apiFetch('/api/services')
}

export function createService(payload) {
  return apiFetch('/api/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function toggleService(id, enabled) {
  return apiFetch(`/api/services/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

export function updateService(id, payload) {
  return apiFetch(`/api/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteService(id) {
  return apiFetch(`/api/services/${id}`, {
    method: 'DELETE',
  })
}

export function getAdminStats() {
  return apiFetch('/api/admin/stats')
}

export function getRecentJobs() {
  return apiFetch('/api/admin/recent-jobs')
}
