"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { demoGetJobs, getJobTypeEmoji, getJobTypeLabel } from "@/lib/demo-data";
import { Coins, ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/types/firestore";

export default function ExplorePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!user) return null;

  const openJobs = demoGetJobs("open");

  // カレンダー用
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });

  const getJobsForDate = (dateStr: string): Job[] => {
    return openJobs.filter((j) => j.date === dateStr);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push(dateStr);
  }

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const filteredJobs = selectedDate
    ? getJobsForDate(selectedDate)
    : openJobs;

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">ヘルプ募集を探す</h1>

      {/* ビュー切り替え */}
      <div className="flex bg-yui-green-50 rounded-xl p-1">
        <button
          onClick={() => { setViewMode("list"); setSelectedDate(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "list"
              ? "bg-white text-yui-green-700 shadow-sm"
              : "text-yui-earth-500"
          }`}
        >
          <List className="w-4 h-4" /> リスト
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "calendar"
              ? "bg-white text-yui-green-700 shadow-sm"
              : "text-yui-earth-500"
          }`}
        >
          <CalendarDays className="w-4 h-4" /> カレンダー
        </button>
      </div>

      {/* カレンダービュー */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-yui-green-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-yui-green-700" />
            </button>
            <h2 className="text-base font-bold text-yui-green-800">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-yui-green-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-yui-green-700" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-yui-earth-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dayNum = parseInt(dateStr.split("-")[2]);
              const jobCount = getJobsForDate(dateStr).length;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all ${
                    isSelected
                      ? "bg-yui-green-600 text-white"
                      : isToday
                      ? "bg-yui-green-100 text-yui-green-800"
                      : "hover:bg-yui-green-50 text-yui-green-800"
                  }`}
                >
                  <span className={`font-medium ${isSelected ? "font-bold" : ""}`}>{dayNum}</span>
                  {jobCount > 0 && (
                    <span className={`text-[10px] font-bold ${
                      isSelected ? "text-yui-green-200" : "text-yui-accent"
                    }`}>
                      {jobCount}件
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ジョブリスト */}
      <div className="space-y-3">
        {selectedDate && (
          <p className="text-sm text-yui-earth-500">
            {selectedDate} の募集（{filteredJobs.length}件）
          </p>
        )}
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/explore/${job.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-yui-green-100 hover:border-yui-green-300 transition-colors no-underline"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{getJobTypeEmoji(job.type)}</span>
                    <span className="text-xs bg-yui-green-100 text-yui-green-700 font-bold px-2 py-0.5 rounded-full">
                      {getJobTypeLabel(job.type)}
                    </span>
                  </div>
                  <h3 className="font-bold text-yui-green-800 text-base">{job.title}</h3>
                  <p className="text-sm text-yui-earth-500 mt-1">{job.creatorName}</p>
                  <p className="text-sm text-yui-earth-400 mt-0.5">
                    📅 {job.date} {job.startTime}〜{job.endTime}
                  </p>
                  {job.requiredPeople > 0 && (
                    <p className="text-sm text-yui-earth-400 mt-0.5">
                      👤 {job.requiredPeople}名募集
                    </p>
                  )}
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="flex items-center gap-1 bg-yui-accent/10 px-2.5 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-yui-accent" />
                    <span className="font-bold text-yui-green-800">{job.totalTokens}</span>
                  </div>
                  <p className="text-xs text-yui-earth-400 mt-1">
                    {job.tokenRatePerHour}/時間
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-yui-earth-400 shadow-sm border border-yui-green-100">
            {selectedDate ? "この日の募集はありません" : "現在、募集はありません"}
          </div>
        )}
      </div>
    </div>
  );
}
