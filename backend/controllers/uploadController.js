import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

export const uploadOrderFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'No file uploaded')
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-files'
  const filePath = `orders/${Date.now()}-${req.file.originalname}`

  const { error } = await supabase.storage.from(bucket).upload(filePath, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  })

  if (error) throw createHttpError(500, 'Failed to upload file', error)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

  res.status(201).json({
    path: filePath,
    publicUrl: data.publicUrl,
  })
})
