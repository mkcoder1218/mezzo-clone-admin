import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cashbackBonusApi, CashbackConfig } from "../modules/cashbackBonus/api";

export function CashbackBonusConfigurationsPage({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cashback-bonus", "configs"], queryFn: () => cashbackBonusApi.listConfigs() });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useQuery({
    queryKey: ["cashback-bonus", "config", selectedId],
    queryFn: () => cashbackBonusApi.getConfig(String(selectedId)),
    enabled: Boolean(selectedId),
  });

  const patchConfig = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CashbackConfig> }) => cashbackBonusApi.patchConfig(id, patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["cashback-bonus", "configs"] });
      if (selectedId) await qc.invalidateQueries({ queryKey: ["cashback-bonus", "config", selectedId] });
    },
  });

  const ranges = useMemo(() => {
    const r = (selected.data as any)?.config?.CashbackMultiplierRanges;
    return Array.isArray(r) ? r.slice().sort((a, b) => a.sortOrder - b.sortOrder) : [];
  }, [selected.data]);

  const [newRange, setNewRange] = useState({ minimumOdds: "", maximumOdds: "", multiplier: "" });
  const addRange = useMutation({
    mutationFn: () =>
      cashbackBonusApi.addRange(String(selectedId), {
        minimumOdds: newRange.minimumOdds,
        maximumOdds: newRange.maximumOdds === "" ? null : newRange.maximumOdds,
        multiplier: newRange.multiplier,
      }),
    onSuccess: async () => {
      setNewRange({ minimumOdds: "", maximumOdds: "", multiplier: "" });
      if (selectedId) await qc.invalidateQueries({ queryKey: ["cashback-bonus", "config", selectedId] });
    },
  });

  const deleteRange = useMutation({
    mutationFn: (rangeId: string) => cashbackBonusApi.deleteRange(rangeId),
    onSuccess: async () => {
      if (selectedId) await qc.invalidateQueries({ queryKey: ["cashback-bonus", "config", selectedId] });
    },
  });

  if (q.isLoading) return <div className="text-zinc-400">Loading...</div>;
  if (q.isError) return <div className="text-zinc-400">Failed to load configs.</div>;

  const configs = q.data.configs || [];

  return (
    <div className="space-y-8 text-white animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Cashback <span className="text-brand">Configurations</span>
        </h1>
        <p className="text-zinc-400 mt-1">Manage King5 cashback offers and multiplier ranges.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {configs.map((c) => (
          <Card key={c.id} className={`bg-[#1A1A1A] border-zinc-800/50 ${selectedId === c.id ? "ring-1 ring-brand/60" : ""}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-white">{c.code}</CardTitle>
                <CardDescription className="text-zinc-400">{c.name}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Enabled</div>
                <Switch
                  disabled={!canManage || patchConfig.isPending}
                  checked={Boolean(c.isEnabled)}
                  onCheckedChange={(v) => patchConfig.mutate({ id: c.id, patch: { isEnabled: v } as any })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Offer Name</div>
                  <Input
                    disabled={!canManage}
                    defaultValue={c.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== c.name) patchConfig.mutate({ id: c.id, patch: { name: v } as any });
                    }}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Minimum Stake</div>
                  <Input
                    disabled={!canManage}
                    defaultValue={c.minimumStake}
                    onBlur={(e) => patchConfig.mutate({ id: c.id, patch: { minimumStake: e.target.value } as any })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <Button className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl" onClick={() => setSelectedId(c.id)}>
                Manage Ranges
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedId ? (
        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-white">Multiplier Ranges</CardTitle>
            <CardDescription className="text-zinc-400">Ranges must not overlap; only the final range may be open-ended.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.isLoading ? <div className="text-zinc-500">Loading ranges...</div> : null}
            {selected.isError ? <div className="text-zinc-500">Failed to load ranges.</div> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min Odds</TableHead>
                  <TableHead>Max Odds</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranges.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-zinc-300">{r.minimumOdds}</TableCell>
                    <TableCell className="text-zinc-300">{r.maximumOdds ?? "-"}</TableCell>
                    <TableCell className="text-zinc-300">{r.multiplier}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button disabled={!canManage} className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl">Delete</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111] border-zinc-800 text-white">
                          <DialogHeader>
                            <DialogTitle>Delete Range?</DialogTitle>
                          </DialogHeader>
                          <div className="text-zinc-400 text-sm">This change affects future cashback evaluation only.</div>
                          <DialogFooter>
                            <Button className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl" onClick={() => deleteRange.mutate(String(r.id))}>
                              Confirm Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Min Odds</div>
                <Input disabled={!canManage} value={newRange.minimumOdds} onChange={(e) => setNewRange((d) => ({ ...d, minimumOdds: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Max Odds</div>
                <Input disabled={!canManage} value={newRange.maximumOdds} onChange={(e) => setNewRange((d) => ({ ...d, maximumOdds: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" placeholder="(empty = open-ended)" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Multiplier</div>
                <Input disabled={!canManage} value={newRange.multiplier} onChange={(e) => setNewRange((d) => ({ ...d, multiplier: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!canManage || addRange.isPending}
                  onClick={() => addRange.mutate()}
                  className="w-full bg-brand text-black hover:bg-brand/90 rounded-xl font-bold"
                >
                  Add Range
                </Button>
              </div>
            </div>

            {addRange.isError ? <div className="text-rose-400 text-sm">Add range failed (check overlap and values).</div> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

