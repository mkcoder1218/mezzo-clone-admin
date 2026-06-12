import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Settings,
  Key,
  Clock,
  RotateCcw,
  Gauge,
  ToggleLeft,
  ToggleRight,
  Save,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { theStatsApiAdminApi, type TheStatsApiStatus, type TheStatsApiConnectionTestResult, type TheStatsApiSportConfig } from "./api";
import { ApiClientError } from "../../lib/apiClient";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusDot({ ok, idle }: { ok?: boolean; idle?: boolean }) {
  if (idle) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-600" />;
  return ok ? (
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
  ) : (
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
  );
}

function Badge({
  active,
  trueLabel = "Enabled",
  falseLabel = "Disabled",
}: {
  active: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
      <CheckCircle2 className="w-3 h-3" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-700">
      <XCircle className="w-3 h-3" />
      {falseLabel}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
      <Zap className="w-3 h-3" />
      Active Provider
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-700">
      Fallback
    </span>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <span className="text-zinc-400">{icon}</span>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200 font-medium text-right ml-4">{children}</span>
    </div>
  );
}

function SyncFlagRow({
  label,
  enabled,
  flag,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  flag?: string;
  onToggle?: (flag: string, enabled: boolean) => Promise<void>;
  [key: string]: any;
}) {
  const [toggling, setToggling] = useState(false);

  const handleClick = async () => {
    if (!flag || !onToggle || toggling) return;
    setToggling(true);
    try {
      await onToggle(flag, !enabled);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ToggleRight className="w-4 h-4 text-lime-400" />
        ) : (
          <ToggleLeft className="w-4 h-4 text-zinc-600" />
        )}
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      <button
        type="button"
        onClick={flag ? handleClick : undefined}
        disabled={toggling || !flag}
        className={`transition-all ${flag ? "cursor-pointer hover:opacity-80 active:scale-95" : "cursor-default"} disabled:opacity-50`}
        aria-label={`Toggle ${label}`}
      >
        {toggling ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-700">
            <RefreshCw className="w-3 h-3 animate-spin" />
            …
          </span>
        ) : (
          <Badge active={enabled} />
        )}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TheStatsApiPage() {
  const [status, setStatus] = useState<TheStatsApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportsConfig, setSportsConfig] = useState<TheStatsApiSportConfig[]>([]);
  const [savingSports, setSavingSports] = useState(false);
  const [sportsMessage, setSportsMessage] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<TheStatsApiConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // ── Sync Now ──────────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    syncId?: string;
    message?: string;
    status?: string;
    fixtures?: { matchesFetched: number; fixturesUpserted: number; errors: number; errorDetail?: string; lastError?: string | null };
    eligibleFixtures?: number;
    odds?: { fixturesProcessed: number; marketsUpserted: number; outcomesUpserted: number; errors: number; errorDetail?: string };
    localOnly?: boolean;
    candidateMarkets?: number;
    marketsMatched?: number;
    outcomesMatched?: number;
    skippedConflicts?: number;
    fixtureError?: string;
    error?: string;
  } | null>(null);

  // ── API key management ────────────────────────────────────────────────────
  const [keyInput, setKeyInput]     = useState("");
  const [showKey, setShowKey]       = useState(false);
  const [savingKey, setSavingKey]   = useState(false);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);
  const [keyError, setKeyError]     = useState<string | null>(null);
  const keySuccessTimer             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await theStatsApiAdminApi.getStatus();
      setStatus(data);
      setSportsConfig(data.sportsConfig || []);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSaveApiKey = async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    setKeyError(null);
    setKeySuccess(null);
    try {
      await theStatsApiAdminApi.saveApiKey(keyInput.trim());
      setKeySuccess("API key saved and all sync flags enabled. Refreshing status…");
      setKeyInput("");
      if (keySuccessTimer.current) clearTimeout(keySuccessTimer.current);
      keySuccessTimer.current = setTimeout(() => setKeySuccess(null), 5000);
      await loadStatus();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setKeyError(msg);
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await theStatsApiAdminApi.testConnection();
      setTestResult(result);
      // Refresh status after test to pick up latest rate usage
      await loadStatus();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setTestResult({ success: false, error: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await theStatsApiAdminApi.syncNow({ limit: 100 });
      setSyncResult(result);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setSyncResult({ success: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncOddsOnly = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await theStatsApiAdminApi.syncNow({ limit: 100, oddsOnly: true });
      setSyncResult(result);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setSyncResult({ success: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  const handleMatchFixturesToOdds = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await theStatsApiAdminApi.matchFixturesToOdds({ limit: 1000 });
      setSyncResult(result);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setSyncResult({ success: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  const updateSportConfig = (slug: string, patch: Partial<TheStatsApiSportConfig>) => {
    setSportsConfig((rows) => rows.map((row) => row.slug === slug ? { ...row, ...patch } : row));
  };

  const handleSaveSportsConfig = async () => {
    setSavingSports(true);
    setSportsMessage(null);
    try {
      const result = await theStatsApiAdminApi.saveSportsConfig(sportsConfig);
      setSportsConfig(result.sports || []);
      setSportsMessage("Sports config saved.");
      await loadStatus();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setSportsMessage(msg);
    } finally {
      setSavingSports(false);
    }
  };

  const handleSyncSport = async (sportSlug: string) => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await theStatsApiAdminApi.syncNow({ limit: 100, sportSlug });
      setSyncResult(result);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
      setSyncResult({ success: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            Providers
          </p>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-lime-400" />
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
              TheStatsAPI
            </h1>
            {status && (
              <ActiveBadge active={status.oddsProviderActive} />
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Primary football data provider — fixtures, odds, results, stats, settlement
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status && !status.oddsProviderActive && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await theStatsApiAdminApi.activateAsProvider();
                  await loadStatus();
                } catch (err: any) {
                  const msg = err instanceof ApiClientError ? err.message : String((err as any)?.message || err);
                  setError(msg);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm transition-all"
            >
              <Zap className="w-4 h-4" />
              Set as Active Provider
            </button>
          )}
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error loading status */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !status && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {status && (
        <>
          {/* ── Section 1: Connection Settings ────────────────────────────── */}
          <SectionCard title="Connection Settings" icon={<Settings className="w-4 h-4" />}>
            <Row label="Provider">
              <span className="font-mono text-lime-400">thestatsapi</span>
            </Row>
            <Row label="Status">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await theStatsApiAdminApi.toggleSyncFlag("THESTATSAPI_ENABLED", !status.enabled);
                    if (!status.enabled) await theStatsApiAdminApi.activateAsProvider();
                    await loadStatus();
                  } catch { await loadStatus(); }
                }}
                className="cursor-pointer hover:opacity-80 active:scale-95 transition-all"
              >
                <Badge active={status.enabled} trueLabel="Enabled" falseLabel="Disabled" />
              </button>
            </Row>
            <Row label="Active Odds Provider">
              <ActiveBadge active={status.oddsProviderActive} />
            </Row>
            <Row label="Default Provider">
              <Badge active={status.isDefaultProvider} trueLabel="Yes" falseLabel="No" />
            </Row>
            <Row label="API Base URL">
              <span className="font-mono text-xs text-zinc-300">{status.baseUrl}</span>
            </Row>
            <Row label="API Key">
              {status.apiKeyConfigured ? (
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Key className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-xs">
                    {status.apiKeyPreview ?? "****"}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  Not configured
                </span>
              )}
            </Row>

            {/* ── API Key Input ── */}
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Key className="w-3 h-3" />
                {status.apiKeyConfigured ? "Update API Key" : "Set API Key"}
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSaveApiKey(); }}
                    placeholder="Paste your TheStatsAPI key…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-lime-400/30 focus:border-lime-400/50 pr-10 transition-all"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveApiKey()}
                  disabled={savingKey || !keyInput.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {savingKey ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingKey ? "Saving…" : "Save Key"}
                </button>
              </div>

              {keySuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {keySuccess}
                </div>
              )}
              {keyError && (
                <div className="flex items-start gap-2 text-xs text-rose-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {keyError}
                </div>
              )}
              <p className="text-[10px] text-zinc-600">
                Saving the key also sets <span className="font-mono text-zinc-500">THESTATSAPI_ENABLED=true</span> and enables all sync flags in <span className="font-mono text-zinc-500">.env</span> — no restart required.
              </p>
            </div>
            <Row label="Request Timeout">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {status.timeoutMs.toLocaleString()} ms
              </span>
            </Row>
            <Row label="Retry Count">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                {status.retryCount} retries
              </span>
            </Row>

            {/* Test connection */}
            <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !status.apiKeyConfigured}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  {testing ? "Testing…" : "Test Connection"}
                </button>

                {testResult !== null && (
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold ${
                      testResult.success ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    <StatusDot ok={testResult.success} />
                    {testResult.success ? "Connected" : "Failed"}
                  </div>
                )}
              </div>

              {testResult && (
                <div
                  className={`rounded-xl px-4 py-3 text-xs font-mono ${
                    testResult.success
                      ? "bg-emerald-400/5 border border-emerald-400/20 text-emerald-300"
                      : "bg-rose-500/5 border border-rose-500/20 text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-zinc-500">status: </span>
                        {testResult.status}
                      </div>
                      {testResult.timestamp && (
                        <div>
                          <span className="text-zinc-500">timestamp: </span>
                          {testResult.timestamp}
                        </div>
                      )}
                      {testResult.baseUrl && (
                        <div>
                          <span className="text-zinc-500">endpoint: </span>
                          {testResult.baseUrl}/health
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-zinc-500">error: </span>
                      {testResult.error ?? "Unknown error"}
                    </div>
                  )}
                </div>
              )}

              {!status.apiKeyConfigured && (
                <p className="text-[11px] text-zinc-500">
                  Set THESTATSAPI_API_KEY in your environment to test the connection.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── Section 3: Sync Now ───────────────────────────────────────── */}
          <SectionCard title="Data Sync" icon={<Download className="w-4 h-4" />}>
            <p className="text-xs text-zinc-400 mb-4">
              Manually fetch upcoming fixtures and pre-match odds from TheStatsAPI and ingest them into the database.
              The background worker does this automatically every 15 minutes when enabled — use this to trigger an immediate sync.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => void handleSyncNow()}
                disabled={syncing || !status.apiKeyConfigured}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {syncing ? "Syncing…" : "Sync Fixtures & Odds Now"}
              </button>
              <button
                type="button"
                onClick={() => void handleSyncOddsOnly()}
                disabled={syncing || !status.apiKeyConfigured}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync Odds Only
              </button>
              <button
                type="button"
                onClick={() => void handleMatchFixturesToOdds()}
                disabled={syncing || !status.apiKeyConfigured}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Match Fixtures to Odds
              </button>
              {!status.apiKeyConfigured && (
                <p className="text-[11px] text-zinc-500">Configure the API key first.</p>
              )}
            </div>

            {syncResult && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-xs font-mono ${
                syncResult.success
                  ? "bg-emerald-400/5 border border-emerald-400/20 text-emerald-300"
                  : "bg-rose-500/5 border border-rose-500/20 text-rose-300"
              }`}>
                {syncResult.success ? (
                  <div className="space-y-1.5">
                    {syncResult.status === "running" ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                          <span className="font-bold text-lime-400">Sync running in background</span>
                        </div>
                        <div className="text-zinc-400">{syncResult.message}</div>
                        <div className="text-zinc-500 text-[10px] mt-1">id: {syncResult.syncId}</div>
                        <button
                          type="button"
                          onClick={loadStatus}
                          className="mt-2 flex items-center gap-1.5 text-[11px] text-lime-400 hover:text-lime-300 font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" /> Refresh status after ~30s
                        </button>
                      </>
                    ) : syncResult.localOnly ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-emerald-400">Local match complete</span>
                        </div>
                        <div className="space-y-0.5">
                          <div><span className="text-zinc-500">source: </span>TheStatsAPI odds already in database</div>
                          <div><span className="text-zinc-500">candidate markets: </span>{syncResult.candidateMarkets ?? 0}</div>
                          <div><span className="text-zinc-500">markets matched: </span>{syncResult.marketsMatched ?? 0}</div>
                          <div><span className="text-zinc-500">outcomes matched: </span>{syncResult.outcomesMatched ?? 0}</div>
                          <div><span className="text-zinc-500">skipped conflicts: </span>{syncResult.skippedConflicts ?? 0}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-emerald-400">Sync complete</span>
                        </div>
                        {syncResult.fixtures && (
                          <div className="space-y-0.5">
                            <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Fixtures</div>
                            <div><span className="text-zinc-500">fetched: </span>{syncResult.fixtures.matchesFetched}</div>
                            <div><span className="text-zinc-500">upserted: </span>{syncResult.fixtures.fixturesUpserted}</div>
                            {syncResult.fixtures.errors > 0 && (
                              <div className="text-rose-400">
                                <span className="text-zinc-500">errors: </span>{syncResult.fixtures.errors}
                                {(syncResult.fixtures.errorDetail || syncResult.fixtures.lastError) && (
                                  <div className="mt-1 text-rose-300 bg-rose-500/5 border border-rose-500/10 rounded px-2 py-1 break-all">
                                    {syncResult.fixtures.errorDetail || syncResult.fixtures.lastError}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {syncResult.odds && (
                          <div className="space-y-0.5 mt-2">
                            <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Odds</div>
                            {typeof syncResult.eligibleFixtures === "number" && (
                              <div><span className="text-zinc-500">eligible fixtures: </span>{syncResult.eligibleFixtures}</div>
                            )}
                            <div><span className="text-zinc-500">fixtures processed: </span>{syncResult.odds.fixturesProcessed}</div>
                            <div><span className="text-zinc-500">markets upserted: </span>{syncResult.odds.marketsUpserted}</div>
                            <div><span className="text-zinc-500">outcomes upserted: </span>{syncResult.odds.outcomesUpserted}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-zinc-500">error: </span>
                    {syncResult.error ?? "Unknown error"}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* ── Section 4: Sync Settings ───────────────────────────────────── */}
          <SectionCard title="Sports Fetch Config" icon={<Activity className="w-4 h-4" />}>
            <p className="text-xs text-zinc-400 mb-4">
              Enable the TheStatsAPI sports that should fetch fixtures and odds. The multi-sport worker uses this list.
            </p>
            <div className="space-y-2">
              {sportsConfig.map((sport) => (
                <div key={sport.slug} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sport.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{sport.slug}</span>
                      <Badge active={sport.enabled} trueLabel="Sport On" falseLabel="Sport Off" />
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {([
                        ["enabled", "Enabled"],
                        ["fixtureSyncEnabled", "Fixtures"],
                        ["oddsSyncEnabled", "Odds"],
                        ["liveOddsSyncEnabled", "Live Odds"],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateSportConfig(sport.slug, { [key]: !sport[key] } as any)}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                            sport[key]
                              ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-500"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex lg:flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSyncSport(sport.slug)}
                      disabled={syncing || !sport.enabled || !status.apiKeyConfigured}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold disabled:opacity-40"
                    >
                      Sync Sport
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveSportsConfig()}
                disabled={savingSports}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm disabled:opacity-40"
              >
                {savingSports ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Sports Config
              </button>
              {sportsMessage && <span className="text-xs text-zinc-400">{sportsMessage}</span>}
            </div>
          </SectionCard>

          <SectionCard title="Sync Settings" icon={<RefreshCw className="w-4 h-4" />}>
            <div className="mb-4">
              {([
                { label: "Fixture Sync",          flag: "THESTATSAPI_FIXTURE_SYNC_ENABLED",       enabled: status.syncFlags.fixtureSyncEnabled },
                { label: "Pre-Match Odds Sync",   flag: "THESTATSAPI_PREMATCH_ODDS_SYNC_ENABLED",  enabled: status.syncFlags.prematchOddsSyncEnabled },
                { label: "Live Match Sync",        flag: "THESTATSAPI_LIVE_SYNC_ENABLED",           enabled: status.syncFlags.liveSyncEnabled },
                { label: "Live Odds Sync",         flag: "THESTATSAPI_LIVE_ODDS_SYNC_ENABLED",      enabled: status.syncFlags.liveOddsSyncEnabled },
                { label: "Results Sync",           flag: "THESTATSAPI_RESULTS_SYNC_ENABLED",        enabled: status.syncFlags.resultsSyncEnabled },
                { label: "Stats Sync",             flag: "THESTATSAPI_STATS_SYNC_ENABLED",          enabled: status.syncFlags.statsSyncEnabled },
                { label: "Settlement Worker",      flag: "THESTATSAPI_SETTLEMENT_ENABLED",          enabled: status.syncFlags.settlementEnabled },
              ] as { label: string; flag: string; enabled: boolean }[]).map(({ label, flag, enabled }) => (
                <SyncFlagRow
                  key={flag}
                  label={label}
                  enabled={enabled}
                  flag={flag as string}
                  onToggle={async (f, e) => {
                    try {
                      await theStatsApiAdminApi.toggleSyncFlag(f, e);
                      await loadStatus();
                    } catch {
                      // silently refresh so UI reflects actual state
                      await loadStatus();
                    }
                  }}
                />
              ))}
            </div>
          </SectionCard>

          {/* ── Section 5: Diagnostics ─────────────────────────────────────── */}
          <SectionCard title="Diagnostics" icon={<Gauge className="w-4 h-4" />}>
            <div className="mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                Rate Limiter (per minute window)
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Window Start", value: status.rate.windowStartMs ? new Date(status.rate.windowStartMs).toLocaleTimeString() : "—" },
                  { label: "Requests Used", value: String(status.rate.used) },
                  { label: "Limit / min", value: String(status.rate.limit) },
                  { label: "Remaining", value: String(status.rate.remaining) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      {label}
                    </p>
                    <p className="text-lg font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Rate usage bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Rate Usage
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {status.rate.used} / {status.rate.limit}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-lime-400 transition-all"
                    style={{
                      width: `${Math.min(100, (status.rate.used / Math.max(1, status.rate.limit)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {testResult !== null && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Last Connection Test
                </h3>
                <div className="flex items-center gap-2">
                  <StatusDot ok={testResult.success} />
                  <span
                    className={`text-sm font-semibold ${
                      testResult.success ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {testResult.success ? "Success" : "Failed"}
                  </span>
                  {testResult.timestamp && (
                    <span className="text-[11px] text-zinc-500 ml-2">
                      API time: {new Date(testResult.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                {!testResult.success && testResult.error && (
                  <p className="mt-2 text-xs text-rose-300 font-mono bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2">
                    {testResult.error}
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
