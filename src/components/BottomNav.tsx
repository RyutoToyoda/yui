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
        className="fixed md:hidden left-0 right-0 z-50 pointer-events-none"
        style={{ bottom: "0" }}
        aria-label="メインメニュー"
        role="navigation"
      >
        {/* AI Chat circle — positioned so -45° point sits at bottom-right corner */}
        <button
          onClick={() => setShowAiChat(true)}
          className="absolute z-10 rounded-full bg-yui-green-600 hover:bg-yui-green-500 transition-all active:scale-95 border-none cursor-pointer pointer-events-auto flex items-center justify-center"
          style={{
            width: "110px",
            height: "110px",
            right: "-32px",
            bottom: "-32px",
            boxShadow: "0 -4px 20px rgba(23,126,52,0.3)",
          }}
          aria-label="AI 相談を開く"
        >
          {/* Icon and text in the visible upper-left portion */}
          <div className="flex flex-col items-center" style={{ position: "absolute", top: "20px", left: "26px" }}>
            <Bot className="w-8 h-8 text-white" aria-hidden="true" />
            <span className="text-base font-medium text-white whitespace-nowrap" style={{ margin: "2px 0 0 0" }}>
              AI 相談
            </span>
          </div>
        </button>

        {/* Main bar */}
        <div className="relative bg-white/95 backdrop-blur-xl border-t-2 border-yui-green-200/60 shadow-[0_-2px_16px_rgba(20,58,28,0.08)] pointer-events-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-screen-sm mx-auto flex">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 flex flex-col items-center no-underline transition-all rounded-xl mx-1 ${isActive
                    ? "text-yui-green-700 bg-yui-green-100/80"
                    : "text-yui-earth-500 hover:text-yui-green-500"
                    }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={tab.label}
                  style={{ minHeight: "56px", padding: "2px 0 0 0" }}
                >
                  <Icon
                    className={`w-[28px] h-[28px] ${isActive ? "stroke-[2.5]" : ""}`}
                    aria-hidden="true"
                  />
                  <span className={`text-base font-bold`} style={{ margin: "0" }}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* Blank spacer for the AI circle area */}
            <div className="flex-[1.2]" style={{ minHeight: "56px" }} />
          </div>
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
