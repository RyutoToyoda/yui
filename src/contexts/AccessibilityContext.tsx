"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  // 初回読み込み: localStorageから設定を復元
  useEffect(() => {
    const savedSize = localStorage.getItem("yui-font-size") as FontSize | null;
    const savedContrast = localStorage.getItem("yui-high-contrast");

    if (savedSize && ["standard", "large", "xlarge"].includes(savedSize)) {
      setFontSizeState(savedSize);
      document.documentElement.setAttribute("data-font-size", savedSize);
    }

    if (savedContrast === "true") {
      setHighContrastState(true);
      document.documentElement.classList.add("ud-high-contrast");
    }
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("yui-font-size", size);
    if (size === "standard") {
      document.documentElement.removeAttribute("data-font-size");
    } else {
      document.documentElement.setAttribute("data-font-size", size);
    }
  };

  const setHighContrast = (on: boolean) => {
    setHighContrastState(on);
    localStorage.setItem("yui-high-contrast", String(on));
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
