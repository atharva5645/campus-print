import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'documents'

function buildStoragePath(serviceId, fileName) {
  const safeName = String(fileName || 'document')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')

  return `service-${serviceId}/${Date.now()}-${safeName || 'document'}`
}

function extractStoragePath(fileUrl) {
  const marker = `/storage/v1/object/public/${DOCUMENTS_BUCKET}/`
  const markerIndex = fileUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(fileUrl.slice(markerIndex + marker.length))
}

export const listDocuments = asyncHandler(async (req, res) => {
  const { serviceId } = req.query

  if (!serviceId) {
    throw createHttpError(400, 'serviceId is required')
  }

  const { data, error } = await supabase
    .from('documents')
    .select('id, service_id, title, file_url, created_at')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createHttpError(500, 'Failed to load documents', error)
  }

  res.json(data || [])
})

export const uploadDocument = asyncHandler(async (req, res) => {
  const { serviceId, title } = req.body

  if (!serviceId) {
    throw createHttpError(400, 'serviceId is required')
  }

  if (!title?.trim()) {
    throw createHttpError(400, 'Document title is required')
  }

  if (!req.file) {
    throw createHttpError(400, 'No file uploaded')
  }

  const storagePath = buildStoragePath(serviceId, req.file.originalname)

  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, req.file.buffer, {
    contentType: req.file.mimetype,
    cacheControl: '3600',
    upsert: false,
  })

  if (storageError) {
    throw createHttpError(500, 'Failed to upload document file', storageError)
  }

  const { data: publicUrlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath)

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      service_id: serviceId,
      title: title.trim(),
      file_url: publicUrlData.publicUrl,
    })
    .select('id, service_id, title, file_url, created_at')
    .maybeSingle()

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    throw createHttpError(500, 'Failed to save document record', insertError)
  }

  res.status(201).json(data)
})

export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params

  const { data: existingDocument, error: fetchError } = await supabase
    .from('documents')
    .select('id, file_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    throw createHttpError(500, 'Failed to inspect document', fetchError)
  }

  if (!existingDocument) {
    throw createHttpError(404, 'Document not found')
  }

  const storagePath = extractStoragePath(existingDocument.file_url)

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath])

    if (storageError) {
      throw createHttpError(500, 'Failed to delete document file', storageError)
    }
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw createHttpError(500, 'Failed to delete document record', deleteError)
  }

  res.status(204).send()
})



