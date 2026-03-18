"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetTransactionsByUser } from "@/lib/firestore-service";
import type { Transaction } from "@/types/firestore";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fsGetTransactionsByUser(user.uid).then((txns) => {
      if (!cancelled) {
        setTransactions(txns);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  const totalEarned = transactions
    .filter((t) => t.toUserId === user.uid)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.fromUserId === user.uid)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="py-3 space-y-4">
      <h1 className="text-xl font-bold text-yui-green-800">やりとりの記録</h1>

      {/* 残高カード */}
      <div className="bg-gradient-to-br from-yui-green-600 to-yui-green-800 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm text-yui-green-200 font-bold mb-1">ポイント残高</p>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-12 h-12 text-yui-accent-light" aria-hidden="true" />
          <span className="text-5xl font-black">{user.tokenBalance}</span>
          <span className="text-lg text-white/70 mt-2">ポイント</span>
        </div>
        <div className="flex divide-x divide-yui-green-500/50">
          <div className="flex-1 pr-4">
            <p className="text-xs text-yui-green-300 font-medium">これまでもらった</p>
            <p className="text-lg font-bold text-green-300 flex items-center gap-1">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
              <span aria-label={`もらった合計 ${totalEarned}ポイント`}>+{totalEarned}</span>
            </p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-xs text-yui-green-300 font-medium">これまで使った</p>
            <p className="text-lg font-bold text-orange-300 flex items-center gap-1">
              <TrendingDown className="w-5 h-5" aria-hidden="true" />
              <span aria-label={`使った合計 ${totalSpent}ポイント`}>-{totalSpent}</span>
            </p>
          </div>
        </div>
      </div>

      {/* やりとり履歴 */}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-bold text-yui-green-800 mb-3">やりとりの一覧</h2>
        {transactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-yui-green-100 divide-y divide-yui-green-50">
            {transactions.map((txn) => {
              const isIncome = txn.toUserId === user.uid;
              return (
                <div key={txn.id} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isIncome ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"
                    }`}>
                      {isIncome ? (
                        <TrendingUp className="w-5 h-5 text-yui-success" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-orange-600" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yui-green-800">{txn.description}</p>
                      <p className="text-xs text-yui-earth-500">
                        {isIncome ? `${txn.fromUserName}さんから` : `${txn.toUserName}さんへ`}
                      </p>
                      <p className="text-xs text-yui-earth-400 mt-0.5">
                        {txn.createdAt.toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg tabular-nums ${isIncome ? "text-yui-success" : "text-orange-600"}`}>
                      {isIncome ? "+" : "-"}{txn.amount}
                    </span>
                    <p className={`text-xs font-bold ${isIncome ? "text-yui-success" : "text-orange-600"}`}>
                      {isIncome ? "もらった" : "使った"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-yui-earth-500 shadow-sm border-2 border-yui-green-100">
            まだやりとりはありません
          </div>
        )}
      </section>

      <div className="bg-yui-green-50 rounded-xl p-5 text-center">
        <p className="text-sm text-yui-green-700 font-bold">
          💡 ポイントは農作業を手伝うことで増やせます
        </p>
        <Link
          href="/explore"
          className="text-sm text-yui-green-600 font-bold mt-2 inline-block no-underline"
          style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
        >
          お手伝い募集を探す →
        </Link>
      </div>
    </div>
  );
}
