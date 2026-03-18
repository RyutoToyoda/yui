"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarCellTone = "default" | "recruitment" | "availability" | "past";

export type CalendarCell = {
  dateStr: string;
  day: number;
  tone: CalendarCellTone;
  selected?: boolean;
  disabled?: boolean;
  badges?: string[];
  ariaLabel?: string;
};

type CalendarProps = {
  year: number;
  month: number;
  cells: CalendarCell[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateStr: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getCellToneClass(tone: CalendarCellTone) {
  switch (tone) {
    case "recruitment":
      // 予定あり
      return "bg-red-400 text-white font-bold border-red-500";
    case "availability":
      // 空き日
      return "bg-green-200 text-green-900 font-bold border-green-400";
    case "past":
      // 過去
      return "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed";
    default:
      // 何も設定されていない未来の日
      return "bg-gray-50 text-gray-700 border-gray-300";
  }
}

export default function Calendar({
  year,
  month,
  cells,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: CalendarProps) {
  const firstDayOffset = new Date(year, month, 1).getDay();

  return (
    <div className="space-y-1 w-full max-w-full">
      {/* 色分け凡例 (コンパクト) */}
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-red-400 border border-red-500 rounded-sm" />
          <span className="text-xs font-bold text-red-600">予定あり</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded-sm" />
          <span className="text-xs font-bold text-yui-green-800">空き日</span>
        </div>
      </div>

      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between px-1 mb-2">
        <button
          onClick={onPrevMonth}
          className="w-10 h-10 rounded-full border border-yui-earth-300 bg-white hover:bg-yui-earth-50 flex items-center justify-center shadow-sm"
          aria-label="前の月へ"
        >
          <ChevronLeft className="w-6 h-6 text-yui-earth-700" aria-hidden="true" />
        </button>
        <h3 className="text-xl md:text-2xl font-black text-yui-green-800 tracking-wide">{year}年 {month + 1}月</h3>
        <button
          onClick={onNextMonth}
          className="w-10 h-10 rounded-full border border-yui-earth-300 bg-white hover:bg-yui-earth-50 flex items-center justify-center shadow-sm"
          aria-label="次の月へ"
        >
          <ChevronRight className="w-6 h-6 text-yui-earth-700" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2 w-full max-w-full items-stretch p-1 lg:p-1.5">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs md:text-sm font-bold text-yui-earth-500 py-1">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOffset }).map((_, idx) => (
          <div key={`blank-${idx}`} className="aspect-square min-h-[3rem]" />
        ))}

        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            onClick={() => onSelectDate(cell.dateStr)}
            disabled={cell.disabled || cell.tone === "past"}
            className={`relative w-full min-w-0 aspect-square min-h-[3rem] rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden transition-all ${getCellToneClass(cell.tone)} ${cell.selected ? "ring-[3px] ring-yui-green-600 ring-offset-1 z-10 scale-[1.05]" : ""
              } ${cell.disabled || cell.tone === "past" ? "cursor-not-allowed opacity-70" : "hover:brightness-[0.98]"}`}
            aria-label={cell.ariaLabel}
            aria-disabled={cell.disabled || cell.tone === "past"}
            aria-pressed={cell.selected}
            style={{ minHeight: "48px" }}
          >
            <span className="text-sm md:text-base font-black leading-none">{cell.day}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
