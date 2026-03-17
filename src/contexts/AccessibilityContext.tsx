"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type FontSize = "standard" | "large" | "xlarge";

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (on: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("standard");
  const [highContrast, setHighContrastState] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const getFontSizeStorageKey = (uid: string | null) => (uid ? `yui-font-size:${uid}` : "yui-font-size");
  const getContrastStorageKey = (uid: string | null) => (uid ? `yui-high-contrast:${uid}` : "yui-high-contrast");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUid(firebaseUser?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // ユーザー切替ごとに localStorage から設定を復元
  useEffect(() => {
    const savedSize = localStorage.getItem(getFontSizeStorageKey(currentUid)) as FontSize | null;
    const savedContrast = localStorage.getItem(getContrastStorageKey(currentUid));

    // まずは標準表示に戻す（設定未保存ユーザーは必ず「普通」）
    setFontSizeState("standard");
    document.documentElement.removeAttribute("data-font-size");
    setHighContrastState(false);
    document.documentElement.classList.remove("ud-high-contrast");

    if (savedSize && ["standard", "large", "xlarge"].includes(savedSize)) {
      setFontSizeState(savedSize);
      if (savedSize === "standard") {
        document.documentElement.removeAttribute("data-font-size");
      } else {
        document.documentElement.setAttribute("data-font-size", savedSize);
      }
    }

    if (savedContrast === "true") {
      setHighContrastState(true);
      document.documentElement.classList.add("ud-high-contrast");
    }
  }, [currentUid]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(getFontSizeStorageKey(currentUid), size);
    if (size === "standard") {
      document.documentElement.removeAttribute("data-font-size");
    } else {
      document.documentElement.setAttribute("data-font-size", size);
    }
  };

  const setHighContrast = (on: boolean) => {
    setHighContrastState(on);
    localStorage.setItem(getContrastStorageKey(currentUid), String(on));
    if (on) {
      document.documentElement.classList.add("ud-high-contrast");
    } else {
      document.documentElement.classList.remove("ud-high-contrast");
    }
  };

  return (
    <AccessibilityContext.Provider value={{ fontSize, setFontSize, highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
