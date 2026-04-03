import "server-only";

import type { LeadData, MessageRole } from "@/features/chat/types";
import { createAdminClient } from "@/lib/supabase/server";

export async function saveConversation(
  conversationId: string,
  messages: Array<{ role: MessageRole; content: string }>
): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const contactSnapshot = extractContactDetails(messages);
  const summary = extractSummary(messages);

  const { error } = await supabase.from("conversations").upsert(
    {
      id: conversationId,
      messages,
      summary,
      contact_name: contactSnapshot.name ?? null,
      contact_email: contactSnapshot.email ?? null,
      contact_phone: contactSnapshot.phone ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Failed to save conversation: ${error.message}`);
  }

  return { id: conversationId };
}

export async function saveLead(
  lead: LeadData,
  messages: Array<{ role: MessageRole; content: string }>
): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const summary = extractSummary(messages);
  const extracted = extractContactDetails(messages);

  const leadPayload = {
    name: lead.name || extracted.name || "Unknown",
    email: lead.email || extracted.email || "",
    phone: lead.phone || extracted.phone || "",
    conversation_id: lead.conversationId,
    summary,
    status: "new" as const,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(leadPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to save lead: ${error.message}`);
  }

  await supabase
    .from("conversations")
    .update({
      lead_captured: true,
      contact_name: leadPayload.name,
      contact_email: leadPayload.email,
      contact_phone: leadPayload.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.conversationId);

  return { id: data.id };
}

function extractSummary(
  messages: Array<{ role: MessageRole; content: string }>
): string {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" | ");

  return userMessages.slice(0, 300);
}

export function extractContactDetails(
  messages: Array<{ role: MessageRole; content: string }>
): Partial<{ name: string; email: string; phone: string }> {
  const userMessages = messages.filter((message) => message.role === "user");
  const userText = userMessages.map((message) => message.content).join(" ");
  const latestUserMessage = userMessages[userMessages.length - 1]?.content?.trim() ?? "";

  const emailMatch = userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = userText.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/
  );
  const explicitNameMatch = userText.match(
    /\b(?:my name is|i am|i'm|this is|it is|it's|call me)\s+([A-Za-z][A-Za-z\s'-]{1,50})/i
  );
  const inferredName = inferShortName(latestUserMessage);

  return {
    email: emailMatch?.[0]?.trim(),
    phone: phoneMatch?.[0]?.trim(),
    name: explicitNameMatch?.[1]?.trim() ?? inferredName,
  };
}

function inferShortName(input: string): string | undefined {
  if (!input) return undefined;

  const cleaned = input.replace(/[.,!?]+$/g, "").trim();
  if (!cleaned || cleaned.includes("@") || /\d/.test(cleaned)) {
    return undefined;
  }

  // Capture compact name-only responses, e.g. "Satoshi" or "Satoshi Nakamoto".
  const simpleNamePattern = /^[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){0,2}$/;
  if (cleaned.length <= 40 && simpleNamePattern.test(cleaned)) {
    return cleaned;
  }

  const introNameMatch = cleaned.match(
    /^(?:i am|i'm|this is|it is|it's)\s+([A-Za-z][A-Za-z\s'-]{1,50})$/i
  );
  return introNameMatch?.[1]?.trim();
}
