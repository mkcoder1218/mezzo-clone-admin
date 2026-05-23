import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import type { UserRole } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type AgentRecord = {
  id: string;
  phoneNumber: string;
  email?: string | null;
  displayName?: string | null;
  isActive: boolean;
  createdAt: string;
  Role?: { name: string };
};

type RoleRecord = { id: string; name: string };

function roleLabel(roleName?: string) {
  if (roleName === "super_agent") return "SUPER AGENT";
  if (roleName === "agent") return "AGENT";
  return (roleName || "UNKNOWN").toUpperCase();
}

export function AgentsPage({ role }: { role: UserRole }) {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editing, setEditing] = useState<AgentRecord | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editIsActive, setEditIsActive] = useState<"true" | "false">("true");
  const [editCommissionPercent, setEditCommissionPercent] = useState("");
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  const canCreateSuperAgent = role === "SUPER_ADMIN";

  const agentRoleOptions = useMemo(() => {
    const allowedNames = canCreateSuperAgent ? new Set(["agent", "super_agent"]) : new Set(["agent"]);
    return roles
      .filter((r) => allowedNames.has(r.name))
      .map((r) => ({ id: r.id, name: r.name, label: r.name === "super_agent" ? "Super Agent" : "Agent" }));
  }, [roles, canCreateSuperAgent]);

  async function fetchAgents() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ agents: AgentRecord[] }>("/api/agents");
      setAgents(res.agents || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await apiRequest<{ roles: RoleRecord[] }>("/api/roles");
      setRoles(res.roles || []);
    } catch {
      // If roles endpoint is forbidden/unavailable, the create modal won't be usable.
      setRoles([]);
    }
  }

  useEffect(() => {
    if (role === "SUPER_ADMIN" || role === "SUPER_AGENT") fetchAgents();
    fetchRoles();
  }, []);

  async function onCreate() {
    setCreateBusy(true);
    setError(null);
    try {
      await apiRequest<{ agent: AgentRecord }>("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          password,
          displayName: displayName || undefined,
          commissionPercent: commissionPercent === "" ? undefined : Number(commissionPercent),
          roleId
        })
      });
      setCreateOpen(false);
      setPhoneNumber("");
      setPassword("");
      setDisplayName("");
      setRoleId("");
      setCommissionPercent("");
      await fetchAgents();
    } catch (e: any) {
      setError(e?.message || "Failed to create agent");
    } finally {
      setCreateBusy(false);
    }
  }

  async function onUpdate() {
    if (!editing) return;
    setEditBusy(true);
    setError(null);
    try {
      const patch: any = {};
      patch.phoneNumber = editPhone;
      patch.displayName = editDisplayName || null;
      patch.isActive = editIsActive === "true";
      if (editPassword) patch.password = editPassword;
      if (editRoleId) patch.roleId = editRoleId;
      if (editCommissionPercent !== "") patch.commissionPercent = Number(editCommissionPercent);

      await apiRequest(`/api/users/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });

      setEditOpen(false);
      setEditing(null);
      setEditPassword("");
      await fetchAgents();
    } catch (e: any) {
      setError(e?.message || "Failed to update agent");
    } finally {
      setEditBusy(false);
    }
  }

  async function onDelete(userId: string) {
    if (!confirm("Delete this agent?")) return;
    setDeleteBusyId(userId);
    setError(null);
    try {
      await apiRequest(`/api/users/${userId}`, { method: "DELETE" });
      await fetchAgents();
    } catch (e: any) {
      setError(e?.message || "Failed to delete agent");
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">
            Agents <span className="text-brand">Registry</span>
          </h1>
          <p className="text-zinc-400 mt-1">Create and monitor agent accounts.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={fetchAgents} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand text-black hover:bg-brand/80">
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Agent</DialogTitle>
                <DialogDescription className="text-zinc-400">Adds an agent account in the backend.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Agent Type</label>
                  <Select value={roleId} onValueChange={(v) => setRoleId(v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder={agentRoleOptions.length ? "Select role" : "No roles available"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                      {agentRoleOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
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

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Commission % (optional)</label>
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 10"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  onClick={() => setCreateOpen(false)}
                  variant="secondary"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  disabled={createBusy}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  className="bg-brand text-black hover:bg-brand/80"
                  disabled={createBusy || !phoneNumber || !password || !roleId}
                >
                  {createBusy ? "Creating..." : "Create"}
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
            <span>All Agents</span>
            <span className="text-xs text-zinc-400">{loading ? "Loading..." : `${agents.length} total`}</span>
          </CardTitle>
          <CardDescription className="text-zinc-500">Includes agents and super agents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Display Name</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Created</TableHead>
                {role === "SUPER_ADMIN" ? <TableHead className="text-zinc-400 text-right">Edit</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((a) => (
                <TableRow key={a.id} className="border-zinc-900">
                  <TableCell>
                    <Badge className={a.Role?.name === "super_agent" ? "bg-purple-600" : "bg-zinc-700"}>
                      {roleLabel(a.Role?.name)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{a.displayName || "-"}</TableCell>
                  <TableCell className="text-zinc-300">{a.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge className={a.isActive ? "bg-emerald-600" : "bg-zinc-700"}>{a.isActive ? "ACTIVE" : "DISABLED"}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300">{new Date(a.createdAt).toLocaleString()}</TableCell>
                  {role === "SUPER_ADMIN" ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => {
                            setEditing(a);
                            setEditPhone(a.phoneNumber || "");
                            setEditDisplayName(a.displayName || "");
                            setEditRoleId(roles.find((r) => r.name === a.Role?.name)?.id || "");
                            setEditIsActive(a.isActive ? "true" : "false");
                            setEditCommissionPercent((a as any).commissionPercent == null ? "" : String((a as any).commissionPercent));
                            setEditPassword("");
                            setEditOpen(true);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 px-3"
                          title="Edit agent"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onDelete(a.id)}
                          disabled={deleteBusyId === a.id}
                          className="bg-zinc-800 hover:bg-rose-600 px-3"
                          title="Delete agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {agents.length === 0 && !loading ? (
                <TableRow className="border-zinc-900">
                  <TableCell colSpan={5} className="text-zinc-400 py-8 text-center">
                    No agents found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#111111] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription className="text-zinc-400">Updates this agent record in the backend.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Role</label>
              <Select value={editRoleId} onValueChange={(v) => setEditRoleId(v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                  {roles
                    .filter((r) => r.name === "agent" || r.name === "super_agent")
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Phone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="bg-zinc-900 border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Active</label>
                <Select value={editIsActive} onValueChange={(v) => setEditIsActive(v as any)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-zinc-800 text-white">
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Display Name</label>
              <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">New Password</label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
                placeholder="leave blank to keep unchanged"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Commission % (optional)</label>
              <Input
                inputMode="decimal"
                placeholder="e.g. 10"
                value={editCommissionPercent}
                onChange={(e) => setEditCommissionPercent(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              onClick={() => setEditOpen(false)}
              variant="secondary"
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
              disabled={editBusy}
            >
              Cancel
            </Button>
            <Button onClick={onUpdate} className="bg-brand text-black hover:bg-brand/80" disabled={editBusy || !editing}>
              {editBusy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
