import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCcw } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import type { UserRole } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type LimitRow = { totalLimit: string; parentUserId?: string | null };
type TreeItem = {
  id: string;
  phoneNumber: string;
  email?: string | null;
  displayName?: string | null;
  isActive: boolean;
  createdById?: string | null;
  roleName?: string | null;
  limit: LimitRow;
};

export function LimitsPage({ role }: { role: UserRole }) {
  const [meLimit, setMeLimit] = useState<string>("0");
  const [items, setItems] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [editRowId, setEditRowId] = useState<string | null>(null);

  const isSuperAdmin = role === "SUPER_ADMIN";
  const actionLabel = isSuperAdmin ? "Assign" : "Allocate";

  const eligibleTargets = useMemo(() => {
    if (isSuperAdmin) {
      return items.filter((i) => i.roleName === "agent" || i.roleName === "super_agent");
    }
    // Manager can allocate to descendants only (service enforces specifics).
    return items;
  }, [items, isSuperAdmin]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const me = await apiRequest<{ limit: { totalLimit: string } }>("/api/limits/me");
      setMeLimit(me.limit?.totalLimit || "0");
      const tree = await apiRequest<{ items: TreeItem[] }>("/api/limits/tree");
      setItems(tree.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load limits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const n = Number(amount);
      if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount");

      if (isSuperAdmin) {
        await apiRequest("/api/limits/assign", {
          method: "POST",
          body: JSON.stringify({ userId: targetUserId, totalLimit: n })
        });
      } else {
        await apiRequest("/api/limits/allocate", {
          method: "POST",
          body: JSON.stringify({ childUserId: targetUserId, totalLimit: n })
        });
      }

      setOpen(false);
      setTargetUserId("");
      setAmount("");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Failed to update limit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">
            Limits <span className="text-brand">Control</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            Your limit: <span className="text-white font-mono">{meLimit}</span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={fetchAll} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand text-black hover:bg-brand/80">
                <Plus className="w-4 h-4 mr-2" />
                {actionLabel} Limit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>{actionLabel} Limit</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {isSuperAdmin
                    ? "Set a total limit for an agent or super agent."
                    : "Set a total limit for someone in your hierarchy."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Target</label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder={eligibleTargets.length ? "Select user" : "No eligible users"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                      {eligibleTargets.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {(u.displayName || u.phoneNumber) + " (" + (u.roleName || "unknown") + ")"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Total Limit</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  onClick={() => setOpen(false)}
                  variant="secondary"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  className="bg-brand text-black hover:bg-brand/80"
                  disabled={busy || !targetUserId || amount === ""}
                >
                  {busy ? "Saving..." : actionLabel}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hierarchy Limits</span>
            <span className="text-xs text-zinc-400">{loading ? "Loading..." : `${items.length} users`}</span>
          </CardTitle>
          <CardDescription className="text-zinc-500">Users under you and their assigned total limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
              <TableHead className="text-zinc-400">Limit</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Set</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {items.map((u) => (
                <TableRow key={u.id} className="border-zinc-900">
                  <TableCell>
                    <Badge className="bg-zinc-700">{u.roleName || "unknown"}</Badge>
                  </TableCell>
                  <TableCell className="text-white">{u.displayName || "-"}</TableCell>
                  <TableCell className="text-zinc-300">{u.phoneNumber || "-"}</TableCell>
                <TableCell className="text-zinc-300 font-mono">{u.limit?.totalLimit || "0"}</TableCell>
                <TableCell>
                  <Badge className={u.isActive ? "bg-emerald-600" : "bg-zinc-700"}>{u.isActive ? "ACTIVE" : "DISABLED"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => {
                      setTargetUserId(u.id);
                      setAmount(String(u.limit?.totalLimit || "0"));
                      setEditRowId(u.id);
                      setOpen(true);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 px-3"
                    title="Set limit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading ? (
              <TableRow className="border-zinc-900">
                  <TableCell colSpan={6} className="text-zinc-400 py-8 text-center">
                    No users found under your hierarchy.
                  </TableCell>
              </TableRow>
            ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
