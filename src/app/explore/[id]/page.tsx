"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJob, fsCreateApplication, fsGetApplicationsByJob, fsCreateNotification, fsUpdateJob, fsDeleteJob, fsCancelJob, fsCompleteJobTransaction, fsSubmitOwnerEvaluation, fsSubmitApplicantEvaluation, getJobTypeEmoji, getJobTypeLabel } from "@/lib/firestore-service";
import { useParams, useRouter } from "next/navigation";
import { Coins, CalendarDays, Clock, Users, Wrench, ArrowLeft, CheckCircle2, AlertTriangle, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import UserTrustProfileModal from "@/components/UserTrustProfileModal";
import type { Job, Application } from "@/types/firestore";
import {
  formatAddressByStatus,
  shouldShowMap,
  type AddressStatusType,
} from "@/lib/address-service";

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
  const [trustTarget, setTrustTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [ratingTargetAppId, setRatingTargetAppId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const jobId = params.id as string;

  const refreshPageData = async () => {
    if (!user) return;
    const [jobData, apps] = await Promise.all([
      fsGetJob(jobId),
      fsGetApplicationsByJob(jobId),
    ]);
    setJob(jobData);
    setAlreadyApplied(apps.some((a) => a.applicantId === user.uid));
    setApprovedApplicants(apps.filter((a) => a.status === "approved" || a.status === "completed"));
  };

  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid;
    let cancelled = false;
    async function loadData() {
      const [jobData, apps] = await Promise.all([
        fsGetJob(jobId),
        fsGetApplicationsByJob(jobId),
      ]);
      if (cancelled) return;
      setJob(jobData);
      setAlreadyApplied(apps.some((a) => a.applicantId === currentUid));
      setApprovedApplicants(apps.filter((a) => a.status === "approved" || a.status === "completed"));
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
  
  // ✅ マッチング状態を判定
  // - owner: 自分の募集
  // - matched: 承認済みの応募が存在する（マッチング確定）
  // - default: それ以外（未マッチ・応募前）
  const currentUserApplication = approvedApplicants.find(
    (app) => app.applicantId === user.uid
  );
  const addressStatus: AddressStatusType = isOwner
    ? "owner"
    : currentUserApplication
      ? "matched"
      : "default";

  const mapQuery =
    typeof job.locationLat === "number" && typeof job.locationLng === "number"
      ? `${job.locationLat},${job.locationLng}`
      : job.location;

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
      status: "approved",
      evaluation: null,
      ownerEvaluation: null,
      applicantEvaluation: null,
      ownerEvaluationDone: false,
      applicantEvaluationDone: false,
      createdAt: new Date(),
    });
    // Update job status to matched
    await fsUpdateJob(job.id, { status: "matched" });
    
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
    // 申し込み者に確認通知
    await fsCreateNotification({
      userId: user.uid,
      type: "approved",
      title: "✅ お手伝いが決まりました！",
      message: `「${job.title}」のお手伝いが決まりました。当日よろしくお願いします。`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
    setShowConfirm(false);
    setApplied(true);
    await refreshPageData();
  };

  const handleDeleteClick = () => {
    setCancelReason("");
    setCancelDetail("");
    setShowCancelModal(true);
  };

  const handleCompleteJob = async () => {
    if (!job || !isOwner) return;
    setCompleting(true);
    try {
      await fsCompleteJobTransaction(job.id);
      await refreshPageData();
    } catch (e) {
      console.error(e);
      alert("作業完了に失敗しました");
    } finally {
      setCompleting(false);
    }
  };

  const handleRateApplicant = async (applicationId: string, evaluation: "good" | "bad" | null) => {
    if (!job || !isOwner) return;
    setRatingTargetAppId(applicationId);
    try {
      await fsSubmitOwnerEvaluation(job.id, applicationId, user.uid, evaluation);
      setApprovedApplicants((prev) =>
        prev.map((app) => (
          app.id === applicationId
            ? { ...app, ownerEvaluation: evaluation, ownerEvaluationDone: true }
            : app
        ))
      );
    } catch (e) {
      console.error(e);
      alert("評価の保存に失敗しました");
    } finally {
      setRatingTargetAppId(null);
    }
  };

  const handleRateOwner = async (evaluation: "good" | "bad" | null) => {
    if (!job || !currentUserApplication) return;
    setRatingTargetAppId(currentUserApplication.id);
    try {
      await fsSubmitApplicantEvaluation(job.id, currentUserApplication.id, user.uid, evaluation);
      setApprovedApplicants((prev) =>
        prev.map((app) => (
          app.id === currentUserApplication.id
            ? { ...app, applicantEvaluation: evaluation, applicantEvaluationDone: true }
            : app
        ))
      );
    } catch (e) {
      console.error(e);
      alert("評価の保存に失敗しました");
    } finally {
      setRatingTargetAppId(null);
    }
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
    <div className="py-3 space-y-4">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-yui-green-600 font-bold text-base hover:text-yui-green-800 transition-colors"
        style={{ minHeight: "48px" }}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> もどる
      </button>

      {/* ジョブ詳細カード */}
      <div className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden" style={{ borderColor: job.creatorId === user?.uid ? "#8c7361" : "#468065" }}>
        {/* ヘッダー */}
        <div style={{ backgroundColor: job.creatorId === user?.uid ? "#8c7361" : "#468065" }} className="p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
            <span className="text-sm bg-white/20 font-bold px-3 py-1 rounded-full">
              {getJobTypeLabel(job.type)}
            </span>
          </div>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <button
            type="button"
            onClick={() => setTrustTarget({ userId: job.creatorId, userName: job.creatorName })}
            className="text-white mt-1 font-medium underline underline-offset-2"
          >
            {job.creatorName}さん
          </button>
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

            {/* 作業場所（スマートな横並び・地図ボタン付き） */}
            <div className="bg-yui-green-50 rounded-xl p-3 px-4 col-span-2 flex items-center justify-between gap-3">
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-bold">作業場所</span>
                </div>
                <p className="text-sm font-bold text-yui-green-800 line-clamp-2">
                  {formatAddressByStatus(job.location || "", addressStatus)}
                </p>
                {/* マッチング前の場合、プライバシー保護メッセージを表示 */}
                {addressStatus === "default" && (
                  <p className="text-xs text-yui-earth-500 mt-1">
                    🔒 マッチング後に詳細な住所と地図を表示します
                  </p>
                )}
              </div>
              {shouldShowMap(addressStatus) && mapQuery && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center justify-center px-3 py-1.5 bg-white text-yui-green-600 border border-yui-green-200 rounded-lg text-xs font-bold hover:bg-yui-green-50 transition-colors shadow-sm"
                  style={{ minHeight: "36px" }}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  地図で見る
                </a>
              )}
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

            {/* ポイント情報 (Grid内) */}
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
          <div className="pt-2">
            <h3 className="text-sm font-bold text-yui-green-800 mb-2">作業の内容</h3>
            <p className="text-sm text-yui-earth-600 leading-relaxed whitespace-pre-wrap" style={{ lineHeight: "1.8" }}>
              {job.description}
            </p>
          </div>

          {/* 応募セクション（メインカード内に統合） */}
          {!isOwner && job.status === "open" && (
            <div className="pt-5 mt-2 border-t border-yui-green-100">
              {applied || alreadyApplied ? (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-14 h-14 text-yui-success mx-auto mb-3" aria-hidden="true" />
                  <p className="text-lg font-bold text-yui-green-700">手を挙げました！</p>
                  <p className="text-sm text-yui-earth-600 mt-1">
                    募集した方からの連絡をお待ちください
                  </p>
                </div>
              ) : (
                <>
                  {/* 同意チェックボックス */}
                  <div className="bg-yui-earth-50 rounded-xl p-4 mb-4 border border-yui-earth-200">
                    <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: "48px" }}>
                      <input
                        type="checkbox"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-yui-green-400 text-yui-green-600 focus:ring-yui-green-500 shrink-0 accent-yui-green-600"
                      />
                      <span className="text-sm font-bold text-yui-green-800">
                        相手の農園のやり方を大切にすることに同意します
                      </span>
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

          {isOwner && job.status === "completed" && approvedApplicants.length > 0 && (
            <div className="pt-5 mt-2 border-t border-yui-green-100 space-y-3">
              <p className="text-sm font-bold text-yui-green-800">この手伝いはどうでしたか？</p>
              {approvedApplicants.map((app) => {
                const evaluated = app.ownerEvaluationDone;
                return (
                  <div key={app.id} className="bg-yui-earth-50 border border-yui-earth-200 rounded-xl p-3">
                    <button
                      type="button"
                      onClick={() => setTrustTarget({ userId: app.applicantId, userName: app.applicantName })}
                      className="text-sm font-bold text-yui-green-800 underline underline-offset-2"
                    >
                      {app.applicantName}さん
                    </button>

                    {evaluated ? (
                      <p className="text-sm text-yui-earth-700 mt-2">
                        評価済みです：{app.ownerEvaluation === "good" ? "👍" : app.ownerEvaluation === "bad" ? "👎" : "⏭️ スキップ"}
                      </p>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          disabled={ratingTargetAppId === app.id}
                          onClick={() => handleRateApplicant(app.id, "good")}
                          className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                          style={{ minHeight: "44px" }}
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          disabled={ratingTargetAppId === app.id}
                          onClick={() => handleRateApplicant(app.id, "bad")}
                          className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                          style={{ minHeight: "44px" }}
                        >
                          👎
                        </button>
                        <button
                          type="button"
                          disabled={ratingTargetAppId === app.id}
                          onClick={() => handleRateApplicant(app.id, null)}
                          className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                          style={{ minHeight: "44px" }}
                        >
                          ⏭️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isOwner && job.status === "completed" && currentUserApplication && (
            <div className="pt-5 mt-2 border-t border-yui-green-100 space-y-3">
              <p className="text-sm font-bold text-yui-green-800">{job.creatorName}さんの募集はどうでしたか？</p>
              {currentUserApplication.applicantEvaluationDone ? (
                <p className="text-sm text-yui-earth-700">
                  評価済みです：{currentUserApplication.applicantEvaluation === "good" ? "👍" : currentUserApplication.applicantEvaluation === "bad" ? "👎" : "⏭️ スキップ"}
                </p>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={ratingTargetAppId === currentUserApplication.id}
                    onClick={() => handleRateOwner("good")}
                    className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                    style={{ minHeight: "44px" }}
                  >
                    👍 よかった
                  </button>
                  <button
                    type="button"
                    disabled={ratingTargetAppId === currentUserApplication.id}
                    onClick={() => handleRateOwner("bad")}
                    className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                    style={{ minHeight: "44px" }}
                  >
                    👎 ミスマッチ
                  </button>
                  <button
                    type="button"
                    disabled={ratingTargetAppId === currentUserApplication.id}
                    onClick={() => handleRateOwner(null)}
                    className="px-4 py-2 rounded-lg border border-yui-green-200 text-sm font-bold disabled:opacity-60"
                    style={{ minHeight: "44px" }}
                  >
                    ⏭️ スキップ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
            {(job.status === "matched" || job.status === "in_progress") && approvedApplicants.length > 0 && (
              <button
                onClick={handleCompleteJob}
                disabled={completing}
                className="flex items-center justify-center gap-2 text-sm bg-yui-green-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-yui-green-700 disabled:opacity-60 transition-colors"
                style={{ minHeight: "44px" }}
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                ✅ 作業完了にする
              </button>
            )}
          </div>
        </div>
      )}

      <UserTrustProfileModal
        isOpen={!!trustTarget}
        onClose={() => setTrustTarget(null)}
        userId={trustTarget?.userId ?? ""}
        userName={trustTarget?.userName ?? ""}
      />

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
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${cancelReason === reason
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
