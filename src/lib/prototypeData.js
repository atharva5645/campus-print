function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

const ORDER_KEY = 'campus_print_prototype_orders'
const NOTIFICATION_KEY = 'campus_print_prototype_notifications'

function readJson(key) {
  if (!canUseStorage()) return []

  const saved = window.localStorage.getItem(key)
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem(key)
    return []
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function buildOrderLabel(order) {
  const quantity = Number(order.quantity || 0)
  const pages = Number(order.pages || 0)
  const serviceName = order.service_name || order.services?.name || 'Printing Order'
  return `${quantity} ${serviceName}${quantity > 1 ? ' sets' : ''} (${pages} ${pages === 1 ? 'page' : 'pages'} each)`
}

export function getPrototypeOrders() {
  return readJson(ORDER_KEY)
}

export function savePrototypeOrders(orders) {
  writeJson(ORDER_KEY, Array.isArray(orders) ? orders : [])
}

export function getPrototypeNotifications() {
  return readJson(NOTIFICATION_KEY)
}

export function savePrototypeNotifications(notifications) {
  writeJson(NOTIFICATION_KEY, Array.isArray(notifications) ? notifications : [])
}

export function addPrototypeNotification(entry) {
  const current = getPrototypeNotifications()
  const next = [
    {
      id: `proto-notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      audience: entry.audience,
      user_id: entry.user_id ?? null,
      order_id: entry.order_id ?? null,
      title: entry.title,
      message: entry.message,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    ...current,
  ]

  savePrototypeNotifications(next)
  return next[0]
}

export function listPrototypeNotifications({ audience, userId = null, limit = 8 }) {
  const filtered = getPrototypeNotifications().filter((item) => {
    if (item.audience !== audience) return false
    if (audience === 'student' && userId && item.user_id !== userId) return false
    return true
  })

  return filtered.slice(0, limit)
}

export function markPrototypeNotificationsRead({ audience, userId = null }) {
  const current = getPrototypeNotifications()
  const next = current.map((item) => {
    const matchesAudience = item.audience === audience
    const matchesUser = audience !== 'student' || !userId || item.user_id === userId

    if (matchesAudience && matchesUser) {
      return { ...item, is_read: true }
    }

    return item
  })

  savePrototypeNotifications(next)
  return next
}

export function createPrototypeOrder(payload) {
  const order = {
    id: `proto-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: payload.user_id,
    student_name: payload.student_name || 'CampusPrint Student',
    service_id: payload.service_id,
    service_name: payload.service_name || 'Printing Order',
    pages: Number(payload.pages),
    quantity: Number(payload.quantity),
    price_per_page: Number(payload.price_per_page),
    total_price: Number(payload.pages) * Number(payload.quantity) * Number(payload.price_per_page),
    notes: payload.notes || null,
    file_urls: payload.file_urls || [],
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    services: {
      name: payload.service_name || 'Printing Order',
      icon: payload.service_icon || 'print',
    },
  }

  const currentOrders = getPrototypeOrders()
  savePrototypeOrders([order, ...currentOrders])

  const label = buildOrderLabel(order)
  addPrototypeNotification({
    audience: 'student',
    user_id: order.user_id,
    order_id: order.id,
    title: 'Your order is getting ready',
    message: `Your order for ${label} has been received and is getting ready.`,
  })
  addPrototypeNotification({
    audience: 'admin',
    order_id: order.id,
    title: 'New print order received',
    message: `${order.student_name} ordered ${label}.`,
  })

  return order
}

export function updatePrototypeOrderStatus(orderId, status) {
  let updatedOrder = null
  const nextOrders = getPrototypeOrders().map((order) => {
    if (order.id !== orderId) return order

    updatedOrder = {
      ...order,
      status,
      updated_at: new Date().toISOString(),
    }

    return updatedOrder
  })

  savePrototypeOrders(nextOrders)

  if (updatedOrder && status === 'completed') {
    const label = buildOrderLabel(updatedOrder)
    addPrototypeNotification({
      audience: 'student',
      user_id: updatedOrder.user_id,
      order_id: updatedOrder.id,
      title: 'Your order is ready',
      message: `Your order for ${label} is ready to take from the print room.`,
    })
  }

  return updatedOrder
}

export function clearCompletedPrototypeOrders() {
  const remainingOrders = getPrototypeOrders().filter((order) => order.status !== 'completed')
  savePrototypeOrders(remainingOrders)
  return remainingOrders
}

export function getPrototypeStats() {
  const orders = getPrototypeOrders()
  return {
    todayJobs: orders.length,
    openAlerts: orders.filter((order) => order.status !== 'completed').length,
  }
}
