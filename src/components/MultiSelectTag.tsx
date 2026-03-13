"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, ChevronDown } from "lucide-react";

interface MultiSelectTagProps {
  /** 現在選択されている項目のリスト */
  selectedItems: string[];
  /** プリセットの選択肢リスト */
  presetOptions: string[];
  /** 自由入力を許可するか（デフォルト: true） */
  allowFreeInput?: boolean;
  /** 自由入力時のプレースホルダー */
  placeholder?: string;
  /** アイテムが追加された時のコールバック */
  onAdd: (item: string) => void;
  /** アイテムが削除された時のコールバック */
  onRemove: (index: number) => void;
  /** セクションのラベル（アクセシビリティ用） */
  label?: string;
}

export default function MultiSelectTag({
  selectedItems,
  presetOptions,
  allowFreeInput = true,
  placeholder = "自由入力で追加...",
  onAdd,
  onRemove,
  label = "項目",
}: MultiSelectTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [freeInput, setFreeInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // プリセットの中で未選択のもの
  const availableOptions = presetOptions.filter(
    (opt) => !selectedItems.includes(opt)
  );

  const handleAddPreset = (item: string) => {
    if (!selectedItems.includes(item)) {
      onAdd(item);
    }
  };

  const handleAddFreeInput = () => {
    const trimmed = freeInput.trim();
    if (!trimmed) return;
    if (selectedItems.includes(trimmed)) return;
    onAdd(trimmed);
    setFreeInput("");
  };

  return (
    <div className="space-y-3">
      {/* 選択済みタグ一覧 */}
      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="list" aria-label={`選択済みの${label}`}>
          {selectedItems.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 bg-yui-green-100 text-yui-green-800 px-3 py-1.5 rounded-full text-sm font-bold border border-yui-green-200 transition-colors"
              role="listitem"
            >
              {item}
              <button
                onClick={() => onRemove(i)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-yui-green-600 hover:bg-yui-green-200 hover:text-red-600 transition-colors"
                aria-label={`${item}を削除`}
                type="button"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-yui-earth-400 font-medium py-1">
          まだ登録されていません
        </p>
      )}

      {/* 追加ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 text-sm font-bold text-yui-green-600 hover:text-yui-green-800 transition-colors"
        style={{ minHeight: "40px" }}
        type="button"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Plus className="w-4 h-4" aria-hidden="true" />
        )}
        {isOpen ? "閉じる" : `${label}を追加する`}
      </button>

      {/* 追加パネル */}
      {isOpen && (
        <div className="bg-yui-green-50/50 p-4 rounded-xl border border-yui-green-100 space-y-4 animate-in fade-in duration-200">
          {/* プリセット選択肢 */}
          {availableOptions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">
                よく使われる{label}からえらぶ
              </p>
              <div className="flex flex-wrap gap-2">
                {availableOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAddPreset(opt)}
                    className="px-3 py-1.5 bg-white border border-yui-green-200 text-sm font-bold text-yui-green-700 rounded-lg hover:bg-yui-green-100 hover:border-yui-green-300 transition-colors"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 自由入力 */}
          {allowFreeInput && (
            <div>
              <p className="text-xs font-bold text-yui-green-800 mb-2">
                その他（自由入力）
              </p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={freeInput}
                  onChange={(e) => setFreeInput(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-4 py-3 text-base border-2 border-yui-green-200 rounded-xl focus:border-yui-green-500 focus:outline-none bg-white"
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFreeInput();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFreeInput}
                  disabled={!freeInput.trim()}
                  className="px-5 py-3 bg-yui-green-600 text-white text-base font-bold rounded-xl hover:bg-yui-green-700 transition-colors shrink-0 disabled:opacity-50 disabled:bg-yui-earth-300"
                  style={{ minHeight: "48px" }}
                >
                  追加
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
