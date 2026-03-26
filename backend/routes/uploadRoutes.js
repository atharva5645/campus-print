import { Router } from 'express'
import multer from 'multer'
import { uploadOrderFile } from '../controllers/uploadController.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', upload.single('file'), uploadOrderFile)

export default router
