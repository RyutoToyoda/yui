"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJobs, fsGetJobsByUser, fsGetApplicationsByJob, getJobTypeEmoji, getJobTypeLabel, getPointsPerPerson } from "@/lib/firestore-service";
import { Coins, CalendarDays, Users, MapPin, Search, SlidersHorizontal, X, Wrench } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/types/firestore";

export default function ExplorePage() {
  const { user } = useAuth();
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullJobIds, setFullJobIds] = useState<Set<string>>(new Set());

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState<"all" | "human" | "machine" | "both">("all");
  const [filterMinPeople, setFilterMinPeople] = useState("");
  const [filterDateStr, setFilterDateStr] = useState("");
  const [filterMinPoints, setFilterMinPoints] = useState("");
  const [filterMaxPoints, setFilterMaxPoints] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadJobs() {
      const [jobs, userJobs] = await Promise.all([
        fsGetJobs(),
        fsGetJobsByUser(user!.uid)
      ]);
      if (cancelled) return;
      setAllJobs(jobs);

      const open = jobs.filter((job) => job.status === "open");
      const matched = jobs.filter((job) => job.status === "matched" || job.status === "in_progress");
      const activeUserJobs = userJobs.filter(
        (job) => job.status === "matched" || job.status === "in_progress"
      );

      const mergedMap = new Map();
      open.forEach(j => mergedMap.set(j.id, j));
      matched.forEach(j => mergedMap.set(j.id, j));
      activeUserJobs.forEach(j => mergedMap.set(j.id, j));

      // Check which jobs are full - use Promise.all for parallel queries
      const fullJobs = new Set<string>();
      if (matched.length > 0) {
        const appPromises = matched.map(job => 
          job.requiredPeople > 0 
            ? fsGetApplicationsByJob(job.id).catch(() => [])
            : Promise.resolve([])
        );
        const allAppsResults = await Promise.all(appPromises);
        
        matched.forEach((job, index) => {
          if (job.requiredPeople > 0) {
            const apps = allAppsResults[index] || [];
            const approvedCount = apps.filter(a => a.status === "approved").length;
            if (approvedCount >= job.requiredPeople) {
              fullJobs.add(job.id);
            }
          }
        });
      }
      setFullJobIds(fullJobs);

      setOpenJobs(Array.from(mergedMap.values()));
      setLoading(false);
    }

    loadJobs();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-yui-earth-500 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDateLocal(new Date());

  const profileAnchor = (user.location || "").split(" ")[0];
  const getRecommendScore = (job: Job) => {
    let score = 0;
    if (profileAnchor && job.location?.includes(profileAnchor)) score += 35;

    const elapsedHours = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours <= 24) score += 25;
    else if (elapsedHours <= 72) score += 15;

    score += Math.min(getPointsPerPerson(job), 20);
    return score;
  };

  // Get non-full, non-own jobs for recommendations
  const recommendedJobs = [...openJobs]
    .filter((job) => job.creatorId !== user.uid && job.date >= todayStr && !fullJobIds.has(job.id))
    .sort((a, b) => {
      // Sort by location match, then by date proximity
      const aLocMatch = (profileAnchor && a.location?.includes(profileAnchor)) ? 1 : 0;
      const bLocMatch = (profileAnchor && b.location?.includes(profileAnchor)) ? 1 : 0;
      if (aLocMatch !== bLocMatch) return bLocMatch - aLocMatch;

      // Then by date proximity (nearest first)
      return a.date.localeCompare(b.date);
    })
    .slice(0, 3); // Top 3 by location + time proximity

  const orderedOpenJobs = [...openJobs]
    .filter((job) => job.date >= todayStr)
    .sort((a, b) => {
      // 優先度0: 自分の投稿したジョブ（一番上）
      if (a.creatorId === user.uid && b.creatorId !== user.uid) return -1;
      if (b.creatorId === user.uid && a.creatorId !== user.uid) return 1;

      // 優先度1: 自分のプロフィールに近いエリア（エリア一致）
      const aLocMatch = (profileAnchor && a.location?.includes(profileAnchor)) ? 1 : 0;
      const bLocMatch = (profileAnchor && b.location?.includes(profileAnchor)) ? 1 : 0;
      if (aLocMatch !== bLocMatch) return bLocMatch - aLocMatch;

      // 優先度2: 日付が近い順（昇順）
      if (a.date !== b.date) return a.date.localeCompare(b.date);

      // 同日の場合は作成日の新しい順
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  let baseFilteredJobs = orderedOpenJobs;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    baseFilteredJobs = baseFilteredJobs.filter(job =>
      job.title.toLowerCase().includes(q) ||
      (job.description || "").toLowerCase().includes(q)
    );
  }
  if (filterLocation.trim()) {
    const locFilters = filterLocation.toLowerCase().split(/[ ,　]+/);
    baseFilteredJobs = baseFilteredJobs.filter(job =>
      locFilters.every(f => (job.location || "").toLowerCase().includes(f))
    );
  }
  if (filterType === "human") {
    baseFilteredJobs = baseFilteredJobs.filter(job => job.requiredPeople > 0 && !job.equipmentNeeded);
  } else if (filterType === "machine") {
    baseFilteredJobs = baseFilteredJobs.filter(job => !!job.equipmentNeeded && (!job.requiredPeople || job.requiredPeople === 0));
  } else if (filterType === "both") {
    baseFilteredJobs = baseFilteredJobs.filter(job => job.requiredPeople > 0 && !!job.equipmentNeeded);
  }
  if (filterMinPeople) {
    const minP = parseInt(filterMinPeople);
    if (!isNaN(minP)) {
      baseFilteredJobs = baseFilteredJobs.filter(job => job.requiredPeople >= minP);
    }
  }
  if (filterDateStr) {
    baseFilteredJobs = baseFilteredJobs.filter(job => job.date === filterDateStr);
  }
  if (filterMinPoints) {
    const minTokens = parseInt(filterMinPoints);
    if (!isNaN(minTokens)) {
      baseFilteredJobs = baseFilteredJobs.filter(job => getPointsPerPerson(job) >= minTokens);
    }
  }
  if (filterMaxPoints) {
    const maxTokens = parseInt(filterMaxPoints);
    if (!isNaN(maxTokens)) {
      baseFilteredJobs = baseFilteredJobs.filter(job => getPointsPerPerson(job) <= maxTokens);
    }
  }

  // Handle calendar view specifically: show only jobs for that date AT THE END
  let filteredJobs = baseFilteredJobs;

  const JobCard = ({ job, isRecommended, isOwnJob, isFull, onOwnJobClick }: { job: Job, isRecommended?: boolean, isOwnJob?: boolean, isFull?: boolean, onOwnJobClick?: (job: Job) => void }) => {
    const cardIsOwnJob = job.creatorId === user.uid;
    const bgGradient = isRecommended 
      ? "border-green-200 bg-gradient-to-r from-green-50 to-lime-50 hover:border-green-300"
      : cardIsOwnJob 
      ? "border-[#8c7361] bg-gradient-to-r from-[#f5f1ed] to-[#ebe5df] hover:border-[#7a6552]"
      : isFull
      ? "border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 hover:border-gray-400 opacity-75"
      : "border-[#468065] hover:border-[#2d5242]";

    const Component = cardIsOwnJob ? Link : Link;
    const componentProps = {
      href: `/explore/${job.id}`,
      className: `block relative h-full w-full min-w-0 overflow-hidden bg-white rounded-xl p-5 shadow-sm border-2 transition-colors no-underline ${bgGradient}`,
    };

    return (
      <Component
        key={job.id}
        {...componentProps}
        aria-label={`${job.title} ${job.creatorName}さん ${job.date}`}
      >
        {isOwnJob && !isRecommended && !isFull && (
          <div className="absolute top-0 right-0 text-white text-sm font-bold px-3 py-2 rounded-bl-xl z-10" style={{ backgroundColor: "#8c7361" }}>
            自分の
          </div>
        )}
        {isRecommended && !isFull && (
          <div className="absolute top-0 right-0 text-white text-sm font-bold px-3 py-2 rounded-bl-xl z-10" style={{ backgroundColor: "#4ade80" }}>
            おすすめ
          </div>
        )}
        {isFull && (
          <div className="absolute top-0 right-0 text-white text-sm font-bold px-3 py-2 rounded-bl-xl z-10" style={{ backgroundColor: "#888888" }}>
            満員
          </div>
        )}
        <div className="flex w-full min-w-0 flex-col h-full mt-1">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold mb-0.5 text-left ${isRecommended ? "text-green-700" : cardIsOwnJob ? "text-[#8c7361]" : "text-yui-earth-500"}`}>{job.creatorName}さん</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 bg-yui-green-50 px-2.5 py-0.5 rounded-full border border-yui-green-200">
                <span className="text-sm shrink-0" aria-hidden="true">{getJobTypeEmoji(job.type)}</span>
                <span className="text-xs text-yui-green-700 font-bold">
                  {getJobTypeLabel(job.type)}
                </span>
              </div>
              {job.requiredPeople > 0 && (
                <span className="text-xs font-bold text-yui-earth-600 bg-yui-earth-100 px-2 py-0.5 rounded-full border border-yui-earth-200">
                  {job.requiredPeople}人
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-bold text-yui-green-800 text-base break-words leading-tight">{job.title}</h3>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-green-200 shadow-sm">
                  <Coins className="w-3 h-3 text-yui-accent" aria-hidden="true" />
                  <span className="text-sm font-bold text-yui-green-800">{getPointsPerPerson(job)}</span>
                  <span className="text-xs text-yui-earth-500">P</span>
                </div>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-yui-earth-600 flex items-center gap-1 min-w-0">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{job.date} {job.startTime}〜{job.endTime}</span>
              </p>
              <p className="text-xs text-yui-earth-600 flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-yui-green-600 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{job.location ? job.location.replace(/[0-9０-９\-ー].*/, "").trim() : "（未指定）"}</span>
              </p>
            </div>
          </div>
        </div>
      </Component>
    );
  };

  return (
    <div className="py-1 space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800">お手伝い募集を探す</h1>

      {/* 検索・絞り込み */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-yui-earth-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="作業内容やタイトルで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-yui-green-100 rounded-xl text-sm font-bold placeholder:text-yui-earth-400 focus:outline-none focus:border-yui-green-400 focus:ring-4 focus:ring-yui-green-400/20 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 flex items-center justify-center p-3 rounded-xl border-2 transition-colors ${showFilters ? "bg-yui-green-50 border-yui-green-400 text-yui-green-700" : "bg-white border-yui-green-100 text-yui-earth-500 hover:bg-yui-earth-50"}`}
          aria-label="絞り込み設定"
        >
          <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-2xl border-2 border-yui-green-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-yui-green-800">絞り込み</h3>
            <button
              onClick={() => {
                setFilterLocation("");
                setFilterType("all");
                setFilterMinPeople("");
                setFilterDateStr("");
                setFilterMinPoints("");
                setFilterMaxPoints("");
              }}
              className="text-xs font-bold text-yui-earth-500 hover:text-yui-earth-700 underline"
            >
              条件をクリア
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-yui-earth-600 mb-2">場所（地名など）</label>
              <input
                type="text"
                placeholder="例: 木更津"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-yui-earth-50 border border-yui-earth-200 rounded-xl text-sm focus:outline-none focus:border-yui-green-400 focus:bg-white transition-colors placeholder:text-yui-earth-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-yui-earth-600 mb-2">作業形態</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "すべて" },
                  { id: "human", label: "人手のみ" },
                  { id: "machine", label: "農機具のみ" },
                  { id: "both", label: "両方" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFilterType(type.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-colors ${filterType === type.id
                        ? "bg-yui-green-600 text-white border-yui-green-600"
                        : "bg-white text-yui-earth-600 border-yui-earth-200 hover:border-yui-green-300"
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-yui-earth-600 mb-2">必要な人数</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "", label: "指定なし" },
                  { id: "1", label: "1人以上" },
                  { id: "2", label: "2人以上" },
                  { id: "5", label: "5人以上" },
                ].map((pop) => (
                  <button
                    key={pop.id}
                    onClick={() => setFilterMinPeople(pop.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-colors ${filterMinPeople === pop.id
                        ? "bg-yui-green-600 text-white border-yui-green-600"
                        : "bg-white text-yui-earth-600 border-yui-earth-200 hover:border-yui-green-300"
                      }`}
                  >
                    {pop.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-yui-earth-600 mb-2">日付</label>
              <input
                type="date"
                value={filterDateStr}
                onChange={(e) => setFilterDateStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-yui-earth-50 border border-yui-earth-200 rounded-xl text-sm focus:outline-none focus:border-yui-green-400 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-yui-earth-600 mb-2">お礼ポイント</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "", label: "指定なし" },
                  { id: "5", label: "5P以上" },
                  { id: "10", label: "10P以上" },
                  { id: "20", label: "20P以上" },
                  { id: "50", label: "50P以上" },
                ].map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => { setFilterMinPoints(pt.id); setFilterMaxPoints(""); }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-colors ${filterMinPoints === pt.id
                        ? "bg-yui-green-600 text-white border-yui-green-600"
                        : "bg-white text-yui-earth-600 border-yui-earth-200 hover:border-yui-green-300"
                      }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3.5 bg-yui-green-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-yui-green-700 transition-colors"
              >
                この条件で表示する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自分の募集 - Show FIRST, no title */}
      {(() => {
        const ownJobs = filteredJobs.filter(job => job.creatorId === user.uid);
        return ownJobs.length > 0 ? (
          <section aria-labelledby="own-jobs-heading" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {ownJobs.map((job) => (
                <JobCard key={job.id} job={job} isOwnJob={true} isFull={fullJobIds.has(job.id)} />
              ))}
            </div>
          </section>
        ) : null;
      })()}

      {/* おすすめ - Top recommendations, NOT duplicated in list below */}
      {recommendedJobs.length > 0 && !searchQuery && !showFilters && !filterDateStr && !filterMinPoints && !filterMinPeople && !filterLocation && filterType === "all" && (
        <section aria-labelledby="recommended-heading" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {recommendedJobs.map((job) => (
              <JobCard key={`recommended-${job.id}`} job={job} isRecommended={true} isFull={fullJobIds.has(job.id)} />
            ))}
          </div>
        </section>
      )}

      {/* その他のジョブリスト - exclude own jobs and recommended jobs */}
      <div className="space-y-3">
        {(() => {
          const recommendedIds = new Set(recommendedJobs.map(j => j.id));
          const otherJobs = filteredJobs.filter(job => 
            job.creatorId !== user.uid && 
            !recommendedIds.has(job.id) &&
            !fullJobIds.has(job.id)
          );
          
          return otherJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {otherJobs.map((job) => (
                <JobCard key={job.id} job={job} isFull={false} />
              ))}
            </div>
          ) : null;
        })()}
      </div>

      {/* 満員ジョブ - Show at the BOTTOM as low priority */}
      {(() => {
        const fullJobs = filteredJobs.filter(job => fullJobIds.has(job.id));
        return fullJobs.length > 0 ? (
          <section aria-labelledby="full-jobs-heading" className="space-y-3 mt-6 pt-4 border-t-2 border-yui-earth-200">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {fullJobs.map((job) => (
                <JobCard key={job.id} job={job} isFull={true} />
              ))}
            </div>
          </section>
        ) : null;
      })()}

      {/* No jobs message */}
      {(() => {
        const ownJobs = filteredJobs.filter(job => job.creatorId === user.uid);
        const otherJobs = filteredJobs.filter(job => job.creatorId !== user.uid && !fullJobIds.has(job.id));
        const fullJobs = filteredJobs.filter(job => fullJobIds.has(job.id));
        
        if (ownJobs.length === 0 && otherJobs.length === 0 && fullJobs.length === 0) {
          return (
            <div className="bg-white rounded-xl p-6 text-center text-yui-earth-500 shadow-sm border-2 border-yui-green-100">
              今は募集がありません
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
