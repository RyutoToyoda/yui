"use client";

export const dynamic = "force-dynamic";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Type, Sun, LogOut, Settings as SettingsIcon, HelpCircle, MessageCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import HelpAdvisor from "@/components/HelpAdvisor";

const fontSizeOptions = [
  { value: "standard" as const, label: "普通", description: "標準のサイズです", sampleSize: "18px" },
  { value: "large" as const, label: "大きめ", description: "少し大きめの文字です", sampleSize: "20px" },
  { value: "xlarge" as const, label: "とても大きい", description: "もっとも読みやすいサイズです", sampleSize: "22px" },
];

export default function SettingsPage() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility();
  const { logout } = useAuth();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showHelpAdvisor, setShowHelpAdvisor] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="py-3 space-y-4">
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

      {/* ===============================================
          👁 見やすさ設定
          =============================================== */}
      <section aria-labelledby="visibility-heading" className="space-y-4">
        <h2 id="visibility-heading" className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 border-b-2 border-yui-green-200">
          <Eye className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
          見やすさ設定
        </h2>

        {/* 文字の大きさ */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-yui-green-700">文字の大きさ</h3>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="文字の大きさを選ぶ">
            {fontSizeOptions.map((option) => {
              const isSelected = fontSize === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isSelected
                    ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
                    : "border-yui-green-100 bg-white hover:border-yui-green-300"
                    }`}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <span
                    className={`font-bold flex items-center justify-center h-12 ${isSelected ? "text-yui-green-800" : "text-black"}`}
                    style={{ fontSize: option.sampleSize, lineHeight: "1" }}
                  >
                    あ
                  </span>
                  <span className={`text-xs font-bold mt-2 ${isSelected ? "text-yui-green-800" : "text-yui-earth-500"}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 高コントラストモード */}
        <div className="space-y-3 pt-4 border-t border-yui-earth-100">
          <h3 className="text-base font-bold text-yui-green-700">画面のくっきりさ</h3>
          <p className="text-sm text-yui-earth-600 mb-2">明るい場所や直射日光のもとでも見やすくなります。</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="画面のくっきりさを選ぶ">
            {/* 標準モード */}
            <button
              onClick={() => setHighContrast(false)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!highContrast
                ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
                : "border-yui-green-100 bg-white hover:border-yui-green-300"
                }`}
              role="radio"
              aria-checked={!highContrast}
            >
              <div className="w-full flex justify-center mb-3 h-10 items-end">
                <div className="px-4 py-1.5 rounded-lg bg-yui-green-50 text-yui-green-700 border-2 border-yui-green-200 font-bold text-sm shadow-sm">
                  あいうえお
                </div>
              </div>
              <span className={`text-sm font-bold mt-2 ${!highContrast ? "text-yui-green-800" : "text-yui-earth-500"}`}>
                標準モード
              </span>
            </button>

            {/* くっきりモード */}
            <button
              onClick={() => setHighContrast(true)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${highContrast
                ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
                : "border-yui-green-100 bg-white hover:border-yui-green-300"
                }`}
              role="radio"
              aria-checked={highContrast}
            >
              <div className="w-full flex justify-center mb-3 h-10 items-end">
                <div className="px-4 py-1.5 rounded-lg bg-white text-black border-2 border-yui-green-800 font-black text-sm">
                  あいうえお
                </div>
              </div>
              <span className={`text-sm font-bold mt-2 ${highContrast ? "text-yui-green-800" : "text-yui-earth-500"}`}>
                くっきりモード
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ===============================================
          📖 サポート
          =============================================== */}
      <section aria-labelledby="support-heading" className="space-y-3">
        <h2 id="support-heading" className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 border-b-2 border-yui-green-200">
          <HelpCircle className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
          サポート
        </h2>

        {/* はじめての方へ */}
        <button
          onClick={() => {
            localStorage.removeItem("yui-onboarding-seen");
            window.location.href = "/profile";
          }}
          className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-yui-green-100 bg-white hover:border-yui-green-300 transition-all text-left shadow-sm"
          style={{ minHeight: "72px" }}
        >
          <div className="flex-1">
            <p className="font-bold text-yui-green-800">はじめての方へ</p>
            <p className="text-sm text-yui-earth-500 mt-0.5">
              アプリの使い方を再度確認できます
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-yui-earth-400 rotate-180 shrink-0 ml-3" aria-hidden="true" />
        </button>

        {/* 困ったときのAIサポート */}
        <button
          onClick={() => setShowHelpAdvisor(true)}
          className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-yui-green-100 bg-white hover:border-yui-green-300 transition-all text-left shadow-sm"
          style={{ minHeight: "72px" }}
          aria-label="困ったときのAIサポートを開く"
        >
          <div className="flex-1">
            <p className="font-bold text-yui-green-800">困ったときのAIサポート</p>
            <p className="text-sm text-yui-earth-500 mt-0.5">
              アプリの使い方を相談できます
            </p>
          </div>
          <MessageCircle className="w-5 h-5 text-yui-green-600 shrink-0 ml-3" aria-hidden="true" />
        </button>
      </section>

      {/* ===============================================
          👤 アカウント
          =============================================== */}
      <section aria-labelledby="account-heading" className="space-y-3">
        <h2 id="account-heading" className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 border-b-2 border-yui-green-200">
          <LogOut className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
          アカウント
        </h2>
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full py-4 bg-white text-yui-danger font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          style={{ minHeight: "56px" }}
          aria-label="アプリからログアウト"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          アプリからログアウト
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

      <HelpAdvisor
        isOpen={showHelpAdvisor}
        onClose={() => setShowHelpAdvisor(false)}
        showFloatingButton={false}
      />
    </div>
  );
}

