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
    <div className="px-4 py-5 space-y-6">
      {/* ポイント残高カード */}
      <div className="gradient-primary rounded-3xl p-6 text-white shadow-lg shadow-yui-green-900/20 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" aria-hidden="true" />
        <p className="text-sm text-white/70 font-bold mb-1.5 relative z-10">ポイント残高</p>
        <div className="flex items-center gap-3 relative z-10">
          <Coins className="w-10 h-10 text-yui-accent-light" aria-hidden="true" />
          <span className="text-5xl font-black tracking-tight">{user.tokenBalance}</span>
          <span className="text-lg text-white/70 mt-2">ポイント</span>
        </div>
        <Link
          href="/wallet"
          className="relative z-10 inline-flex items-center gap-1.5 mt-4 text-sm text-white/60 hover:text-white/90 transition-colors no-underline font-bold"
          style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
        >
          やりとりの記録を見る <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* ぴったりマッチ */}
      {matchedJobs.length > 0 && (
        <section aria-labelledby="match-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="match-heading" className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" aria-hidden="true" /> ぴったりの募集
            </h2>
          </div>
          <div className="space-y-3">
            {matchedJobs.slice(0, 3).map((job) => (
              <Link
                key={job.id}
                href={`/explore/${job.id}`}
                className="block relative card-premium rounded-2xl p-5 border-orange-200/80 hover:border-orange-300 no-underline bg-gradient-to-r from-orange-50/60 to-amber-50/40"
                aria-label={`${job.title} ${job.creatorName}さん ${job.date}`}
              >
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Zap className="w-3 h-3" aria-hidden="true" /> ぴったり
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                      <span className="text-xs bg-yui-green-100/80 text-yui-green-700 font-bold px-2.5 py-1 rounded-full">
                        {getJobTypeLabel(job.type)}
                      </span>
                    </div>
                    <h3 className="font-bold text-yui-green-800 text-base">{job.title}</h3>
                    <p className="text-sm text-yui-earth-600 mt-1">{job.creatorName}</p>
                    <p className="text-sm text-yui-earth-500 mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      {job.date} {job.startTime}〜{job.endTime}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="flex items-center gap-1 bg-amber-100/80 px-3 py-1.5 rounded-full">
                      <Coins className="w-4 h-4 text-yui-accent" aria-hidden="true" />
                      <span className="font-bold text-yui-earth-800 tabular-nums">{job.totalTokens}</span>
                      <span className="text-xs text-yui-earth-500">P</span>
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
          className="block card-premium rounded-2xl p-5 border-blue-200/60 no-underline hover:border-blue-300 bg-gradient-to-r from-blue-50/50 to-indigo-50/30"
          aria-label="手伝える時間を登録する"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-blue-700" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-blue-800 text-base">手伝える時間を登録しよう！</p>
              <p className="text-sm text-blue-600 mt-0.5">
                時間を登録すると、ぴったりの募集を自動でお知らせ
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* 直近の予定 */}
      <section aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="upcoming-heading" className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-yui-green-600" aria-hidden="true" /> 直近の予定
          </h2>
          <Link href="/schedule" className="text-sm text-yui-green-600 font-bold no-underline hover:text-yui-green-700" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
            すべて見る
          </Link>
        </div>
        {myUpcoming.length > 0 ? (
          <div className="space-y-2">
            {myUpcoming.map((app) => {
              const job = demoGetJobs().find((j) => j.id === app.jobId);
              if (!job) return null;
              return (
                <div key={app.id} className="card-premium rounded-2xl p-5">
                  <p className="font-bold text-yui-green-800">{job.title}</p>
                  <p className="text-sm text-yui-earth-600 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    {job.date} {job.startTime}〜{job.endTime}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-premium rounded-2xl p-6 text-center">
            <p className="text-base text-yui-earth-500">まだ予定はありません</p>
            <Link href="/explore" className="text-sm text-yui-green-600 font-bold mt-2 inline-block no-underline hover:text-yui-green-700" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
              お手伝い募集を探す →
            </Link>
          </div>
        )}
      </section>

      {/* おすすめヘルプ募集 */}
      <section aria-labelledby="recommend-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="recommend-heading" className="text-lg font-bold text-yui-green-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yui-accent" aria-hidden="true" /> おすすめ募集
          </h2>
          <Link href="/explore" className="text-sm text-yui-green-600 font-bold no-underline hover:text-yui-green-700" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
            すべて見る
          </Link>
        </div>
        <div className="space-y-3">
          {openJobs.map((job) => (
            <Link
              key={job.id}
              href={`/explore/${job.id}`}
              className="block card-premium rounded-2xl p-5 hover:border-yui-green-200 no-underline"
              aria-label={`${job.title} ${job.creatorName}さん ${job.date}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                    <span className="text-xs bg-yui-green-100/80 text-yui-green-700 font-bold px-2.5 py-1 rounded-full">
                      {getJobTypeLabel(job.type)}
                    </span>
                  </div>
                  <h3 className="font-bold text-yui-green-800 text-base">{job.title}</h3>
                  <p className="text-sm text-yui-earth-600 mt-1">{job.creatorName}</p>
                  <p className="text-sm text-yui-earth-500 mt-0.5 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    {job.date} {job.startTime}〜{job.endTime}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
                    <Coins className="w-4 h-4 text-yui-accent" aria-hidden="true" />
                    <span className="font-bold text-yui-earth-800 tabular-nums">{job.totalTokens}</span>
                    <span className="text-xs text-yui-earth-500">P</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近のやりとり */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="recent-heading" className="text-lg font-bold text-yui-green-800">💰 最近のやりとり</h2>
          <Link href="/wallet" className="text-sm text-yui-green-600 font-bold no-underline hover:text-yui-green-700" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
            すべて見る
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="card-premium rounded-2xl divide-y divide-yui-earth-100/60">
            {transactions.map((txn) => {
              const isIncome = txn.toUserId === user.uid;
              return (
                <div key={txn.id} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? "bg-green-50" : "bg-orange-50"}`}>
                      {isIncome ? (
                        <TrendingUp className="w-5 h-5 text-yui-success" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-orange-600" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yui-green-800">{txn.description}</p>
                      <p className="text-xs text-yui-earth-500">
                        {isIncome ? txn.fromUserName : txn.toUserName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-base tabular-nums ${isIncome ? "text-yui-success" : "text-orange-600"}`}>
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
          <div className="card-premium rounded-2xl p-6 text-center">
            <p className="text-yui-earth-500">やりとりの記録はまだありません</p>
          </div>
        )}
      </section>
    </div>
  );
}
