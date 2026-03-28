import { Router } from 'express'
import { createOrder, getOrders, updateOrderCollected, updateOrderStatus } from '../controllers/orderController.js'

const router = Router()

router.get('/', getOrders)
router.post('/', createOrder)
router.patch('/:id/status', updateOrderStatus)
router.patch('/:id/collect', updateOrderCollected)

export default router

