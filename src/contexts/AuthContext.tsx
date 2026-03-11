"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/firestore";
import { demoGetCurrentUser, demoSetCurrentUser, demoGetUser, demoCreateUser, demoUpdateUser } from "@/lib/demo-data";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, farmName: string, location: string, ageGroup: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // デモモード: localStorageからログイン状態を復元
    const savedUid = localStorage.getItem("yui-demo-uid");
    if (savedUid) {
      const u = demoGetUser(savedUid);
      if (u) {
        demoSetCurrentUser(savedUid);
        setUser(u);
      }
    }
    setIsLoading(false);
  }, []);

  const refreshUser = () => {
    const u = demoGetCurrentUser();
    setUser({ ...u });
  };

  const login = async (email: string, _password: string): Promise<boolean> => {
    // デモモード: メールアドレスからデモユーザーを特定
    // tanaka@demo.com → demo-user-1, yamada@demo.com → demo-user-2, sato@demo.com → demo-user-3
    let uid = "demo-user-1";
    if (email.includes("yamada")) uid = "demo-user-2";
    else if (email.includes("sato")) uid = "demo-user-3";

    const u = demoGetUser(uid);
    if (u) {
      demoSetCurrentUser(uid);
      localStorage.setItem("yui-demo-uid", uid);
      setUser(u);
      return true;
    }
    return false;
  };

  const register = async (name: string, farmName: string, location: string, ageGroup: string): Promise<boolean> => {
    const uid = `user-${Date.now()}`;
    const newUser: User = {
      uid,
      name,
      farmName,
      location,
      ageGroup,
      tokenBalance: 10,
      equipmentList: [],
      createdAt: new Date(),
    };
    demoCreateUser(newUser);
    demoSetCurrentUser(uid);
    localStorage.setItem("yui-demo-uid", uid);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("yui-demo-uid");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout, refreshUser }}>
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
