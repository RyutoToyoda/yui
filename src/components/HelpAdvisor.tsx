"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Mic, Volume2, Send, Info } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { getBotResponse } from "@/lib/ai-service";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface HelpAdvisorProps {
  isOpen?: boolean;
  onClose?: () => void;
  showFloatingButton?: boolean;
}

export default function HelpAdvisor({ isOpen: externalIsOpen, onClose, showFloatingButton = true }: HelpAdvisorProps) {
  const [isOpen, setIsOpen] = useState(externalIsOpen ?? false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "こんにちは！「結（ゆい）」の使い方について、何でも相談してくださいね。",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { isListening, isSpeaking, speak, startListening, stopListening, cancelAll } = useVoice();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 外部から制御される場合は externalIsOpen を追跡
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // メッセージが増えたら一番下までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // モーダルが閉じたら全ての音声を止める
  useEffect(() => {
    if (!isOpen) {
      cancelAll();
    }
  }, [isOpen, cancelAll]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await getBotResponse(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      
      // 自動読み上げは停止（ユーザーの希望によりボタン式に変更）
      // speak(response);
    } catch (error) {
      console.error("Failed to get bot response:", error);
      setIsTyping(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((result) => {
        handleSend(result);
      });
    }
  };

  return (
    <>
      {/* 起動ボタン (フローティング) */}
      {!isOpen && showFloatingButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-1 group"
          aria-label="AI相談を開く"
        >
          <div className="bg-yui-green-600 text-white p-5 rounded-full shadow-2xl shadow-yui-green-900/40 group-hover:bg-yui-green-700 transition-all transform group-hover:scale-110 border-4 border-white">
            <MessageCircle className="w-20 h-20" />
          </div>
          <span className="bg-white px-5 py-2 rounded-full text-lg font-black text-yui-green-800 shadow-md border border-yui-green-100">
            AI 相談
          </span>
        </button>
      )}

      {/* 相談画面 (オーバーレイ) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col w-full max-w-full overflow-x-hidden bg-yui-earth-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* ヘッダー */}
          <header className="bg-yui-green-700 text-white h-16 md:h-24 px-4 md:px-6 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 md:p-2.5 rounded-full">
                <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-black">AI 相談</h2>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center h-12 w-12 md:h-14 md:w-14"
              aria-label="閉じる"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </header>

          {/* メッセージ表示エリア */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-6 bg-gradient-to-b from-white to-yui-earth-50"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`w-full flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" ? (
                  <div className="w-full max-w-[92%] md:max-w-[85%] flex items-start gap-2">
                    <div className="min-w-0 flex-1 bg-white text-yui-earth-900 border border-yui-earth-100 rounded-3xl rounded-tl-none p-5 text-xl font-black leading-relaxed shadow-sm break-words">
                      <p>{msg.text}</p>
                    </div>
                    <button
                      onClick={() => speak(msg.text)}
                      className="shrink-0 p-3 bg-white border border-yui-earth-100 rounded-full shadow-sm text-yui-green-600 hover:bg-yui-green-50 transition-colors"
                      aria-label="音声を再生"
                    >
                      {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <div className="max-w-[90%] md:max-w-[85%] bg-yui-green-600 text-white rounded-3xl rounded-tr-none p-5 text-lg font-bold shadow-sm break-words">
                    <p>{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-yui-earth-100 rounded-3xl rounded-tl-none p-5 flex gap-1">
                  <div className="w-2 h-2 bg-yui-green-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-yui-green-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-yui-green-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* 操作エリア */}
          <footer className="bg-white border-t border-yui-earth-200 p-4 md:p-6 pb-8 md:pb-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative mt-8">
            
            {/* 巨大なマイクボタンを中央上に配置 */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-16">
              <button
                onClick={toggleListen}
                className={`flex flex-col items-center justify-center w-32 h-32 rounded-full font-black transition-all shadow-xl border-4 border-white ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-yui-green-600 text-white hover:bg-yui-green-700 hover:scale-105"
                }`}
                aria-label={isListening ? "聞き取りを停止" : "声で入力"}
              >
                <Mic className={`w-12 h-12 mb-1 ${isListening ? "animate-pulse" : ""}`} />
                <span className="text-base">{isListening ? "聞き取り中" : "音声入力"}</span>
              </button>
            </div>

            <div className="pt-14 flex flex-col md:flex-row gap-3 w-full max-w-3xl mx-auto">
              <div className="w-full flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend(inputText)}
                  placeholder="文字で入力もできます"
                  className="w-full min-w-0 bg-yui-earth-50 border-2 border-yui-earth-200 rounded-2xl px-4 py-3.5 text-base md:text-lg focus:outline-none focus:border-yui-green-500 font-bold"
                />
                <button
                  onClick={() => handleSend(inputText)}
                  disabled={!inputText.trim()}
                  className="shrink-0 bg-yui-green-600 text-white px-5 py-3 rounded-2xl disabled:opacity-30 disabled:grayscale transition-all"
                  aria-label="送信"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
