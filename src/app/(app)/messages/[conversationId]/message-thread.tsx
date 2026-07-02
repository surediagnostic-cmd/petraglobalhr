"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "../actions";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Message } from "@/lib/types";

export function MessageThread({
  conversationId,
  initialMessages,
  currentProfileId,
}: {
  conversationId: string;
  initialMessages: Message[];
  currentProfileId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    const formData = new FormData();
    formData.set("body", body);
    const result = await sendMessageAction(conversationId, formData);
    setSending(false);
    if (!result.error) setBody("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
              m.sender_id === currentProfileId
                ? "ml-auto bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
            )}
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
