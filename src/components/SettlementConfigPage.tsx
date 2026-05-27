import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "../lib/apiClient";

type SettlementConfig = {
  autoSettleOnSelectionUpdate: boolean;
  autoVoidUnsupportedMarkets: boolean;
};

export function SettlementConfigPage() {
  const [draft, setDraft] = useState<SettlementConfig>({ autoSettleOnSelectionUpdate: true, autoVoidUnsupportedMarkets: true });

  const q = useQuery({
    queryKey: ["settlement-config"],
    queryFn: async () => apiRequest<{ config: SettlementConfig }>("/api/admin/settlement-config"),
    onSuccess: (data) => {
      if (data?.config) setDraft(data.config);
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: SettlementConfig) =>
      apiRequest<{ config: SettlementConfig }>("/api/admin/settlement-config", { method: "PUT", body: payload }),
    onSuccess: (data) => {
      if (data?.config) setDraft(data.config);
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Settlement <span className="text-brand">Config</span>
        </h1>
        <p className="text-zinc-400 mt-1">Controls automatic slip settlement when selection results change.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Auto Settlement</CardTitle>
              <CardDescription className="text-zinc-400">
                When enabled, a betslip is re-evaluated and saved whenever a selection changes result (e.g. pending → lost).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.isLoading ? <div className="text-zinc-500">Loading…</div> : null}

          <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
            <div>
              <div className="text-sm font-bold text-white">Auto-settle slips on selection update</div>
              <div className="text-[11px] text-zinc-500">
                Recommended: ON. This fixes slips staying pending even when a leg is already lost.
              </div>
            </div>
            <Switch checked={draft.autoSettleOnSelectionUpdate} onCheckedChange={(v) => setDraft((d) => ({ ...d, autoSettleOnSelectionUpdate: Boolean(v) }))} />
          </div>

          <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
            <div>
              <div className="text-sm font-bold text-white">Auto-void unsupported markets</div>
              <div className="text-[11px] text-zinc-500">
                Recommended: ON. If a market can’t be settled automatically (e.g. goal kicks), it becomes VOID instead of MANUAL REVIEW.
              </div>
            </div>
            <Switch checked={draft.autoVoidUnsupportedMarkets} onCheckedChange={(v) => setDraft((d) => ({ ...d, autoVoidUnsupportedMarkets: Boolean(v) }))} />
          </div>

          <div className="pt-2 flex gap-2 items-center">
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
