"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import YuiLogo from "@/components/YuiLogo";
import { PREFECTURES, getMunicipalities, isKantoPrefecture } from "@/lib/region-data";


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
  const [showPassword, setShowPassword] = useState(false);
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
    "w-full px-3 py-2 text-sm border border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-yui-earth-50 placeholder:text-yui-earth-400";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-4">
      {/* ロゴ */}
      <div className="text-center mb-0">
        <div className="w-40 h-40 mx-auto mb-0 mt-0 flex items-center justify-center">
          <YuiLogo width={240} height={240} />
        </div>
        <p className="text-sm text-yui-earth-500 mt-0 mb-0 tracking-wide">農家のためのタイムバンク</p>
      </div>

      {/* フォームカード */}
      <div className="w-full max-w-[400px] bg-white border-2 border-yui-green-200 rounded-3xl shadow-lg p-5">
        {/* タブ切り替え */}
        <div className="flex bg-yui-green-100 rounded-xl p-1 mb-4" role="tablist" aria-label="ログインまたは新規登録">
          <button
            onClick={() => { setIsRegister(false); setError(""); setShowPassword(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-green-600 hover:text-yui-green-700"
              }`}
            role="tab"
            aria-selected={!isRegister}
            style={{ minHeight: "40px" }}
          >
            ログイン
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); setShowPassword(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isRegister
                ? "bg-white text-yui-green-700 shadow-sm"
                : "text-yui-green-600 hover:text-yui-green-700"
              }`}
            role="tab"
            aria-selected={isRegister}
            style={{ minHeight: "40px" }}
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
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-yui-green-700 mb-1">
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
              <label htmlFor="login-password" className="block text-sm font-bold text-yui-green-700 mb-1">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + " pr-14"}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-yui-earth-400 hover:text-yui-earth-700 rounded-xl hover:bg-yui-earth-100 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                    : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 gradient-primary text-white text-base font-bold rounded-xl hover:opacity-90 active:opacity-95 shadow-lg shadow-yui-green-900/20"
              style={{ minHeight: "44px" }}
            >
              ログインする
            </button>

            <div className="text-center pt-1 space-y-1">
              <p className="text-xs text-yui-earth-500 font-medium">
                ご登録のメールアドレス・パスワードを入力してください。
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold text-yui-green-700 mb-1">
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
              <label htmlFor="reg-password" className="block text-sm font-bold text-yui-green-700 mb-1">
                パスワード <span className="text-yui-danger text-xs font-bold">（6文字以上）</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + " pr-14"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-yui-earth-400 hover:text-yui-earth-700 rounded-xl hover:bg-yui-earth-100 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                    : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reg-name" className="block text-sm font-bold text-yui-green-700 mb-1">
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
              <label htmlFor="reg-farm" className="block text-sm font-bold text-yui-green-700 mb-1">
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
              <label htmlFor="reg-prefecture" className="block text-sm font-bold text-yui-green-700 mb-1">
                お住まいの地域
              </label>
              <div className="space-y-2">
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
                {prefecture && (
                  isKantoPrefecture(prefecture) ? (
                    <select
                      id="reg-municipality"
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className={`${inputClass} disabled:bg-yui-earth-50 disabled:text-yui-earth-300`}
                    >
                      <option value="">市町村を選ぶ</option>
                      {municipalities.map(muni => (
                        <option key={muni} value={muni}>{muni}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="reg-municipality"
                      type="text"
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      placeholder="（例）〇〇市"
                      className={inputClass}
                    />
                  )
                )}
              </div>
            </div>
            <div>
              <label htmlFor="reg-age" className="block text-sm font-bold text-yui-green-700 mb-1">
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
              className="w-full py-2.5 gradient-primary text-white text-base font-bold rounded-xl hover:opacity-90 active:opacity-95 shadow-lg shadow-yui-green-900/20 mt-2"
              style={{ minHeight: "44px" }}
            >
              登録してはじめる
            </button>
            <p className="text-center text-xs text-yui-earth-500 font-medium">
              登録すると 🪙 10 ポイントがもらえます！
            </p>
          </form>
        )}

        <div className="relative mt-4 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t flex-1 border-yui-earth-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-yui-earth-500 font-medium">または</span>
          </div>
        </div>

        <button
          onClick={handleGuestLogin}
          className="w-full py-2.5 bg-white text-yui-green-700 text-base font-bold rounded-xl border border-yui-green-200 hover:bg-yui-green-50 active:bg-yui-green-100 transition-colors shadow-sm mb-4"
          style={{ minHeight: "44px" }}
        >
          アカウント登録なしで試す
        </button>

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-xs text-yui-earth-400 hover:text-yui-green-600 font-bold transition-colors"
          >
            管理者としてログイン
          </Link>
        </div>
      </div>

      <p className="text-xs text-yui-earth-400 mt-4 tracking-wide">
        © 2026 結 Yui — みんなで支え合う農業の未来
      </p>
    </div>
  );
}
