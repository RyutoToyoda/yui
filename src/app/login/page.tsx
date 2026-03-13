"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PREFECTURES, getMunicipalities } from "@/lib/region-data";


export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [ageGroup, setAgeGroup] = useState("30代");
  const [error, setError] = useState("");
  const { login, register, loginAsGuest } = useAuth();
  const router = useRouter();

  const municipalities = prefecture ? getMunicipalities(prefecture) : [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (success) {
      router.push("/");
    } else {
      setError("ログインできませんでした。メールアドレスを確認してください。");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !farmName) {
      setError("お名前と農園名は必ず入力してください");
      return;
    }
    if (!email || !password) {
      setError("メールアドレスとパスワードは必ず入力してください");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    const location = [prefecture, municipality].filter(Boolean).join(" ");
    const success = await register(email, password, name, farmName, location, ageGroup);
    if (success) {
      router.push("/");
    } else {
      setError("登録できませんでした。メールアドレスが既に使われているかもしれません。");
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    const success = await loginAsGuest();
    if (success) {
      router.push("/");
    } else {
      setError("テストログインに失敗しました。時間をおいて再度お試しください。");
    }
  };

  const inputClass =
    "w-full px-4 py-4 text-base border-2 border-yui-earth-200 rounded-2xl focus:border-yui-green-500 focus:outline-none bg-white placeholder:text-yui-earth-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-yui-green-800 via-yui-green-700 to-yui-green-900 flex flex-col items-center justify-center px-5">
      {/* ロゴ */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
          <h1 className="text-5xl font-black text-white">結</h1>
        </div>
        <p className="text-xl text-white/90 font-bold tracking-widest">Yui</p>
        <p className="text-base text-white/60 mt-2 tracking-wide">農家のためのタイムバンク</p>
      </div>

      {/* フォームカード */}
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/15 p-7">
        {/* タブ切り替え */}
        <div className="flex bg-yui-earth-100 rounded-2xl p-1 mb-6" role="tablist" aria-label="ログインまたは新規登録">
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${!isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500 hover:text-yui-earth-700"
              }`}
            role="tab"
            aria-selected={!isRegister}
            style={{ minHeight: "48px" }}
          >
            ログイン
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-earth-500 hover:text-yui-earth-700"
              }`}
            role="tab"
            aria-selected={isRegister}
            style={{ minHeight: "48px" }}
          >
            はじめて使う
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-yui-danger text-sm p-4 rounded-xl mb-4 border-2 border-red-200" role="alert">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-yui-earth-700 mb-2">
                メールアドレス
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanaka@example.com"
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-yui-earth-700 mb-2">
                パスワード
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 gradient-primary text-white text-lg font-bold rounded-2xl hover:opacity-90 active:opacity-95 shadow-lg shadow-yui-green-900/20"
              style={{ minHeight: "56px" }}
            >
              ログインする
            </button>

            <div className="text-center pt-1 space-y-1">
              <p className="text-sm text-yui-earth-500 font-medium">
                ご登録のメールアドレス・パスワードを入力してください。
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold text-yui-earth-700 mb-2">
                メールアドレス <span className="text-yui-danger text-xs font-bold">（必ず入力）</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yui@example.com"
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-bold text-yui-earth-700 mb-2">
                パスワード <span className="text-yui-danger text-xs font-bold">（6文字以上）</span>
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="reg-name" className="block text-sm font-bold text-yui-earth-700 mb-2">
                お名前 <span className="text-yui-danger text-xs font-bold">（必ず入力）</span>
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="田中 太郎"
                className={inputClass}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="reg-farm" className="block text-sm font-bold text-yui-earth-700 mb-2">
                農園名 <span className="text-yui-danger text-xs font-bold">（必ず入力）</span>
              </label>
              <input
                id="reg-farm"
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="田中農園"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="reg-prefecture" className="block text-sm font-bold text-yui-earth-700 mb-2">
                お住まいの地域
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  id="reg-prefecture"
                  value={prefecture}
                  onChange={(e) => {
                    setPrefecture(e.target.value);
                    setMunicipality("");
                  }}
                  className={inputClass}
                >
                  <option value="">都道府県を選ぶ</option>
                  {PREFECTURES.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                <select
                  id="reg-municipality"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  disabled={!prefecture || municipalities.length === 0}
                  className={`${inputClass} disabled:bg-yui-earth-50 disabled:text-yui-earth-300`}
                >
                  <option value="">{!prefecture ? "先に都道府県を選ぶ" : municipalities.length > 0 ? "市町村を選ぶ" : "市町村データなし"}</option>
                  {municipalities.map(muni => (
                    <option key={muni} value={muni}>{muni}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="reg-age" className="block text-sm font-bold text-yui-earth-700 mb-2">
                年齢層
              </label>
              <select
                id="reg-age"
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
              style={{ minHeight: "56px" }}
            >
              登録してはじめる
            </button>
            <p className="text-center text-sm text-yui-earth-500 font-medium">
              登録すると 🪙 10 ポイントがもらえます！
            </p>
          </form>
        )}

        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t flex-1 border-yui-earth-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-yui-earth-500 font-medium">または</span>
          </div>
        </div>

        <button
          onClick={handleGuestLogin}
          className="w-full py-4 bg-white text-yui-green-700 text-lg font-bold rounded-2xl border-2 border-yui-green-200 hover:bg-yui-green-50 active:bg-yui-green-100 transition-colors shadow-sm"
          style={{ minHeight: "56px" }}
        >
          アカウント登録なしで試す
        </button>
      </div>

      <p className="text-sm text-white/40 mt-8 tracking-wide">
        © 2026 結 Yui — みんなで支え合う農業の未来
      </p>
    </div>
  );
}
