"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Message, LeadData } from "@/features/chat/types";
import type { LeadFormValues } from "@/features/chat/schemas/chat.schema";
import { toast } from "@/components/ui/use-toast";

const WELCOME_MESSAGE: Message = {
  id: uuidv4(),
  role: "assistant",
  content:
    "Hi there! I'm here to help you navigate your situation and connect you with the right support. What's on your mind today?",
  createdAt: new Date(),
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadCapturePromptShown, setLeadCapturePromptShown] = useState(false);
  const conversationId = useRef<string>(uuidv4());

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({
              role,
              content,
            })),
            conversationId: conversationId.current,
            leadCapturePromptShown,
            leadSubmitted,
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.message,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.showLeadForm && !leadSubmitted && !leadCapturePromptShown) {
          setShowLeadForm(true);
          setLeadCapturePromptShown(true);
        }
      } catch (error) {
        console.error("[useChat] sendMessage error:", error);
        const errorMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content:
            "Sorry, I ran into an issue. Please try again in a moment.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, leadSubmitted, leadCapturePromptShown]
  );

  const submitLead = useCallback(
    async (values: LeadFormValues) => {
      try {
        const lead: LeadData = {
          ...values,
          conversationId: conversationId.current,
        };

        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead,
            messages: messages.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Lead API error: ${response.status}`);
        }

        setLeadSubmitted(true);
        setShowLeadForm(false);

        const confirmMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `Thank you, ${values.name}! We've received your information and someone will reach out to you at ${values.email} shortly. Is there anything else you'd like to share before we connect you with our team?`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, confirmMessage]);

        toast({
          variant: "success",
          title: "Lead saved to database ✓",
          description: `${values.name}'s information has been stored successfully.`,
        });
      } catch (error) {
        console.error("[useChat] submitLead error:", error);
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "Could not save your information. Please try again.",
        });
      }
    },
    [messages]
  );

  const dismissLeadForm = useCallback(() => {
    setShowLeadForm(false);
  }, []);

  return {
    messages,
    isLoading,
    showLeadForm,
    leadSubmitted,
    conversationId: conversationId.current,
    sendMessage,
    submitLead,
    dismissLeadForm,
  };
}
