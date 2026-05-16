import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Percent, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "../lib/apiClient";

type CashbackConfig = {
  minSelections: number;
  maxLostSelections: number;
  cashbackPercent: number; // 0..1
  maxCashbackAmount: number | null;
};

export function CashbackConfigPage() {
  const [draft, setDraft] = useState<CashbackConfig>({
    minSelections: 3,
    maxLostSelections: 1,
    cashbackPercent: 0.1,
    maxCashbackAmount: null,
  });

  const q = useQuery({
    queryKey: ["cashback-config"],
    queryFn: async () => apiRequest<{ config: CashbackConfig | null }>("/api/admin/cashback-config"),
    onSuccess: (data) => {
      if (data?.config) setDraft({ ...draft, ...data.config });
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: CashbackConfig) =>
      apiRequest<{ config: CashbackConfig }>("/api/admin/cashback-config", { method: "PUT", body: payload }),
    onSuccess: (data) => {
      if (data?.config) setDraft(data.config);
    },
  });

  const percentUi = useMemo(() => String(Math.round((Number(draft.cashbackPercent || 0) * 100) * 100) / 100), [draft.cashbackPercent]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Cashback <span className="text-brand">Config</span>
        </h1>
        <p className="text-zinc-400 mt-1">Configure cashback for tickets with only 1 losing selection (admin payout tool).</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Percent className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Cashback Rules</CardTitle>
              <CardDescription className="text-zinc-400">Percent is applied on stake.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.isLoading ? <div className="text-zinc-500">Loading…</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Min Selections</div>
              <Input
                type="number"
                min={1}
                value={draft.minSelections}
                onChange={(e) => setDraft((d) => ({ ...d, minSelections: Number(e.target.value) }))}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Max Lost Selections</div>
              <Input
                type="number"
                min={0}
                value={draft.maxLostSelections}
                onChange={(e) => setDraft((d) => ({ ...d, maxLostSelections: Number(e.target.value) }))}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Cashback Percent (%)</div>
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={percentUi}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  setDraft((d) => ({ ...d, cashbackPercent: Number.isFinite(pct) ? pct / 100 : d.cashbackPercent }));
                }}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Max Cashback Amount (optional)</div>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={draft.maxCashbackAmount ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, maxCashbackAmount: e.target.value === "" ? null : Number(e.target.value) }))}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="No cap"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(draft)}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            {mutation.isError ? <div className="text-rose-400 text-sm">Save failed.</div> : null}
            {mutation.isSuccess ? <div className="text-emerald-400 text-sm">Saved.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

