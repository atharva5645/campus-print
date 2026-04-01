import { Router } from 'express'
import { createService, deleteService, getServices, toggleService, updateService } from '../controllers/serviceController.js'
import { requireAdmin } from '../middleware/adminAuthMiddleware.js'

const router = Router()

router.get('/', getServices)
router.use((req, res, next) => {
  if (req.method === 'GET') return next()
  return requireAdmin(req, res, next)
})
router.post('/', createService)
router.patch('/:id', updateService)
router.patch('/:id/toggle', toggleService)
router.delete('/:id', deleteService)

export default router