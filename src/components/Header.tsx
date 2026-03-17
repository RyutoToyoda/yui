"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Coins } from "lucide-react";
import YuiLogo from "@/components/YuiLogo";

export default function Header() {
  const { user, isLoggedIn } = useAuth();
  const pathname = usePathname();

  const isMyPagePath =
    pathname === "/" ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/schedule") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/wallet");

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
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="md:hidden h-16 flex items-center gap-2">
            <div className="w-16" aria-hidden="true" />
            <Link href="/" className="flex-1 text-center no-underline" aria-label="結 Yui マイページへ">
              <YuiLogo className="inline-block h-11 w-auto object-contain" />
            </Link>
            <div className="shrink-0">
              <div
                className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200"
                aria-label={`所持ポイント ${user.tokenBalance ?? 0}`}
                role="status"
              >
                <Coins className="w-5 h-5 text-yui-accent" aria-hidden="true" />
                <p className="text-lg font-bold text-yui-earth-800 tabular-nums leading-none">
                  {user.tokenBalance ?? 0}P
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex h-20 items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="no-underline" aria-label="結 Yui マイページへ">
                <YuiLogo className="h-14 w-auto object-contain" />
              </Link>
              <nav className="flex items-center gap-2" aria-label="デスクトップメニュー">
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-xl no-underline text-lg font-bold transition-colors ${
                    isMyPagePath
                      ? "bg-yui-green-100 text-yui-green-800"
                      : "text-yui-earth-600 hover:bg-yui-green-50 hover:text-yui-green-700"
                  }`}
                  style={{ minHeight: "52px", display: "inline-flex", alignItems: "center" }}
                >
                  マイページ
                </Link>
                <Link
                  href="/create"
                  className={`px-4 py-2 rounded-xl no-underline text-lg font-bold transition-colors ${
                    pathname.startsWith("/create")
                      ? "bg-yui-green-100 text-yui-green-800"
                      : "text-yui-earth-600 hover:bg-yui-green-50 hover:text-yui-green-700"
                  }`}
                  style={{ minHeight: "52px", display: "inline-flex", alignItems: "center" }}
                >
                  募集
                </Link>
              </nav>
            </div>

            <div
              className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200"
              aria-label={`所持ポイント ${user.tokenBalance ?? 0}`}
              role="status"
            >
              <Coins className="w-5 h-5 text-yui-accent" aria-hidden="true" />
              <div className="leading-tight">
                <p className="text-xs font-bold text-yui-earth-500">所持ポイント</p>
                <p className="text-lg font-bold text-yui-earth-800 tabular-nums">
                  {user.tokenBalance ?? 0}P
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
