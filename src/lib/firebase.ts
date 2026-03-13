// Firebase初期化モジュール
// 実際のFirebaseプロジェクト設定は .env.local に記載してください
// デモモードでは Firebase を使わずにローカルのモックデータで動作します

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "undefined" &&
  !!firebaseConfig.projectId;

let app;
if (typeof window !== "undefined" || isConfigValid) {
  // クライアント側、または設定が揃っている場合は本物を使用
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
  // サーバーサイド・ビルド時かつ設定不足時は、エラーを出さない最小限のモック設定
  const mockConfig = {
    apiKey: "AIza-dummy-key-for-build-only", // AIzaから始めないとFirebaseがエラーを出す場合がある
    authDomain: "dummy.firebaseapp.com",
    projectId: "yui-app-dummy",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "000000000",
    appId: "1:000000000:web:dummy"
  };
  app = getApps().length === 0 ? initializeApp(mockConfig) : getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
