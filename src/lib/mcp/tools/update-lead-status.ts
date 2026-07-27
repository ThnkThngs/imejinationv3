import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "update_lead_status",
  title: "Update lead status",
  description:
    "Change the pipeline status of a lead (New, In Review, Won, Lost, Archived). Admin only.",
  inputSchema: {
    lead_id: z.string().describe("The lead's UUID, from list_leads."),
    status: z
      .string()
      .describe("New status: one of New, In Review, Won, Lost, Archived."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ lead_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const allowed = ["New", "In Review", "Won", "Lost", "Archived"];
    if (!allowed.includes(status)) return failure(`status must be one of: ${allowed.join(", ")}`);
    const { data, error } = await supabaseForUser(ctx)
      .from("leads")
      .update({ status })
      .eq("id", lead_id)
      .select("id,name,status")
      .maybeSingle();
    if (error) return failure(error.message);
    if (!data) return failure("Lead not found, or your account is not allowed to update it.");
    return ok(data);
  },
});
