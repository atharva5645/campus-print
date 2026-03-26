import { Router } from 'express'
import { getDashboardStats, getRecentJobs } from '../controllers/adminController.js'

const router = Router()

router.get('/stats', getDashboardStats)
router.get('/recent-jobs', getRecentJobs)

export default router
