"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  fsGetJobs,
  fsGetJobsByUser,
  fsGetApplicationsByUser,
  fsGetApplicationsByJob,
  fsGetJob,
  fsCreateNotification,
  fsFetchNotifications,
  getJobTypeEmoji,
  getJobTypeLabel,
  getPointsPerPerson,
  fsUpdateApplication,
  fsUpdateJob,
  fsCompleteJobTransaction,
  fsCompleteApplicationTransaction,
} from "@/lib/firestore-service";
import type { Job, Application, Notification } from "@/types/firestore";
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
  MapPin,
  Users,
  Wrench,
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
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<{ type: string; appId?: string; jobId?: string; availId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Recruitment, upcoming, history data
  const [managingJobsWithApps, setManagingJobsWithApps] = useState<JobWithApps[]>([]);
  const [upcomingApps, setUpcomingApps] = useState<{ app: Application; job: Job }[]>([]);
  const [completedAppsWithJobs, setCompletedAppsWithJobs] = useState<{ app: Application; job: Job }[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [openRecruitmentJobs, setOpenRecruitmentJobs] = useState<Job[]>([]);
  const [importantNotifications, setImportantNotifications] = useState<Notification[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

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

  const normalizeDate = (rawDate?: string) => {
    if (!rawDate) return "";
    return String(rawDate).slice(0, 10);
  };

  const isPayoutUnlockedByDate = (jobDate: string) => toLocalDateStr(new Date()) >= jobDate;

  const loadData = async () => {
    if (!user) return;
    const [myJobs, myApps, allOpenJobs, notifications] = await Promise.all([
      fsGetJobsByUser(user.uid),
      fsGetApplicationsByUser(user.uid),
      fsGetJobs("open"),
      fsFetchNotifications(user.uid, 30),
    ]);

    // 管理中のジョブ + 応募者
    const managing = myJobs.filter((j) => j.status === "open" || j.status === "matched" || j.status === "in_progress");
    
    // 予定
    const approved = myApps.filter((a) => a.status === "approved");
    
    // 履歴
    const completedApps = myApps.filter((a) => a.status === "completed");

    // Batch all database queries in parallel
    const [managingWithAppsResults, upcomingWithJobsResults, completedWithJobsResults] = await Promise.all([
      Promise.all(
        managing.map(async (job) => {
          const apps = await fsGetApplicationsByJob(job.id);
          return { job, applications: apps };
        })
      ),
      Promise.all(
        approved.map(async (app) => {
          const job = await fsGetJob(app.jobId);
          return job ? { app, job } : null;
        })
      ),
      Promise.all(
        completedApps.map(async (app) => {
          const job = await fsGetJob(app.jobId);
          return job ? { app, job } : null;
        })
      ),
    ]);

    setManagingJobsWithApps(managingWithAppsResults);
    setUpcomingApps(upcomingWithJobsResults.filter(Boolean) as { app: Application; job: Job }[]);
    setCompletedAppsWithJobs(completedWithJobsResults.filter(Boolean) as { app: Application; job: Job }[]);

    setCompletedJobs(myJobs.filter((j) => j.status === "completed"));
    setOpenRecruitmentJobs(allOpenJobs);

    // 重要通知
    const actionableNotifs = notifications
      .filter(
        (notif) =>
          !notif.isRead &&
          (notif.type === "application" ||
            notif.type === "approved" ||
            notif.type === "job_cancelled" ||
            notif.type === "rejected" ||
            notif.type === "match" ||
            notif.type === "payment_received")
      )
      .slice(0, 4);
    setImportantNotifications(actionableNotifs);

    setLoading(false);
    // Refresh user context to update points
    await refreshUser();
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);



  const handleReject = async (applicationId: string, jobId?: string) => {
    if (!applicationId) return;
    if (jobId) {
      const target = managingJobsWithApps.find(({ job }) => job.id === jobId)?.job;
      if (target && isPayoutUnlockedByDate(target.date)) {
        alert("作業日当日はお断りできません。ポイント支払いで完了してください。");
        setConfirmAction(null);
        return;
      }
    }
    let applicantId: string | null = null;
    let jobTitle: string | null = null;
    
    try {
      if (jobId) {
        const apps = await fsGetApplicationsByJob(jobId);
        const app = apps.find((a) => a.id === applicationId);
        const job = await fsGetJob(jobId);
        if (app) applicantId = app.applicantId;
        if (job) jobTitle = job.title;
        
        await fsUpdateApplication(applicationId, { status: "rejected" });
        
        const updatedApps = await fsGetApplicationsByJob(jobId);
        const approvedCount = updatedApps.filter((a) => a.status === "approved").length;
        
        if (job && approvedCount < job.requiredPeople && job.status === "matched") {
          await fsUpdateJob(jobId, { status: "open" });
        }
      }
    } catch (e) {
      console.error("Failed to get application/job details:", e);
    }
    
    if (applicantId && jobTitle) {
      await fsCreateNotification({
        userId: applicantId,
        type: "rejected",
        title: "❌ 応募が断られました",
        message: `申し訳ありませんが、「${jobTitle}」のお手伝いは他の方が担当することになりました。`,
        jobId: jobId || "",
        isRead: false,
        createdAt: new Date(),
      });
    }
    setConfirmAction(null);
    await loadData();
  };

  const handleComplete = async (jobId: string) => {
    if (!jobId) return;
    try {
      const target = managingJobsWithApps.find(({ job }) => job.id === jobId)?.job;
      if (target && !isPayoutUnlockedByDate(target.date)) {
        alert("ポイントの支払いは作業日の当日から可能です。");
        setConfirmAction(null);
        return;
      }
      await fsCompleteJobTransaction(jobId);
      setConfirmAction(null);
      await loadData();
    } catch (e: any) {
      console.error("ポイント決済エラー:", e);
      alert(`ポイントの決済に失敗しました。\n原因: ${e.message || "残高が不足している可能性があります。"}`);
      setConfirmAction(null);
    }
  };

  const handleSinglePayout = async (appId: string, jobId: string) => {
    if (!appId || !jobId) return;
    try {
      const target = managingJobsWithApps.find(({ job }) => job.id === jobId)?.job;
      if (target && !isPayoutUnlockedByDate(target.date)) {
        alert("ポイントの支払いは作業日の当日から可能です。");
        setConfirmAction(null);
        return;
      }
      await fsCompleteApplicationTransaction(jobId, appId);
      setConfirmAction(null);
      await refreshUser();
      await loadData();
    } catch (e: any) {
      console.error("個別ポイント決済エラー:", e);
      alert(`ポイントの決済に失敗しました。\n原因: ${e.message || "残高が不足している可能性があります。"}`);
      setConfirmAction(null);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="loading-text text-yui-earth-500 text-2xl">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
  };

  const formatDateJP = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(normalizeDate(dateStr) + "T00:00:00");
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
    ? openRecruitmentJobs.filter((job) => normalizeDate(job.date) === selectedCalendarDate)
    : [];

  const selectedDayHistories = selectedCalendarDate
    ? [
      ...completedJobs.filter((job) => normalizeDate(job.date) === selectedCalendarDate).map((job) => ({
        id: `host-${job.id}`,
        title: job.title,
        owner: "自分の募集",
      })),
      ...completedAppsWithJobs.filter(({ job }) => normalizeDate(job.date) === selectedCalendarDate).map(({ app, job }) => ({
        id: `help-${app.id}`,
        title: job.title,
        owner: `${job.creatorName}さんの募集`,
      })),
    ]
    : [];

  const selectedDayEvents = selectedCalendarDate
    ? [
      ...managingJobsWithApps
        .filter(({ job }) => normalizeDate(job.date) === selectedCalendarDate)
        .map(({ job }) => ({
          key: `own-active-${job.id}`,
          job,
          roleLabel: "自分の募集",
          roleTone: "recruitment" as const,
          history: false,
        })),
      ...upcomingApps
        .filter(({ job }) => normalizeDate(job.date) === selectedCalendarDate)
        .map(({ app, job }) => ({
          key: `help-active-${app.id}`,
          job,
          roleLabel: "参加した募集",
          roleTone: "volunteered" as const,
          history: false,
        })),
      ...completedJobs
        .filter((job) => normalizeDate(job.date) === selectedCalendarDate)
        .map((job) => ({
          key: `own-history-${job.id}`,
          job,
          roleLabel: "自分の募集",
          roleTone: "recruitment" as const,
          history: true,
        })),
      ...completedAppsWithJobs
        .filter(({ job }) => normalizeDate(job.date) === selectedCalendarDate)
        .map(({ app, job }) => ({
          key: `help-history-${app.id}`,
          job,
          roleLabel: "参加した募集",
          roleTone: "volunteered" as const,
          history: true,
        })),
    ]
    : [];

  const calendarCells: CalendarCell[] = monthDays.map((date) => {
    const dateStr = toLocalDateStr(date);
    const hasRecruitmentUpcoming = managingJobsWithApps.some(({ job }) => normalizeDate(job.date) === dateStr);
    const hasVolunteeredUpcoming = upcomingApps.some(({ job }) => normalizeDate(job.date) === dateStr);
    const hasRecruitmentHistory = completedJobs.some((job) => normalizeDate(job.date) === dateStr);
    const hasVolunteeredHistory = completedAppsWithJobs.some(({ job }) => normalizeDate(job.date) === dateStr);
    const hasHistory = hasRecruitmentHistory || hasVolunteeredHistory;
    const isPast = dateStr < todayStr;

    // Keep semantic colors even for past days; volunteered takes precedence over recruitment.
    const hasVolunteered = hasVolunteeredUpcoming || hasVolunteeredHistory;
    const hasRecruitment = hasRecruitmentUpcoming || hasRecruitmentHistory;
    const isMixed = hasVolunteered && hasRecruitment;

    return {
      dateStr,
      day: date.getDate(),
      // 優先順位: 予定/履歴（volunteered）> 募集/履歴（recruitment）> 過去（予定なし）> デフォルト
      tone: hasVolunteered ? "volunteered" : hasRecruitment ? "recruitment" : isPast ? "past" : "default",
      isMixed,
      isPast,
      selected: selectedCalendarDate === dateStr,
      badges: isPast ? (hasHistory ? ["履歴"] : undefined) : isMixed ? ["予定", "募集"] : hasVolunteered ? ["予定"] : hasRecruitment ? ["募集"] : undefined,
      ariaLabel: `${date.getDate()}日 ${isPast ? (hasHistory ? "履歴あり" : "過去日") : isMixed ? "予定と募集あり" : hasVolunteered ? "予定あり" : hasRecruitment ? "募集あり" : "未定"}`,
    };
  });

  const toggleExpandSection = (section: string) => {
    setExpandSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderHistoryTypeEmoji = (type: string) => {
    if (type === "hybrid") {
      return (
        <span className="inline-flex flex-col items-center justify-center shrink-0 text-lg leading-none" aria-hidden="true">
          <span className="block leading-none">🚜</span>
          <span className="block leading-none">👤</span>
        </span>
      );
    }
    return <span className="text-lg shrink-0" aria-hidden="true">{getJobTypeEmoji(type)}</span>;
  };

  return (
    <div className="pt-1 space-y-3 pb-20">
      <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">
        <CalendarDays className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
        予定
      </h1>

      {/* Calendar with legend */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-3 md:p-4">
          <Calendar
            year={year}
            month={month}
            cells={calendarCells}
            onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
            onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
            onSelectDate={handleDateSelect}
          />
        </div>

        {selectedCalendarDate && (
          <section className="bg-white rounded-2xl border-2 border-yui-green-100 p-4 md:p-5 shadow-sm space-y-3" aria-labelledby="selected-day-events">
            <h2 id="selected-day-events" className="selected-day-events-title text-lg font-bold text-yui-green-800 flex items-center gap-2">
              <CalendarDays className="selected-day-events-icon w-5 h-5 text-yui-green-600" aria-hidden="true" />
              {formatDateJP(selectedCalendarDate)} の一覧
            </h2>

            {selectedDayEvents.length === 0 ? (
              <div className="rounded-xl border border-yui-earth-200 bg-yui-earth-50 px-4 py-4 text-sm text-yui-earth-600 font-bold text-center">
                この日は予定がありません
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map(({ key, job, roleLabel, roleTone, history }) => (
                  <button
                    key={key}
                    onClick={() => router.push(`/explore/${job.id}`)}
                    className="w-full text-left rounded-xl border-2 px-4 py-3 bg-white hover:bg-yui-earth-50 transition-colors"
                    style={{ borderColor: roleTone === "recruitment" ? "#8c7361" : "#468065" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold mb-0.5" style={{ color: roleTone === "recruitment" ? "#8c7361" : "#468065" }}>
                          {roleLabel}
                        </p>
                        <p className="font-bold text-yui-green-800 truncate">{job.title}</p>
                        <p className="text-xs text-yui-earth-500 truncate">{job.startTime}〜{job.endTime} / {job.location || "（未指定）"}</p>
                      </div>
                      {history && (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-yui-earth-100 border border-yui-earth-200 text-yui-earth-700 shrink-0">
                          履歴
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}


      </div>

      {/* 重要通知 */}
      <section aria-labelledby="important-notice">
        <div className="flex items-center justify-between mb-1">
          <h2 id="important-notice" className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2">
            <BellRing className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
            お知らせ
          </h2>
          <Link href="/notifications" className="important-notice-link text-sm font-bold text-yui-green-600 hover:text-yui-green-700 flex items-center gap-1">
            すべて見る <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importantNotifications.length > 0 ? (
            importantNotifications.map((notif) => (
              <Link href={notif.jobId ? `/explore/${notif.jobId}` : "/notifications"} key={notif.id} className="bg-white rounded-2xl border-2 border-orange-200 p-4 shadow-sm block no-underline hover:bg-orange-50 transition-colors">
                <p className="text-base font-bold text-yui-green-800">{notif.title}</p>
                <p className="text-sm text-yui-earth-600 mt-1 line-clamp-2">{notif.message}</p>
                <p className="text-xs text-yui-earth-400 mt-2 font-medium">
                  {notif.createdAt.toLocaleDateString("ja-JP")} {notif.createdAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </Link>
            ))
          ) : (
            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-yui-green-100 p-5 text-center text-yui-earth-500 shadow-sm font-bold">
              お知らせはありません
            </div>
          )}
        </div>
      </section>

      {/* Collapsible section: 履歴 */}
      {(completedAppsWithJobs.length > 0 || completedJobs.length > 0) && (
        <CollapsibleSection
          title={`履歴 (${completedAppsWithJobs.length + completedJobs.length})`}
          isExpanded={expandSections.history}
          onToggle={() => toggleExpandSection("history")}
        >
          <div className="space-y-3">
            {completedJobs.map((job) => (
              <Link key={job.id} href={`/explore/${job.id}`} className="block no-underline">
              <div className="relative bg-white rounded-xl p-4 shadow-sm border-2 border-[#8c7361] bg-gradient-to-r from-[#f5f1ed] to-[#ebe5df] hover:brightness-[0.98] transition-colors">
                <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10" style={{ backgroundColor: "#8c7361" }}>
                  自分の
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="min-w-0 flex items-center gap-3">
                    {renderHistoryTypeEmoji(job.type)}
                    <div className="min-w-0">
                      <h3 className="font-bold text-yui-green-800 truncate">{job.title}</h3>
                      <p className="text-sm text-yui-earth-500 flex items-center gap-1">
                        <CalendarDays className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{formatDateJP(job.date)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </Link>
            ))}
            {completedAppsWithJobs.map(({ app, job }) => (
              <Link key={app.id} href={`/explore/${job.id}`} className="block no-underline">
              <div className="relative bg-white rounded-xl p-4 shadow-sm border-2 border-yui-green-100 hover:bg-yui-green-50/40 transition-colors">
                <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10" style={{ backgroundColor: "#468065" }}>
                  参加した募集
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="min-w-0 flex items-center gap-3">
                    {renderHistoryTypeEmoji(job.type)}
                    <div className="min-w-0">
                      <h3 className="font-bold text-yui-green-800 truncate">{job.title}</h3>
                      <p className="text-sm text-yui-earth-500 flex items-center gap-1">
                        <CalendarDays className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{formatDateJP(job.date)}</span>
                      </p>
                      <p className="text-sm text-yui-earth-600 truncate">{job.creatorName}さん</p>
                    </div>
                  </div>
                </div>
              </div>
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Confirmation Dialogs for other purposes */}
      {confirmAction?.type === "reject" && (
        <ConfirmDialog
          isOpen={true}
          title="お断りしますか？"
          message="この方の応募をお断り（またはキャンセル）します。相手に通知が届きます。"
          confirmLabel="断る"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleReject(confirmAction.appId!, confirmAction.jobId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "single-payout" && (
        <ConfirmDialog
          isOpen={true}
          title="この方にポイントを支払いますか？"
          message="この方に個別でお礼のポイントを送信します。"
          confirmLabel="支払う"
          cancelLabel="キャンセル"
          onConfirm={() => handleSinglePayout(confirmAction.appId!, confirmAction.jobId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "complete" && (
        <ConfirmDialog
          isOpen={true}
          title="作業おわりにしますか？"
          message="残りの参加者全員にお礼のポイントが支払われ、募集のステータスが完了になります。"
          confirmLabel="おわりにする"
          cancelLabel="まだおわっていない"
          onConfirm={() => handleComplete(confirmAction.jobId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}    </div>
  );
}

function DetailModal({
  dateStr,
  onClose,
  recruitmentJobsWithApps,
  volunteeredJobs,
  todayStr,
  onSetConfirmAction,
}: {
  dateStr: string;
  onClose: () => void;
  recruitmentJobsWithApps: { job: Job; applications: Application[] }[];
  volunteeredJobs: Job[];
  todayStr: string;
  onSetConfirmAction: (action: { type: string; appId?: string; jobId?: string }) => void;
}) {
  const formatDateJP = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${month}月${day}日(${dayOfWeek})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex justify-between items-start shrink-0">
            <h3 className="text-2xl font-black text-yui-green-800">
              {formatDateJP(dateStr)}
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-yui-earth-100 flex items-center justify-center text-yui-earth-500 hover:bg-yui-earth-200"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 自分の募集 - Recruitment jobs with applicants list */}
          {recruitmentJobsWithApps.length > 0 && (
            <>
              {recruitmentJobsWithApps.map(({ job, applications }) => {
                const approvedApps = applications.filter((a) => a.status === "approved");
                const isPayoutUnlocked = todayStr >= job.date;
                
                return (
                  <div key={job.id} className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden" style={{ borderColor: "#8c7361" }}>
                    <Link href={`/explore/${job.id}`} className="no-underline">
                      <div style={{ backgroundColor: "#8c7361" }} className="p-6 text-white hover:opacity-90 transition-opacity">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                          <span className="text-sm bg-white/20 font-bold px-3 py-1 rounded-full">
                            {getJobTypeLabel(job.type)}
                          </span>
                          {approvedApps.length >= job.requiredPeople && job.requiredPeople > 0 && (
                            <span className="text-sm bg-green-500 font-bold px-3 py-1 rounded-full text-white shadow-sm border border-green-400 ml-auto">人数達成</span>
                          )}
                        </div>
                        <h1 className="text-2xl font-bold">{job.title}</h1>
                        <p className="text-white mt-1 font-medium">{job.creatorName}さん</p>
                      </div>
                    </Link>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-yui-green-50 rounded-xl p-4 col-span-2">
                          <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                            <CalendarDays className="w-5 h-5" aria-hidden="true" />
                            <span className="text-sm font-bold">作業日と時間</span>
                          </div>
                          <p className="text-sm font-bold text-yui-green-800">
                            {job.date} &nbsp; {job.startTime}〜{job.endTime}
                          </p>
                        </div>

                        <div className="bg-yui-green-50 rounded-xl p-3 px-4 col-span-2 flex items-center justify-between gap-3">
                          <div className="min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                              <MapPin className="w-4 h-4" aria-hidden="true" />
                              <span className="text-sm font-bold">作業場所</span>
                            </div>
                            <p className="text-sm font-bold text-yui-green-800 line-clamp-2">
                              {job.location || "（未指定）"}
                            </p>
                          </div>
                        </div>

                        {job.requiredPeople > 0 && (
                          <div className="bg-yui-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                              <Users className="w-5 h-5" aria-hidden="true" />
                              <span className="text-sm font-bold">必要な人数</span>
                            </div>
                            <p className="text-sm font-bold text-yui-green-800">{job.requiredPeople}名</p>
                          </div>
                        )}

                        {job.equipmentNeeded && (
                          <div className="bg-yui-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                              <Wrench className="w-5 h-5" aria-hidden="true" />
                              <span className="text-sm font-bold">農機具</span>
                            </div>
                            <p className="text-sm font-bold text-yui-green-800 break-words line-clamp-2">{job.equipmentNeeded}</p>
                          </div>
                        )}

                        <div className={`bg-yui-accent/10 rounded-xl p-4 flex flex-col justify-center ${((job.requiredPeople > 0 && job.equipmentNeeded) || (!job.requiredPeople && !job.equipmentNeeded)) ? 'col-span-2 flex-row items-center justify-between' : ''}`}>
                          <div>
                            <div className="flex items-center gap-1.5 text-yui-accent mb-1">
                              <Coins className="w-5 h-5" aria-hidden="true" />
                              <span className="text-xs font-bold text-yui-earth-700">お礼のポイント</span>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xl font-bold text-yui-green-800">{getPointsPerPerson(job)}P</span>
                              <span className="text-[11px] font-bold text-yui-earth-500">
                                {job.tokenRatePerHour}P/時間
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {applications.length > 0 && (
                        <div className="border-t-2 border-dashed border-yui-green-100 pt-4 mt-4">
                          <h4 className="text-sm font-bold text-yui-green-800 mb-3">応募者管理</h4>
                          {!isPayoutUnlocked && approvedApps.length > 0 && (
                            <div className="rounded-xl border border-yui-earth-300 bg-yui-earth-50 px-4 py-3 text-sm font-bold text-yui-earth-700 mb-3">
                              支払いは作業日の当日から可能です（{job.date}）。
                            </div>
                          )}
                          {isPayoutUnlocked && approvedApps.length > 0 && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 mb-3">
                              本日の作業分です。参加者へのポイント支払いをお願いします。
                            </div>
                          )}
                          <div className="space-y-3">
                            {approvedApps.map((app) => (
                              <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-3 md:p-4 border border-yui-green-200 shadow-sm gap-3">
                                <div>
                                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-sm mb-1">確定</span>
                                  <p className="font-bold text-sm text-yui-green-800">{app.applicantName}さん</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => onSetConfirmAction({ type: "single-payout", appId: app.id, jobId: job.id })}
                                    disabled={!isPayoutUnlocked}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold transition-colors ${isPayoutUnlocked ? "bg-yui-green-100 text-yui-green-700 hover:bg-yui-green-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  >
                                    <Coins className="w-3.5 h-3.5" />
                                    <span className="text-xs">支払う</span>
                                  </button>
                                  <button
                                    onClick={() => onSetConfirmAction({ type: "reject", appId: app.id, jobId: job.id })}
                                    disabled={isPayoutUnlocked}
                                    className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${isPayoutUnlocked ? "text-gray-400 bg-gray-100 cursor-not-allowed" : "text-red-500 bg-red-50 hover:bg-red-100"}`}
                                    title={isPayoutUnlocked ? "当日はお断りできません" : "キャンセル"}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {approvedApps.length > 0 && (
                         <div className="flex justify-end pt-3">
                           <button
                             disabled={!isPayoutUnlocked}
                             className={`w-full sm:w-auto px-6 py-3 font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 ${isPayoutUnlocked ? "bg-yui-green-600 text-white hover:bg-yui-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                             onClick={() => onSetConfirmAction({ type: "complete", jobId: job.id })}
                           >
                             <CheckCircle2 className="w-4 h-4" />
                             全員に一括支払い（作業を完了する）
                           </button>
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 手伝いの予定 - Volunteering jobs */}
          {volunteeredJobs.length > 0 && (
            <>
              {volunteeredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden" style={{ borderColor: "#468065" }}>
                  {/* Header */}
                  <div style={{ backgroundColor: "#468065" }} className="p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                      <span className="text-sm bg-white/20 font-bold px-3 py-1 rounded-full">
                        {getJobTypeLabel(job.type)}
                      </span>
                    </div>
                    <h1 className="text-xl font-bold">{job.title}</h1>
                    <p className="text-white mt-1 font-medium">{job.creatorName}さん</p>
                  </div>

                  {/* 詳細情報 */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* 作業日と時間 */}
                      <div className="bg-yui-green-50 rounded-xl p-4 col-span-2">
                        <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                          <CalendarDays className="w-5 h-5" aria-hidden="true" />
                          <span className="text-xs font-bold">作業日と時間</span>
                        </div>
                        <p className="text-sm font-bold text-yui-green-800">
                          {job.date} &nbsp; {job.startTime}〜{job.endTime}
                        </p>
                      </div>

                      {/* 作業場所 */}
                      <div className="bg-yui-green-50 rounded-xl p-3 px-4 col-span-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                            <MapPin className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs font-bold">作業場所</span>
                          </div>
                          <p className="text-sm font-bold text-yui-green-800 line-clamp-2">
                            {job.location || "（未指定）"}
                          </p>
                        </div>
                      </div>

                      {/* 必要な人数 */}
                      {job.requiredPeople > 0 && (
                        <div className="bg-yui-green-50 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                            <Users className="w-5 h-5" aria-hidden="true" />
                            <span className="text-xs font-bold">必要な人数</span>
                          </div>
                          <p className="text-sm font-bold text-yui-green-800">{job.requiredPeople}名</p>
                        </div>
                      )}

                      {/* 農機具 */}
                      {job.equipmentNeeded && (
                        <div className="bg-yui-green-50 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                            <Wrench className="w-5 h-5" aria-hidden="true" />
                            <span className="text-xs font-bold">農機具</span>
                          </div>
                          <p className="text-sm font-bold text-yui-green-800 break-words line-clamp-2">{job.equipmentNeeded}</p>
                        </div>
                      )}

                      {/* ポイント情報 */}
                      <div className={`bg-yui-accent/10 rounded-xl p-4 flex flex-col justify-center ${((job.requiredPeople > 0 && job.equipmentNeeded) || (!job.requiredPeople && !job.equipmentNeeded)) ? 'col-span-2 flex-row items-center justify-between' : ''}`}>
                        <div>
                          <div className="flex items-center gap-1.5 text-yui-accent mb-1">
                            <Coins className="w-5 h-5" aria-hidden="true" />
                            <span className="text-xs font-bold text-yui-earth-700">お礼のポイント</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-bold text-yui-green-800">{getPointsPerPerson(job)}P</span>
                            <span className="text-[11px] font-bold text-yui-earth-500">
                              {job.tokenRatePerHour}P/時間
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 説明 */}
                    {job.description && (
                      <div className="pt-2">
                        <h3 className="text-sm font-bold text-yui-green-800 mb-2">作業の内容</h3>
                        <p className="text-sm text-yui-earth-600 leading-relaxed whitespace-pre-wrap" style={{ lineHeight: "1.8" }}>
                          {job.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {recruitmentJobsWithApps.length === 0 && volunteeredJobs.length === 0 && (
            <p className="text-center text-yui-earth-500 text-sm py-8">この日の予定はありません</p>
          )}
        </div>

        <div className="p-4 border-t border-yui-earth-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 text-yui-earth-700 font-bold rounded-xl hover:bg-yui-earth-50 transition-colors"
            style={{ minHeight: "44px" }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: React.ReactNode;
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
