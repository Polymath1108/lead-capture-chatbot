export type LeadStatus = "new" | "contacted" | "qualified" | "closed";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  conversation_id: string;
  summary: string;
  status: LeadStatus;
  created_at: string;
}
