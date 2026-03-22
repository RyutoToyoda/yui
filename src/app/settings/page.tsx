"use client";

export const dynamic = "force-dynamic";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Type, Sun, LogOut, Settings as SettingsIcon, HelpCircle, MessageCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import HelpAdvisor from "@/components/HelpAdvisor";
import { fsCleanupOrphanedRecords } from "@/lib/firestore-service";

const fontSizeOptions = [
  { value: "standard" as const, label: "普通", description: "標準のサイズです", sampleSize: "16px" },
  { value: "large" as const, label: "大きめ", description: "少し大きめの文字です", sampleSize: "18px" },
  { value: "xlarge" as const, label: "とても大きい", description: "もっとも読みやすいサイズです", sampleSize: "20px" },
];

export default function SettingsPage() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility();
  const router = useRouter();
  const [showHelpAdvisor, setShowHelpAdvisor] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  
  const handleCleanup = async () => {
    if (!confirm("データベースのクリーンアップを実行しますか？（キャンセル済みの募集・応募や、孤立した不要データの一括削除）")) return;
    setCleaning(true);
    try {
      const result = await fsCleanupOrphanedRecords();
      alert(`クリーンアップ完了！\n削除された募集: ${result.jobs}\n削除された応募: ${result.apps}\n削除された通知: ${result.notifs}\n削除された取引: ${result.trans}`);
    } catch (e: any) {
      alert("クリーンアップに失敗しました: " + e.message);
    } finally {
      setCleaning(false);
    }
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
          <h3 className="text-base font-bold text-yui-green-700 mb-2">画面のくっきりさ</h3>
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

        {/* データベースクリーンアップ */}
        <button
          onClick={handleCleanup}
          disabled={cleaning}
          className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-all text-left shadow-sm mt-3"
          style={{ minHeight: "72px" }}
        >
          <div className="flex-1">
            <p className="font-bold text-red-700">不要なデータのクリーンアップ</p>
            <p className="text-sm text-red-600 mt-0.5">
              {cleaning ? "クリーンアップ中..." : "キャンセル済みの募集・応募や、不要なデータを一括削除します"}
            </p>
          </div>
        </button>
      </section>

      <HelpAdvisor
        isOpen={showHelpAdvisor}
        onClose={() => setShowHelpAdvisor(false)}
        showFloatingButton={false}
      />
    </div>
  );
}

