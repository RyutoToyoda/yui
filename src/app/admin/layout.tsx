"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import YuiLogo from "@/components/YuiLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = localStorage.getItem("yui_admin_auth");
    if (auth !== "true") {
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    } else {
      setIsAuthorized(true);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("yui_admin_auth");
    router.push("/login");
  };

  // ログインページの場合はレイアウトを通さずに子要素を表示
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー（PC用） */}
      <aside className="hidden md:flex md:flex-col w-64 bg-yui-green-900 text-white shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <YuiLogo className="h-12 w-auto" alt="結 Yui" width={48} height={48} />
            </div>
            <div className="font-bold">
              <p className="text-sm leading-none opacity-60">Admin</p>
              <p className="text-lg leading-none">管理画面</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors bg-white/5">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-bold">ダッシュボード</span>
            </Link>
            <Link href="/admin/ads" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
              <Megaphone className="w-5 h-5" />
              <span className="font-bold">広告管理</span>
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-bold">ユーザー一覧</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm opacity-60">
            <ArrowLeft className="w-4 h-4" />
            アプリ画面へ
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-300 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* モバイル用ロゴ */}
              <div className="md:hidden w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-yui-earth-100">
                <YuiLogo className="h-8 w-auto" alt="結 Yui" width={32} height={32} />
              </div>
              <h2 className="text-base md:text-lg font-bold text-gray-800">結 Yui 管理システム</h2>
            </div>
            <div className="text-sm text-gray-500 font-medium hidden md:block">
              セッション有効
            </div>
          </div>
          {/* モバイル用ナビゲーション */}
          <nav className="md:hidden flex items-center gap-2 mt-2 overflow-x-auto pb-1">
            <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yui-green-900 text-white text-xs font-bold whitespace-nowrap shrink-0">
              <LayoutDashboard className="w-3.5 h-3.5" />
              ダッシュボード
            </Link>
            <Link href="/admin/ads" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yui-green-700 text-white text-xs font-bold whitespace-nowrap shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
              広告管理
            </Link>
            <Link href="/admin/users" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yui-green-700 text-white text-xs font-bold whitespace-nowrap shrink-0">
              <Users className="w-3.5 h-3.5" />
              ユーザー一覧
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-bold whitespace-nowrap shrink-0 ml-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </nav>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
