import { useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { apiRequest } from "../lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RoleRecord = { id: string; name: string; createdAt?: string; updatedAt?: string };

export function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [name, setName] = useState("");

  async function fetchRoles() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ roles: RoleRecord[] }>("/api/roles");
      setRoles(res.roles || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  async function onCreate() {
    setCreateBusy(true);
    setError(null);
    try {
      await apiRequest<{ role: RoleRecord }>("/api/roles", {
        method: "POST",
        body: JSON.stringify({ name })
      });
      setCreateOpen(false);
      setName("");
      await fetchRoles();
    } catch (e: any) {
      setError(e?.message || "Failed to create role");
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">
            Roles <span className="text-brand">Registry</span>
          </h1>
          <p className="text-zinc-400 mt-1">Backend role records used for access control.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={fetchRoles} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand text-black hover:bg-brand/80">
                <Plus className="w-4 h-4 mr-2" />
                New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Role</DialogTitle>
                <DialogDescription className="text-zinc-400">Creates a new backend role record.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. super_agent"
                  className="bg-zinc-900 border-zinc-800"
                />
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
                  disabled={createBusy || !name}
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
            <span>All Roles</span>
            <span className="text-xs text-zinc-400">{loading ? "Loading..." : `${roles.length} total`}</span>
          </CardTitle>
          <CardDescription className="text-zinc-500">Read-only from the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Id</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id} className="border-zinc-900">
                  <TableCell>
                    <Badge className="bg-zinc-700">{r.name}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-mono text-xs">{r.id}</TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && !loading ? (
                <TableRow className="border-zinc-900">
                  <TableCell colSpan={2} className="text-zinc-400 py-8 text-center">
                    No roles found.
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
