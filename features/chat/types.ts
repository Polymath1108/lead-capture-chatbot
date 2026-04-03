export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface LeadData {
  name: string;
  email: string;
  phone: string;
  conversationId: string;
  summary?: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  leadCaptured: boolean;
}

export interface ChatApiRequest {
  messages: Array<{ role: MessageRole; content: string }>;
  conversationId: string;
  leadCapturePromptShown?: boolean;
  leadSubmitted?: boolean;
}

export interface ChatApiResponse {
  message: string;
  showLeadForm: boolean;
  conversationId: string;
}

export interface SaveLeadRequest {
  lead: LeadData;
  messages: Array<{ role: MessageRole; content: string }>;
}

export interface SaveLeadResponse {
  success: boolean;
  leadId: string;
}
