import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const app = express()

function isAllowedOrigin(origin) {
  if (!origin) return true

  const configuredOrigin = process.env.CLIENT_URL
  const allowedOrigins = [configuredOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)

  if (allowedOrigins.includes(origin)) {
    return true
  }

  try {
    const parsed = new URL(origin)
    const hostname = parsed.hostname.toLowerCase()
    const hasExplicitPort = /^\d+$/.test(parsed.port)
    const isLoopbackHost = ['localhost', '127.0.0.1', '::1'].includes(hostname)
    const isPrivateIpv4Host = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/.test(hostname)

    // Allow common local and LAN dev origins regardless of which frontend dev port is in use.
    return hasExplicitPort && (isLoopbackHost || isPrivateIpv4Host)
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
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
app.use('/api/documents', documentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/uploads', uploadRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
