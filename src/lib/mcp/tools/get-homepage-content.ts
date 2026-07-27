import { defineTool } from "@lovable.dev/mcp-js";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_homepage_content",
  title: "Get homepage content",
  description: "Read the editable homepage copy: hero title, subtitle, CTA, about text and stats.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("homepage")
      .select("hero_title,hero_subtitle,hero_cta,hero_video,about_text,statistics,updated_at")
      .maybeSingle();
    return error ? failure(error.message) : ok(data ?? {});
  },
});
