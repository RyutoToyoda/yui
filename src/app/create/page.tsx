"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { demoCreateJob, generateId } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { Users, Wrench, Truck, Coins, CheckCircle2 } from "lucide-react";
import type { JobType } from "@/types/firestore";

const jobTypes = [
  {
    type: "labor" as JobType,
    label: "人のみ",
    desc: "労働力の提供をお願いする",
    icon: Users,
    emoji: "👤",
    defaultRate: 1,
  },
  {
    type: "equipment" as JobType,
    label: "機具のみ",
    desc: "農機具の貸し出し",
    icon: Wrench,
    emoji: "🚜",
    defaultRate: 2,
  },
  {
    type: "hybrid" as JobType,
    label: "機具＋人",
    desc: "機具所有者が操作して代行",
    icon: Truck,
    emoji: "🚜👤",
    defaultRate: 4,
    recommended: true,
  },
];

const ratePresets = [
  { label: "軽作業", rate: 1 },
  { label: "通常", rate: 1.5 },
  { label: "重労働", rate: 2 },
  { label: "機具＋人", rate: 4 },
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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const calculateTotalTokens = () => {
    const start = startTime.split(":").map(Number);
    const end = endTime.split(":").map(Number);
    const hours = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
    return Math.max(0, Math.round(hours * tokenRate * (requiredPeople || 1) * 10) / 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedType) {
      setError("募集タイプを選択してください");
      return;
    }
    if (!title || !date) {
      setError("タイトルと日付は必須です");
      return;
    }

    const totalTokens = calculateTotalTokens();

    demoCreateJob({
      id: generateId(),
      creatorId: user.uid,
      creatorName: user.name,
      type: selectedType,
      title,
      description,
      date,
      startTime,
      endTime,
      tokenRatePerHour: tokenRate,
      totalTokens,
      requiredPeople: selectedType === "equipment" ? 0 : requiredPeople,
      equipmentNeeded,
      status: "open",
      createdAt: new Date(),
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="px-4 py-10 text-center">
        <CheckCircle2 className="w-16 h-16 text-yui-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-yui-green-800 mb-2">募集を作成しました！</h2>
        <p className="text-sm text-yui-earth-500 mb-6">応募者をお待ちください</p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/explore")}
            className="w-full py-3 bg-yui-green-600 text-white font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
          >
            募集一覧を見る
          </button>
          <button
            onClick={() => { setSubmitted(false); setSelectedType(null); setTitle(""); setDescription(""); }}
            className="w-full py-3 bg-white text-yui-green-600 font-bold rounded-xl border-2 border-yui-green-200 hover:bg-yui-green-50 transition-colors"
          >
            もう一つ作成する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">ヘルプを募集する</h1>

      {/* タイプ選択 */}
      <section>
        <h2 className="text-base font-bold text-yui-green-800 mb-3">募集タイプを選択</h2>
        <div className="space-y-2">
          {jobTypes.map((jt) => {
            const Icon = jt.icon;
            const isSelected = selectedType === jt.type;
            return (
              <button
                key={jt.type}
                onClick={() => {
                  setSelectedType(jt.type);
                  setTokenRate(jt.defaultRate);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-yui-green-500 bg-yui-green-50 shadow-sm"
                    : "border-yui-green-100 bg-white hover:border-yui-green-300"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-yui-green-600 text-white" : "bg-yui-green-100 text-yui-green-600"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yui-green-800">{jt.emoji} {jt.label}</span>
                    {jt.recommended && (
                      <span className="text-[10px] bg-yui-accent text-white font-bold px-1.5 py-0.5 rounded">
                        おすすめ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-yui-earth-500">{jt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                  isSelected
                    ? "border-yui-green-500 bg-yui-green-500"
                    : "border-yui-earth-300"
                }`}>
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedType && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
              タイトル <span className="text-yui-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：田植え作業の手伝い募集"
              className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              required
            />
          </div>

          {/* 日付と時間 */}
          <div>
            <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
              作業日 <span className="text-yui-danger">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">開始時刻</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">終了時刻</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* 人数（人のみ or ハイブリッド） */}
          {selectedType !== "equipment" && (
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">必要人数</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRequiredPeople(Math.max(1, requiredPeople - 1))}
                  className="w-10 h-10 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-lg hover:bg-yui-green-200 transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-yui-green-800 w-8 text-center">
                  {requiredPeople}
                </span>
                <button
                  type="button"
                  onClick={() => setRequiredPeople(requiredPeople + 1)}
                  className="w-10 h-10 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-lg hover:bg-yui-green-200 transition-colors"
                >
                  ＋
                </button>
                <span className="text-sm text-yui-earth-500">名</span>
              </div>
            </div>
          )}

          {/* 機具（機具のみ or ハイブリッド） */}
          {(selectedType === "equipment" || selectedType === "hybrid") && (
            <div>
              <label className="block text-sm font-bold text-yui-green-800 mb-1.5">使用する農機具</label>
              <input
                type="text"
                value={equipmentNeeded}
                onChange={(e) => setEquipmentNeeded(e.target.value)}
                placeholder="例：トラクター、田植え機"
                className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
              />
            </div>
          )}

          {/* トークンレート */}
          <div>
            <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
              トークンレート（1時間あたり）
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ratePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTokenRate(preset.rate)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    tokenRate === preset.rate
                      ? "bg-yui-green-600 text-white"
                      : "bg-yui-green-100 text-yui-green-700 hover:bg-yui-green-200"
                  }`}
                >
                  {preset.label}（{preset.rate}）
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
                className="w-24 px-3 py-2 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white text-center"
              />
              <span className="text-sm text-yui-earth-500">トークン / 時間</span>
            </div>
          </div>

          {/* 合計トークン表示 */}
          <div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-yui-earth-600">合計費用</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yui-accent" />
              <span className="text-2xl font-black text-yui-green-800">
                {calculateTotalTokens()}
              </span>
              <span className="text-sm text-yui-earth-500">トークン</span>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-bold text-yui-green-800 mb-1.5">
              作業内容・詳細
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="作業の詳細を記入してください。どのような作業か、注意点、昼食の有無なども書くと応募が集まりやすくなります。"
              rows={4}
              className="w-full px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 active:bg-yui-green-800 transition-colors shadow-md"
          >
            募集を作成する
          </button>
        </form>
      )}
    </div>
  );
}
