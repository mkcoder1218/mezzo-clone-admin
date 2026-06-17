import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calculator, Percent, Save, Table2, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "../lib/apiClient";

type Paytable = Record<string, Record<string, number>>;

type RtpSummary = {
  byPickCount: Record<string, number>;
  byPickCountPercent: Record<string, number>;
  averagePercent: number;
};

type FastKenoConfig = {
  totalBalls: number;
  drawnBalls: number;
  paytable: Paytable;
  paymentsTable: Paytable;
  targetRtpPercent: number;
  baseCalculatedRtp: RtpSummary;
  effectiveCalculatedRtp: RtpSummary;
  payoutScalePercent: number;
  calculatedRtp: RtpSummary;
  rtpByPickCount: Record<string, number>;
};

const pickCounts = Array.from({ length: 10 }, (_, index) => String(index + 1));
const hitCounts = Array.from({ length: 11 }, (_, index) => index);

function paytableValue(paytable: Paytable | undefined, pickCount: string, hitCount: number) {
  const row = paytable?.[pickCount] || paytable?.[String(Number(pickCount))];
  if (!row) return undefined;
  return row[String(hitCount)] ?? row[String(Number(hitCount))];
}

export function FastKenoConfigPage() {
  const [draftTargetRtp, setDraftTargetRtp] = useState(95);

  const q = useQuery({
    queryKey: ["fast-keno-config"],
    queryFn: async () => apiRequest<{ config: FastKenoConfig }>("/api/admin/games/fast-keno-config"),
    onSuccess: (data) => {
      if (data?.config) setDraftTargetRtp(data.config.targetRtpPercent);
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: { targetRtpPercent: number }) =>
      apiRequest<{ config: FastKenoConfig }>("/api/admin/games/fast-keno-config", { method: "PUT", body: payload }),
    onSuccess: (data) => {
      if (data?.config) setDraftTargetRtp(data.config.targetRtpPercent);
    },
  });

  const config = q.data?.config;

  const paytableMissing = useMemo(() => {
    if (!config?.paytable) return true;
    return !pickCounts.some((pickCount) => {
      return hitCounts.some((hitCount) => paytableValue(config.paytable, pickCount, hitCount) !== undefined);
    });
  }, [config]);

  const queryError = q.error instanceof ApiClientError ? q.error.message : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Fast Keno <span className="text-brand">Config</span>
        </h1>
        <p className="mt-1 text-zinc-400">
          The paytable defines the base multipliers. Target RTP automatically calculates payout scale from that base table.
        </p>
        {config?.baseCalculatedRtp?.averagePercent ? (
          <p className="mt-2 text-sm text-zinc-500">
            Current maximum target allowed by this paytable: {config.baseCalculatedRtp.averagePercent.toFixed(3)}%
          </p>
        ) : null}
      </header>

      {queryError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{queryError}</div>
      ) : null}

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Target className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Target RTP %</CardTitle>
              <CardDescription className="text-zinc-400">
                Desired long-term return to player. Recommended range is 85 to 99, but it cannot exceed the base paytable average RTP.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.isLoading ? <div className="text-zinc-500">Loading...</div> : null}

          <div className="max-w-sm">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Target RTP Percent</div>
            <Input
              type="number"
              min={85}
              max={Math.min(100, config?.baseCalculatedRtp?.averagePercent ?? 100)}
              step={0.01}
              value={draftTargetRtp}
              onChange={(e) => setDraftTargetRtp(Number(e.target.value))}
              className="border-zinc-800 bg-zinc-900 text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ targetRtpPercent: draftTargetRtp })}
              className="rounded-xl bg-brand text-[10px] font-bold uppercase text-black hover:bg-brand/90"
            >
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            {mutation.isError ? <div className="text-sm text-rose-400">Save failed.</div> : null}
            {mutation.isSuccess ? <div className="text-sm text-emerald-400">Saved.</div> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Calculator className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Base Calculated RTP</CardTitle>
                <CardDescription className="text-zinc-400">From the original paytable before scaling.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.baseCalculatedRtp?.averagePercent?.toFixed(3) ?? "0.000"}%`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Percent className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Effective Calculated RTP</CardTitle>
                <CardDescription className="text-zinc-400">After the auto payout scale is applied.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.effectiveCalculatedRtp?.averagePercent?.toFixed(3) ?? "0.000"}%`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Percent className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Auto Payout Scale %</CardTitle>
                <CardDescription className="text-zinc-400">Calculated automatically from Target RTP and base RTP.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.payoutScalePercent?.toFixed(4) ?? "0.0000"}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {paytableMissing ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Paytable is missing, RTP cannot be calculated.</p>
          </div>
        </div>
      ) : null}

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Table2 className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Paytable / Payments</CardTitle>
              <CardDescription className="text-zinc-400">
                Top row is pick count 1 to 10. Left column is hit count 0 to 10. Cell value is payout multiplier.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Hits</th>
                  {pickCounts.map((pickCount) => (
                    <th key={pickCount} className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-white">
                      {pickCount}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hitCounts.map((hitCount) => (
                  <tr key={hitCount}>
                    <td className="border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-semibold text-zinc-300">{hitCount}</td>
                    {pickCounts.map((pickCount) => {
                      const value = paytableValue(config?.paytable, pickCount, hitCount);
                      return (
                        <td key={`${pickCount}-${hitCount}`} className="border border-zinc-800 px-3 py-2 text-center text-zinc-200">
                          {value !== undefined ? value : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Calculator className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">RTP By Pick Count</CardTitle>
              <CardDescription className="text-zinc-400">Base RTP and effective RTP shown side by side for picks 1 to 10.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {pickCounts.map((pickCount) => (
              <div key={pickCount} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Pick {pickCount}</div>
                <div className="mt-2 text-lg font-bold text-white">
                  Base {config?.baseCalculatedRtp?.byPickCountPercent?.[pickCount]?.toFixed(3) ?? "0.000"}%
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Effective {config?.effectiveCalculatedRtp?.byPickCountPercent?.[pickCount]?.toFixed(3) ?? "0.000"}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
