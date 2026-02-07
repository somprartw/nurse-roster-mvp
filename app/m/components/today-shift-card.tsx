"use client";

import * as React from "react";
import { isOT, roundEmoji } from "./shift-icons";
import {
  ShiftCardRow,
  ShiftKind,
  cx,
  formatDateTH,
  getShiftKind,
  kindLabel,
  shiftTheme,
  timeRange,
} from "./shift-card";

function skyBg(kind: ShiftKind) {
  return kind === "morning"
    ? "bg-[url('/sky/morning.webp')]"
    : kind === "afternoon"
    ? "bg-[url('/sky/afternoon.webp')]"
    : "bg-[url('/sky/night.webp')]";
}

function skyScrim(kind: ShiftKind) {
  // เช้า/บ่าย: ขาวโปร่งเพื่อให้อ่านง่าย
  if (kind !== "night") {
    return "bg-[linear-gradient(90deg,rgba(255,255,255,.78)_0%,rgba(255,255,255,.30)_55%,rgba(255,255,255,0)_100%)]";
  }
  // ดึก: ดำโปร่งเพื่อคุมคอนทราสต์ (ตัวอักษรสีขาว)
  return "bg-[linear-gradient(90deg,rgba(2,6,23,.50)_0%,rgba(2,6,23,.18)_55%,rgba(2,6,23,0)_100%)]";
}

function graphicLayers(kind: ShiftKind) {
  // glow เบา ๆ เพิ่มมิติ (ยังคุม minimal)
  const glow =
    kind === "morning"
      ? "after:bg-[radial-gradient(120%_90%_at_80%_50%,rgba(56,189,248,.18)_0%,rgba(255,255,255,0)_60%)]"
      : kind === "afternoon"
      ? "after:bg-[radial-gradient(120%_90%_at_80%_50%,rgba(251,146,60,.18)_0%,rgba(255,255,255,0)_60%)]"
      : "after:bg-[radial-gradient(120%_90%_at_80%_50%,rgba(255,255,255,.10)_0%,rgba(255,255,255,0)_60%)]";

  return cx(
    "relative overflow-hidden",
    "after:absolute after:inset-0 after:content-[''] after:pointer-events-none after:opacity-100",
    glow
  );
}

function Illustration({ kind }: { kind: ShiftKind }) {
  const e = kind === "morning" ? "☀️" : kind === "afternoon" ? "🌤️" : "🌙";
  return (
    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-5xl opacity-90 pointer-events-none select-none">
      {e}
    </div>
  );
}

export function TodayShiftCard({
  row,
  onClick,
  rightBadge,
}: {
  row: ShiftCardRow;
  onClick: () => void;
  rightBadge?: React.ReactNode;
}) {
  const kind = getShiftKind(row);
  const t = shiftTheme(kind);

  const ot = isOT(row.shift_code);
  const icon = ot ? "🕒" : roundEmoji(row.shift_code);

  return (
    <button
      onClick={onClick}
      className={cx(
        // ✅ ใช้รูปเป็นฉากหลัง
        "bg-cover bg-center",
        skyBg(kind),

        // ✅ กรอบ + เงาแบบเนียน
        "w-full text-left rounded-[26px] border border-white/40 ring-1 ring-black/5 transition active:scale-[0.995]",
        "px-5 py-5 shadow-[0_10px_28px_rgba(2,6,23,.10)]",
        "min-h-[120px]",

        // ✅ glow layer
        graphicLayers(kind)
      )}
    >
      {/* ✅ scrim ช่วยให้ text อ่านง่าย (สำคัญ) */}
      <div className={cx("absolute inset-0 pointer-events-none", skyScrim(kind))} />

      {/* right badge (one) */}
      <div className="absolute right-4 top-4 z-10">
        {rightBadge ? (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
            {rightBadge}
          </span>
        ) : (
          <span
            className={cx(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold",
              "bg-white/60 ring-1 ring-slate-200/70",
              t.title
            )}
          >
            OK
          </span>
        )}
      </div>

      {/* Illustration */}
      <Illustration kind={kind} />

      {/* content (ต้องอยู่เหนือ overlay) */}
      <div className="relative z-10 pr-16">
        <div className={cx("text-base font-medium", t.meta)}>Today</div>

        <div className="mt-1 flex items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
              t.pill
            )}
          >
            {kindLabel(kind)}
            <span aria-hidden>{icon}</span>
          </span>
        </div>

        <div className={cx("mt-3 text-2xl font-semibold", t.title)}>
          {timeRange(row.start_time, row.end_time, row.cross_midnight)}
        </div>

        <div className={cx("mt-2 text-base font-medium", t.meta)}>{formatDateTH(row.shift_date)}</div>
      </div>
    </button>
  );
}
