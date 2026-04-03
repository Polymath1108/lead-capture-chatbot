import "server-only";

import type { Lead, LeadStatus } from "@/features/admin/types";
import { createAdminClient } from "@/lib/supabase/server";

export async function getLeads(): Promise<Lead[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return (data ?? []) as Lead[];
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`);
  }
}
