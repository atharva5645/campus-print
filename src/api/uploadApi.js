const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function uploadOrderFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: 'POST',
    body: formData,
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
}
