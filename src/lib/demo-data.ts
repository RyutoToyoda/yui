// デモモード用のモックデータとストア
// Firebase未設定時にローカルデータで動作させるためのモジュール

import { User, Job, Application, Transaction, JobType, JobStatus, Availability, Notification, DayOfWeek } from "@/types/firestore";

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

// --- デモ スキマ時間 ---
const DEMO_AVAILABILITIES: Availability[] = [
  {
    id: "avail-1",
    userId: "demo-user-1",
    dayOfWeek: "水", // 旧データ
    startTime: "08:00",
    endTime: "12:00",
    note: "午前中なら対応可能",
    isActive: true,
    createdAt: new Date("2026-02-01"),
  },
  {
    id: "avail-2",
    userId: "demo-user-1",
    dayOfWeek: "土", // 旧データ
    startTime: "09:00",
    endTime: "17:00",
    note: "土曜は終日OK",
    isActive: true,
    createdAt: new Date("2026-02-01"),
  },
  {
    id: "avail-3",
    userId: "demo-user-2",
    date: "2026-03-25", // 新データ
    startTime: "13:00",
    endTime: "17:00",
    note: "午後から手伝えます（指定日のみ）",
    isActive: true,
    createdAt: new Date("2026-02-10"),
  },
  {
    id: "avail-4",
    userId: "demo-user-3",
    dayOfWeek: "水", // 旧データ
    startTime: "09:00",
    endTime: "15:00",
    note: "高所作業車持ち込み可",
    isActive: true,
    createdAt: new Date("2026-02-15"),
  },
];

// --- デモ通知 ---
const DEMO_NOTIFICATIONS: Notification[] = [];

// ============================
// デモストア（インメモリ状態管理）
// ============================

let currentUserId = "demo-user-1";
let users = [...DEMO_USERS];
let jobs = [...DEMO_JOBS];
let applications = [...DEMO_APPLICATIONS];
let transactions = [...DEMO_TRANSACTIONS];
let availabilities = [...DEMO_AVAILABILITIES];
let notifications = [...DEMO_NOTIFICATIONS];

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
  // 自動マッチング: 新しい募集が作成されたらスキマ時間と照合
  runAutoMatch(job);
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

// ============================
// スキマ時間（Availability）
// ============================

export function demoGetAvailabilitiesByUser(uid: string): Availability[] {
  return availabilities.filter((a) => a.userId === uid);
}

export function demoCreateAvailability(avail: Availability) {
  availabilities = [avail, ...availabilities];
}

export function demoUpdateAvailability(id: string, updates: Partial<Availability>) {
  availabilities = availabilities.map((a) => (a.id === id ? { ...a, ...updates } : a));
}

export function demoDeleteAvailability(id: string) {
  availabilities = availabilities.filter((a) => a.id !== id);
}

// ============================
// 通知
// ============================

export function demoGetNotificationsByUser(uid: string): Notification[] {
  return notifications
    .filter((n) => n.userId === uid)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function demoGetUnreadCountByUser(uid: string): number {
  return notifications.filter((n) => n.userId === uid && !n.isRead).length;
}

export function demoMarkNotificationRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
}

export function demoMarkAllNotificationsRead(uid: string) {
  notifications = notifications.map((n) =>
    n.userId === uid ? { ...n, isRead: true } : n
  );
}

export function demoCreateNotification(notif: Notification) {
  notifications = [notif, ...notifications];
}

// ============================
// 自動マッチングエンジン
// ============================

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "日", 1: "月", 2: "火", 3: "水", 4: "木", 5: "金", 6: "土",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasTimeOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  const a0 = timeToMinutes(aStart);
  const a1 = timeToMinutes(aEnd);
  const b0 = timeToMinutes(bStart);
  const b1 = timeToMinutes(bEnd);
  return a0 < b1 && b0 < a1;
}

function runAutoMatch(job: Job) {
  // 募集の日付と曜日を取得
  const jobDateString = job.date; // YYYY-MM-DD
  const jobDate = new Date(job.date);
  const jobDayOfWeek = DAY_MAP[jobDate.getDay()];

  // 全ユーザーの有効なスキマ時間をチェック
  const activeAvailabilities = availabilities.filter(
    (a) => a.isActive && a.userId !== job.creatorId
  );

  for (const avail of activeAvailabilities) {
    // 日付指定がある場合は完全一致、ない場合は曜日が一致するか
    if (avail.date) {
      if (avail.date !== jobDateString) continue;
    } else if (avail.dayOfWeek) {
      if (avail.dayOfWeek !== jobDayOfWeek) continue;
    } else {
      continue; // エラーデータ回避
    }

    // 時間帯が重なるか
    if (!hasTimeOverlap(avail.startTime, avail.endTime, job.startTime, job.endTime)) continue;

    // マッチ！通知を作成
    const user = users.find((u) => u.uid === avail.userId);
    if (!user) continue;

    const matchReason = avail.date ? `${avail.date}の` : `${avail.dayOfWeek}曜日の`;

    demoCreateNotification({
      id: generateId(),
      userId: avail.userId,
      type: "match",
      title: "🎯 ぴったりの募集が見つかりました！",
      message: `${job.creatorName}さんの「${job.title}」があなたの${matchReason}スキマ時間と一致しています。`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
  }
}

// マッチした募集を取得（ホーム画面おすすめ用）
export function demoGetMatchedJobsForUser(uid: string): Job[] {
  const userAvailabilities = availabilities.filter(
    (a) => a.userId === uid && a.isActive
  );

  if (userAvailabilities.length === 0) return [];

  return jobs.filter((job) => {
    if (job.creatorId === uid) return false;
    if (job.status !== "open") return false;

    const jobDateString = job.date;
    const jobDate = new Date(job.date);
    const jobDayOfWeek = DAY_MAP[jobDate.getDay()];

    return userAvailabilities.some(
      (avail) => {
        const isDateMatch = avail.date ? avail.date === jobDateString : avail.dayOfWeek === jobDayOfWeek;
        return isDateMatch && hasTimeOverlap(avail.startTime, avail.endTime, job.startTime, job.endTime);
      }
    );
  });
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
