import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { UserRole } from "../types";
import { apiRequest } from "../lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function UserHierarchyPage({ role }: { role: UserRole }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ users: any[] }>("/api/users/hierarchy");
      setUsers(res.users || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const phone = String(u.phoneNumber || "").toLowerCase();
      const name = String(u.displayName || "").toLowerCase();
      const roleName = String(u.Role?.name || "").toLowerCase();
      const id = String(u.id || "").toLowerCase();
      return phone.includes(q) || name.includes(q) || roleName.includes(q) || id.includes(q);
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">
            User <span className="text-brand">Registry</span>
          </h1>
          <p className="text-zinc-400 mt-1">Users under your hierarchy.</p>
        </div>
        <Button onClick={fetchUsers} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700">
          Refresh
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800/50 shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <Input
            className="pl-12 bg-zinc-900/50 border-zinc-800 focus-visible:ring-brand h-12 text-sm rounded-xl text-white"
            placeholder="Search by name, phone, role or id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{loading ? "Loading..." : `${filtered.length} users`}</div>
      </div>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <div className="bg-[#1A1A1A] rounded-2xl border border-zinc-800/50 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-zinc-900/80">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest py-5 px-6">Name</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Phone</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Role</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Status</TableHead>
              <TableHead className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-all">
                <TableCell className="py-6 px-6 text-white font-medium">{u.displayName || "-"}</TableCell>
                <TableCell className="text-zinc-300">{u.phoneNumber || "-"}</TableCell>
                <TableCell>
                  <Badge className="bg-zinc-700">{String(u.Role?.name || "unknown").toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={u.isActive ? "bg-emerald-600" : "bg-zinc-700"}>{u.isActive ? "ACTIVE" : "DISABLED"}</Badge>
                </TableCell>
                <TableCell className="text-zinc-300">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 ? (
              <TableRow className="border-zinc-800/50">
                <TableCell colSpan={5} className="py-10 text-center text-zinc-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

