import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase Auth (invite emails, magic links, password recovery) redirects
// here with a `code` param. Exchanging it establishes the session cookie
// before we send the user on to wherever they actually need to land.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/invite";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
