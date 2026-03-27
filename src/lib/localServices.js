const STORAGE_KEY = 'campus_print_services'

const defaultServices = [
  {
    id: 'local-blue-books',
    name: 'Blue Books',
    icon: 'menu_book',
    enabled: true,
    color: '#4a40e0',
    background: '#eef2ff',
  },
  {
    id: 'local-color-printing',
    name: 'Color Printing',
    icon: 'print',
    enabled: true,
    color: '#00628c',
    background: '#e9f8ff',
  },
  {
    id: 'local-no-due-forms',
    name: 'No Due Forms',
    icon: 'description',
    enabled: false,
    color: '#006947',
    background: '#e8f7ef',
  },
  {
    id: 'local-lab-manuals',
    name: 'Lab Manuals',
    icon: 'science',
    enabled: true,
    color: '#b41340',
    background: '#fff1f4',
  },
]

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeServices(services) {
  if (!Array.isArray(services) || services.length === 0) {
    return defaultServices
  }

  return services.map((service) => ({
    ...service,
    background: service.background || service.bg || '#eef2ff',
    color: service.color || '#4a40e0',
  }))
}

function hasEnabledService(services) {
  return services.some((service) => service.enabled)
}

export function getLocalServices() {
  if (!canUseStorage()) {
    return defaultServices
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices))
    return defaultServices
  }

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length > 0 ? normalizeServices(parsed) : defaultServices
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices))
    return defaultServices
  }
}

export function saveLocalServices(services) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeServices(services)))
}

export function syncLocalServices(services) {
  if (!Array.isArray(services) || services.length === 0) return

  const normalized = normalizeServices(services)

  saveLocalServices(normalized)
}

export function getStudentSafeServices(candidateServices = null) {
  const normalized = candidateServices ? normalizeServices(candidateServices) : getLocalServices()

  if (hasEnabledService(normalized)) {
    return normalized
  }

  saveLocalServices(defaultServices)
  return defaultServices
}
