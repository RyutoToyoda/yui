"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { demoGetJob, demoCreateApplication, demoGetApplicationsByJob, generateId, getJobTypeEmoji, getJobTypeLabel } from "@/lib/demo-data";
import { useParams, useRouter } from "next/navigation";
import { Coins, CalendarDays, Clock, Users, Wrench, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function JobDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  const jobId = params.id as string;
  const job = demoGetJob(jobId);

  if (!user || !job) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-400">募集が見つかりませんでした</p>
        <Link href="/explore" className="text-yui-green-600 font-medium mt-2 inline-block no-underline">
          ← 募集一覧に戻る
        </Link>
      </div>
    );
  }

  const existingApplications = demoGetApplicationsByJob(jobId);
  const alreadyApplied = existingApplications.some((a) => a.applicantId === user.uid);
  const isOwner = job.creatorId === user.uid;

  const handleApply = () => {
    setError("");
    if (!isAgreed) {
      setError("同意チェックボックスにチェックを入れてください");
      return;
    }
    demoCreateApplication({
      id: generateId(),
      jobId: job.id,
      applicantId: user.uid,
      applicantName: user.name,
      isAgreedToRules: true,
      status: "pending",
      createdAt: new Date(),
    });
    setApplied(true);
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-yui-green-600 font-medium text-sm hover:text-yui-green-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>

      {/* ジョブ詳細カード */}
      <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getJobTypeEmoji(job.type)}</span>
            <span className="text-xs bg-white/20 font-bold px-2.5 py-1 rounded-full">
              {getJobTypeLabel(job.type)}
            </span>
          </div>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <p className="text-yui-green-200 mt-1">{job.creatorName}</p>
        </div>

        {/* 詳細情報 */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yui-green-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-bold">作業日</span>
              </div>
              <p className="text-sm font-bold text-yui-green-800">{job.date}</p>
            </div>
            <div className="bg-yui-green-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">時間</span>
              </div>
              <p className="text-sm font-bold text-yui-green-800">{job.startTime}〜{job.endTime}</p>
            </div>
            {job.requiredPeople > 0 && (
              <div className="bg-yui-green-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold">必要人数</span>
                </div>
                <p className="text-sm font-bold text-yui-green-800">{job.requiredPeople}名</p>
              </div>
            )}
            {job.equipmentNeeded && (
              <div className="bg-yui-green-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <Wrench className="w-4 h-4" />
                  <span className="text-xs font-bold">機具</span>
                </div>
                <p className="text-sm font-bold text-yui-green-800">{job.equipmentNeeded}</p>
              </div>
            )}
          </div>

          {/* トークン情報 */}
          <div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-yui-earth-600 mb-1">報酬</p>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yui-accent" />
                <span className="text-2xl font-black text-yui-green-800">{job.totalTokens}</span>
                <span className="text-sm text-yui-earth-500">トークン</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-yui-earth-400">レート</p>
              <p className="text-sm font-bold text-yui-green-800">{job.tokenRatePerHour} / 時間</p>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <h3 className="text-sm font-bold text-yui-green-800 mb-2">作業内容</h3>
            <p className="text-sm text-yui-earth-600 leading-relaxed">{job.description}</p>
          </div>
        </div>
      </div>

      {/* 応募セクション */}
      {!isOwner && job.status === "open" && (
        <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 p-5">
          {applied || alreadyApplied ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-yui-green-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-yui-green-700">応募しました！</p>
              <p className="text-sm text-yui-earth-500 mt-1">
                募集者の承認をお待ちください
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-base font-bold text-yui-green-800 mb-3">このヘルプに応募する</h3>

              {/* 同意チェックボックス */}
              <div className="bg-yui-earth-50 rounded-xl p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-2 border-yui-green-400 text-yui-green-600 focus:ring-yui-green-500 shrink-0 accent-yui-green-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-yui-green-800">
                      相手の農園のやり方を尊重することに同意します
                    </p>
                    <p className="text-xs text-yui-earth-500 mt-1">
                      作業方法や手順は募集者の指示に従い、お互いを尊重して作業を行います。
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-yui-danger text-sm mb-3 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleApply}
                className="w-full py-3.5 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
              >
                応募する
              </button>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <div className="bg-yui-earth-100 rounded-xl p-4 text-center">
          <p className="text-sm text-yui-earth-500">これはあなたが作成した募集です</p>
          <Link
            href="/schedule"
            className="text-sm text-yui-green-600 font-medium mt-1 inline-block no-underline"
          >
            応募者の管理は「予定」から →
          </Link>
        </div>
      )}
    </div>
  );
}
