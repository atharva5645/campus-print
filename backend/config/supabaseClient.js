import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing. Backend requests will fail until they are configured.')
}

const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'missing-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default supabase
