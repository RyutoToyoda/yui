"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsGetJobs, fsGetJobsByUser, fsGetApplicationsByJob, getJobTypeEmoji, getJobTypeLabel, getPointsPerPerson } from "@/lib/firestore-service";
import { Coins, CalendarDays, Users, MapPin, Search, SlidersHorizontal, X, Wrench, Clock } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/types/firestore";

export default function ExplorePage() {
  const { user } = useAuth();
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullJobIds, setFullJobIds] = useState<Set<string>>(new Set());
  const [payoutReminderJobIds, setPayoutReminderJobIds] = useState<Set<string>>(new Set());
  const [pastUnpaidJobIds, setPastUnpaidJobIds] = useState<Set<string>>(new Set());

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState<"all" | "human" | "machine" | "both">("all");
  const [filterMinPeople, setFilterMinPeople] = useState("");
  const [filterDateStr, setFilterDateStr] = useState("");
  const [filterMinPoints, setFilterMinPoints] = useState("");
  const [filterMaxPoints, setFilterMaxPoints] = useState("");

  const isPastByDateTime = (job: Job) => {
    const now = new Date();
    const [y, m, d] = (job.date || "").split("-").map(Number);
    const [hh, mm] = (job.endTime || "00:00").split(":").map(Number);
    if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return false;
    const endDateTime = new Date(y, m - 1, d, hh, mm, 0, 0);
    return endDateTime.getTime() < now.getTime();
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadJobs() {
      try {
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

        // Check full jobs and past unpaid jobs with one batched app lookup.
        const fullJobs = new Set<string>();
        const reminderJobs = new Set<string>();
        const pastUnpaidJobs = new Set<string>();
        const activeJobs = Array.from(mergedMap.values()).filter(
          (job) => job.status !== "completed" && job.status !== "cancelled"
        );

        if (activeJobs.length > 0) {
          const appsResults = await Promise.all(
            activeJobs.map((job) => fsGetApplicationsByJob(job.id).catch(() => []))
          );

          activeJobs.forEach((job, index) => {
            const apps = appsResults[index] || [];
            const approvedCount = apps.filter((a) => a.status === "approved").length;

            if (job.requiredPeople > 0 && approvedCount >= job.requiredPeople) {
              fullJobs.add(job.id);
            }

            const hasUnpaidApproved = approvedCount > 0;
            if (hasUnpaidApproved && isPastByDateTime(job)) {
              pastUnpaidJobs.add(job.id);
              if (job.creatorId === user!.uid) {
                reminderJobs.add(job.id);
              }
            }
          });
        }

        setFullJobIds(fullJobs);
        setPayoutReminderJobIds(reminderJobs);
        setPastUnpaidJobIds(pastUnpaidJobs);

        setOpenJobs(Array.from(mergedMap.values()));
      } catch (error) {
        console.error("Error loading jobs:", error);
        setOpenJobs([]);
        setFullJobIds(new Set());
        setPayoutReminderJobIds(new Set());
        setPastUnpaidJobIds(new Set());
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="loading-text text-yui-earth-500 text-lg">読み込み中...</p>
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

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      return (endMins - startMins) / 60;
    } catch {
      return 0;
    }
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
    .filter((job) => job.creatorId !== user.uid && !isPastByDateTime(job) && !fullJobIds.has(job.id))
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
    .filter((job) => {
      const isPast = isPastByDateTime(job);
      if (job.creatorId === user.uid) {
        return !isPast || pastUnpaidJobIds.has(job.id);
      }
      return !isPast && !pastUnpaidJobIds.has(job.id);
    })
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
    const showPayoutReminder = cardIsOwnJob && payoutReminderJobIds.has(job.id);
    const bgGradient = isRecommended 
      ? "border-green-200 bg-gradient-to-r from-green-50 to-lime-50 hover:border-green-300"
      : showPayoutReminder
      ? "border-red-300 bg-gradient-to-r from-[#f5f1ed] via-[#f1e1d8] to-red-50 hover:border-red-400"
      : cardIsOwnJob 
      ? "border-[#8c7361] bg-gradient-to-r from-[#f5f1ed] to-[#ebe5df] hover:border-[#7a6552]"
      : isFull
      ? "border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 hover:border-gray-400 opacity-75"
      : "border-[#468065] hover:border-[#2d5242]";

    const Component = cardIsOwnJob ? Link : Link;
    const componentProps = {
      href: `/explore/${job.id}`,
      className: `block relative w-full min-w-0 bg-white rounded-xl px-4 pt-4 pb-3 shadow-sm border-2 transition-colors no-underline ${bgGradient}`,
    };

    return (
      <Component
        key={job.id}
        {...componentProps}
        aria-label={`${job.title} ${job.creatorName}さん ${job.date}`}
      >
        {cardIsOwnJob ? (
          showPayoutReminder ? (
            <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10 bg-red-600">
              未支払い
            </div>
          ) : (
            <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10" style={{ backgroundColor: "#8c7361" }}>
              自分の
            </div>
          )
        ) : isRecommended && !isFull ? (
          <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10" style={{ backgroundColor: "#4ade80" }}>
            おすすめ
          </div>
        ) : isFull ? (
          <div className="absolute -top-[2px] -right-[2px] text-white text-sm font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-xl z-10" style={{ backgroundColor: "#888888" }}>
            満員
          </div>
        ) : null}
        <div className="flex w-full min-w-0 flex-col">
          <p className={`text-xs font-bold mb-0.5 text-left ${isRecommended ? "text-green-700" : cardIsOwnJob ? "text-[#8c7361]" : "text-yui-earth-500"}`}>{job.creatorName}さん</p>
          
          {/* Two-column layout */}
          <div className="flex justify-between gap-3 mb-0">
            {/* Left side: Title + Info */}
            <div className="flex flex-col flex-1 min-w-0 pb-1">
              {/* Job title */}
              <h3 className="font-bold text-yui-green-800 text-2xl break-words leading-tight pb-2">{job.title}</h3>
              
              {/* Date, time, location */}
              <div className="space-y-1.5">
                <p className="text-sm text-yui-earth-700 font-bold flex items-center gap-1.5 min-w-0">
                  <CalendarDays className="w-4 h-4 text-yui-green-600 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 truncate">{job.date}</span>
                </p>
                {job.startTime && job.endTime && (
                  <p className="text-sm text-yui-earth-700 font-bold flex items-center gap-1.5 min-w-0">
                    <Clock className="w-4 h-4 text-yui-green-600 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{calculateHours(job.startTime, job.endTime)}時間</span>
                  </p>
                )}
                {typeof job.location === 'string' && (
                  <p className="text-sm text-yui-earth-700 font-bold flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-yui-green-600 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{job.location.replace(/[0-9０-９\-ー].*/, "").trim() || "（未指定）"}</span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Right side: Pay and tags */}
            <div className="flex flex-col items-end gap-2 shrink-0 pb-0.5">
              {/* Points earned */}
              <div className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 transition-colors px-4 py-3 rounded-2xl border-2 border-amber-200 shadow-sm w-fit mb-1">
                <Coins className="w-6 h-6 text-yui-accent" aria-hidden="true" />
                <span className="text-2xl font-black text-yui-earth-800 tabular-nums leading-none tracking-tight">{getPointsPerPerson(job)}</span>
                <span className="text-sm font-bold text-yui-earth-800 leading-none pt-1">P</span>
              </div>

              {/* Tags section */}
              <div className="flex flex-col items-end gap-1">
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
            </div>
          </div>
        </div>
      </Component>
    );
  };

  return (
    <div className="pt-1 space-y-3 pb-20">
      <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">
        <Search className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
        お手伝い募集を探す
      </h1>

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
                  { id: "1", label: "1P以上" },
                  { id: "2", label: "2P以上" },
                  { id: "3", label: "3P以上" },
                  { id: "5", label: "5P以上" },
                  { id: "10", label: "10P以上" },
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
        const ownJobs = filteredJobs
          .filter(job => job.creatorId === user.uid)
          .sort((a, b) => {
            const aIsPayoutMode = payoutReminderJobIds.has(a.id) ? 1 : 0;
            const bIsPayoutMode = payoutReminderJobIds.has(b.id) ? 1 : 0;
            if (aIsPayoutMode !== bIsPayoutMode) return bIsPayoutMode - aIsPayoutMode;
            return a.date.localeCompare(b.date);
          });
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
        const fullJobs = filteredJobs.filter(job => fullJobIds.has(job.id) && job.creatorId !== user.uid);
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
        const fullJobs = filteredJobs.filter(job => fullJobIds.has(job.id) && job.creatorId !== user.uid);
        
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
