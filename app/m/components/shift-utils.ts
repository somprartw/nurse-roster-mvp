// app/m/components/shift-utils.ts
export function formatDateTH(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("th-TH", { weekday: "short", day: "2-digit", month: "short" });
}

function hhmm(t: string | null) {
  if (!t) return "--:--";
  return t.slice(0, 5);
}

export function timeRange(start: string | null, end: string | null, crossMidnight?: boolean | null) {
  const s = hhmm(start);
  const e = hhmm(end);
  return crossMidnight ? `${s}–${e} (+1)` : `${s}–${e}`;
}

export function positionLabel(pos?: string | null) {
  const p = String(pos ?? "");
  const map: Record<string, string> = {
    junior: "Junior",
    senior: "Senior",
    nurse_aid: "Aide",
    head: "Head",
  };
  return map[p] ?? (pos ?? "—");
}

export function roleLabel(role?: string | null) {
  const r = String(role ?? "");
  const map: Record<string, string> = {
    junior: "Junior",
    senior: "Senior",
    nurse_aid: "Aide",
    admin: "Admin",
  };
  return map[r] ?? (role ?? "—");
}
