"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, CalendarDays, Search, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import HelpAdvisor from "@/components/HelpAdvisor";

const tabs = [
  { href: "/schedule", icon: CalendarDays, label: "予定" },
  { href: "/create", icon: Megaphone, label: "募集" },
  { href: "/explore", icon: Search, label: "探す" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [showAiChat, setShowAiChat] = useState(false);

  if (!isLoggedIn) return null;

  return (
    <>
      <nav
        className="fixed md:hidden bottom-0 left-0 right-0 z-50 overflow-x-clip"
        aria-label="メインメニュー"
        role="navigation"
      >
        {/* AI Chat circle — positioned so -45° point sits at bottom-right corner */}
        <button
          onClick={() => setShowAiChat(true)}
          className="absolute z-10 rounded-full bg-yui-green-600 hover:bg-yui-green-500 transition-all active:scale-95 border-none cursor-pointer"
          style={{
            width: "160px",
            height: "160px",
            right: "-52px",
            bottom: "-54px",
            boxShadow: "0 -4px 20px rgba(23,126,52,0.3)",
          }}
          aria-label="AI 相談を開く"
        >
          {/* Icon and text in the visible upper-left portion */}
          <div className="absolute flex flex-col items-center" style={{ top: "32px", left: "40px" }}>
            <Bot className="w-7 h-7 text-white" aria-hidden="true" />
            <span className="mt-1 text-xs font-medium text-white whitespace-nowrap">
              AI 相談
            </span>
          </div>
        </button>

        {/* Main bar */}
        <div className="relative bg-white/95 backdrop-blur-xl border-t-2 border-yui-green-200/60 shadow-[0_-2px_16px_rgba(20,58,28,0.08)]">
          <div className="max-w-screen-sm mx-auto flex">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 flex flex-col items-center py-3 no-underline transition-all ${isActive
                    ? "text-yui-green-700"
                    : "text-yui-earth-500 hover:text-yui-green-500"
                    }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={tab.label}
                  style={{ minHeight: "64px" }}
                >
                  <div className="relative" style={{ minWidth: "52px", minHeight: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isActive && (
                      <div className="absolute -inset-1 bg-yui-green-100/80 rounded-xl" />
                    )}
                    <Icon
                      className={`w-[26px] h-[26px] relative z-10 ${isActive ? "stroke-[2.5]" : ""}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* Blank spacer for the AI circle area */}
            <div className="flex-[1.2]" style={{ minHeight: "64px" }} />
          </div>
          {/* Safe area bottom padding for iPhones */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      {/* AI Support Modal — same as 困ったときのAIサポート in settings */}
      <HelpAdvisor
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        showFloatingButton={false}
      />
    </>
  );
}
