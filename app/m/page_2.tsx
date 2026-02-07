// app/m/page.tsx
"use client";

import * as React from "react";
import { CenterModal } from "./components/center-modal";
import { ShiftCard, ShiftCardRow } from "./components/shift-card";
import { isOT, roundEmoji } from "./components/shift-icons";
import { monthFromOffset, WardCalendar } from "./components/ward-calendar";
import { ShiftDetailView } from "./components/shift-detail-view";
import { formatDateTH, timeRange } from "./components/shift-utils";

type ViewMode = "my" | "ward";
type NavKey = "home" | "alerts" | "me";

type MeResponse = {
  staff: { id: string; org_id: string; display_name: string };
  wards: Array<{ ward_id: string; ward_name?: string | null; primary_ward: boolean | null }>;
};

type ShiftRow = ShiftCardRow & {
  role_in_shift: string | null;
  risk_flag: boolean | null;
  changed_at?: string | null;
  staff_id?: string | null;
};

type WardMonthPayload = {
  ward_id: string;
  month: string; // yyyy-mm
  days: Array<{ date: string; count: number }>;
  shifts: ShiftRow[];
  ward_view_limited: boolean;
};

type WardMonthResponse = { data: WardMonthPayload };

export type ShiftDetailResponse = {
  data: {
    shift_instance_id: string;
    ward_id: string;
    shift_date: string;
    shift_code: string | null;
    shift_name: string | null;
    start_time: string | null;
    end_time: string | null;
    cross_midnight: boolean | null;
    note: string | null;
    changed_after_final: boolean | null;
    coworkers: Array<{
      staff_id: string;
      display_name: string | null;
      position: string | null;
      role_in_shift: string | null;
    }>;
    coworker_limited: boolean;
  };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function todayISO() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function StatusBadge({ risk }: { risk: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-inset",
        risk ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {risk ? "⚠️ Risk" : "OK"}
    </span>
  );
}

/** ✅ Slot สูงเท่ากัน: My(Announcement) = Ward(Month nav) */
function SlotRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 min-h-[48px]">{children}</div>;
}

/** ===== Minimal icons (ไม่พึ่ง lucide-react) ===== */
function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-6 w-6", active ? "opacity-100" : "opacity-70")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" />
    </svg>
  );
}
function IconBell({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-6 w-6", active ? "opacity-100" : "opacity-70")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z" />
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
    </svg>
  );
}
function IconUser({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-6 w-6", active ? "opacity-100" : "opacity-70")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 1 0-16 0" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    </svg>
  );
}
function IconLogout({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-6 w-6", active ? "opacity-100" : "opacity-70")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l1 1H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6l-1 1" />
      <path d="M15 12H7" />
      <path d="M15 12l-2-2" />
      <path d="M15 12l-2 2" />
      <path d="M21 12h-6" />
    </svg>
  );
}
function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-6 w-6", spinning ? "animate-spin" : "")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}

/** ===== Announcement (My) ===== */
type Announcement = {
  title: string;
  subtitle?: string;
  body: string;
  meta?: string;
};

function SponsoredAnnouncementRow({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex min-h-[48px] w-full items-center justify-between rounded-2xl bg-white px-4 py-2.5 ring-1 ring-inset ring-slate-200">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base" aria-hidden>
          📣
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">Sponsored / Announcement</div>
          <div className="truncate text-xs text-slate-500">ประกาศสำคัญสำหรับวันนี้</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
      >
        ดู
      </button>
    </div>
  );
}

export default function MobileStaffPage() {
  const [mode, setMode] = React.useState<ViewMode>("my");
  const [activeNav, setActiveNav] = React.useState<NavKey>("home");

  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [wardId, setWardId] = React.useState<string | null>(null);

  // My shifts
  const MY_TTL_MS = 2 * 60 * 1000; // 2 นาที (ประหยัด + สดพอ)
  const [myRows, setMyRows] = React.useState<ShiftRow[]>([]);
  const [myLoading, setMyLoading] = React.useState(true);
  const myTsRef = React.useRef<number>(0);

  // Ward
  const WARD_TTL_MS = 10 * 60 * 1000; // 10 นาที
  type WardCacheEntry = { data: WardMonthPayload; ts: number; etag?: string | null; lastModified?: string | null };
  const [wardCache, setWardCache] = React.useState<Record<string, WardCacheEntry>>({});
  const inFlightRef = React.useRef<Record<string, boolean>>({});

  const [wardLoading, setWardLoading] = React.useState(false);
  const [wardMonth, setWardMonth] = React.useState<{
    month: string;
    year: number;
    monthIndex: number;
    shifts: ShiftRow[];
    ward_view_limited: boolean;
  } | null>(null);

  const [monthOffset, setMonthOffset] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const [err, setErr] = React.useState<string | null>(null);

  // Global refreshing (button + visibility refresh)
  const [refreshing, setRefreshing] = React.useState(false);

  // Shift modal
  const [activeShiftId, setActiveShiftId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<ShiftDetailResponse["data"] | null>(null);
  const [detailErr, setDetailErr] = React.useState<string | null>(null);

  // Announcement modal
  const [annOpen, setAnnOpen] = React.useState(false);
  const [announcement] = React.useState<Announcement>({
    title: "ประกาศจากหัวหน้าวอร์ด",
    subtitle: "โปรดอ่านก่อนเริ่มกะ",
    body:
      "• วันนี้มีการปรับแนวทางรับผู้ป่วยใหม่ช่วงเช้า\n" +
      "• ขอให้ตรวจสอบอุปกรณ์เวชภัณฑ์ในจุดประจำก่อนขึ้นเวร\n" +
      "• หากมีความเสี่ยง/เวรชน ให้แจ้ง Scheduler ทันที",
    meta: "Updated: วันนี้ 07:30",
  });

  // Logout confirm modal
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false);

  const wardNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const w of me?.wards ?? []) map[w.ward_id] = w.ward_name ?? w.ward_id.slice(0, 8);
    return map;
  }, [me]);

  function isWardExpired(entry?: WardCacheEntry) {
    if (!entry) return true;
    return Date.now() - entry.ts > WARD_TTL_MS;
  }

  // Load /me once
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        const data = await fetchJSON<MeResponse>("/api/m/me");
        if (cancelled) return;
        setMe(data);
        const primary = data.wards.find((w) => w.primary_ward) ?? data.wards[0];
        setWardId(primary?.ward_id ?? null);
      } catch {
        if (!cancelled) setErr("โหลดข้อมูลผู้ใช้ไม่สำเร็จ (อาจยังไม่ login หรือยังไม่มี staff record)");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** ✅ My shifts fetch (TTL-aware) */
  const loadMyShifts = React.useCallback(
    async (force = false) => {
      if (!me) return;
      if (!force && Date.now() - myTsRef.current <= MY_TTL_MS && myRows.length > 0) return;

      setMyLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("from", todayISO());
        qs.set("limit", "14");
        const out = await fetchJSON<{ data: ShiftRow[] }>(`/api/m/shifts?${qs.toString()}`);
        setMyRows((out.data ?? []).map((r) => ({ ...r, ward_name: wardNameById[r.ward_id] ?? null })));
        myTsRef.current = Date.now();
      } catch {
        setErr("โหลดตารางเวรไม่สำเร็จ (เช็ค API / RLS / mapping staff.user_id)");
      } finally {
        setMyLoading(false);
      }
    },
    [me, myRows.length, wardNameById]
  );

  // Initial My load
  React.useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadMyShifts(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [me, loadMyShifts]);

  /** ✅ Ward month fetch: Conditional GET (ETag/Last-Modified) + 304 */
  const fetchWardMonthConditional = React.useCallback(
    async (targetWardId: string, month: string, force = false) => {
      const key = `${targetWardId}_${month}`;
      const existing = wardCache[key];

      // TTL ยังไม่หมด + ไม่ force -> ใช้ cache
      if (!force && existing && !isWardExpired(existing)) return;

      // กันยิงซ้ำ
      if (inFlightRef.current[key]) return;
      inFlightRef.current[key] = true;

      try {
        const qs = new URLSearchParams();
        qs.set("wardId", targetWardId);
        qs.set("month", month);

        const headers: Record<string, string> = {};
        if (!force && existing?.etag) headers["If-None-Match"] = existing.etag;
        if (!force && existing?.lastModified) headers["If-Modified-Since"] = existing.lastModified;

        const res = await fetch(`/api/m/ward-shifts?${qs.toString()}`, {
          credentials: "include",
          headers,
        });

        // 304 = ไม่เปลี่ยน -> อัปเดต ts อย่างเดียว (ประหยัดสุด)
        if (res.status === 304) {
          if (existing) {
            setWardCache((prev) => ({
              ...prev,
              [key]: { ...existing, ts: Date.now() },
            }));
          }
          return;
        }

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Request failed: ${res.status}`);
        }

        const out = (await res.json()) as WardMonthResponse;

        const etag = res.headers.get("ETag");
        const lastModified = res.headers.get("Last-Modified");

        setWardCache((prev) => ({
          ...prev,
          [key]: { data: out.data, ts: Date.now(), etag, lastModified },
        }));
      } catch {
        // เงียบไว้ก่อนเพื่อไม่ทำ UX พัง (แต่ถ้าต้องการโชว์ error ค่อยเปิด)
      } finally {
        inFlightRef.current[key] = false;
      }
    },
    [wardCache]
  );

  /** ✅ Prefetch: prev/current/next (อุ่นเครื่องให้สลับโหมดไว) */
  React.useEffect(() => {
    if (!me || !wardId) return;
    const m0 = monthFromOffset(0).month;
    const mPrev = monthFromOffset(-1).month;
    const mNext = monthFromOffset(1).month;
    void fetchWardMonthConditional(wardId, mPrev, false);
    void fetchWardMonthConditional(wardId, m0, false);
    void fetchWardMonthConditional(wardId, mNext, false);
  }, [me, wardId, fetchWardMonthConditional]);

  /** ✅ เมื่อ monthOffset เปลี่ยน -> prefetch เดือนนั้น (แต่ไม่บังคับ) */
  React.useEffect(() => {
    if (!me || !wardId) return;
    const { month } = monthFromOffset(monthOffset);
    void fetchWardMonthConditional(wardId, month, false);
  }, [me, wardId, monthOffset, fetchWardMonthConditional]);

  /** ✅ Sync wardMonth จาก cache (ทันทีที่มี) */
  React.useEffect(() => {
    if (!me || !wardId) return;

    const { month, year, monthIndex } = monthFromOffset(monthOffset);
    const key = `${wardId}_${month}`;
    const cached = wardCache[key];

    if (cached && cached.data) {
      const payload = cached.data;
      setWardMonth({
        month: payload.month,
        year,
        monthIndex,
        shifts: (payload.shifts ?? []).map((s) => ({ ...s, ward_name: wardNameById[s.ward_id] ?? null })),
        ward_view_limited: payload.ward_view_limited,
      });
      return;
    }

    // ถ้าเข้าหน้า ward แล้ว cache ยังไม่มา ค่อยแสดง loading แบบเบาๆ
    if (mode === "ward") {
      setWardLoading(true);
      (async () => {
        try {
          await fetchWardMonthConditional(wardId, month, false);
        } finally {
          setWardLoading(false);
        }
      })();
    }
  }, [me, wardId, monthOffset, wardCache, wardNameById, mode, fetchWardMonthConditional]);

  // ========= Ward: marks เฉพาะ “คนที่ login” =========
  const myWardMarks = React.useMemo(() => {
    if (!wardMonth || !me) return [];
    const map: Record<string, number> = {};
    const myId = me.staff.id;

    for (const s of wardMonth.shifts ?? []) {
      const sid = (s as any).staff_id ?? null;
      const d = String((s as any).shift_date ?? "");
      if (!d) continue;
      if (sid !== myId) continue;
      map[d] = (map[d] ?? 0) + 1;
    }

    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [wardMonth, me]);

  // Set selectedDate default เมื่อ wardMonth มาแล้ว
  React.useEffect(() => {
    if (!wardMonth) return;

    const t = todayISO();
    const inMonth = t.startsWith(wardMonth.month + "-");
    const hasToday = myWardMarks.some((x) => x.date === t);

    if (inMonth && hasToday) setSelectedDate(t);
    else if (myWardMarks.length > 0) setSelectedDate(myWardMarks[0].date);
    else setSelectedDate(null);
  }, [wardMonth, myWardMarks]);

  // Ward: รายการใต้ Calendar = เฉพาะเวร “คนที่ login” ในวันนั้น
  const wardDayShifts = React.useMemo(() => {
    if (!wardMonth || !selectedDate || !me) return [];
    const myId = me.staff.id;

    return (wardMonth.shifts ?? [])
      .filter((s) => {
        const sid = (s as any).staff_id ?? null;
        const d = String((s as any).shift_date ?? "");
        return d === selectedDate && sid === myId;
      })
      .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
  }, [wardMonth, selectedDate, me]);

  const sortedMy = React.useMemo(() => {
    return [...myRows].sort(
      (a, b) => a.shift_date.localeCompare(b.shift_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")
    );
  }, [myRows]);

  const todayRow = React.useMemo(() => {
    const t = todayISO();
    const candidates = sortedMy.filter((r) => r.shift_date === t);
    if (candidates.length === 0) return null;
    return candidates[0];
  }, [sortedMy]);

  const next14 = React.useMemo(() => {
    const t = todayISO();
    return sortedMy.filter((r) => r.shift_date !== t).slice(0, 14);
  }, [sortedMy]);

  async function openShift(id?: string | null) {
    if (!id) return;

    setActiveShiftId(id);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setDetailErr(null);

    try {
      const out = await fetchJSON<ShiftDetailResponse>(`/api/m/shifts/${id}`);
      setDetail(out.data);
    } catch {
      setDetail(null);
      setDetailErr("โหลดรายละเอียดกะไม่สำเร็จ");
    } finally {
      setDetailLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  /** ✅ Refresh เฉพาะสิ่งที่กำลังดู (force) */
  const refreshVisibleForce = React.useCallback(async () => {
    if (!me || !wardId) return;
    if (refreshing) return;

    setRefreshing(true);
    try {
      if (mode === "my") {
        await loadMyShifts(true);
      } else {
        const mCur = monthFromOffset(monthOffset).month;
        await fetchWardMonthConditional(wardId, mCur, true);
      }
    } finally {
      setRefreshing(false);
    }
  }, [me, wardId, mode, monthOffset, refreshing, loadMyShifts, fetchWardMonthConditional]);

  /** ✅ Refresh ตอนกลับมาอยู่หน้าจอ: เช็ค TTL ก่อน (ประหยัดสุด) + กันยิงซ้ำ */
  const lastVisibleRef = React.useRef<number>(0);
  const refreshOnVisibleIfNeeded = React.useCallback(async () => {
    if (!me || !wardId) return;

    // กันเด้งรัว (เช่น WebView trigger แปลกๆ)
    const now = Date.now();
    if (now - lastVisibleRef.current < 30_000) return; // 30s throttle
    lastVisibleRef.current = now;

    // ไม่ force: จะได้ 304 หรือใช้ cache ถ้ายังสด
    if (mode === "my") {
      await loadMyShifts(false);
    } else {
      const mCur = monthFromOffset(monthOffset).month;
      await fetchWardMonthConditional(wardId, mCur, false);
    }
  }, [me, wardId, mode, monthOffset, loadMyShifts, fetchWardMonthConditional]);

  React.useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshOnVisibleIfNeeded();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshOnVisibleIfNeeded]);

  // Bottom nav style
  const navBtn = (key: NavKey) =>
    cx(
      "flex h-12 items-center justify-center transition",
      activeNav === key
        ? "text-white drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]"
        : "text-slate-400 hover:text-slate-200"
    );

  const staffName = me?.staff.display_name ?? "—";
  const multiWard = (me?.wards ?? []).length > 1;

  return (
    <div className="bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex-none border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Staff</div>
                <div className="text-lg font-semibold text-slate-900">{mode === "my" ? "My" : "Ward"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Logged in</div>
                <div className="text-sm font-medium text-slate-900">{staffName}</div>
              </div>
            </div>

            {/* Toggle */}
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setMode("my")}
                className={cx(
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                  mode === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                )}
              >
                👤 My
              </button>
              <button
                onClick={() => setMode("ward")}
                className={cx(
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold",
                  mode === "ward" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                )}
              >
                🏥 Ward
              </button>
            </div>

            {/* Ward selector */}
            {mode === "ward" && multiWard ? (
              <div className="mt-3">
                <div className="text-xs text-slate-500">เลือกวอร์ด</div>
                <select
                  value={wardId ?? ""}
                  onChange={(e) => setWardId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(me?.wards ?? []).map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>
                      {w.ward_name ?? `Ward ${w.ward_id.slice(0, 8)}`}
                      {w.primary_ward ? " • ⭐" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Unified height slot */}
            <SlotRow>
              {mode === "ward" ? (
                wardId ? (
                  <div className="flex min-h-[48px] w-full items-center justify-between">
                    <button
                      onClick={() => setMonthOffset((v) => Math.max(-1, v - 1))}
                      disabled={monthOffset <= -1}
                      className={cx(
                        "rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 ring-inset",
                        monthOffset <= -1
                          ? "bg-slate-100 text-slate-400 ring-slate-200"
                          : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      ◀
                    </button>
                    <div className="text-sm font-semibold text-slate-900">
                      {wardMonth?.month ?? monthFromOffset(monthOffset).month}
                    </div>
                    <button
                      onClick={() => setMonthOffset((v) => Math.min(1, v + 1))}
                      disabled={monthOffset >= 1}
                      className={cx(
                        "rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 ring-inset",
                        monthOffset >= 1
                          ? "bg-slate-100 text-slate-400 ring-slate-200"
                          : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      ▶
                    </button>
                  </div>
                ) : (
                  <div className="min-h-[48px] w-full rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200" />
                )
              ) : (
                <SponsoredAnnouncementRow onOpen={() => setAnnOpen(true)} />
              )}
            </SlotRow>

            {err ? (
              <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {err}
              </div>
            ) : null}
          </div>
        </div>

        {/* My: Today card */}
        {mode === "my" ? (
          <div className="flex-none bg-background">
            <div className="space-y-3 px-5 py-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 h-1 w-14 rounded-full bg-primary/20" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Today</div>
                    <div className="text-base font-semibold text-slate-900">
                      {todayRow ? `${todayRow.shift_name ?? "Shift"} • ${formatDateTH(todayRow.shift_date)}` : "No shift today"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {todayRow ? timeRange(todayRow.start_time, todayRow.end_time, todayRow.cross_midnight) : "—"}
                    </div>
                    {todayRow ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg" aria-hidden>
                          {isOT(todayRow.shift_code) ? "🕒" : roundEmoji(todayRow.shift_code)}
                        </span>
                        {isOT(todayRow.shift_code) ? <span className="text-xs text-slate-500">OT</span> : null}
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge risk={Boolean(todayRow?.risk_flag)} />
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => openShift(todayRow?.shift_instance_id)}
                    className={cx(
                      "w-full rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ring-inset transition",
                      todayRow
                        ? "bg-primary-soft text-slate-900 ring-primary/20 hover:bg-primary-soft/80"
                        : "bg-slate-100 text-slate-400 ring-slate-200"
                    )}
                    disabled={!todayRow}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main (ward ต้องเป็น flex+min-h-0 เพื่อให้ list scroll ได้จริง) */}
        <main
          className={cx(
            "flex-1 [-webkit-overflow-scrolling:touch]",
            mode === "ward" ? "flex flex-col overflow-hidden" : "overflow-y-auto"
          )}
        >
          <div className={cx("px-5 py-5", mode === "ward" ? "flex-1 min-h-0" : "")}>
            {mode === "my" ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Next</div>
                    <div className="text-base font-semibold text-slate-900">Next 14 Shifts</div>
                  </div>
                  <div className="text-xs text-slate-500">scroll ได้</div>
                </div>

                {myLoading ? (
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Loading...
                  </div>
                ) : next14.length === 0 ? (
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    ยังไม่มีเวรถัดไป
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {next14.map((r) => (
                      <ShiftCard
                        key={r.shift_instance_id}
                        row={{ ...r, ward_name: wardNameById[r.ward_id] ?? null }}
                        highlight
                        onClick={() => openShift(r.shift_instance_id)}
                        rightBadges={<StatusBadge risk={Boolean(r.risk_flag)} />}
                      />
                    ))}
                  </div>
                )}

                <div style={{ height: "calc(92px + env(safe-area-inset-bottom))" }} />
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col space-y-3">
                {wardLoading ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Loading...
                  </div>
                ) : !wardMonth ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    ยังไม่มีข้อมูลวอร์ด
                  </div>
                ) : (
                  <>
                    <WardCalendar
                      year={wardMonth.year}
                      monthIndex={wardMonth.monthIndex}
                      marks={myWardMarks}
                      selectedDate={selectedDate}
                      onSelectDate={(d) => setSelectedDate(d)}
                    />

                    {/* List scroll area */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-500">My shifts</div>
                          <div className="text-base font-semibold text-slate-900">
                            {selectedDate ? formatDateTH(selectedDate) : "เลือกวันที่"}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {selectedDate ? (wardDayShifts.length > 0 ? `${wardDayShifts.length} รายการ` : "0 รายการ") : "—"}
                        </div>
                      </div>

                      {!selectedDate ? (
                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                          แตะวันที่ในปฏิทินเพื่อดูเวรของคุณ
                        </div>
                      ) : wardDayShifts.length === 0 ? (
                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                          ไม่มีเวรของคุณในวันนี้
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {wardDayShifts.map((r) => (
                            <ShiftCard
                              key={`${r.shift_instance_id}-${(r as any).staff_id ?? "me"}`}
                              row={{ ...r, ward_name: wardNameById[r.ward_id] ?? null }}
                              highlight
                              onClick={() => openShift(r.shift_instance_id)}
                              rightBadges={<StatusBadge risk={Boolean(r.risk_flag)} />}
                            />
                          ))}
                        </div>
                      )}

                      <div style={{ height: "calc(92px + env(safe-area-inset-bottom))" }} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Bottom nav: dark bar + glow active + Refresh */}
        <div className="flex-none bg-slate-900" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="grid grid-cols-5 gap-2 px-5 py-3">
            <button aria-label="Home" className={navBtn("home")} onClick={() => setActiveNav("home")}>
              <IconHome active={activeNav === "home"} />
            </button>

            <button
              aria-label="Refresh"
              className={cx(
                "flex h-12 items-center justify-center transition",
                refreshing ? "text-white opacity-90" : "text-slate-400 hover:text-slate-200",
                "hover:drop-shadow-[0_0_12px_rgba(34,197,94,0.45)]"
              )}
              onClick={() => void refreshVisibleForce()}
              disabled={refreshing}
            >
              <IconRefresh spinning={refreshing} />
            </button>

            <button
              aria-label="Alerts"
              className={navBtn("alerts")}
              onClick={() => {
                setActiveNav("alerts");
                alert("Demo: Alerts");
              }}
            >
              <IconBell active={activeNav === "alerts"} />
            </button>

            <button
              aria-label="Me"
              className={navBtn("me")}
              onClick={() => {
                setActiveNav("me");
                alert("Demo: Me");
              }}
            >
              <IconUser active={activeNav === "me"} />
            </button>

            <button
              aria-label="Logout"
              className={cx(
                "flex h-12 items-center justify-center transition",
                "text-slate-400 hover:text-rose-400",
                "hover:drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]"
              )}
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <IconLogout active={false} />
            </button>
          </div>
        </div>

        {/* Shift detail modal */}
        <CenterModal
          open={detailOpen}
          title="Shift details"
          onClose={() => {
            setDetailOpen(false);
            setActiveShiftId(null);
            setDetail(null);
            setDetailErr(null);
          }}
        >
          {detailLoading ? (
            <div className="text-sm text-slate-600">Loading...</div>
          ) : detailErr ? (
            <div className="text-sm text-rose-700">{detailErr}</div>
          ) : !detail ? (
            <div className="text-sm text-slate-600">No data</div>
          ) : (
            <ShiftDetailView detail={detail} />
          )}
        </CenterModal>

        {/* Announcement modal */}
        <CenterModal open={annOpen} title="Announcement" onClose={() => setAnnOpen(false)}>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide text-slate-500">SPONSORED / ANNOUNCEMENT</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{announcement.title}</div>
                {announcement.subtitle ? <div className="mt-1 text-sm text-slate-600">{announcement.subtitle}</div> : null}
              </div>
              <div className="rounded-2xl bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                📣
              </div>
            </div>

            {announcement.meta ? <div className="mt-3 text-xs text-slate-500">{announcement.meta}</div> : null}
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{announcement.body}</div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                onClick={() => setAnnOpen(false)}
              >
                ปิด
              </button>
              <button
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(99,102,241,0.25)] hover:opacity-95"
                onClick={() => alert("Demo: Open full announcement / link")}
              >
                รายละเอียด
              </button>
            </div>
          </div>
        </CenterModal>

        {/* Logout confirm modal */}
        <CenterModal open={logoutConfirmOpen} title="Confirm logout" onClose={() => setLogoutConfirmOpen(false)}>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-600">ต้องการออกจากระบบใช่ไหม?</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                onClick={() => void logout()}
              >
                Logout
              </button>
            </div>
          </div>
        </CenterModal>
      </div>
    </div>
  );
}
