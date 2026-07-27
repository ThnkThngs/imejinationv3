import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

const STATUSES = ["New", "In Review", "Won", "Lost", "Archived"] as const;

export default defineTool({
  name: "list_leads",
  title: "List client leads",
  description:
    "List client enquiries and AI brief submissions. Requires an admin account — non-admins get no rows.",
  inputSchema: {
    status: z.string().optional().describe(`Filter by status: ${STATUSES.join(", ")}.`),
    limit: z.number().int().optional().describe("Max leads to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    let query = supabaseForUser(ctx)
      .from("leads")
      .select(
        "id,name,company,email,phone,service,project_type,project_name,location,budget_range,deadline,message,status,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(take);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    return error ? failure(error.message) : ok(data ?? []);
  },
});
