"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fsUpdateUser,
  fsGetAvailabilitiesByUser,
  fsCreateAvailability,
  fsDeleteAvailability,
  fsUpdateAvailability,
} from "@/lib/firestore-service";
import type { Availability, DayOfWeek } from "@/types/firestore";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X, Wrench, MapPin, User, Tractor, Clock, Settings, Sprout, CalendarDays } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";

const DAYS_OF_WEEK: DayOfWeek[] = ["月", "火", "水", "木", "金", "土", "日"];
const EQUIPMENT_PRESETS = ["トラクター", "軽トラック", "草刈機", "コンバイン", "田植え機", "軽バン", "動噴"];
const CROP_PRESETS = ["米", "トマト", "きゅうり", "ナス", "キャベツ", "りんご", "ぶどう", "みかん", "いちご", "ねぎ"];

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [newEquipment, setNewEquipment] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newCrop, setNewCrop] = useState("");
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id?: string; index?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-yui-earth-500">読み込み中...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleAddEquipment = async (eqName: string = newEquipment) => {
    if (!eqName.trim()) return;
    if (user.equipmentList?.includes(eqName.trim())) return;
    const updated = [...(user.equipmentList || []), eqName.trim()];
    await fsUpdateUser(user.uid, { equipmentList: updated });
    refreshUser();
    setNewEquipment("");
    setShowAddEquipment(false);
  };

  const handleRemoveEquipment = async (index: number) => {
    const updated = (user.equipmentList || []).filter((_, i) => i !== index);
    await fsUpdateUser(user.uid, { equipmentList: updated });
    refreshUser();
    setConfirmDelete(null);
  };

  const handleAddCrop = async (cropName: string = newCrop) => {
    if (!cropName.trim()) return;
    if (user.crops?.includes(cropName.trim())) return;
    const updated = [...(user.crops || []), cropName.trim()];
    await fsUpdateUser(user.uid, { crops: updated });
    refreshUser();
    setNewCrop("");
    setShowAddCrop(false);
  };

  const handleRemoveCrop = async (index: number) => {
    const updated = (user.crops || []).filter((_, i) => i !== index);
    await fsUpdateUser(user.uid, { crops: updated });
    refreshUser();
    setConfirmDelete(null);
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-yui-green-800">マイページ</h1>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-yui-green-600 font-bold no-underline hover:text-yui-green-800 transition-colors"
          style={{ minHeight: "48px", display: "inline-flex", alignItems: "center" }}
          aria-label="表示設定を変える"
        >
          <Settings className="w-5 h-5" aria-hidden="true" /> 表示設定
        </Link>
      </div>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 px-5 py-6 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-yui-green-200 text-sm font-medium">{user.farmName}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-yui-earth-500 font-medium">お住まいの地域</p>
              <p className="text-sm font-bold text-yui-green-800">{user.location || "まだ設定していません"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-yui-earth-500 font-medium">年齢層</p>
              <p className="text-sm font-bold text-yui-green-800">{user.ageGroup}</p>
            </div>
          </div>
        </div>
      </div>

      {/* お手伝い可能日の管理ボタン */}
      <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-6 h-6 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-yui-green-800">お手伝いに行ける日</h2>
        </div>
        <p className="text-sm text-yui-earth-600 mb-4" style={{ lineHeight: "1.6" }}>
          お手伝いに行ける日をカレンダーから選んで登録できます。予定に合わせて更新しましょう ✨
        </p>
        <Link
          href="/schedule?tab=availability"
          onClick={() => {
            // タブを切り替えるためのヒントをlocalStorageなどに保存するか、URLパラメータで制御する（今回はシンプルにLink）
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors no-underline shadow-md shadow-blue-100"
          style={{ minHeight: "52px" }}
        >
          カレンダーで登録する
        </Link>
      </div>

      {/* 所有農機具 */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2">
            <Tractor className="w-5 h-5 text-yui-green-600" aria-hidden="true" /> もっている農機具
          </h2>
          <button
            onClick={() => setShowAddEquipment(!showAddEquipment)}
            className="w-12 h-12 rounded-full bg-yui-green-100 text-yui-green-600 flex items-center justify-center hover:bg-yui-green-200 transition-colors"
            aria-label="農機具を追加する"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {showAddEquipment && (
          <div className="bg-yui-green-50/50 p-4 rounded-xl border border-yui-green-100 mb-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">よく使われる農機具からえらぶ</p>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_PRESETS.map(eq => (
                  <button
                    key={eq}
                    onClick={() => handleAddEquipment(eq)}
                    disabled={user.equipmentList?.includes(eq)}
                    className="px-3 py-1.5 bg-white border border-yui-green-200 text-sm font-bold text-yui-green-700 rounded-lg hover:bg-yui-green-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">その他（自由入力）</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder="例：耕うん機"
                  className="flex-1 px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEquipment();
                    }
                  }}
                />
                <button
                  onClick={() => handleAddEquipment(newEquipment)}
                  className="px-5 py-3 bg-yui-green-600 text-white text-base font-bold rounded-xl hover:bg-yui-green-700 transition-colors shrink-0"
                  style={{ minHeight: "48px" }}
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {user.equipmentList && user.equipmentList.length > 0 ? (
          <div className="space-y-2">
            {user.equipmentList.map((eq, i) => (
              <div key={i} className="flex items-center justify-between bg-yui-green-50 rounded-xl px-4 py-4 border border-yui-green-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
                  <span className="text-sm font-bold text-yui-green-800">{eq}</span>
                </div>
                <button
                  onClick={() => setConfirmDelete({ type: "equipment", index: i })}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-yui-earth-500 hover:bg-red-50 hover:text-yui-danger transition-colors"
                  aria-label={`${eq}を削除する`}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yui-earth-500 text-center py-3 font-medium">農機具は登録されていません</p>
        )}
      </div>

      {/* 育てている作物 */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-yui-green-600" aria-hidden="true" /> 育てている作物
          </h2>
          <button
            onClick={() => setShowAddCrop(!showAddCrop)}
            className="w-12 h-12 rounded-full bg-yui-green-100 text-yui-green-600 flex items-center justify-center hover:bg-yui-green-200 transition-colors"
            aria-label="作物を追加する"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {showAddCrop && (
          <div className="bg-yui-green-50/50 p-4 rounded-xl border border-yui-green-100 mb-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">よく栽培される作物からえらぶ</p>
              <div className="flex flex-wrap gap-2">
                {CROP_PRESETS.map(crop => (
                  <button
                    key={crop}
                    onClick={() => handleAddCrop(crop)}
                    disabled={user.crops?.includes(crop)}
                    className="px-3 py-1.5 bg-white border border-yui-green-200 text-sm font-bold text-yui-green-700 rounded-lg hover:bg-yui-green-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">その他（自由入力）</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  placeholder="例：アスパラガス"
                  className="flex-1 px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCrop();
                    }
                  }}
                />
                <button
                  onClick={() => handleAddCrop(newCrop)}
                  className="px-5 py-3 bg-yui-green-600 text-white text-base font-bold rounded-xl hover:bg-yui-green-700 transition-colors shrink-0"
                  style={{ minHeight: "48px" }}
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {user.crops && user.crops.length > 0 ? (
          <div className="space-y-2">
            {user.crops.map((crop, i) => (
              <div key={i} className="flex items-center justify-between bg-yui-green-50 rounded-xl px-4 py-4 border border-yui-green-100">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
                  <span className="text-sm font-bold text-yui-green-800">{crop}</span>
                </div>
                <button
                  onClick={() => setConfirmDelete({ type: "crop", index: i })}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-yui-earth-500 hover:bg-red-50 hover:text-yui-danger transition-colors"
                  aria-label={`${crop}を削除する`}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yui-earth-500 text-center py-3 font-medium">作物は登録されていません</p>
        )}
      </div>

      {/* ログアウト */}
      <button
        onClick={() => setConfirmLogout(true)}
        className="w-full py-4 bg-white text-yui-danger font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        style={{ minHeight: "56px" }}
      >
        <LogOut className="w-5 h-5" aria-hidden="true" />
        ログアウトする
      </button>

      {/* 確認ダイアログ群 */}
      <ConfirmDialog
        isOpen={confirmLogout}
        title="ログアウトしますか？"
        message="ログアウトすると、もう一度ログインが必要になります。"
        confirmLabel="ログアウトする"
        cancelLabel="やめておく"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      {confirmDelete?.type === "equipment" && (
        <ConfirmDialog
          isOpen={true}
          title="この農機具を削除しますか？"
          message="登録した農機具の情報が消えます。"
          confirmLabel="削除する"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleRemoveEquipment(confirmDelete.index!)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmDelete?.type === "crop" && (
        <ConfirmDialog
          isOpen={true}
          title="この作物を削除しますか？"
          message="登録した作物の情報が消えます。"
          confirmLabel="削除する"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => handleRemoveCrop(confirmDelete.index!)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
