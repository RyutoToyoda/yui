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
      return "bg-green-100 text-green-800";
    case "availability":
      return "bg-blue-100 text-blue-800";
    case "past":
      return "bg-gray-100 text-gray-400";
    default:
      return "bg-white text-yui-green-800";
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
    <div className="space-y-3">
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

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs md:text-sm font-bold text-yui-earth-500 py-1">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOffset }).map((_, idx) => (
          <div key={`blank-${idx}`} />
        ))}

        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            onClick={() => onSelectDate(cell.dateStr)}
            disabled={cell.disabled}
            className={`relative aspect-square rounded-xl border-2 border-black flex flex-col items-center justify-center transition-all ${getCellToneClass(cell.tone)} ${
              cell.selected ? "ring-2 ring-yui-green-500" : ""
            } ${cell.disabled ? "cursor-not-allowed opacity-70" : "hover:brightness-[0.98]"}`}
            aria-label={cell.ariaLabel}
            aria-disabled={cell.disabled}
            aria-pressed={cell.selected}
            style={{ minHeight: "56px" }}
          >
            <span className="text-lg font-black leading-none">{cell.day}</span>
            {cell.badges && cell.badges.length > 0 && (
              <span className="text-[10px] font-bold mt-0.5">{cell.badges[0]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
