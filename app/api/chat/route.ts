import { NextRequest, NextResponse } from "next/server";
import { openai, CHAT_MODEL, SYSTEM_PROMPT } from "@/lib/openai";
import { chatApiRequestSchema } from "@/features/chat/schemas/chat.schema";
import {
  extractContactDetails,
  saveConversation,
} from "@/features/chat/repository/chat.repository";

const COLLECT_LEAD_TOKEN = "[COLLECT_LEAD]";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatApiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, conversationId, leadCapturePromptShown, leadSubmitted } = parsed.data;

    // Persist conversation (simulated)
    await saveConversation(conversationId, messages);

    // Call OpenAI
    let aiMessage = "";
    let showLeadForm = false;
    const userTurnCount = messages.filter((message) => message.role === "user").length;
    const leadCollectionReady = shouldCollectLead(messages);
    const contactDetails = extractContactDetails(messages);
    const missingContactFields = getMissingContactFields(contactDetails);

    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(leadCapturePromptShown
            ? [
                {
                  role: "system" as const,
                  content:
                    "The lead capture popup has already been shown once. Do not request popup reopening. If contact details are still missing, ask naturally in chat for only the missing fields (name, email, or phone). Keep it short and ask one question.",
                },
              ]
            : []),
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      aiMessage = completion.choices[0]?.message?.content ?? "";
    } catch (openAiError) {
      // Graceful fallback when no valid API key
      console.warn("[OpenAI] API error — using fallback response:", openAiError);
      aiMessage = getFallbackResponse(userTurnCount, leadCapturePromptShown, leadSubmitted);
    }

    // Detect and strip the lead-form trigger token
    if (
      aiMessage.includes(COLLECT_LEAD_TOKEN) &&
      !leadCapturePromptShown &&
      !leadSubmitted
    ) {
      showLeadForm = true;
    }
    aiMessage = aiMessage.replace(COLLECT_LEAD_TOKEN, "").trim();

    // Enforce lead capture prompt when enough context has been gathered.
    if (
      !leadCapturePromptShown &&
      !showLeadForm &&
      !leadSubmitted &&
      leadCollectionReady &&
      userTurnCount >= 2 &&
      missingContactFields.length > 0
    ) {
      showLeadForm = true;
      aiMessage = ensureMissingContactPrompt(aiMessage, missingContactFields);
    }

    if (
      leadCapturePromptShown &&
      !leadSubmitted &&
      missingContactFields.length > 0
    ) {
      // After first popup, continue contact collection naturally in chat.
      aiMessage = ensureMissingContactPrompt(aiMessage, missingContactFields);
      showLeadForm = false;
    }

    aiMessage = limitResponseLength(aiMessage, showLeadForm ? 5 : 4);

    return NextResponse.json({
      message: aiMessage,
      showLeadForm,
      conversationId,
    });
  } catch (error) {
    console.error("[POST /api/chat]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getFallbackResponse(
  userTurnCount: number,
  leadCapturePromptShown: boolean,
  leadSubmitted: boolean
): string {
  if (leadCapturePromptShown && !leadSubmitted) {
    const naturalResponses = [
      "Thanks for sharing that. To keep helping you, could you share the missing contact details?",
      "Got it. Could you also share the missing contact details so we can follow up properly?",
      "That helps a lot. Please share the remaining contact details, and then I can guide your next step.",
      "We’re close. Could you share any remaining contact details so we can proceed?",
    ];
    const naturalIndex = Math.min(userTurnCount - 1, naturalResponses.length - 1);
    return naturalResponses[naturalIndex] ?? naturalResponses[naturalResponses.length - 1];
  }

  const responses = [
    "Thanks for reaching out! Could you tell me a bit more about your situation so I can better understand how to help?",
    "I see — that sounds like something we can definitely help with. How long has this been going on for you?",
    "Got it. Has this impacted your work or personal life in a significant way?",
    "Thank you for sharing that. Based on what you've told me, I think we have a clear path forward. To connect you with the right person, could I get your contact details? [COLLECT_LEAD]",
    "We really appreciate you trusting us with this. Is there anything else you'd like to add before we follow up?",
  ];

  const index = Math.min(userTurnCount - 1, responses.length - 1);
  return responses[index] ?? responses[responses.length - 1];
}

function shouldCollectLead(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): boolean {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.toLowerCase());

  if (userMessages.length < 2) {
    return false;
  }

  const totalUserText = userMessages.join(" ");
  const urgencyHints = [
    "urgent",
    "asap",
    "immediately",
    "today",
    "tomorrow",
    "deadline",
    "soon",
  ];
  const detailHints = [
    "because",
    "since",
    "issue",
    "problem",
    "situation",
    "need help",
    "stuck",
  ];

  const hasUrgencyHint = urgencyHints.some((hint) => totalUserText.includes(hint));
  const hasDetailHint = detailHints.some((hint) => totalUserText.includes(hint));

  // Capture earlier: urgency or clear detail by turn 2+, and always by turn 3+.
  return hasUrgencyHint || hasDetailHint || userMessages.length >= 3;
}

function ensureMissingContactPrompt(
  message: string,
  missingFields: Array<"name" | "email" | "phone">
): string {
  const trimmed = message.trim();

  const fieldLabelMap: Record<"name" | "email" | "phone", string> = {
    name: "name",
    email: "email",
    phone: "phone number",
  };

  const missingFieldsLabel = formatNaturalList(
    missingFields.map((field) => fieldLabelMap[field])
  );
  const lower = trimmed.toLowerCase();
  const alreadyAsksForAllMissing = missingFields.every((field) =>
    lower.includes(fieldLabelMap[field])
  );

  if (alreadyAsksForAllMissing) {
    return trimmed;
  }

  return `${trimmed} To move forward, please share your ${missingFieldsLabel} so we can connect you with the right next step.`;
}

function getMissingContactFields(details: Partial<{ name: string; email: string; phone: string }>) {
  const missing: Array<"name" | "email" | "phone"> = [];

  if (!details.name) missing.push("name");
  if (!details.email) missing.push("email");
  if (!details.phone) missing.push("phone");

  return missing;
}

function formatNaturalList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function limitResponseLength(message: string, maxSentences: number): string {
  const sentenceSplit = message
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceSplit.length <= maxSentences) {
    return message;
  }

  return sentenceSplit.slice(0, maxSentences).join(" ");
}
