import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_admin: boolean;
}

async function assertCallerIsAdmin(ctx: {
  supabase: any;
  userId: string;
}): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const users: any[] = [];
    let page = 1;
    // Paginate through auth users (100/page cap).
    // Stop after a reasonable ceiling to avoid runaway loops.
    while (page <= 20) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (error) throw new Error(error.message);
      users.push(...data.users);
      if (data.users.length < 100) break;
      page++;
    }

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,role")
      .eq("role", "admin");
    if (rolesErr) throw new Error(rolesErr.message);
    const adminSet = new Set((roles ?? []).map((r: any) => r.user_id));

    const rows: AdminUserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: (u.user_metadata?.name as string) ?? (u.user_metadata?.full_name as string) ?? "",
      created_at: u.created_at,
      is_admin: adminSet.has(u.id),
    }));
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows;
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("Valid email required");
    if (email.length > 320) throw new Error("Email too long");
    return { email };
  })
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find user by email via pagination (Supabase JS has no direct getByEmail).
    let target: any = null;
    let page = 1;
    while (page <= 20 && !target) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (error) throw new Error(error.message);
      target = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email);
      if (list.users.length < 100) break;
      page++;
    }
    if (!target) throw new Error(`No user found with email ${data.email}`);

    // Upsert — unique(user_id, role) prevents duplicates.
    const { error: upErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: target.id, role: "admin" }, { onConflict: "user_id,role" });
    if (upErr) throw new Error(upErr.message);

    return { userId: target.id, email: target.email };
  });

export const removeAdminByUserId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    const userId = String(input?.userId ?? "").trim();
    if (!userId) throw new Error("userId required");
    return { userId };
  })
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("You cannot remove your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
