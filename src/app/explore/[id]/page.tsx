"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJob, fsCreateApplication, fsGetApplicationsByJob, fsCreateNotification, fsDeleteJob, fsCancelJob, getJobTypeEmoji, getJobTypeLabel } from "@/lib/firestore-service";
import { useParams, useRouter } from "next/navigation";
import { Coins, CalendarDays, Clock, Users, Wrench, ArrowLeft, CheckCircle2, AlertTriangle, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Job, Application } from "@/types/firestore";

export default function JobDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cancellation states
  const [approvedApplicants, setApprovedApplicants] = useState<Application[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDetail, setCancelDetail] = useState<string>("");

  const jobId = params.id as string;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadData() {
      const [jobData, apps] = await Promise.all([
        fsGetJob(jobId),
        fsGetApplicationsByJob(jobId),
      ]);
      if (cancelled) return;
      setJob(jobData);
      setAlreadyApplied(apps.some((a) => a.applicantId === user!.uid));
      setApprovedApplicants(apps.filter((a) => a.status === "approved"));
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [user, jobId]);

  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  if (!user || !job) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500 text-base">募集が見つかりませんでした</p>
        <Link href="/explore" className="text-yui-green-600 font-bold mt-2 inline-block no-underline" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
          ← 募集の一覧にもどる
        </Link>
      </div>
    );
  }

  const isOwner = job.creatorId === user.uid;

  const handlePreApply = () => {
    setError("");
    if (!isAgreed) {
      setError("チェックボックスにチェックを入れてください");
      return;
    }
    setShowConfirm(true);
  };

  const handleApply = async () => {
    await fsCreateApplication({
      jobId: job.id,
      applicantId: user.uid,
      applicantName: user.name,
      isAgreedToRules: true,
      status: "pending",
      createdAt: new Date(),
    });
    // 募集者に通知
    await fsCreateNotification({
      userId: job.creatorId,
      type: "application",
      title: "✋ 手を挙げてくれた方がいます",
      message: `${user.name}さんが「${job.title}」に手を挙げました。`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
    setShowConfirm(false);
    setApplied(true);
  };

  const handleDeleteClick = () => {
    setCancelReason("");
    setCancelDetail("");
    setShowCancelModal(true);
  };

  const executeDeleteOrCancel = async () => {
    try {
      if (!cancelReason) {
        alert("キャンセル理由を選択してください");
        return;
      }
      await fsCancelJob(job.id, user.uid, cancelReason, cancelDetail);
      alert(approvedApplicants.length > 0
        ? "お手伝いの募集をキャンセルしました。応募者に通知を送りました。"
        : "募集をキャンセルしました");
      router.push("/explore");
    } catch (e) {
      console.error(e);
      alert("処理に失敗しました：" + (e as Error).message);
    } finally {
      setShowCancelModal(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-yui-green-600 font-bold text-base hover:text-yui-green-800 transition-colors"
        style={{ minHeight: "48px" }}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> もどる
      </button>

      {/* ジョブ詳細カード */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
            <span className="text-sm bg-white/20 font-bold px-3 py-1 rounded-full">
              {getJobTypeLabel(job.type)}
            </span>
          </div>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <p className="text-yui-green-200 mt-1 font-medium">{job.creatorName}さん</p>
        </div>

        {/* 詳細情報 */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yui-green-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <CalendarDays className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-bold">作業する日</span>
              </div>
              <p className="text-sm font-bold text-yui-green-800">{job.date}</p>
            </div>
            <div className="bg-yui-green-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <Clock className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-bold">時間</span>
              </div>
              <p className="text-sm font-bold text-yui-green-800">{job.startTime}〜{job.endTime}</p>
            </div>
            {job.requiredPeople > 0 && (
              <div className="bg-yui-green-50 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <Users className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs font-bold">必要な人数</span>
                </div>
                <p className="text-sm font-bold text-yui-green-800">{job.requiredPeople}名</p>
              </div>
            )}
            {job.equipmentNeeded && (
              <div className="bg-yui-green-50 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <Wrench className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs font-bold">農機具</span>
                </div>
                <p className="text-sm font-bold text-yui-green-800">{job.equipmentNeeded}</p>
              </div>
            )}
            <div className="bg-yui-green-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-bold">作業場所</span>
              </div>
              <p className="text-sm font-bold text-yui-green-800">{job.location || "（未指定）"}</p>
              {job.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 bg-white text-yui-green-600 border-2 border-yui-green-200 rounded-xl text-sm font-bold hover:bg-yui-green-50 transition-colors shadow-sm"
                  style={{ minHeight: "44px" }}
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  地図で見る
                </a>
              )}
            </div>
          </div>

          {/* ポイント情報 */}
          <div className="bg-yui-accent/10 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-yui-earth-700 mb-1">お礼のポイント</p>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yui-accent" aria-hidden="true" />
                <span className="text-2xl font-black text-yui-green-800">{job.totalTokens}</span>
                <span className="text-sm text-yui-earth-600 font-medium">ポイント</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-yui-earth-500 font-medium">1時間あたり</p>
              <p className="text-sm font-bold text-yui-green-800">{job.tokenRatePerHour}P</p>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <h3 className="text-sm font-bold text-yui-green-800 mb-2">作業の内容</h3>
            <p className="text-sm text-yui-earth-600 leading-relaxed" style={{ lineHeight: "1.8" }}>{job.description}</p>
          </div>
        </div>
      </div>

      {/* 応募セクション */}
      {!isOwner && job.status === "open" && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-5">
          {applied || alreadyApplied ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-yui-success mx-auto mb-3" aria-hidden="true" />
              <p className="text-lg font-bold text-yui-green-700">手を挙げました！</p>
              <p className="text-sm text-yui-earth-600 mt-1">
                募集した方からの連絡をお待ちください
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-base font-bold text-yui-green-800 mb-3">このお手伝いに手を挙げる</h3>

              {/* 同意チェックボックス */}
              <div className="bg-yui-earth-50 rounded-xl p-5 mb-4">
                <label className="flex items-start gap-3 cursor-pointer" style={{ minHeight: "48px" }}>
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="w-6 h-6 mt-0.5 rounded border-2 border-yui-green-400 text-yui-green-600 focus:ring-yui-green-500 shrink-0 accent-yui-green-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-yui-green-800">
                      相手の農園のやり方を大切にすることに同意します
                    </p>
                    <p className="text-xs text-yui-earth-600 mt-1" style={{ lineHeight: "1.7" }}>
                      作業のやり方は募集した方にしたがい、おたがいを大切にして作業します。
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-yui-danger text-sm mb-3 bg-red-50 p-4 rounded-xl border-2 border-red-200" role="alert">
                  <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              <button
                onClick={handlePreApply}
                className="w-full py-4 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
                style={{ minHeight: "56px" }}
              >
                手を挙げる
              </button>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <div className="bg-yui-earth-100 rounded-xl p-5 text-center">
          <p className="text-sm text-yui-earth-600 font-medium">これはあなたが作った募集です</p>
          <div className="flex flex-col gap-3 mt-4">
            <Link
              href="/schedule"
              className="text-sm bg-white text-yui-green-600 border border-yui-green-200 font-bold px-4 py-3 rounded-xl no-underline hover:bg-yui-green-50 transition-colors"
              style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              手を挙げてくれた方の確認は「予定」から →
            </Link>
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center gap-2 text-sm bg-red-50 text-red-600 font-bold px-4 py-3 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
              この募集をキャンセルする
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="手を挙げますか？"
        message={`「${job.title}」（${job.date}）に手を挙げます。相手に通知が届きます。`}
        confirmLabel="手を挙げる"
        cancelLabel="やめておく"
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
      />

      {/* キャンセル用の確認ダイアログ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-yui-green-800 mb-2">
                作業をキャンセルしますか？
              </h2>
              <p className="text-sm text-yui-earth-600 mb-4">
                {approvedApplicants.length > 0
                  ? "応募者全員にキャンセル通知が届きます。"
                  : "この募集をキャンセルします。"}
                キャンセル理由を選択してください。
              </p>

              {/* 理由選択（ラジオボタン） */}
              <div className="space-y-3 mb-4">
                {["悪天候", "体調不良", "作業内容変更", "その他"].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      cancelReason === reason
                        ? "border-yui-green-500 bg-yui-green-50"
                        : "border-slate-200 hover:border-yui-green-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => { setCancelReason(e.target.value); setCancelDetail(""); }}
                      className="w-5 h-5 accent-yui-green-600"
                    />
                    <span className={`font-bold ${cancelReason === reason ? "text-yui-green-800" : "text-slate-700"}`}>
                      {reason}
                    </span>
                  </label>
                ))}
              </div>

              {/* 「その他」選択時の自由入力 */}
              {cancelReason === "その他" && (
                <div className="mb-4">
                  <textarea
                    value={cancelDetail}
                    onChange={(e) => setCancelDetail(e.target.value)}
                    placeholder="キャンセル理由を入力してください"
                    rows={3}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-yui-green-400 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  style={{ minHeight: "48px" }}
                >
                  閉じる
                </button>
                <button
                  onClick={executeDeleteOrCancel}
                  disabled={!cancelReason || (cancelReason === "その他" && !cancelDetail.trim())}
                  className="flex-1 py-3 text-white font-bold bg-red-500 rounded-xl hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  style={{ minHeight: "48px" }}
                >
                  キャンセルする
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
