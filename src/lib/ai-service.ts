/**
 * Gemini API を使用した「お悩み相談役」の AI サービス
 * 使用モデル: gemini-2.5-flash（テスト済み・動作確認済み）
 */

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const MODEL = "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `あなたは農家のためのタイムバンクアプリ「結（ゆい）」の「お悩み相談役」です。
利用者の多くは高齢の農家さんです。以下のルールを厳守して回答してください：
1. 太字（**）や記号（*）などのマークダウン形式は絶対に送らないでください。すべて普通の文字だけで書いてください。
2. 親しみやすく、丁寧な日本語（敬語）で話してください。
3. 専門用語は一切使わず、「ポイント」や「やり取り」など、農家さんに馴染みのある言葉を使ってください。
4. 回答は簡潔に、重要なポイントを外さずに伝えてください。
5. 改行を適度に入れて、読みやすくしてください。`;

export async function getBotResponse(query: string): Promise<string> {
  if (!API_KEY) {
    return "AIキーが設定されていません。管理者にお問い合わせください。";
  }

  try {
    const generateUrl = `${API_BASE}/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n質問: ${query}` }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return "申し訳ございません。回答を生成できませんでした。もう一度お試しください。";
      }
      return text;
    } else {
      const errorData = await response.json().catch(() => null);
      const status = response.status;

      if (status === 429) {
        return "只今アクセスが集中しております。少し時間をおいてからもう一度お試しください。";
      }
      if (status === 403) {
        return "AI機能の設定に問題があります。管理者にお問い合わせください。";
      }

      console.error("Gemini API error:", status, errorData);
      return "申し訳ございません。エラーが発生しました。しばらくしてからもう一度お試しください。";
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Gemini API connection error:", message);
    return "通信エラーが発生しました。インターネット接続をご確認ください。";
  }
}
