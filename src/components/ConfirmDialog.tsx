"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "やめる",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // フォーカストラップ & 開いた時にキャンセルボタンにフォーカス
  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [isOpen]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* ダイアログ本体 */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-xl max-w-[360px] w-full p-6 space-y-5"
      >
        {/* 閉じるボタン */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-yui-earth-400 hover:bg-yui-earth-100 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* アイコン & タイトル */}
        <div className="text-center pt-2">
          {variant === "danger" && (
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7 text-yui-danger" />
            </div>
          )}
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-yui-green-800">
            {title}
          </h2>
        </div>

        {/* メッセージ */}
        <p id="confirm-dialog-message" className="text-sm text-yui-earth-600 text-center leading-relaxed">
          {message}
        </p>

        {/* ボタン */}
        <div className="space-y-2.5">
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`w-full py-4 text-base font-bold rounded-2xl transition-colors ${
              variant === "danger"
                ? "bg-yui-danger text-white hover:bg-red-700 active:bg-red-800"
                : "gradient-primary text-white hover:opacity-90"
            }`}
            style={{ minHeight: "52px" }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 text-base font-bold rounded-2xl border-2 border-yui-earth-200 text-yui-earth-600 hover:bg-yui-earth-50 transition-colors"
            style={{ minHeight: "52px" }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
