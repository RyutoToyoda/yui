import { NextResponse } from "next/server";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const jobsSnap = await getDocs(collection(db, "jobs"));
    const validJobIds = new Set(jobsSnap.docs.map(d => d.id));

    const appsSnap = await getDocs(collection(db, "applications"));
    const notifsSnap = await getDocs(collection(db, "notifications"));
    const transSnap = await getDocs(collection(db, "transactions"));

    let deletedApps = 0;
    let deletedNotifs = 0;
    let deletedTrans = 0;

    const batch = writeBatch(db);
    let batchCount = 0;

    const commitBatchIfNeeded = async () => {
      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
      }
    };

    // Check Applications
    for (const docSnap of appsSnap.docs) {
      const data = docSnap.data();
      if (!validJobIds.has(data.jobId)) {
        batch.delete(docSnap.ref);
        deletedApps++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    // Check Notifications
    for (const docSnap of notifsSnap.docs) {
      const data = docSnap.data();
      if (data.jobId && !validJobIds.has(data.jobId)) {
        batch.delete(docSnap.ref);
        deletedNotifs++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    // Check Transactions
    for (const docSnap of transSnap.docs) {
      const data = docSnap.data();
      if (data.jobId && !validJobIds.has(data.jobId)) {
        batch.delete(docSnap.ref);
        deletedTrans++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      deletedApps,
      deletedNotifs,
      deletedTrans,
      totalOrphans: deletedApps + deletedNotifs + deletedTrans
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
