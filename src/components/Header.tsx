"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetUnreadCountByUser } from "@/lib/firestore-service";
import { Coins, Bell } from "lucide-react";

export default function Header() {
  const { user, isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    let cancelled = false;
    fsGetUnreadCountByUser(user.uid).then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    return () => { cancelled = true; };
  }, [isLoggedIn, user]);

  if (!isLoggedIn || !user) return null;

  return (
    <>
      {/* Skip Link（キーボード/スクリーンリーダー対応） */}
      <a href="#main-content" className="skip-link">
        メインコンテンツへ移動
      </a>

      <header
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b-2 border-yui-green-200/60 shadow-[0_1px_10px_rgba(20,58,28,0.08)]"
        role="banner"
      >
        <div className="max-w-[430px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline group" aria-label="結 Yui ホームへ">
            <span className="text-2xl font-black text-yui-green-700 tracking-tight group-hover:text-yui-green-600">結</span>
            <span className="text-sm font-bold text-yui-green-500 mt-0.5 tracking-wide">Yui</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* 通知ベル */}
            <Link
              href="/notifications"
              className="relative flex items-center justify-center rounded-xl hover:bg-yui-green-50 transition-colors no-underline"
              aria-label={`通知${unreadCount > 0 ? ` 未読${unreadCount}件` : ""}`}
              style={{ minWidth: "48px", minHeight: "48px" }}
            >
              <Bell className="w-6 h-6 text-yui-earth-600" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-[20px] h-[20px] bg-yui-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white"
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            {/* ポイント残高 */}
            <div
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-full border border-amber-200/80"
              aria-label={`ポイント残高 ${user.tokenBalance ?? 0}`}
              role="status"
            >
              <Coins className="w-5 h-5 text-yui-accent" aria-hidden="true" />
              <span className="text-sm font-bold text-yui-earth-800 tabular-nums">
                {user.tokenBalance ?? 0}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
