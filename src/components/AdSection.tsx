"use client";

import { useEffect, useState } from "react";
import { fsGetAds, fsIncrementAdView } from "@/lib/firestore-service";
import type { Ad } from "@/types/firestore";
import { ExternalLink, Megaphone } from "lucide-react";

export default function AdSection() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      const activeAds = await fsGetAds(true);
      setAds(activeAds);
      setLoading(false);
    }
    loadAds();
  }, []);

  const handleAdClick = (adId: string) => {
    fsIncrementAdView(adId);
  };

  if (loading || ads.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="ads-heading">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone className="w-4 h-4 text-yui-earth-400" />
        <h2 id="ads-heading" className="text-xs font-black text-yui-earth-400 tracking-widest uppercase">
          おすすめの農機具・サービス
        </h2>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
        {ads.map(ad => (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleAdClick(ad.id)}
            className="block min-w-[280px] w-[280px] bg-white rounded-2xl border-2 border-yui-green-100/50 shadow-sm overflow-hidden snap-start no-underline hover:border-yui-green-200 transition-all shrink-0"
          >
            <div className="relative h-32 bg-gray-100">
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded font-bold">
                PR
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black text-yui-earth-400 mb-1">{ad.companyName}</p>
              <h3 className="text-sm font-bold text-yui-green-800 line-clamp-1">{ad.title}</h3>
              <div className="mt-3 flex items-center justify-end">
                <span className="text-[10px] text-yui-green-600 font-black flex items-center gap-1">
                   もっと見る <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
