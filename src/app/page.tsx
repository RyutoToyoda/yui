"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  demoGetJobs,
  demoGetTransactionsByUser,
  demoGetApplicationsByUser,
  demoGetMatchedJobsForUser,
  demoGetAvailabilitiesByUser,
  getJobTypeEmoji,
  getJobTypeLabel,
} from "@/lib/demo-data";
import { Coins, CalendarDays, ArrowRight, TrendingUp, TrendingDown, Sparkles, Zap, Clock } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  const openJobs = demoGetJobs("open").filter((j) => j.creatorId !== user.uid).slice(0, 3);
  const matchedJobs = demoGetMatchedJobsForUser(user.uid);
  const myAvailabilities = demoGetAvailabilitiesByUser(user.uid);
  const myApplications = demoGetApplicationsByUser(user.uid);
  const myUpcoming = myApplications
    .filter((a) => a.status === "approved")
    .slice(0, 2);
  const transactions = demoGetTransactionsByUser(user.uid).slice(0, 3);

  return (
    <div className="px-4 py-5 space-y-5">
      {/* トークン残高カード */}
      <div className="gradient-primary rounded-3xl p-6 text-white shadow-lg shadow-yui-green-900/20 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <p className="text-sm text-white/60 font-medium mb-1.5 relative z-10">トークン残高</p>
        <div className="flex items-center gap-3 relative z-10">
          <Coins className="w-10 h-10 text-yui-accent-light" />
          <span className="text-5xl font-black tracking-tight">{user.tokenBalance}</span>
          <span className="text-lg text-white/60 mt-2">トークン</span>
        </div>
        <Link
          href="/wallet"
          className="relative z-10 inline-flex items-center gap-1 mt-4 text-sm text-white/50 hover:text-white/80 transition-colors no-underline"
        >
          取引履歴を見る <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 🎯 ぴったりマッチ */}
      {matchedJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" /> ぴったりマッチ
            </h2>
          </div>
          <div className="space-y-3">
            {matchedJobs.slice(0, 3).map((job) => (
              <Link
                key={job.id}
                href={`/explore/${job.id}`}
                className="block relative card-premium rounded-2xl p-4 border-orange-200/80 hover:border-orange-300 no-underline bg-gradient-to-r from-orange-50/60 to-amber-50/40"
              >
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                  🎯 ぴったり
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{getJobTypeEmoji(job.type)}</span>
                      <span className="text-xs bg-yui-green-100/80 text-yui-green-700 font-bold px-2 py-0.5 rounded-full">
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
                    <div className="flex items-center gap-1 bg-amber-100/80 px-2.5 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-yui-accent" />
                      <span className="font-bold text-yui-earth-800 tabular-nums">{job.totalTokens}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* スキマ時間の登録促進 */}
      {myAvailabilities.length === 0 && (
        <Link
          href="/profile"
          className="block card-premium rounded-2xl p-4 border-blue-200/60 no-underline hover:border-blue-300 bg-gradient-to-r from-blue-50/50 to-indigo-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-blue-800 text-sm">スキマ時間を登録しよう！</p>
              <p className="text-xs text-blue-500 mt-0.5">
                手伝える時間を登録すると、ぴったりの募集を自動でお知らせ
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* 直近の予定 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-yui-green-600" /> 直近の予定
          </h2>
          <Link href="/schedule" className="text-sm text-yui-green-500 font-semibold no-underline hover:text-yui-green-600">
            すべて見る
          </Link>
        </div>
        {myUpcoming.length > 0 ? (
          <div className="space-y-2">
            {myUpcoming.map((app) => {
              const job = demoGetJobs().find((j) => j.id === app.jobId);
              if (!job) return null;
              return (
                <div key={app.id} className="card-premium rounded-2xl p-4">
                  <p className="font-bold text-yui-green-800">{job.title}</p>
                  <p className="text-sm text-yui-earth-500 mt-1">
                    {job.date} {job.startTime}〜{job.endTime}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-premium rounded-2xl p-5 text-center">
            <p className="text-base text-yui-earth-400">まだ予定はありません</p>
            <Link href="/explore" className="text-sm text-yui-green-500 font-semibold mt-1.5 inline-block no-underline hover:text-yui-green-600">
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
          <Link href="/explore" className="text-sm text-yui-green-500 font-semibold no-underline hover:text-yui-green-600">
            すべて見る
          </Link>
        </div>
        <div className="space-y-3">
          {openJobs.map((job) => (
            <Link
              key={job.id}
              href={`/explore/${job.id}`}
              className="block card-premium rounded-2xl p-4 hover:border-yui-green-200 no-underline"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{getJobTypeEmoji(job.type)}</span>
                    <span className="text-xs bg-yui-green-100/80 text-yui-green-700 font-bold px-2 py-0.5 rounded-full">
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
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                    <Coins className="w-4 h-4 text-yui-accent" />
                    <span className="font-bold text-yui-earth-800 tabular-nums">{job.totalTokens}</span>
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
          <Link href="/wallet" className="text-sm text-yui-green-500 font-semibold no-underline hover:text-yui-green-600">
            すべて見る
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="card-premium rounded-2xl divide-y divide-yui-earth-100/60">
            {transactions.map((txn) => {
              const isIncome = txn.toUserId === user.uid;
              return (
                <div key={txn.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? "bg-green-50" : "bg-orange-50"}`}>
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
                  <span className={`font-bold text-base tabular-nums ${isIncome ? "text-green-600" : "text-orange-500"}`}>
                    {isIncome ? "+" : "-"}{txn.amount}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-premium rounded-2xl p-5 text-center">
            <p className="text-yui-earth-400">取引履歴はまだありません</p>
          </div>
        )}
      </section>
    </div>
  );
}
