export type Provider = "openai" | "gemini";

export type StudentInfo = {
  grade: string;
  classNo: string;
  studentNo: string;
  name: string;
};

export type PalmLine = {
  name: string;
  reading: string;
  keywords: string[];
  bookTopics: string[];
};

export type PalmAnalysis = {
  summary: string;
  lines: PalmLine[];
  recommendationQueries: string[];
};

export type BookItem = {
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  priceSales: number | null;
  isbn13: string;
  isbn: string;
  cover: string;
  link: string;
  description: string;
  categoryName: string;
  customerReviewRank: number | null;
  why: string;
};

export type BookGroup = {
  category: string;
  keywords: string[];
  theme: string;
  books: BookItem[];
};
