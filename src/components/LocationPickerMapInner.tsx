"use client";

import { useMemo, useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

type LocationPoint = {
  lat: number;
  lng: number;
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

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function LocationPickerMapInner({ value, onSelect }: LocationPickerMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (value) return [value.lat, value.lng];
    return [35.6764, 139.65];
  }, [value]);

  const handlePick = (lat: number, lng: number) => {
    onSelect({ lat, lng });
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
        <MapUpdater center={center} zoom={value ? 14 : 6} />
        <MapClickHandler onPick={handlePick} />
        {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
      </MapContainer>
      <p className="text-xs text-yui-earth-500">
        地図をタップしてピンを置くと、より正確な場所を保存できます。
      </p>
    </div>
  );
}
