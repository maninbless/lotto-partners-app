import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

// API 키는 Netlify 환경 변수에서 안전하게 가져옵니다.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

export const handler: Handler = async (event: HandlerEvent) => {
  try {
    // 요청 본문이 없는 경우를 처리합니다.
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is missing" }),
      };
    }

    // 프론트엔드에서 보낸 요청 본문을 파싱합니다.
    const { contents, config } = JSON.parse(event.body);

    if (!contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing "contents" in request body' }),
      };
    }

    // Google GenAI API를 호출합니다.
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    // 성공적인 응답을 프론트엔드로 반환합니다.
    // The frontend expects an object with a `text` property. We must explicitly create it.
    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text }),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    // 에러 발생 시 500 상태 코드와 에러 메시지를 반환합니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
