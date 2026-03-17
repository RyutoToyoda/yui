"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  fsFetchNotifications,
  fsGetApplicationsByUser,
  fsGetJob,
  fsGetTransactionsByUser,
  fsUpdateUser,
} from "@/lib/firestore-service";
import MultiSelectTag from "@/components/MultiSelectTag";
import { EQUIPMENT_MASTER } from "@/lib/equipment-data";
import type { Application, EquipmentSpec, Notification } from "@/types/firestore";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  Clock3,
  Coins,
  Search,
  Settings,
  Sprout,
  Tractor,
} from "lucide-react";

const EQUIPMENT_PRESETS = ["トラクター", "軽トラック", "草刈機", "コンバイン", "田植え機", "軽バン", "動噴"];
const CROP_PRESETS = ["米", "トマト", "きゅうり", "ナス", "キャベツ", "りんご", "ぶどう", "みかん", "いちご", "ねぎ"];

type UpcomingPlan = {
  id: string;
  jobId: string;
  title: string;
  partnerName: string;
  date: string;
  startTime: string;
  endTime: string;
};

type ActivityItem = {
  id: string;
  createdAt: Date;
  title: string;
  detail: string;
  tone: "plus" | "minus" | "neutral";
};

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time || "00:00"}:00`);
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const [upcomingPlans, setUpcomingPlans] = useState<UpcomingPlan[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [importantNotifications, setImportantNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [specTarget, setSpecTarget] = useState<string | null>(null);
  const [specHorsepower, setSpecHorsepower] = useState("");
  const [specAttachments, setSpecAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;

    async function loadData() {
      try {
        const [apps, txns, notifications] = await Promise.all([
          fsGetApplicationsByUser(currentUser.uid),
          fsGetTransactionsByUser(currentUser.uid),
          fsFetchNotifications(currentUser.uid, 30),
        ]);

        if (cancelled) return;

        const approvedApps = apps.filter((app) => app.status === "approved");
        const upcomingPairs = await Promise.all(
          approvedApps.map(async (app) => {
            const job = await fsGetJob(app.jobId);
            if (!job) return null;
            return { app, job };
          })
        );

        if (cancelled) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = upcomingPairs
          .filter((pair): pair is { app: Application; job: NonNullable<Awaited<ReturnType<typeof fsGetJob>>> } => Boolean(pair))
          .filter(({ job }) => toDateTime(job.date, job.startTime) >= today)
          .sort((a, b) => toDateTime(a.job.date, a.job.startTime).getTime() - toDateTime(b.job.date, b.job.startTime).getTime())
          .slice(0, 3)
          .map(({ app, job }) => ({
            id: app.id,
            jobId: job.id,
            title: job.title,
            partnerName: job.creatorName,
            date: job.date,
            startTime: job.startTime,
            endTime: job.endTime,
          }));

        const appActivities: ActivityItem[] = apps.slice(0, 4).map((app) => {
          const statusLabel =
            app.status === "approved"
              ? "参加が確定しました"
              : app.status === "pending"
              ? "返答待ちです"
              : app.status === "completed"
              ? "作業が完了しました"
              : "結果を確認してください";

          return {
            id: `app-${app.id}`,
            createdAt: app.createdAt,
            title: "募集へのやり取り",
            detail: statusLabel,
            tone: app.status === "approved" || app.status === "completed" ? "plus" : "neutral",
          };
        });

        const transactionActivities: ActivityItem[] = txns.slice(0, 4).map((txn) => {
          const isIncome = txn.toUserId === currentUser.uid;
          return {
            id: `txn-${txn.id}`,
            createdAt: txn.createdAt,
            title: txn.description || "ポイントのやり取り",
            detail: isIncome ? `${txn.fromUserName}さんから受け取り` : `${txn.toUserName}さんへ支払い`,
            tone: isIncome ? "plus" : "minus",
          };
        });

        const combinedActivities = [...appActivities, ...transactionActivities]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

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

        setUpcomingPlans(upcoming);
        setRecentActivities(combinedActivities);
        setImportantNotifications(actionableNotifs);
      } catch (error) {
        console.error("ホーム情報の取得に失敗:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const handleAddEquipment = async (eqName: string) => {
    const trimmed = eqName.trim();
    if (!trimmed || user.equipmentList?.includes(trimmed)) return;

    const master = EQUIPMENT_MASTER.find((item) => item.name === trimmed);
    if (master?.hasSpecs && !specTarget) {
      setSpecTarget(trimmed);
      setSpecHorsepower("");
      setSpecAttachments([]);
      return;
    }

    const updatedEquipment = [...(user.equipmentList || []), trimmed];
    let updatedSpecs = user.equipmentSpecs || [];

    if (master?.hasSpecs && specTarget === trimmed) {
      const newSpec: EquipmentSpec = {
        equipmentId: master.id,
        horsepower: specHorsepower || undefined,
        attachments: specAttachments.length > 0 ? specAttachments : undefined,
      };
      updatedSpecs = [...updatedSpecs, newSpec];
    }

    await fsUpdateUser(user.uid, {
      equipmentList: updatedEquipment,
      equipmentSpecs: updatedSpecs,
    });

    await refreshUser();
    setSpecTarget(null);
    setSpecHorsepower("");
    setSpecAttachments([]);
  };

  const handleRemoveEquipment = async (index: number) => {
    const target = user.equipmentList?.[index];
    const updatedEquipment = (user.equipmentList || []).filter((_, i) => i !== index);
    let updatedSpecs = user.equipmentSpecs || [];

    if (target) {
      const master = EQUIPMENT_MASTER.find((item) => item.name === target);
      if (master) {
        updatedSpecs = updatedSpecs.filter((spec) => spec.equipmentId !== master.id);
      }
    }

    await fsUpdateUser(user.uid, {
      equipmentList: updatedEquipment,
      equipmentSpecs: updatedSpecs,
    });
    await refreshUser();
  };

  const handleAddCrop = async (cropName: string) => {
    const trimmed = cropName.trim();
    if (!trimmed || user.crops?.includes(trimmed)) return;

    const updated = [...(user.crops || []), trimmed];
    await fsUpdateUser(user.uid, { crops: updated });
    await refreshUser();
  };

  const handleRemoveCrop = async (index: number) => {
    const updated = (user.crops || []).filter((_, i) => i !== index);
    await fsUpdateUser(user.uid, { crops: updated });
    await refreshUser();
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  const primaryPlan = upcomingPlans[0];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800">マイページ</h1>
        <Link
          href="/schedule"
          className="text-base font-bold text-yui-green-700 no-underline hover:text-yui-green-800"
          style={{ minHeight: "48px", display: "inline-flex", alignItems: "center" }}
        >
          予定を開く
        </Link>
      </div>

      <section aria-labelledby="upcoming-section" className="space-y-3">
        <h2 id="upcoming-section" className="text-xl md:text-2xl font-bold text-yui-green-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
          今後の予定
        </h2>

        {primaryPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/schedule"
              className="md:col-span-2 block gradient-primary rounded-3xl p-6 md:p-7 text-white no-underline"
              aria-label="直近の予定を確認"
            >
              <p className="text-sm md:text-base text-white/80 font-bold">直近の確定予定</p>
              <h3 className="mt-1 text-2xl md:text-3xl font-black leading-snug">{primaryPlan.title}</h3>
              <p className="mt-2 text-lg md:text-xl font-bold">
                {primaryPlan.date} {primaryPlan.startTime}〜{primaryPlan.endTime}
              </p>
              <p className="mt-1 text-base text-white/85">{primaryPlan.partnerName}さんの募集</p>
              <span className="inline-flex items-center gap-1 mt-4 text-base font-bold text-white/90">
                予定の一覧へ
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </span>
            </Link>

            <div className="bg-white rounded-3xl p-5 border-2 border-yui-green-100">
              <p className="text-sm text-yui-earth-500 font-bold mb-2">次の予定</p>
              <div className="space-y-2">
                {upcomingPlans.slice(1).length > 0 ? (
                  upcomingPlans.slice(1).map((plan) => (
                    <div key={plan.id} className="rounded-xl bg-yui-green-50 px-3 py-3">
                      <p className="text-sm font-bold text-yui-green-800 line-clamp-1">{plan.title}</p>
                      <p className="text-xs text-yui-earth-600 mt-0.5">{plan.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-yui-earth-500">直近の予定は1件です。</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border-2 border-yui-green-100 text-center">
            <Clock3 className="w-9 h-9 text-yui-earth-400 mx-auto" aria-hidden="true" />
            <p className="mt-2 text-lg font-bold text-yui-green-800">確定した予定はまだありません</p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1 text-base font-bold text-yui-green-700 no-underline hover:text-yui-green-800"
              style={{ minHeight: "48px", alignItems: "center" }}
            >
              募集を探す
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="activity-section" className="space-y-3">
        <h2 id="activity-section" className="text-xl md:text-2xl font-bold text-yui-green-800">最近の活動履歴</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-2xl border-2 border-yui-green-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-bold text-yui-green-800 line-clamp-1">{activity.title}</p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      activity.tone === "plus"
                        ? "bg-green-100 text-green-700"
                        : activity.tone === "minus"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-yui-earth-100 text-yui-earth-600"
                    }`}
                  >
                    {activity.tone === "plus" ? "進行中" : activity.tone === "minus" ? "確認" : "記録"}
                  </span>
                </div>
                <p className="text-sm text-yui-earth-600 mt-1">{activity.detail}</p>
                <p className="text-xs text-yui-earth-400 mt-2">{activity.createdAt.toLocaleDateString("ja-JP")}</p>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-yui-green-100 p-5 text-center text-yui-earth-500">
              まだ活動履歴はありません
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="important-notice" className="space-y-3">
        <h2 id="important-notice" className="text-xl md:text-2xl font-bold text-yui-green-800 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-yui-accent" aria-hidden="true" />
          重要通知
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importantNotifications.length > 0 ? (
            importantNotifications.map((notif) => (
              <div key={notif.id} className="bg-white rounded-2xl border-2 border-orange-200 p-4">
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
            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-yui-green-100 p-5 text-center text-yui-earth-500">
              今すぐ対応が必要な通知はありません
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="hub-section" className="space-y-3">
        <h2 id="hub-section" className="text-xl md:text-2xl font-bold text-yui-green-800">よく使う機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/explore"
            className="w-full bg-white border-2 border-yui-green-200 rounded-2xl px-4 py-5 no-underline hover:bg-yui-green-50 transition-colors"
            style={{ minHeight: "72px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Search className="w-6 h-6 text-yui-green-700" aria-hidden="true" />
            <span className="text-lg font-bold text-yui-green-800">探す（手伝う）</span>
          </Link>

          <Link
            href="/profile"
            className="w-full bg-white border-2 border-yui-green-200 rounded-2xl px-4 py-5 no-underline hover:bg-yui-green-50 transition-colors"
            style={{ minHeight: "72px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Settings className="w-6 h-6 text-yui-green-700" aria-hidden="true" />
            <span className="text-lg font-bold text-yui-green-800">設定・プロフィール</span>
          </Link>

          <Link
            href="/settings"
            className="w-full bg-white border-2 border-yui-green-200 rounded-2xl px-4 py-5 no-underline hover:bg-yui-green-50 transition-colors"
            style={{ minHeight: "72px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <BellRing className="w-6 h-6 text-yui-green-700" aria-hidden="true" />
            <span className="text-lg font-bold text-yui-green-800">その他（サポート等）</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="asset-section" className="space-y-3 pt-1">
        <h2 id="asset-section" className="text-xl md:text-2xl font-bold text-yui-green-800">あなたの登録情報</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border-2 border-yui-green-100 p-5">
            <h3 className="text-lg font-bold text-yui-green-800 flex items-center gap-2 mb-3">
              <Tractor className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
              もっている農機具
            </h3>

            <MultiSelectTag
              selectedItems={user.equipmentList || []}
              presetOptions={EQUIPMENT_PRESETS}
              placeholder="例：耕うん機"
              label="農機具"
              onAdd={handleAddEquipment}
              onRemove={handleRemoveEquipment}
            />

            {specTarget && (() => {
              const master = EQUIPMENT_MASTER.find((item) => item.name === specTarget);
              if (!master) return null;

              return (
                <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200 mt-3 space-y-3">
                  <p className="text-sm font-bold text-yui-green-800">🔧 {specTarget} の仕様を入力</p>

                  {master.horsepowerOptions && master.horsepowerOptions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-yui-earth-600 mb-1">馬力・規格</p>
                      <select
                        value={specHorsepower}
                        onChange={(e) => setSpecHorsepower(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border-2 border-yui-green-200 rounded-lg bg-white focus:border-yui-green-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {master.horsepowerOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {master.attachmentOptions && master.attachmentOptions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-yui-earth-600 mb-1">アタッチメント</p>
                      <div className="flex flex-wrap gap-2">
                        {master.attachmentOptions.map((attachment) => {
                          const selected = specAttachments.includes(attachment);
                          return (
                            <button
                              key={attachment}
                              type="button"
                              onClick={() => {
                                setSpecAttachments((prev) =>
                                  selected ? prev.filter((item) => item !== attachment) : [...prev, attachment]
                                );
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                selected
                                  ? "bg-yui-green-600 text-white border-yui-green-600"
                                  : "bg-white text-yui-green-700 border-yui-green-200 hover:bg-yui-green-50"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3 inline mr-1" />}
                              {attachment}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddEquipment(specTarget)}
                      className="px-5 py-2.5 bg-yui-green-600 text-white text-sm font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
                      style={{ minHeight: "44px" }}
                    >
                      この仕様で追加する
                    </button>
                    <button
                      onClick={() => {
                        setSpecTarget(null);
                        setSpecHorsepower("");
                        setSpecAttachments([]);
                      }}
                      className="px-4 py-2.5 bg-yui-earth-100 text-yui-earth-600 text-sm font-bold rounded-lg hover:bg-yui-earth-200 transition-colors"
                      style={{ minHeight: "44px" }}
                    >
                      やめる
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-2xl border-2 border-yui-green-100 p-5">
            <h3 className="text-lg font-bold text-yui-green-800 flex items-center gap-2 mb-3">
              <Sprout className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
              育てている作物
            </h3>

            <MultiSelectTag
              selectedItems={user.crops || []}
              presetOptions={CROP_PRESETS}
              placeholder="例：アスパラガス"
              label="作物"
              onAdd={handleAddCrop}
              onRemove={handleRemoveCrop}
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border-2 border-yui-green-100 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-yui-earth-500 font-bold">ポイントの履歴</p>
          <p className="text-lg font-bold text-yui-green-800">やり取りの詳細を確認できます</p>
        </div>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1 text-base font-bold text-yui-green-700 no-underline hover:text-yui-green-800"
          style={{ minHeight: "48px", alignItems: "center" }}
        >
          <Coins className="w-5 h-5" aria-hidden="true" />
          開く
        </Link>
      </section>
    </div>
  );
}
