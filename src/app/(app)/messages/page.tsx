import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { StartConversationButton } from "./start-conversation-button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: myConvos } = await supabase
    .from("hrm_conversation_participants")
    .select("conversation_id, conversations:hrm_conversations(id, type, created_at)")
    .eq("profile_id", profile.id);

  const conversationIds = (myConvos ?? []).map((c) => c.conversation_id);

  const { data: otherParticipants } = conversationIds.length
    ? await supabase
        .from("hrm_conversation_participants")
        .select("conversation_id, profiles:hrm_profiles(id, full_name, role)")
        .in("conversation_id", conversationIds)
        .neq("profile_id", profile.id)
        .returns<
          { conversation_id: string; profiles: { id: string; full_name: string; role: string } | null }[]
        >()
    : { data: [] as { conversation_id: string; profiles: { id: string; full_name: string; role: string } | null }[] };

  const otherByConvo = new Map((otherParticipants ?? []).map((p) => [p.conversation_id, p.profiles]));

  // Staff can only start a conversation with HR/MD (enforced again, server
  // side, in startConversationAction) — so only offer that list to staff.
  // HR/MD get everyone else in the company as a candidate.
  const { data: candidates } = await supabase
    .from("hrm_profiles")
    .select("id, full_name, role")
    .neq("id", profile.id)
    .in("role", isHrOrMd(profile.role) ? ["staff", "hr_manager", "md"] : ["hr_manager", "md"]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Messages</h1>

      <div className="mb-6 space-y-2">
        {(myConvos ?? []).map((c) => {
          const other = otherByConvo.get(c.conversation_id);
          if (!other) return null;
          return (
            <Link key={c.conversation_id} href={`/messages/${c.conversation_id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardTitle>{other.full_name}</CardTitle>
                <p className="text-xs text-slate-500">{other.role}</p>
              </Card>
            </Link>
          );
        })}
        {myConvos?.length === 0 && (
          <p className="text-sm text-slate-500">No conversations yet — start one below.</p>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Start a new conversation</h2>
      <div className="space-y-2">
        {(candidates ?? []).map((c) => (
          <StartConversationButton key={c.id} targetProfileId={c.id} fullName={c.full_name} role={c.role} />
        ))}
        {candidates?.length === 0 && (
          <p className="text-sm text-slate-500">No one available to message yet.</p>
        )}
      </div>
    </div>
  );
}
