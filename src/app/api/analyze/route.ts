import { NextResponse } from "next/server";
import { demoAnalysis, makeDemoInfographic } from "@/lib/demo";
import { ensureReasonableImage } from "@/lib/image";
import { analyzeWithGemini, generateGeminiInfographic } from "@/lib/gemini";
import { analyzeWithOpenAI, generateOpenAIInfographic } from "@/lib/openai";
import type { Provider } from "@/lib/types";
import { verifyAccessCode } from "@/lib/access";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const accessError = verifyAccessCode(request);
    if (accessError) return accessError;

    const body = await request.json();
    const provider = (body.provider || "openai") as Provider;
    const imageDataUrl = String(body.imageDataUrl || "");
    if (!imageDataUrl) return NextResponse.json({ error: "사진이 없습니다." }, { status: 400 });
    ensureReasonableImage(imageDataUrl);

    const hasKey = provider === "openai" ? Boolean(process.env.OPENAI_API_KEY) : Boolean(process.env.GEMINI_API_KEY);
    if (!hasKey) {
      return NextResponse.json({
        analysis: demoAnalysis,
        imageDataUrl: makeDemoInfographic(),
        provider,
        demo: true
      });
    }

    const analysis = provider === "openai" ? await analyzeWithOpenAI(imageDataUrl) : await analyzeWithGemini(imageDataUrl);
    const resultImage =
      provider === "openai" ? await generateOpenAIInfographic(imageDataUrl) : await generateGeminiInfographic(imageDataUrl);

    return NextResponse.json({ analysis, imageDataUrl: resultImage, provider });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "분석 중 문제가 생겼습니다." },
      { status: 500 }
    );
  }
}
