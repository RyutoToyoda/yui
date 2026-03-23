"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/firestore";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { fsGetUser, fsCreateUserIfAbsent, fsCreateWelcomeNotification, fsUpdateUser } from "@/lib/firestore-service";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  register: (email: string, password: string, name: string, farmName: string, location: string, ageGroup: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
  markTutorialAsSeen: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const GUEST_EMAIL = process.env.NEXT_PUBLIC_GUEST_EMAIL ?? "guest@yui.local";
const GUEST_PASSWORD = process.env.NEXT_PUBLIC_GUEST_PASSWORD ?? "guest-pass-2026";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Auth の状態を監視
  useEffect(() => {
    // Timeout fallback: if auth doesn't initialize within 5 seconds, stop loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Firestore からユーザープロフィールを取得
          const profile = await fsGetUser(firebaseUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            // Auth にはいるが Firestore にはない場合（エッジケース）
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const profile = await fsGetUser(auth.currentUser.uid);
      if (profile) setUser({ ...profile });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const cred: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fsGetUser(cred.user.uid);
      if (profile) {
        setUser(profile);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    farmName: string,
    location: string,
    ageGroup: string
  ): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const newUser: User = {
        uid: cred.user.uid,
        name,
        farmName,
        location,
        ageGroup,
        tokenBalance: 10,
        equipmentList: [],
        crops: [],
        status: 'active',
        createdAt: new Date(),
      };

      const isCreated = await fsCreateUserIfAbsent(newUser);
      if (isCreated) {
        // 新規作成時のみウェルカム通知を発行
        await fsCreateWelcomeNotification(cred.user.uid);
      }

      const savedProfile = await fsGetUser(cred.user.uid);
      setUser(savedProfile ?? newUser);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      let cred: UserCredential;

      try {
        cred = await signInWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
      } catch {
        // ゲストアカウントが未作成なら初回のみ作成
        try {
          cred = await createUserWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
        } catch (createError: any) {
          if (createError?.code === "auth/email-already-in-use") {
            cred = await signInWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
          } else {
            throw createError;
          }
        }
      }

      const guestProfile: User = {
        uid: cred.user.uid,
        name: "ゲスト農家",
        farmName: "おためし農園",
        location: "長野県",
        ageGroup: "30代",
        tokenBalance: 10,
        equipmentList: [],
        crops: [],
        status: 'active',
        createdAt: new Date(),
      };

      const isCreated = await fsCreateUserIfAbsent(guestProfile);
      if (isCreated) {
        await fsCreateWelcomeNotification(cred.user.uid);
      }

      const profile = await fsGetUser(cred.user.uid);
      if (!profile) {
        setUser(guestProfile);
        return true;
      }

      setUser(profile);
      return true;
    } catch (error) {
      console.error("Guest login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const markTutorialAsSeen = async () => {
    if (!user) return;
    try {
      await fsUpdateUser(user.uid, { hasSeenTutorial: true });
      setUser({ ...user, hasSeenTutorial: true });
    } catch (error) {
      console.error("Failed to mark tutorial as seen:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, loginAsGuest, register, logout, refreshUser, markTutorialAsSeen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
