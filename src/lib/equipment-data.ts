// 農機具マスターデータ

export interface EquipmentMaster {
  id: string;
  name: string;
  /** 仕様入力（馬力・アタッチメント等）が必要か */
  hasSpecs: boolean;
  /** 馬力の選択肢（hasSpecs=true の場合のみ使用） */
  horsepowerOptions?: string[];
  /** アタッチメントの選択肢 */
  attachmentOptions?: string[];
}

export const EQUIPMENT_MASTER: EquipmentMaster[] = [
  {
    id: "tractor",
    name: "トラクター",
    hasSpecs: true,
    horsepowerOptions: ["15PS以下", "15〜25PS", "25〜35PS", "35〜50PS", "50PS以上"],
    attachmentOptions: ["ロータリー", "ハロー", "プラウ", "畝立て機", "マルチャー", "フロントローダー"],
  },
  {
    id: "cultivator",
    name: "耕運機",
    hasSpecs: true,
    horsepowerOptions: ["3PS以下", "3〜5PS", "5〜7PS", "7PS以上"],
    attachmentOptions: ["標準ロータリー", "培土器", "溝掘り機"],
  },
  {
    id: "combine",
    name: "コンバイン",
    hasSpecs: true,
    horsepowerOptions: ["2条刈り", "3条刈り", "4条刈り", "5条刈り以上"],
    attachmentOptions: [],
  },
  {
    id: "rice_transplanter",
    name: "田植え機",
    hasSpecs: true,
    horsepowerOptions: ["4条植え", "5条植え", "6条植え", "8条植え以上"],
    attachmentOptions: ["施肥機付き", "側条施肥"],
  },
  { id: "mower", name: "草刈機", hasSpecs: false },
  { id: "light_truck", name: "軽トラック", hasSpecs: false },
  { id: "light_van", name: "軽バン", hasSpecs: false },
  { id: "sprayer", name: "動噴", hasSpecs: false },
];
