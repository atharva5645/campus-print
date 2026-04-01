import { apiFetch, API_BASE_URL } from './client'

function normalizeNetworkError(error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new Error(`Could not reach backend at ${API_BASE_URL}. Check that the backend server is running and allowed by CORS.`)
  }

  return error
}

export function getDocuments(serviceId) {
  return apiFetch(`/api/documents?${new URLSearchParams({ serviceId }).toString()}`)
}

export async function uploadDocument({ serviceId, title, file }) {
  const formData = new FormData()
  formData.append('serviceId', serviceId)
  formData.append('title', title)
  formData.append('file', file)

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        // Ignore parse issues.
      }

      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    throw normalizeNetworkError(error)
  }
}

export function deleteDocument(id) {
  return apiFetch(`/api/documents/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
}
