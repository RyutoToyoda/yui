"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fsGetJobs,
  fsGetJobsByUser,
  fsGetApplicationsByUser,
  fsGetApplicationsByJob,
  fsGetJob,
  fsUpdateApplication,
  fsUpdateJob,
  fsCompleteJobTransaction,
  fsCreateNotification,
  fsFetchNotifications,
  fsGetAvailabilitiesByUser,
  fsCreateAvailability,
  fsDeleteAvailability,
  getJobTypeEmoji,
  getJobTypeLabel,
} from "@/lib/firestore-service";
import type { Job, Application, Availability, Notification } from "@/types/firestore";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ChevronRight,
  CalendarDays,
  CircleDot,
  CircleCheck,
  Loader,
  Plus,
  X,
  ChevronDown,
  ArrowRight,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import Calendar, { type CalendarCell } from "@/components/Calendar";

interface JobWithApps {
  job: Job;
  applications: Application[];
}

export default function SchedulePage() {
  const { user, refreshUser } = useAuth();
  const [confirmAction, setConfirmAction] = useState<{ type: string; appId?: string; jobId?: string; availId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Recruitment, upcoming, history, availability data
  const [managingJobsWithApps, setManagingJobsWithApps] = useState<JobWithApps[]>([]);
  const [upcomingApps, setUpcomingApps] = useState<{ app: Application; job: Job }[]>([]);
  const [completedAppsWithJobs, setCompletedAppsWithJobs] = useState<{ app: Application; job: Job }[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [openRecruitmentJobs, setOpenRecruitmentJobs] = useState<Job[]>([]);
  const [importantNotifications, setImportantNotifications] = useState<Notification[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedDateForTime, setSelectedDateForTime] = useState<string | null>(null);

  // Expand/collapse states for detail sections
  const [expandSections, setExpandSections] = useState<{ [key: string]: boolean }>({
    managing: false,
    upcoming: false,
    history: false,
  });

  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const loadData = async () => {
    if (!user) return;
    const [myJobs, myApps, myAvails, allOpenJobs, notifications] = await Promise.all([
      fsGetJobsByUser(user.uid),
      fsGetApplicationsByUser(user.uid),
      fsGetAvailabilitiesByUser(user.uid),
      fsGetJobs("open"),
      fsFetchNotifications(user.uid, 30),
    ]);

    // 管理中のジョブ + 応募者
    const managing = myJobs.filter((j) => j.status === "open" || j.status === "matched" || j.status === "in_progress");
    const managingWithApps = await Promise.all(
      managing.map(async (job) => {
        const apps = await fsGetApplicationsByJob(job.id);
        return { job, applications: apps };
      })
    );
    setManagingJobsWithApps(managingWithApps);

    // 予定
    const approved = myApps.filter((a) => a.status === "approved");
    const upcomingWithJobs = await Promise.all(
      approved.map(async (app) => {
        const job = await fsGetJob(app.jobId);
        return job ? { app, job } : null;
      })
    );
    setUpcomingApps(upcomingWithJobs.filter(Boolean) as { app: Application; job: Job }[]);

    // 履歴
    const completedApps = myApps.filter((a) => a.status === "completed");
    const completedWithJobs = await Promise.all(
      completedApps.map(async (app) => {
        const job = await fsGetJob(app.jobId);
        return job ? { app, job } : null;
      })
    );
    setCompletedAppsWithJobs(completedWithJobs.filter(Boolean) as { app: Application; job: Job }[]);

    setCompletedJobs(myJobs.filter((j) => j.status === "completed"));

    // お手伝い可能日
    setAvailabilities(myAvails.filter(a => a.date));
    setOpenRecruitmentJobs(allOpenJobs);

    // 重要通知
    const actionableNotifs = notifications
      .filter(
        (notif) =>
          !notif.isRead &&
          (notif.type === "application" ||
            notif.type === "approved" ||
            notif.type === "job_cancelled" ||
            notif.type === "match")
      )
      .slice(0, 4);
    setImportantNotifications(actionableNotifs);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  const handleApprove = async (applicationId: string, jobId: string) => {
    if (!applicationId || !jobId) return;
    await fsUpdateApplication(applicationId, { status: "approved" });
    await fsUpdateJob(jobId, { status: "matched" });
    const apps = await fsGetApplicationsByJob(jobId);
    const app = apps.find((a) => a.id === applicationId);
    const job = await fsGetJob(jobId);
    if (app && job) {
      await fsCreateNotification({
        userId: app.applicantId,
        type: "approved",
        title: "✅ お手伝いが決まりました！",
        message: `${user.name}さんの「${job.title}」のお手伝いが決まりました。当日よろしくお願いします。`,
        jobId: jobId,
        isRead: false,
        createdAt: new Date(),
      });
    }
    setConfirmAction(null);
    await loadData();
  };

  const handleReject = async (applicationId: string) => {
    if (!applicationId) return;
    await fsUpdateApplication(applicationId, { status: "rejected" });
    setConfirmAction(null);
    await loadData();
  };

  const handleComplete = async (jobId: string) => {
    if (!jobId) return;
    try {
      await fsCompleteJobTransaction(jobId);
      refreshUser();
      setConfirmAction(null);
      await loadData();
    } catch (e: any) {
      console.error("ポイント決済エラー:", e);
      alert(`ポイントの決済に失敗しました。\n原因: ${e.message || "残高が不足している可能性があります。"}`);
      setConfirmAction(null);
    }
  };

  const handleToggleAvail = async (dateStr: string) => {
    const todayStr = toLocalDateStr(new Date());
    if (dateStr < todayStr) return;

    const existing = availabilities.find(a => a.date === dateStr);
    if (existing) {
      await fsDeleteAvailability(existing.id);
      await loadData();
    } else {
      setSelectedDateForTime(dateStr);
    }
  };

  const handleSaveAvailability = async (dateStr: string, startTime: string, endTime: string) => {
    await fsCreateAvailability({
      userId: user.uid,
      date: dateStr,
      startTime,
      endTime,
      note: "",
      isActive: true,
      createdAt: new Date()
    });
    setSelectedDateForTime(null);
    await loadData();
  };

  const formatDateJP = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${month}月${day}日(${dayOfWeek})`;
  };

  // Calendar generation
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = toLocalDateStr(new Date());

  const selectedDayRecruitments = selectedCalendarDate
    ? openRecruitmentJobs.filter((job) => job.date === selectedCalendarDate)
    : [];

  const selectedDayHistories = selectedCalendarDate
    ? [
      ...completedJobs.filter((job) => job.date === selectedCalendarDate).map((job) => ({
        id: `host-${job.id}`,
        title: job.title,
        owner: "自分の募集",
      })),
      ...completedAppsWithJobs.filter(({ job }) => job.date === selectedCalendarDate).map(({ app, job }) => ({
        id: `help-${app.id}`,
        title: job.title,
        owner: `${job.creatorName}さんの募集`,
      })),
    ]
    : [];

  const calendarCells: CalendarCell[] = monthDays.map((date) => {
    const dateStr = toLocalDateStr(date);
    const isAvailable = availabilities.some((a) => a.date === dateStr);
    const hasRecruitment = openRecruitmentJobs.some((job) => job.date === dateStr);
    const hasHistory =
      completedJobs.some((job) => job.date === dateStr) ||
      completedAppsWithJobs.some(({ job }) => job.date === dateStr);
    const isPast = dateStr < todayStr;
    const hasUpcoming = upcomingApps.some(({ job }) => job.date === dateStr);

    return {
      dateStr,
      day: date.getDate(),
      // 優先順位: 予定あり > 空き日 > 過去 > デフォルト
      tone: isPast ? "past" : (hasRecruitment || hasUpcoming) ? "recruitment" : isAvailable ? "availability" : "default",
      selected: selectedCalendarDate === dateStr,
      badges: isPast ? (hasHistory ? ["履歴"] : undefined) : (hasRecruitment || hasUpcoming) ? ["予定"] : isAvailable ? ["空き"] : undefined,
      ariaLabel: `${date.getDate()}日 ${isPast ? "過去日" : (hasRecruitment || hasUpcoming) ? "予定あり" : isAvailable ? "空き日登録済み" : "未定"}`,
    };
  });

  const toggleExpandSection = (section: string) => {
    setExpandSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="px-4 py-5 space-y-5 pb-20">
      <h1 className="text-xl font-bold text-yui-green-800">スケジュール</h1>

      {/* Calendar with legend */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-6">
          <h2 className="text-lg font-bold text-yui-green-800 mb-6 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
            お手伝い可能日を管理する
          </h2>


          <Calendar
            year={year}
            month={month}
            cells={calendarCells}
            onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
            onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
            onSelectDate={setSelectedCalendarDate}
          />

          {selectedCalendarDate && (
            <div className="mt-5 bg-yui-earth-50 rounded-2xl border-2 border-yui-green-100 p-4 space-y-3">
              <p className="text-base font-bold text-yui-green-800">{formatDateJP(selectedCalendarDate)} の詳細</p>

              {selectedCalendarDate < todayStr ? (
                <>
                  <p className="text-sm text-yui-earth-600">過去日のため、空き日登録の変更はできません。</p>
                  {selectedDayHistories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayHistories.slice(0, 3).map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border border-yui-earth-200 p-3">
                          <p className="text-sm font-bold text-yui-green-800">{item.title}</p>
                          <p className="text-xs text-yui-earth-500 mt-0.5">{item.owner}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-yui-earth-500">この日の履歴はありません。</p>
                  )}
                </>
              ) : (
                <>
                  {selectedDayRecruitments.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-green-700">募集が {selectedDayRecruitments.length} 件あります</p>
                      {selectedDayRecruitments.slice(0, 2).map((job) => (
                        <p key={job.id} className="text-sm text-yui-earth-700 bg-white rounded-lg px-3 py-2 border border-green-200">
                          {job.title}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-yui-earth-500">この日の募集はまだありません。</p>
                  )}

                  {(() => {
                    const isRegistered = availabilities.some((a) => a.date === selectedCalendarDate);
                    return (
                      <button
                        onClick={() => handleToggleAvail(selectedCalendarDate)}
                        className={`w-full py-3 rounded-xl text-base font-bold transition-colors ${isRegistered
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        style={{ minHeight: "52px" }}
                      >
                        {isRegistered ? "登録を削除する" : "空き日に登録する"}
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* 登録済みリスト */}
        <div>
          <h3 className="text-sm font-bold text-yui-earth-500 mb-3 px-1">登録されている日</h3>
          <div className="space-y-2">
            {availabilities.slice(0, 5).map(avail => (
              <div key={avail.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-yui-green-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold">
                    {avail.date?.split("-")[2]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-yui-green-800">{formatDateJP(avail.date!)}</p>
                    <p className="text-xs text-yui-earth-500">{avail.startTime}〜{avail.endTime} お手伝いできます</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fsDeleteAvailability(avail.id);
                    await loadData();
                  }}
                  className="p-2 text-yui-earth-300 hover:text-red-500 transition-colors"
                  aria-label="削除"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            {availabilities.length === 0 && (
              <p className="text-sm text-yui-earth-400 text-center py-4 bg-white rounded-xl border-2 border-dashed border-yui-earth-100">
                カレンダーから日付をえらんでください
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 重要通知 */}
      <section aria-labelledby="important-notice" className="space-y-3">
        <h2 id="important-notice" className="text-xl font-bold text-yui-green-800 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-yui-accent" aria-hidden="true" />
          重要通知
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importantNotifications.length > 0 ? (
            importantNotifications.map((notif) => (
              <div key={notif.id} className="bg-white rounded-2xl border-2 border-orange-200 p-4 shadow-sm">
                <p className="text-base font-bold text-yui-green-800">{notif.title}</p>
                <p className="text-sm text-yui-earth-600 mt-1 line-clamp-2">{notif.message}</p>
                <Link
                  href={notif.jobId ? `/explore/${notif.jobId}` : "/notifications"}
                  className="mt-2 inline-flex items-center gap-1 text-base font-bold text-yui-green-700 no-underline hover:text-yui-green-800"
                  style={{ minHeight: "44px", alignItems: "center" }}
                >
                  対応する
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-yui-green-100 p-5 text-center text-yui-earth-500 shadow-sm">
              今すぐ対応が必要な通知はありません
            </div>
          )}
        </div>
      </section>

      {/* Collapsible section: 自分の募集 */}
      {managingJobsWithApps.length > 0 && (
        <CollapsibleSection
          title={`自分の募集 (${managingJobsWithApps.length})`}
          isExpanded={expandSections.managing}
          onToggle={() => toggleExpandSection("managing")}
        >
          <div className="space-y-4">
            {managingJobsWithApps.map(({ job, applications }) => {
              const pendingApps = applications.filter((a) => a.status === "pending");
              const approvedApps = applications.filter((a) => a.status === "approved");

              return (
                <div key={job.id} className="bg-white rounded-xl shadow-sm border-2 border-yui-green-100 overflow-hidden">
                  <div className="p-5 border-b border-yui-green-100">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                      <span className="text-xs bg-yui-green-100 text-yui-green-700 font-bold px-2.5 py-1 rounded-full">
                        {getJobTypeLabel(job.type)}
                      </span>
                    </div>
                    <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                    <p className="text-sm text-yui-earth-500 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      {formatDateJP(job.date)} {job.startTime}〜{job.endTime}
                    </p>
                  </div>

                  {pendingApps.length > 0 && (
                    <div className="p-5">
                      <p className="text-sm font-bold text-yui-green-800 mb-3">
                        返事待ち ({pendingApps.length}名)
                      </p>
                      <div className="space-y-3">
                        {pendingApps.map((app) => (
                          <div key={app.id} className="flex items-center justify-between bg-yui-earth-50 rounded-xl p-4">
                            <div>
                              <p className="font-bold text-sm text-yui-green-800">{app.applicantName}さん</p>
                              <p className="text-xs text-yui-earth-500">
                                {app.createdAt.toLocaleDateString("ja-JP")} に手を挙げた
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmAction({ type: "approve", appId: app.id, jobId: job.id })}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-xs hover:bg-green-200 transition-colors"
                                style={{ minHeight: "44px" }}
                              >
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                おねがい
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "reject", appId: app.id, jobId: job.id })}
                                className="flex items-center justify-center p-2 rounded-xl bg-yui-earth-100 text-yui-earth-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                style={{ minWidth: "44px", minHeight: "44px" }}
                              >
                                <X className="w-5 h-5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {approvedApps.length > 0 && (
                    <div className="p-5 border-t border-yui-green-100">
                      <p className="text-sm font-bold text-yui-green-800 mb-3">お願い済みの方 ({approvedApps.length}名)</p>
                      {approvedApps.map((app) => (
                        <div key={app.id} className="flex items-center justify-between bg-green-50 rounded-xl p-4 mb-2 border border-green-200">
                          <div>
                            <p className="font-bold text-sm text-green-800">{app.applicantName}さん</p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> お願い済み
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-3">
                        <button
                          onClick={() => setConfirmAction({ type: "complete", jobId: job.id })}
                          className="w-full py-3 bg-yui-green-600 text-white text-sm font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
                          style={{ minHeight: "44px" }}
                        >
                          全員の作業完了とポイント送金
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Collapsible section: 予定 */}
      {upcomingApps.length > 0 && (
        <CollapsibleSection
          title={`予定 (${upcomingApps.length})`}
          isExpanded={expandSections.upcoming}
          onToggle={() => toggleExpandSection("upcoming")}
        >
          <div className="space-y-3">
            {upcomingApps.map(({ app, job }) => (
              <Link
                key={app.id}
                href={`/explore/${job.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm border-2 border-yui-green-100 no-underline hover:border-yui-green-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                      <span className="ud-status-badge bg-green-100 text-green-800 border border-green-300">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> お願い済み
                      </span>
                    </div>
                    <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                    <p className="text-sm text-yui-earth-500 mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      {formatDateJP(job.date)} {job.startTime}〜{job.endTime}
                    </p>
                    <p className="text-sm text-yui-earth-600 mt-0.5">{job.creatorName}さん</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yui-accent" aria-hidden="true" />
                    <span className="font-bold text-yui-green-800">{job.totalTokens}P</span>
                    <ChevronRight className="w-5 h-5 text-yui-earth-400" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Collapsible section: 履歴 */}
      {(completedAppsWithJobs.length > 0 || completedJobs.length > 0) && (
        <CollapsibleSection
          title={`履歴 (${completedAppsWithJobs.length + completedJobs.length})`}
          isExpanded={expandSections.history}
          onToggle={() => toggleExpandSection("history")}
        >
          <div className="space-y-3">
            {completedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl p-5 shadow-sm border-2 border-yui-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <span aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                  <span className="ud-status-badge bg-yui-earth-200 text-yui-earth-700 border border-yui-earth-300">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> 完了
                  </span>
                </div>
                <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                <p className="text-sm text-yui-earth-500 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" aria-hidden="true" /> {formatDateJP(job.date)}
                </p>
              </div>
            ))}
            {completedAppsWithJobs.map(({ app, job }) => (
              <div key={app.id} className="bg-white rounded-xl p-5 shadow-sm border-2 border-yui-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <span aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                  <span className="ud-status-badge bg-yui-earth-200 text-yui-earth-700 border border-yui-earth-300">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> 完了
                  </span>
                </div>
                <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                <p className="text-sm text-yui-earth-500 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" aria-hidden="true" /> {formatDateJP(job.date)}
                </p>
                <p className="text-sm text-yui-earth-600 mt-1">{job.creatorName}さん</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Confirmation Dialogs */}
      {confirmAction?.type === "approve" && (
        <ConfirmDialog
          isOpen={true}
          title="この方にお願いしますか？"
          message="手を挙げてくれた方にお手伝いをお願いします。相手に通知が届きます。"
          confirmLabel="おねがいする"
          cancelLabel="まだ決めない"
          onConfirm={() => handleApprove(confirmAction.appId!, confirmAction.jobId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "reject" && (
        <ConfirmDialog
          isOpen={true}
          title="お断りしますか？"
          message="この方のお手伝いをお断りします。この操作は元に戻せません。"
          confirmLabel="お断りする"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleReject(confirmAction.appId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "complete" && (
        <ConfirmDialog
          isOpen={true}
          title="作業おわりにしますか？"
          message="作業おわりにすると、お礼のポイントが自動で参加者全員に届きます。"
          confirmLabel="おわりにする"
          cancelLabel="まだおわっていない"
          onConfirm={() => handleComplete(confirmAction.jobId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Time selection dialog */}
      {selectedDateForTime && (
        <TimeSelectionDialog
          isOpen={true}
          dateStr={selectedDateForTime}
          onConfirm={(start, end) => handleSaveAvailability(selectedDateForTime, start, end)}
          onCancel={() => setSelectedDateForTime(null)}
        />
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-yui-green-50 transition-colors"
        style={{ minHeight: "56px" }}
      >
        <h2 className="text-lg font-bold text-yui-green-800">{title}</h2>
        <ChevronDown
          className={`w-6 h-6 text-yui-green-600 transition-transform ${isExpanded ? "rotate-180" : ""
            }`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && <div className="px-6 pb-6 space-y-4 border-t border-yui-green-100 pt-4">{children}</div>}
    </div>
  );
}

function TimeSelectionDialog({
  isOpen,
  dateStr,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  dateStr: string;
  onConfirm: (startTime: string, endTime: string) => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  const presets = [
    { label: "一日中", start: "08:00", end: "17:00", icon: "☀️" },
    { label: "午前のみ", start: "08:00", end: "12:00", icon: "🌅" },
    { label: "午後のみ", start: "13:00", end: "17:00", icon: "🌇" },
  ];

  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  const formattedDate = `${month}月${day}日(${dayOfWeek})`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div>
              <p className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                お手伝いに行ける日を確認
              </p>
              <h3 className="text-2xl font-black text-yui-green-800">
                {formattedDate} は<br />何時ごろ行けますか？
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-yui-earth-100 flex items-center justify-center text-yui-earth-500 hover:bg-yui-earth-200"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => onConfirm(p.start, p.end)}
                className="w-full flex items-center justify-between p-5 bg-yui-green-50 rounded-2xl border-2 border-transparent hover:border-yui-green-200 transition-all text-left group"
                style={{ minHeight: "80px" }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl" aria-hidden="true">{p.icon}</span>
                  <div>
                    <p className="font-black text-yui-green-800 text-lg">
                      {p.label}
                    </p>
                    <p className="text-xs font-bold text-yui-green-600">
                      {formattedDate} の {p.start} 〜 {p.end} を登録する
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-yui-green-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          <button
            onClick={onCancel}
            className="w-full py-4 text-yui-earth-500 font-black text-base hover:bg-yui-earth-50 rounded-xl"
          >
            やめておく
          </button>
        </div>
      </div>
    </div>
  );
}
