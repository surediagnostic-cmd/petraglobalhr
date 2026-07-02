"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { acceptInviteAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function InvitePage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setHasSession(!!data.session));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setLoading(false);
      setError(pwError.message);
      return;
    }

    const result = await acceptInviteAction(fullName);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/manual");
    router.refresh();
  }

  if (hasSession === null) return null;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold">Welcome to Petra Global HRM</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Finish setting up your account</p>
        </div>

        {!hasSession ? (
          <p className="text-sm text-slate-600">
            This invite link is invalid or has expired. Ask your HR Manager to resend it, then
            open the new link from your email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Choose a password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Complete setup"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
