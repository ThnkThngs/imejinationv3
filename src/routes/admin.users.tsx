import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shield, ShieldOff, UserPlus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminAuth } from "@/lib/admin/store";
import {
  listAdminUsers,
  grantAdminByEmail,
  removeAdminByUserId,
  type AdminUserRow,
} from "@/lib/admin/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const list = useServerFn(listAdminUsers);
  const grant = useServerFn(grantAdminByEmail);
  const revoke = useServerFn(removeAdminByUserId);
  const { session } = useAdminAuth();

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<AdminUserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await list();
      setRows(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = rows.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.email.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  async function handleGrant() {
    const email = grantEmail.trim();
    if (!email) return;
    setGranting(true);
    try {
      await grant({ data: { email } });
      toast.success(`Granted admin to ${email}`);
      setGrantOpen(false);
      setGrantEmail("");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to grant admin");
    } finally {
      setGranting(false);
    }
  }

  async function handleGrantExisting(row: AdminUserRow) {
    setBusyId(row.id);
    try {
      await grant({ data: { email: row.email } });
      toast.success(`Granted admin to ${row.email}`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to grant admin");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(row: AdminUserRow) {
    setBusyId(row.id);
    try {
      await revoke({ data: { userId: row.id } });
      toast.success(`Removed admin from ${row.email}`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove admin");
    } finally {
      setBusyId(null);
      setConfirmRemove(null);
    }
  }

  return (
    <AdminShell
      title="Admin Management"
      description="Grant or revoke admin access"
      actions={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={refresh}
            className="text-white/70 hover:bg-white/5"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            onClick={() => setGrantOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Grant Admin
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-white/30"
          />
        </div>
        <span className="text-xs text-white/40">
          {filtered.length} user{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.2em] text-white/40">
            <tr>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Created</th>
              <th className="px-4 py-3 font-normal">Role</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((row) => {
                const isSelf = row.id === session?.userId;
                return (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">
                      {row.name || <span className="text-white/30">—</span>}
                      {isSelf && (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-primary">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/70">{row.email}</td>
                    <td className="px-4 py-3 text-white/50">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {row.is_admin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.15em] text-primary">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.15em] text-white/50">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.is_admin ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelf || busyId === row.id}
                          onClick={() => setConfirmRemove(row)}
                          className="text-red-300 hover:bg-red-500/10 disabled:opacity-30"
                        >
                          <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === row.id}
                          onClick={() => handleGrantExisting(row)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Shield className="mr-1.5 h-3.5 w-3.5" />
                          Grant Admin
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="border-white/10 bg-black text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              Grant admin access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-white/70">User email</Label>
            <Input
              type="email"
              autoFocus
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="name@example.com"
              className="border-white/10 bg-white/[0.03] text-white placeholder:text-white/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGrant();
              }}
            />
            <p className="text-xs text-white/40">
              The user must already have signed up. They'll gain full admin access on next
              request.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setGrantOpen(false)}
              className="text-white/70 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrant}
              disabled={granting || !grantEmail.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {granting ? "Granting…" : "Grant Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
      >
        <AlertDialogContent className="border-white/10 bg-black text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-light">
              Remove admin access?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {confirmRemove?.email} will lose access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white/70 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
              className="bg-red-500/90 text-white hover:bg-red-500"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
