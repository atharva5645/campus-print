import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

async function ensureProfileExists(userId) {
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
    full_name: 'CampusPrint Demo User',
    email: `demo-${userId}@campusprint.local`,
    role: 'student',
  })

  if (insertError) {
    throw createHttpError(500, 'Failed to create demo user profile', insertError)
  }
}

export const getCartItems = asyncHandler(async (req, res) => {
  const { user_id } = req.query

  if (!user_id) {
    throw createHttpError(400, 'user_id is required')
  }

  await ensureProfileExists(user_id)

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      services(name, icon)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) throw createHttpError(500, 'Failed to fetch cart items', error)

  res.json(data)
})

export const addCartItem = asyncHandler(async (req, res) => {
  const { user_id, service_id, pages, quantity, price_per_page } = req.body

  if (!user_id || !service_id || !pages || !quantity || !price_per_page) {
    throw createHttpError(400, 'user_id, service_id, pages, quantity, and price_per_page are required')
  }

  await ensureProfileExists(user_id)

  const total_price = Number(pages) * Number(quantity) * Number(price_per_page)

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id,
      service_id,
      pages: Number(pages),
      quantity: Number(quantity),
      price_per_page: Number(price_per_page),
      total_price,
    })
    .select()
    .single()

  if (error) throw createHttpError(500, 'Failed to add cart item', error)

  res.status(201).json(data)
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params

  const { error } = await supabase.from('cart_items').delete().eq('id', id)

  if (error) throw createHttpError(500, 'Failed to remove cart item', error)

  res.status(204).send()
})
