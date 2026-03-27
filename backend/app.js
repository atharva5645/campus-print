import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'CampusPrint backend is running',
    health: '/api/health',
    services: '/api/services',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'campus-print-backend',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/services', serviceRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/uploads', uploadRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
