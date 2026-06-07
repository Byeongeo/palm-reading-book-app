import type { BookGroup, BookItem, PalmAnalysis } from "./types";

export const demoAnalysis: PalmAnalysis = {
  summary:
    "손바닥의 주요 선을 자기이해 관점에서 읽으면 감정 표현, 사고 방식, 꾸준함, 자기주도성이 함께 드러납니다. 이 결과는 진단이나 예언이 아니라 독서 주제를 고르기 위한 교육용 해석입니다. 공감, 진정성, 목표 설정, 건강한 생활 습관을 함께 탐색해 보면 좋겠습니다.",
  lines: [
    {
      name: "감정선",
      reading: "관계에서 진심을 중요하게 여기고 다른 사람의 감정을 세심하게 살피는 편으로 해석할 수 있습니다.",
      keywords: ["공감", "진정성", "관계"],
      bookTopics: ["공감 능력", "청소년 관계", "진정성 있는 사랑"]
    },
    {
      name: "지능선",
      reading: "생각을 깊게 이어가고 스스로 납득할 때까지 탐구하려는 성향으로 연결해 볼 수 있습니다.",
      keywords: ["탐구", "문제 해결", "사고력"],
      bookTopics: ["생각하는 힘", "진로 탐색", "문제 해결"]
    },
    {
      name: "생명선",
      reading: "생활 리듬과 에너지를 돌보는 습관이 중요하다는 메시지로 읽어볼 수 있습니다.",
      keywords: ["생활 습관", "회복", "균형"],
      bookTopics: ["청소년 건강", "마음 돌봄", "습관"]
    },
    {
      name: "운명선",
      reading: "목표를 정하고 자기 길을 만들어 가려는 태도를 키우면 강점이 더 잘 드러날 수 있습니다.",
      keywords: ["자기주도", "목표", "진로"],
      bookTopics: ["자기주도 학습", "진로 개척", "인물 이야기"]
    }
  ],
  recommendationQueries: ["청소년 공감", "자기주도 진로", "청소년 건강 습관", "관계 심리"]
};

export const demoBooks: BookItem[] = [
  {
    title: "데모 도서: 공감하는 마음의 힘",
    author: "연수 템플릿",
    publisher: "샘플출판",
    pubDate: "2026-01-01",
    priceSales: 15000,
    isbn13: "0000000000001",
    isbn: "0000000000",
    cover: "",
    link: "https://www.aladin.co.kr",
    description: "알라딘 TTB 키를 넣으면 실제 베스트셀러 중심의 추천 도서가 표시됩니다.",
    categoryName: "청소년",
    customerReviewRank: null,
    why: "감정선 키워드인 공감과 진정성을 바탕으로 관계를 이해하는 책을 추천하는 예시입니다."
  },
  {
    title: "데모 도서: 나의 길을 찾는 연습",
    author: "연수 템플릿",
    publisher: "샘플출판",
    pubDate: "2026-01-01",
    priceSales: 16800,
    isbn13: "0000000000002",
    isbn: "0000000000",
    cover: "",
    link: "https://www.aladin.co.kr",
    description: "운명선 키워드인 자기주도와 진로 개척을 바탕으로 추천하는 샘플 도서입니다.",
    categoryName: "청소년",
    customerReviewRank: null,
    why: "목표를 세우고 스스로 길을 만들어 가는 태도와 연결됩니다."
  }
];

export const demoBookGroups: BookGroup[] = [
  {
    category: "감정선",
    keywords: ["공감", "소통", "자기표현"],
    theme: "관계와 감정을 이해하고 건강하게 표현하는 독서",
    books: [demoBooks[0]]
  },
  {
    category: "운명선",
    keywords: ["진로탐색", "강점기반", "프로젝트"],
    theme: "자기 길을 찾고 실행하는 진로 독서",
    books: [demoBooks[1]]
  }
];

export function makeDemoInfographic() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#f8f3ea"/>
  <text x="600" y="120" text-anchor="middle" font-family="serif" font-size="62" fill="#352b24">손금 전체 가이드</text>
  <text x="600" y="172" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#8a7a68">API 키 입력 전 데모 인포그래픽</text>
  <rect x="365" y="250" width="470" height="740" rx="230" fill="#d99b7d" opacity=".78"/>
  <path d="M470 445 C590 520 670 520 760 455" fill="none" stroke="#fff9f0" stroke-width="9"/>
  <path d="M470 590 C610 610 690 685 725 820" fill="none" stroke="#fff9f0" stroke-width="8"/>
  <path d="M575 455 C545 650 535 770 585 930" fill="none" stroke="#fff9f0" stroke-width="8"/>
  <path d="M650 920 C660 760 685 640 735 520" fill="none" stroke="#fff9f0" stroke-width="6"/>
  <g font-family="sans-serif" font-size="26" fill="#3a3028">
    <rect x="90" y="340" width="270" height="150" rx="22" fill="#fffdfa" stroke="#dfd3c4"/>
    <text x="120" y="390" font-weight="700">감정선</text>
    <text x="120" y="432" font-size="20" fill="#75695d">공감과 진정성을</text>
    <text x="120" y="462" font-size="20" fill="#75695d">독서 주제로 연결</text>
    <rect x="840" y="540" width="270" height="150" rx="22" fill="#fffdfa" stroke="#dfd3c4"/>
    <text x="870" y="590" font-weight="700">지능선</text>
    <text x="870" y="632" font-size="20" fill="#75695d">생각하는 힘과</text>
    <text x="870" y="662" font-size="20" fill="#75695d">문제 해결력</text>
    <rect x="100" y="820" width="270" height="150" rx="22" fill="#fffdfa" stroke="#dfd3c4"/>
    <text x="130" y="870" font-weight="700">생명선</text>
    <text x="130" y="912" font-size="20" fill="#75695d">생활 리듬과</text>
    <text x="130" y="942" font-size="20" fill="#75695d">마음 돌봄</text>
    <rect x="825" y="910" width="285" height="150" rx="22" fill="#fffdfa" stroke="#dfd3c4"/>
    <text x="855" y="960" font-weight="700">운명선</text>
    <text x="855" y="1002" font-size="20" fill="#75695d">목표와 자기주도</text>
  </g>
  <rect x="80" y="1180" width="1040" height="220" rx="26" fill="#fffdfa" stroke="#dfd3c4"/>
  <text x="120" y="1245" font-family="sans-serif" font-size="28" font-weight="700" fill="#3a3028">종합 해석</text>
  <text x="120" y="1300" font-family="sans-serif" font-size="22" fill="#75695d">이 이미지는 API 키가 없을 때 표시되는 데모 결과입니다.</text>
  <text x="120" y="1340" font-family="sans-serif" font-size="22" fill="#75695d">OpenAI/Gemini 키를 넣으면 실제 촬영 사진 기반 이미지가 생성됩니다.</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
