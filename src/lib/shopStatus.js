function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

const SHOP_STATUS_KEY = 'campus_print_shop_open'

export function getShopOpenStatus() {
  if (!canUseStorage()) return true

  const saved = window.localStorage.getItem(SHOP_STATUS_KEY)
  if (saved === null) return true
  return saved === 'true'
}

export function saveShopOpenStatus(isOpen) {
  if (!canUseStorage()) return
  window.localStorage.setItem(SHOP_STATUS_KEY, String(Boolean(isOpen)))
}
