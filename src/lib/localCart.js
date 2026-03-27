const STORAGE_KEY = 'campus_print_cart_items'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readCartItems() {
  if (!canUseStorage()) return []

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function writeCartItems(items) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getLocalCartItems() {
  return readCartItems()
}

export function addLocalCartItem(item) {
  if (!item) return
  const currentItems = readCartItems()
  writeCartItems([{ ...item }, ...currentItems])
}

export function saveLocalCartItems(items) {
  writeCartItems(Array.isArray(items) ? items : [])
}

export function clearLocalCartItems() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(STORAGE_KEY)
}
