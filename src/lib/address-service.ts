/**
 * アドレス（住所）操作ユーティリティ
 * マッチングステータスに応じた段階的な住所表示制御
 */

/**
 * マッチングステータスの定義
 * - 'owner': ユーザー自身の募集（詳細住所を表示）
 * - 'matched': マッチング確定状態（詳細住所を表示）
 * - 'default': デフォルト（市区町村レベルのみ表示）
 */
export type AddressStatusType = 'owner' | 'matched' | 'default';

/**
 * 住所を市区町村レベルまで削減する関数
 * 例：「千葉県木更津市清見台2丁目1-1」→ 「千葉県木更津市清見台」
 * 
 * @param address - 元の住所文字列
 * @returns 市区町村レベルの住所（最後まで削除した番地・号）
 */
export function extractCityLevelAddress(address: string): string {
  if (!address) return "";

  const normalized = address.replace(/，/g, ",").trim();

  // 旧データとして入り得る Nominatim 形式: "三条宮前町, 奈良市, 奈良県, 630-8121, 日本"
  if (normalized.includes(",")) {
    const segments = normalized
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !/^\d{3}-?\d{4}$/.test(s))
      .filter((s) => s !== "日本" && s.toLowerCase() !== "japan");

    const pref = segments.find((s) => /[都道府県]$/.test(s)) ?? "";
    const city = segments.find((s) => /[市区町村郡]$/.test(s)) ?? "";
    const town =
      segments.find((s) => s !== pref && s !== city && !/[都道府県市区町村郡]$/.test(s)) ?? "";

    const rebuilt = `${pref}${city}${town}`.trim();
    if (rebuilt) return rebuilt;

    return segments.slice(0, 3).join("").trim();
  }

  // 一般的な日本住所: 数字で始まる番地・号以降を削除
  const masked = normalized
    .replace(/[0-9０-９]+(?:丁目|番地?|号|\-|ー).*$|[0-9０-９]+-+[0-9０-９\-ー].*$/, "")
    .trim();

  return masked || normalized;
}

/**
 * 行政区画から都道府県レベルを抽出
 * 例：「千葉県木更津市清見台」→ 「千葉県」
 */
export function extractPrefecture(address: string): string {
  if (!address) return "";
  // 最初の「都」「道」「府」「県」までを取得
  const prefMatch = address.match(/^(.{2,3}[都道府県])/);
  return prefMatch ? prefMatch[1] : "";
}

/**
 * 緯度経度から市区町村レベルの座標を推定
 * 実際には正確な逆ジオコーディングが必要ですが、
 * ここでは簡易的に「かなりぼかした」範囲の中央座標を返す想定
 * 
 * 本番環境では、独立行政法人国土交通省の「地名辞書」などを使用し、
 * 市区町村の中央座標を正確に取得することを推奨
 * 
 * @param lat - 元の緯度
 * @param lng - 元の経度
 * @returns ぼかした座標（市区町村レベルの誤差を含む）
 */
export function obfuscateCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  // 毎回値が揺れないよう、座標に基づく決定的オフセットを使う。
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const latOffset = (pseudoRandom(lat * 97.13 + lng * 13.37) - 0.5) * 0.04;
  const lngOffset = (pseudoRandom(lat * 31.71 + lng * 53.11) - 0.5) * 0.04;

  return {
    lat: Math.round((lat + latOffset) * 100) / 100,
    lng: Math.round((lng + lngOffset) * 100) / 100,
  };
}

/**
 * ステータスに基づいて表示する住所を決定する
 * 
 * @param address - 詳細住所
 * @param status - マッチングステータス（'owner' | 'matched' | 'default'）
 * @param addAreaSuffix - 「エリア」サフィックスを付与するか（デフォルト: true）
 * @returns 表示対象の住所
 */
export function formatAddressByStatus(
  address: string,
  status: AddressStatusType,
  addAreaSuffix: boolean = true
): string {
  if (!address) return "（未指定）";
  
  // owner か matched の場合は詳細住所をそのまま返す
  if (status === 'owner' || status === 'matched') {
    return address;
  }

  // default の場合（応募前・未マッチ）：市区町村レベルまで削減
  const cityLevel = extractCityLevelAddress(address);
  if (!cityLevel) return "（未指定）";
  if (!addAreaSuffix || cityLevel.endsWith("エリア")) return cityLevel;
  return `${cityLevel}エリア`;
}

/**
 * 地図ショーピン座標返す
 * マッチング済みなら正確な座標、デフォルトの場合はぼかす
 * 
 * @param lat - 元の緯度
 * @param lng - 元の経度
 * @param status - マッチングステータス
 * @returns 表示用の座標（status による）
 */
export function getMapCoordinates(
  lat: number | undefined,
  lng: number | undefined,
  status: AddressStatusType
): { lat: number; lng: number } | null {
  if (lat === undefined || lng === undefined) return null;
  
  // owner か matched の場合は正確な座標を返す
  if (status === 'owner' || status === 'matched') {
    return { lat, lng };
  }
  
  // default の場合はぼかした座標を返す
  return obfuscateCoordinates(lat, lng);
}

/**
 * 地図を表示すべきかを判定
 * （マッチング前は地図を非表示にすることで、より詳細な位置情報を隠す）
 * 
 * @param status - マッチングステータス
 * @returns 地図表示の可否
 */
export function shouldShowMap(status: AddressStatusType): boolean {
  // owner か matched の場合のみ地図を表示
  return status === 'owner' || status === 'matched';
}
