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
  getJobTypeEmoji,
  getJobTypeLabel,
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

  const handleReject = async (applicationId: string, jobId?: string) => {
    if (!applicationId) return;
    
    // Get application details to notify the applicant
    let applicantId: string | null = null;
    let jobTitle: string | null = null;
    
    try {
      if (jobId) {
        const apps = await fsGetApplicationsByJob(jobId);
        const app = apps.find((a) => a.id === applicationId);
        const job = await fsGetJob(jobId);
        if (app) applicantId = app.applicantId;
        if (job) jobTitle = job.title;
        
        // Update application status to rejected
        await fsUpdateApplication(applicationId, { status: "rejected" });
        
        // Check if there are any remaining approved applications
        const allApps = await fsGetApplicationsByJob(jobId);
        const hasApprovedApps = allApps.some((a) => a.status === "approved");
        
        // If no more approved applications, revert job status back to open
        if (!hasApprovedApps && job?.status === "matched") {
          await fsUpdateJob(jobId, { status: "open" });
        }
      }
    } catch (e) {
      console.error("Failed to get application/job details:", e);
    }
    
    // Send rejection notification to applicant
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
    const hasRecruitment = managingJobsWithApps.some(({ job }) => job.date === dateStr);
    const hasUpcoming = upcomingApps.some(({ job }) => job.date === dateStr);
    const hasHistory =
      completedJobs.some((job) => job.date === dateStr) ||
      completedAppsWithJobs.some(({ job }) => job.date === dateStr);
    const isPast = dateStr < todayStr;

    return {
      dateStr,
      day: date.getDate(),
      // 優先順位: 予定（volunteered）> 募集（recruitment）> 過去 > デフォルト
      tone: isPast ? "past" : hasUpcoming ? "volunteered" : hasRecruitment ? "recruitment" : "default",
      selected: selectedCalendarDate === dateStr,
      badges: isPast ? (hasHistory ? ["履歴"] : undefined) : hasUpcoming ? ["予定"] : hasRecruitment ? ["募集"] : undefined,
      ariaLabel: `${date.getDate()}日 ${isPast ? "過去日" : hasUpcoming ? "予定あり" : hasRecruitment ? "募集あり" : "未定"}`,
    };
  });

  const toggleExpandSection = (section: string) => {
    setExpandSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="py-3 space-y-4 pb-20">
      <h1 className="text-xl font-bold text-yui-green-800 flex items-center gap-2 mb-2">
        <CalendarDays className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
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
            onSelectDate={setSelectedCalendarDate}
          />
        </div>


      </div>

      {/* 重要通知 */}
      <section aria-labelledby="important-notice" className="space-y-3">
        <h2 id="important-notice" className="text-xl font-bold text-yui-green-800 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-yui-accent" aria-hidden="true" />
          お知らせ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importantNotifications.length > 0 ? (
            importantNotifications.map((notif) => (
              <div key={notif.id} className="bg-white rounded-2xl border-2 border-orange-200 p-4 shadow-sm">
                <p className="text-base font-bold text-yui-green-800">{notif.title}</p>
                <p className="text-sm text-yui-earth-600 mt-1 line-clamp-2">{notif.message}</p>
              </div>
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

      {/* Detail Modal - shows when clicking colored calendar date */}
      {selectedCalendarDate && (
        <DetailModal
          dateStr={selectedCalendarDate}
          onClose={() => setSelectedCalendarDate(null)}
          recruitmentJobsWithApps={managingJobsWithApps.filter(({ job }) => job.date === selectedCalendarDate)}
          volunteeredJobs={upcomingApps.filter(({ job }) => job.date === selectedCalendarDate).map(({ job }) => job)}
          onSetConfirmAction={setConfirmAction}
        />
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
          message="この方のお手伝いをお断りします。相手に通知が届きます。"
          confirmLabel="お断りする"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleReject(confirmAction.appId!, confirmAction.jobId)}
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

    </div>
  );
}

function DetailModal({
  dateStr,
  onClose,
  recruitmentJobsWithApps,
  volunteeredJobs,
  onSetConfirmAction,
}: {
  dateStr: string;
  onClose: () => void;
  recruitmentJobsWithApps: { job: Job; applications: Application[] }[];
  volunteeredJobs: Job[];
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
                
                return (
                  <div key={job.id} className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden" style={{ borderColor: "#8c7361" }}>
                    {/* Header */}
                    <div style={{ backgroundColor: "#8c7361" }} className="p-6 text-white">
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
                              <span className="text-xl font-bold text-yui-green-800">{job.totalTokens}P</span>
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

                      {/* Applicants Section */}
                      {approvedApps.length > 0 && (
                        <div className="border-t border-yui-green-100 pt-4 mt-4">
                          <h3 className="text-sm font-bold text-yui-green-800 mb-3">応募済み ({approvedApps.length}名)</h3>
                          <div className="space-y-2">
                            {approvedApps.map((app) => (
                              <div key={app.id} className="flex items-center justify-between bg-red-50 rounded-xl p-3 border border-red-200">
                                <div>
                                  <p className="font-bold text-sm text-yui-green-800">{app.applicantName}さん</p>
                                  <p className="text-xs text-yui-earth-500">
                                    {app.createdAt.toLocaleDateString("ja-JP")} に手を挙げた
                                  </p>
                                </div>
                                <button
                                  onClick={() => onSetConfirmAction({ type: "reject", appId: app.id, jobId: job.id })}
                                  className="flex items-center justify-center p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  style={{ minWidth: "40px", minHeight: "40px" }}
                                  title="応募を断る"
                                >
                                  <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                              </div>
                            ))}
                          </div>
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
                            <span className="text-xl font-bold text-yui-green-800">{job.totalTokens}P</span>
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
