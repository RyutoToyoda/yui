"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  demoGetJobsByUser,
  demoGetApplicationsByUser,
  demoGetApplicationsByJob,
  demoGetJob,
  demoUpdateApplication,
  demoUpdateJob,
  demoTransferTokens,
  getJobTypeEmoji,
  getJobTypeLabel,
} from "@/lib/demo-data";
import { CheckCircle2, XCircle, Clock, Coins, ChevronRight, CalendarDays, CircleDot, CircleCheck, Loader } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";

type Tab = "managing" | "upcoming" | "history";

export default function SchedulePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("managing");
  const [confirmAction, setConfirmAction] = useState<{ type: string; appId: string; jobId: string } | null>(null);

  if (!user) return null;

  const myJobs = demoGetJobsByUser(user.uid);
  const myApplications = demoGetApplicationsByUser(user.uid);

  const managingJobs = myJobs.filter((j) => j.status === "open" || j.status === "matched" || j.status === "in_progress");
  const upcomingApps = myApplications.filter((a) => a.status === "approved");
  const completedApps = myApplications.filter((a) => a.status === "completed");
  const completedJobs = myJobs.filter((j) => j.status === "completed");

  const handleApprove = (applicationId: string, jobId: string) => {
    demoUpdateApplication(applicationId, { status: "approved" });
    demoUpdateJob(jobId, { status: "matched" });
    setConfirmAction(null);
  };

  const handleReject = (applicationId: string) => {
    demoUpdateApplication(applicationId, { status: "rejected" });
    setConfirmAction(null);
  };

  const handleComplete = (applicationId: string, jobId: string) => {
    const job = demoGetJob(jobId);
    const app = demoGetApplicationsByJob(jobId).find((a) => a.id === applicationId);
    if (!job || !app) return;

    demoTransferTokens(
      job.creatorId,
      app.applicantId,
      job.totalTokens,
      jobId,
      job.title
    );
    demoUpdateApplication(applicationId, { status: "completed" });
    demoUpdateJob(jobId, { status: "completed" });
    refreshUser();
    setConfirmAction(null);
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
    { key: "managing" as Tab, label: "自分の募集", count: managingJobs.length },
    { key: "upcoming" as Tab, label: "お手伝い予定", count: upcomingApps.length },
    { key: "history" as Tab, label: "おわった作業", count: completedApps.length + completedJobs.length },
  ];

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">やることリスト</h1>

      {/* タブ */}
      <div className="flex bg-yui-green-50 rounded-xl p-1" role="tablist" aria-label="表示を切りかえ">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
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
              <span className={`ml-1 text-xs font-bold ${
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
          {managingJobs.length === 0 ? (
            <EmptyState message="出した募集はありません" />
          ) : (
            managingJobs.map((job) => {
              const applications = demoGetApplicationsByJob(job.id);
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
                      {job.date} {job.startTime}〜{job.endTime}
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
                                お願いする
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "reject", appId: app.id, jobId: job.id })}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-100 text-red-600 font-bold text-xs hover:bg-red-200 transition-colors"
                                aria-label={`${app.applicantName}さんをお断りする`}
                                style={{ minHeight: "44px" }}
                              >
                                <XCircle className="w-5 h-5" aria-hidden="true" />
                                お断り
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
            upcomingApps.map((app) => {
              const job = demoGetJob(app.jobId);
              if (!job) return null;
              return (
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
                        {job.date} {job.startTime}〜{job.endTime}
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
              );
            })
          )}
        </div>
      )}

      {/* 履歴タブ */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {completedApps.length === 0 && completedJobs.length === 0 ? (
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
                    <CalendarDays className="w-4 h-4" aria-hidden="true" /> {job.date}
                  </p>
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
          confirmLabel="お願いする"
          cancelLabel="まだ決めない"
          onConfirm={() => handleApprove(confirmAction.appId, confirmAction.jobId)}
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
          onConfirm={() => handleReject(confirmAction.appId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "complete" && (
        <ConfirmDialog
          isOpen={true}
          title="作業おわりにしますか？"
          message="作業おわりにすると、お礼のポイントが自動で相手に届きます。"
          confirmLabel="作業おわりにする"
          cancelLabel="まだおわっていない"
          onConfirm={() => handleComplete(confirmAction.appId, confirmAction.jobId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
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
