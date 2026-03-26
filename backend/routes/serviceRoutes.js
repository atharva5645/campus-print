import { Router } from 'express'
import { createService, deleteService, getServices, toggleService, updateService } from '../controllers/serviceController.js'

const router = Router()

router.get('/', getServices)
router.post('/', createService)
router.patch('/:id', updateService)
router.patch('/:id/toggle', toggleService)
router.delete('/:id', deleteService)

export default router

