"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fsCreateJob } from "@/lib/firestore-service";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  Megaphone,
} from "lucide-react";
import type { JobType } from "@/types/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";
import LocationPickerMap from "@/components/LocationPickerMap";

type LocationPoint = {
  lat: number;
  lng: number;
  address?: string;
};

const jobTypes = [
  {
    type: "labor" as JobType,
    label: "人",
    defaultRate: 1,
  },
  {
    type: "equipment" as JobType,
    label: "農機具",
    defaultRate: 2,
  },
  {
    type: "hybrid" as JobType,
    label: "両方",
    defaultRate: 4,
  },
];

const ratePresets = [1, 1.5, 2, 4];

// 住所から座標を取得（順ジオコーディング）
async function geocodeAddress(address: string): Promise<LocationPoint | null> {
  if (!address.trim()) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1&accept-language=ja`
    );
    if (!response.ok) return null;
    const results = await response.json();
    if (!results || results.length === 0) return null;

    const result = results[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name || address,
    };
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<JobType | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState(user?.location || "");
  const [locationPoint, setLocationPoint] = useState<LocationPoint | null>(null);
  const [requiredPeople, setRequiredPeople] = useState(1);

  const [tokenRate, setTokenRate] = useState(1);
  const [equipmentNeeded, setEquipmentNeeded] = useState("");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  if (!user) return null;

  // Auto-geocode location whenever user types (with debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 2文字以上で自動検索を実行
      if (location.trim() && location.trim().length >= 2) {
        setIsGeocoding(true);
        const result = await geocodeAddress(location);
        if (result) {
          setLocationPoint(result);
        }
        setIsGeocoding(false);
      }
    }, 1000); // 1秒遅延
    return () => clearTimeout(timer);
  }, [location]);

  const calculateTotalTokens = () => {
    if (!startTime || !endTime || !startTime.includes(":") || !endTime.includes(":")) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    if (isNaN(minutes)) return 0;
    const hours = Math.max(0, minutes / 60);
    const peopleFactor = selectedType === "equipment" ? 1 : requiredPeople;
    return Math.max(0, Math.round(hours * tokenRate * peopleFactor * 10) / 10);
  };

  const handleTypeChange = (type: JobType | null) => {
    setSelectedType(type);
    if (!type) return;
    const found = jobTypes.find((item) => item.type === type);
    setTokenRate(found?.defaultRate ?? 1);
    if (type === "equipment") {
      setRequiredPeople(1);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("まず、何を募集するかを入力してください。");
      return;
    }
    if (!selectedType) {
      setError("募集の種類を選んでください。");
      return;
    }
    if (!date || !location.trim()) {
      setError("作業日と作業場所は必ず入力してください。");
      return;
    }
    if (calculateTotalTokens() <= 0) {
      setError("作業時間を確認してください。");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    await fsCreateJob({
      creatorId: user.uid,
      creatorName: user.name,
      type: selectedType!,
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      tokenRatePerHour: tokenRate,
      totalTokens: calculateTotalTokens(),
      requiredPeople: selectedType === "equipment" ? 0 : requiredPeople,
      equipmentNeeded: equipmentNeeded.trim(),
      location: location.trim(),
      locationLat: locationPoint?.lat,
      locationLng: locationPoint?.lng,
      status: "open",
      createdAt: new Date(),
    });

    setShowConfirm(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-10 text-center max-w-2xl mx-auto">
        <CheckCircle2 className="w-16 h-16 text-yui-success mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-yui-green-800 mb-2">募集を作成しました</h2>
        <p className="text-base text-yui-earth-600 mb-6">手伝ってくれる方からの連絡を待ちましょう。</p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/explore")}
            className="w-full py-4 bg-yui-green-600 text-white font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
            style={{ minHeight: "56px" }}
          >
            募集一覧を見る
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle("");
              setDescription("");
              setEquipmentNeeded("");
              setSelectedType(null);
              setShowDetails(false);
            }}
            className="w-full py-4 bg-white text-yui-green-600 font-bold rounded-xl border-2 border-yui-green-200 hover:bg-yui-green-50 transition-colors"
            style={{ minHeight: "56px" }}
          >
            もう1件つくる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto overflow-x-hidden">
      <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2">
        <Megaphone className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
        募集する
      </h1>

      <form onSubmit={handlePreSubmit} className="space-y-6 w-full min-w-0">
        <section className="bg-white rounded-2xl border-2 border-yui-green-100 p-5 md:p-6 space-y-4 w-full min-w-0 overflow-x-hidden">
          <label htmlFor="job-title" className="block text-base font-bold text-yui-green-800">
            どんなお手伝い？ <span className="text-yui-danger">（必須）</span>
          </label>
          <textarea
            id="job-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：田植えのお手伝い"
            rows={1}
            className="w-full px-4 py-3 text-lg border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"
            style={{ lineHeight: "1.5" }}
            required
          />

          <div>
            <p className="text-base font-bold text-yui-green-800 mb-2">何が必要？ <span className="text-yui-danger">（必須）</span></p>
            <div className="grid grid-cols-3 gap-2">
              {jobTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type)}
                  className={`py-3 md:py-4 px-1 md:px-2 rounded-xl text-center font-bold border-2 transition-all shadow-sm ${
                    selectedType === item.type
                      ? "bg-yui-green-600 text-white border-yui-green-600 ring-2 ring-yui-green-200 ring-offset-1"
                      : "bg-white text-yui-green-800 border-yui-green-200 hover:border-yui-green-400 hover:bg-yui-green-50"
                  }`}
                >
                  <span className="block text-sm md:text-base">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedType && selectedType !== "equipment" && (
            <div className="pt-2 border-t-2 border-dashed border-yui-green-100/50 mt-4">
              <p className="text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2 mt-4">
                <Users className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
                必要な人数
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRequiredPeople(Math.max(1, requiredPeople - 1))}
                  className="w-12 h-12 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-2xl hover:bg-yui-green-200"
                  aria-label="人数を減らす"
                >
                  −
                </button>
                <span className="text-2xl font-black text-yui-green-800 w-10 text-center">{requiredPeople}</span>
                <button
                  type="button"
                  onClick={() => setRequiredPeople(requiredPeople + 1)}
                  className="w-12 h-12 rounded-xl bg-yui-green-100 text-yui-green-700 font-bold text-2xl hover:bg-yui-green-200"
                  aria-label="人数を増やす"
                >
                  ＋
                </button>
                <span className="text-base font-bold text-yui-earth-600">名</span>
              </div>
            </div>
          )}

          <div className="relative overflow-visible">
            <label htmlFor="job-location" className="relative z-10 text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yui-green-600" aria-hidden="true" />
              どこでやる？ <span className="text-yui-danger">（必須）</span>
            </label>
            <div className="relative z-10 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end w-full min-w-0">
                <input
                  id="job-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：長野県松本市中島〇丁目、または○○農園の西側の畑"
                  className="w-full sm:flex-1 min-w-0 px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>
            <div className="relative z-0 mt-3 space-y-2 w-full max-w-full min-w-0 overflow-visible">
              <div className="create-location-map relative z-0 isolate w-full max-w-full min-w-0 overflow-hidden rounded-2xl">
                <LocationPickerMap
                  value={locationPoint}
                  onSelect={(point) => {
                    setLocationPoint(point);
                    if (point.address?.trim()) {
                      setLocation(point.address);
                    } else {
                      setLocation(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 w-full min-w-0 mt-4">
            <div>
              <label htmlFor="job-date" className="text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
                いつやる？ <span className="text-yui-danger">（必須）</span>
              </label>
              <input
                id="job-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-4 text-xl md:text-2xl text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white font-mono tracking-tight"
                required
              />
            </div>

            <div>
              <label htmlFor="job-start" className="text-base font-bold text-yui-green-800 mb-2 flex items-center gap-2">
                <Clock className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
                時間は？ <span className="text-yui-danger">（必須）</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="job-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full flex-1 px-0.5 py-4 text-xl md:text-2xl text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white min-w-0 font-mono tracking-tight"
                  required
                />
                <span className="text-xl md:text-2xl font-bold text-yui-earth-500 shrink-0">〜</span>
                <input
                  id="job-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full flex-1 px-0.5 py-4 text-xl md:text-2xl text-center font-bold border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white min-w-0 font-mono tracking-tight"
                  required
                />
              </div>
            </div>
          </div>



          <div className="bg-yui-accent/10 rounded-xl p-4 flex items-center justify-between" role="status" aria-label="合計ポイント">
            <span className="text-base font-bold text-yui-earth-700">合計のお礼</span>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yui-accent" aria-hidden="true" />
              <span className="text-3xl font-black text-yui-green-800">{calculateTotalTokens()}</span>
              <span className="text-sm text-yui-earth-600">ポイント</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border-2 border-yui-green-100 p-5 md:p-6">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
            style={{ minHeight: "52px" }}
            aria-expanded={showDetails}
          >
            <span className="text-lg font-bold text-yui-green-800">詳細設定（任意）</span>
            {showDetails ? <ChevronUp className="w-6 h-6 text-yui-earth-500" /> : <ChevronDown className="w-6 h-6 text-yui-earth-500" />}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4 border-t border-yui-earth-100 pt-4">
              {(selectedType === "equipment" || selectedType === "hybrid") && (
                <div>
                  <label htmlFor="job-equip" className="block text-base font-bold text-yui-green-800 mb-2">使う農機具</label>
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

              <div>
                <p className="block text-base font-bold text-yui-green-800 mb-2">ポイント単価（1時間あたり）</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ratePresets.map((rate) => (
                    <button
                      key={`rate-${rate}`}
                      type="button"
                      onClick={() => setTokenRate(rate)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border ${tokenRate === rate ? "bg-yui-green-600 text-white border-yui-green-600" : "bg-white text-yui-green-700 border-yui-green-200 hover:bg-yui-green-50"}`}
                    >
                      {rate}P
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="job-desc" className="block text-base font-bold text-yui-green-800 mb-2">補足メモ</label>
                <textarea
                  id="job-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="作業の注意点や持ち物など（任意）"
                  rows={4}
                  className="w-full px-4 py-4 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white resize-none"
                />
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-yui-danger text-sm p-4 rounded-xl border-2 border-red-200" role="alert">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-yui-green-600 text-white text-lg font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
          style={{ minHeight: "56px" }}
        >
          この内容で募集する
        </button>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        title="この内容で募集しますか？"
        message={`「${title}」を ${date}（${startTime}〜${endTime}）に ${calculateTotalTokens()}ポイントで募集します。`}
        confirmLabel="募集を作成する"
        cancelLabel="もう一度確認する"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
