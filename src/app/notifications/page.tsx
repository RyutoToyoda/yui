"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  demoGetNotificationsByUser,
  demoMarkNotificationRead,
  demoMarkAllNotificationsRead,
  demoGetUnreadCountByUser,
} from "@/lib/demo-data";
import { Bell, CheckCheck, Zap, UserCheck, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [, forceUpdate] = useState(0);

  if (!user) return null;

  const notifications = demoGetNotificationsByUser(user.uid);
  const unreadCount = demoGetUnreadCountByUser(user.uid);

  const handleMarkAllRead = () => {
    demoMarkAllNotificationsRead(user.uid);
    forceUpdate((n) => n + 1);
  };

  const handleMarkRead = (id: string) => {
    demoMarkNotificationRead(id);
    forceUpdate((n) => n + 1);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match": return <Zap className="w-5 h-5 text-orange-500" />;
      case "application": return <UserCheck className="w-5 h-5 text-blue-500" />;
      case "approved": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-yui-green-600" />;
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-yui-green-800">通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-sm text-yui-green-600 font-medium hover:text-yui-green-800 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> すべて既読
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${
                notif.isRead
                  ? "border-yui-green-100"
                  : "border-orange-200 bg-orange-50/30"
              }`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  notif.type === "match" ? "bg-orange-100" :
                  notif.type === "approved" ? "bg-green-100" :
                  "bg-blue-100"
                }`}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${notif.isRead ? "text-yui-green-800" : "text-orange-800"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-yui-earth-500 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-yui-earth-300">
                      {notif.createdAt.toLocaleDateString("ja-JP")}
                    </p>
                    {notif.jobId && (
                      <Link
                        href={`/explore/${notif.jobId}`}
                        className="flex items-center gap-0.5 text-xs text-yui-green-600 font-bold no-underline hover:text-yui-green-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        詳細を見る <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-yui-green-100">
          <Bell className="w-12 h-12 text-yui-earth-300 mx-auto mb-3" />
          <p className="text-yui-earth-400 font-medium">通知はまだありません</p>
          <p className="text-sm text-yui-earth-300 mt-1">
            スキマ時間を登録すると、ぴったりの募集が出た時にお知らせします
          </p>
          <Link
            href="/profile"
            className="inline-block mt-3 text-sm text-yui-green-600 font-bold no-underline hover:underline"
          >
            スキマ時間を登録する →
          </Link>
        </div>
      )}
    </div>
  );
}
