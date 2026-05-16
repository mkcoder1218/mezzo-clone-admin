import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { oddsManagementApi, type OddsSettings } from "./api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";


function humanSeconds(v: number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n % 3600 === 0) return `${n / 3600} hour(s)`;
  if (n % 60 === 0) return `${n / 60} minute(s)`;
  return `${n} second(s)`;
}

function humanMs(v: number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n % 3600000 === 0) return `${n / 3600000} hour(s)`;
  if (n % 60000 === 0) return `${n / 60000} minute(s)`;
  return `${n} ms`;
}

function adjustOdd(originalOdd: number, marginEnabled: boolean, marginPercent: number, roundingDecimals: number) {
  const v = Number(originalOdd);
  if (!Number.isFinite(v) || v <= 1) return 0;
  const pct = Number(marginPercent);
  const d = Math.max(1, Math.min(4, Math.floor(Number(roundingDecimals) || 2)));
  const adjusted = marginEnabled ? Math.max(1.01, 1 + (v - 1) * (1 - pct / 100)) : v;
  return Number(adjusted.toFixed(d));
}

export function OddsSettingsPage() {
  const qc = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["apifootball-status"], queryFn: oddsManagementApi.apiFootballStatus });
  const { data: mezzoStatus } = useQuery({ queryKey: ["mezzo-status"], queryFn: oddsManagementApi.mezzoStatus });
  const { data, isLoading } = useQuery({ queryKey: ["odds-settings"], queryFn: oddsManagementApi.settingsGet });

  const [leagueSearch, setLeagueSearch] = useState("");
  const [mezzoFetchError, setMezzoFetchError] = useState<string | null>(null);
  const [mezzoSportId, setMezzoSportId] = useState("501");

  const [leagueEnabled, setLeagueEnabled] = useState<boolean | undefined>(undefined);
  const [leaguePage, setLeaguePage] = useState(1);
  
  const handleSearch = (val: string) => {
    setLeagueSearch(val);
    setLeaguePage(1);
  };

  const handleEnabledFilter = (val: boolean | undefined) => {
    setLeagueEnabled(val);
    setLeaguePage(1);
  };

  const { data: leagues, isLoading: leaguesLoading } = useQuery({


    queryKey: ["apifootball-leagues", leagueSearch, leagueEnabled, leaguePage],
    queryFn: () => oddsManagementApi.leaguesList({ search: leagueSearch || undefined, enabled: leagueEnabled, page: leaguePage, limit: 50 }),
  });


  const [draft, setDraft] = useState<Partial<OddsSettings>>({});
  const settings = data?.settings;
  const providers = data?.providers || [
    { key: "mezzo", label: "Mezzo (HTTP)", supportsTopEvents: false },
    { key: "apifootball", label: "APIfootball (HTTP)", supportsTopEvents: false },
    { key: "pissbet_socket", label: "Pissbet Socket (Top Events)", supportsTopEvents: true },
  ];

  const effective = useMemo(() => ({ ...(settings || ({} as any)), ...(draft as any) }) as OddsSettings, [settings, draft]);

  const [bookmakerText, setBookmakerText] = useState("");
  const [previewOdd, setPreviewOdd] = useState("2.00");

  if (isLoading || !settings) return <div className="text-zinc-400">Loading odds settings…</div>;

  const save = async () => {
    await oddsManagementApi.settingsPut(draft);
    setDraft({});
    await qc.invalidateQueries({ queryKey: ["odds-settings"] });
  };

  const selectedProvider = String(effective.oddsProvider ?? data?.activeProvider ?? "");
  const isSelectedMezzo = selectedProvider === "mezzo";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic font-display">Odds Management · Settings</h1>
          <p className="text-zinc-500 mt-1">APIfootball provider settings, league sync, freshness, workers, and pricing.</p>
        </div>
        <Button className="bg-brand text-black font-extrabold" onClick={save} disabled={!Object.keys(draft).length}>
          Save Settings
        </Button>
      </div>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Odds Provider</div>
            <div className="text-zinc-500 text-sm">Select which provider the backend should use.</div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="h-10 px-3 rounded-md bg-zinc-950/50 border border-zinc-800 text-white text-sm"
              value={String(effective.oddsProvider ?? data?.activeProvider ?? "")}
              onChange={(e) => setDraft((d) => ({ ...d, oddsProvider: e.target.value || null }))}
            >
              <option value="">(use server default)</option>
              {providers.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProvider === "pissbet_socket" ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-zinc-400 font-semibold uppercase tracking-tight italic">Socket URL</div>
              <Input
                className="mt-2"
                value={String(effective.pissbetSocketUrl ?? "")}
                placeholder="wss://sp.pissbet.com/uws-player"
                onChange={(e) => setDraft((d) => ({ ...d, pissbetSocketUrl: e.target.value }))}
              />
              <div className="text-zinc-500 text-[10px] mt-2 font-bold uppercase">Used by the socket-based provider (fetch once, cached)</div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Provider Status</div>
            <div className="text-zinc-500 text-sm">Active provider: {String(data?.activeProvider || "unknown")}</div>
          </div>
          <div className="flex gap-2 items-center">
            {isSelectedMezzo ? (
              <Badge className={mezzoStatus?.oddsProviderActive ? "bg-brand text-black" : "bg-zinc-700"}>
                {mezzoStatus?.oddsProviderActive ? "Provider=mezzo" : "Provider!=mezzo"}
              </Badge>
            ) : (
              <>
                <Badge className={status?.apiKeyConfigured ? "bg-emerald-600" : "bg-rose-600"}>
                  {status?.apiKeyConfigured ? "API key configured" : "API key missing"}
                </Badge>
                <Badge className={status?.oddsProviderActive ? "bg-brand text-black" : "bg-zinc-700"}>
                  {status?.oddsProviderActive ? "ODDS_PROVIDER=apifootball" : "ODDS_PROVIDER!=apifootball"}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-400">Base URL</div>
            <div className="text-white mt-1 break-all">
              {isSelectedMezzo ? "https://api.mezzo.bet/api/v2/multi" : status?.baseUrl}
            </div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-400">Requests remaining</div>
            <div className="text-white mt-1">{isSelectedMezzo ? "n/a" : (status?.rate ? `${status.rate.remaining}/${status.rate.limit}` : "n/a")}</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-zinc-400">Connection</div>
              <div className="text-white mt-1">{isSelectedMezzo ? "Fetch Mezzo snapshots" : "Test provider now"}</div>
            </div>
            <div className="flex items-center gap-2">
              {selectedProvider === "mezzo" ? (
                <select
                  className="h-10 px-2 rounded-md bg-zinc-950/50 border border-zinc-800 text-white text-xs"
                  value={mezzoSportId}
                  onChange={(e) => setMezzoSportId(e.target.value)}
                  title="Mezzo sportId"
                >
                  <option value="501">501 · Football</option>
                  <option value="504">504 · Basketball</option>
                  <option value="502">502 · Tennis</option>
                  <option value="503">503 · Handball</option>
                  <option value="505">505 · Volleyball</option>
                  <option value="508">508 · Ice Hockey</option>
                </select>
              ) : null}
              <Button
                variant="secondary"
                onClick={async () => {
                  if (selectedProvider === "mezzo") {
                    setMezzoFetchError(null);
                    try {
                      await oddsManagementApi.mezzoFetchNow(Number(mezzoSportId));
                    } catch (e: any) {
                      const msg = String(e?.message || "");
                      const details = e?.details ? ` Details: ${JSON.stringify(e.details)}` : "";
                      setMezzoFetchError(msg ? `${msg}${details}` : "Mezzo fetch failed.");
                    } finally {
                      await qc.invalidateQueries({ queryKey: ["mezzo-status"] });
                    }
                  } else {
                    await oddsManagementApi.apiFootballTest();
                  }
                }}
              >
                {selectedProvider === "mezzo" ? "Fetch Now" : "Test"}
              </Button>
            </div>
          </div>
        </div>

        {selectedProvider === "mezzo" ? (
          <>
            {mezzoFetchError ? (
              <div className="mt-3 bg-rose-900/20 border border-rose-900/40 text-rose-200 text-xs p-3 rounded-lg">
                <div className="font-black uppercase tracking-wide">Mezzo Fetch Failed</div>
                <div className="mt-1 text-rose-200/90">
                  Mezzo blocked this backend IP via Cloudflare. Catalog/top-events were not updated, so user-side Mezzo odds will remain empty until the backend can fetch and store snapshots (allowlist this server IP or configure approved proxy/egress).
                </div>
                <div className="mt-2 text-[11px] whitespace-pre-wrap break-words text-rose-100/80">{mezzoFetchError}</div>
              </div>
            ) : null}
            <div className="mt-3 text-[11px] text-zinc-500">
              Latest snapshots: catalog={mezzoStatus?.latest?.catalogFetchedAt || "never"}, top-events={mezzoStatus?.latest?.topEventsFetchedAt || "never"}
            </div>
          </>
        ) : null}
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">League Sync</div>
            <div className="text-zinc-500 text-sm">Enable only the leagues you want to sync for events/results.</div>
            <div className="text-amber-400 text-xs mt-1">Enabling all leagues may increase API usage and sync time.</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await oddsManagementApi.leaguesFetchNow();
                await qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
              }}
            >
              Fetch Leagues Now
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await oddsManagementApi.leaguesEnableAllActive();
                await qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
              }}
            >
              Enable All Active
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await oddsManagementApi.leaguesDisableAll();
                await qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
              }}
            >
              Disable All
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 col-span-1">
            <div className="text-zinc-300 text-sm font-semibold uppercase tracking-tight italic">Sync League Limit</div>
            <Input
              className="mt-2"
              type="number"
              value={String(effective.syncLeagueLimit ?? "")}
              onChange={(e) => setDraft((d) => ({ ...d, syncLeagueLimit: Number(e.target.value) }))}
            />
            <div className="text-zinc-500 text-[10px] mt-2 font-bold uppercase">Max leagues to fetch per cron run</div>
          </div>
          <div className="col-span-3 flex items-end pb-1 px-2">
             <div className="text-zinc-500 text-xs italic">
               Currently syncing up to <span className="text-brand font-bold">{effective.syncLeagueLimit}</span> leagues from the enabled list. 
               This prevents API results truncation and manages your request quota.
             </div>
          </div>
        </div>


        <div className="mt-4 flex gap-2">
          <Input value={leagueSearch} onChange={(e) => handleSearch(e.target.value)} placeholder="Search leagues…" />
          <Button variant="outline" onClick={() => handleEnabledFilter(undefined)}>All</Button>
          <Button variant="outline" onClick={() => handleEnabledFilter(true)}>Enabled</Button>
          <Button variant="outline" onClick={() => handleEnabledFilter(false)}>Disabled</Button>
        </div>


        <div className="mt-4 border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-zinc-950/60 text-zinc-400 text-xs font-bold uppercase tracking-wider px-4 py-3">
            <div className="col-span-5">League</div>
            <div className="col-span-3">Country</div>
            <div className="col-span-2">League ID</div>
            <div className="col-span-1">Active</div>
            <div className="col-span-1 text-right">Enabled</div>
          </div>
          {(leaguesLoading ? [] : leagues?.leagues || []).map((l) => (
            <div key={l.id} className="grid grid-cols-12 px-4 py-3 border-t border-zinc-800/60 items-center">
              <div className="col-span-5 text-white truncate">{l.name}</div>
              <div className="col-span-3 text-zinc-400 truncate">{l.countryName || "—"}</div>
              <div className="col-span-2 text-zinc-400">{l.apiFootballLeagueId}</div>
              <div className="col-span-1">{l.isActive ? <Badge className="bg-emerald-600">Yes</Badge> : <Badge className="bg-zinc-700">No</Badge>}</div>
              <div className="col-span-1 flex justify-end">
                <Switch
                  checked={l.isEnabledForSync}
                  onCheckedChange={async (v) => {
                    await oddsManagementApi.leaguePatch(l.id, v);
                    await qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
                  }}
                />
              </div>
            </div>
          ))}


          {!leaguesLoading && (leagues?.leagues || []).length === 0 ? (
            <div className="px-4 py-6 text-zinc-500">No leagues found. Click “Fetch Leagues Now”.</div>
          ) : null}
        </div>

        {leagues && leagues.total > 0 && (
          <div className="mt-4 flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 rounded-xl px-4 py-3">
            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
              Showing <span className="text-white">{(leaguePage - 1) * 50 + 1}</span> to <span className="text-white">{Math.min(leaguePage * 50, leagues.total)}</span> of <span className="text-white">{leagues.total}</span> leagues
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
                disabled={leaguePage <= 1}
                onClick={() => setLeaguePage(1)}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
                disabled={leaguePage <= 1}
                onClick={() => setLeaguePage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black text-white uppercase italic tracking-widest shadow-inner shadow-black/20">
                Page {leaguePage} / {Math.ceil(leagues.total / 50)}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
                disabled={leaguePage >= Math.ceil(leagues.total / 50)}
                onClick={() => setLeaguePage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
                disabled={leaguePage >= Math.ceil(leagues.total / 50)}
                onClick={() => setLeaguePage(Math.ceil(leagues.total / 50))}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

      </Card>


      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Bookmaker Priority</div>
            <div className="text-zinc-500 text-sm">First available bookmaker wins; no averaging.</div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input value={bookmakerText} onChange={(e) => setBookmakerText(e.target.value)} placeholder="Add bookmaker name (e.g. Bet365)" />
            <Button
              variant="secondary"
              onClick={() => {
                const b = bookmakerText.trim();
                if (!b) return;
                const next = Array.from(new Set([...(effective.bookmakerPriority || []), b]));
                setDraft((d) => ({ ...d, bookmakerPriority: next }));
                setBookmakerText("");
              }}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {(effective.bookmakerPriority || []).map((b, idx) => (
              <div key={`${b}-${idx}`} className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
                <div className="text-white">{idx + 1}. {b}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const arr = [...effective.bookmakerPriority];
                      if (idx <= 0) return;
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      setDraft((d) => ({ ...d, bookmakerPriority: arr }));
                    }}
                  >
                    Up
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const arr = [...effective.bookmakerPriority];
                      if (idx >= arr.length - 1) return;
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      setDraft((d) => ({ ...d, bookmakerPriority: arr }));
                    }}
                  >
                    Down
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const arr = effective.bookmakerPriority.filter((_, i) => i !== idx);
                      setDraft((d) => ({ ...d, bookmakerPriority: arr }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="text-white font-bold">Odds Freshness</div>
        <div className="text-zinc-500 text-sm">Controls how old odds can be before treated as stale.</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            ["prematchOddsMaxAgeSeconds", "Prematch max age (s)", humanSeconds(effective.prematchOddsMaxAgeSeconds)],
            ["detailOddsMaxAgeSeconds", "Detail page max age (s)", humanSeconds(effective.detailOddsMaxAgeSeconds)],
            ["liveOddsMaxAgeSeconds", "Live odds max age (s)", humanSeconds(effective.liveOddsMaxAgeSeconds)],
          ] as const).map(([k, label, helper]) => (
            <div key={k} className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-zinc-300 text-sm font-semibold">{label}</div>
              <Input
                className="mt-2"
                type="number"
                value={String((effective as any)[k] ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: Number(e.target.value) }))}
              />
              <div className="text-zinc-500 text-xs mt-2">{helper}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="text-white font-bold">Workers / Cron</div>
        <div className="text-zinc-500 text-sm">Set ≤ 0 to disable automatic scheduling. Manual admin endpoints still work.</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            ["mainOddsCronIntervalMs", "Main odds interval (ms)", humanMs(effective.mainOddsCronIntervalMs)],
            ["detailOddsCronIntervalMs", "Detail odds interval (ms)", humanMs(effective.detailOddsCronIntervalMs)],
            ["resultsCronIntervalMs", "Results interval (ms)", humanMs(effective.resultsCronIntervalMs)],
          ] as const).map(([k, label, helper]) => (
            <div key={k} className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-zinc-300 text-sm font-semibold">{label}</div>
              <Input
                className="mt-2"
                type="number"
                value={String((effective as any)[k] ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: Number(e.target.value) }))}
              />
              <div className="text-zinc-500 text-xs mt-2">{helper}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Live Betting</div>
            <div className="text-zinc-500 text-sm">Keep disabled until tested (locking, delay, verification).</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">Enabled</span>
            <Switch checked={effective.liveBettingEnabled} onCheckedChange={(v) => setDraft((d) => ({ ...d, liveBettingEnabled: v }))} />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="text-white font-bold">Margin / Pricing</div>
        <div className="text-zinc-500 text-sm">Example: with 8% margin, 2.00 may become 1.92.</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-zinc-300 text-sm font-semibold">Margin enabled</div>
              <div className="text-zinc-500 text-xs mt-1">Default disabled</div>
            </div>
            <Switch checked={effective.marginEnabled} onCheckedChange={(v) => setDraft((d) => ({ ...d, marginEnabled: v }))} />
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Margin percent</div>
            <Input className="mt-2" type="number" value={String(effective.marginPercent)} onChange={(e) => setDraft((d) => ({ ...d, marginPercent: Number(e.target.value) }))} />
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Rounding decimals</div>
            <Input className="mt-2" type="number" value={String(effective.roundingDecimals)} onChange={(e) => setDraft((d) => ({ ...d, roundingDecimals: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="mt-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-zinc-300 text-sm font-semibold">Preview calculator</div>
            <div className="text-zinc-500 text-xs mt-1">Provider odd → Displayed odd</div>
          </div>
          <div className="flex items-center gap-3">
            <Input className="w-32" value={previewOdd} onChange={(e) => setPreviewOdd(e.target.value)} />
            <Badge className="bg-zinc-700">
              {adjustOdd(Number(previewOdd), effective.marginEnabled, effective.marginPercent, effective.roundingDecimals) || "—"}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800/60">
        <div className="text-white font-bold">Provider Throttling (APIfootball)</div>
        <div className="text-zinc-500 text-sm">Manage request delays and retries to avoid rate limits.</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Request Delay (ms)</div>
            <Input className="mt-2" type="number" value={String(effective.apiFootballRequestDelayMs)} onChange={(e) => setDraft((d) => ({ ...d, apiFootballRequestDelayMs: Number(e.target.value) }))} />
            <div className="text-zinc-500 text-[10px] mt-2">Wait between match_id calls</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Max Retries</div>
            <Input className="mt-2" type="number" value={String(effective.apiFootballMaxRetries)} onChange={(e) => setDraft((d) => ({ ...d, apiFootballMaxRetries: Number(e.target.value) }))} />
            <div className="text-zinc-500 text-[10px] mt-2">Per failed request</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Retry Backoff (ms)</div>
            <Input className="mt-2" type="number" value={String(effective.apiFootballRetryBackoffMs)} onChange={(e) => setDraft((d) => ({ ...d, apiFootballRetryBackoffMs: Number(e.target.value) }))} />
            <div className="text-zinc-500 text-[10px] mt-2">Wait after failure</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="text-zinc-300 text-sm font-semibold">Requests Per Run</div>
            <Input className="mt-2" type="number" value={String(effective.apiFootballMaxRequestsPerRun)} onChange={(e) => setDraft((d) => ({ ...d, apiFootballMaxRequestsPerRun: Number(e.target.value) }))} />
            <div className="text-zinc-500 text-[10px] mt-2">Max provider calls per batch</div>
          </div>
        </div>
      </Card>

      <SafeBatchSyncUI />
    </div>
  );
}

function SafeBatchSyncUI() {

  const qc = useQueryClient();
  const { data: jobs, isLoading } = useQuery({ queryKey: ["apifootball-jobs"], queryFn: oddsManagementApi.jobsList });
  const [creating, setCreating] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const [form, setForm] = useState({
    from: new Date().toISOString().slice(0, 10),
    to: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    limit: 20,
  });

  const createJob = async () => {
    setCreating(true);
    try {
      await oddsManagementApi.jobCreate({
        jobType: "odds_batch",
        fromDate: form.from,
        toDate: form.to,
        limit: form.limit,
      });
      await qc.invalidateQueries({ queryKey: ["apifootball-jobs"] });
    } finally {
      setCreating(false);
    }
  };

  const runNext = async (id: string) => {
    setRunningJobId(id);
    try {
      await oddsManagementApi.jobRunNext(id);
      await qc.invalidateQueries({ queryKey: ["apifootball-jobs"] });
    } finally {
      setRunningJobId(null);
    }
  };

  const reset = async (id: string) => {
    await oddsManagementApi.jobReset(id);
    await qc.invalidateQueries({ queryKey: ["apifootball-jobs"] });
  };

  return (
    <Card className="p-6 bg-zinc-900/40 border-zinc-800/60 mt-6">
      <div className="text-white font-bold">Safe Batch Odds Sync</div>
      <div className="text-zinc-500 text-sm">Resumable jobs for fetching odds without hitting rate limits.</div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-zinc-400 text-xs font-bold uppercase">From Date</label>
          <Input className="mt-1" type="date" value={form.from} onChange={(e) => setForm(f => ({ ...f, from: e.target.value }))} />
        </div>
        <div>
          <label className="text-zinc-400 text-xs font-bold uppercase">To Date</label>
          <Input className="mt-1" type="date" value={form.to} onChange={(e) => setForm(f => ({ ...f, to: e.target.value }))} />
        </div>
        <div>
          <label className="text-zinc-400 text-xs font-bold uppercase">Batch Size</label>
          <Input className="mt-1" type="number" value={form.limit} onChange={(e) => setForm(f => ({ ...f, limit: Number(e.target.value) }))} />
        </div>
        <Button className="bg-brand text-black font-bold" onClick={createJob} disabled={creating}>
          Create Sync Job
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && <div className="text-zinc-500 italic">Loading jobs…</div>}
        {(jobs || []).map((j: any) => (
          <div key={j.id} className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{j.fromDate} ➔ {j.toDate}</span>
                  <Badge className={
                    j.status === "completed" ? "bg-emerald-600" :
                    j.status === "rate_limited" ? "bg-rose-600" :
                    j.status === "running" ? "bg-brand text-black animate-pulse" :
                    "bg-zinc-700"
                  }>
                    {j.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-zinc-500 text-xs mt-1">
                  Offset: {j.offset} / {j.total || "?"} · 
                  Outcomes: {j.stats?.cumulativeOutcomes || 0} · 
                  Requests: {j.stats?.cumulativeRequests || 0}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => runNext(j.id)} 
                  disabled={runningJobId !== null || j.status === "completed"}
                >
                  {runningJobId === j.id ? "Running…" : "Run Next Batch"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => reset(j.id)}>Reset</Button>
              </div>
            </div>
            {j.status === "rate_limited" && (
              <div className="mt-3 bg-rose-900/20 border border-rose-900/40 text-rose-500 text-xs p-3 rounded-lg flex items-center gap-2">
                <span className="font-bold">⚠️ RATE LIMIT DETECTED.</span> Wait before continuing.
              </div>
            )}
            {j.stats?.lastBatch?.samples?.length > 0 && (
              <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-800/40 pt-2">
                Last batch samples: {j.stats.lastBatch.samples.map((s: any) => `${s.fixtureName} (${s.oddsCount})`).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
