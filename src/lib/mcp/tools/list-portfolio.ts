import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_portfolio",
  title: "List portfolio projects",
  description:
    "List Imejination portfolio projects with title, category, location, description and publish state.",
  inputSchema: {
    published_only: z
      .boolean()
      .optional()
      .describe("Only return published projects. Defaults to false (all visible projects)."),
    limit: z.number().int().optional().describe("Max projects to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ published_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabaseForUser(ctx)
      .from("portfolio")
      .select("id,title,category,location,description,cover_image,featured,published,display_order")
      .order("display_order", { ascending: true })
      .limit(take);
    if (published_only) query = query.eq("published", true);
    const { data, error } = await query;
    return error ? failure(error.message) : ok(data ?? []);
  },
});
