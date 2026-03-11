"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { demoUpdateUser } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X, Wrench, MapPin, User, Tractor } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [newEquipment, setNewEquipment] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  if (!user) return null;

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
    setShowAddForm(false);
  };

  const handleRemoveEquipment = (index: number) => {
    const updated = user.equipmentList.filter((_, i) => i !== index);
    demoUpdateUser(user.uid, { equipmentList: updated });
    refreshUser();
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

      {/* 所有農機具 */}
      <div className="bg-white rounded-2xl shadow-sm border border-yui-green-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-yui-green-800 flex items-center gap-2">
            <Tractor className="w-5 h-5 text-yui-green-600" /> 所有農機具
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-8 h-8 rounded-full bg-yui-green-100 text-yui-green-600 flex items-center justify-center hover:bg-yui-green-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAddForm && (
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
