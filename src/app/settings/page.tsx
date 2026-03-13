"use client";

export const dynamic = "force-dynamic";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Type, Sun, Eye, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

const fontSizeOptions = [
  { value: "standard" as const, label: "ふつう", description: "標準のサイズです", sampleSize: "18px" },
  { value: "large" as const, label: "大きめ", description: "少し大きめの文字です", sampleSize: "20px" },
  { value: "xlarge" as const, label: "とても大きい", description: "もっとも読みやすいサイズです", sampleSize: "22px" },
];

export default function SettingsPage() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility();
  const { logout } = useAuth();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="px-4 py-5 space-y-6">
      {/* もどるボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-yui-green-600 font-bold text-base hover:text-yui-green-800 transition-colors"
        style={{ minHeight: "48px" }}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> もどる
      </button>

      <h1 className="text-xl font-bold text-yui-green-800 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
        設定
      </h1>

      <p className="text-sm text-yui-earth-600" style={{ lineHeight: "1.8" }}>
        お好みに合わせて画面の見え方を変えたり、ログアウトを行えます。
      </p>

      {/* 文字サイズ設定 */}
      <section aria-labelledby="font-size-heading" className="space-y-3">
        <h2 id="font-size-heading" className="text-base font-bold text-yui-green-800 flex items-center gap-2">
          <Type className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
          文字の大きさ
        </h2>
        <div className="space-y-2" role="radiogroup" aria-label="文字の大きさを選ぶ">
          {fontSizeOptions.map((option) => {
            const isSelected = fontSize === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFontSize(option.value)}
                className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
                    : "border-yui-green-100 bg-white hover:border-yui-green-300"
                }`}
                role="radio"
                aria-checked={isSelected}
                style={{ minHeight: "72px" }}
              >
                <div className="flex-1">
                  <p className="font-bold text-yui-green-800">{option.label}</p>
                  <p className="text-sm text-yui-earth-500 mt-0.5">{option.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  {/* サンプル文字 */}
                  <span className="text-yui-green-700 font-bold" style={{ fontSize: option.sampleSize }}>
                    あ
                  </span>
                  {/* ラジオインジケーター */}
                  <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isSelected
                      ? "border-yui-green-500 bg-yui-green-500"
                      : "border-yui-earth-300"
                  }`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 高コントラストモード */}
      <section aria-labelledby="contrast-heading" className="space-y-3">
        <h2 id="contrast-heading" className="text-base font-bold text-yui-green-800 flex items-center gap-2">
          <Sun className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
          画面のくっきりさ
        </h2>
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all text-left ${
            highContrast
              ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
              : "border-yui-green-100 bg-white hover:border-yui-green-300"
          }`}
          role="switch"
          aria-checked={highContrast}
          style={{ minHeight: "72px" }}
        >
          <div className="flex-1">
            <p className="font-bold text-yui-green-800">くっきりモード</p>
            <p className="text-sm text-yui-earth-500 mt-0.5" style={{ lineHeight: "1.7" }}>
              明るい場所や直射日光のもとでも見やすくなります
            </p>
          </div>
          {/* トグルスイッチ */}
          <div className={`w-14 h-8 rounded-full flex items-center transition-colors shrink-0 ml-3 ${
            highContrast ? "bg-yui-green-600" : "bg-yui-earth-300"
          }`}>
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
              highContrast ? "translate-x-7" : "translate-x-1"
            }`} />
          </div>
        </button>
      </section>

      {/* アカウント設定 */}
      <section aria-labelledby="account-heading" className="space-y-3">
        <h2 id="account-heading" className="text-base font-bold text-yui-green-800 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
          アカウント
        </h2>
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full py-4 bg-white text-yui-danger font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          style={{ minHeight: "56px" }}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          ログアウトする
        </button>
      </section>

      {/* 使い方ガイド */}
      <section aria-labelledby="guide-heading" className="space-y-3">
        <h2 id="guide-heading" className="text-base font-bold text-yui-green-800 flex items-center gap-2">
          📖 使い方ガイド
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem("yui-onboarding-seen");
            window.location.href = "/";
          }}
          className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-yui-green-100 bg-white hover:border-yui-green-300 transition-all text-left"
          style={{ minHeight: "64px" }}
        >
          <div>
            <p className="font-bold text-yui-green-800">はじめの使い方をもう一度見る</p>
            <p className="text-sm text-yui-earth-500 mt-0.5">
              最初に表示された使い方の説明をもう一度見られます
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-yui-earth-400 rotate-180 shrink-0 ml-3" aria-hidden="true" />
        </button>
      </section>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="ログアウトしますか？"
        message="ログアウトすると、もう一度ログインが必要になります。"
        confirmLabel="ログアウトする"
        cancelLabel="やめておく"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

