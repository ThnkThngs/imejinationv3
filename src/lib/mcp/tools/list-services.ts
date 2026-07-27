import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_services",
  title: "List services",
  description: "List the studio's service offerings (title, description, publish state, order).",
  inputSchema: {
    published_only: z.boolean().optional().describe("Only return published services."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ published_only }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("services")
      .select("id,title,description,icon,image,published,display_order")
      .order("display_order", { ascending: true });
    if (published_only) query = query.eq("published", true);
    const { data, error } = await query;
    return error ? failure(error.message) : ok(data ?? []);
  },
});
