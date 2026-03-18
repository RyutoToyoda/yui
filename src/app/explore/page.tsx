"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJobs, getJobTypeEmoji, getJobTypeLabel } from "@/lib/firestore-service";
import { Coins, List, CalendarDays, Users } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/types/firestore";
import Calendar, { type CalendarCell } from "@/components/Calendar";

export default function ExplorePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadJobs() {
      const jobs = await fsGetJobs();
      if (cancelled) return;
      setAllJobs(jobs);
      setOpenJobs(jobs.filter((job) => job.status === "open"));
      setLoading(false);
    }

    loadJobs();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  // カレンダー用
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const getJobsForDate = (dateStr: string): Job[] => {
    return openJobs.filter((j) => j.date === dateStr);
  };

  const getHistoryForDate = (dateStr: string): Job[] => {
    return allJobs.filter((j) => j.date === dateStr && j.status !== "open");
  };

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDateLocal(new Date());

  const profileAnchor = (user.location || "").split(" ")[0];
  const getRecommendScore = (job: Job) => {
    let score = 0;
    if (profileAnchor && job.location?.includes(profileAnchor)) score += 35;

    const elapsedHours = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours <= 24) score += 25;
    else if (elapsedHours <= 72) score += 15;

    score += Math.min(job.totalTokens, 20);
    return score;
  };

  const recommendedJobs = [...openJobs]
    .sort((a, b) => getRecommendScore(b) - getRecommendScore(a))
    .slice(0, 3);

  const recommendedIds = new Set(recommendedJobs.map((job) => job.id));
  const orderedOpenJobs = [...openJobs].sort((a, b) => {
    const aPriority = recommendedIds.has(a.id) ? 1 : 0;
    const bPriority = recommendedIds.has(b.id) ? 1 : 0;
    if (aPriority !== bPriority) return bPriority - aPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const calendarCells: CalendarCell[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const jobCount = getJobsForDate(dateStr).length;
    const historyCount = getHistoryForDate(dateStr).length;
    const isPast = dateStr < todayStr;
    const isDisabled = isPast && historyCount === 0;

    return {
      dateStr,
      day,
      tone: isPast ? "past" : jobCount > 0 ? "recruitment" : "default",
      selected: selectedDate === dateStr,
      disabled: isDisabled,
      badges: isPast ? (historyCount > 0 ? ["履歴"] : undefined) : jobCount > 0 ? ["募集"] : undefined,
      ariaLabel: `${dateStr}${jobCount > 0 ? ` 募集${jobCount}件` : ""}${historyCount > 0 ? ` 履歴${historyCount}件` : ""}${isPast ? " 過去日" : ""}`,
    };
  });

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
    ? orderedOpenJobs.filter((job) => job.date === selectedDate)
    : orderedOpenJobs;

  const selectedOpenJobs = selectedDate ? getJobsForDate(selectedDate) : [];
  const selectedHistoryJobs = selectedDate ? getHistoryForDate(selectedDate) : [];
  const isSelectedPast = selectedDate ? selectedDate < todayStr : false;

  return (
    <div className="py-1 space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800">お手伝い募集を探す</h1>

      {recommendedJobs.length > 0 && (
        <section aria-labelledby="recommended-heading" className="space-y-3">
          <h2 id="recommended-heading" className="text-xl font-bold text-yui-green-800">おすすめの募集</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {recommendedJobs.map((job, idx) => (
              <Link
                key={`recommended-${job.id}`}
                href={`/explore/${job.id}`}
                className="block relative bg-gradient-to-r from-green-50 to-lime-50 rounded-2xl p-5 border-2 border-green-200 no-underline hover:border-green-300"
                aria-label={`${job.title} おすすめ募集`}
              >
                <span className="absolute -top-2 -right-2 text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full shadow-sm">
                  おすすめ {idx + 1}
                </span>
                <p className="text-sm font-bold text-green-700">{job.creatorName}さん</p>
                <p className="text-lg font-bold text-yui-green-800 mt-1 line-clamp-2">{job.title}</p>
                <p className="text-sm text-yui-earth-600 mt-1 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" aria-hidden="true" />
                  {job.date} {job.startTime}〜{job.endTime}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-green-200">
                  <Coins className="w-4 h-4 text-yui-accent" aria-hidden="true" />
                  <span className="font-bold text-yui-green-800">{job.totalTokens}P</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ビュー切り替え */}
      <div className="flex bg-yui-green-50 rounded-xl p-1" role="tablist" aria-label="表示方法">
        <button
          onClick={() => { setViewMode("list"); setSelectedDate(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "list"
              ? "bg-white text-yui-green-700 shadow-sm"
              : "text-yui-earth-500"
          }`}
          role="tab"
          aria-selected={viewMode === "list"}
          style={{ minHeight: "44px" }}
        >
          <List className="w-4 h-4" aria-hidden="true" /> リスト
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "calendar"
              ? "bg-white text-yui-green-700 shadow-sm"
              : "text-yui-earth-500"
          }`}
          role="tab"
          aria-selected={viewMode === "calendar"}
          style={{ minHeight: "44px" }}
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" /> カレンダー
        </button>
      </div>

      {/* カレンダービュー */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-4">
          <Calendar
            year={currentMonth.year}
            month={currentMonth.month}
            cells={calendarCells}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onSelectDate={(dateStr) => setSelectedDate((prev) => (prev === dateStr ? null : dateStr))}
          />

          {selectedDate && (
            <div className="mt-4 rounded-xl border-2 border-yui-green-100 bg-yui-earth-50 p-4">
              <p className="text-sm font-bold text-yui-green-800 mb-2">
                {selectedDate} の {isSelectedPast ? "過去の履歴" : "予定の詳細"}
              </p>

              {!isSelectedPast && selectedOpenJobs.length > 0 && (
                <div className="space-y-2">
                  {selectedOpenJobs.slice(0, 3).map((job) => (
                    <div key={`selected-open-${job.id}`} className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-bold text-yui-green-800">{job.title}</p>
                      <p className="text-xs text-yui-earth-600 mt-0.5">{job.startTime}〜{job.endTime} / {job.creatorName}さん</p>
                    </div>
                  ))}
                </div>
              )}

              {isSelectedPast && selectedHistoryJobs.length > 0 && (
                <div className="space-y-2">
                  {selectedHistoryJobs.slice(0, 3).map((job) => (
                    <div key={`selected-history-${job.id}`} className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-bold text-yui-earth-700">{job.title}</p>
                      <p className="text-xs text-yui-earth-500 mt-0.5">{job.creatorName}さん / {job.status === "completed" ? "完了" : "終了"}</p>
                    </div>
                  ))}
                </div>
              )}

              {((!isSelectedPast && selectedOpenJobs.length === 0) || (isSelectedPast && selectedHistoryJobs.length === 0)) && (
                <p className="text-sm text-yui-earth-500">この日に表示できる情報はありません。</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ジョブリスト */}
      <div className="space-y-3">
        {selectedDate && (
          <p className="text-sm text-yui-earth-600 font-medium">
            {selectedDate} の募集（{filteredJobs.length}件）
          </p>
        )}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/explore/${job.id}`}
                className="block h-full w-full min-w-0 overflow-hidden bg-white rounded-xl p-5 shadow-sm border-2 border-yui-green-100 hover:border-yui-green-300 transition-colors no-underline"
                aria-label={`${job.title} ${job.creatorName}さん ${job.date}`}
              >
                <div className="flex w-full min-w-0 items-start justify-between h-full">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg shrink-0" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                      <span className="text-xs bg-yui-green-100 text-yui-green-700 font-bold px-2.5 py-1 rounded-full">
                        {getJobTypeLabel(job.type)}
                      </span>
                    </div>
                    <h3 className="font-bold text-yui-green-800 text-base break-words">{job.title}</h3>
                    <p className="text-sm text-yui-earth-600 mt-1 break-words">{job.creatorName}</p>
                    <p className="text-sm text-yui-earth-500 mt-0.5 flex items-start gap-1 min-w-0">
                      <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 break-words">{job.date} {job.startTime}〜{job.endTime}</span>
                    </p>
                    {job.requiredPeople > 0 && (
                      <p className="text-sm text-yui-earth-500 mt-0.5 flex items-start gap-1 min-w-0">
                        <Users className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 break-words">{job.requiredPeople}名募集</span>
                      </p>
                    )}
                    <p className="text-sm text-yui-earth-500 mt-0.5 flex items-start gap-1 min-w-0">
                      <span className="text-[10px] bg-yui-green-50 text-yui-green-700 font-bold px-1.5 py-0.5 rounded border border-yui-green-200 shrink-0">
                        場所
                      </span>
                      <span className="min-w-0 truncate">{job.location || "（未指定）"}</span>
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <div className="flex items-center gap-1 bg-yui-accent/10 px-3 py-1.5 rounded-full">
                      <Coins className="w-4 h-4 text-yui-accent" aria-hidden="true" />
                      <span className="font-bold text-yui-green-800">{job.totalTokens}</span>
                      <span className="text-xs text-yui-earth-500">P</span>
                    </div>
                    <p className="text-xs text-yui-earth-500 mt-1">
                      {job.tokenRatePerHour}P/時間
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-yui-earth-500 shadow-sm border-2 border-yui-green-100">
            {selectedDate ? "この日の募集はありません" : "今は募集がありません"}
          </div>
        )}
      </div>
    </div>
  );
}
