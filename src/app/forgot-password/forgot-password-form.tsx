"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    // Always show the same success message regardless of whether the email
    // exists — otherwise this becomes a way to check who has an account.
    if (!error) {
      setSent(true);
    } else {
      setError(error.message);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Check your email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If an account exists for {email}, a password reset link is on its way.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reset your password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We&apos;ll email you a link to choose a new one.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <a href="/login" className="underline">
          Back to sign in
        </a>
      </p>
    </Card>
  );
}
