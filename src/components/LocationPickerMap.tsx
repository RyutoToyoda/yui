"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type LocationPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type LocationPickerMapProps = {
  value: LocationPoint | null;
  onSelect: (point: LocationPoint) => void;
};

function MapLoadErrorFallback() {
  return (
    <div className="w-full h-64 rounded-2xl border-2 border-red-200 bg-red-50 flex items-center justify-center text-red-700 text-sm font-bold px-4 text-center">
      地図の読み込みに失敗しました。ページを再読み込みしてください。
    </div>
  );
}

const DynamicMap = dynamic(async () => {
  try {
    return await import("@/components/LocationPickerMapInner");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to load LocationPickerMapInner:", message, error);
    return { default: MapLoadErrorFallback as ComponentType<LocationPickerMapProps> };
  }
}, {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl border-2 border-yui-green-100 bg-yui-earth-50 flex items-center justify-center text-yui-earth-500">
      地図を読み込み中...
    </div>
  ),
});

export default function LocationPickerMap(props: LocationPickerMapProps) {
  return <DynamicMap {...props} />;
}
