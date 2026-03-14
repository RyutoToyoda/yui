"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import HelpAdvisor from "@/components/HelpAdvisor";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isAdminPath = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!isLoading && !isLoggedIn && pathname !== "/login" && !isAdminPath) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, pathname, router, isAdminPath]);

  // 初回ログイン時にオンボーディングを表示
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      const seen = localStorage.getItem("yui-onboarding-seen");
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, [isLoggedIn, isLoading]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("yui-onboarding-seen", "true");
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yui-earth-50" role="status" aria-label="読み込み中">
        <div className="text-center">
          <div className="text-5xl font-bold text-yui-green-700 mb-2">結</div>
          <p className="text-yui-green-600 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && pathname !== "/login" && !isAdminPath) {
    return null;
  }

  if (pathname === "/login" || isAdminPath) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-yui-earth-50">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Header />
      <HelpAdvisor />
      <main id="main-content" className="max-w-[430px] mx-auto pb-24" role="main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <LayoutInner>{children}</LayoutInner>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
