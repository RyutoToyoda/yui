"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fsGetUser } from "@/lib/firestore-service";
import type { User } from "@/types/firestore";
import { Tractor, Sprout, MapPin, User as UserIcon, ArrowLeft } from "lucide-react";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    async function loadUser() {
      try {
        const userData = await fsGetUser(uid);
        if (userData) {
          setUser(userData);
        } else {
          setError("ユーザーが見つかりません");
        }
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
        setError("プロフィール情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="loading-text text-yui-earth-500 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-yui-danger text-lg font-bold mb-4">{error || "プロフィールが見つかりません"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-yui-green-600 text-white font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yui-earth-50 min-h-screen">
      {/* もどる Button - outside card */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-yui-green-200 bg-white hover:bg-yui-green-50 hover:border-yui-green-400 transition-all text-yui-green-700 font-bold shadow-sm inline-flex"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          もどる
        </button>
      </div>

      {/* User Profile Card with all info */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
        {/* Header with Green Background */}
        <div style={{ backgroundColor: "#468065" }} className="text-white pt-6 px-5 pb-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              {user.farmName && <p className="text-yui-green-100 text-base font-medium">{user.farmName}</p>}
            </div>
          </div>
        </div>

        {/* Content section with white background */}
        <div className="bg-white p-5 space-y-4">
        {/* 住所 */}
        {user.location && (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-base text-yui-earth-500 font-medium">お住まいの地域</p>
              <p className="text-base font-bold text-yui-green-800">{user.location}</p>
            </div>
          </div>
        )}

        {/* 年齢層 */}
        {user.ageGroup && (
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-base text-yui-earth-500 font-medium">年齢層</p>
              <p className="text-base font-bold text-yui-green-800">{user.ageGroup}</p>
            </div>
          </div>
        )}

        {/* 農機具 */}
        {user.equipmentList && user.equipmentList.length > 0 && (
          <div className="pt-3">
            <h3 className="text-base text-yui-earth-500 font-bold flex items-center gap-2 mb-2">
              <Tractor className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
              もっている農機具
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user.equipmentList.map((eq, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-bold bg-yui-green-50 text-yui-green-700 rounded-lg border border-yui-green-200">
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 作物 */}
        {user.crops && user.crops.length > 0 && (
          <div className="pt-3">
            <h3 className="text-base text-yui-earth-500 font-bold flex items-center gap-2 mb-2">
              <Sprout className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
              育てている作物
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user.crops.map((crop, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-bold bg-yui-green-50 text-yui-green-700 rounded-lg border border-yui-green-200">
                  {crop}
                </span>
              ))}
            </div>
          </div>
        )}
        </div>
        {/* End of content section */}
      </div>
      {/* End of card */}
    </div>
  );
}
