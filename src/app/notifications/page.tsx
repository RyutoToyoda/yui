"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/contexts/AuthContext";
import {
  fsFetchNotifications,
  fsFetchUnreadCount,
  fsMarkNotificationRead,
  fsMarkAllNotificationsRead,
} from "@/lib/firestore-service";
import type { Notification } from "@/types/firestore";
import { Bell, CheckCheck, Zap, UserCheck, CheckCircle2, ArrowRight, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // オンデマンドで通知を取得（onSnapshot/ポーリング不使用）
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [notifs, count] = await Promise.all([
        fsFetchNotifications(user.uid, 30),
        fsFetchUnreadCount(user.uid),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error("通知の取得に失敗:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // マウント時に取得
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAllRead = async () => {
    await fsMarkAllNotificationsRead(user.uid);
    await loadData();
  };

  const handleMarkRead = async (id: string) => {
    await fsMarkNotificationRead(id);
    await loadData();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match": return <Zap className="w-5 h-5 text-orange-600" aria-hidden="true" />;
      case "application": return <UserCheck className="w-5 h-5 text-blue-700" aria-hidden="true" />;
      case "approved": return <CheckCircle2 className="w-5 h-5 text-yui-success" aria-hidden="true" />;
      case "job_cancelled": return <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;
      default: return <Bell className="w-5 h-5 text-yui-green-600" aria-hidden="true" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "match": return "ぴったり";
      case "application": return "手を挙げた方";
      case "approved": return "お願い済み";
      case "job_cancelled": return "キャンセル";
      default: return "お知らせ";
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-yui-green-800">おしらせ</h1>
        <div className="flex items-center gap-2">
          {/* 手動リロードボタン */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-yui-earth-500 font-bold hover:text-yui-green-600 transition-colors disabled:opacity-50"
            style={{ minHeight: "44px" }}
            aria-label="通知を更新する"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm text-yui-green-600 font-bold hover:text-yui-green-800 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <CheckCheck className="w-5 h-5" aria-hidden="true" /> すべて読んだ
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-colors relative cursor-pointer ${
                notif.isRead
                  ? "border-yui-green-100"
                  : "border-orange-300 bg-orange-50/30"
              }`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              role="article"
              aria-label={`${notif.isRead ? "" : "未読: "}${notif.title}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  notif.type === "match" ? "bg-orange-100 border-orange-200" :
                  notif.type === "approved" ? "bg-green-100 border-green-200" :
                  notif.type === "job_cancelled" ? "bg-red-100 border-red-200" :
                  "bg-blue-100 border-blue-200"
                }`}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      notif.type === "match" ? "bg-orange-100 text-orange-700 border border-orange-300" :
                      notif.type === "approved" ? "bg-green-100 text-green-700 border border-green-300" :
                      notif.type === "job_cancelled" ? "bg-red-100 text-red-700 border border-red-300" :
                      "bg-blue-100 text-blue-700 border border-blue-300"
                    }`}>
                      {getNotificationTypeLabel(notif.type)}
                    </span>
                    {!notif.isRead && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-300">
                        未読
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-bold ${notif.isRead ? "text-yui-green-800" : "text-orange-800"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-yui-earth-600 mt-1 leading-relaxed" style={{ lineHeight: "1.7" }}>
                    {notif.message}
                  </p>
                  {/* キャンセル通知の理由・詳細表示 */}
                  {notif.type === "job_cancelled" && notif.reason && (
                    <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-700">理由</span>
                        <span className="text-xs text-red-800 font-bold">{notif.reason}</span>
                      </div>
                      {notif.detail && (
                        <div>
                          <span className="text-xs font-bold text-red-700">コメント</span>
                          <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{notif.detail}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-yui-earth-400 font-medium">
                      {notif.createdAt.toLocaleDateString("ja-JP")}
                    </p>
                    {notif.jobId && (
                      <Link
                        href={`/explore/${notif.jobId}`}
                        className="flex items-center gap-1 text-sm text-yui-green-600 font-bold no-underline hover:text-yui-green-800"
                        onClick={(e) => e.stopPropagation()}
                        style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
                      >
                        くわしく見る <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border-2 border-yui-green-100">
          <Bell className="w-12 h-12 text-yui-earth-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-yui-earth-500 font-bold">おしらせはまだありません</p>
          <p className="text-sm text-yui-earth-400 mt-1" style={{ lineHeight: "1.7" }}>
            手伝える時間を登録すると、ぴったりの募集が出た時にお知らせします
          </p>
          <Link
            href="/profile"
            className="inline-block mt-3 text-sm text-yui-green-600 font-bold no-underline hover:underline"
            style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            手伝える時間を登録する →
          </Link>
        </div>
      )}
    </div>
  );
}
