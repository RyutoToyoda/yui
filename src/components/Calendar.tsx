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
      return "bg-green-600 text-white font-bold border-green-800";
    case "availability":
      // 空き日
      return "bg-green-200 text-green-900 font-bold border-green-400";
    case "past":
      // 過去
      return "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed";
    default:
      // 何も設定されていない未来の日
      return "bg-gray-50 text-yui-green-800 border-black";
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
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* 色分け凡例 */}
      <div className="bg-yui-green-50 rounded-2xl p-4 border-2 border-yui-green-100">
        <p className="text-sm font-bold text-yui-earth-500 mb-3">色分け説明（凡例）</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 border-2 border-green-800 rounded" />
            <span className="text-sm font-bold text-yui-green-800">予定あり</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-200 border-2 border-green-400 rounded" />
            <span className="text-sm font-bold text-yui-green-800">空き日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded" />
            <span className="text-sm font-bold text-yui-earth-500">過去・履歴</span>
          </div>
        </div>
      </div>

      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onPrevMonth}
          className="w-12 h-12 rounded-full border-2 border-black bg-white hover:bg-yui-earth-50 flex items-center justify-center"
          aria-label="前の月へ"
        >
          <ChevronLeft className="w-6 h-6 text-yui-earth-700" aria-hidden="true" />
        </button>
        <h3 className="text-xl md:text-2xl font-black text-yui-green-800">{year}年 {month + 1}月</h3>
        <button
          onClick={onNextMonth}
          className="w-12 h-12 rounded-full border-2 border-black bg-white hover:bg-yui-earth-50 flex items-center justify-center"
          aria-label="次の月へ"
        >
          <ChevronRight className="w-6 h-6 text-yui-earth-700" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2 w-full max-w-full items-stretch">
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
            className={`relative w-full min-w-0 aspect-square min-h-[3rem] rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden transition-all ${getCellToneClass(cell.tone)} ${cell.selected ? "ring-2 ring-yui-green-500" : ""
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
