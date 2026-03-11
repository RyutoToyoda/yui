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

  const inputClass =
    "w-full px-4 py-3.5 text-base border border-yui-earth-200 rounded-2xl focus:border-yui-green-500 focus:outline-none bg-white/80 backdrop-blur-sm placeholder:text-yui-earth-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-yui-green-800 via-yui-green-700 to-yui-green-900 flex flex-col items-center justify-center px-5">
      {/* ロゴ */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
          <h1 className="text-5xl font-black text-white">結</h1>
        </div>
        <p className="text-lg text-white/90 font-semibold tracking-widest">Yui</p>
        <p className="text-sm text-white/50 mt-1.5 tracking-wide">農家のためのタイムバンク</p>
      </div>

      {/* フォームカード */}
      <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/15 p-7">
        {/* タブ切り替え */}
        <div className="flex bg-yui-earth-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-all ${
              !isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-400 hover:text-yui-earth-600"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-all ${
              isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-400 hover:text-yui-earth-600"
            }`}
          >
            新規登録
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanaka@example.com"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 gradient-primary text-white text-lg font-bold rounded-2xl hover:opacity-90 active:opacity-95 shadow-lg shadow-yui-green-900/20"
            >
              ログイン
            </button>

            <div className="text-center pt-1 space-y-0.5">
              <p className="text-xs text-yui-earth-400">
                デモ用: tanaka@demo.com / yamada@demo.com / sato@demo.com
              </p>
              <p className="text-xs text-yui-earth-300">パスワードは任意の文字列</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                お名前 <span className="text-yui-danger text-xs">必須</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="田中 太郎"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                農園名 <span className="text-yui-danger text-xs">必須</span>
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="田中農園"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                所在地
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="長野県松本市"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-earth-700 mb-2">
                年齢層
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className={inputClass}
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
              className="w-full py-4 gradient-primary text-white text-lg font-bold rounded-2xl hover:opacity-90 active:opacity-95 shadow-lg shadow-yui-green-900/20"
            >
              登録して始める
            </button>
            <p className="text-center text-xs text-yui-earth-400">
              登録すると 🪙 10 トークンがもらえます！
            </p>
          </form>
        )}
      </div>

      <p className="text-xs text-white/30 mt-8 tracking-wide">
        © 2026 結 Yui — みんなで支え合う農業の未来
      </p>
    </div>
  );
}
