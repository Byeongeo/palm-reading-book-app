import { ANALYSIS_JSON_PROMPT, PALM_INFOGRAPHIC_PROMPT } from "./prompts";
import type { PalmAnalysis } from "./types";
import { splitDataUrl } from "./image";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function analyzeWithGemini(imageDataUrl: string): Promise<PalmAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  const { mimeType, base64 } = splitDataUrl(imageDataUrl);
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash";

  const payload = await callGemini(model, apiKey, {
    contents: [
      {
        parts: [
          { text: ANALYSIS_JSON_PROMPT },
          { inlineData: { mimeType, data: base64 } }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const text = payload.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text;
  if (!text) throw new Error("Gemini 분석 응답을 읽을 수 없습니다.");
  return JSON.parse(text) as PalmAnalysis;
}

export async function generateGeminiInfographic(imageDataUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  const { mimeType, base64 } = splitDataUrl(imageDataUrl);
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-pro-image";

  const payload = await callGemini(model, apiKey, {
    contents: [
      {
        parts: [
          { text: PALM_INFOGRAPHIC_PROMPT },
          { inlineData: { mimeType, data: base64 } }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  });

  const parts = payload.candidates?.[0]?.content?.parts || [];
  const image = parts.find((part: any) => part.inlineData?.data);
  if (!image) throw new Error("Gemini 이미지 응답을 읽을 수 없습니다.");
  const outputMime = image.inlineData.mimeType || "image/png";
  return `data:${outputMime};base64,${image.inlineData.data}`;
}

async function callGemini(model: string, apiKey: string, body: unknown) {
  const response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini 요청에 실패했습니다.");
  }
  return payload;
}
