import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

const DEMO_EMAIL = 'student@campusprintdemo.com'
const DEMO_PASSWORD = 'CampusPrint@123'
const DEMO_ADMIN_EMAIL = 'admin@campusprintdemo.com'
const DEMO_ADMIN_PASSWORD = 'CampusAdmin@123'

async function ensureProfile(user, role, fullName) {
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (lookupError) {
    throw createHttpError(500, 'Failed to verify demo profile', lookupError)
  }

  if (existingProfile) {
    return
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: fullName,
    email: user.email,
    role,
  })

  if (insertError) {
    throw createHttpError(500, 'Failed to create demo profile', insertError)
  }
}

async function findOrCreateDemoUser({ email, password, role, fullName }) {
  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    throw createHttpError(500, 'Failed to inspect demo users', listError)
  }

  let demoUser = listedUsers.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

  if (!demoUser) {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })

    if (createError) {
      throw createHttpError(500, 'Failed to create demo user', createError)
    }

    demoUser = createdUser.user
  }

  await ensureProfile(demoUser, role, fullName)
}

export const ensureDemoUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw createHttpError(400, 'Demo credentials do not match the configured demo account')
  }

  await findOrCreateDemoUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    role: 'student',
    fullName: 'CampusPrint Demo Student',
  })

  res.json({
    ok: true,
    email: DEMO_EMAIL,
  })
})

export const ensureDemoAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
    throw createHttpError(400, 'Demo credentials do not match the configured admin account')
  }

  await findOrCreateDemoUser({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    role: 'admin',
    fullName: 'CampusPrint Demo Admin',
  })

  res.json({
    ok: true,
    email: DEMO_ADMIN_EMAIL,
  })
})
