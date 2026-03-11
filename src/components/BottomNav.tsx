"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Megaphone, CalendarDays, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/explore", icon: Search, label: "探す" },
  { href: "/create", icon: Megaphone, label: "募集" },
  { href: "/schedule", icon: CalendarDays, label: "予定" },
  { href: "/profile", icon: UserCircle, label: "マイページ" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-yui-green-100/40 shadow-[0_-1px_12px_rgba(30,63,36,0.06)]">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 pt-2.5 no-underline transition-all ${
                isActive
                  ? "text-yui-green-700"
                  : "text-yui-earth-400 hover:text-yui-green-500"
              }`}
            >
              <div className="relative">
                {isActive && (
                  <div className="absolute -inset-1.5 bg-yui-green-100/70 rounded-xl" />
                )}
                <Icon className={`w-6 h-6 relative z-10 ${isActive ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
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
