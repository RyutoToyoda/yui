"use client";

import { useState } from "react";
import { Sprout, Megaphone, Clock, Coins, ArrowRight, ChevronLeft } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Sprout,
    iconBg: "bg-yui-green-100",
    iconColor: "text-yui-green-600",
    emoji: "🌾",
    title: "ようこそ 結 Yui へ",
    line1: "農家同士で助け合うアプリです",
    line2: "同じ地域の幅広い年齢の人と交流しましょう",
  },
  {
    icon: Megaphone,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    emoji: "📣",
    title: "手伝ってほしい時",
    line1: "「募集」から作業内容と日時を登録",
    line2: "人手・機具・機具+人の3タイプで依頼できます",
  },
  {
    icon: Clock,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    emoji: "🕐",
    title: "手伝いたい時",
    line1: "「スキマ時間」を登録しておくと\nぴったりの募集を自動でお知らせ",
    line2: "「探す」から直接応募もOK",
  },
  {
    icon: Coins,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    emoji: "💰",
    title: "トークンの仕組み",
    line1: "作業完了 → トークンが自動で受け取れる",
    line2: "貯めたトークンで、次はあなたがヘルプを依頼！",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* スキップ */}
      <div className="flex justify-end px-5 pt-4">
        {!isLast && (
          <button
            onClick={onComplete}
            className="text-sm text-yui-earth-400 font-medium hover:text-yui-earth-600 transition-colors"
          >
            スキップ
          </button>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[430px] mx-auto w-full">
        {/* アイコン */}
        <div className={`w-28 h-28 rounded-3xl ${slide.iconBg} flex items-center justify-center mb-8 shadow-sm`}>
          <Icon className={`w-14 h-14 ${slide.iconColor}`} />
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-black text-yui-green-800 mb-6 text-center">
          {slide.title}
        </h1>

        {/* 説明文 */}
        <div className="text-center space-y-3">
          <p className="text-base text-yui-green-700 font-bold leading-relaxed whitespace-pre-line">
            {slide.line1}
          </p>
          <p className="text-sm text-yui-earth-500 leading-relaxed">
            {slide.line2}
          </p>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="px-8 pb-10 pt-4 max-w-[430px] mx-auto w-full">
        {/* ドットインジケーター */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-yui-green-600"
                  : "w-2 bg-yui-green-200"
              }`}
            />
          ))}
        </div>

        {/* ボタン */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={() => setCurrent(current - 1)}
              className="w-12 h-12 rounded-xl border-2 border-yui-green-200 flex items-center justify-center text-yui-green-600 hover:bg-yui-green-50 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setCurrent(current + 1);
              }
            }}
            className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              isLast
                ? "bg-yui-green-600 text-white hover:bg-yui-green-700 shadow-lg"
                : "bg-yui-green-600 text-white hover:bg-yui-green-700"
            }`}
          >
            {isLast ? (
              <>はじめる 🚀</>
            ) : (
              <>次へ <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
