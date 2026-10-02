import supabase from '../config/supabaseClient.js'

// Ping interval: every 5 days (in milliseconds)
const PING_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000

async function pingSupabase() {
  try {
    // Lightweight query — just fetches 1 row to keep the project active
    const { error } = await supabase.from('services').select('id').limit(1)
    if (error) {
      console.warn('[keep-alive] Supabase ping failed:', error.message)
    } else {
      console.log('[keep-alive] Supabase pinged successfully at', new Date().toISOString())
    }
  } catch (err) {
    console.warn('[keep-alive] Supabase ping error:', err.message)
  }
}

export function startKeepAlive() {
  // Ping once immediately on startup
  pingSupabase()

  // Then ping every 5 days
  setInterval(pingSupabase, PING_INTERVAL_MS)

  console.log('[keep-alive] Supabase keep-alive scheduler started (every 5 days)')
}
