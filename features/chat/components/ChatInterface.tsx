"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { LeadCaptureForm } from "@/features/chat/components/LeadCaptureForm";
import { useChat } from "@/features/chat/hooks/useChat";
import { Bot, CheckCircle2 } from "lucide-react";

export function ChatInterface() {
  const {
    messages,
    isLoading,
    showLeadForm,
    leadSubmitted,
    sendMessage,
    submitLead,
    dismissLeadForm,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">AI Assistant</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {isLoading ? "Typing…" : "Online"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {leadSubmitted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Info captured
              </Badge>
            )}
            <a
              href="/admin"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && <TypingIndicator />}

          {showLeadForm && !leadSubmitted && (
            <div className="animate-fade-in">
              <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 text-sm text-center space-y-2">
                <p className="font-medium text-foreground">
                  Ready to connect with our team?
                </p>
                <p className="text-muted-foreground text-xs">
                  Share your contact details to get personalized support.
                </p>
                <button
                  onClick={() => {}}
                  className="text-primary text-xs font-medium hover:underline"
                >
                  The form is opening automatically…
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
      />

      {/* Lead Capture Dialog */}
      <LeadCaptureForm
        open={showLeadForm}
        onSubmit={submitLead}
        onDismiss={dismissLeadForm}
      />
    </div>
  );
}
