import crypto from "node:crypto"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

function parseCookies(header) {
  return (header || '')
    .split(';')
    .map((part) => part.trim().split('='))
    .filter(([k, v]) => k && v)
    .reduce((acc, [k, v]) => {
      acc[k] = decodeURIComponent(v)
      return acc
    }, {})
}

function sign(payload) {
  if (!SESSION_SECRET) return null
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verify(token) {
  if (!token || !SESSION_SECRET) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function createAdminSession(res, email) {
  const now = Date.now()
  const token = sign({ email, exp: now + SESSION_TTL_MS })
  if (!token) {
    throw new Error('Missing admin session secret')
  }
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

export function clearAdminSession(res) {
  res.cookie(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 0,
    path: '/',
  })
}

export function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '')
  const token = cookies[SESSION_COOKIE]
  const payload = verify(token)
  if (!payload || payload.email !== ADMIN_EMAIL) {
    res.status(401).json({ message: 'Unauthorized admin' })
    return
  }
  req.admin = { email: payload.email }
  next()
}

export function validateAdminCredentials(email, password) {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD && Boolean(SESSION_SECRET)
}