"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    emoji: "📅",
    title: "①ホーム画面はあなたの予定表",
    body: "アプリを開くと、最初に「予定ページ」が表示されます。ここにはあなたの直近の作業予定がカレンダーで確認できます。",
  },
  {
    emoji: "🚜",
    title: "③人手や農機具を募集する",
    body: "画面の下にある「募集」ボタンを押すと、お手伝いを頼むことができます。詳細設定で1時間あたりのポイント単位なども変更できます。",
  },
  {
    emoji: "🔍",
    title: "③お手伝いを探す",
    body: "画面の下の探すページに他人が募集したお手伝いの投稿をリストで見られます。手伝いに行きたい投稿をクリックし，手を挙げるボタンで応募できます。このページには自分が募集した投稿も確認できます。",
  },
  {
    emoji: "🤖",
    title: "④AIに相談する",
    body: "アプリ利用上で困ったことをAIに相談できます．AI相談ボタンを押し，音声かテキストで質問できます。",
  },
  {
    emoji: "👤",
    title: "⑤ 自分の情報を登録・設定の変更",
    body: "自分の農機具・作物を登録したい時は、右上のマイページに移動し，登録できます。文字の大きさなどの設定変更はマイページの一番下の設定ボタンからアクセスできます。",
    isLast: true,
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = slide.isLast ?? false;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="結 Yuiの使い方"
    >
      {/* スキップボタン */}
      <div className="flex justify-end px-4 md:px-6 pt-3 md:pt-5 shrink-0">
        {!isLast && (
          <button
            onClick={onComplete}
            className="onboarding-skip text-base md:text-lg text-yui-earth-500 font-bold hover:text-yui-earth-700 transition-colors px-3 md:px-4 py-2"
            style={{ minHeight: "44px" }}
            aria-label="説明をスキップ"
          >
            スキップ
          </button>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 md:py-12 max-w-2xl mx-auto w-full space-y-3 md:space-y-6 overflow-y-auto">
        {/* 大きな絵文字 */}
        <div className="text-6xl md:text-8xl shrink-0" role="img" aria-label={slide.emoji}>
          {slide.emoji}
        </div>

        {/* タイトル */}
        <h1 className="text-2xl md:text-4xl font-bold text-yui-green-800 text-center shrink-0">
          {slide.title}
        </h1>

        {/* 説明文 */}
        <p className={`text-lg md:text-3xl text-yui-earth-500 text-center leading-relaxed shrink-0 ${current === 0 ? "onboarding-intro-body" : ""}`} style={{ lineHeight: "1.7" }}>
          {slide.body}
        </p>
      </div>

      {/* ナビゲーション */}
      <div className="px-4 md:px-8 py-4 md:py-8 pb-6 md:pb-12 max-w-2xl mx-auto w-full shrink-0 bg-white">
        {/* ドットインジケーター */}
        <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-8" role="group" aria-label={`${slides.length}ページ中${current + 1}ページ目`}>
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 md:w-10 bg-yui-green-600"
                  : "w-2 md:w-3 bg-yui-earth-300"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* ボタン群 */}
        <div className="flex items-center gap-2 md:gap-3">
          {current > 0 && (
            <button
              onClick={() => setCurrent(current - 1)}
              className="w-12 md:w-16 h-12 md:h-16 rounded-xl md:rounded-2xl border-2 border-yui-earth-300 flex items-center justify-center text-yui-earth-600 hover:bg-yui-earth-50 transition-colors shrink-0"
              style={{ minHeight: "48px", minWidth: "48px" }}
              aria-label="前のページへ"
            >
              <ChevronLeft className="w-5 md:w-7 h-5 md:h-7" aria-hidden="true" />
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
            className="flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl flex items-center justify-center gap-1 md:gap-2 transition-colors"
            style={{
              minHeight: "48px",
              background: "linear-gradient(135deg, var(--color-yui-green-600) 0%, var(--color-yui-green-700) 100%)",
              color: "white",
            }}
            aria-label={isLast ? "アプリをはじめる" : "次へ"}
          >
            {isLast ? (
              <>アプリをはじめる</>
            ) : (
              <>
                次へ <ArrowRight className="w-5 md:w-6 h-5 md:h-6" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
