"use client";

import { useAuth } from "@/contexts/AuthContext";
import { demoGetTransactionsByUser } from "@/lib/demo-data";
import { Coins, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const { user } = useAuth();
  if (!user) return null;

  const transactions = demoGetTransactionsByUser(user.uid);

  const totalEarned = transactions
    .filter((t) => t.toUserId === user.uid)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.fromUserId === user.uid)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">ウォレット</h1>

      {/* 残高カード */}
      <div className="bg-gradient-to-br from-yui-green-600 to-yui-green-800 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm text-yui-green-200 font-medium mb-1">トークン残高</p>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-12 h-12 text-yui-accent-light" />
          <span className="text-5xl font-black">{user.tokenBalance}</span>
        </div>
        <div className="flex divide-x divide-yui-green-500/50">
          <div className="flex-1 pr-4">
            <p className="text-xs text-yui-green-300">累計獲得</p>
            <p className="text-lg font-bold text-green-300 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +{totalEarned}
            </p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-xs text-yui-green-300">累計使用</p>
            <p className="text-lg font-bold text-orange-300 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> -{totalSpent}
            </p>
          </div>
        </div>
      </div>

      {/* 取引履歴 */}
      <section>
        <h2 className="text-lg font-bold text-yui-green-800 mb-3">取引履歴</h2>
        {transactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-yui-green-100 divide-y divide-yui-green-50">
            {transactions.map((txn) => {
              const isIncome = txn.toUserId === user.uid;
              return (
                <div key={txn.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isIncome ? "bg-green-100" : "bg-orange-100"
                    }`}>
                      {isIncome ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yui-green-800">{txn.description}</p>
                      <p className="text-xs text-yui-earth-400">
                        {isIncome ? `${txn.fromUserName}から` : `${txn.toUserName}へ`}
                      </p>
                      <p className="text-xs text-yui-earth-300 mt-0.5">
                        {txn.createdAt.toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-lg ${isIncome ? "text-green-600" : "text-orange-600"}`}>
                    {isIncome ? "+" : "-"}{txn.amount}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-yui-earth-400 shadow-sm border border-yui-green-100">
            まだ取引はありません
          </div>
        )}
      </section>

      <div className="bg-yui-green-50 rounded-xl p-4 text-center">
        <p className="text-sm text-yui-green-700 font-medium">
          💡 トークンは農作業を手伝うことで増やせます
        </p>
        <Link href="/explore" className="text-sm text-yui-green-600 font-bold mt-1 inline-block no-underline">
          ヘルプ募集を探す →
        </Link>
      </div>
    </div>
  );
}
