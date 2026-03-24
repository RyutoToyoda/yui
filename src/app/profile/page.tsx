"use client";

export const dynamic = "force-dynamic";

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
import { LogOut, Plus, X, Wrench, MapPin, User, Tractor, Clock, Settings, Sprout, CalendarDays, ChevronDown, Check, Pencil } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import Onboarding from "@/components/Onboarding";
import MultiSelectTag from "@/components/MultiSelectTag";
import { EQUIPMENT_MASTER } from "@/lib/equipment-data";
import { PREFECTURES, getMunicipalities, isKantoPrefecture } from "@/lib/region-data";

const DAYS_OF_WEEK: DayOfWeek[] = ["月", "火", "水", "木", "金", "土", "日"];
const EQUIPMENT_PRESETS = ["トラクター", "軽トラック", "草刈機", "コンバイン", "田植え機", "軽バン", "動噴"];
const CROP_PRESETS = ["米", "トマト", "きゅうり", "ナス", "キャベツ", "りんご", "ぶどう", "みかん", "いちご", "ねぎ"];

export default function ProfilePage() {
  const { user, logout, refreshUser, markTutorialAsSeen } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id?: string; index?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

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
      // オンボーディング未表示かつ、ローカルでも未保存の場合に表示
      const localSeen = localStorage.getItem("yui-onboarding-seen");
      if (!user.hasSeenTutorial && !localSeen) {
        setShowTutorial(true);
      }
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;

  // オンボーディングハンドラー
  const handleTutorialComplete = async () => {
    await markTutorialAsSeen();
    localStorage.setItem("yui-onboarding-seen", "true");
    setShowTutorial(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (showTutorial) {
    return <Onboarding onComplete={handleTutorialComplete} />;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-yui-earth-500 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }


  const handleAddEquipment = async (eqName: string) => {
    if (!eqName.trim()) return;
    if (user.equipmentList?.includes(eqName.trim())) return;

    try {
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
    } catch (err) {
      console.error("Failed to add equipment:", err);
      alert("農機具の追加に失敗しました");
    }
  };

  const handleRemoveEquipment = async (index: number) => {
    try {
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
    } catch (err) {
      console.error("Failed to remove equipment:", err);
      alert("農機具の削除に失敗しました");
    }
  };

  const handleAddCrop = async (cropName: string) => {
    if (!cropName.trim()) return;
    if (user.crops?.includes(cropName.trim())) return;
    try {
      const updated = [...(user.crops || []), cropName.trim()];
      await fsUpdateUser(user.uid, { crops: updated });
      refreshUser();
    } catch (err) {
      console.error("Failed to add crop:", err);
      alert("作物の追加に失敗しました");
    }
  };

  const handleRemoveCrop = async (index: number) => {
    try {
      const updated = (user.crops || []).filter((_, i) => i !== index);
      await fsUpdateUser(user.uid, { crops: updated });
      refreshUser();
    } catch (err) {
      console.error("Failed to remove crop:", err);
      alert("作物の削除に失敗しました");
    }
  };

  return (
    <div className="pt-1 space-y-3 pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-1">
          <User className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
          マイページ
        </h1>
      </div>

      {/* プロフィールカード（統合） */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-yui-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 px-5 py-4 text-white relative">
          {/* 編集ボタン（右上） */}
          <button
            onClick={async () => {
              if (editingProfile) {
                // 編集終了時に住所を保存
                const loc = [editPrefecture, editMunicipality].filter(Boolean).join(" ");
                if (loc) {
                  await fsUpdateUser(user.uid, { location: loc });
                  refreshUser();
                }
                setEditingLocation(false);
              } else {
                const parts = (user.location || "").split(" ");
                setEditPrefecture(parts[0] || "");
                setEditMunicipality(parts[1] || "");
                setEditingLocation(true);
              }
              setEditingProfile(!editingProfile);
            }}
            className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            {editingProfile ? "完了" : "変更"}
          </button>

          <div className="flex items-center gap-4 mt-0.5">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              {user.farmName && <p className="text-yui-green-100 text-base font-medium">{user.farmName}</p>}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 住所 */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-base text-yui-earth-500 font-medium">お住まいの地域</p>
              {editingProfile && editingLocation ? (
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
                    {editPrefecture && (
                      isKantoPrefecture(editPrefecture) ? (
                        <select
                          value={editMunicipality}
                          onChange={(e) => setEditMunicipality(e.target.value)}
                          className="w-full px-3 py-3 text-sm border-2 border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-white"
                        >
                          <option value="">市町村を選ぶ</option>
                          {editMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editMunicipality}
                          onChange={(e) => setEditMunicipality(e.target.value)}
                          placeholder="（例）〇〇市"
                          className="w-full px-3 py-3 text-sm border-2 border-yui-green-200 rounded-lg focus:border-yui-green-500 focus:outline-none bg-white"
                        />
                      )
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-base font-bold text-yui-green-800">{user.location || "まだ設定していません"}</p>
              )}
            </div>
          </div>

          {/* 年齢層 */}
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-yui-green-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-base text-yui-earth-500 font-medium">年齢層</p>
              <p className="text-base font-bold text-yui-green-800">{user.ageGroup}</p>
            </div>
          </div>

          {/* 農機具 */}
          <div className="pt-3">
            <h3 className="text-base text-yui-earth-500 font-bold flex items-center gap-2 mb-2">
              <Tractor className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
              もっている農機具
            </h3>
            {editingProfile ? (
              specTarget ? (
                /* 仕様入力中：選択済みアイテム + 仕様フォーム */
                (() => {
                  const master = EQUIPMENT_MASTER.find(m => m.name === specTarget);
                  return (
                    <div className="space-y-2">
                      {/* 選択中の農機具（折りたたみバー） */}
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                          {specTarget}
                        </span>
                        <button
                          onClick={() => { setSpecTarget(null); setSpecHorsepower(""); setSpecAttachments([]); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-200 hover:text-red-600 transition-colors"
                          aria-label="選択をキャンセル"
                          type="button"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* 仕様入力フォーム */}
                      {master && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-3">
                          <p className="text-xs font-bold text-yui-green-800">
                            🔧 {specTarget} の仕様を入力
                          </p>
                          {master.horsepowerOptions && master.horsepowerOptions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-yui-earth-600 mb-1">馬力・規格</p>
                              <select
                                value={specHorsepower}
                                onChange={(e) => setSpecHorsepower(e.target.value)}
                                className="w-full px-3 py-2 text-sm border-2 border-yui-green-200 rounded-lg bg-white focus:border-yui-green-500 focus:outline-none"
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
                              <div className="flex flex-wrap gap-1.5">
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
                                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${selected
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
                          <button
                            onClick={() => handleAddEquipment(specTarget)}
                            className="w-full py-2 bg-yui-green-600 text-white text-sm font-bold rounded-lg hover:bg-yui-green-700 transition-colors"
                            style={{ minHeight: "36px" }}
                          >
                            この仕様で追加する
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* 通常の選択UI */
                <MultiSelectTag
                  selectedItems={user.equipmentList || []}
                  presetOptions={EQUIPMENT_PRESETS}
                  placeholder="例：耕うん機"
                  label="農機具"
                  onAdd={handleAddEquipment}
                  onRemove={handleRemoveEquipment}
                  hideEmptyMessage
                />
              )
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(user.equipmentList || []).length > 0 ? (
                  (user.equipmentList || []).map((eq, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-bold bg-yui-green-50 text-yui-green-700 rounded-lg border border-yui-green-200">{eq}</span>
                  ))
                ) : (
                  <p className="text-xs text-yui-earth-400">まだ登録していません</p>
                )}
              </div>
            )}
          </div>

          {/* 作物 */}
          <div className="pt-3">
            <h3 className="text-base text-yui-earth-500 font-bold flex items-center gap-2 mb-2">
              <Sprout className="w-5 h-5 text-yui-green-500" aria-hidden="true" />
              育てている作物
            </h3>
            {editingProfile ? (
              <MultiSelectTag
                selectedItems={user.crops || []}
                presetOptions={CROP_PRESETS}
                placeholder="例：アスパラガス"
                label="作物"
                onAdd={handleAddCrop}
                onRemove={handleRemoveCrop}
                hideEmptyMessage
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(user.crops || []).length > 0 ? (
                  (user.crops || []).map((crop, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-bold bg-yui-green-50 text-yui-green-700 rounded-lg border border-yui-green-200">{crop}</span>
                  ))
                ) : (
                  <p className="text-xs text-yui-earth-400">まだ登録していません</p>
                )}
              </div>
            )}
          </div>

          {/* 編集モード時の下部完了ボタン */}
          {editingProfile && (
            <div className="pt-4">
              <button
                onClick={async () => {
                  const loc = [editPrefecture, editMunicipality].filter(Boolean).join(" ");
                  if (loc) {
                    await fsUpdateUser(user.uid, { location: loc });
                    refreshUser();
                  }
                  setEditingLocation(false);
                  setEditingProfile(false);
                }}
                className="w-full py-3 bg-yui-green-600 text-white font-bold rounded-xl hover:bg-yui-green-700 transition-colors flex items-center justify-center gap-2"
                style={{ minHeight: "48px" }}
              >
                <Check className="w-5 h-5" aria-hidden="true" />
                保存
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 設定ボタン */}
      <div className="pt-2 mt-4">
        <Link
          href="/settings"
          className="w-full py-4 bg-white text-yui-green-600 font-bold text-base rounded-xl border-2 border-yui-green-200 hover:bg-yui-green-50 transition-colors flex items-center justify-center gap-2 shadow-sm mb-3"
          style={{ minHeight: "56px" }}
          aria-label="表示設定を変える"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          設定
        </Link>

        {/* ログアウト */}
        <button
          onClick={() => setConfirmDelete({ type: "logout" })}
          className="w-full py-4 bg-white text-yui-danger font-bold text-base rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm mb-3"
          style={{ minHeight: "56px" }}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          ログアウト
        </button>
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
      {confirmDelete?.type === "logout" && (
        <ConfirmDialog
          isOpen={true}
          title="ログアウトしますか？"
          message="ログアウトすると、もう一度ログインが必要になります。"
          confirmLabel="ログアウトする"
          cancelLabel="やめておく"
          variant="danger"
          onConfirm={handleLogout}
          onCancel={() => setConfirmDelete(null)}
        />
      )}    </div>
  );
}
