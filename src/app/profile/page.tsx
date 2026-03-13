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
import type { Availability, DayOfWeek, EquipmentSpec } from "@/types/firestore";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X, Wrench, MapPin, User, Tractor, Clock, Settings, Sprout, CalendarDays, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import MultiSelectTag from "@/components/MultiSelectTag";
import { EQUIPMENT_MASTER } from "@/lib/equipment-data";
import { PREFECTURES, getMunicipalities } from "@/lib/region-data";

const DAYS_OF_WEEK: DayOfWeek[] = ["月", "火", "水", "木", "金", "土", "日"];
const EQUIPMENT_PRESETS = ["トラクター", "軽トラック", "草刈機", "コンバイン", "田植え機", "軽バン", "動噴"];
const CROP_PRESETS = ["米", "トマト", "きゅうり", "ナス", "キャベツ", "りんご", "ぶどう", "みかん", "いちご", "ねぎ"];

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id?: string; index?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 農機具仕様入力用ステート
  const [specTarget, setSpecTarget] = useState<string | null>(null); // 仕様入力中の農機具名
  const [specHorsepower, setSpecHorsepower] = useState("");
  const [specAttachments, setSpecAttachments] = useState<string[]>([]);

  // 地域編集用ステート
  const [editingLocation, setEditingLocation] = useState(false);
  const [editPrefecture, setEditPrefecture] = useState("");
  const [editMunicipality, setEditMunicipality] = useState("");
  const editMunicipalities = editPrefecture ? getMunicipalities(editPrefecture) : [];

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


  const handleAddEquipment = async (eqName: string) => {
    if (!eqName.trim()) return;
    if (user.equipmentList?.includes(eqName.trim())) return;

    // 仕様入力が必要な農機具かチェック
    const master = EQUIPMENT_MASTER.find(m => m.name === eqName.trim());
    if (master?.hasSpecs && !specTarget) {
      setSpecTarget(eqName.trim());
      setSpecHorsepower("");
      setSpecAttachments([]);
      return;
    }

    const updated = [...(user.equipmentList || []), eqName.trim()];
    await fsUpdateUser(user.uid, { equipmentList: updated });

    if (specTarget && master?.hasSpecs) {
      const newSpec = {
        equipmentId: master.id,
        horsepower: specHorsepower || null,
        attachments: specAttachments.length > 0 ? specAttachments : null,
      };
      const updatedSpecs = [...(user.equipmentSpecs || []), newSpec];
      await fsUpdateUser(user.uid, { equipmentSpecs: updatedSpecs } as Record<string, unknown>);
    }

    refreshUser();
    setSpecTarget(null);
    setSpecHorsepower("");
    setSpecAttachments([]);
  };

  const handleRemoveEquipment = async (index: number) => {
    const eq = user.equipmentList?.[index];
    const updated = (user.equipmentList || []).filter((_, i) => i !== index);
    await fsUpdateUser(user.uid, { equipmentList: updated });
    // 対応する仕様も削除
    if (eq) {
      const master = EQUIPMENT_MASTER.find(m => m.name === eq);
      if (master && user.equipmentSpecs) {
        const updatedSpecs = user.equipmentSpecs.filter(s => s.equipmentId !== master.id);
        await fsUpdateUser(user.uid, { equipmentSpecs: updatedSpecs } as Record<string, unknown>);
      }
    }
    refreshUser();
  };

  const handleAddCrop = async (cropName: string) => {
    if (!cropName.trim()) return;
    if (user.crops?.includes(cropName.trim())) return;
    const updated = [...(user.crops || []), cropName.trim()];
    await fsUpdateUser(user.uid, { crops: updated });
    refreshUser();
  };

  const handleRemoveCrop = async (index: number) => {
    const updated = (user.crops || []).filter((_, i) => i !== index);
    await fsUpdateUser(user.uid, { crops: updated });
    refreshUser();
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
          <Settings className="w-5 h-5" aria-hidden="true" /> 設定
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
            <div className="flex-1">
              <p className="text-xs text-yui-earth-500 font-medium">お住まいの地域</p>
              {editingLocation ? (
                <div className="mt-1 space-y-3">
                  <div className="space-y-2">
                    <select
                      value={editPrefecture}
                      onChange={(e) => { setEditPrefecture(e.target.value); setEditMunicipality(""); }}
                      className="w-full px-3 py-3 text-sm border-2 border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-white"
                    >
                      <option value="">都道府県を選ぶ</option>
                      {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                      value={editMunicipality}
                      onChange={(e) => setEditMunicipality(e.target.value)}
                      disabled={!editPrefecture || editMunicipalities.length === 0}
                      className="w-full px-3 py-3 text-sm border-2 border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">{!editPrefecture ? "先に県を選ぶ" : editMunicipalities.length > 0 ? "市町村を選ぶ" : "データなし"}</option>
                      {editMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const loc = [editPrefecture, editMunicipality].filter(Boolean).join(" ");
                        if (loc) {
                          await fsUpdateUser(user.uid, { location: loc });
                          refreshUser();
                        }
                        setEditingLocation(false);
                      }}
                      className="px-4 py-2 bg-yui-green-600 text-white text-sm font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
                      style={{ minHeight: "40px" }}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingLocation(false)}
                      className="px-4 py-2 bg-yui-earth-100 text-yui-earth-600 text-sm font-bold rounded-lg hover:bg-yui-earth-200 transition-colors"
                      style={{ minHeight: "40px" }}
                    >
                      やめる
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-yui-green-800">{user.location || "まだ設定していません"}</p>
                  <button
                    onClick={() => {
                      // 既存のlocationから都道府県と市町村をパース
                      const parts = (user.location || "").split(" ");
                      setEditPrefecture(parts[0] || "");
                      setEditMunicipality(parts[1] || "");
                      setEditingLocation(true);
                    }}
                    className="text-xs text-yui-green-600 font-bold hover:text-yui-green-800 transition-colors"
                    style={{ minHeight: "32px", display: "inline-flex", alignItems: "center" }}
                  >
                    変更する
                  </button>
                </div>
              )}
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
        <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2 mb-3">
          <Tractor className="w-5 h-5 text-yui-green-600" aria-hidden="true" /> もっている農機具
        </h2>

        <MultiSelectTag
          selectedItems={user.equipmentList || []}
          presetOptions={EQUIPMENT_PRESETS}
          placeholder="例：耕うん機"
          label="農機具"
          onAdd={handleAddEquipment}
          onRemove={handleRemoveEquipment}
        />

        {/* 仕様入力ダイアログ（トラクター等の場合） */}
        {specTarget && (() => {
          const master = EQUIPMENT_MASTER.find(m => m.name === specTarget);
          if (!master) return null;
          return (
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200 mt-3 space-y-3">
              <p className="text-sm font-bold text-yui-green-800">
                🔧 {specTarget} の仕様を入力
              </p>
              {master.horsepowerOptions && master.horsepowerOptions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-yui-earth-600 mb-1">馬力・規格</p>
                  <select
                    value={specHorsepower}
                    onChange={(e) => setSpecHorsepower(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border-2 border-yui-green-200 rounded-lg bg-white focus:border-yui-green-500 focus:outline-none"
                  >
                    <option value="">選択してください</option>
                    {master.horsepowerOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
              {master.attachmentOptions && master.attachmentOptions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-yui-earth-600 mb-1">アタッチメント</p>
                  <div className="flex flex-wrap gap-2">
                    {master.attachmentOptions.map(att => {
                      const selected = specAttachments.includes(att);
                      return (
                        <button
                          key={att}
                          type="button"
                          onClick={() => {
                            setSpecAttachments(prev =>
                              selected ? prev.filter(a => a !== att) : [...prev, att]
                            );
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            selected
                              ? "bg-yui-green-600 text-white border-yui-green-600"
                              : "bg-white text-yui-green-700 border-yui-green-200 hover:bg-yui-green-50"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 inline mr-1" />}{att}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleAddEquipment(specTarget)}
                  className="px-5 py-2.5 bg-yui-green-600 text-white text-sm font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
                  style={{ minHeight: "44px" }}
                >
                  この仕様で追加する
                </button>
                <button
                  onClick={() => { setSpecTarget(null); setSpecHorsepower(""); setSpecAttachments([]); }}
                  className="px-4 py-2.5 bg-yui-earth-100 text-yui-earth-600 text-sm font-bold rounded-lg hover:bg-yui-earth-200 transition-colors"
                  style={{ minHeight: "44px" }}
                >
                  やめる
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 育てている作物 */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 p-5">
        <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2 mb-3">
          <Sprout className="w-5 h-5 text-yui-green-600" aria-hidden="true" /> 育てている作物
        </h2>

        <MultiSelectTag
          selectedItems={user.crops || []}
          presetOptions={CROP_PRESETS}
          placeholder="例：アスパラガス"
          label="作物"
          onAdd={handleAddCrop}
          onRemove={handleRemoveCrop}
        />
      </div>

      {/* 確認ダイアログ群 */}
      {confirmDelete?.type === "equipment" && (
        <ConfirmDialog
          isOpen={true}
          title="この農機具を削除しますか？"
          message="登録した農機具の情報が消えます。"
          confirmLabel="削除する"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={() => { handleRemoveEquipment(confirmDelete.index!); setConfirmDelete(null); }}
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
          onConfirm={() => { handleRemoveCrop(confirmDelete.index!); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
