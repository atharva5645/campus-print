import { apiFetch } from './client'

export function getOrders(userId) {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return apiFetch(`/api/orders${query}`)
}

export function createOrder(payload) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrderStatus(id, status) {
  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateOrderCollected(id, collected) {
  return apiFetch(`/api/orders/${id}/collect`, {
    method: 'PATCH',
    body: JSON.stringify({ collected }),
  })
}

