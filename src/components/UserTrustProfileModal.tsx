"use client";

import { useEffect, useState } from "react";
import { fsGetUserTrustProfile } from "@/lib/firestore-service";
import type { UserTrustProfileSummary } from "@/types/firestore";

type UserTrustProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
};

export default function UserTrustProfileModal({
  isOpen,
  onClose,
  userId,
  userName,
}: UserTrustProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<UserTrustProfileSummary>({ repeatCount: 0, histories: [] });

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await fsGetUserTrustProfile(userId);
        if (!cancelled) setSummary(result);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSummary({ repeatCount: 0, histories: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="信頼度プロフィール">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-yui-green-800 mb-3">{userName}さん</h2>

        {loading ? (
          <p className="text-sm text-yui-earth-700 mb-4">読み込み中...</p>
        ) : (
          <>
            <p className="text-sm text-yui-earth-700 mb-4">
              🔁 リピート実績：同じ農家さんから{summary.repeatCount}回呼ばれています
            </p>

            <div className="space-y-2 mb-5">
              <p className="text-sm font-bold text-yui-green-800">お手伝い履歴</p>
              {summary.histories.length === 0 ? (
                <p className="text-sm text-yui-earth-700">まだ履歴がありません</p>
              ) : (
                summary.histories.map((item, idx) => (
                  <p key={`${item.title}-${idx}`} className="text-sm text-yui-earth-700">
                    {item.title}：{item.count}回（👍 {item.good} / 👎 {item.bad}）
                  </p>
                ))
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg border border-yui-green-200 text-yui-green-700 font-bold"
          style={{ minHeight: "44px" }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
