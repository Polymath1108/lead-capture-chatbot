import { getLeads } from "@/features/admin/repository/admin.repository";
import { LeadsTable } from "@/features/admin/components/LeadsTable";
import { Bot, ArrowLeft, Database } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Admin — Lead Dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const leads = await getLeads();

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Admin Dashboard</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-2.5 py-1">
            <Database className="h-3 w-3" />
            Supabase Live
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Captured Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review conversations and contact information collected by the AI assistant.
          </p>
        </div>

        {/* DB notice */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
          <Database className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Supabase DB — Live Mode</p>
            <p className="text-blue-700 text-xs mt-0.5">
              Data is loaded from your Supabase tables in real time. Make sure
              <code className="font-mono bg-blue-100 px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_URL</code>
              and
              <code className="font-mono bg-blue-100 px-1 rounded mx-1">SUPABASE_SERVICE_ROLE_KEY</code>
              are configured.
            </p>
          </div>
        </div>

        <LeadsTable initialLeads={leads} />
      </main>
    </div>
  );
}
