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
  
  // メインのパターン：数字や「丁目」以降を削除
  // 「2丁目」「2-1」「2番」「2号」など、番地以降を削して市区町村+町域レベル留める
  const maskPattern = /(\d[0-9０-９\-ー丁番号].*$)/;
  let masked = address.replace(maskPattern, "").trim();
  
  // さらに、末尾の「エリア」「付近」のような不要な接尾辞があれば削除
  // （運用によって必要に応じて調整）
  return masked;
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
  // 市区町村レベルの精度を考慮し、小数第2位（約1km）までに限定
  // さらに ±0.05 度（約5km）のランダムなオフセットを加える
  const offset = 0.05;
  const randomLat = (Math.random() - 0.5) * offset;
  const randomLng = (Math.random() - 0.5) * offset;
  
  return {
    lat: Math.round((lat + randomLat) * 100) / 100,
    lng: Math.round((lng + randomLng) * 100) / 100,
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
  return addAreaSuffix ? `${cityLevel}エリア` : cityLevel;
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
