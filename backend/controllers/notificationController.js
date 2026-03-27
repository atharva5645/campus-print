import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'
import { listNotifications, markNotificationsRead } from '../lib/notificationStore.js'

export const getNotifications = asyncHandler(async (req, res) => {
  const audience = req.query.audience === 'admin' ? 'admin' : 'student'
  const userId = req.query.user_id || null
  const limit = Number(req.query.limit || 8)

  if (audience === 'student' && !userId) {
    throw createHttpError(400, 'user_id is required for student notifications')
  }

  const notifications = await listNotifications({
    audience,
    userId,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 8,
  })

  res.json(notifications)
})

export const readNotifications = asyncHandler(async (req, res) => {
  const audience = req.body.audience === 'admin' ? 'admin' : 'student'
  const userId = req.body.user_id || null

  if (audience === 'student' && !userId) {
    throw createHttpError(400, 'user_id is required for student notifications')
  }

  const updated = await markNotificationsRead({ audience, userId })
  res.json({ updated: updated.length })
})
