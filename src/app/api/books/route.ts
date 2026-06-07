import { NextResponse } from "next/server";
import { demoBooks } from "@/lib/demo";
import type { BookItem, PalmAnalysis } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analysis = body.analysis as PalmAnalysis | undefined;
    if (!analysis) return NextResponse.json({ error: "분석 결과가 없습니다." }, { status: 400 });

    if (!process.env.ALADIN_TTB_KEY) {
      return NextResponse.json({ books: demoBooks, demo: true });
    }

    const queries = makeQueries(analysis);
    const seen = new Set<string>();
    const books: BookItem[] = [];

    for (const query of queries) {
      const found = await searchAladin(query);
      for (const book of found) {
        const key = book.isbn13 || book.title;
        if (seen.has(key)) continue;
        seen.add(key);
        books.push({
          ...book,
          why: makeReason(analysis, query, book.title)
        });
        if (books.length >= 8) break;
      }
      if (books.length >= 8) break;
    }

    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "도서 추천 중 문제가 생겼습니다." },
      { status: 500 }
    );
  }
}

function makeQueries(analysis: PalmAnalysis) {
  const lines = Array.isArray(analysis.lines) ? analysis.lines : [];
  const recommendationQueries = Array.isArray(analysis.recommendationQueries) ? analysis.recommendationQueries : [];
  const topics = lines.flatMap((line) => line.bookTopics || []);
  const keywords = lines.flatMap((line) => line.keywords || []);
  return [...recommendationQueries, ...topics, ...keywords, "청소년 베스트셀러"]
    .filter(Boolean)
    .slice(0, 10);
}

async function searchAladin(query: string): Promise<Omit<BookItem, "why">[]> {
  const url = new URL("https://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
  url.searchParams.set("ttbkey", process.env.ALADIN_TTB_KEY || "");
  url.searchParams.set("Query", query);
  url.searchParams.set("QueryType", "Keyword");
  url.searchParams.set("MaxResults", "5");
  url.searchParams.set("start", "1");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("Sort", "SalesPoint");
  url.searchParams.set("Cover", "Big");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");

  const response = await fetch(url, { next: { revalidate: 3600 } });
  const payload = await response.json();
  const items = Array.isArray(payload.item) ? payload.item : [];

  return items.map((item: any) => ({
    title: item.title || "",
    author: item.author || "",
    publisher: item.publisher || "",
    priceSales: typeof item.priceSales === "number" ? item.priceSales : null,
    isbn13: item.isbn13 || item.isbn || "",
    cover: item.cover || "",
    link: item.link || "https://www.aladin.co.kr",
    description: item.description || "",
    customerReviewRank: typeof item.customerReviewRank === "number" ? item.customerReviewRank : null
  }));
}

function makeReason(analysis: PalmAnalysis, query: string, title: string) {
  const lines = Array.isArray(analysis.lines) ? analysis.lines : [];
  const line = lines.find((item) => [...(item.bookTopics || []), ...(item.keywords || [])].some((topic) => query.includes(topic)));
  if (!line) return `"${query}" 주제와 연결해 ${title}을 살펴볼 수 있습니다.`;
  return `${line.name}에서 나온 ${line.keywords.join(", ")} 키워드를 바탕으로 "${query}" 주제를 더 깊게 생각해 볼 수 있는 책입니다.`;
}
