import { YamahaCheckResult, YamahaAPIResponse, GroundingSource } from '../types.ts';

// IMPORTANT: Replace this with your actual Cloudflare Worker URL
const WORKER_URL = 'https://piano-request-proxy.tomoyaking0225.workers.dev';

// A simple utility to parse the text response from the API
const parseGeminiResponse = (rawText: string, sources: GroundingSource[]): YamahaAPIResponse => {
    const lines = rawText.trim().split('\n');
    let result: YamahaCheckResult = YamahaCheckResult.Unknown;
    let details = rawText;

    if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.includes('【対象】')) {
            result = YamahaCheckResult.Available;
            details = lines.slice(1).join('\n').trim();
        } else if (firstLine.includes('【対象外】')) {
            result = YamahaCheckResult.NotAvailable;
            details = lines.slice(1).join('\n').trim();
        } else if (firstLine.includes('【不明】')) {
            result = YamahaCheckResult.Unknown;
            details = lines.slice(1).join('\n').trim();
        }
    }
    return { result, details, sources };
};


export const checkPrintGakufu = async (query: string): Promise<YamahaAPIResponse> => {
  if (!WORKER_URL || WORKER_URL.includes('your-worker-name')) {
      console.error("Cloudflare Worker URL is not configured.");
      throw new Error("バックエンドが設定されていません。services/geminiService.ts の WORKER_URL を設定してください。");
  }

  try {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Error from worker:", errorData);
        throw new Error(`サーバーからの応答エラー: ${response.status}`);
    }

    const data = await response.json();
    
    // The worker now returns a structured response that we can parse
    return parseGeminiResponse(data.text, data.sources || []);

  } catch (error) {
    console.error("Error calling worker or parsing response:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("APIのリクエストが上限に達しました。時間をおいてから再度お試しください。");
    }

    throw new Error("バックエンドとの通信または応答の解析中にエラーが発生しました。");
  }
};