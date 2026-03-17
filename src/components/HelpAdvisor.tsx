"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Mic, Volume2, VolumeX, Send, Info } from "lucide-react";
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
          aria-label="おたすけAIを開く"
        >
          <div className="bg-yui-green-600 text-white p-4 rounded-full shadow-2xl shadow-yui-green-900/40 group-hover:bg-yui-green-700 transition-all transform group-hover:scale-110 border-4 border-white">
            <MessageCircle className="w-8 h-8" />
          </div>
          <span className="bg-white px-3 py-1 rounded-full text-sm font-black text-yui-green-800 shadow-md border border-yui-green-100">
            相談する
          </span>
        </button>
      )}

      {/* 相談画面 (オーバーレイ) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-yui-earth-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* ヘッダー */}
          <header className="bg-yui-green-700 text-white p-5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">おたすけAI</h2>
                <p className="text-white/80 text-sm font-bold">アプリの使い方を教えます</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="閉じる"
              style={{ minHeight: "56px", minWidth: "56px" }}
            >
              <X className="w-8 h-8" />
            </button>
          </header>

          {/* メッセージ表示エリア */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-white to-yui-earth-50"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl p-5 shadow-sm relative ${
                    msg.sender === "user"
                      ? "bg-yui-green-600 text-white rounded-tr-none text-lg font-bold"
                      : "bg-white text-yui-earth-900 border border-yui-earth-100 rounded-tl-none text-xl font-black leading-relaxed"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`text-[10px] mt-2 opacity-60 ${
                      msg.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  
                  {msg.sender === "bot" && (
                    <button
                      onClick={() => speak(msg.text)}
                      className="absolute -right-12 top-0 p-3 bg-white border border-yui-earth-100 rounded-full shadow-sm text-yui-green-600 hover:bg-yui-green-50 transition-colors"
                      aria-label="音声を再生"
                    >
                      {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  )}
                </div>
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
          <footer className="bg-white border-t border-yui-earth-200 p-6 pb-10 space-y-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {/* 音声入力ボタン (最大級) */}
            <div className="flex justify-center">
              <button
                onClick={toggleListen}
                className={`flex flex-col items-center gap-3 p-6 rounded-full transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 scale-110 shadow-lg shadow-red-200 animate-pulse"
                    : "bg-yui-green-100 text-yui-green-700 hover:bg-yui-green-200"
                }`}
                aria-label={isListening ? "聞き取りを停止" : "声で相談する"}
              >
                <div className={`p-6 rounded-full ${isListening ? "bg-white text-red-500" : "bg-yui-green-600 text-white"}`}>
                  <Mic className={`w-12 h-12 ${isListening ? "scale-125" : ""}`} />
                </div>
                <span className="text-xl font-black">
                  {isListening ? "お話しください..." : "声で相談する"}
                </span>
              </button>
            </div>

            {/* テキスト入力エリア (バックアップ用) */}
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend(inputText)}
                placeholder="文字で入力もできます"
                className="flex-1 bg-yui-earth-50 border-2 border-yui-earth-200 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-yui-green-500 font-bold"
              />
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim()}
                className="bg-yui-green-600 text-white p-4 rounded-2xl disabled:opacity-30 disabled:grayscale transition-all"
                aria-label="送信"
              >
                <Send className="w-8 h-8" />
              </button>
            </div>
            
            <p className="text-center text-yui-earth-400 text-sm font-bold">
              ※音声で話しかけるのが一番かんたんです
            </p>
          </footer>
        </div>
      )}
    </>
  );
}
