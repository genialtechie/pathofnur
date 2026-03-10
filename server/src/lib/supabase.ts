import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { requireServerSecret } from "../config.js"

let supabaseClient: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient(
    requireServerSecret("supabaseUrl"),
    requireServerSecret("supabaseServiceRoleKey"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return supabaseClient
}
