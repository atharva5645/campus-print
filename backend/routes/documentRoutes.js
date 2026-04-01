import { Router } from 'express'
import multer from 'multer'
import { deleteDocument, listDocuments, uploadDocument } from '../controllers/documentController.js'
import { requireAdmin } from '../middleware/adminAuthMiddleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/', listDocuments)
router.use((req, res, next) => {
  if (req.method === 'GET') return next()
  return requireAdmin(req, res, next)
})
router.post('/', upload.single('file'), uploadDocument)
router.delete('/:id', deleteDocument)

export default router