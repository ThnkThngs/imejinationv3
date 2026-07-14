// Supabase-backed admin data hooks. RLS enforces admin-only writes; SELECT is
// scoped by policies. Same hook signatures as before so pages don't change.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  Brief,
  BriefStatus,
  HomepageContent,
  Lead,
  LeadStatus,
  PortfolioItem,
  Service,
} from "./mock-data";
import { emptyHomepage } from "./mock-data";

// ————— Auth —————
export interface AdminSession {
  userId: string;
  email: string;
  name: string;
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        setSession({
          userId: data.user.id,
          email: data.user.email ?? "",
          name: (data.user.user_metadata?.name as string) ?? data.user.email ?? "Admin",
        });
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!mounted) return;
      if (s?.user) {
        setSession({
          userId: s.user.id,
          email: s.user.email ?? "",
          name: (s.user.user_metadata?.name as string) ?? s.user.email ?? "Admin",
        });
      } else {
        setSession(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  return { session, signOut, loading, isAuthenticated: !!session };
}

// ————— Leads —————
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("id,name,email,phone,company,service,message,status,created_at,project_type,details")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setLeads(
      (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        service: r.service ?? r.project_type ?? null,
        message: r.message ?? (r.details ? JSON.stringify(r.details) : null),
        status: r.status as LeadStatus,
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return { leads, loading, refresh, updateStatus, remove };
}

// ————— Briefs (leads with an AI recommendation attached) —————
export function useBriefs() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .not("ai_recommendation", "is", null)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setBriefs(
      (data ?? []).map((r: any) => ({
        id: r.id,
        client_name: r.name,
        email: r.email,
        project_type: r.project_type ?? r.service ?? "—",
        budget_range: r.budget_range ?? "—",
        timeline: r.deadline ?? "—",
        location: r.location ?? "—",
        deliverables: r.deliverables ?? "—",
        details: r.message ?? (r.details ? JSON.stringify(r.details) : ""),
        ai_recommendation: r.ai_recommendation ?? "",
        status: (r.status ?? "New") as BriefStatus,
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (id: string, status: BriefStatus) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setBriefs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return { briefs, loading, refresh, updateStatus };
}

// ————— Portfolio —————
export function usePortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setItems(((data ?? []) as unknown) as PortfolioItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsert = async (item: PortfolioItem) => {
    const { id, created_at, updated_at, ...rest } = item;
    const payload = rest as any;
    if (id && items.some((i) => i.id === id)) {
      const { error } = await supabase.from("portfolio").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Project updated");
    } else {
      const { error } = await supabase.from("portfolio").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Project created");
    }
    await refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePublished = async (id: string) => {
    const cur = items.find((i) => i.id === id);
    if (!cur) return;
    const { error } = await supabase
      .from("portfolio")
      .update({ published: !cur.published })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, published: !p.published } : p)));
  };

  const toggleFeatured = async (id: string) => {
    const cur = items.find((i) => i.id === id);
    if (!cur) return;
    const { error } = await supabase
      .from("portfolio")
      .update({ featured: !cur.featured })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p)));
  };

  const duplicate = async (id: string) => {
    const cur = items.find((i) => i.id === id);
    if (!cur) return;
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = cur;
    const { error } = await supabase.from("portfolio").insert({
      ...rest,
      title: `${cur.title} (Copy)`,
      published: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Project duplicated");
    await refresh();
  };

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase.from("portfolio").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${ids.length} project${ids.length > 1 ? "s" : ""}`);
    setItems((prev) => prev.filter((p) => !ids.includes(p.id)));
  };

  const bulkPublish = async (ids: string[], published: boolean) => {
    if (ids.length === 0) return;
    const { error } = await supabase.from("portfolio").update({ published }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(
      `${published ? "Published" : "Unpublished"} ${ids.length} project${ids.length > 1 ? "s" : ""}`,
    );
    setItems((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, published } : p)));
  };

  const reorder = async (orderedIds: string[]) => {
    setItems((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      return orderedIds
        .map((id, idx) => {
          const it = map.get(id);
          return it ? { ...it, display_order: idx } : null;
        })
        .filter(Boolean) as PortfolioItem[];
    });
    const results = await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from("portfolio").update({ display_order: idx }).eq("id", id),
      ),
    );
    const firstErr = results.find((r) => r.error);
    if (firstErr?.error) toast.error(firstErr.error.message);
  };

  const updatePartial = async (id: string, patch: Partial<PortfolioItem>) => {
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = patch as any;
    const { error } = await supabase.from("portfolio").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return {
    items,
    loading,
    refresh,
    upsert,
    remove,
    togglePublished,
    toggleFeatured,
    duplicate,
    bulkDelete,
    bulkPublish,
    reorder,
    updatePartial,
  };
}

// ————— Services —————
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id,title,description,icon,image,published,display_order")
      .order("display_order", { ascending: true });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsert = async (service: Service) => {
    const { id, ...rest } = service;
    if (id && services.some((s) => s.id === id)) {
      const { error } = await supabase.from("services").update(rest).eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Service updated");
    } else {
      const { error } = await supabase.from("services").insert(rest);
      if (error) return toast.error(error.message);
      toast.success("Service created");
    }
    await refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return { services, loading, refresh, upsert, remove };
}

// ————— Homepage (singleton row) —————
export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent>(emptyHomepage);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("homepage")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data) {
      setContent({
        id: data.id,
        hero_title: data.hero_title ?? "",
        hero_subtitle: data.hero_subtitle ?? "",
        hero_video: data.hero_video ?? "",
        hero_cta: data.hero_cta ?? "",
        about_text: data.about_text ?? "",
        statistics: Array.isArray(data.statistics) ? (data.statistics as any) : [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (next: HomepageContent) => {
    setContent(next);
    const payload = {
      hero_title: next.hero_title,
      hero_subtitle: next.hero_subtitle,
      hero_video: next.hero_video,
      hero_cta: next.hero_cta,
      about_text: next.about_text,
      statistics: next.statistics as unknown as any,
    };
    if (next.id) {
      const { error } = await supabase.from("homepage").update(payload).eq("id", next.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase
        .from("homepage")
        .insert(payload)
        .select()
        .single();
      if (error) return toast.error(error.message);
      if (data) setContent((prev) => ({ ...prev, id: data.id }));
    }
    toast.success("Homepage saved");
  };

  return { content, loading, save, refresh };
}

// ————— Admin gate helper —————
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("has_role check failed", error);
    return false;
  }
  return !!data;
}
