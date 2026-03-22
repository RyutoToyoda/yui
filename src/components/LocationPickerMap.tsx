"use client";

import dynamic from "next/dynamic";

type LocationPoint = {
  lat: number;
  lng: number;
};

type LocationPickerMapProps = {
  value: LocationPoint | null;
  onSelect: (point: LocationPoint) => void;
};

const DynamicMap = dynamic(() => import("@/components/LocationPickerMapInner"), {
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
