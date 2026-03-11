// デモモード用のモックデータとストア
// Firebase未設定時にローカルデータで動作させるためのモジュール

import { User, Job, Application, Transaction, JobType, JobStatus } from "@/types/firestore";

// --- デモユーザー ---
const DEMO_USERS: User[] = [
  {
    uid: "demo-user-1",
    name: "田中 太郎",
    farmName: "田中農園",
    location: "長野県松本市",
    ageGroup: "30代",
    tokenBalance: 10,
    equipmentList: ["軽トラック"],
    createdAt: new Date("2026-01-15"),
  },
  {
    uid: "demo-user-2",
    name: "山田 花子",
    farmName: "山田ファーム",
    location: "長野県松本市",
    ageGroup: "60代",
    tokenBalance: 25,
    equipmentList: ["トラクター", "田植え機", "コンバイン"],
    createdAt: new Date("2025-11-01"),
  },
  {
    uid: "demo-user-3",
    name: "佐藤 健一",
    farmName: "佐藤果樹園",
    location: "長野県安曇野市",
    ageGroup: "50代",
    tokenBalance: 15,
    equipmentList: ["高所作業車", "草刈機"],
    createdAt: new Date("2025-12-10"),
  },
];

// --- デモ募集 ---
const DEMO_JOBS: Job[] = [
  {
    id: "job-1",
    creatorId: "demo-user-2",
    creatorName: "山田 花子",
    type: "labor",
    title: "田植え作業の手伝い募集",
    description: "5月中旬の田植え作業を手伝ってくれる方を募集します。朝8時から昼12時までの4時間作業です。昼食付き。",
    date: "2026-03-15",
    startTime: "08:00",
    endTime: "12:00",
    tokenRatePerHour: 1,
    totalTokens: 4,
    requiredPeople: 2,
    equipmentNeeded: "",
    status: "open",
    createdAt: new Date("2026-03-08"),
  },
  {
    id: "job-2",
    creatorId: "demo-user-3",
    creatorName: "佐藤 健一",
    type: "hybrid",
    title: "りんごの剪定作業（高所作業車付き）",
    description: "りんごの剪定作業を代行します。高所作業車を持ち込みで作業するため、効率的に進められます。",
    date: "2026-03-20",
    startTime: "09:00",
    endTime: "15:00",
    tokenRatePerHour: 4,
    totalTokens: 24,
    requiredPeople: 1,
    equipmentNeeded: "高所作業車",
    status: "open",
    createdAt: new Date("2026-03-07"),
  },
  {
    id: "job-3",
    creatorId: "demo-user-2",
    creatorName: "山田 花子",
    type: "equipment",
    title: "トラクター貸出（3月下旬）",
    description: "耕うん用のトラクターを貸し出します。3月下旬で希望の日をご相談ください。自走での引渡しも可能。",
    date: "2026-03-25",
    startTime: "09:00",
    endTime: "17:00",
    tokenRatePerHour: 2,
    totalTokens: 16,
    requiredPeople: 0,
    equipmentNeeded: "トラクター",
    status: "open",
    createdAt: new Date("2026-03-06"),
  },
  {
    id: "job-4",
    creatorId: "demo-user-1",
    creatorName: "田中 太郎",
    type: "labor",
    title: "草刈り作業（半日）",
    description: "畑周辺の草刈り作業です。重労働になりますが、経験不問です。",
    date: "2026-03-18",
    startTime: "08:00",
    endTime: "12:00",
    tokenRatePerHour: 1.5,
    totalTokens: 6,
    requiredPeople: 3,
    equipmentNeeded: "",
    status: "open",
    createdAt: new Date("2026-03-09"),
  },
];

// --- デモ応募 ---
const DEMO_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    jobId: "job-1",
    applicantId: "demo-user-1",
    applicantName: "田中 太郎",
    isAgreedToRules: true,
    status: "approved",
    createdAt: new Date("2026-03-09"),
  },
];

// --- デモトランザクション ---
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    fromUserId: "demo-user-2",
    fromUserName: "山田 花子",
    toUserId: "demo-user-1",
    toUserName: "田中 太郎",
    jobId: "job-prev-1",
    amount: 3,
    description: "収穫作業の手伝い",
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "txn-2",
    fromUserId: "demo-user-1",
    fromUserName: "田中 太郎",
    toUserId: "demo-user-3",
    toUserName: "佐藤 健一",
    jobId: "job-prev-2",
    amount: 5,
    description: "草刈機レンタル＋作業代行",
    createdAt: new Date("2026-02-20"),
  },
];

// ============================
// デモストア（インメモリ状態管理）
// ============================

let currentUserId = "demo-user-1";
let users = [...DEMO_USERS];
let jobs = [...DEMO_JOBS];
let applications = [...DEMO_APPLICATIONS];
let transactions = [...DEMO_TRANSACTIONS];

// ユーザー
export function demoGetCurrentUser(): User {
  return users.find((u) => u.uid === currentUserId) || users[0];
}

export function demoSetCurrentUser(uid: string) {
  currentUserId = uid;
}

export function demoGetUser(uid: string): User | undefined {
  return users.find((u) => u.uid === uid);
}

export function demoUpdateUser(uid: string, updates: Partial<User>) {
  users = users.map((u) => (u.uid === uid ? { ...u, ...updates } : u));
}

export function demoCreateUser(user: User) {
  users.push(user);
}

// 募集
export function demoGetJobs(status?: JobStatus): Job[] {
  if (status) return jobs.filter((j) => j.status === status);
  return [...jobs];
}

export function demoGetJob(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

export function demoGetJobsByUser(uid: string): Job[] {
  return jobs.filter((j) => j.creatorId === uid);
}

export function demoCreateJob(job: Job) {
  jobs = [job, ...jobs];
}

export function demoUpdateJob(id: string, updates: Partial<Job>) {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...updates } : j));
}

// 応募
export function demoGetApplicationsByJob(jobId: string): Application[] {
  return applications.filter((a) => a.jobId === jobId);
}

export function demoGetApplicationsByUser(uid: string): Application[] {
  return applications.filter((a) => a.applicantId === uid);
}

export function demoCreateApplication(app: Application) {
  applications = [app, ...applications];
}

export function demoUpdateApplication(id: string, updates: Partial<Application>) {
  applications = applications.map((a) => (a.id === id ? { ...a, ...updates } : a));
}

// トランザクション
export function demoGetTransactionsByUser(uid: string): Transaction[] {
  return transactions
    .filter((t) => t.fromUserId === uid || t.toUserId === uid)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function demoCreateTransaction(txn: Transaction) {
  transactions = [txn, ...transactions];
}

// トークン移転
export function demoTransferTokens(fromUid: string, toUid: string, amount: number, jobId: string, description: string) {
  const from = users.find((u) => u.uid === fromUid);
  const to = users.find((u) => u.uid === toUid);
  if (!from || !to) return false;
  if (from.tokenBalance < amount) return false;

  demoUpdateUser(fromUid, { tokenBalance: from.tokenBalance - amount });
  demoUpdateUser(toUid, { tokenBalance: to.tokenBalance + amount });

  demoCreateTransaction({
    id: `txn-${Date.now()}`,
    fromUserId: fromUid,
    fromUserName: from.name,
    toUserId: toUid,
    toUserName: to.name,
    jobId,
    amount,
    description,
    createdAt: new Date(),
  });

  return true;
}

// ユーティリティ
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getJobTypeLabel(type: JobType): string {
  switch (type) {
    case "labor": return "人のみ";
    case "equipment": return "機具のみ";
    case "hybrid": return "機具＋人";
  }
}

export function getJobTypeEmoji(type: JobType): string {
  switch (type) {
    case "labor": return "👤";
    case "equipment": return "🚜";
    case "hybrid": return "🚜👤";
  }
}
