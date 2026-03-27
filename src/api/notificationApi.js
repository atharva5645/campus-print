import { apiFetch } from './client'
import { listPrototypeNotifications, markPrototypeNotificationsRead } from '../lib/prototypeData'

export async function getNotifications({ audience, userId, limit = 8 }) {
  const params = new URLSearchParams({
    audience,
    limit: String(limit),
  })

  if (userId) {
    params.set('user_id', userId)
  }

  try {
    return await apiFetch(`/api/notifications?${params.toString()}`)
  } catch {
    return listPrototypeNotifications({ audience, userId, limit })
  }
}

export async function markNotificationsRead({ audience, userId }) {
  try {
    return await apiFetch('/api/notifications/read-all', {
      method: 'PATCH',
      body: JSON.stringify({
        audience,
        user_id: userId ?? null,
      }),
    })
  } catch {
    markPrototypeNotificationsRead({ audience, userId })
    return { updated: true }
  }
}
