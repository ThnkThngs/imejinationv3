import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const BriefSchema = z.object({
  projectType: z.string().max(80).default(""),
  projectName: z.string().max(160).default(""),
  location: z.string().max(200).default(""),
  deadline: z.string().max(120).default(""),
  scope: z.string().max(500).default(""),
  channels: z.string().max(500).default(""),
  mood: z.string().max(500).default(""),
  deliverables: z.string().max(500).default(""),
  budgetRange: z.string().max(120).default(""),
  notes: z.string().max(500).default(""),
  name: z.string().trim().min(1).max(120),
  company: z.string().max(160).default(""),
  email: z.string().trim().email().max(255),
  phone: z.string().max(40).default(""),
  preferredContact: z.string().max(40).default("Email"),
});

export type BriefForm = z.infer<typeof BriefSchema>;

const SYSTEM_PROMPT = `You are a senior producer at Imejination, a Malaysian photography and film studio specialising in aerial, architectural and property work for developers and F&B brands.

Given a client's project brief, draft a clear, confident production approach. Be concrete and practical — no fluff, no apologies.

Return Markdown using ONLY these section headings (in this order):

# Production approach
- 2-4 sentences framing the creative direction.

# Recommended shot list
- 5-8 bullets, each a specific shot (e.g. "Twilight aerial pull-out from facade to skyline").

# Deliverables
- Bullet list mapping stills / film / reels counts to the client's channels.

# Crew & gear
- Bullet list: drone/camera bodies, lenses, lighting, key crew roles.

# Timeline
- Bullet list with realistic phases (pre-pro, shoot days, edit, delivery) in days/weeks.

# Next steps
- 2-3 bullets the client can act on this week.

Keep total length under 450 words. Never invent the client's name or budget. If a field is empty, infer sensible defaults for an aerial/architectural studio.`;

export const generateBrief = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI is not configured.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const userPrompt = [
      `Project type: ${data.projectType || "(unspecified)"}`,
      `Project name: ${data.projectName || "(unspecified)"}`,
      `Location: ${data.location || "(unspecified)"}`,
      `Deadline: ${data.deadline || "(flexible)"}`,
      `Scope of work: ${data.scope || "(not specified)"}`,
      `Channels / usage: ${data.channels || "(not specified)"}`,
      `Mood / references: ${data.mood || "(not specified)"}`,
      `Required deliverables: ${data.deliverables || "(not specified)"}`,
      `Budget range: ${data.budgetRange || "(not disclosed)"}`,
      `Additional notes: ${data.notes || "(none)"}`,
    ].join("\n");

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });

      // Save lead via service role (RLS allows anon insert anyway, but keep it simple here).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .insert({
          name: data.name,
          company: data.company || null,
          email: data.email,
          phone: data.phone || null,
          preferred_contact: data.preferredContact,
          project_type: data.projectType || null,
          project_name: data.projectName || null,
          location: data.location || null,
          deadline: data.deadline || null,
          deliverables: data.deliverables || null,
          budget_range: data.budgetRange || null,
          details: {
            scope: data.scope,
            channels: data.channels,
            mood: data.mood,
            notes: data.notes,
          },
          ai_recommendation: text,
          status: "New",
        })
        .select("id")
        .single();

      return { recommendation: text, leadId: lead?.id ?? null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[generateBrief] unexpected error:", msg);
      if (msg.includes("429")) {
        throw new Error("AI is busy right now — please try again in a moment.");
      }
      if (msg.includes("402")) {
        throw new Error("AI credits exhausted. Please add credits in your Lovable workspace.");
      }
      throw new Error("An unexpected error occurred. Please try again later.");
    }
  });