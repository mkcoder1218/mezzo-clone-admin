import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "../lib/apiClient";

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  highlight: string | null;
  imageUrl: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

function toLocalInputDateTime(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputDateTime(v: string) {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function BannersPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<Partial<BannerRow>>({
    title: "",
    subtitle: "",
    highlight: "",
    imageUrl: "",
    color: "bg-brand-primary",
    sortOrder: 0,
    isActive: true,
    startsAt: null,
    endsAt: null,
  });

  const isEditing = Boolean(draft.id);

  const canSave = useMemo(() => {
    return Boolean(String(draft.title || "").trim() && String(draft.imageUrl || "").trim());
  }, [draft.title, draft.imageUrl]);

  const onPickImageFile = async (file: File | null) => {
    if (!file) return;
    const asDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });

    setDraft((d) => ({
      ...d,
      imageUrl: asDataUrl,
      title: String(d.title || "").trim() ? d.title : "Banner",
    }));
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ rows: any[] }>("/api/banners/admin");
      const next = (data.rows || []).map((r: any) => ({
        id: String(r.id),
        title: String(r.title || ""),
        subtitle: r.subtitle ?? null,
        highlight: r.highlight ?? null,
        imageUrl: String(r.imageUrl || ""),
        color: String(r.color || "bg-brand-primary"),
        sortOrder: Number(r.sortOrder || 0),
        isActive: Boolean(r.isActive),
        startsAt: r.startsAt ?? null,
        endsAt: r.endsAt ?? null,
      })) as BannerRow[];
      setRows(next);
    } catch (e: any) {
      setError(e?.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetDraft = () =>
    setDraft({
      title: "",
      subtitle: "",
      highlight: "",
      imageUrl: "",
      color: "bg-brand-primary",
      sortOrder: 0,
      isActive: true,
      startsAt: null,
      endsAt: null,
    });

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: String(draft.title || "").trim(),
        subtitle: String(draft.subtitle || "").trim() || null,
        highlight: String(draft.highlight || "").trim() || null,
        imageUrl: String(draft.imageUrl || "").trim(),
        color: String(draft.color || "bg-brand-primary"),
        sortOrder: Number(draft.sortOrder || 0) || 0,
        isActive: Boolean(draft.isActive),
        startsAt: draft.startsAt ? String(draft.startsAt) : null,
        endsAt: draft.endsAt ? String(draft.endsAt) : null,
      };
      if (draft.id) {
        await apiRequest(`/api/banners/admin/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiRequest("/api/banners/admin", { method: "POST", body: JSON.stringify(body) });
      }
      resetDraft();
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/banners/admin/${id}`, { method: "DELETE" });
      if (draft.id === id) resetDraft();
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete banner");
    } finally {
      setSaving(false);
    }
  };

  const edit = (r: BannerRow) => setDraft({ ...r });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Banners <span className="text-brand">Config</span>
        </h1>
        <p className="text-zinc-400">Manage homepage promo banners shown in the user app.</p>
      </header>

      {error ? <div className="text-rose-400 text-sm font-bold">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Banner" : "Create Banner"}</CardTitle>
            <CardDescription>Title + image are required. Sort order controls rotation order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Title</div>
              <Input value={draft.title || ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Subtitle</div>
              <Input value={draft.subtitle || ""} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Highlight</div>
              <Input value={draft.highlight || ""} onChange={(e) => setDraft((d) => ({ ...d, highlight: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Banner Image</div>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onPickImageFile(e.target.files?.[0] || null)}
                />
                <div className="text-[11px] text-zinc-500">
                  Or paste a URL / data URI:
                </div>
                <Input value={draft.imageUrl || ""} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
                {draft.imageUrl ? (
                  <div className="mt-2 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                    <img src={draft.imageUrl} alt="Banner preview" className="w-full h-40 object-cover" />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Color Class</div>
                <Input value={draft.color || ""} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Sort Order</div>
                <Input
                  type="number"
                  value={String(draft.sortOrder ?? 0)}
                  onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Starts At</div>
                <Input
                  type="datetime-local"
                  value={toLocalInputDateTime(draft.startsAt as any)}
                  onChange={(e) => setDraft((d) => ({ ...d, startsAt: fromLocalInputDateTime(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Ends At</div>
                <Input
                  type="datetime-local"
                  value={toLocalInputDateTime(draft.endsAt as any)}
                  onChange={(e) => setDraft((d) => ({ ...d, endsAt: fromLocalInputDateTime(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between border border-zinc-800 rounded-xl p-4 bg-zinc-900/30">
              <div className="text-sm font-bold text-zinc-200">Active</div>
              <Switch checked={draft.isActive !== false} onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
            </div>
            <div className="flex gap-2">
              <Button disabled={!canSave || saving} className="bg-brand text-black font-extrabold" onClick={save}>
                {saving ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  resetDraft();
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Existing Banners</span>
              <Button variant="secondary" onClick={load} disabled={loading || saving}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </CardTitle>
            <CardDescription>Click edit to update; delete removes immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length === 0 ? <div className="text-zinc-500 text-sm">No banners yet.</div> : null}
            {rows.map((r) => (
              <div key={r.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-white truncate">{r.title}</div>
                    <div className="text-xs text-zinc-500 truncate">{r.imageUrl}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => edit(r)} disabled={saving}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => remove(r.id)} disabled={saving}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 flex gap-3">
                  <span>order: {r.sortOrder}</span>
                  <span>{r.isActive ? "active" : "inactive"}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
