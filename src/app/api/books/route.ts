import { NextResponse } from "next/server";
import { demoBookGroups } from "@/lib/demo";
import type { BookGroup, BookItem, PalmAnalysis, PalmLine } from "@/lib/types";

export const runtime = "nodejs";

const RECENT_YEAR_CUTOFF = new Date().getFullYear() - 7;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analysis = body.analysis as PalmAnalysis | undefined;
    if (!analysis) return NextResponse.json({ error: "분석 결과가 없습니다." }, { status: 400 });

    if (!process.env.ALADIN_TTB_KEY) {
      return NextResponse.json({ groups: demoBookGroups, books: demoBookGroups.flatMap((group) => group.books), demo: true });
    }

    const bookGroups = makeBookGroups(analysis);
    const seen = new Set<string>();
    const groups: BookGroup[] = [];

    for (const group of bookGroups) {
      const groupBooks: BookItem[] = [];
      for (const query of group.queries) {
        const found = await searchAladin(query).catch(() => []);
        for (const book of found) {
          const key = book.isbn13 || book.title;
          if (seen.has(key)) continue;
          seen.add(key);
          groupBooks.push({
            ...book,
            why: makeReason(group.category, group.keywords, query, book.title)
          });
          if (groupBooks.length >= 3) break;
        }
        if (groupBooks.length >= 3) break;
      }

      if (groupBooks.length < 3) {
        await fillGroupBooks(groupBooks, group, seen);
      }

      if (groupBooks.length > 0) {
        groups.push({
          category: group.category,
          keywords: group.keywords,
          theme: group.theme,
          books: groupBooks
        });
      }
    }

    if (groups.length === 0) {
      for (const query of ["청소년 베스트셀러", "청소년 진로", "청소년 공감", "자기주도 학습"]) {
        const found = await searchAladin(query).catch(() => []);
        for (const book of found) {
          const key = book.isbn13 || book.title;
          if (seen.has(key)) continue;
          seen.add(key);
          if (groups.length === 0) {
            groups.push({
              category: "종합 추천",
              keywords: ["독서", "성장", "자기이해"],
              theme: "손금 해석의 핵심어와 연결되는 청소년 성장 독서",
              books: []
            });
          }
          groups[0].books.push({
            ...book,
            why: makeReason("종합 추천", ["독서", "성장", "자기이해"], query, book.title)
          });
          if (groups[0].books.length >= 6) break;
        }
        if (groups[0]?.books.length >= 6) break;
      }
    }

    if (groups.length === 0) {
      return NextResponse.json({ groups: demoBookGroups, books: demoBookGroups.flatMap((group) => group.books), demo: true });
    }

    return NextResponse.json({ groups, books: groups.flatMap((group) => group.books) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "도서 추천 중 문제가 생겼습니다." },
      { status: 500 }
    );
  }
}

type InternalBookGroup = {
  category: string;
  keywords: string[];
  theme: string;
  queries: string[];
};

function makeBookGroups(analysis: PalmAnalysis): InternalBookGroup[] {
  const lines = Array.isArray(analysis.lines) ? analysis.lines : [];
  const recommendationQueries = Array.isArray(analysis.recommendationQueries) ? analysis.recommendationQueries : [];
  const groups = lines.map((line) => lineToBookGroup(line));
  if (groups.length > 0) return groups;

  return [
    {
      category: "종합 추천",
      keywords: recommendationQueries.slice(0, 5),
      theme: "손금 해석의 핵심어와 연결되는 청소년 성장 독서",
      queries: [...recommendationQueries, "청소년 베스트셀러", "청소년 진로", "청소년 공감"]
    }
  ];
}

function lineToBookGroup(line: PalmLine): InternalBookGroup {
  const keywords = Array.isArray(line.keywords) ? line.keywords : [];
  const topics = Array.isArray(line.bookTopics) ? line.bookTopics : [];
  const category = line.name || "추천 영역";
  const presets = getPresetQueries(category, keywords);
  const queries = [...topics, ...keywords, ...presets]
    .map((query) => String(query || "").trim())
    .filter(Boolean)
    .filter((query, index, array) => array.indexOf(query) === index)
    .slice(0, 10);

  return {
    category,
    keywords,
    theme: makeTheme(category, keywords),
    queries
  };
}

function getPresetQueries(category: string, keywords: string[]) {
  const text = `${category} ${keywords.join(" ")}`;
  if (text.includes("감정") || text.includes("공감") || text.includes("소통") || text.includes("표현")) {
    return ["청소년 공감 베스트셀러", "청소년 관계 대화", "자기표현 글쓰기", "감정 수업"];
  }
  if (text.includes("지능") || text.includes("비판") || text.includes("정리") || text.includes("학습")) {
    return ["비판적 사고", "공부법 베스트셀러", "자기주도 학습", "메타인지 학습"];
  }
  if (text.includes("생명") || text.includes("꾸준") || text.includes("관리") || text.includes("루틴")) {
    return ["습관 베스트셀러", "청소년 마음 건강", "자기관리", "루틴"];
  }
  if (text.includes("운명") || text.includes("진로") || text.includes("강점") || text.includes("프로젝트")) {
    return ["청소년 진로 베스트셀러", "강점 찾기", "프로젝트 학습", "진로탐색"];
  }
  return ["청소년 베스트셀러", "자기계발 청소년", "인문 베스트셀러"];
}

function makeTheme(category: string, keywords: string[]) {
  if (category.includes("감정")) return "공감, 소통, 자기표현을 키우는 관계 독서";
  if (category.includes("지능")) return "비판적 사고, 정리력, 학습 전략을 돕는 사고력 독서";
  if (category.includes("생명")) return "꾸준함, 자기관리, 루틴을 세우는 생활 습관 독서";
  if (category.includes("운명")) return "진로탐색, 강점기반, 프로젝트 실행을 돕는 진로 독서";
  return `${keywords.join(", ")} 키워드와 연결되는 성장 독서`;
}

async function searchAladin(query: string): Promise<Omit<BookItem, "why">[]> {
  const salesPointBooks = await requestAladinSearch(query, "SalesPoint");
  const recentSalesPointBooks = salesPointBooks.filter(isRecentBook);
  if (recentSalesPointBooks.length >= 3) return recentSalesPointBooks;

  const newestBooks = await requestAladinSearch(query, "PublishTime").catch(() => []);
  return mergeBooks(recentSalesPointBooks, newestBooks, salesPointBooks);
}

async function requestAladinSearch(query: string, sort: "SalesPoint" | "PublishTime"): Promise<Omit<BookItem, "why">[]> {
  const url = new URL("https://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
  url.searchParams.set("ttbkey", process.env.ALADIN_TTB_KEY || "");
  url.searchParams.set("Query", query);
  url.searchParams.set("QueryType", "Keyword");
  url.searchParams.set("MaxResults", "10");
  url.searchParams.set("start", "1");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("Sort", sort);
  url.searchParams.set("Cover", "Big");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error("알라딘 API 요청에 실패했습니다.");
  const payload = await response.json();
  const items = Array.isArray(payload.item) ? payload.item : [];

  return items
    .filter(isTeenOrAdultBook)
    .map((item: any) => ({
      title: item.title || "",
      author: item.author || "",
      publisher: item.publisher || "",
      pubDate: item.pubDate || "",
      priceSales: typeof item.priceSales === "number" ? item.priceSales : null,
      isbn13: item.isbn13 || "",
      isbn: item.isbn || "",
      cover: item.cover || "",
      link: item.link || "https://www.aladin.co.kr",
      description: item.description || "",
      categoryName: item.categoryName || "",
      customerReviewRank: typeof item.customerReviewRank === "number" ? item.customerReviewRank : null
    }));
}

function isTeenOrAdultBook(item: any) {
  const text = `${item.title || ""} ${item.categoryName || ""}`.toLowerCase();
  const blockedWords = ["어린이", "유아", "아동", "초등", "초등학생", "그림책", "유치원"];
  return !blockedWords.some((word) => text.includes(word));
}

function isRecentBook(book: Pick<BookItem, "pubDate">) {
  const year = Number(String(book.pubDate || "").slice(0, 4));
  return Number.isFinite(year) && year >= RECENT_YEAR_CUTOFF;
}

function mergeBooks(...groups: Omit<BookItem, "why">[][]) {
  const seen = new Set<string>();
  const merged: Omit<BookItem, "why">[] = [];

  for (const group of groups) {
    for (const book of group) {
      const key = book.isbn13 || book.isbn || book.title;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(book);
    }
  }

  return merged;
}

async function fillGroupBooks(groupBooks: BookItem[], group: InternalBookGroup, seen: Set<string>) {
  const fallbackQueries = ["청소년 베스트셀러", "인문 베스트셀러", "자기계발 베스트셀러"];
  for (const query of fallbackQueries) {
    const found = await searchAladin(query).catch(() => []);
    for (const book of found) {
      const key = book.isbn13 || book.title;
      if (seen.has(key)) continue;
      seen.add(key);
      groupBooks.push({
        ...book,
        why: makeReason(group.category, group.keywords, query, book.title)
      });
      if (groupBooks.length >= 3) break;
    }
    if (groupBooks.length >= 3) break;
  }
}

function makeReason(category: string, keywords: string[], query: string, title: string) {
  const keywordText = keywords.length > 0 ? keywords.join(", ") : query;
  return `${category} 영역의 ${keywordText} 키워드를 바탕으로 ${title}을 살펴볼 수 있습니다.`;
}
