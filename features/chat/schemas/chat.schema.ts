import { z } from "zod";

export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const chatApiRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  conversationId: z.string().uuid(),
  leadCapturePromptShown: z.boolean().optional().default(false),
  leadSubmitted: z.boolean().optional().default(false),
});

export const leadFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number"),
});

export const saveLeadRequestSchema = z.object({
  lead: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    conversationId: z.string().uuid(),
    summary: z.string().optional(),
  }),
  messages: z.array(messageSchema),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type ChatApiRequestValues = z.infer<typeof chatApiRequestSchema>;
export type SaveLeadRequestValues = z.infer<typeof saveLeadRequestSchema>;
