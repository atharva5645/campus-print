import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

async function ensureProfileExists(userId, studentName = null) {
  if (!userId) {
    return
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (profileLookupError) {
    throw createHttpError(500, 'Failed to verify user profile', profileLookupError)
  }

  if (existingProfile) {
    return
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: userId,
    full_name: studentName || 'CampusPrint Student',
    email: studentName || `user-${userId}@campusprint.local`,
    role: 'student',
  })

  if (insertError) {
    throw createHttpError(500, 'Failed to create user profile', insertError)
  }
}

export const getOrders = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      services(name, icon)
    `)
    .order('created_at', { ascending: false })

  if (error) throw createHttpError(500, 'Failed to fetch orders', error)

  res.json(data)
})

export const createOrder = asyncHandler(async (req, res) => {
  const {
    user_id = null,
    student_name = null,
    service_id,
    pages,
    quantity,
    price_per_page,
    notes = null,
    file_urls = [],
  } = req.body

  if (!service_id || !pages || !quantity || !price_per_page) {
    throw createHttpError(400, 'service_id, pages, quantity, and price_per_page are required')
  }

  await ensureProfileExists(user_id, student_name)

  const total_price = Number(pages) * Number(quantity) * Number(price_per_page)

  const payload = {
    user_id,
    service_id,
    pages: Number(pages),
    quantity: Number(quantity),
    price_per_page: Number(price_per_page),
    total_price,
    notes,
    file_urls,
    status: 'pending',
  }

  const { data, error } = await supabase.from('orders').insert(payload).select().single()

  if (error) throw createHttpError(500, 'Failed to create order', error)

  res.status(201).json(data)
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    throw createHttpError(400, 'status is required')
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createHttpError(500, 'Failed to update order status', error)

  res.json(data)
})
