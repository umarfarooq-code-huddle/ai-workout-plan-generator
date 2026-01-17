import { createClient } from "@supabase/supabase-js"

const supabaseProjectId = process.env.supabase_project_id ?? process.env.SUPABASE_PROJECT_ID
const supabaseSecretKey = process.env.supabase_secret_key ?? process.env.SUPABASE_SECRET_KEY
const supabaseUrl = supabaseProjectId ? `https://${supabaseProjectId}.supabase.co` : undefined

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Supabase env vars are missing. Please set supabase_project_id (or SUPABASE_PROJECT_ID) and supabase_secret_key (or SUPABASE_SECRET_KEY).")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
