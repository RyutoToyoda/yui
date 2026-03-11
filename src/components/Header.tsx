"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { demoGetUnreadCountByUser } from "@/lib/demo-data";
import { Coins, Bell } from "lucide-react";

export default function Header() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn || !user) return null;

  const unreadCount = demoGetUnreadCountByUser(user.uid);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-yui-green-100/50 shadow-[0_1px_8px_rgba(30,63,36,0.06)]">
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 no-underline group">
          <span className="text-2xl font-black text-yui-green-700 tracking-tight group-hover:text-yui-green-600">結</span>
          <span className="text-sm font-semibold text-yui-green-500 mt-0.5 tracking-wide">Yui</span>
        </Link>
        <div className="flex items-center gap-2.5">
          {/* 通知ベル */}
          <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-yui-green-50 transition-colors no-underline">
            <Bell className="w-5 h-5 text-yui-earth-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          {/* トークン残高 */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 px-3.5 py-1.5 rounded-full border border-amber-200/60">
            <Coins className="w-4 h-4 text-yui-accent" />
            <span className="text-sm font-bold text-yui-earth-800 tabular-nums">
              {user.tokenBalance ?? 0}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
