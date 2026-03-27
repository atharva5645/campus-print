import supabase from '../config/supabaseClient.js'

const memoryNotifications = []

function isMissingNotificationTable(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return message.includes('notifications') && (message.includes('does not exist') || message.includes('could not find'))
}

function sortByDateDesc(items) {
  return [...items].sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
}

function filterNotifications(items, { audience, userId, unreadOnly }) {
  return items.filter((item) => {
    if (audience && item.audience !== audience) return false
    if (audience === 'student' && userId && item.user_id !== userId) return false
    if (unreadOnly && item.is_read) return false
    return true
  })
}

export async function createNotifications(entries) {
  const payload = entries
    .filter(Boolean)
    .map((entry, index) => ({
      id: `local-notification-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      audience: entry.audience,
      user_id: entry.user_id ?? null,
      order_id: entry.order_id ?? null,
      type: entry.type ?? 'info',
      title: entry.title,
      message: entry.message,
      is_read: false,
      created_at: new Date().toISOString(),
    }))

  if (payload.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(
      payload.map(({ id, ...entry }) => entry)
    )
    .select('*')

  if (error) {
    if (!isMissingNotificationTable(error)) {
      console.warn('Failed to persist notifications in Supabase. Falling back to in-memory notifications.', error)
    }

    memoryNotifications.unshift(...payload)
    return sortByDateDesc(payload)
  }

  return sortByDateDesc(data || [])
}

export async function listNotifications({ audience = 'student', userId = null, limit = 10, unreadOnly = false }) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('audience', audience)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (audience === 'student' && userId) {
    query = query.eq('user_id', userId)
  }

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query

  if (error) {
    const fallbackItems = sortByDateDesc(
      filterNotifications(memoryNotifications, {
        audience,
        userId,
        unreadOnly,
      })
    )

    if (!isMissingNotificationTable(error)) {
      console.warn('Failed to load notifications from Supabase. Serving in-memory notifications instead.', error)
    }

    return fallbackItems.slice(0, limit)
  }

  return data || []
}

export async function markNotificationsRead({ audience = 'student', userId = null }) {
  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('audience', audience)
    .eq('is_read', false)

  if (audience === 'student' && userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.select('*')

  if (error) {
    if (!isMissingNotificationTable(error)) {
      console.warn('Failed to mark notifications as read in Supabase. Falling back to in-memory notifications.', error)
    }

    const touchedIds = new Set(
      filterNotifications(memoryNotifications, {
        audience,
        userId,
        unreadOnly: true,
      }).map((item) => item.id)
    )

    memoryNotifications.forEach((item) => {
      if (touchedIds.has(item.id)) {
        item.is_read = true
      }
    })

    return memoryNotifications.filter((item) => touchedIds.has(item.id))
  }

  return data || []
}
