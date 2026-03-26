import { Router } from 'express'
import { ensureDemoAdmin, ensureDemoUser } from '../controllers/authController.js'

const router = Router()

router.post('/demo-user', ensureDemoUser)
router.post('/demo-admin', ensureDemoAdmin)

export default router
