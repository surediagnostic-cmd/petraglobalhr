import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. Server-only — never import this
// from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Used for: company/seed provisioning, and consuming an invite to create the
// first `profiles` row for a new auth user (which the user's own session
// cannot do yet, since no profile/company_id exists for them until this runs).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
