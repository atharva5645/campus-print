import supabase from '../config/supabaseClient.js'
import { createNotifications } from '../lib/notificationStore.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

const PRINT_STATUS_VALUES = ['pending', 'printing_in_progress', 'ready_for_pickup', 'distributed']

function isValidPrintStatus(status) {
  return PRINT_STATUS_VALUES.includes(status)
}

function toLegacyStatus(printStatus) {
  const map = {
    pending: 'pending',
    printing_in_progress: 'processing',
    ready_for_pickup: 'completed',
    distributed: 'completed',
  }

  return map[printStatus] || 'pending'
}

function getPrintStatus(order) {
  return order?.print_status || order?.status || 'pending'
}

function formatDeadlineLabel(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const deadlineLabel = formatDeadlineLabel(order.deadline)

  await createNotifications([
    {
      audience: 'student',
      user_id: order.user_id,
      order_id: order.id,
      type: 'order_created',
      title: 'Your order is getting ready',
      message: deadlineLabel
        ? `Your order for ${summary} has been received. Upload payment before ${deadlineLabel}.`
        : `Your order for ${summary} has been received and is getting ready.`,
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

  const currentPrintStatus = getPrintStatus(order)
  const pickupDeadlineLabel = formatDeadlineLabel(new Date(new Date(order.updated_at || Date.now()).getTime() + 60 * 60 * 1000))
  const statusMessages = {
    pending: `Your order for ${summary} has been queued.`,
    printing_in_progress: `Your order for ${summary} is now printing.`,
    ready_for_pickup: pickupDeadlineLabel
      ? `Your order for ${summary} is ready for pickup. Collect it before ${pickupDeadlineLabel} or it will be terminated.`
      : `Your order for ${summary} is ready for pickup. Collect it within 1 hour or it will be terminated.`,
    distributed: `Your order for ${summary} has been distributed successfully.`,
  }

  await createNotifications([
    {
      audience: 'student',
      user_id: order.user_id,
      order_id: order.id,
      type: 'order_status',
      title: 'Order status updated',
      message: statusMessages[currentPrintStatus] || `Your order for ${summary} was updated.`,
    },
  ])
}

export const getOrders = asyncHandler(async (req, res) => {
  const { user_id } = req.query
  let query = supabase
    .from('orders')
    .select(`
      *,
      services(name, icon)
    `)
    .order('created_at', { ascending: false })

  if (user_id) {
    query = query.eq('user_id', user_id)
  }

  const { data, error } = await query

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
  const deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const payload = {
    user_id,
    service_id,
    pages: Number(pages),
    quantity: Number(quantity),
    price_per_page: Number(price_per_page),
    total_price,
    notes,
    file_urls,
    deadline,
    print_status: 'pending',
    collected: false,
    collected_at: null,
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

  if (!isValidPrintStatus(status)) {
    throw createHttpError(400, `status must be one of: ${PRINT_STATUS_VALUES.join(', ')}`)
  }

  const updates = {
    print_status: status,
    status: toLegacyStatus(status),
    updated_at: new Date().toISOString(),
  }

  if (status === 'distributed') {
    updates.collected = true
    updates.collected_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
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

export const updateOrderCollected = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { collected } = req.body

  if (typeof collected !== 'boolean') {
    throw createHttpError(400, 'collected must be a boolean')
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from('orders')
    .select('id, print_status, status')
    .eq('id', id)
    .single()

  if (existingOrderError) {
    throw createHttpError(500, 'Failed to load order before updating collection status', existingOrderError)
  }

  const currentPrintStatus = getPrintStatus(existingOrder)
  const nextPrintStatus = collected
    ? 'distributed'
    : currentPrintStatus === 'distributed'
    ? 'ready_for_pickup'
    : currentPrintStatus

  const { data, error } = await supabase
    .from('orders')
    .update({
      collected,
      collected_at: collected ? new Date().toISOString() : null,
      print_status: nextPrintStatus,
      status: toLegacyStatus(nextPrintStatus),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      services(name)
    `)
    .single()

  if (error) throw createHttpError(500, 'Failed to update collected status', error)

  createStatusNotification({
    order: data,
    serviceName: data.services?.name || 'printing order',
  }).catch((notificationError) => {
    console.warn('Failed to create order collection notification', notificationError)
  })

  res.json(data)
})
