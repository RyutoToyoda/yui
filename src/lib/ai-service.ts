/**
 * Gemini API を使用した「お悩み相談役」の AI サービス
 */

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `あなたは農家のためのタイムバンクアプリ「結（ゆい）」の「お悩み相談役」です。
利用者の多くは高齢の農家さんです。以下のルールを厳守して回答してください：
1. 太字（**）や記号（*）などのマークダウン形式は絶対に送らないでください。すべて普通の文字だけで書いてください。
2. 親しみやすく、丁寧な日本語（敬語）で話してください。
3. 専門用語は一切使わず、「ポイント」や「やり取り」など、農家さんに馴染みのある言葉を使ってください。
4. 回答は簡潔に、重要なポイントを外さずに伝えてください。
5. 改行を適度に入れて、読みやすくしてください。`;

export async function getBotResponse(query: string): Promise<string> {
  if (!API_KEY) {
    return "APIキーが設定されていません。.env.local を確認してください。";
  }

  // 1. まず利用可能なモデルの一覧を取得してみる（診断用）
  try {
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const listResponse = await fetch(listModelsUrl);
    const listData = await listResponse.json();
    
    if (!listResponse.ok) {
        return `APIキーの認証に失敗しました。ステータス: ${listResponse.status}\nエラー詳細: ${JSON.stringify(listData)}`;
    }

    const availableModels = listData.models || [];
    if (availableModels.length === 0) {
        return "このAPIキーで利用可能なGeminiモデルが見つかりませんでした。APIが有効化されているか確認してください。";
    }

    // 2. 利用可能なモデルの中から、'generateContent' をサポートしているものを探す
    const targetModel = availableModels.find((m: any) => 
        m.supportedGenerationMethods.includes('generateContent') && 
        (m.name.includes('flash') || m.name.includes('pro'))
    );

    if (!targetModel) {
        const modelNames = availableModels.map((m: any) => m.name.replace('models/', '')).join(', ');
        return `利用可能なモデルが見つかりましたが、このアプリで使える形式ではありませんでした。\n見つかったモデル: ${modelNames}`;
    }

    // 3. 実行
    const modelId = targetModel.name; // これは 'models/gemini-1.5-flash' のような形式
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n質問: ${query}` }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "回答が得られませんでした。";
    } else {
      const errorDetail = await response.text();
      return `モデル ${modelId} でエラーが発生しました (${response.status}):\n${errorDetail}`;
    }
  } catch (e: any) {
    return `接続エラーが発生しました: ${e.message}`;
  }
}
