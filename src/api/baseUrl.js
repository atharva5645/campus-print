function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '')
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000'
  }

  const { protocol, hostname, port } = window.location
  const isViteDevPort = /^\d+$/.test(port) && Number(port) >= 5173 && Number(port) <= 5199

  if (isViteDevPort) {
    return `${protocol}//${hostname}:5000`
  }

  return window.location.origin.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()
