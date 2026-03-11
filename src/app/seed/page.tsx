"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- モックデータ ---
const DEMO_USERS = [
  {
    uid: "demo-user-1",
    name: "田中 太郎",
    farmName: "田中農園",
    location: "長野県松本市",
    ageGroup: "30代",
    tokenBalance: 10,
    equipmentList: ["軽トラック"],
  },
  {
    uid: "demo-user-2",
    name: "山田 花子",
    farmName: "山田ファーム",
    location: "長野県松本市",
    ageGroup: "60代",
    tokenBalance: 25,
    equipmentList: ["トラクター", "田植え機", "コンバイン"],
  },
  {
    uid: "demo-user-3",
    name: "佐藤 健一",
    farmName: "佐藤果樹園",
    location: "長野県安曇野市",
    ageGroup: "50代",
    tokenBalance: 15,
    equipmentList: ["高所作業車", "草刈機"],
  },
];

const DEMO_JOBS = [
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
  },
];

const DEMO_APPLICATIONS = [
  {
    id: "app-1",
    jobId: "job-1",
    applicantId: "demo-user-1",
    applicantName: "田中 太郎",
    isAgreedToRules: true,
    status: "approved",
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: "txn-1",
    fromUserId: "demo-user-2",
    fromUserName: "山田 花子",
    toUserId: "demo-user-1",
    toUserName: "田中 太郎",
    jobId: "job-prev-1",
    amount: 3,
    description: "収穫作業の手伝い",
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
  },
];

const DEMO_AVAILABILITIES = [
  {
    id: "avail-1",
    userId: "demo-user-1",
    dayOfWeek: "水",
    startTime: "08:00",
    endTime: "12:00",
    note: "午前中なら対応可能",
    isActive: true,
  },
  {
    id: "avail-2",
    userId: "demo-user-1",
    dayOfWeek: "土",
    startTime: "09:00",
    endTime: "17:00",
    note: "土曜は終日OK",
    isActive: true,
  },
  {
    id: "avail-3",
    userId: "demo-user-2",
    dayOfWeek: "火",
    startTime: "13:00",
    endTime: "17:00",
    note: "午後から手伝えます",
    isActive: true,
  },
  {
    id: "avail-4",
    userId: "demo-user-3",
    dayOfWeek: "水",
    startTime: "09:00",
    endTime: "15:00",
    note: "高所作業車持ち込み可",
    isActive: true,
  },
];

export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Firestoreへのデータ追加を開始します...");
    try {
      const uidMap: Record<string, string> = {};

      setStatus("1. 認証アカウントとユーザーデータを作成中...");
      const userEmails = ["tanaka@yui.local", "yamada@yui.local", "sato@yui.local"];
      for (let i = 0; i < DEMO_USERS.length; i++) {
        const u = DEMO_USERS[i];
        const email = userEmails[i];
        try {
          // Firebase Authでアカウント作成
          const cred = await createUserWithEmailAndPassword(auth, email, "password123");
          uidMap[u.uid] = cred.user.uid;
          
          // Firestoreにユーザー作成
          await setDoc(doc(db, "users", cred.user.uid), {
            ...u,
            uid: cred.user.uid,
            createdAt: new Date(),
          });
        } catch (e: any) {
          // メールアドレスが既に存在する場合はエラーになるためスキップ
          if (e.code === "auth/email-already-in-use") {
            setStatus(`エラー: ${email} は既に登録されています。空のデータベースでお試しください。`);
            setLoading(false);
            return;
          }
          throw e; // その他のエラー
        }
      }

      setStatus("2. 募集データを作成中...");
      for (const j of DEMO_JOBS) {
        const newCreatorId = uidMap[j.creatorId];
        await setDoc(doc(db, "jobs", j.id), {
          ...j,
          creatorId: newCreatorId,
          createdAt: new Date(),
        });
      }

      setStatus("3. 応募データを作成中...");
      for (const a of DEMO_APPLICATIONS) {
        const newApplicantId = uidMap[a.applicantId];
        await setDoc(doc(db, "applications", a.id), {
          ...a,
          applicantId: newApplicantId,
          createdAt: new Date(),
        });
      }

      setStatus("4. やりとり履歴（トランザクション）を作成中...");
      for (const t of DEMO_TRANSACTIONS) {
        const newFrom = uidMap[t.fromUserId];
        const newTo = uidMap[t.toUserId];
        await setDoc(doc(db, "transactions", t.id), {
          ...t,
          fromUserId: newFrom,
          toUserId: newTo,
          createdAt: new Date(),
        });
      }

      setStatus("5. スキマ時間を作成中...");
      for (const av of DEMO_AVAILABILITIES) {
        const newUserId = uidMap[av.userId];
        await setDoc(doc(db, "availabilities", av.id), {
          ...av,
          userId: newUserId,
          createdAt: new Date(),
        });
      }

      // 作成が終わったらログアウト状態に戻す
      await signOut(auth);

      setStatus(`✅ 完了しました！以下のテストアカウントでログインしてください。
田中のメール：tanaka@yui.local
山田のメール：yamada@yui.local
佐藤のメール：sato@yui.local
※パスワードは全員「password123」です`);
    } catch (e: any) {
      console.error(e);
      setStatus("エラーが発生しました: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-yui-earth-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-yui-green-100 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-yui-green-800 mb-2">テストデータの流し込み</h1>
        <p className="text-yui-earth-600 mb-6 text-sm">
          このボタンを押すと、空のFirebaseデータベースにデモデータ（田中さん、山田さん、募集データなど）を一括作成します。<br/>
          <strong>※データベースが空の状態で1回だけ実行してください。</strong>
        </p>
        
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full py-4 bg-yui-green-600 text-white font-bold rounded-xl hover:bg-yui-green-700 disabled:opacity-50 transition-colors mb-4"
        >
          {loading ? "データ作成中..." : "データを流し込む"}
        </button>

        {status && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-gray-700">
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
