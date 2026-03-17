"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

type LocationPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type LocationPickerMapProps = {
  value: LocationPoint | null;
  onSelect: (point: LocationPoint) => void;
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ja`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "ja",
      },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data?.display_name;
  } catch {
    return undefined;
  }
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMapInner({ value, onSelect }: LocationPickerMapProps) {
  const [isResolving, setIsResolving] = useState(false);

  const center = useMemo<[number, number]>(() => {
    if (value) return [value.lat, value.lng];
    return [35.6764, 139.65];
  }, [value]);

  const handlePick = async (lat: number, lng: number) => {
    setIsResolving(true);
    const address = await reverseGeocode(lat, lng);
    onSelect({ lat, lng, address });
    setIsResolving(false);
  };

  return (
    <div className="relative z-0 isolate space-y-2 w-full max-w-full min-w-0 overflow-x-hidden">
      <MapContainer
        center={center}
        zoom={value ? 14 : 6}
        className="relative z-0 isolate w-full max-w-full h-64 rounded-2xl border-2 border-yui-green-200"
        style={{ zIndex: 0 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={handlePick} />
        {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
      </MapContainer>
      <p className="text-xs text-yui-earth-500">
        地図をタップしてピンを置くと、より正確な場所を保存できます。{isResolving ? " 住所を取得中..." : ""}
      </p>
    </div>
  );
}
