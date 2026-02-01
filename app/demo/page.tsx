"use client";

import * as React from "react";
import { Plus, Search, Filter, CalendarDays, Users, Building2, Clock3 } from "lucide-react";

type Site = "RoiEt DC" | "Bangkok HQ" | "Customer A";
type Role = "NOC" | "Helpdesk" | "Field";

type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  site: Site;
  role: Role;
  staff: string;
  status?: "confirmed" | "pending";
};

const SITES: Site[] = ["RoiEt DC", "Bangkok HQ", "Customer A"];
const ROLES: Role[] = ["NOC", "Helpdesk", "Field"];

const seed: Shift[] = [
  { id: "1", date: "2026-02-01", start: "08:00", end: "17:00", site: "RoiEt DC", role: "Helpdesk", staff: "Aom", status: "confirmed" },
  { id: "2", date: "2026-02-01", start: "17:00", end: "08:00", site: "RoiEt DC", role: "NOC", staff: "Boss", status: "pending" },
  { id: "3", date: "2026-02-02", start: "08:00", end: "17:00", site: "Bangkok HQ", role: "Field", staff: "Mook", status: "confirmed" },
  { id: "4", date: "2026-02-03", start: "08:00", end: "17:00", site: "Customer A", role: "NOC", staff: "Ton", status: "confirmed" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateLabel(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("th-TH", { weekday: "short", month: "short", day: "2-digit" });
}

function addDays(yyyyMmDd: string, days: number) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function todayISO() {
  // Demo: fix near user's current date (Jan 31, 2026). You can replace with real "today".
  return "2026-01-31";
}

function timeRange(start: string, end: string) {
  return `${start}–${end}`;
}

function Badge({ variant, children }: { variant: "solid" | "subtle"; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        variant === "solid"
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200"
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status?: Shift["status"] }) {
  if (!status) return null;
  const isOk = status === "confirmed";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset",
        isOk
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-amber-200"
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", isOk ? "bg-emerald-500" : "bg-amber-500")} />
      {isOk ? "Confirmed" : "Pending"}
    </span>
  );
}

function Drawer({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (shift: Omit<Shift, "id">) => void;
}) {
  const [date, setDate] = React.useState(addDays(todayISO(), 1));
  const [site, setSite] = React.useState<Site>("RoiEt DC");
  const [role, setRole] = React.useState<Role>("Helpdesk");
  const [start, setStart] = React.useState("08:00");
  const [end, setEnd] = React.useState("17:00");
  const [staff, setStaff] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setDate(addDays(todayISO(), 1));
    setSite("RoiEt DC");
    setRole("Helpdesk");
    setStart("08:00");
    setEnd("17:00");
    setStaff("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close overlay"
      />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <div className="text-sm text-zinc-500">Create shift</div>
            <div className="text-lg font-semibold text-zinc-900">Add assignment</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-xs text-zinc-500">Date</div>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs text-zinc-500">Site</div>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as Site)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                {SITES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-xs text-zinc-500">Role</div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-xs text-zinc-500">Staff</div>
              <input
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                placeholder="e.g. Leon"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-xs text-zinc-500">Start</div>
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                type="time"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs text-zinc-500">End</div>
              <input
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                type="time"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (!staff.trim()) return;
                onCreate({ date, site, role, start, end, staff: staff.trim(), status: "pending" });
                onClose();
              }}
              className={cx(
                "w-full rounded-2xl px-4 py-3 text-sm font-medium",
                staff.trim()
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              )}
            >
              Create shift
            </button>
            {!staff.trim() && <div className="mt-2 text-xs text-zinc-500">Enter staff name to enable.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoSchedulePage() {
  const [shifts, setShifts] = React.useState<Shift[]>(seed);

  const [site, setSite] = React.useState<Site | "All">("All");
  const [role, setRole] = React.useState<Role | "All">("All");
  const [q, setQ] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const start = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const filtered = React.useMemo(() => {
    return shifts.filter((s) => {
      if (site !== "All" && s.site !== site) return false;
      if (role !== "All" && s.role !== role) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        const hay = `${s.staff} ${s.site} ${s.role} ${s.date} ${s.start} ${s.end}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [shifts, site, role, q]);

  const counts = React.useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const d of days) byDay[d] = 0;
    for (const s of filtered) if (byDay[s.date] !== undefined) byDay[s.date] += 1;
    return byDay;
  }, [filtered, days]);

  const upcoming = React.useMemo(() => {
    // naive sort by date/start
    return [...filtered]
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
      .slice(0, 6);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* top bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-900 text-white">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-zinc-500">Demo</div>
              <div className="text-lg font-semibold text-zinc-900">Onsite Shift Scheduler</div>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Create shift
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {/* filters */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <Filter className="h-4 w-4 text-zinc-500" />
                  Filters
                  <span className="ml-1 text-xs text-zinc-500">({filtered.length} shifts)</span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search staff / site / role…"
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-900 sm:w-[260px]"
                    />
                  </div>

                  <select
                    value={site}
                    onChange={(e) => setSite(e.target.value as any)}
                    className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  >
                    <option value="All">All sites</option>
                    {SITES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  >
                    <option value="All">All roles</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* quick stats */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">This week</div>
                    <Badge variant="subtle">7 days</Badge>
                  </div>
                  <div className="mt-1 text-xl font-semibold text-zinc-900">{filtered.length}</div>
                  <div className="text-xs text-zinc-500">assigned shifts (filtered)</div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">Sites</div>
                    <Building2 className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="mt-1 text-xl font-semibold text-zinc-900">
                    {site === "All" ? SITES.length : 1}
                  </div>
                  <div className="text-xs text-zinc-500">{site === "All" ? "available" : "selected"}</div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">Roles</div>
                    <Users className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="mt-1 text-xl font-semibold text-zinc-900">
                    {role === "All" ? ROLES.length : 1}
                  </div>
                  <div className="text-xs text-zinc-500">{role === "All" ? "available" : "selected"}</div>
                </div>
              </div>
            </div>

            {/* board */}
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-500">Schedule board</div>
                  <div className="text-base font-semibold text-zinc-900">Next 7 days</div>
                </div>
                <div className="text-xs text-zinc-500">Start: {start}</div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-7">
                {days.map((d) => {
                  const list = filtered
                    .filter((s) => s.date === d)
                    .sort((a, b) => a.start.localeCompare(b.start));

                  return (
                    <div key={d} className="rounded-2xl bg-zinc-50 p-2 ring-1 ring-inset ring-zinc-200">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-xs font-medium text-zinc-900">{formatDateLabel(d)}</div>
                        <Badge variant="subtle">{counts[d] ?? 0}</Badge>
                      </div>

                      <div className="mt-2 space-y-2">
                        {list.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-2 py-6 text-center text-xs text-zinc-400">
                            No shifts
                          </div>
                        ) : (
                          list.map((s) => (
                            <div
                              key={s.id}
                              className="rounded-xl bg-white p-2 ring-1 ring-inset ring-zinc-200 hover:ring-zinc-300"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-zinc-900">{s.staff}</div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="h-3.5 w-3.5 text-zinc-400" />
                                      {timeRange(s.start, s.end)}
                                    </span>
                                    <span className="text-zinc-300">•</span>
                                    <span className="truncate">{s.site}</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <StatusPill status={s.status} />
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <Badge variant="subtle">{s.role}</Badge>
                                <button
                                  onClick={() => setShifts((prev) => prev.filter((x) => x.id !== s.id))}
                                  className="text-xs text-zinc-500 hover:text-zinc-900"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* right rail */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-500">Preview</div>
              <div className="text-base font-semibold text-zinc-900">Upcoming shifts</div>

              <div className="mt-4 space-y-2">
                {upcoming.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">{s.staff}</div>
                        <div className="mt-0.5 text-xs text-zinc-600">
                          {s.date} • {timeRange(s.start, s.end)}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">
                          {s.site} • <span className="font-medium">{s.role}</span>
                        </div>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-3 py-8 text-center text-sm text-zinc-500">
                    Nothing to show
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-900 p-4 text-white">
                <div className="text-xs text-white/70">Next step (MVP)</div>
                <div className="mt-1 text-sm font-semibold">Add rules & conflicts</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/80">
                  <li>Overlap detection</li>
                  <li>Coverage per site/role</li>
                  <li>Request swap & approvals</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-500">Tips</div>
              <div className="text-base font-semibold text-zinc-900">Make it feel premium</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  ใช้ rounded-2xl/3xl + ring บางๆ จะดู “Modern Minimal” ทันที
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  ให้ทุก action สำคัญอยู่ top-right (Create/Export)
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  ทำ “status pill” เพื่อให้ผู้ใช้มั่นใจว่าข้อมูลเชื่อถือได้
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={(shift) =>
          setShifts((prev) => [{ id: String(Date.now()), ...shift }, ...prev])
        }
      />
    </div>
  );
}

