// Firestore CRUD サービスレイヤー
// demo-data.ts と同じインターフェースを提供し、Firestore に接続

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import type {
  User,
  Job,
  JobStatus,
  Application,
  Transaction,
  Availability,
  Notification,
  DayOfWeek,
} from "@/types/firestore";

// ============================
// ヘルパー: Firestore ⇔ アプリ型の変換
// ============================

function toDate(val: Timestamp | Date | unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToUser(data: any, uid: string): User {
  return {
    uid,
    name: data.name ?? "",
    farmName: data.farmName ?? "",
    location: data.location ?? "",
    ageGroup: data.ageGroup ?? "",
    tokenBalance: data.tokenBalance ?? 0,
    equipmentList: data.equipmentList ?? [],
    crops: data.crops ?? [],
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToJob(data: any, id: string): Job {
  return {
    id,
    creatorId: data.creatorId ?? "",
    creatorName: data.creatorName ?? "",
    type: data.type ?? "labor",
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    startTime: data.startTime ?? "",
    endTime: data.endTime ?? "",
    tokenRatePerHour: data.tokenRatePerHour ?? 1,
    totalTokens: data.totalTokens ?? 0,
    requiredPeople: data.requiredPeople ?? 0,
    equipmentNeeded: data.equipmentNeeded ?? "",
    status: data.status ?? "open",
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToApplication(data: any, id: string): Application {
  return {
    id,
    jobId: data.jobId ?? "",
    applicantId: data.applicantId ?? "",
    applicantName: data.applicantName ?? "",
    isAgreedToRules: data.isAgreedToRules ?? false,
    status: data.status ?? "pending",
    rating: data.rating,
    review: data.review,
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToTransaction(data: any, id: string): Transaction {
  return {
    id,
    fromUserId: data.fromUserId ?? "",
    fromUserName: data.fromUserName ?? "",
    toUserId: data.toUserId ?? "",
    toUserName: data.toUserName ?? "",
    jobId: data.jobId ?? "",
    amount: data.amount ?? 0,
    description: data.description ?? "",
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToAvailability(data: any, id: string): Availability {
  return {
    id,
    userId: data.userId ?? "",
    date: data.date,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime ?? "",
    endTime: data.endTime ?? "",
    note: data.note ?? "",
    isActive: data.isActive ?? true,
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToNotification(data: any, id: string): Notification {
  return {
    id,
    userId: data.userId ?? "",
    type: data.type ?? "match",
    title: data.title ?? "",
    message: data.message ?? "",
    jobId: data.jobId,
    isRead: data.isRead ?? false,
    createdAt: toDate(data.createdAt),
  };
}

// ============================
// Users
// ============================

export async function fsGetUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return docToUser(snap.data(), uid);
}

export async function fsCreateUser(user: User): Promise<void> {
  await setDoc(doc(db, "users", user.uid), {
    name: user.name,
    farmName: user.farmName,
    location: user.location,
    ageGroup: user.ageGroup,
    tokenBalance: user.tokenBalance,
    equipmentList: user.equipmentList,
    crops: user.crops,
    createdAt: Timestamp.fromDate(user.createdAt),
  });
}

export async function fsUpdateUser(uid: string, updates: Partial<User>): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  delete data.uid;
  if (data.createdAt instanceof Date) {
    data.createdAt = Timestamp.fromDate(data.createdAt as Date);
  }
  await updateDoc(doc(db, "users", uid), data);
}

// ============================
// Jobs
// ============================

export async function fsGetJobs(status?: JobStatus): Promise<Job[]> {
  let q;
  if (status) {
    q = query(collection(db, "jobs"), where("status", "==", status), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToJob(d.data(), d.id));
}

export async function fsGetJob(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", id));
  if (!snap.exists()) return null;
  return docToJob(snap.data(), id);
}

export async function fsGetJobsByUser(uid: string): Promise<Job[]> {
  const q = query(collection(db, "jobs"), where("creatorId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToJob(d.data(), d.id));
}

export async function fsCreateJob(job: Omit<Job, "id"> & { id?: string }): Promise<string> {
  const data = {
    creatorId: job.creatorId,
    creatorName: job.creatorName,
    type: job.type,
    title: job.title,
    description: job.description,
    date: job.date,
    startTime: job.startTime,
    endTime: job.endTime,
    tokenRatePerHour: job.tokenRatePerHour,
    totalTokens: job.totalTokens,
    requiredPeople: job.requiredPeople,
    equipmentNeeded: job.equipmentNeeded,
    status: job.status,
    createdAt: Timestamp.fromDate(job.createdAt instanceof Date ? job.createdAt : new Date()),
  };
  const ref = await addDoc(collection(db, "jobs"), data);

  // 自動マッチング
  await runAutoMatch({ ...job, id: ref.id } as Job);

  return ref.id;
}

export async function fsUpdateJob(id: string, updates: Partial<Job>): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  delete data.id;
  if (data.createdAt instanceof Date) {
    data.createdAt = Timestamp.fromDate(data.createdAt as Date);
  }
  await updateDoc(doc(db, "jobs", id), data);
}

// ============================
// Applications
// ============================

export async function fsGetApplicationsByJob(jobId: string): Promise<Application[]> {
  const q = query(collection(db, "applications"), where("jobId", "==", jobId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToApplication(d.data(), d.id));
}

export async function fsGetApplicationsByUser(uid: string): Promise<Application[]> {
  const q = query(collection(db, "applications"), where("applicantId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToApplication(d.data(), d.id));
}

export async function fsCreateApplication(app: Omit<Application, "id">): Promise<string> {
  const data = {
    jobId: app.jobId,
    applicantId: app.applicantId,
    applicantName: app.applicantName,
    isAgreedToRules: app.isAgreedToRules,
    status: app.status,
    createdAt: Timestamp.fromDate(app.createdAt instanceof Date ? app.createdAt : new Date()),
  };
  const ref = await addDoc(collection(db, "applications"), data);
  return ref.id;
}

export async function fsUpdateApplication(id: string, updates: Partial<Application>): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  delete data.id;
  if (data.createdAt instanceof Date) {
    data.createdAt = Timestamp.fromDate(data.createdAt as Date);
  }
  await updateDoc(doc(db, "applications", id), data);
}

// ============================
// Transactions
// ============================

export async function fsGetTransactionsByUser(uid: string): Promise<Transaction[]> {
  // Firestore does not support OR queries across fields, so we do 2 queries
  const qFrom = query(collection(db, "transactions"), where("fromUserId", "==", uid));
  const qTo = query(collection(db, "transactions"), where("toUserId", "==", uid));
  const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);

  const seen = new Set<string>();
  const results: Transaction[] = [];

  for (const d of [...snapFrom.docs, ...snapTo.docs]) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    results.push(docToTransaction(d.data(), d.id));
  }

  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================
// Token Transfer (Firestore Transaction)
// ============================

export async function fsTransferTokens(
  fromUid: string,
  toUid: string,
  amount: number,
  jobId: string,
  description: string
): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      const fromRef = doc(db, "users", fromUid);
      const toRef = doc(db, "users", toUid);

      const fromSnap = await transaction.get(fromRef);
      const toSnap = await transaction.get(toRef);

      if (!fromSnap.exists() || !toSnap.exists()) throw new Error("User not found");

      const fromBalance = fromSnap.data().tokenBalance ?? 0;
      if (fromBalance < amount) throw new Error("Insufficient balance");

      const toBalance = toSnap.data().tokenBalance ?? 0;

      transaction.update(fromRef, { tokenBalance: fromBalance - amount });
      transaction.update(toRef, { tokenBalance: toBalance + amount });
    });

    // トランザクション成功後に記録を追加
    const fromUser = await fsGetUser(fromUid);
    const toUser = await fsGetUser(toUid);

    await addDoc(collection(db, "transactions"), {
      fromUserId: fromUid,
      fromUserName: fromUser?.name ?? "",
      toUserId: toUid,
      toUserName: toUser?.name ?? "",
      jobId,
      amount,
      description,
      createdAt: Timestamp.fromDate(new Date()),
    });

    return true;
  } catch {
    console.error("Token transfer failed");
    return false;
  }
}

// ============================
// Availabilities
// ============================

export async function fsGetAvailabilitiesByUser(uid: string): Promise<Availability[]> {
  const q = query(collection(db, "availabilities"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToAvailability(d.data(), d.id));
}

export async function fsCreateAvailability(avail: Omit<Availability, "id">): Promise<string> {
  const data = {
    userId: avail.userId,
    date: avail.date ?? null,
    dayOfWeek: avail.dayOfWeek ?? null,
    startTime: avail.startTime,
    endTime: avail.endTime,
    note: avail.note,
    isActive: avail.isActive,
    createdAt: Timestamp.fromDate(avail.createdAt instanceof Date ? avail.createdAt : new Date()),
  };
  const ref = await addDoc(collection(db, "availabilities"), data);
  return ref.id;
}

export async function fsUpdateAvailability(id: string, updates: Partial<Availability>): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  delete data.id;
  await updateDoc(doc(db, "availabilities", id), data);
}

export async function fsDeleteAvailability(id: string): Promise<void> {
  await deleteDoc(doc(db, "availabilities", id));
}

// ============================
// Notifications
// ============================

export async function fsGetNotificationsByUser(uid: string): Promise<Notification[]> {
  const q = query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToNotification(d.data(), d.id));
}

export async function fsGetUnreadCountByUser(uid: string): Promise<number> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("isRead", "==", false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function fsMarkNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { isRead: true });
}

export async function fsMarkAllNotificationsRead(uid: string): Promise<void> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("isRead", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
  await batch.commit();
}

export async function fsCreateNotification(notif: Omit<Notification, "id">): Promise<string> {
  const data = {
    userId: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    jobId: notif.jobId ?? null,
    isRead: notif.isRead,
    createdAt: Timestamp.fromDate(notif.createdAt instanceof Date ? notif.createdAt : new Date()),
  };
  const ref = await addDoc(collection(db, "notifications"), data);
  return ref.id;
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

async function runAutoMatch(job: Job): Promise<void> {
  const jobDate = job.date;

  // 全ユーザーの有効なスキマ時間を取得
  const q = query(
    collection(db, "availabilities"),
    where("isActive", "==", true),
    where("date", "==", jobDate) // 日付で一致させる
  );
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    const avail = docToAvailability(d.data(), d.id);
    if (avail.userId === job.creatorId) continue;
    if (!hasTimeOverlap(avail.startTime, avail.endTime, job.startTime, job.endTime)) continue;

    // マッチ！通知を作成
    await fsCreateNotification({
      userId: avail.userId,
      type: "match",
      title: "🎯 ぴったりの募集が見つかりました！",
      message: `${job.creatorName}さんの「${job.title}」があなたの${job.date}の手伝い設定と一致しています。`,
      jobId: job.id,
      isRead: false,
      createdAt: new Date(),
    });
  }
}

// マッチした募集を取得
export async function fsGetMatchedJobsForUser(uid: string): Promise<Job[]> {
  const userAvails = await fsGetAvailabilitiesByUser(uid);
  const activeAvails = userAvails.filter((a) => a.isActive && a.date);
  if (activeAvails.length === 0) return [];

  const openJobs = await fsGetJobs("open");

  return openJobs.filter((job) => {
    if (job.creatorId === uid) return false;
    return activeAvails.some(
      (avail) =>
        avail.date === job.date &&
        hasTimeOverlap(avail.startTime, avail.endTime, job.startTime, job.endTime)
    );
  });
}

// ============================
// ユーティリティ（demo-data.ts 互換）
// ============================

export function getJobTypeLabel(type: string): string {
  switch (type) {
    case "labor": return "人のみ";
    case "equipment": return "農機具のみ";
    case "hybrid": return "農機具＋人";
    default: return type;
  }
}

export function getJobTypeEmoji(type: string): string {
  switch (type) {
    case "labor": return "👤";
    case "equipment": return "🚜";
    case "hybrid": return "🚜👤";
    default: return "❓";
  }
}
