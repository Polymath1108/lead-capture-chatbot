import { z } from "zod";

export const leadStatusSchema = z.enum(["new", "contacted", "qualified", "closed"]);

export const updateLeadStatusRequestSchema = z.object({
  id: z.string().uuid("Lead id must be a valid UUID"),
  status: leadStatusSchema,
});

export type UpdateLeadStatusRequestValues = z.infer<
  typeof updateLeadStatusRequestSchema
>;
