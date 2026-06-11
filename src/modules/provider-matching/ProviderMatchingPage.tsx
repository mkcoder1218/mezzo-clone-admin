import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/apiClient";

type NameMapping = {
  id: string;
  entityType: string;
  sourceProvider: string;
  sourceName: string;
  targetProvider: string;
  targetName: string;
  sport?: string | null;
  country?: string | null;
  league?: string | null;
  isActive: boolean;
  updatedAt: string;
};

type FailedLink = {
  id: string;
  status: string;
  confidence: number;
  debug?: any;
  Fixture?: {
    homeTeam?: { name: string };
    awayTeam?: { name: string };
    League?: { name: string; country?: string };
  };
};

type ProviderFixture = {
  id: string;
  externalEventId?: string | null;
  provider: string;
  startsAt: string;
  pricesCount?: number;
  isTop?: boolean;
  league?: { name?: string; country?: string | null } | null;
  home?: string | null;
  away?: string | null;
  outcomeCount: number;
  markets: Array<{ key: string; outcomes: Array<{ key: string; name: string; odds: number; provider?: string }> }>;
  link?: {
    id: string;
    status: string;
    targetFixtureId?: string | null;
    targetEventId?: string | null;
    detailAvailable?: boolean | null;
    lastError?: string | null;
  } | null;
};

function fmtDate(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  return d.toLocaleString();
}

function mainOddsLabel(fixture: ProviderFixture) {
  const oneXTwo = fixture.markets.find((m) => m.key === "1X2");
  if (!oneXTwo) return "1X2 missing";
  const parts = ["1", "X", "2"].map((name) => {
    const found = oneXTwo.outcomes.find((o) => o.name.toUpperCase() === name || o.key.toUpperCase().endsWith(`:${name}`));
    return `${name} ${found?.odds ? found.odds.toFixed(2) : "-"}`;
  });
  return parts.join("  ");
}

export function ProviderMatchingPage() {
  const [statsName, setStatsName] = useState("");
  const [mezzoName, setMezzoName] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<NameMapping[]>([]);
  const [failed, setFailed] = useState<FailedLink[]>([]);
  const [statsFixtures, setStatsFixtures] = useState<ProviderFixture[]>([]);
  const [mezzoFixtures, setMezzoFixtures] = useState<ProviderFixture[]>([]);
  const [statsQ, setStatsQ] = useState("");
  const [mezzoQ, setMezzoQ] = useState("");
  const [selectedStatsId, setSelectedStatsId] = useState("");
  const [selectedMezzoId, setSelectedMezzoId] = useState("");
  const [selectedStatsIds, setSelectedStatsIds] = useState<string[]>([]);
  const [selectedMezzoIds, setSelectedMezzoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSave = useMemo(() => statsName.trim() && mezzoName.trim(), [statsName, mezzoName]);

  async function load() {
    setLoading(true);
    try {
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const [mappings, failedLinks] = await Promise.all([
        apiRequest<{ rows: NameMapping[] }>(`/api/admin/provider-matching/name-mappings${qs}`),
        apiRequest<{ rows: FailedLink[] }>("/api/admin/provider-matching/failed-links?limit=50"),
      ]);
      setRows(mappings.rows || []);
      setFailed(failedLinks.rows || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadFixtures() {
    setFixturesLoading(true);
    try {
      const statsQs = new URLSearchParams({ provider: "thestatsapi", limit: "80" });
      if (statsQ.trim()) statsQs.set("q", statsQ.trim());
      const mezzoQs = new URLSearchParams({ provider: "mezzo", limit: "80" });
      if (mezzoQ.trim()) mezzoQs.set("q", mezzoQ.trim());
      const [stats, mezzo] = await Promise.all([
        apiRequest<{ rows: ProviderFixture[] }>(`/api/admin/provider-matching/fixtures?${statsQs.toString()}`),
        apiRequest<{ rows: ProviderFixture[] }>(`/api/admin/provider-matching/fixtures?${mezzoQs.toString()}`),
      ]);
      setStatsFixtures(stats.rows || []);
      setMezzoFixtures(mezzo.rows || []);
      setSelectedStatsIds((ids) => ids.filter((id) => (stats.rows || []).some((f) => f.id === id)));
      setSelectedMezzoIds((ids) => ids.filter((id) => (mezzo.rows || []).some((f) => f.id === id)));
    } finally {
      setFixturesLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void loadFixtures();
  }, []);

  async function save() {
    if (!canSave) return;
    setMessage(null);
    await apiRequest("/api/admin/provider-matching/name-mappings", {
      method: "POST",
      body: JSON.stringify({
        entityType: "team",
        sourceProvider: "thestatsapi",
        sourceName: statsName.trim(),
        targetProvider: "mezzo",
        targetName: mezzoName.trim(),
        sport: "football",
      }),
    });
    setStatsName("");
    setMezzoName("");
    setMessage("Normalization saved.");
    await load();
  }

  async function remove(id: string) {
    await apiRequest(`/api/admin/provider-matching/name-mappings/${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  async function linkSelected() {
    if (!selectedStatsId || !selectedMezzoId) return;
    setLinking(true);
    setMessage(null);
    try {
      const res: any = await apiRequest("/api/admin/provider-matching/link-fixtures", {
        method: "POST",
        body: { statsFixtureId: selectedStatsId, mezzoFixtureId: selectedMezzoId },
      });
      const detail = res?.result?.detail;
      const copied = detail?.copied;
      setMessage(`Linked and fetched. Used Mezzo: ${detail?.used ? "yes" : "no"}${copied ? `, copied outcomes: ${copied.copiedOutcomes}` : ""}.`);
      await Promise.all([loadFixtures(), load()]);
    } finally {
      setLinking(false);
    }
  }

  async function bulkLinkSelected() {
    const pairCount = Math.min(selectedStatsIds.length, selectedMezzoIds.length);
    if (!pairCount) return;
    setLinking(true);
    setMessage(null);
    try {
      const pairs = Array.from({ length: pairCount }, (_, i) => ({
        statsFixtureId: selectedStatsIds[i],
        mezzoFixtureId: selectedMezzoIds[i],
      }));
      const res: any = await apiRequest("/api/admin/provider-matching/bulk-link-fixtures", {
        method: "POST",
        body: { pairs },
      });
      setMessage(`Bulk linked ${res.matched || 0}/${res.processed || pairCount}. Failed: ${res.failed || 0}.`);
      setSelectedStatsIds([]);
      setSelectedMezzoIds([]);
      await Promise.all([loadFixtures(), load()]);
    } finally {
      setLinking(false);
    }
  }

  function toggleSelection(id: string, side: "stats" | "mezzo") {
    const setter = side === "stats" ? setSelectedStatsIds : setSelectedMezzoIds;
    setter((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    if (side === "stats") setSelectedStatsId(id);
    else setSelectedMezzoId(id);
  }

  function renderFixtureCard(f: ProviderFixture, selected: boolean, onSelect: () => void, order?: number) {
    return (
      <button
        key={f.id}
        className={`w-full text-left border rounded p-3 transition ${selected ? "border-lime-400 bg-lime-400/10" : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600"}`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold">{f.home || "Home"} v {f.away || "Away"}</div>
            <div className="text-xs text-zinc-500 mt-1">{f.league?.country || ""} - {f.league?.name || ""}</div>
            <div className="text-xs text-zinc-500 mt-1">{fmtDate(f.startsAt)} | id {f.externalEventId || "-"}</div>
          </div>
          <div className="text-right text-xs">
            {order ? <div className="inline-flex items-center justify-center rounded bg-lime-400 text-black font-bold px-2 py-0.5 mb-1">#{order}</div> : null}
            <div className={f.outcomeCount ? "text-lime-300" : "text-orange-300"}>{f.outcomeCount} odds</div>
            {f.link ? <div className="text-zinc-400 mt-1">{f.link.status}</div> : null}
          </div>
        </div>
        <div className="mt-3 text-xs font-mono text-zinc-300">{mainOddsLabel(f)}</div>
        {f.link?.lastError ? <div className="mt-2 text-xs text-red-300">{f.link.lastError}</div> : null}
      </button>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Provider Matching</h1>
        <p className="text-zinc-400 mt-1">Normalize team names between TheStatsAPI and Mezzo for future fixture linkage.</p>
      </div>

      <section className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
        <h2 className="text-white font-semibold mb-4">Add Team Normalization</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
            placeholder="TheStatsAPI team name"
            value={statsName}
            onChange={(e) => setStatsName(e.target.value)}
          />
          <input
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
            placeholder="Mezzo team name"
            value={mezzoName}
            onChange={(e) => setMezzoName(e.target.value)}
          />
          <button
            className="bg-lime-400 text-black font-semibold rounded px-4 py-2 disabled:opacity-50"
            disabled={!canSave}
            onClick={() => void save()}
          >
            Save
          </button>
        </div>
        {message ? <div className="text-lime-400 text-sm mt-3">{message}</div> : null}
      </section>

      <section className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold">Fetched Games Linker</h2>
            <p className="text-zinc-500 text-sm mt-1">Select one StatsAPI game and one Mezzo game, then link/fetch to fill missing StatsAPI odds from stored Mezzo data.</p>
          </div>
          <div className="flex gap-2">
            <button className="border border-zinc-700 text-white rounded px-4 py-2 disabled:opacity-50" disabled={fixturesLoading} onClick={() => void loadFixtures()}>
              {fixturesLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              className="border border-lime-500/60 text-lime-200 rounded px-4 py-2 disabled:opacity-50"
              disabled={!selectedStatsIds.length || !selectedMezzoIds.length || linking}
              onClick={() => void bulkLinkSelected()}
            >
              Bulk Link {Math.min(selectedStatsIds.length, selectedMezzoIds.length) || ""}
            </button>
            <button
              className="bg-lime-400 text-black font-semibold rounded px-4 py-2 disabled:opacity-50"
              disabled={!selectedStatsId || !selectedMezzoId || linking}
              onClick={() => void linkSelected()}
            >
              {linking ? "Linking..." : "Link & Fetch Odds"}
            </button>
          </div>
        </div>
        <div className="text-xs text-zinc-500 mb-3">
          Bulk mode: click games in the same order on both sides. The numbered rows are linked by position.
          {selectedStatsIds.length !== selectedMezzoIds.length ? (
            <span className="text-orange-300 ml-2">Selected counts differ: {selectedStatsIds.length} StatsAPI, {selectedMezzoIds.length} Mezzo.</span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
                placeholder="Search StatsAPI games"
                value={statsQ}
                onChange={(e) => setStatsQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void loadFixtures(); }}
              />
              <button className="border border-zinc-700 text-white rounded px-4 py-2" onClick={() => void loadFixtures()}>Search</button>
            </div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">TheStatsAPI fetched results</div>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {statsFixtures.map((f) => renderFixtureCard(
                f,
                selectedStatsIds.includes(f.id) || selectedStatsId === f.id,
                () => toggleSelection(f.id, "stats"),
                selectedStatsIds.indexOf(f.id) + 1 || undefined,
              ))}
              {!statsFixtures.length ? <div className="text-zinc-500 text-sm py-4">No StatsAPI games found.</div> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
                placeholder="Search Mezzo games"
                value={mezzoQ}
                onChange={(e) => setMezzoQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void loadFixtures(); }}
              />
              <button className="border border-zinc-700 text-white rounded px-4 py-2" onClick={() => void loadFixtures()}>Search</button>
            </div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Mezzo fetched results</div>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {mezzoFixtures.map((f) => renderFixtureCard(
                f,
                selectedMezzoIds.includes(f.id) || selectedMezzoId === f.id,
                () => toggleSelection(f.id, "mezzo"),
                selectedMezzoIds.indexOf(f.id) + 1 || undefined,
              ))}
              {!mezzoFixtures.length ? <div className="text-zinc-500 text-sm py-4">No Mezzo games found.</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-4">
          <h2 className="text-white font-semibold">Saved Normalizations</h2>
          <div className="flex gap-2">
            <input
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="border border-zinc-700 text-white rounded px-4 py-2" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2">TheStatsAPI</th>
                <th className="text-left py-2">Mezzo</th>
                <th className="text-left py-2">Sport</th>
                <th className="text-right py-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-900">
                  <td className="py-2">{r.sourceName}</td>
                  <td className="py-2">{r.targetName}</td>
                  <td className="py-2">{r.sport || "football"}</td>
                  <td className="py-2 text-right">
                    <button className="text-red-400 hover:text-red-300" onClick={() => void remove(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="py-5 text-zinc-500" colSpan={4}>{loading ? "Loading..." : "No mappings yet."}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
        <h2 className="text-white font-semibold mb-4">Failed Or Ambiguous Links</h2>
        <div className="space-y-2">
          {failed.map((f) => {
            const d = f.debug || {};
            return (
              <div key={f.id} className="border border-zinc-800 rounded p-3">
                <div className="flex justify-between gap-3">
                  <div className="text-white font-medium">
                    {f.Fixture?.homeTeam?.name || d.statsHome || "Home"} v {f.Fixture?.awayTeam?.name || d.statsAway || "Away"}
                  </div>
                  <div className="text-zinc-400 font-mono">{f.status} {Number(f.confidence || 0).toFixed(2)}</div>
                </div>
                <div className="text-zinc-500 text-xs mt-1">{f.Fixture?.League?.country || ""} {f.Fixture?.League?.name || ""}</div>
                {Array.isArray(d.candidates) && d.candidates[0] ? (
                  <div className="text-zinc-400 text-xs mt-2">
                    Best Mezzo candidate: {d.candidates[0].home} v {d.candidates[0].away}
                  </div>
                ) : null}
              </div>
            );
          })}
          {!failed.length ? <div className="text-zinc-500 text-sm">No failed links found.</div> : null}
        </div>
      </section>
    </div>
  );
}
