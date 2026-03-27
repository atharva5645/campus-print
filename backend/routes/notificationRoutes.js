import { Router } from 'express'
import { getNotifications, readNotifications } from '../controllers/notificationController.js'

const router = Router()

router.get('/', getNotifications)
router.patch('/read-all', readNotifications)

export default router
