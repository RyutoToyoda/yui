"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fsGetJobsByUser,
  fsGetApplicationsByUser,
  fsGetApplicationsByJob,
  fsGetJob,
  fsUpdateApplication,
  fsUpdateJob,
  fsTransferTokens,
  fsCreateNotification,
  fsGetAvailabilitiesByUser,
  fsCreateAvailability,
  fsDeleteAvailability,
  getJobTypeEmoji,
  getJobTypeLabel,
} from "@/lib/firestore-service";
import type { Job, Application, Availability } from "@/types/firestore";
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
  ChevronLeft,
  X
} from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";

type Tab = "managing" | "upcoming" | "availability" | "history";

interface JobWithApps {
  job: Job;
  applications: Application[];
}

export default function SchedulePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("managing");
  const [confirmAction, setConfirmAction] = useState<{ type: string; appId?: string; jobId?: string; availId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [managingJobsWithApps, setManagingJobsWithApps] = useState<JobWithApps[]>([]);
  const [upcomingApps, setUpcomingApps] = useState<{ app: Application; job: Job }[]>([]);
  const [completedAppsWithJobs, setCompletedAppsWithJobs] = useState<{ app: Application; job: Job }[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  // カレンダー用ステート
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateForTime, setSelectedDateForTime] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [myJobs, myApps, myAvails] = await Promise.all([
      fsGetJobsByUser(user.uid),
      fsGetApplicationsByUser(user.uid),
      fsGetAvailabilitiesByUser(user.uid),
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
    setAvailabilities(myAvails.filter(a => a.date)); // 日付指定があるもののみ
    
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
    // 応募者に通知
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

  const handleComplete = async (applicationId: string, jobId: string) => {
    if (!applicationId || !jobId) return;
    const job = await fsGetJob(jobId);
    const apps = await fsGetApplicationsByJob(jobId);
    const app = apps.find((a) => a.id === applicationId);
    if (!job || !app) return;

    await fsTransferTokens(
      job.creatorId,
      app.applicantId,
      job.totalTokens,
      jobId,
      job.title
    );
    await fsUpdateApplication(applicationId, { status: "completed" });
    await fsUpdateJob(jobId, { status: "completed" });
    refreshUser();
    setConfirmAction(null);
    await loadData();
  };

  const handleToggleAvail = async (dateStr: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="ud-status-badge bg-blue-100 text-blue-800 border border-blue-300">
            <CircleDot className="w-3.5 h-3.5" aria-hidden="true" /> 募集中
          </span>
        );
      case "matched":
        return (
          <span className="ud-status-badge bg-green-100 text-green-800 border border-green-300">
            <CircleCheck className="w-3.5 h-3.5" aria-hidden="true" /> 手伝い手が決定
          </span>
        );
      default:
        return (
          <span className="ud-status-badge bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Loader className="w-3.5 h-3.5" aria-hidden="true" /> 進行中
          </span>
        );
    }
  };

  const tabs = [
    { key: "managing" as Tab, label: "自分の募集", count: managingJobsWithApps.length },
    { key: "upcoming" as Tab, label: "予定", count: upcomingApps.length },
    { key: "availability" as Tab, label: "空き日", count: availabilities.length },
    { key: "history" as Tab, label: "履歴", count: completedAppsWithJobs.length + completedJobs.length },
  ];

  const formatDateJP = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${month}月${day}日(${dayOfWeek})`;
  };

  // カレンダー生成
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

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">やることリスト</h1>

      {/* タブ - スクロール可能に */}
      <div className="flex bg-yui-green-50 rounded-xl p-0.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="表示を切りかえ">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-0 px-1 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500"
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
            style={{ minHeight: "44px" }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? "text-yui-green-500" : "text-yui-earth-400"
              }`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 管理中タブ */}
      {activeTab === "managing" && (
        <div className="space-y-4">
          {managingJobsWithApps.length === 0 ? (
            <EmptyState message="出した募集はありません" />
          ) : (
            managingJobsWithApps.map(({ job, applications }) => {
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
                      {getStatusBadge(job.status)}
                    </div>
                    <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                    <p className="text-sm text-yui-earth-500 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      {formatDateJP(job.date)} {job.startTime}〜{job.endTime}
                    </p>
                  </div>

                  {/* 応募者リスト */}
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
                                aria-label={`${app.applicantName}さんにお願いする`}
                                style={{ minHeight: "44px" }}
                              >
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                おねがい
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "reject", appId: app.id, jobId: job.id })}
                                className="flex items-center justify-center p-2 rounded-xl bg-yui-earth-100 text-yui-earth-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label={`${app.applicantName}さんをお断りする`}
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

                  {/* 承認済み作業者 */}
                  {approvedApps.length > 0 && (
                    <div className="p-5 border-t border-yui-green-100">
                      <p className="text-sm font-bold text-yui-green-800 mb-3">お願い済みの方</p>
                      {approvedApps.map((app) => (
                        <div key={app.id} className="flex items-center justify-between bg-green-50 rounded-xl p-4 mb-2 border border-green-200">
                          <div>
                            <p className="font-bold text-sm text-green-800">{app.applicantName}さん</p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> お願い済み
                            </p>
                          </div>
                          <button
                            onClick={() => setConfirmAction({ type: "complete", appId: app.id, jobId: job.id })}
                            className="px-4 py-2.5 bg-yui-green-600 text-white text-sm font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
                            style={{ minHeight: "44px" }}
                          >
                            作業おわり
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {applications.length === 0 && (
                    <div className="p-5 text-center text-sm text-yui-earth-500">
                      まだ手を挙げた方はいません
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 予定タブ */}
      {activeTab === "upcoming" && (
        <div className="space-y-3">
          {upcomingApps.length === 0 ? (
            <EmptyState message="予定はありません" link="/explore" linkText="お手伝い募集を探す" />
          ) : (
            upcomingApps.map(({ app, job }) => (
              <Link
                key={app.id}
                href={`/explore/${job.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm border-2 border-yui-green-100 no-underline hover:border-yui-green-300 transition-colors"
                aria-label={`${job.title} ${job.date}`}
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
            ))
          )}
        </div>
      )}

      {/* 手伝える日（カレンダー）タブ */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6">
            <h2 className="text-lg font-bold text-yui-green-800 mb-2 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" aria-hidden="true" />
              手伝える日をえらぶ
            </h2>
            <p className="text-sm text-yui-earth-600 mb-6" style={{ lineHeight: "1.7" }}>
              カレンダーの日付をタップして、お手伝いに行ける日を教えてください。ぴったりの募集があったらお知らせします ✨
            </p>

            {/* カレンダーヘッダー */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="w-12 h-12 rounded-full hover:bg-yui-earth-100 flex items-center justify-center transition-colors"
                aria-label="前の月へ"
              >
                <ChevronLeft className="w-6 h-6 text-yui-earth-600" aria-hidden="true" />
              </button>
              <span className="text-xl font-black text-yui-green-800 tracking-tight">
                {year}年 {month + 1}月
              </span>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="w-12 h-12 rounded-full hover:bg-yui-earth-100 flex items-center justify-center transition-colors"
                aria-label="次の月へ"
              >
                <ChevronRight className="w-6 h-6 text-yui-earth-600" aria-hidden="true" />
              </button>
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-2">
              {["日", "月", "火", "水", "木", "金", "土"].map(d => (
                <div key={d} className="text-center text-xs font-bold text-yui-earth-400 py-1">{d}</div>
              ))}
              {/* 空白埋め（初日まで） */}
              {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* 日付 */}
              {monthDays.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const isAvailable = availabilities.some(a => a.date === dateStr);
                const isToday = new Date().toISOString().split("T")[0] === dateStr;
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleToggleAvail(dateStr)}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isAvailable
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-yui-earth-50 text-yui-green-800 hover:bg-yui-earth-100"
                    } ${isToday ? "border-2 border-blue-400" : ""}`}
                    aria-label={`${date.getDate()}日 ${isAvailable ? "お手伝い可能（解除する）" : "お手伝い不可（登録する）"}`}
                    aria-pressed={isAvailable}
                    style={{ minHeight: "56px" }}
                  >
                    <span className="text-lg font-black">{date.getDate()}</span>
                    {isAvailable && (
                      <span className="text-[10px] font-bold mt-0.5">OK!</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 登録済みリスト（簡易表示） */}
          <div>
            <h3 className="text-sm font-bold text-yui-earth-500 mb-3 px-1">登録されている日</h3>
            <div className="space-y-2">
              {availabilities.slice(0, 5).map(avail => (
                <div key={avail.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-yui-green-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      {avail.date?.split("-")[2]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yui-green-800">{formatDateJP(avail.date!)}</p>
                      <p className="text-xs text-yui-earth-500">{avail.startTime}〜{avail.endTime} お手伝いできます</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAvail(avail.date!)}
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
      )}

      {/* 履歴タブ */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {completedAppsWithJobs.length === 0 && completedJobs.length === 0 ? (
            <EmptyState message="おわった作業はまだありません" />
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* 確認ダイアログ */}
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
          message="作業おわりにすると、お礼のポイントが自動で相手に届きます。"
          confirmLabel="おわりにする"
          cancelLabel="まだおわっていない"
          onConfirm={() => handleComplete(confirmAction.appId!, confirmAction.jobId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {/* 時間選択ダイアログ */}
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
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
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

function EmptyState({ message, link, linkText }: { message: string; link?: string; linkText?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm border-2 border-yui-green-100">
      <Clock className="w-10 h-10 text-yui-earth-300 mx-auto mb-2" aria-hidden="true" />
      <p className="text-yui-earth-500 font-medium">{message}</p>
      {link && linkText && (
        <Link href={link} className="text-sm text-yui-green-600 font-bold mt-2 inline-block no-underline" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
          {linkText} →
        </Link>
      )}
    </div>
  );
}
