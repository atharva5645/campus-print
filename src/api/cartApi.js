import { apiFetch } from './client'

export function getCartItems(userId) {
  return apiFetch(`/api/cart?user_id=${encodeURIComponent(userId)}`)
}

export function addCartItem(payload) {
  return apiFetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
