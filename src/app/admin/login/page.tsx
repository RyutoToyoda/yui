"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAsGuest, isLoggedIn } = useAuth();
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === "yui-admin-2026") {
      try {
        // Firebase認証が済んでいない場合はゲストログインを行う
        if (!isLoggedIn) {
          const authSuccess = await loginAsGuest();
          if (!authSuccess) {
            throw new Error("認証に失敗しました。");
          }
        }
        
        // 管理者セッションの印として localStorage を使用
        localStorage.setItem("yui_admin_auth", "true");
        router.push("/admin");
      } catch (err: any) {
        setError(err.message || "ログイン中にエラーが発生しました。");
      }
    } else {
      setError("パスワードが正しくありません。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-yui-earth-50 flex flex-col items-center justify-center px-5 py-10">
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-yui-green-600 font-bold mb-8 hover:text-yui-green-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        ログイン画面にもどる
      </Link>

      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-xl border-2 border-yui-green-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yui-green-100 text-yui-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-yui-green-800">管理者ログイン</h1>
          <p className="text-sm text-yui-earth-500 mt-2 font-medium">管理者専用パスワードを入力してください</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label htmlFor="admin-pass" className="block text-sm font-bold text-yui-earth-700 mb-3 ml-1">
              管理者用パスワード
            </label>
            <input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 text-base border-2 border-yui-earth-200 rounded-2xl focus:border-yui-green-500 focus:outline-none bg-yui-earth-50/50 transition-all font-mono"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-yui-danger text-sm p-4 rounded-xl border-2 border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yui-green-600 text-white text-lg font-bold rounded-2xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-all shadow-lg shadow-yui-green-600/20 disabled:opacity-50"
          >
            {loading ? "検証中..." : "管理画面に入る"}
          </button>
        </form>
      </div>

      <p className="text-sm text-yui-earth-400 mt-12 text-center">
        セキュリティのため、操作がない場合は一定時間でログアウトされます。<br />
        共用PCでのログインにはご注意ください。
      </p>
    </div>
  );
}
