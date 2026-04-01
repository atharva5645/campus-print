import { Router } from "express"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createAdminSession, clearAdminSession, validateAdminCredentials, requireAdmin } from "../middleware/adminAuthMiddleware.js"

const router = Router()

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {}
    if (!validateAdminCredentials(email, password)) {
      res.status(401).json({ message: 'Invalid admin credentials' })
      return
    }
    createAdminSession(res, email)
    res.json({ ok: true, email })
  })
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    clearAdminSession(res)
    res.json({ ok: true })
  })
)

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ ok: true, email: req.admin.email, role: 'admin' })
  })
)

export default router