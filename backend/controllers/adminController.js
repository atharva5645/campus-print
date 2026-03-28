import supabase from '../config/supabaseClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createHttpError } from '../utils/httpError.js'

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [{ count: jobsCount, error: jobsError }, { count: servicesCount, error: servicesError }, { count: alertsCount, error: alertsError }] =
    await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('admin_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    ])

  if (jobsError) throw createHttpError(500, 'Failed to fetch jobs count', jobsError)
  if (servicesError) throw createHttpError(500, 'Failed to fetch services count', servicesError)
  if (alertsError) throw createHttpError(500, 'Failed to fetch alerts count', alertsError)

  res.json({
    todayJobs: jobsCount || 0,
    services: servicesCount || 0,
    openAlerts: alertsCount || 0,
  })
})

export const getRecentJobs = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      services(name, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw createHttpError(500, 'Failed to fetch recent jobs', error)

  res.json(data)
})

