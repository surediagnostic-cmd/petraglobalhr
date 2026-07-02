"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";

// Business rule (not a row-visibility rule, so not expressed in RLS): staff
// may only START a DM with an HR Manager or MD, not another staff member.
// HR Manager/MD may start a DM with anyone in their company. Once a
// conversation exists, RLS governs who can read/post in it.
export async function startConversationAction(targetProfileId: string): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!isHrOrMd(profile.role)) {
    const { data: target } = await supabase
      .from("hrm_profiles")
      .select("role")
      .eq("id", targetProfileId)
      .single();

    if (!target || !isHrOrMd(target.role)) {
      return { error: "Staff can only start a conversation with an HR Manager or the MD." };
    }
  }

  const { data: myConvos } = await supabase
    .from("hrm_conversation_participants")
    .select("conversation_id")
    .eq("profile_id", profile.id);

  const myConvoIds = (myConvos ?? []).map((c) => c.conversation_id);

  if (myConvoIds.length > 0) {
    const { data: shared } = await supabase
      .from("hrm_conversation_participants")
      .select("conversation_id")
      .eq("profile_id", targetProfileId)
      .in("conversation_id", myConvoIds);

    if (shared && shared.length > 0) {
      // Reuse the first shared conversation rather than creating a duplicate
      // 1:1 thread every time either side clicks "message" again.
      redirect(`/messages/${shared[0].conversation_id}`);
    }
  }

  const { data: conversation, error } = await supabase
    .from("hrm_conversations")
    .insert({ company_id: profile.company_id, type: "direct" })
    .select("id")
    .single();

  if (error || !conversation) return { error: error?.message ?? "Could not start conversation." };

  const { error: participantsError } = await supabase.from("hrm_conversation_participants").insert([
    { conversation_id: conversation.id, profile_id: profile.id },
    { conversation_id: conversation.id, profile_id: targetProfileId },
  ]);

  if (participantsError) return { error: participantsError.message };

  redirect(`/messages/${conversation.id}`);
}

export async function sendMessageAction(
  conversationId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Message cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hrm_messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, body });

  if (error) return { error: error.message };
  return {};
}
