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
import { CheckCircle2, XCircle, Clock, Coins, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "managing" | "upcoming" | "history";

export default function SchedulePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("managing");

  if (!user) return null;

  const myJobs = demoGetJobsByUser(user.uid);
  const myApplications = demoGetApplicationsByUser(user.uid);

  // 管理中: 自分が作成した募集中/マッチング中のジョブ
  const managingJobs = myJobs.filter((j) => j.status === "open" || j.status === "matched" || j.status === "in_progress");
  // 予定: 自分が応募して承認済み
  const upcomingApps = myApplications.filter((a) => a.status === "approved");
  // 履歴: 完了済み
  const completedApps = myApplications.filter((a) => a.status === "completed");
  const completedJobs = myJobs.filter((j) => j.status === "completed");

  const handleApprove = (applicationId: string, jobId: string) => {
    demoUpdateApplication(applicationId, { status: "approved" });
    demoUpdateJob(jobId, { status: "matched" });
  };

  const handleReject = (applicationId: string) => {
    demoUpdateApplication(applicationId, { status: "rejected" });
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
  };

  const tabs = [
    { key: "managing" as Tab, label: "自分の募集", count: managingJobs.length },
    { key: "upcoming" as Tab, label: "お手伝い予定", count: upcomingApps.length },
    { key: "history" as Tab, label: "履歴", count: completedApps.length + completedJobs.length },
  ];

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">やることリスト</h1>

      {/* タブ */}
      <div className="flex bg-yui-green-50 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 text-xs ${
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
                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-yui-green-100 overflow-hidden">
                  <div className="p-4 border-b border-yui-green-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getJobTypeEmoji(job.type)}</span>
                      <span className="text-xs bg-yui-green-100 text-yui-green-700 font-bold px-2 py-0.5 rounded-full">
                        {getJobTypeLabel(job.type)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        job.status === "open" ? "bg-blue-100 text-blue-700" :
                        job.status === "matched" ? "bg-green-100 text-green-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {job.status === "open" ? "募集中" : job.status === "matched" ? "手伝い手が決定" : "進行中"}
                      </span>
                    </div>
                    <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                    <p className="text-sm text-yui-earth-400 mt-0.5">
                      📅 {job.date} {job.startTime}〜{job.endTime}
                    </p>
                  </div>

                  {/* 応募者リスト */}
                  {pendingApps.length > 0 && (
                    <div className="p-4">
                      <p className="text-sm font-bold text-yui-green-800 mb-2">
                        返事待ち ({pendingApps.length}名)
                      </p>
                      <div className="space-y-2">
                        {pendingApps.map((app) => (
                          <div key={app.id} className="flex items-center justify-between bg-yui-earth-50 rounded-lg p-3">
                            <div>
                              <p className="font-bold text-sm text-yui-green-800">{app.applicantName}</p>
                              <p className="text-xs text-yui-earth-400">
                                {app.createdAt.toLocaleDateString("ja-JP")} に応募
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(app.id, job.id)}
                                className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(app.id)}
                                className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 承認済み作業者 */}
                  {approvedApps.length > 0 && (
                    <div className="p-4 border-t border-yui-green-50">
                      <p className="text-sm font-bold text-yui-green-800 mb-2">お願い済み</p>
                      {approvedApps.map((app) => (
                        <div key={app.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3 mb-2">
                          <div>
                            <p className="font-bold text-sm text-green-800">{app.applicantName}</p>
                            <p className="text-xs text-green-600">✅ お願い済み</p>
                          </div>
                          <button
                            onClick={() => handleComplete(app.id, job.id)}
                            className="px-3 py-1.5 bg-yui-green-600 text-white text-xs font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
                          >
                            完了報告
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {applications.length === 0 && (
                    <div className="p-4 text-center text-sm text-yui-earth-400">
                      まだ応募はありません
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
            <EmptyState message="予定はありません" link="/explore" linkText="ヘルプ募集を探す" />
          ) : (
            upcomingApps.map((app) => {
              const job = demoGetJob(app.jobId);
              if (!job) return null;
              return (
                <Link
                  key={app.id}
                  href={`/explore/${job.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm border border-yui-green-100 no-underline hover:border-yui-green-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getJobTypeEmoji(job.type)}</span>
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                          お願い済み
                        </span>
                      </div>
                      <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                      <p className="text-sm text-yui-earth-400 mt-0.5">
                        📅 {job.date} {job.startTime}〜{job.endTime}
                      </p>
                      <p className="text-sm text-yui-earth-500 mt-0.5">{job.creatorName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yui-accent" />
                      <span className="font-bold text-yui-green-800">{job.totalTokens}</span>
                      <ChevronRight className="w-4 h-4 text-yui-earth-400" />
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
            <EmptyState message="完了した作業はまだありません" />
          ) : (
            <>
              {completedJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-4 shadow-sm border border-yui-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getJobTypeEmoji(job.type)}</span>
                    <span className="text-xs bg-yui-earth-200 text-yui-earth-600 font-bold px-2 py-0.5 rounded-full">
                      完了
                    </span>
                  </div>
                  <h3 className="font-bold text-yui-green-800">{job.title}</h3>
                  <p className="text-sm text-yui-earth-400">{job.date}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, link, linkText }: { message: string; link?: string; linkText?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-yui-green-100">
      <Clock className="w-10 h-10 text-yui-earth-300 mx-auto mb-2" />
      <p className="text-yui-earth-400">{message}</p>
      {link && linkText && (
        <Link href={link} className="text-sm text-yui-green-600 font-medium mt-2 inline-block no-underline">
          {linkText} →
        </Link>
      )}
    </div>
  );
}
