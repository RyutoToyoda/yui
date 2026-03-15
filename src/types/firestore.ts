// Firestore コレクション型定義

// 農機具の仕様情報
export interface EquipmentSpec {
  equipmentId: string;   // equipment-data.ts の id に対応
  horsepower?: string;   // 馬力・条数など
  weight?: string;       // 重さ
  attachments?: string[]; // アタッチメントリスト
}

export interface User {
  uid: string;
  name: string;
  farmName: string;
  location: string;
  ageGroup: string;
  tokenBalance: number;
  equipmentList: string[];
  equipmentSpecs?: EquipmentSpec[]; // 仕様付き農機具（後方互換で optional）
  crops: string[];
  role?: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Ad {
  id: string;
  companyName: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  viewCount: number;
  createdAt: Date;
}

export type JobType = "labor" | "equipment" | "hybrid";
export type JobStatus = "open" | "matched" | "in_progress" | "completed" | "cancelled";

export interface Job {
  id: string;
  creatorId: string;
  creatorName: string;
  type: JobType;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  tokenRatePerHour: number;
  totalTokens: number;
  requiredPeople: number;
  equipmentNeeded: string;
  location: string;
  status: JobStatus;
  cancelReason?: string;
  createdAt: Date;
}

export type ApplicationStatus = "pending" | "approved" | "rejected" | "completed";

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  isAgreedToRules: boolean;
  status: ApplicationStatus;
  rating?: number;
  review?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  jobId: string;
  amount: number;
  description: string;
  createdAt: Date;
}

// 曜日
export type DayOfWeek = "月" | "火" | "水" | "木" | "金" | "土" | "日";

// スキマ時間（手伝える時間帯）
export interface Availability {
  id: string;
  userId: string;
  date?: string; // YYYY-MM-DD (優先)
  dayOfWeek?: DayOfWeek; // 互換性のために保持
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  note: string;
  isActive: boolean;
  createdAt: Date;
}

// アプリ内通知
export type NotificationType = "match" | "application" | "approved" | "completed";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string;
  isRead: boolean;
  createdAt: Date;
}
