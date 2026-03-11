"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  demoUpdateUser,
  demoGetAvailabilitiesByUser,
  demoCreateAvailability,
  demoDeleteAvailability,
  demoUpdateAvailability,
  generateId,
} from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X, Wrench, MapPin, User, Tractor, Clock, Calendar } from "lucide-react";
import type { DayOfWeek } from "@/types/firestore";

const DAYS_OF_WEEK: DayOfWeek[] = ["月", "火", "水", "木", "金", "土", "日"];

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [newEquipment, setNewEquipment] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [availDay, setAvailDay] = useState<DayOfWeek>("月");
  const [availStart, setAvailStart] = useState("09:00");
  const [availEnd, setAvailEnd] = useState("12:00");
  const [availNote, setAvailNote] = useState("");
  const [, forceUpdate] = useState(0);

  if (!user) return null;

  const availabilities = demoGetAvailabilitiesByUser(user.uid);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleAddEquipment = () => {
    if (!newEquipment.trim()) return;
    const updated = [...user.equipmentList, newEquipment.trim()];
    demoUpdateUser(user.uid, { equipmentList: updated });
    refreshUser();
    setNewEquipment("");
    setShowAddEquipment(false);
  };

  const handleRemoveEquipment = (index: number) => {
    const updated = user.equipmentList.filter((_, i) => i !== index);
    demoUpdateUser(user.uid, { equipmentList: updated });
    refreshUser();
  };

  const handleAddAvailability = () => {
    demoCreateAvailability({
      id: generateId(),
      userId: user.uid,
      dayOfWeek: availDay,
      startTime: availStart,
      endTime: availEnd,
      note: availNote,
      isActive: true,
      createdAt: new Date(),
    });
    setShowAddAvailability(false);
    setAvailNote("");
    forceUpdate((n) => n + 1);
  };

  const handleToggleAvailability = (id: string, isActive: boolean) => {
    demoUpdateAvailability(id, { isActive: !isActive });
    forceUpdate((n) => n + 1);
  };

  const handleDeleteAvailability = (id: string) => {
    demoDeleteAvailability(id);
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-yui-green-800">マイページ</h1>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yui-green-600 to-yui-green-700 px-5 py-6 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-yui-green-200 text-sm">{user.farmName}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-yui-green-500 shrink-0" />
            <div>
              <p className="text-xs text-yui-earth-400">所在地</p>
              <p className="text-sm font-bold text-yui-green-800">{user.location || "未設定"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-yui-green-500 shrink-0" />
            <div>
              <p className="text-xs text-yui-earth-400">年齢層</p>
              <p className="text-sm font-bold text-yui-green-800">{user.ageGroup}</p>
            </div>
          </div>
        </div>
      </div>

      {/* スキマ時間 */}
      <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> スキマ時間（手伝える時間）
          </h2>
          <button
            onClick={() => setShowAddAvailability(!showAddAvailability)}
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-yui-earth-400 mb-3">
          登録しておくと、ぴったりの募集が出た時に自動で通知されます ✨
        </p>

        {showAddAvailability && (
          <div className="bg-blue-50 rounded-xl p-4 mb-3 space-y-3 border border-blue-200">
            <div>
              <label className="block text-xs font-bold text-blue-800 mb-1">曜日</label>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => setAvailDay(day)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      availDay === day
                        ? "bg-blue-600 text-white"
                        : "bg-white text-yui-earth-600 hover:bg-blue-100"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">開始</label>
                <input
                  type="time"
                  value={availStart}
                  onChange={(e) => setAvailStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">終了</label>
                <input
                  type="time"
                  value={availEnd}
                  onChange={(e) => setAvailEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-800 mb-1">メモ（任意）</label>
              <input
                type="text"
                value={availNote}
                onChange={(e) => setAvailNote(e.target.value)}
                placeholder="例：午前中なら対応可能"
                className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              />
            </div>
            <button
              onClick={handleAddAvailability}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              登録する
            </button>
          </div>
        )}

        {availabilities.length > 0 ? (
          <div className="space-y-2">
            {availabilities.map((avail) => (
              <div
                key={avail.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                  avail.isActive ? "bg-blue-50" : "bg-yui-earth-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    avail.isActive ? "bg-blue-600 text-white" : "bg-yui-earth-300 text-white"
                  }`}>
                    {avail.dayOfWeek}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-yui-green-800">
                      {avail.startTime}〜{avail.endTime}
                    </p>
                    {avail.note && (
                      <p className="text-xs text-yui-earth-400">{avail.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(avail.id, avail.isActive)}
                    className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
                      avail.isActive
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "bg-yui-earth-200 text-yui-earth-500 hover:bg-yui-earth-300"
                    }`}
                  >
                    {avail.isActive ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => handleDeleteAvailability(avail.id)}
                    className="text-yui-earth-400 hover:text-yui-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yui-earth-400 text-center py-2">
            まだ登録されていません
          </p>
        )}
      </div>

      {/* 所有農機具 */}
      <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2">
            <Tractor className="w-5 h-5 text-yui-green-600" /> 所有農機具
          </h2>
          <button
            onClick={() => setShowAddEquipment(!showAddEquipment)}
            className="w-8 h-8 rounded-full bg-yui-green-100 text-yui-green-600 flex items-center justify-center hover:bg-yui-green-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAddEquipment && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="例：トラクター"
              className="flex-1 px-3 py-2 text-sm border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddEquipment();
                }
              }}
            />
            <button
              onClick={handleAddEquipment}
              className="px-4 py-2 bg-yui-green-600 text-white text-sm font-bold rounded-xl hover:bg-yui-green-700 transition-colors"
            >
              追加
            </button>
          </div>
        )}

        {user.equipmentList.length > 0 ? (
          <div className="space-y-2">
            {user.equipmentList.map((eq, i) => (
              <div key={i} className="flex items-center justify-between bg-yui-green-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yui-green-500" />
                  <span className="text-sm font-medium text-yui-green-800">{eq}</span>
                </div>
                <button
                  onClick={() => handleRemoveEquipment(i)}
                  className="text-yui-earth-400 hover:text-yui-danger transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yui-earth-400 text-center py-2">農機具は登録されていません</p>
        )}
      </div>

      {/* ログアウト */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-white text-yui-danger font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        ログアウト
      </button>
    </div>
  );
}
