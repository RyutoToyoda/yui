"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn && pathname !== "/login") {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yui-earth-50">
        <div className="text-center">
          <div className="text-5xl font-bold text-yui-green-700 mb-2">結</div>
          <p className="text-yui-green-600 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && pathname !== "/login") {
    return null;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-yui-earth-50">
      <Header />
      <main className="max-w-[430px] mx-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutInner>{children}</LayoutInner>
    </AuthProvider>
  );
}
