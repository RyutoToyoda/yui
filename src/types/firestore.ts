// Firestore コレクション型定義

export interface User {
  uid: string;
  name: string;
  farmName: string;
  location: string;
  ageGroup: string;
  tokenBalance: number;
  equipmentList: string[];
  crops: string[];
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
  status: JobStatus;
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
