import { Router } from 'express'
import { addCartItem, getCartItems, removeCartItem } from '../controllers/cartController.js'

const router = Router()

router.get('/', getCartItems)
router.post('/', addCartItem)
router.delete('/:id', removeCartItem)

export default router
