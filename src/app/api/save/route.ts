import { NextResponse } from "next/server";
import { verifyAccessCode } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const accessError = verifyAccessCode(request);
    if (accessError) return accessError;

    const body = await request.json();
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ saved: false, reason: "GOOGLE_SHEET_WEBHOOK_URL이 없어 저장을 건너뜁니다." });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.APP_SECRET || "",
        createdAt: new Date().toISOString(),
        ...body
      })
    });

    const text = await response.text();
    let payload: any = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok || payload.ok === false) {
      return NextResponse.json(
        {
          saved: false,
          reason: payload.error || payload.raw || "Apps Script 저장 요청이 실패했습니다."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json(
      { saved: false, reason: error instanceof Error ? error.message : "저장 중 문제가 생겼습니다." },
      { status: 500 }
    );
  }
}
