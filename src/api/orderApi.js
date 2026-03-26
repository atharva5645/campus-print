import { apiFetch } from './client'

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
