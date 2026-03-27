import supabase from '../config/supabaseClient.js'
import { createNotifications } from '../lib/notificationStore.js'
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

async function getProfileLabel(userId) {
  if (!userId) {
    return 'A student'
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, 'Failed to load order profile context', error)
  }

  return data?.full_name || data?.email || 'A student'
}

function buildOrderSummary({ quantity, serviceName, pages }) {
  const quantityLabel = `${quantity} ${serviceName}${quantity > 1 ? ' sets' : ''}`
  const pageLabel = pages > 1 ? `${pages} pages each` : '1 page'
  return `${quantityLabel} (${pageLabel})`
}

async function createOrderNotifications({ order, serviceName, studentLabel }) {
  const summary = buildOrderSummary({
    quantity: Number(order.quantity),
    serviceName,
    pages: Number(order.pages),
  })

  await createNotifications([
    {
      audience: 'student',
      user_id: order.user_id,
      order_id: order.id,
      type: 'order_created',
      title: 'Your order is getting ready',
      message: `Your order for ${summary} has been received and is getting ready.`,
    },
    {
      audience: 'admin',
      order_id: order.id,
      type: 'admin_order_created',
      title: 'New print order received',
      message: `${studentLabel} ordered ${summary}.`,
    },
  ])
}

async function createStatusNotification({ order, serviceName }) {
  if (!order.user_id) {
    return
  }

  const summary = buildOrderSummary({
    quantity: Number(order.quantity),
    serviceName,
    pages: Number(order.pages),
  })

  const statusMessages = {
    pending: `Your order for ${summary} has been queued.`,
    in_review: `Your order for ${summary} is now under review.`,
    processing: `Your order for ${summary} is getting ready.`,
    completed: `Your order for ${summary} is ready for pickup.`,
    cancelled: `Your order for ${summary} was cancelled. Please contact the print room if needed.`,
  }

  await createNotifications([
    {
      audience: 'student',
      user_id: order.user_id,
      order_id: order.id,
      type: 'order_status',
      title: 'Order status updated',
      message: statusMessages[order.status] || `Your order for ${summary} was updated.`,
    },
  ])
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

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select(`
      *,
      services(name)
    `)
    .single()

  if (error) throw createHttpError(500, 'Failed to create order', error)

  const serviceName = data.services?.name || 'printing order'
  const studentLabel = student_name || (await getProfileLabel(user_id))

  createOrderNotifications({
    order: data,
    serviceName,
    studentLabel,
  }).catch((notificationError) => {
    console.warn('Failed to create order notifications', notificationError)
  })

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
    .select(`
      *,
      services(name)
    `)
    .single()

  if (error) throw createHttpError(500, 'Failed to update order status', error)

  createStatusNotification({
    order: data,
    serviceName: data.services?.name || 'printing order',
  }).catch((notificationError) => {
    console.warn('Failed to create order status notification', notificationError)
  })

  res.json(data)
})
