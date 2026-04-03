"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Lead, LeadStatus } from "@/features/admin/types";
import { toast } from "@/components/ui/use-toast";
import { User, Mail, Phone, Clock, MessageSquare, ChevronDown } from "lucide-react";

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "success" },
  closed: { label: "Closed", variant: "outline" },
};

const STATUS_ORDER: LeadStatus[] = ["new", "contacted", "qualified", "closed"];

interface LeadsTableProps {
  initialLeads: Lead[];
}

export function LeadsTable({ initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    setUpdatingId(lead.id);
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.status}`);
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
      );
      toast({
        variant: "success",
        title: "Status updated",
        description: `${lead.name} → ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch {
      toast({ variant: "destructive", title: "Failed to update status" });
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total, color: "text-foreground" },
          { label: "New", value: stats.new, color: "text-primary" },
          { label: "Contacted", value: stats.contacted, color: "text-amber-600" },
          { label: "Qualified", value: stats.qualified, color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads list */}
      <Card>
        <CardHeader>
          <CardTitle>Captured Leads</CardTitle>
          <CardDescription>
            Leads stored in Supabase (simulated). Click a row to expand conversation summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leads.map((lead) => {
              const status = STATUS_CONFIG[lead.status];
              const isExpanded = expandedId === lead.id;

              return (
                <div key={lead.id} className="transition-colors hover:bg-muted/30">
                  <button
                    className="w-full text-left px-6 py-4"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : lead.id)
                    }
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Name + badge */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {format(new Date(lead.created_at), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="flex flex-col text-xs text-muted-foreground gap-0.5 sm:w-52 shrink-0">
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" /> {lead.phone}
                        </span>
                      </div>

                      {/* Status + chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-6 pb-5 space-y-4 animate-fade-in">
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Conversation Summary
                        </p>
                        <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2.5 leading-relaxed">
                          {lead.summary || "No summary available."}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_ORDER.map((s) => (
                            <Button
                              key={s}
                              variant={lead.status === s ? "default" : "outline"}
                              size="sm"
                              disabled={lead.status === s || updatingId === lead.id}
                              onClick={() => handleStatusChange(lead, s)}
                              className="text-xs h-7"
                            >
                              {STATUS_CONFIG[s].label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground font-mono">
                        ID: {lead.id} · Conv: {lead.conversation_id}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
