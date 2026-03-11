"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/firestore";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { fsGetUser, fsCreateUser, fsUpdateUser } from "@/lib/firestore-service";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  register: (email: string, password: string, name: string, farmName: string, location: string, ageGroup: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Auth の状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
      setIsLoading(false);
    });
    return () => unsubscribe();
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
        createdAt: new Date(),
      };

      await fsCreateUser(newUser);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      const cred = await signInAnonymously(auth);
      
      // ゲストログイン時、ユーザーが存在しない場合は作成する
      let profile = await fsGetUser(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          name: "ゲスト農家",
          farmName: "おためし農園",
          location: "長野県",
          ageGroup: "30代",
          tokenBalance: 10,
          equipmentList: [],
          createdAt: new Date(),
        };
        await fsCreateUser(profile);
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

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, loginAsGuest, register, logout, refreshUser }}>
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
