import { NextRequest, NextResponse } from "next/server";
import { saveLeadRequestSchema } from "@/features/chat/schemas/chat.schema";
import { saveLead } from "@/features/chat/repository/chat.repository";
import { updateLeadStatus } from "@/features/admin/repository/admin.repository";
import { updateLeadStatusRequestSchema } from "@/features/admin/schemas/admin.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveLeadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid lead data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lead, messages } = parsed.data;

    const result = await saveLead(lead, messages);

    console.log(`[POST /api/leads] Lead saved → id: ${result.id}, name: ${lead.name}, email: ${lead.email}`);

    return NextResponse.json({
      success: true,
      leadId: result.id,
    });
  } catch (error) {
    console.error("[POST /api/leads]", error);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateLeadStatusRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;
    await updateLeadStatus(id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/leads]", error);
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    );
  }
}
