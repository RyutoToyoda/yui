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
  limit,
  Timestamp,
  runTransaction,
  writeBatch,
  getCountFromServer,
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
    equipmentSpecs: data.equipmentSpecs ?? [],
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

      const fromData = fromSnap.data();
      const toData = toSnap.data();
      const fromBalance = fromData.tokenBalance ?? 0;
      if (fromBalance < amount) throw new Error("Insufficient balance");

      const toBalance = toData.tokenBalance ?? 0;

      // 残高更新
      transaction.update(fromRef, { tokenBalance: fromBalance - amount });
      transaction.update(toRef, { tokenBalance: toBalance + amount });

      // トランザクション履歴もアトミックに記録（runTransaction内でset）
      const txRef = doc(collection(db, "transactions"));
      transaction.set(txRef, {
        fromUserId: fromUid,
        fromUserName: fromData.name ?? "",
        toUserId: toUid,
        toUserName: toData.name ?? "",
        jobId,
        amount,
        description,
        createdAt: Timestamp.fromDate(new Date()),
      });
    });

    return true;
  } catch {
    console.error("Token transfer failed");
    return false;
  }
}

// ============================
// Job Completion (Atomic Transaction)
// ============================

export async function fsCompleteJobTransaction(jobId: string): Promise<boolean> {
  try {
    // We first get the applications to know who participated (outside transaction to get array length easily,
    // though getting them inside transaction is safer if they change, but applications status="approved" is final usually)
    const appsSnap = await getDocs(query(collection(db, "applications"), where("jobId", "==", jobId), where("status", "==", "approved")));
    const approvedApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
    if (approvedApps.length === 0) throw new Error("No approved applicants");

    await runTransaction(db, async (transaction) => {
      const jobRef = doc(db, "jobs", jobId);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const jobData = jobSnap.data();

      // Ensure job is not already completed
      if (jobData.status === "completed") throw new Error("Job is already completed");

      const creatorRef = doc(db, "users", jobData.creatorId);
      const creatorSnap = await transaction.get(creatorRef);
      if (!creatorSnap.exists()) throw new Error("Creator not found");
      const creatorData = creatorSnap.data();
      const creatorBalance = creatorData.tokenBalance ?? 0;

      // 1人あたりの獲得ポイント = 基準レート(ポイント/時) × 作業時間(h)
      const tokenRate = jobData.tokenRatePerHour ?? 1;
      const start = (jobData.startTime as string).split(":").map(Number);
      const end = (jobData.endTime as string).split(":").map(Number);
      const hours = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
      const pointsPerPerson = Math.max(0, Math.round(hours * tokenRate * 10) / 10);
      
      // 募集者の総支払ポイント = (基準レート × 作業時間) × 参加人数
      const totalPaidPoints = pointsPerPerson * approvedApps.length;

      // 1. 募集者の現在のポイント残高を確認（不足している場合はエラーを返す）
      if (creatorBalance < totalPaidPoints) {
        throw new Error("Insufficient token balance");
      }

      // Read all applicants
      const applicantRefs = approvedApps.map(app => doc(db, "users", app.applicantId));
      const applicantSnaps = await Promise.all(applicantRefs.map(ref => transaction.get(ref)));

      // 2. 募集者のポイントを「総支払ポイント」分マイナスする
      transaction.update(creatorRef, { tokenBalance: creatorBalance - totalPaidPoints });

      // 3. 参加者（複数名対応）のポイントを「1人あたりの獲得ポイント」分プラスする
      applicantSnaps.forEach((snap, index) => {
        if (!snap.exists()) return;
        const applicantData = snap.data();
        const applicantBalance = applicantData.tokenBalance ?? 0;
        transaction.update(snap.ref, { tokenBalance: applicantBalance + pointsPerPerson });

        // Record transaction
        const txRef = doc(collection(db, "transactions"));
        transaction.set(txRef, {
          fromUserId: jobData.creatorId,
          fromUserName: creatorData.name ?? "",
          toUserId: approvedApps[index].applicantId,
          toUserName: applicantData.name ?? "",
          jobId,
          amount: pointsPerPerson,
          description: jobData.title ?? "",
          createdAt: Timestamp.fromDate(new Date()),
        });
        
        // Update application status
        const appRef = doc(db, "applications", approvedApps[index].id);
        transaction.update(appRef, { status: "completed" });
      });

      // 4. 募集データ（Job/Task）のステータスを「完了」に更新する
      transaction.update(jobRef, { status: "completed" });
    });
    return true;
  } catch (error) {
    console.error("Job completion failed:", error);
    throw error;
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

/**
 * 【既存互換】全通知を取得（内部・自動マッチングなどでも使用）
 */
export async function fsGetNotificationsByUser(uid: string): Promise<Notification[]> {
  const q = query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToNotification(d.data(), d.id));
}

/**
 * 【コスト最適化】未読通知の件数のみ取得（getCountFromServer）
 * onSnapshotやポーリングを使わず、マウント時・タブフォーカス時にオンデマンドで呼ぶ
 */
export async function fsFetchUnreadCount(uid: string): Promise<number> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("isRead", "==", false)
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * 【コスト最適化】通知リストをページネーション付きで取得
 * onSnapshotやポーリングを使わず、ページ表示時・リロード時にオンデマンドで呼ぶ
 */
export async function fsFetchNotifications(uid: string, maxCount: number = 30): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToNotification(d.data(), d.id));
}

/**
 * 【後方互換】既存のfsGetUnreadCountByUserをfsFetchUnreadCountに委譲
 */
export async function fsGetUnreadCountByUser(uid: string): Promise<number> {
  return fsFetchUnreadCount(uid);
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

/**
 * 新規ユーザー登録時にプロフィール登録を促すウェルカム通知を発行
 */
export async function fsCreateWelcomeNotification(uid: string): Promise<void> {
  await fsCreateNotification({
    userId: uid,
    type: "match",
    title: "🌱 ようこそ「結 Yui」へ！",
    message:
      "まずはマイページで、持っている農機具や手伝える時間を登録しましょう。登録するとご近所さんとマッチングしやすくなります！",
    isRead: false,
    createdAt: new Date(),
  });
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
