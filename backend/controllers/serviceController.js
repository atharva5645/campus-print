import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

export const getServices = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw createHttpError(500, 'Failed to fetch services', error)

  res.json(data)
})

export const createService = asyncHandler(async (req, res) => {
  const { name, icon = 'print', enabled = true, color = '#4a40e0', background = '#eef2ff' } = req.body

  if (!name?.trim()) {
    throw createHttpError(400, 'Service name is required')
  }

  const payload = {
    name: name.trim(),
    icon,
    enabled,
    color,
    background,
  }

  const { data, error } = await supabase.from('services').insert(payload).select().single()

  if (error) throw createHttpError(500, 'Failed to create service', error)

  res.status(201).json(data)
})

export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = req.body

  const { data, error } = await supabase
    .from('services')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createHttpError(500, 'Failed to update service', error)

  res.json(data)
})

export const toggleService = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { enabled } = req.body

  if (typeof enabled !== 'boolean') {
    throw createHttpError(400, 'enabled must be a boolean')
  }

  const { data, error } = await supabase
    .from('services')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createHttpError(500, 'Failed to toggle service', error)

  res.json(data)
})


export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params

  const { error } = await supabase.from('services').delete().eq('id', id)

  if (error) throw createHttpError(500, 'Failed to delete service', error)

  res.status(204).send()
})

