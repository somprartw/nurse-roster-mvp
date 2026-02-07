"use client";

import * as React from "react";
import { isOT, OTBadge, ShiftRound } from "./shift-icons";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ShiftCardRow = {
  shift_instance_id: string;
  shift_date: string; // YYYY-MM-DD
  ward_id: string;
  ward_name?: string | null;
  shift_code: ShiftRound;
  shift_name: string | null;
  start_time: string | null;
  end_time: string | null;
  cross_midnight: boolean | null;
  changed_after_final?: boolean | null;
  note?: string | null;
};

// ---------- time helpers (robust) ----------
export function hhmm(t: string | null) {
  if (!t) return "--:--";
  // รองรับ "07:00:00", "7:00", "07:00"
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return "--:--";
  const hh = String(m[1]).padStart(2, "0");
  const mm = m[2];
  return `${hh}:${mm}`;
}

function toMinutes(t: string | null): number | null {
  const m = String(t ?? "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export function timeRange(start: string | null, end: string | null, crossMidnight?: boolean | null) {
  const s = hhmm(start);
  const e = hhmm(end);
  return crossMidnight ? `${s}–${e} (+1)` : `${s}–${e}`;
}

export function formatDateTH(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => Number(n));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("th-TH", { weekday: "short", day: "2-digit", month: "short" });
}

export type ShiftKind = "morning" | "afternoon" | "night";

export function getShiftKind(row: ShiftCardRow): ShiftKind {
  const code = String(row.shift_code ?? "").toLowerCase();
  const name = String(row.shift_name ?? "").toLowerCase();

  // 1) ให้ชื่อเวรเป็นตัวชี้ขาดก่อน (แม่นสุด)
  if (name.includes("ดึก") || name.includes("night")) return "night";
  if (name.includes("บ่าย") || name.includes("เย็น") || name.includes("pm") || name.includes("evening"))
    return "afternoon";
  if (name.includes("เช้า") || name.includes("am") || name.includes("morning")) return "morning";

  // 2) แล้วค่อยดู code (รองรับ M/A/N + E)
  if (code.includes("n") || code.includes("night")) return "night";
  if (code.includes("a") || code.includes("pm") || code.includes("e") || code.includes("evening"))
    return "afternoon";
  if (code.includes("m") || code.includes("am")) return "morning";

  // 3) สุดท้ายดู start_time แบบแปลงเป็นนาที (กันพังเคส 07:00 / 7:00:00)
  const mins = toMinutes(row.start_time);
  if (mins == null) return "night";

  // morning = 04:00–11:59, afternoon = 12:00–19:59, night = ที่เหลือ
  if (mins >= 4 * 60 && mins < 12 * 60) return "morning";
  if (mins >= 12 * 60 && mins < 20 * 60) return "afternoon";
  return "night";
}

export function kindLabel(k: ShiftKind) {
  return k === "morning" ? "เช้า" : k === "afternoon" ? "บ่าย" : "ดึก";
}

// ✅ emoji ตามนิยามของคุณ
export function kindEmoji(k: ShiftKind) {
  return k === "morning" ? "😎" : k === "afternoon" ? "☕️" : "🌙";
}

/**
 * ✅ Small Card background ให้โทนเดียวกับภาพจริง (Today Card)
 * - เบาเครื่อง (no image)
 * - ไม่แย่ง focus (low contrast, soft)
 */
export function smallCardBg(kind: ShiftKind) {
  if (kind === "morning") {
    return cx(
      "bg-[linear-gradient(135deg,#EAF4FF_0%,#FFFFFF_55%)]",
      "after:bg-[radial-gradient(120%_90%_at_80%_40%,rgba(120,180,255,.18)_0%,rgba(255,255,255,0)_60%)]"
    );
  }

  if (kind === "afternoon") {
    return cx(
      "bg-[linear-gradient(135deg,#FFF1DC_0%,#FFFFFF_55%)]",
      "after:bg-[radial-gradient(120%_90%_at_80%_40%,rgba(255,180,120,.20)_0%,rgba(255,255,255,0)_60%)]"
    );
  }
/*
  return cx(
    // ยก mid-tone + ใส่ horizon glow
    "bg-[linear-gradient(135deg,#2C3A5A_0%,#24324F_45%,#1E293B_75%)]",
    // glow หลัก (แสงกระจาย)
    "after:bg-[radial-gradient(120%_90%_at_80%_45%,rgba(255,255,255,.14)_0%,rgba(255,255,255,0)_60%)]",
    // glow รองใกล้ horizon (ช่วยให้ไม่อึดอัด)
    "before:bg-[radial-gradient(90%_60%_at_20%_85%,rgba(148,163,184,.18)_0%,rgba(148,163,184,0)_55%)]"
  ); */

return cx(
  // 🌆 Twilight blue — สว่างขึ้นชัดเจน แต่ยังไม่เช้า
  "bg-[linear-gradient(135deg,#4A6FAE_0%,#3E5F93_45%,#344E78_78%)]",

  // ✨ soft sky glow (ฟ้าเย็นแบบยังมีแสง)
  "after:bg-[radial-gradient(120%_90%_at_80%_40%,rgba(219,234,254,.45)_0%,rgba(219,234,254,0)_65%)]",

  // 🌫 subtle horizon haze (เทาฟ้าอ่อน)
  "before:bg-[radial-gradient(90%_60%_at_18%_88%,rgba(226,232,240,.28)_0%,rgba(226,232,240,0)_60%)]"
);



/*
  return cx(
    "bg-[linear-gradient(135deg,#24324F_0%,#1B253A_60%)]",
    "after:bg-[radial-gradient(120%_90%_at_80%_40%,rgba(255,255,255,.10)_0%,rgba(255,255,255,0)_60%)]"
  ); */
}

export function shiftTheme(kind: ShiftKind) {
  if (kind === "morning") {
    return {
      bg: "bg-[linear-gradient(135deg,rgba(224,242,254,1),rgba(255,255,255,1))]",
      pill: "bg-sky-600/10 text-sky-900 ring-1 ring-sky-600/15",
      title: "text-slate-900",
      sub: "text-slate-700",
      meta: "text-slate-500",
      iconWrap: "bg-white/60 ring-1 ring-slate-200/70",
    };
  }
  if (kind === "afternoon") {
    return {
      bg: "bg-[linear-gradient(135deg,rgba(255,237,213,1),rgba(255,255,255,1))]",
      pill: "bg-orange-600/10 text-orange-900 ring-1 ring-orange-600/15",
      title: "text-slate-900",
      sub: "text-slate-700",
      meta: "text-slate-500",
      iconWrap: "bg-white/60 ring-1 ring-slate-200/70",
    };
  }
  return {
    bg: "bg-[linear-gradient(135deg,rgba(30,58,138,.92),rgba(67,56,202,.85))]",
    pill: "bg-white/10 text-white ring-1 ring-white/15",
    title: "text-white",
    sub: "text-white/90",
    meta: "text-white/70",
    iconWrap: "bg-white/10 ring-1 ring-white/15",
  };
}

export function ShiftCard({
  row,
  highlight,
  onClick,
  rightBadges,
  compact,
}: {
  row: ShiftCardRow;
  highlight?: boolean;
  onClick: () => void;
  rightBadges?: React.ReactNode;
  compact?: boolean;
}) {
  const ot = isOT(row.shift_code);

  const kind = getShiftKind(row);
  const t = shiftTheme(kind);

  // ✅ OT = 🕒, non-OT = emoji ตาม kind
  const icon = ot ? "🕒" : kindEmoji(kind);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cx(
          // ✅ ขอบแบบเนียน
          "w-full text-left rounded-[22px] border border-white/40 ring-1 ring-black/5 transition active:scale-[0.995]",
          // ✅ ต้องมี after:* scaffolding เพื่อให้ glow ทำงาน
          "relative overflow-hidden",
          "after:absolute after:inset-0 after:content-[''] after:pointer-events-none after:opacity-100",
          // ✅ เปลี่ยนจาก t.bg -> smallCardBg(kind) ให้โทนเดียวกับภาพจริง
          smallCardBg(kind),
          "px-4 py-3 shadow-[0_6px_16px_rgba(2,6,23,.05)]",
          "min-h-[72px]",
          highlight ? "ring-2 ring-black/10" : ""
        )}
      >
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className={cx("text-sm font-medium leading-none", t.meta)}>{formatDateTH(row.shift_date)}</div>

          {rightBadges ? (
            <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
              {rightBadges}
            </span>
          ) : (
            <span
              className={cx(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                "bg-white/60 ring-1 ring-slate-200/70",
                t.title
              )}
            >
              OK
            </span>
          )}
        </div>

        <div className="relative z-10 mt-2 flex items-baseline gap-2 min-w-0">
          <span className="text-xl leading-none" aria-hidden>
            {icon}
          </span>

          <div className="min-w-0 truncate">
            <span className={cx("text-base font-semibold", t.title)}>{kindLabel(kind)}</span>
            <span className={cx("text-sm font-medium", t.sub)}>
              {" "}
              • {timeRange(row.start_time, row.end_time, row.cross_midnight)}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full rounded-3xl border p-4 text-left shadow-sm transition",
        highlight
          ? "border-slate-200 bg-primary-soft hover:bg-primary-soft/80"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-500">{formatDateTH(row.shift_date)}</div>

          <div className="mt-0.5 truncate text-base font-semibold text-slate-900">
            <span aria-hidden className="mr-2">
              {icon}
            </span>
            {row.shift_name ?? "Shift"}
            <span className="ml-2 text-sm font-medium text-slate-500">
              • {timeRange(row.start_time, row.end_time, row.cross_midnight)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {ot ? <OTBadge /> : null}
            {row.changed_after_final ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700 ring-1 ring-inset ring-rose-200">
                CHANGED
              </span>
            ) : null}
            {row.ward_name ? (
              <span className="text-xs text-slate-500">{row.ward_name}</span>
            ) : (
              <span className="text-xs text-slate-500">Ward {row.ward_id.slice(0, 8)}</span>
            )}
          </div>

          {row.note ? <div className="mt-2 text-xs text-slate-500">Note: {row.note}</div> : null}
        </div>

        <div className="flex flex-col items-end gap-2">{rightBadges}</div>
      </div>
    </button>
  );
}
