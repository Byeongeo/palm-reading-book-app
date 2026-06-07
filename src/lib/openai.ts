import { ANALYSIS_JSON_PROMPT, PALM_INFOGRAPHIC_PROMPT } from "./prompts";
import type { PalmAnalysis } from "./types";
import { splitDataUrl } from "./image";

const OPENAI_URL = "https://api.openai.com/v1";

export async function analyzeWithOpenAI(imageDataUrl: string): Promise<PalmAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");

  const response = await fetch(`${OPENAI_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5.2",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: ANALYSIS_JSON_PROMPT },
            { type: "input_image", image_url: imageDataUrl }
          ]
        }
      ],
      text: {
        format: { type: "json_object" }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI 분석 요청에 실패했습니다.");
  return parseAnalysis(extractOpenAIText(payload));
}

export async function generateOpenAIInfographic(imageDataUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");

  const { mimeType, buffer } = splitDataUrl(imageDataUrl);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.append("prompt", PALM_INFOGRAPHIC_PROMPT);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  const imageBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  form.append("image", new Blob([imageBuffer], { type: mimeType }), "palm.jpg");

  const response = await fetch(`${OPENAI_URL}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI 이미지 생성 요청에 실패했습니다.");
  const firstImage = payload.data?.[0];
  if (firstImage?.b64_json) return `data:image/png;base64,${firstImage.b64_json}`;
  if (firstImage?.url) return firstImage.url;
  throw new Error("OpenAI 이미지 응답을 읽을 수 없습니다.");
}

function extractOpenAIText(payload: any) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const texts: string[] = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) texts.push(content.text);
      if (content.type === "text" && content.text) texts.push(content.text);
    }
  }
  return texts.join("\n");
}

function parseAnalysis(text: string): PalmAnalysis {
  const cleaned = text.replace(/^```json/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as PalmAnalysis;
}
