"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [ageGroup, setAgeGroup] = useState("30代");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (success) {
      router.push("/");
    } else {
      setError("ログインに失敗しました");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !farmName) {
      setError("お名前と農園名は必須です");
      return;
    }
    const success = await register(name, farmName, location, ageGroup);
    if (success) {
      router.push("/");
    } else {
      setError("登録に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yui-green-700 to-yui-green-900 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg">結</h1>
        <p className="text-xl text-yui-green-200 font-medium">Yui</p>
        <p className="text-sm text-yui-green-300 mt-2">農家のためのタイムバンク</p>
      </div>

      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6">
        {/* タブ切り替え */}
        <div className="flex bg-yui-green-50 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${
              !isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${
              isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500"
            }`}
          >
            新規登録
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {!isRegister ? (
          /* ログインフォーム */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanaka@example.com"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
            >
              ログイン
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-yui-earth-400">
                デモ用: tanaka@demo.com / yamada@demo.com / sato@demo.com
              </p>
              <p className="text-xs text-yui-earth-400">パスワードは任意の文字列</p>
            </div>
          </form>
        ) : (
          /* 新規登録フォーム */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                お名前 <span className="text-yui-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="田中 太郎"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                農園名 <span className="text-yui-danger">*</span>
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="田中農園"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                所在地
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="長野県松本市"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
                年齢層
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none transition-colors bg-yui-green-50/50"
              >
                <option value="20代">20代</option>
                <option value="30代">30代</option>
                <option value="40代">40代</option>
                <option value="50代">50代</option>
                <option value="60代">60代</option>
                <option value="70代以上">70代以上</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
            >
              登録して始める
            </button>
            <p className="text-center text-xs text-yui-earth-400">
              登録すると 🪙 10 トークンがもらえます！
            </p>
          </form>
        )}
      </div>

      <p className="text-xs text-yui-green-400 mt-6">
        © 2026 結 Yui — みんなで支え合う農業の未来
      </p>
    </div>
  );
}
