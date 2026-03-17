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
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  Job,
  JobStatus,
  Application,
  Transaction,
  Availability,
  Notification,
  DayOfWeek,
  Ad,
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
    role: data.role ?? 'user',
    status: data.status ?? 'active',
    createdAt: toDate(data.createdAt),
  };
}

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
    location: data.location ?? "",
    locationLat: typeof data.locationLat === "number" ? data.locationLat : undefined,
    locationLng: typeof data.locationLng === "number" ? data.locationLng : undefined,
    status: data.status ?? "open",
    cancelReason: data.cancelReason,
    cancelDetail: data.cancelDetail,
    cancelledAt: data.cancelledAt ? toDate(data.cancelledAt) : undefined,
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
    reason: data.reason ?? undefined,
    detail: data.detail ?? undefined,
    isRead: data.isRead ?? false,
    createdAt: toDate(data.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToAd(data: any, id: string): Ad {
  return {
    id,
    companyName: data.companyName ?? "",
    title: data.title ?? "",
    imageUrl: data.imageUrl ?? "",
    linkUrl: data.linkUrl ?? "",
    displayOrder: data.displayOrder ?? 0,
    isActive: data.isActive ?? true,
    viewCount: data.viewCount ?? 0,
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
    equipmentSpecs: user.equipmentSpecs ?? [],
    crops: user.crops,
    role: user.role ?? "user",
    status: user.status,
    createdAt: Timestamp.fromDate(user.createdAt),
  });
}

export async function fsCreateUserIfAbsent(user: User): Promise<boolean> {
  const userRef = doc(db, "users", user.uid);
  let created = false;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (snap.exists()) return;

    created = true;
    transaction.set(userRef, {
      name: user.name,
      farmName: user.farmName,
      location: user.location,
      ageGroup: user.ageGroup,
      tokenBalance: user.tokenBalance,
      equipmentList: user.equipmentList,
      equipmentSpecs: user.equipmentSpecs ?? [],
      crops: user.crops,
      role: user.role ?? "user",
      status: user.status,
      createdAt: Timestamp.fromDate(user.createdAt),
    });
  });

  return created;
}

export async function fsUpdateUser(uid: string, updates: Partial<User>): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  delete data.uid;
  if (data.createdAt instanceof Date) {
    data.createdAt = Timestamp.fromDate(data.createdAt as Date);
  }
  await updateDoc(doc(db, "users", uid), data);
}

export async function fsGetAllUsers(): Promise<User[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => docToUser(d.data(), d.id));
}

export async function fsSetAdminRole(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role: 'admin' });
}

// ============================
// Jobs
// ============================

export async function fsGetJobs(status?: JobStatus): Promise<Job[]> {
  // 全データを取得（createdAtでソート）
  const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const jobs = snap.docs.map((d) => docToJob(d.data(), d.id));
  
  // クライアントサイドでフィルタリング（インデックスエラー回避）
  if (status) {
    return jobs.filter(j => j.status === status);
  }
  return jobs;
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
    location: job.location,
    locationLat: job.locationLat ?? null,
    locationLng: job.locationLng ?? null,
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

export async function fsDeleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", id));
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

export async function fsGetAllApplications(): Promise<Application[]> {
  const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
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
      const creatorBalance = Number(creatorData.tokenBalance || 0);

      // 1人あたりの獲得ポイント = 基準レート(ポイント/時) × 作業時間(h)
      // Note: form values store hours/mins sometimes as strings. Use String().split() guarantees.
      const tokenRate = Number(jobData.tokenRatePerHour || 1);
      const start = String(jobData.startTime || "00:00").split(":").map(Number);
      const end = String(jobData.endTime || "00:00").split(":").map(Number);
      const startH = isNaN(start[0]) ? 0 : start[0];
      const startM = isNaN(start[1]) ? 0 : start[1];
      const endH = isNaN(end[0]) ? 0 : end[0];
      const endM = isNaN(end[1]) ? 0 : end[1];
      
      const hours = Number((endH * 60 + endM - startH * 60 - startM) / 60);
      const pointsPerPerson = Math.max(0, Math.round(hours * tokenRate * 10) / 10);
      
      // 募集者の総支払ポイント = (基準レート × 作業時間) × 参加人数
      const totalPaidPoints = pointsPerPerson * Number(approvedApps.length);

      // トランザクション前の事前チェック
      if (isNaN(pointsPerPerson) || isNaN(totalPaidPoints) || pointsPerPerson < 0 || totalPaidPoints < 0) {
        throw new Error(`Invalid calculated points: pointsPerPerson=${pointsPerPerson}, totalPaidPoints=${totalPaidPoints}`);
      }

      // 1. 募集者の現在のポイント残高を確認（不足している場合はエラーを返す）
      if (creatorBalance < totalPaidPoints) {
        throw new Error(`Insufficient token balance (Balance: ${creatorBalance}, Required: ${totalPaidPoints})`);
      }

      // Read all applicants
      const applicantRefs = approvedApps.map(app => doc(db, "users", app.applicantId));
      let applicantSnaps;
      try {
        applicantSnaps = await Promise.all(applicantRefs.map(ref => transaction.get(ref)));
      } catch (err: any) {
        throw new Error("Failed to read applicants (Permission Denied): " + err.message);
      }

      // 2. 募集者のポイントを「総支払ポイント」分マイナスする
      transaction.update(creatorRef, { tokenBalance: creatorBalance - totalPaidPoints });

      // 3. 参加者（複数名対応）のポイントを「1人あたりの獲得ポイント」分プラスする
      applicantSnaps.forEach((snap, index) => {
        if (!snap.exists()) return;
        const applicantData = snap.data();
        const applicantBalance = Number(applicantData.tokenBalance || 0);
        
        try {
          transaction.update(snap.ref, { tokenBalance: applicantBalance + pointsPerPerson });
        } catch (err: any) {
           throw new Error("Failed to update applicant balance (Permission Denied): " + err.message);
        }

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
// Job Cancellation with Penalty (Atomic Transaction)
// ============================

export async function fsCancelJobWithPenalty(jobId: string, hostId: string, reason: string): Promise<boolean> {
  try {
    // 1. Fetch approved applications first (outside transaction to get the count of participants)
    const appsSnap = await getDocs(query(collection(db, "applications"), where("jobId", "==", jobId), where("status", "==", "approved")));
    const approvedApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

    await runTransaction(db, async (transaction) => {
      // 2. Fetch Job
      const jobRef = doc(db, "jobs", jobId);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const jobData = jobSnap.data() as Job;

      if (jobData.creatorId !== hostId) throw new Error("Only the host can cancel this job");
      if (jobData.status === "cancelled") throw new Error("Job is already cancelled");
      if (jobData.status === "completed") throw new Error("Cannot cancel a completed job");

      let penaltyPerPerson = 0;
      let totalPenalty = 0;
      let isPenaltyApplied = false;

      // 3. If there are participants, check the rules
      if (approvedApps.length > 0) {
        // "悪天候" (Bad weather) or "体調不良" (Illness) do not incur penalties regardless of time.
        const isPenaltyReason = reason !== "悪天候" && reason !== "体調不良";

        if (isPenaltyReason) {
          // Parse job start date and time
          const jobDateTimeStr = `${jobData.date}T${jobData.startTime}:00`;
          const jobDateTime = new Date(jobDateTimeStr);
          const now = new Date();
          const diffMs = jobDateTime.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // If less than 24 hours AND reason requires penalty
          if (diffHours < 24) {
            isPenaltyApplied = true;
            // Calculate penalty: 10% of total job tokens (minimum 1P per person)
            const totalTokens = Number(jobData.totalTokens || 0);
            penaltyPerPerson = Math.max(1, Math.floor(totalTokens * 0.10));
            totalPenalty = penaltyPerPerson * approvedApps.length;

            // Deduct from Host
            const hostRef = doc(db, "users", hostId);
            const hostSnap = await transaction.get(hostRef);
            if (!hostSnap.exists()) throw new Error("Host not found");
            const hostBalance = Number(hostSnap.data().tokenBalance || 0);

            // Update host balance
            transaction.update(hostRef, { tokenBalance: hostBalance - totalPenalty });

            // Add to all approved applicants
            const applicantRefs = approvedApps.map(app => doc(db, "users", app.applicantId));
            const applicantSnaps = await Promise.all(applicantRefs.map(ref => transaction.get(ref)));

            applicantSnaps.forEach((snap, index) => {
              if (!snap.exists()) return;
              const applicantData = snap.data();
              const applicantBalance = Number(applicantData.tokenBalance || 0);
              
              transaction.update(snap.ref, { tokenBalance: applicantBalance + penaltyPerPerson });

              // Record penalty transaction
              const txRef = doc(collection(db, "transactions"));
              transaction.set(txRef, {
                fromUserId: hostId,
                fromUserName: jobData.creatorName ?? "",
                toUserId: approvedApps[index].applicantId,
                toUserName: applicantData.name ?? "",
                jobId,
                amount: penaltyPerPerson,
                description: `キャンセルペナルティ: ${jobData.title}`,
                createdAt: Timestamp.fromDate(new Date()),
              });
            });
          }
        }

        // Notify all participants about the cancellation with the specific reason
        approvedApps.forEach(app => {
          const notifRef = doc(collection(db, "notifications"));
          let message = `【${reason}】のため、${jobData.creatorName}さんの作業「${jobData.title}」がキャンセルされました。`;
          if (isPenaltyApplied) {
            message += ` 直前のキャンセルのため、補償として ${penaltyPerPerson}P が付与されました。`;
          }
          
          transaction.set(notifRef, {
            userId: app.applicantId,
            type: "match",
            title: "作業キャンセルのお知らせ",
            message: message,
            jobId: jobId,
            isRead: false,
            createdAt: Timestamp.fromDate(new Date()),
          });
          
          // Set application status to cancelled
          const appRef = doc(db, "applications", app.id);
          transaction.update(appRef, { status: "cancelled" });
        });
      }

      // 4. Update the job status to cancelled and save the reason
      transaction.update(jobRef, { 
        status: "cancelled",
        cancelReason: reason 
      });
    });
    return true;
  } catch (error) {
    console.error("Cancel job with penalty failed:", error);
    throw error;
  }
}

// ============================
// Job Cancellation (No Penalty - 見えないペナルティ方式)
// ============================

// キャンセル理由 → cancelStats フィールド名のマッピング
const CANCEL_REASON_KEY: Record<string, string> = {
  "悪天候": "weather",
  "体調不良": "personal",
  "作業内容変更": "workChange",
  "その他": "other",
};

export async function fsCancelJob(
  jobId: string,
  hostId: string,
  cancelReason: string,
  cancelDetail: string = ""
): Promise<void> {
  // 応募者全員（pending / approved）を取得
  const appsSnap = await getDocs(
    query(
      collection(db, "applications"),
      where("jobId", "==", jobId),
      where("status", "in", ["pending", "approved"])
    )
  );
  const applicants = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

  await runTransaction(db, async (transaction) => {
    const jobRef = doc(db, "jobs", jobId);
    const jobSnap = await transaction.get(jobRef);
    if (!jobSnap.exists()) throw new Error("Job not found");
    const jobData = jobSnap.data();

    if (jobData.creatorId !== hostId) throw new Error("Only the host can cancel this job");
    if (jobData.status === "cancelled") throw new Error("Job is already cancelled");
    if (jobData.status === "completed") throw new Error("Cannot cancel a completed job");

    const now = Timestamp.fromDate(new Date());

    // 1. 募集ステータス更新
    transaction.update(jobRef, {
      status: "cancelled",
      cancelReason,
      cancelDetail: cancelDetail || null,
      cancelledAt: now,
    });

    // 2. 応募者全員に通知
    applicants.forEach(app => {
      const notifRef = doc(collection(db, "notifications"));
      transaction.set(notifRef, {
        userId: app.applicantId,
        type: "job_cancelled",
        title: "作業がキャンセルされました",
        message: `${jobData.creatorName}農園の作業「${jobData.title}」がキャンセルされました。`,
        jobId,
        reason: cancelReason,
        detail: cancelDetail || null,
        isRead: false,
        createdAt: now,
      });

      // 応募ステータスも cancelled に更新
      const appRef = doc(db, "applications", app.id);
      transaction.update(appRef, { status: "cancelled" });
    });

    // 3. 見えないペナルティ（ホストのキャンセル統計を蓄積）
    const reasonKey = CANCEL_REASON_KEY[cancelReason] ?? "other";
    const hostRef = doc(db, "users", hostId);
    transaction.update(hostRef, {
      "cancelStats.total": increment(1),
      [`cancelStats.${reasonKey}`]: increment(1),
    });
  });
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
    reason: notif.reason ?? null,
    detail: notif.detail ?? null,
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
// Ads (管理者用)
// ============================

export async function fsGetAds(onlyActive: boolean = false): Promise<Ad[]> {
  const q = query(collection(db, "ads"), orderBy("displayOrder", "asc"));
  const snap = await getDocs(q);
  const ads = snap.docs.map(d => docToAd(d.data(), d.id));
  if (onlyActive) {
    return ads.filter(ad => ad.isActive);
  }
  return ads;
}

export async function fsUpsertAd(ad: Partial<Ad>): Promise<string> {
  const data = {
    ...ad,
    updatedAt: Timestamp.fromDate(new Date()),
  };
  delete data.id;
  
  if (!ad.id) {
    (data as any).createdAt = Timestamp.fromDate(new Date());
    (data as any).viewCount = 0;
    const ref = await addDoc(collection(db, "ads"), data);
    return ref.id;
  } else {
    await updateDoc(doc(db, "ads", ad.id), data);
    return ad.id;
  }
}

export async function fsIncrementAdView(id: string): Promise<void> {
  // 簡易的なインクリメント（本来は increment() を使用すべき）
  const ref = doc(db, "ads", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data().viewCount ?? 0;
    await updateDoc(ref, { viewCount: current + 1 });
  }
}

export async function fsDeleteAd(id: string): Promise<void> {
  await deleteDoc(doc(db, "ads", id));
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
