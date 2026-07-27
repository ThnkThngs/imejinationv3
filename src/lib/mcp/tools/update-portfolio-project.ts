import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "update_portfolio_project",
  title: "Update portfolio project",
  description:
    "Update editable fields of a portfolio project (title, category, location, description, published, featured). Admin only.",
  inputSchema: {
    project_id: z.string().describe("The project's UUID, from list_portfolio."),
    title: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, ...fields }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const patch: Database["public"]["Tables"]["portfolio"]["Update"] = {};
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.category !== undefined) patch.category = fields.category;
    if (fields.location !== undefined) patch.location = fields.location;
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.published !== undefined) patch.published = fields.published;
    if (fields.featured !== undefined) patch.featured = fields.featured;

    if (Object.keys(patch).length === 0) return failure("Provide at least one field to update.");
    const { data, error } = await supabaseForUser(ctx)
      .from("portfolio")
      .update(patch)

      .eq("id", project_id)
      .select("id,title,category,published,featured")
      .maybeSingle();
    if (error) return failure(error.message);
    if (!data) return failure("Project not found, or your account is not allowed to update it.");
    return ok(data);
  },
});
