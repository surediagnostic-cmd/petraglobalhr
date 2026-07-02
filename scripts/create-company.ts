// Provisions a new company + its first MD user. Companies have no INSERT
// RLS policy for regular sessions on purpose (see 0001_init_schema.sql) —
// this is how a new Petra Global Group company actually gets onboarded.
//
// The MD sets their own name when they accept the invite, so this script
// only needs their email to send it.
//
// Usage:
//   npx tsx scripts/create-company.ts "Company Name" md@company.com

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(__dirname, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

const [companyName, mdEmail] = process.argv.slice(2);

if (!companyName || !mdEmail) {
  console.error('Usage: npx tsx scripts/create-company.ts "Company Name" md@company.com');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const slug = slugify(companyName);

  const { data: existing } = await supabase.from("hrm_companies").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    console.error(`A company with slug "${slug}" already exists (id ${existing.id}).`);
    process.exit(1);
  }

  const { data: company, error: companyError } = await supabase
    .from("hrm_companies")
    .insert({ name: companyName, slug })
    .select("id")
    .single();
  if (companyError) throw companyError;

  console.log(`Created company "${companyName}" (${company.id}).`);

  const { error: inviteError } = await supabase.from("hrm_invites").insert({
    company_id: company.id,
    email: mdEmail.toLowerCase(),
    role: "md",
  });
  if (inviteError) throw inviteError;

  const { error: authError } = await supabase.auth.admin.inviteUserByEmail(mdEmail, {
    redirectTo: `${SITE_URL}/auth/callback?next=/invite`,
  });
  if (authError) throw authError;

  console.log(`Invited ${mdEmail} as MD. They'll receive an email to finish setup.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
