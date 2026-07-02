import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "./message-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS (`is_conversation_participant`) returns zero rows if this profile
  // isn't a participant — notFound() covers "doesn't exist" and "not yours"
  // identically, which is the right behavior (don't reveal which).
  const { data: conversation } = await supabase
    .from("hrm_conversations")
    .select("id")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabase
      .from("hrm_messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("hrm_conversation_participants")
      .select("profiles:hrm_profiles(id, full_name)")
      .eq("conversation_id", conversationId)
      .returns<{ profiles: { id: string; full_name: string } | null }[]>(),
  ]);

  const other = (participants ?? []).find((p) => p.profiles?.id !== profile.id)?.profiles;

  return (
    <div className="flex h-full max-w-2xl flex-col">
      <Link href="/messages" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Back to Messages
      </Link>
      <h1 className="mb-4 text-xl font-semibold">{other?.full_name ?? "Conversation"}</h1>
      <MessageThread
        conversationId={conversationId}
        initialMessages={messages ?? []}
        currentProfileId={profile.id}
      />
    </div>
  );
}
