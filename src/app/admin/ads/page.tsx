"use client";

import { useEffect, useState } from "react";
import { fsGetAds, fsUpsertAd, fsDeleteAd } from "@/lib/firestore-service";
import { Plus, Edit2, Trash2, ExternalLink, Image as ImageIcon, Check, X } from "lucide-react";
import type { Ad } from "@/types/firestore";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Partial<Ad> | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    const data = await fsGetAds();
    setAds(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    
    await fsUpsertAd(editingAd);
    setEditingAd(null);
    setShowForm(false);
    loadAds();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("この広告を削除しますか？")) {
      await fsDeleteAd(id);
      loadAds();
    }
  };

  if (loading) return <p className="text-gray-500">広告データを読み込み中...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">広告管理</h1>
          <p className="text-gray-500 font-medium">ユーザー画面に表示する企業広告を設定します。</p>
        </div>
        <button
          onClick={() => { setEditingAd({ companyName: "", title: "", imageUrl: "", linkUrl: "", displayOrder: ads.length, isActive: true }); setShowForm(true); }}
          className="flex items-center gap-2 bg-yui-green-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-yui-green-700 transition-all shadow-lg shadow-yui-green-600/20"
        >
          <Plus className="w-5 h-5" />
          新規広告を追加
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-yui-green-100 animate-in fade-in zoom-in duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{editingAd?.id ? "広告を編集" : "新規広告作成"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">企業名</label>
              <input
                type="text"
                value={editingAd?.companyName}
                onChange={e => setEditingAd({ ...editingAd!, companyName: e.target.value })}
                className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-yui-green-500 focus:outline-none"
                placeholder="例: 株式会社クボタ"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">タイトル / 商品名</label>
              <input
                type="text"
                value={editingAd?.title}
                onChange={e => setEditingAd({ ...editingAd!, title: e.target.value })}
                className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-yui-green-500 focus:outline-none"
                placeholder="例: 最新トラクター発表！"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">画像URL</label>
              <input
                type="url"
                value={editingAd?.imageUrl}
                onChange={e => setEditingAd({ ...editingAd!, imageUrl: e.target.value })}
                className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-yui-green-500 focus:outline-none"
                placeholder="https://example.com/ad.jpg"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">リンク先URL</label>
              <input
                type="url"
                value={editingAd?.linkUrl}
                onChange={e => setEditingAd({ ...editingAd!, linkUrl: e.target.value })}
                className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-yui-green-500 focus:outline-none"
                placeholder="https://example.com/product"
                required
              />
            </div>
            <div className="flex items-center gap-6 md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ad-active"
                  checked={editingAd?.isActive}
                  onChange={e => setEditingAd({ ...editingAd!, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yui-green-600 focus:ring-yui-green-500"
                />
                <label htmlFor="ad-active" className="text-sm font-bold text-gray-700">有効にする（表示する）</label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-700">表示順:</label>
                <input
                  type="number"
                  value={editingAd?.displayOrder}
                  onChange={e => setEditingAd({ ...editingAd!, displayOrder: parseInt(e.target.value) })}
                  className="w-20 px-3 py-2 border-2 border-gray-100 rounded-xl focus:border-yui-green-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-yui-green-600 text-white rounded-xl font-bold hover:bg-yui-green-700 transition-all shadow-lg shadow-yui-green-600/20"
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ads.map(ad => (
          <div key={ad.id} className={`bg-white rounded-3xl shadow-sm border ${ad.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'} overflow-hidden group hover:shadow-md transition-all`}>
            <div className="relative h-40 bg-gray-100">
              {ad.imageUrl ? (
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => { setEditingAd(ad); setShowForm(true); }}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-yui-green-600 shadow-sm transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-red-600 shadow-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3 text-[10px] font-black tracking-widest uppercase text-gray-400">
                <span>{ad.companyName}</span>
                <span className={`px-2 py-0.5 rounded-full ${ad.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {ad.isActive ? '表示中' : '停止中'}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 truncate">{ad.title}</h3>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-400">
                  表示回数: <span className="font-bold text-gray-600">{ad.viewCount.toLocaleString()}</span>
                </div>
                <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-yui-green-600 font-bold flex items-center gap-1 hover:underline">
                  リンクを確認 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
