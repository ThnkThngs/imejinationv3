import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Sparkles,
  Images,
  Wrench,
  Home,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAdminAuth } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/briefs", label: "AI Briefs", icon: Sparkles },
  { to: "/admin/portfolio", label: "Portfolio", icon: Images },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/content", label: "Homepage", icon: Home },
  { to: "/admin/users", label: "Admins", icon: ShieldCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { session, signOut } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-black transition-transform md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <Link to="/admin/dashboard" className="flex items-baseline gap-2">
              <span className="font-display text-lg tracking-tight">Imejination</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-6">
            {NAV.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 px-1">
              <p className="truncate text-sm text-white">{session?.name ?? "Admin"}</p>
              <p className="truncate text-xs text-white/40">{session?.email ?? "—"}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-black/80 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md p-2 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-lg tracking-tight text-white md:text-xl">
                  {title}
                </h1>
                {description && (
                  <p className="hidden text-xs text-white/40 md:block">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
      <Toaster theme="dark" />
    </div>
  );
}
