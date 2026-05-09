import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import type { UserRole } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RoleRecord = { id: string; name: string };
type StaffRecord = {
  id: string;
  phoneNumber: string;
  displayName?: string | null;
  isActive: boolean;
  createdAt: string;
  Role?: { name: string };
};

export function StaffPage({ role }: { role: UserRole }) {
  const [items, setItems] = useState<StaffRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [shopOwnerId, setShopOwnerId] = useState("");
  const [autoCreateCashiers, setAutoCreateCashiers] = useState(true);
  const [cashierCount, setCashierCount] = useState("0");
  const [cashierStartName, setCashierStartName] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");

  const allowedRoleNames = useMemo(() => {
    if (role === "SHOP_OWNER") return new Set(["cashier"]);
    return new Set(["shop_owner", "cashier"]);
  }, [role]);

  const roleOptions = useMemo(() => roles.filter((r) => allowedRoleNames.has(r.name)), [roles, allowedRoleNames]);
  const selectedRoleName = useMemo(() => roles.find((r) => r.id === roleId)?.name, [roles, roleId]);
  const shopOwnerOptions = useMemo(() => items.filter((u) => u.Role?.name === "shop_owner"), [items]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ items: StaffRecord[] }>("/api/staff");
      setItems(res.items || []);
      const rr = await apiRequest<{ roles: RoleRecord[] }>("/api/roles");
      setRoles(rr.roles || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const payload: any = { phoneNumber, password, displayName: displayName || undefined, roleId };

      // When creating a cashier as agent/super_agent, require assigning a shop owner.
      if (selectedRoleName === "cashier" && role !== "SHOP_OWNER") {
        if (!shopOwnerId) throw new Error("Select a shop owner for this cashier");
        payload.createdById = shopOwnerId;
      }

      const created = await apiRequest<{ user: any }>("/api/staff", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Optional bulk cashier creation when creating a shop owner.
      if (selectedRoleName === "shop_owner" && autoCreateCashiers) {
        const cashierRoleId = roles.find((r) => r.name === "cashier")?.id;
        if (!cashierRoleId) throw new Error("Missing cashier role");

        const n = Math.max(0, Math.min(50, Number(cashierCount) || 0));
        if (n > 0) {
          const base = (cashierStartName || displayName || phoneNumber).trim();
          const pw = (cashierPassword || password).trim();
          if (!pw) throw new Error("Password required for cashiers");
          for (let i = 1; i <= n; i++) {
            const cashierName = `${base}-cashier-${i}`;
            await apiRequest("/api/staff", {
              method: "POST",
              body: JSON.stringify({
                roleId: cashierRoleId,
                // This app uses phoneNumber as the primary login identifier; we generate a unique one per cashier.
                phoneNumber: cashierName,
                displayName: cashierName,
                password: pw,
                createdById: created.user.id
              })
            });
          }
        }
      }

      setOpen(false);
      setRoleId("");
      setPhoneNumber("");
      setPassword("");
      setDisplayName("");
      setShopOwnerId("");
      setCashierCount("0");
      setCashierStartName("");
      setCashierPassword("");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">
            Staff <span className="text-brand">Registry</span>
          </h1>
          <p className="text-zinc-400 mt-1">Create and monitor shop owners and cashiers in your hierarchy.</p>
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
                New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Staff</DialogTitle>
                <DialogDescription className="text-zinc-400">Creates a user under your account.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Role</label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder={roleOptions.length ? "Select role" : "No eligible roles"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                      {roleOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Phone Number</label>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Display Name</label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                  </div>
                </div>

                {selectedRoleName === "cashier" && role !== "SHOP_OWNER" ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Assign Shop Owner</label>
                    <Select value={shopOwnerId} onValueChange={setShopOwnerId}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder={shopOwnerOptions.length ? "Select shop owner" : "No shop owners available"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                        {shopOwnerOptions.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.displayName || u.phoneNumber) + " (shop_owner)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {selectedRoleName === "shop_owner" ? (
                  <div className="space-y-4 border-t border-zinc-800 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Cashiers</p>
                        <p className="text-xs text-zinc-500">Optionally create cashiers under this shop owner.</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-zinc-200">
                        <input
                          type="checkbox"
                          checked={autoCreateCashiers}
                          onChange={(e) => setAutoCreateCashiers(e.target.checked)}
                        />
                        Auto create
                      </label>
                    </div>

                    {autoCreateCashiers ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">How Many</label>
                          <Input value={cashierCount} onChange={(e) => setCashierCount(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Cashier Start Name</label>
                          <Input
                            value={cashierStartName}
                            onChange={(e) => setCashierStartName(e.target.value)}
                            placeholder="defaults to shop owner name"
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Cashier Password</label>
                          <Input
                            type="password"
                            value={cashierPassword}
                            onChange={(e) => setCashierPassword(e.target.value)}
                            placeholder="defaults to shop owner password"
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button onClick={() => setOpen(false)} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white" disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={create} className="bg-brand text-black hover:bg-brand/80" disabled={busy || !roleId || !phoneNumber || !password}>
                  {busy ? "Creating..." : "Create"}
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
            <span>My Staff</span>
            <span className="text-xs text-zinc-400">{loading ? "Loading..." : `${items.length} total`}</span>
          </CardTitle>
          <CardDescription className="text-zinc-500">Only users created under you (directly or indirectly).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Display Name</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id} className="border-zinc-900">
                  <TableCell>
                    <Badge className="bg-zinc-700">{u.Role?.name || "unknown"}</Badge>
                  </TableCell>
                  <TableCell className="text-white">{u.displayName || "-"}</TableCell>
                  <TableCell className="text-zinc-300">{u.phoneNumber || "-"}</TableCell>
                  <TableCell>
                    <Badge className={u.isActive ? "bg-emerald-600" : "bg-zinc-700"}>{u.isActive ? "ACTIVE" : "DISABLED"}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300">{new Date(u.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading ? (
                <TableRow className="border-zinc-900">
                  <TableCell colSpan={5} className="text-zinc-400 py-8 text-center">
                    No staff found.
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
