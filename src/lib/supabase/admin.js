// src/lib/supabase/admin.js
import { createClient } from '@supabase/supabase-js'

// This client is for server-side operations that require admin privileges.
// It bypasses RLS policies. Use with extreme caution.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)