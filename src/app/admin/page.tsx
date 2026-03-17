"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { fsGetAllUsers, fsGetJobs } from "@/lib/firestore-service";
import { Users, Briefcase, CheckCircle2, TrendingUp } from "lucide-react";
import type { User, Job } from "@/types/firestore";
import Calendar, { type CalendarCell } from "@/components/Calendar";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));

  useEffect(() => {
    async function loadStats() {
      const [allUsers, allJobs] = await Promise.all([
        fsGetAllUsers(),
        fsGetJobs()
      ]);
      setUsers(allUsers);
      setJobs(allJobs);
      setLoading(false);
    }
    loadStats();
  }, []);

  const stats = [
    { label: "登録ユーザー", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "総募集数", value: jobs.length, icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
    { label: "稼働中の募集", value: jobs.filter(j => j.status === 'open').length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "完了した募集", value: jobs.filter(j => j.status === 'completed').length, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const formatDateJP = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateStr(new Date());
  const schedulableJobs = jobs.filter((j) => j.status !== "cancelled" && !!j.date);

  const calendarCells: CalendarCell[] = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const count = schedulableJobs.filter((j) => j.date === dateStr).length;
    const isPast = dateStr < todayStr;
    return {
      dateStr,
      day,
      tone: isPast ? "past" : count > 0 ? "recruitment" : "default",
      selected: selectedDate === dateStr,
      badges: count > 0 ? ["予定"] : undefined,
      ariaLabel: `${dateStr} ${count > 0 ? `予定${count}件` : "予定なし"}`,
    };
  });

  const selectedDateJobs = schedulableJobs
    .filter((j) => j.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) return <p className="text-gray-500">統計データを取得中...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-500 font-medium">システムの現在の稼働状況を確認できます。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500">{item.label}</p>
              <p className="text-2xl font-black text-gray-900 leading-tight">{item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">農家の予定カレンダー</h3>
          <Calendar
            year={year}
            month={month}
            cells={calendarCells}
            onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
            onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">{formatDateJP(selectedDate)} の予定一覧</h3>
            <p className="text-xs text-gray-500 mt-1">{selectedDateJobs.length}件の予定があります</p>
          </div>
          <div className="divide-y divide-gray-50">
            {selectedDateJobs.length > 0 ? (
              selectedDateJobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.creatorName} • {job.location || "場所未設定"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.startTime}〜{job.endTime}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      job.status === "open"
                        ? "bg-green-100 text-green-700"
                        : job.status === "matched"
                        ? "bg-blue-100 text-blue-700"
                        : job.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {job.status === "open"
                        ? "募集中"
                        : job.status === "matched"
                        ? "確定"
                        : job.status === "in_progress"
                        ? "進行中"
                        : "完了"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-10 text-sm text-gray-500">この日の予定はありません。</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* 最近の登録ユーザー */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800">最近の登録ユーザー</h3>
            <button className="text-xs text-yui-green-600 font-bold hover:underline">すべて見る</button>
          </div>
          <div className="divide-y divide-gray-50">
            {users.slice(0, 5).map(user => (
              <div key={user.uid} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.farmName} • {user.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-yui-accent">{user.tokenBalance}P</p>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近の募集依頼 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800">最近の募集</h3>
            <button className="text-xs text-yui-green-600 font-bold hover:underline">すべて見る</button>
          </div>
          <div className="divide-y divide-gray-50">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <p className="font-bold text-gray-800 text-sm truncate">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.creatorName} • {job.date}</p>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.status === 'open' ? '稼働中' : '完了'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
