"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { href: "/", icon: UserCircle, label: "マイページ", key: "mypage" },
  { href: "/create", icon: Megaphone, label: "募集" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  return (
    <nav
      className="fixed md:hidden bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-yui-green-200/60 shadow-[0_-2px_16px_rgba(20,58,28,0.08)]"
      aria-label="メインメニュー"
      role="navigation"
    >
      <div className="max-w-screen-sm mx-auto flex">
        {tabs.map((tab) => {
          const isMyPagePath =
            pathname === "/" ||
            pathname.startsWith("/profile") ||
            pathname.startsWith("/schedule") ||
            pathname.startsWith("/settings") ||
            pathname.startsWith("/notifications") ||
            pathname.startsWith("/wallet");
          const isActive = tab.key === "mypage" ? isMyPagePath : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-3 no-underline transition-all ${
                isActive
                  ? "text-yui-green-700"
                  : "text-yui-earth-500 hover:text-yui-green-500"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              style={{ minHeight: "64px" }}
            >
              <div className="relative" style={{ minWidth: "52px", minHeight: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isActive && (
                  <div className="absolute -inset-1.5 bg-yui-green-100/80 rounded-xl" />
                )}
                <Icon
                  className={`w-7 h-7 relative z-10 ${isActive ? "stroke-[2.5]" : ""}`}
                  aria-hidden="true"
                />
              </div>
              <span className={`text-sm mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area bottom padding for iPhones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
