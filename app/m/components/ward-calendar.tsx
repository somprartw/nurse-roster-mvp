"use client";

import * as React from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(year: number, monthIndex: number) {
  const m = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${m}`;
}

export type CalendarMark = { date: string; count: number };

// ===== NEW TYPES =====
export type ShiftKind = "morning" | "afternoon" | "night";
export type KindCounts = { morning: number; afternoon: number; night: number };

// ===== COLOR HELPERS =====
function kindBarClass(k: ShiftKind) {
  if (k === "morning") return "bg-sky-400/85";
  if (k === "afternoon") return "bg-orange-400/85";
  return "bg-indigo-400/85"; // night (twilight)
}

export function WardCalendar({
  year,
  monthIndex,
  marks,
  kindCountsByDate,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  monthIndex: number; // 0-11
  marks: CalendarMark[];
  kindCountsByDate?: Record<string, KindCounts>; // ✅ NEW
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const first = new Date(year, monthIndex, 1);
  const firstDow = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const markMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of marks) m[it.date] = it.count;
    return m;
  }, [marks]);

  const cells: Array<{ date: string | null; day: number | null }> = [];
  const leading = (firstDow + 6) % 7; // start week on Mon
  for (let i = 0; i < leading; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex, d);
    cells.push({ date: iso(dt), day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

  const weekDays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
  const monthTitle = new Date(year, monthIndex, 1).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-base font-semibold text-slate-900">{monthTitle}</div>
        <div className="text-xs text-slate-500">แตะวันที่เพื่อดูเวร</div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {weekDays.map((w) => (
          <div key={w} className="text-xs font-semibold text-slate-500">
            {w}
          </div>
        ))}

        {cells.map((c, idx) => {
          if (!c.date) {
            return <div key={idx} className="h-10" />;
          }

          const count = markMap[c.date] ?? 0;
          const selected = selectedDate === c.date;

          return (
            <button
              key={c.date}
              onClick={() => onSelectDate(c.date!)}
              className={cx(
                "flex h-10 flex-col items-center justify-center rounded-2xl text-sm",
                selected ? "bg-primary-soft ring-1 ring-primary/20" : "hover:bg-slate-50",
                count > 0 ? "text-slate-900" : "text-slate-400"
              )}
            >
              <div className="leading-none">{c.day}</div>

              {/* ===== STACKED BAR ===== */}
              <div className="mt-1 w-7" aria-label={count > 0 ? `${count} shifts` : "no shift"}>
                {count <= 0 ? (
                  <div className="h-1.5 w-full rounded-full bg-transparent" />
                ) : (
                  (() => {
                    const cc = kindCountsByDate?.[c.date] ?? {
                      morning: 0,
                      afternoon: 0,
                      night: 0,
                    };

                    const present = (["morning", "afternoon", "night"] as const).filter(
                      (k) => cc[k] > 0
                    );
                    const n = present.length;

                    const widths: Record<ShiftKind, number> = {
                      morning: 0,
                      afternoon: 0,
                      night: 0,
                    };

                    if (n === 3) {
                      // 3 กะ → เท่ากัน
                      for (const k of present) widths[k] = 100 / 3;
                    } else if (n === 2) {
                      // 2 กะ → ตามสัดส่วนจริง
                      const total = present.reduce((s, k) => s + cc[k], 0) || 1;
                      for (const k of present) widths[k] = (cc[k] / total) * 100;
                    } else if (n === 1) {
                      // 1 กะ → เต็มแท่ง
                      widths[present[0]] = 100;
                    }

                    return (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                        <div className="flex h-full w-full">
                          {present.map((k) => (
                            <div
                              key={k}
                              className={cx(kindBarClass(k), "transition-[width] duration-200")}
                              style={{ width: `${widths[k]}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function monthFromOffset(offset: number) {
  const now = new Date();
  const dt = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    year: dt.getFullYear(),
    monthIndex: dt.getMonth(),
    month: monthKey(dt.getFullYear(), dt.getMonth()),
  };
}
