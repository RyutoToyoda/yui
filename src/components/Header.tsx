"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Coins } from "lucide-react";

export default function Header() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-yui-green-100 shadow-sm">
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 no-underline">
          <span className="text-2xl font-bold text-yui-green-700">結</span>
          <span className="text-sm font-medium text-yui-green-600 mt-0.5">Yui</span>
        </Link>
        <div className="flex items-center gap-1.5 bg-yui-accent/10 px-3 py-1.5 rounded-full">
          <Coins className="w-5 h-5 text-yui-accent" />
          <span className="text-base font-bold text-yui-green-800">
            {user?.tokenBalance ?? 0}
          </span>
        </div>
      </div>
    </header>
  );
}
