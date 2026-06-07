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

    return NextResponse.json({ saved: response.ok });
  } catch {
    return NextResponse.json({ saved: false });
  }
}
