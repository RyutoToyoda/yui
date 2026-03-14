"use client";

import { useState, useCallback, useRef } from "react";

/**
 * 音声入出力（Web Speech API）を制御するカスタムフック
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 音声読み上げ (Text-to-Speech)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // 前の読み上げを停止
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // 音声認識 (Speech-to-Text)
  const startListening = useCallback((onResult: (result: string) => void) => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声認識に対応していません。別のブラウザでお試しください。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      // 読み上げ中なら止める
      window.speechSynthesis.cancel();
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      onResult(result);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const cancelAll = useCallback(() => {
    stopListening();
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, [stopListening]);

  return {
    isListening,
    isSpeaking,
    speak,
    startListening,
    stopListening,
    cancelAll,
  };
}
