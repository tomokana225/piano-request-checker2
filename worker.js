// Cloudflare Worker - CORS対応 最終版コード
export default {
  async fetch(request, env, ctx) {
    // どのウェブサイトからでも通信を許可するための「許可証」ヘッダー
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*', // すべてのオリジン（Webサイト）を許可
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // 許可する通信方法
      'Access-Control-Allow-Headers': 'Content-Type', // 許可する情報ヘッダー
    });

    // ブラウザは、本番の通信の前に「通信してもいい？」という事前の問い合わせ(OPTIONS)をします。
    // これに正しく応答することが非常に重要です。
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // 実際のAPI呼び出しはPOSTリクエストのみを許可します。
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers });
    }

    try {
      const { query } = await request.json();
      if (!query) {
        return new Response('Query is required', { status: 400, headers });
      }

      const prompt = `ヤマハの「プリント楽譜」ウェブサイト (www.print-gakufu.com) の情報を検索し、検索クエリ「${query}」に関連する楽曲が**アプリ見放題プラン**の対象か調べてください。回答は以下の形式で厳密に従ってください。1. **判定結果:** 最初の行に、判定結果を「【対象】」「【対象外】」「【不明】」のいずれかで必ず記述してください。2. **サマリー:** 次の行に、判定結果の簡単な理由を記述してください。3. **関連楽曲リスト:** アーティストの対象曲を、見つかったものだけでいいので、曲名の前に必ず「♫」をつけて箇条書きでリストアップしてください。`;
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const responseBody = {
        text: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '',
        sources: geminiData.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      };
      
      // 最終的な応答にも、必ず許可証ヘッダーを含めます。
      return new Response(JSON.stringify(responseBody), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error("Worker Error:", error);
      return new Response(error.toString(), { status: 500, headers });
    }
  },
};
