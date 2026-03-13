"use client";

import { useEffect, useState } from "react";
import { fsGetAllUsers, fsSetAdminRole } from "@/lib/firestore-service";
import { Search, User as UserIcon, Shield, MapPin, Coins } from "lucide-react";
import type { User } from "@/types/firestore";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const data = await fsGetAllUsers();
    setUsers(data);
    setLoading(false);
  }

  const handleSetAdmin = async (uid: string) => {
    if (window.confirm("このユーザーに管理者権限を付与しますか？")) {
      await fsSetAdminRole(uid);
      loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.includes(search) || u.farmName.includes(search) || u.location.includes(search)
  );

  if (loading) return <p className="text-gray-500">ユーザーデータを取得中...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">ユーザー管理</h1>
        <p className="text-gray-500 font-medium">登録されている農家さんの情報を確認・管理します。</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前、農園名、地域で検索..."
          className="w-full pl-12 pr-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-yui-green-500 focus:outline-none transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">ユーザー</th>
              <th className="px-6 py-4">地域 / 年齢</th>
              <th className="px-6 py-4 text-right">保有ポイント</th>
              <th className="px-6 py-4 text-center">権限</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map(user => (
              <tr key={user.uid} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yui-green-100 text-yui-green-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.farmName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">{user.ageGroup}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 font-black text-yui-green-800 tabular-nums">
                    <Coins className="w-4 h-4 text-yui-accent" />
                    {user.tokenBalance.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.role === 'admin' ? '管理者' : '一般'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleSetAdmin(user.uid)}
                      className="text-xs font-bold text-gray-400 hover:text-purple-600 flex items-center gap-1 ml-auto"
                    >
                      <Shield className="w-3.5 h-3.5" /> 管理者にする
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 font-medium">該当するユーザーは見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}
