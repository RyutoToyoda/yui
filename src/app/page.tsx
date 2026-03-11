"use client";

import { useAuth } from "@/contexts/AuthContext";
import { demoGetJobs, demoGetTransactionsByUser, demoGetApplicationsByUser, getJobTypeEmoji, getJobTypeLabel } from "@/lib/demo-data";
import { Coins, CalendarDays, ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  const openJobs = demoGetJobs("open").filter((j) => j.creatorId !== user.uid).slice(0, 3);
  const myApplications = demoGetApplicationsByUser(user.uid);
  const myUpcoming = myApplications
    .filter((a) => a.status === "approved")
    .slice(0, 2);
  const transactions = demoGetTransactionsByUser(user.uid).slice(0, 3);

  return (
    <div className="px-4 py-5 space-y-6">
      {/* トークン残高カード */}
      <div className="bg-gradient-to-br from-yui-green-600 to-yui-green-800 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm text-yui-green-200 font-medium mb-1">トークン残高</p>
        <div className="flex items-center gap-3">
          <Coins className="w-10 h-10 text-yui-accent-light" />
          <span className="text-4xl font-black">{user.tokenBalance}</span>
          <span className="text-lg text-yui-green-200 mt-1">トークン</span>
        </div>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1 mt-3 text-sm text-yui-green-200 hover:text-white transition-colors no-underline"
        >
          取引履歴を見る <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 直近の予定 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> 直近の予定
          </h2>
          <Link href="/schedule" className="text-sm text-yui-green-600 font-medium no-underline hover:underline">
            すべて見る
          </Link>
        </div>
        {myUpcoming.length > 0 ? (
          <div className="space-y-2">
            {myUpcoming.map((app) => {
              const job = demoGetJobs().find((j) => j.id === app.jobId);
              if (!job) return null;
              return (
                <div key={app.id} className="bg-white rounded-xl p-4 shadow-sm border border-yui-green-100">
                  <p className="font-bold text-yui-green-800">{job.title}</p>
                  <p className="text-sm text-yui-earth-500 mt-1">
                    {job.date} {job.startTime}〜{job.endTime}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center text-yui-earth-400 shadow-sm border border-yui-green-100">
            <p className="text-base">まだ予定はありません</p>
            <Link href="/explore" className="text-sm text-yui-green-600 font-medium mt-1 inline-block no-underline">
              ヘルプ募集を探す →
            </Link>
          </div>
        )}
      </section>

      {/* おすすめヘルプ募集 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yui-accent" /> おすすめ募集
          </h2>
          <Link href="/explore" className="text-sm text-yui-green-600 font-medium no-underline hover:underline">
            すべて見る
          </Link>
        </div>
        <div className="space-y-3">
          {openJobs.map((job) => (
            <Link
              key={job.id}
              href={`/explore/${job.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-yui-green-100 hover:border-yui-green-300 transition-colors no-underline"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getJobTypeEmoji(job.type)}</span>
                    <span className="text-xs bg-yui-green-100 text-yui-green-700 font-bold px-2 py-0.5 rounded-full">
                      {getJobTypeLabel(job.type)}
                    </span>
                  </div>
                  <h3 className="font-bold text-yui-green-800 text-base">{job.title}</h3>
                  <p className="text-sm text-yui-earth-500 mt-1">{job.creatorName}</p>
                  <p className="text-sm text-yui-earth-400 mt-0.5">
                    📅 {job.date} {job.startTime}〜{job.endTime}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="flex items-center gap-1 bg-yui-accent/10 px-2.5 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-yui-accent" />
                    <span className="font-bold text-yui-green-800">{job.totalTokens}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近の取引 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-yui-green-800">💰 最近の取引</h2>
          <Link href="/wallet" className="text-sm text-yui-green-600 font-medium no-underline hover:underline">
            すべて見る
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-yui-green-100 divide-y divide-yui-green-50">
            {transactions.map((txn) => {
              const isIncome = txn.toUserId === user.uid;
              return (
                <div key={txn.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIncome ? "bg-green-100" : "bg-orange-100"}`}>
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yui-green-800">{txn.description}</p>
                      <p className="text-xs text-yui-earth-400">
                        {isIncome ? txn.fromUserName : txn.toUserName}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-base ${isIncome ? "text-green-600" : "text-orange-600"}`}>
                    {isIncome ? "+" : "-"}{txn.amount}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center text-yui-earth-400 shadow-sm border border-yui-green-100">
            取引履歴はまだありません
          </div>
        )}
      </section>
    </div>
  );
}
