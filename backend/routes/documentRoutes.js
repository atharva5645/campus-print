import { Router } from 'express'
import multer from 'multer'
import { deleteDocument, listDocuments, uploadDocument } from '../controllers/documentController.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/', listDocuments)
router.post('/', upload.single('file'), uploadDocument)
router.delete('/:id', deleteDocument)

export default router
