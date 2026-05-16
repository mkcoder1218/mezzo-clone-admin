import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "../../lib/apiClient";

type MezzoLeague = {
  mezzoCompetitionId: string;
  competitionName: string;
  country: string;
  sportId: number | null;
  sportName: string;
  eventsCount: number | null;
};

type LeagueMapRow = {
  mezzoCompetitionId: string;
  apiFootballLeagueId: string;
  country: string | null;
  competitionName: string | null;
  isActive: boolean;
  updatedAt?: string;
};

export function MezzoLeagueMappingPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [leagues, setLeagues] = useState<MezzoLeague[]>([]);
  const [maps, setMaps] = useState<LeagueMapRow[]>([]);

  const mapsById = useMemo(() => new Map(maps.map((m) => [String(m.mezzoCompetitionId), m])), [maps]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, m] = await Promise.all([
        apiRequest<{ leagues: MezzoLeague[]; fetchedAt: string | null }>("/api/admin/odds/mezzo/leagues"),
        apiRequest<{ rows: LeagueMapRow[] }>("/api/admin/odds/mezzo/league-maps"),
      ]);
      setLeagues(l.leagues || []);
      setMaps(m.rows || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load Mezzo leagues/mappings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = String(q || "").trim().toLowerCase();
    if (!term) return leagues;
    return leagues.filter((x) => {
      const hay = `${x.mezzoCompetitionId} ${x.country} ${x.competitionName} ${x.sportName}`.toLowerCase();
      return hay.includes(term);
    });
  }, [leagues, q]);

  const setMapping = async (league: MezzoLeague, apiFootballLeagueId: string, isActive: boolean) => {
    const id = String(apiFootballLeagueId || "").trim();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/admin/odds/mezzo/league-maps", {
        method: "POST",
        body: JSON.stringify({
          mezzoCompetitionId: league.mezzoCompetitionId,
          apiFootballLeagueId: id,
          country: league.country,
          competitionName: league.competitionName,
          isActive,
        }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const removeMapping = async (mezzoCompetitionId: string) => {
    if (!confirm("Remove this mapping?")) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/odds/mezzo/league-maps/${encodeURIComponent(mezzoCompetitionId)}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to remove mapping");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Mezzo <span className="text-brand">League Mapping</span>
        </h1>
        <p className="text-zinc-400">
          Fetched from Mezzo catalog. Map each Mezzo competition to an APIfootball league ID so results sync can cover those fixtures.
        </p>
      </header>

      {error ? <div className="text-rose-400 text-sm font-bold">{error}</div> : null}

      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 h-12 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white text-sm focus:outline-none"
          placeholder="Search league / country / id..."
        />
        <Button variant="secondary" onClick={load} disabled={loading || saving}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leagues</span>
            <span className="text-xs text-zinc-500">{filtered.length} shown</span>
          </CardTitle>
          <CardDescription>Enter APIfootball league id and save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((l) => {
            const existing = mapsById.get(String(l.mezzoCompetitionId));
            return (
              <LeagueRow
                key={l.mezzoCompetitionId}
                league={l}
                existing={existing || null}
                disabled={saving}
                onSave={setMapping}
                onRemove={removeMapping}
              />
            );
          })}
          {filtered.length === 0 ? <div className="text-zinc-500 text-sm">No leagues.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function LeagueRow({
  league,
  existing,
  disabled,
  onSave,
  onRemove,
}: {
  league: MezzoLeague;
  existing: LeagueMapRow | null;
  disabled: boolean;
  onSave: (league: MezzoLeague, apiFootballLeagueId: string, isActive: boolean) => void;
  onRemove: (mezzoCompetitionId: string) => void;
}) {
  const [value, setValue] = useState(existing?.apiFootballLeagueId || "");
  const [active, setActive] = useState(existing ? existing.isActive !== false : true);

  useEffect(() => {
    setValue(existing?.apiFootballLeagueId || "");
    setActive(existing ? existing.isActive !== false : true);
  }, [existing?.apiFootballLeagueId, existing?.isActive]);

  return (
    <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black text-white truncate">
            {league.country} — {league.competitionName}
          </div>
          <div className="text-xs text-zinc-500 truncate">
            mezzoCompetitionId: {league.mezzoCompetitionId} {league.sportName ? `• ${league.sportName}` : ""}{" "}
            {league.eventsCount != null ? `• events: ${league.eventsCount}` : ""}
          </div>
          {existing ? (
            <div className="text-xs text-emerald-400 font-bold mt-1">
              mapped → APIfootball league {existing.apiFootballLeagueId} {existing.isActive ? "" : "(inactive)"}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 font-bold mt-1">not mapped</div>
          )}
        </div>
        {existing ? (
          <Button variant="destructive" disabled={disabled} onClick={() => onRemove(league.mezzoCompetitionId)}>
            Remove
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-11 px-4 rounded-xl bg-black/40 border border-zinc-800 text-white font-mono text-sm focus:outline-none"
          placeholder="APIfootball league id (e.g. 39)"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Active</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <Button className="bg-brand text-black font-extrabold" disabled={disabled} onClick={() => onSave(league, value, active)}>
          Save
        </Button>
      </div>
    </div>
  );
}

