"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsCreateJob } from "@/lib/firestore-service";
import { useRouter } from "next/navigation";
import { Users, Wrench, Truck, Coins, CheckCircle2, AlertTriangle } from "lucide-react";
import type { JobType } from "@/types/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";

const jobTypes = [
  {
    type: "labor" as JobType,
    label: "人のみ",
    desc: "人手をお願いする",
    icon: Users,
    emoji: "👤",
    defaultRate: 1,
  },
  {
    type: "equipment" as JobType,
    label: "農機具のみ",
    desc: "農機具を借りる",
    icon: Wrench,
    emoji: "🚜",
    defaultRate: 2,
  },
  {
    type: "hybrid" as JobType,
    label: "農機具＋人",
    desc: "農機具と一緒に人も来てもらう",
    icon: Truck,
    emoji: "🚜👤",
    defaultRate: 4,
    recommended: true,
  },
];

const ratePresets = [
  { label: "軽い作業", rate: 1 },
  { label: "ふつう", rate: 1.5 },
  { label: "大変な作業", rate: 2 },
  { label: "農機具＋人", rate: 4 },
];

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<JobType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [tokenRate, setTokenRate] = useState(1);
  const [requiredPeople, setRequiredPeople] = useState(1);
  const [equipmentNeeded, setEquipmentNeeded] = useState("");
  const [location, setLocation] = useState(user?.location || "");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) return null;

  const calculateTotalTokens = () => {
    const start = startTime.split(":").map(Number);
    const end = endTime.split(":").map(Number);
    const hours = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
    return Math.max(0, Math.round(hours * tokenRate * (requiredPeople || 1) * 10) / 10);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedType) {
      setError("募集の種類を選んでください");
      return;
    }
    if (!title || !date || !location) {
      setError("タイトル、日付、作業場所は必ず入力してください");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    const totalTokens = calculateTotalTokens();

    await fsCreateJob({
      creatorId: user.uid,
      creatorName: user.name,
      type: selectedType!,
      title,
      description,
      date,
      startTime,
      endTime,
      tokenRatePerHour: tokenRate,
      totalTokens,
      requiredPeople: selectedType === "equipment" ? 0 : requiredPeople,
      equipmentNeeded,
      location,
      status: "open",
      createdAt: new Date(),
    });

    setShowConfirm(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="px-4 py-10 text-center">
        <CheckCircle2 className="w-16 h-16 text-yui-success mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-yui-green-800 mb-2">募集を作成しました！</h2>
        <p className="text-sm text-yui-earth-600 mb-6">手伝ってくれる人をお待ちください</p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/explore")}
            className="w-full py-4 bg-yui-green-600 text-white font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
            style={{ minHeight: "52px" }}
          >
            募集の一覧を見る
          </button>
          <button
            onClick={() => { setSubmitted(false); setSelectedType(null); setTitle(""); setDescription(""); }}
            className="w-full py-4 bg-white text-yui-green-600 font-bold rounded-xl border-2 border-yui-green-200 hover:bg-yui-green-50 transition-colors"
            style={{ minHeight: "52px" }}
          >
            もう一つ作成する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-6">
      <h1 className="text-xl font-bold text-yui-green-800">お手伝いを募集する</h1>

      {/* タイプ選択 */}
      <section aria-labelledby="type-heading">
        <h2 id="type-heading" className="text-base font-bold text-yui-green-800 mb-3">募集の種類を選ぶ</h2>
        <div className="space-y-3">
          <select
            value={selectedType || ""}
            onChange={(e) => {
              const type = e.target.value as JobType;
              const jt = jobTypes.find((t) => t.type === type);
              setSelectedType(type || null);
              if (jt) setTokenRate(jt.defaultRate);
            }}
            className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white appearance-none"
            aria-label="募集の種類"
          >
            <option value="">募集の種類を選択してください</option>
            {jobTypes.map((jt) => (
              <option key={jt.type} value={jt.type}>
                {jt.label}（{jt.desc}）
              </option>
            ))}
          </select>
        </div>

        {/* カテゴリ選択時の基準レート表示 */}
        {selectedType && (
          <div className="flex items-center gap-2 bg-yui-green-50 border border-yui-green-200 rounded-xl px-4 py-3">
            <Coins className="w-5 h-5 text-yui-accent" aria-hidden="true" />
            <span className="text-sm font-bold text-yui-green-800">
              このカテゴリの基準レート: {jobTypes.find(jt => jt.type === selectedType)?.defaultRate ?? 1} P/時間
            </span>
          </div>
        )}
      </section>

      {selectedType && (
        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* タイトル */}
          <div>
            <label htmlFor="job-title" className="block text-sm font-bold text-yui-green-800 mb-2">
              タイトル <span className="text-yui-danger font-bold">（必ず入力）</span>
            </label>
            <input
              id="job-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：田植え作業の手伝い募集"
              className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              required
            />
          </div>
 
          {/* 作業場所 */}
          <div>
            <label htmlFor="job-location" className="block text-sm font-bold text-yui-green-800 mb-2">
              作業場所 <span className="text-yui-danger font-bold">（必ず入力）</span>
            </label>
            <input
              id="job-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：〇〇農園の西側の田んぼ"
              className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              required
            />
          </div>
 
          {/* 日付と時間 */}
          <div>
            <label htmlFor="job-date" className="block text-sm font-bold text-yui-green-800 mb-2">
              作業する日 <span className="text-yui-danger font-bold">（必ず入力）</span>
            </label>
            <input
              id="job-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="job-start" className="block text-sm font-bold text-yui-green-800 mb-2">はじまり</label>
              <input
                id="job-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="job-end" className="block text-sm font-bold text-yui-green-800 mb-2">おわり</label>
              <input
                id="job-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* 人数 */}
          {selectedType !== "equipment" && (
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-2">何人必要ですか？</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setRequiredPeople(Math.max(1, requiredPeople - 1))}
                  className="w-14 h-14 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-2xl hover:bg-yui-green-200 transition-colors"
                  aria-label="人数を減らす"
                >
                  −
                </button>
                <span className="text-3xl font-bold text-yui-green-800 w-10 text-center" aria-live="polite">
                  {requiredPeople}
                </span>
                <button
                  type="button"
                  onClick={() => setRequiredPeople(requiredPeople + 1)}
                  className="w-14 h-14 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-2xl hover:bg-yui-green-200 transition-colors"
                  aria-label="人数を増やす"
                >
                  ＋
                </button>
                <span className="text-base text-yui-earth-600 font-bold">名</span>
              </div>
            </div>
          )}

          {/* 機具 */}
          {(selectedType === "equipment" || selectedType === "hybrid") && (
            <div>
              <label htmlFor="job-equip" className="block text-sm font-bold text-yui-green-800 mb-2">使う農機具</label>
              <input
                id="job-equip"
                type="text"
                value={equipmentNeeded}
                onChange={(e) => setEquipmentNeeded(e.target.value)}
                placeholder="例：トラクター、田植え機"
                className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
          )}

          {/* ポイント設定 */}
          <div>
            <label className="block text-sm font-bold text-yui-green-800 mb-2">
              お礼のポイント（1時間あたり）
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {ratePresets.filter(preset => {
                if (selectedType === "labor") {
                  return preset.rate === 1 || preset.rate === 1.5 || preset.rate === 2;
                } else if (selectedType === "equipment" || selectedType === "hybrid") {
                  return preset.rate === 4;
                }
                return true;
              }).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTokenRate(preset.rate)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tokenRate === preset.rate
                      ? "bg-yui-green-600 text-white"
                      : "bg-yui-green-100 text-yui-green-700 hover:bg-yui-green-200"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  {preset.label}（{preset.rate}P）
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tokenRate}
                onChange={(e) => setTokenRate(Math.max(0.5, parseFloat(e.target.value) || 0))}
                step="0.5"
                min="0.5"
                className="w-28 px-3 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white text-center"
                aria-label="1時間あたりのポイント"
              />
              <span className="text-sm text-yui-earth-600 font-medium">ポイント / 時間</span>
            </div>
          </div>

          {/* 合計ポイント表示 */}
          <div className="bg-yui-accent/10 rounded-xl p-5 flex items-center justify-between" role="status" aria-label="合計ポイント">
            <span className="text-base font-bold text-yui-earth-700">合計のお礼</span>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yui-accent" aria-hidden="true" />
              <span className="text-3xl font-black text-yui-green-800">
                {calculateTotalTokens()}
              </span>
              <span className="text-sm text-yui-earth-600 font-medium">ポイント</span>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="job-desc" className="block text-sm font-bold text-yui-green-800 mb-2">
              作業の内容・くわしいこと
            </label>
            <textarea
              id="job-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="どんな作業か、注意すること、お昼ごはんの有無なども書くと手を挙げてもらいやすくなります。"
              rows={4}
              className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"
              style={{ lineHeight: "1.8" }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-yui-danger text-sm p-4 rounded-xl border-2 border-red-200" role="alert">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
            style={{ minHeight: "56px" }}
          >
            募集を作成する
          </button>
        </form>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="この内容で募集しますか？"
        message={`「${title}」を${date}に${location ? `（場所：${location}）` : ""} ${calculateTotalTokens()}ポイントで募集します。よろしいですか？`}
        confirmLabel="募集を作成する"
        cancelLabel="もう一度たしかめる"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
