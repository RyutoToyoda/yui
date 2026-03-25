"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJob, fsCreateApplication, fsGetApplicationsByJob, fsCreateNotification, fsUpdateJob, fsDeleteJob, fsCancelJob, getJobTypeEmoji, getJobTypeLabel, getPointsPerPerson, fsUpdateApplication, fsCompleteApplicationTransaction } from "@/lib/firestore-service";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Coins, CalendarDays, Clock, Users, Wrench, ArrowLeft, CheckCircle2, AlertTriangle, Trash2, MapPin, X, User } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Job, Application } from "@/types/firestore";

export default function JobDetailPage() {
  const { user, refreshUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAgreed, setIsAgreed] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cancellation states
  const [approvedApplicants, setApprovedApplicants] = useState<Application[]>([]);
  const [workedApplicants, setWorkedApplicants] = useState<Application[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDetail, setCancelDetail] = useState<string>("");

  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{ type: string; appId?: string } | null>(null);

  const jobId = params.id as string;
  const showRejectedFromNotification = searchParams.get("from") === "notification" && searchParams.get("result") === "rejected";

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
      const mine = apps.find((a) => a.applicantId === user!.uid && a.status !== "rejected") || null;
      setMyApplication(mine);
      setAlreadyApplied(!!mine);
      setApprovedApplicants(apps.filter((a) => a.status === "approved"));
      setWorkedApplicants(apps.filter((a) => a.status === "approved" || a.status === "completed"));
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [user, jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="loading-text text-yui-earth-500 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || !job) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500 text-base">募集が見つかりませんでした</p>
        <Link href="/explore" className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-yui-green-200 bg-white hover:bg-yui-green-50 hover:border-yui-green-400 transition-all text-yui-green-700 font-bold mt-4 shadow-sm no-underline">
          <ArrowLeft className="w-5 h-5" />
          募集の一覧にもどる
        </Link>
      </div>
    );
  }

  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isOwner = job.creatorId === user.uid;
  const isPayoutUnlocked = toLocalDateStr(new Date()) >= job.date;
  const isMyWorkCompleted = !!myApplication && (myApplication.status === "completed" || job.status === "completed");
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
      createdAt: new Date(),
    });
    
    // Update job status to matched if full or if it doesn't require a specific number of people
    const newApprovedCount = approvedApplicants.length + 1;
    if (job.requiredPeople === 0 || newApprovedCount >= job.requiredPeople) {
      await fsUpdateJob(job.id, { status: "matched" });
    }
    
    // 募集者に通知
    await fsCreateNotification({
      userId: job.creatorId,
      type: "application",
      title: "✋ 手を挙げてくれた方がいます",
      message: `${user.name}さんが応募`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
    // 申し込み者に確認通知
    await fsCreateNotification({
      userId: user.uid,
      type: "approved",
      title: "✅ お手伝いが決まりました！",
      message: `「${job.title}」確定`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
    setShowConfirm(false);
    setApplied(true);
  };

  const handleDeleteClick = () => {
    if (isPayoutUnlocked) {
      alert("募集のキャンセルは作業日前まで可能です。");
      return;
    }
    setCancelReason("");
    setCancelDetail("");
    setShowCancelModal(true);
  };

  const executeDeleteOrCancel = async () => {
    try {
      if (isPayoutUnlocked) {
        alert("募集のキャンセルは作業日前まで可能です。");
        return;
      }
      if (!cancelReason) {
        alert("キャンセル理由を選択してください");
        return;
      }
      await fsCancelJob(job!.id, user.uid, cancelReason, cancelDetail);
      router.push("/explore");
    } catch (e) {
      console.error(e);
      alert("処理に失敗しました：" + (e as Error).message);
    } finally {
      setShowCancelModal(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!job || !appId) return;
    if (isPayoutUnlocked) {
      alert("作業日当日はお断りできません。ポイント支払いで完了してください。");
      setConfirmAction(null);
      return;
    }
    let applicantId: string | null = null;

    try {
      const allApps = await fsGetApplicationsByJob(job.id);
      console.log("All applications for job:", allApps.map(a => ({ id: a.id, applicantId: a.applicantId, status: a.status })));
      const app = allApps.find((a) => a.id === appId);
      console.log("Found application to reject:", app);
      if (app) applicantId = app.applicantId;
      console.log("Applicant ID to notify:", applicantId);

      await fsUpdateApplication(appId, { status: "rejected" });

      const updatedApps = await fsGetApplicationsByJob(job.id);
      const approvedCount = updatedApps.filter((a) => a.status === "approved").length;

      if (approvedCount < job.requiredPeople && job.status === "matched") {
        await fsUpdateJob(job.id, { status: "open" });
      }

      // Reload data
      const apps = await fsGetApplicationsByJob(job.id);
      setApprovedApplicants(apps.filter((a) => a.status === "approved"));
      setWorkedApplicants(apps.filter((a) => a.status === "approved" || a.status === "completed"));
      const mine = apps.find((a) => a.applicantId === user.uid && a.status !== "rejected") || null;
      setMyApplication(mine);
      setAlreadyApplied(!!mine);
    } catch (e) {
      console.error("Failed to reject application:", e);
      alert("処理に失敗しました");
      setConfirmAction(null);
      return;
    }

    // Create notification separately with its own error handling
    if (applicantId) {
      try {
        console.log("Creating rejection notification for applicantId:", applicantId);
        await fsCreateNotification({
          userId: applicantId,
          type: "rejected",
          title: "❌ 応募が断られました",
          message: `「${job.title}」他の方が担当`,
          jobId: job.id,
          isRead: false,
          createdAt: new Date(),
        });
        console.log("Rejection notification created successfully");
      } catch (notifError) {
        console.error("Failed to create rejection notification:", notifError);
      }
    } else {
      console.warn("No applicantId found for rejection notification");
    }
    setConfirmAction(null);
  };

  const handleSinglePayout = async (appId: string) => {
    if (!job || !appId) return;
    if (!isPayoutUnlocked) {
      alert("ポイントの支払いは作業日の当日から可能です。");
      setConfirmAction(null);
      return;
    }
    try {
      await fsCompleteApplicationTransaction(job.id, appId);
      // Reload data
      const apps = await fsGetApplicationsByJob(job.id);
      setApprovedApplicants(apps.filter((a) => a.status === "approved"));
      setWorkedApplicants(apps.filter((a) => a.status === "approved" || a.status === "completed"));
      const mine = apps.find((a) => a.applicantId === user.uid && a.status !== "rejected") || null;
      setMyApplication(mine);
      setAlreadyApplied(!!mine);
      // Refresh user context to update points
      await refreshUser();
    } catch (e: any) {
      console.error("Individual payout error:", e);
      alert(`ポイントの決済に失敗しました。\n原因: ${e.message || "残高が不足している可能性があります。"}`);
    }
    setConfirmAction(null);
  };

  return (
    <div className="py-3 space-y-4">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-yui-green-200 bg-white hover:bg-yui-green-50 hover:border-yui-green-400 transition-all text-yui-green-700 font-bold shadow-sm inline-flex"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        もどる
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
          <p className="text-white mt-1 font-medium">{job.creatorName}さん</p>
        </div>

        {/* 詳細情報 */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* 作業日と時間 */}
            <div className="bg-yui-green-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                <CalendarDays className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-bold">作業日と時間</span>
              </div>
              <p className="text-base font-bold text-yui-green-800">
                {job.date} &nbsp; {job.startTime}〜{job.endTime}
              </p>
            </div>

            {/* 作業場所（スマートな横並び・地図ボタン付き） */}
            <div className="bg-yui-green-50 rounded-xl p-3 px-4 col-span-2 flex items-center justify-between gap-3">
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-bold">作業場所</span>
                </div>
                <p className="text-base font-bold text-yui-green-800 line-clamp-2">
                  {job.location || "（未指定）"}
                </p>
              </div>
              {mapQuery && (
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
                  <span className="text-sm font-bold">集まった人数</span>
                </div>
                <p className="text-base font-bold text-yui-green-800 flex items-baseline gap-1">
                  <span className="text-2xl">{approvedApplicants.length}</span>
                  <span className="text-sm text-yui-earth-600 font-bold mx-0.5">/</span>
                  <span className="text-lg">{job.requiredPeople}</span>
                  <span className="text-sm">名</span>
                </p>
              </div>
            )}

            {/* 農機具 */}
            {job.equipmentNeeded && (
              <div className="bg-yui-green-50 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-yui-green-600 mb-1">
                  <Wrench className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-bold">農機具</span>
                </div>
                <p className="text-base font-bold text-yui-green-800 break-words line-clamp-2">{job.equipmentNeeded}</p>
              </div>
            )}

            {/* ポイント情報 (Grid内) */}
            <div className={`bg-yui-accent/10 rounded-xl p-4 flex flex-col justify-center ${((job.requiredPeople > 0 && job.equipmentNeeded) || (!job.requiredPeople && !job.equipmentNeeded)) ? 'col-span-2 flex-row items-center justify-between' : ''}`}>
              <div>
                <div className="flex items-center gap-1.5 text-yui-accent mb-1">
                  <Coins className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-bold text-yui-earth-700">お礼のポイント</span>
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
          <div className="pt-2">
            <h3 className="text-base font-bold text-yui-green-800 mb-2">作業の内容</h3>
            <p className="text-base text-yui-earth-600 leading-relaxed whitespace-pre-wrap" style={{ lineHeight: "1.8" }}>
              {job.description}
            </p>
          </div>

          {/* 応募セクション（メインカード内に統合） */}
          {!isOwner && (
            <div className="public-job-apply-panel pt-5 mt-2 border-t border-yui-green-100">
              {showRejectedFromNotification ? (
                <div className="text-center py-2">
                  <AlertTriangle className="w-14 h-14 text-red-600 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-lg font-bold text-red-700">応募が断れました。</p>
                </div>
              ) : job.status === "cancelled" ? (
                <div className="text-center py-2">
                  <AlertTriangle className="w-14 h-14 text-red-600 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-lg font-bold text-red-700">この作業はキャンセルされました</p>
                </div>
              ) : isMyWorkCompleted ? (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-14 h-14 text-yui-success mx-auto mb-3" aria-hidden="true" />
                  <p className="text-lg font-bold text-yui-green-700">このお手伝いは完了しました</p>
                  <p className="text-sm text-yui-earth-600 mt-1">
                    お疲れさまでした。履歴に保存されています。
                  </p>
                </div>
              ) : (applied || alreadyApplied) ? (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-14 h-14 text-yui-success mx-auto mb-3" aria-hidden="true" />
                  <p className="text-lg font-bold text-yui-green-700">手を上げました！</p>
                  <p className="text-sm text-yui-earth-600 mt-1">
                    募集した方からの連絡をお待ちください
                  </p>
                </div>
              ) : (job.status === "open" || (job.status === "matched" && (job.requiredPeople === 0 || approvedApplicants.length < job.requiredPeople))) ? (
                <>
                  {/* 同意チェックボックス */}
                  <div className="apply-consent-box bg-yui-earth-50 rounded-xl px-4 py-1.5 mb-4 border border-yui-earth-200">
                    <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: "56px" }}>
                      <input
                        type="checkbox"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        className="w-6 h-6 rounded border-2 border-yui-green-400 text-yui-green-600 focus:ring-yui-green-500 shrink-0 accent-yui-green-600"
                      />
                      <span className="text-base font-bold text-yui-green-800">
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
                    className="apply-raise-hand-btn w-full py-4 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
                    style={{ minHeight: "56px" }}
                  >
                    手を挙げる
                  </button>
                </>
              ) : (
                <div className="text-center py-2 text-yui-earth-600 text-sm">
                  この募集は現在受け付けていません
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="owner-participant-panel bg-white rounded-2xl shadow-sm overflow-hidden">
          <div style={{ backgroundColor: "#8c7361" }} className="p-6 text-white">
            <h2 className="text-lg font-bold">参加者管理</h2>
          </div>

          <div className="p-5 space-y-4">
            {!isPayoutUnlocked && approvedApplicants.length > 0 && (
              <div className="rounded-xl border border-yui-earth-300 bg-yui-earth-50 px-4 py-3 text-sm font-bold text-yui-earth-700">
                支払いは作業日の当日から可能です（{job.date}）。
              </div>
            )}

            {isPayoutUnlocked && approvedApplicants.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                本日の作業分です。参加者へのポイント支払いをお願いします。
              </div>
            )}

            {workedApplicants.length > 0 ? (
              <div className="space-y-3">
                {workedApplicants.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-yui-earth-50 rounded-xl p-3 md:p-4 border border-yui-earth-200 shadow-sm gap-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-sm mb-1 ${app.status === "completed" ? "bg-yui-earth-200 text-yui-earth-700" : "bg-green-100 text-green-700"}`}>
                        {app.status === "completed" ? "支払い済み" : "確定"}
                      </span>
                      <p className="font-bold text-sm text-yui-green-800">{app.applicantName}さん</p>
                    </div>
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => router.push(`/user/${app.applicantId}`)}
                        className="hc-keep-standard flex items-center justify-center gap-1 flex-1 text-yui-green-600 px-3 py-2.5 bg-yui-green-50 rounded-xl hover:bg-yui-green-100 transition-colors font-bold border border-yui-green-200"
                        title="プロフィールを見る"
                      >
                        <User className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs">プロフィール表示</span>
                      </button>
                      {app.status === "approved" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmAction({ type: "single-payout", appId: app.id })}
                          disabled={!isPayoutUnlocked}
                          className={`hc-keep-standard flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold transition-colors border ${isPayoutUnlocked ? "bg-yui-green-100 text-yui-green-700 hover:bg-yui-green-200 border-yui-green-300" : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"}`}
                        >
                          <Coins className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="text-xs">支払う</span>
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: "reject", appId: app.id })}
                          disabled={isPayoutUnlocked}
                          className={`hc-keep-standard flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl transition-colors font-bold border ${isPayoutUnlocked ? "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed" : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"}`}
                          title={isPayoutUnlocked ? "当日はお断りできません" : "却下する"}
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs">断る</span>
                        </button>
                      </div>
                      ) : (
                        <div className="flex items-center px-3 py-2.5 rounded-xl bg-yui-earth-100 text-yui-earth-700 border border-yui-earth-200 text-xs font-bold">
                          支払い完了
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-yui-earth-600 text-base py-4">まだ参加者がいません</p>
            )}

            {job.status !== "completed" && (
              <div className="pt-3 mt-4 border-t border-yui-earth-200">
                <button
                  onClick={handleDeleteClick}
                  disabled={isPayoutUnlocked}
                  className={`hc-keep-standard w-full flex items-center justify-center gap-2 text-base font-bold px-4 py-3 rounded-xl transition-colors ${isPayoutUnlocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                  style={{ minHeight: "44px" }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  この募集をキャンセルする
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="手を挙げますか？"
        message={`「${job.title}」（${job.date}）に手を挙げます。相手に通知が届きます。`}
        titleClassName="apply-confirm-title"
        messageClassName="apply-confirm-message"
        confirmLabel="手を挙げる"
        confirmButtonClassName="bg-yui-green-600 text-white hover:bg-yui-green-700 active:bg-yui-green-800"
        cancelLabel="やめておく"
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Rejection Confirmation */}
      {confirmAction?.type === "reject" && (
        <ConfirmDialog
          isOpen={true}
          title="お断りしますか？"
          message="この方の応募をお断りします。相手に通知が届きます。"
          titleClassName="reject-confirm-title"
          messageClassName="reject-confirm-message"
          confirmLabel="断る"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleReject(confirmAction.appId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Payout Confirmation */}
      {confirmAction?.type === "single-payout" && (
        <ConfirmDialog
          isOpen={true}
          title="この方にポイントを支払いますか？"
          message="この方に個別でお礼のポイントを送信します。"
          titleClassName="single-payout-confirm-title"
          messageClassName="single-payout-confirm-message"
          confirmLabel="支払う"
          cancelLabel="キャンセル"
          onConfirm={() => handleSinglePayout(confirmAction.appId!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* キャンセル用の確認ダイアログ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="cancel-modal-title text-xl font-bold text-yui-green-800 mb-2">
                作業をキャンセルしますか？
              </h2>
              <p className="cancel-modal-message text-sm text-yui-earth-600 mb-4">
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
