"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookGroup, BookItem, PalmAnalysis, Provider, StudentInfo } from "@/lib/types";

type AnalyzeResponse = {
  analysis: PalmAnalysis;
  imageDataUrl: string | null;
  provider: Provider;
  demo?: boolean;
};

const emptyStudent: StudentInfo = {
  grade: "",
  classNo: "",
  studentNo: "",
  name: ""
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [student, setStudent] = useState<StudentInfo>(emptyStudent);
  const [provider, setProvider] = useState<Provider>("openai");
  const [photo, setPhoto] = useState<string>("");
  const [cameraOn, setCameraOn] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [bookGroups, setBookGroups] = useState<BookGroup[]>([]);
  const [openBooks, setOpenBooks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const canAnalyze = useMemo(() => {
    return Boolean(student.grade && student.classNo && student.studentNo && student.name && photo && !busy);
  }, [busy, photo, student]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraOn && !photo) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  }, [cameraOn, photo]);

  useEffect(() => {
    if (!busy) {
      setProgress(0);
      return;
    }

    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        if (current < 45) return current + 7;
        if (current < 75) return current + 4;
        return current + 2;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [busy]);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError("카메라 권한을 받을 수 없습니다. 브라우저 주소창의 카메라 권한을 허용하거나, 사진 업로드 기능을 사용하세요.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    const dataUrl = await makeCompressedImage(videoRef.current);
    setPhoto(dataUrl);
    setAnalysisResult(null);
    setBooks([]);
    setBookGroups([]);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    const dataUrl = await compressFile(file);
    setPhoto(dataUrl);
    setAnalysisResult(null);
    setBooks([]);
    setBookGroups([]);
  }

  async function analyzePalm() {
    if (!canAnalyze) return;
    setBusy("손금 인포그래픽을 만들고 있습니다.");
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, student, imageDataUrl: photo })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "분석에 실패했습니다.");
      setProgress(100);
      setAnalysisResult(payload);
      await saveResult(payload.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 문제가 생겼습니다.");
    } finally {
      setBusy("");
    }
  }

  async function recommendBooks() {
    if (!analysisResult) return;
    setBusy("알라딘 API로 권장도서를 찾고 있습니다.");
    setError("");
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: analysisResult.analysis, provider })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "도서 추천에 실패했습니다.");
      const nextBooks = Array.isArray(payload.books) ? payload.books : [];
      const nextGroups = Array.isArray(payload.groups) ? payload.groups : [];
      if (nextBooks.length === 0 && nextGroups.length === 0) {
        throw new Error("알라딘 검색 결과가 비어 있습니다. ALADIN_TTB_KEY와 검색어를 확인하세요.");
      }
      setProgress(100);
      setBooks(nextBooks);
      setBookGroups(nextGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "도서 추천 중 문제가 생겼습니다.");
    } finally {
      setBusy("");
    }
  }

  async function saveResult(analysis: PalmAnalysis) {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student, provider, analysis })
    }).catch(() => undefined);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">手</div>
          <div>
            <h1 className="brand-title">손금 도서 추천 앱</h1>
            <p className="brand-subtitle">Vercel + OpenAI/Gemini + 알라딘 API 사용</p>
          </div>
        </div>
        {busy ? <div className="status-pill">{busy}</div> : null}
      </header>

      {busy ? (
        <section className="progress-panel no-print" aria-live="polite">
          <div className="progress-copy">
            <strong>{busy}</strong>
            <span>{progress < 100 ? "잠시만 기다려 주세요. 이미지 생성은 1~2분 정도 걸릴 수 있습니다." : "완료되었습니다."}</span>
          </div>
          <div className="progress-track" aria-label="작업 진행률">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </section>
      ) : null}

      <nav className="workflow" aria-label="진행 단계">
        <div className="step" data-active={student.name ? "true" : "false"}>1. 학생 정보</div>
        <div className="step" data-active={photo ? "true" : "false"}>2. 손바닥 촬영</div>
        <div className="step" data-active={analysisResult ? "true" : "false"}>3. AI 분석</div>
        <div className="step" data-active={books.length > 0 || bookGroups.length > 0 ? "true" : "false"}>4. 권장도서</div>
      </nav>

      <section className="main-grid no-print">
        <aside className="panel">
          <div className="panel-inner">
            <h2 className="section-title">학생 정보와 AI 선택</h2>
            <div className="form-grid">
              <label className="field">
                <span>학년</span>
                <input value={student.grade} onChange={(event) => setStudent({ ...student, grade: event.target.value })} placeholder="예: 2" />
              </label>
              <label className="field">
                <span>반</span>
                <input value={student.classNo} onChange={(event) => setStudent({ ...student, classNo: event.target.value })} placeholder="예: 3" />
              </label>
              <label className="field">
                <span>번호</span>
                <input value={student.studentNo} onChange={(event) => setStudent({ ...student, studentNo: event.target.value })} placeholder="예: 15" />
              </label>
              <label className="field">
                <span>이름</span>
                <input value={student.name} onChange={(event) => setStudent({ ...student, name: event.target.value })} placeholder="홍길동" />
              </label>
              <label className="field full">
                <span>분석에 사용할 AI</span>
                <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
                  <option value="openai">OpenAI GPT / GPT Image</option>
                  <option value="gemini">Google Gemini / Imagen</option>
                </select>
              </label>
            </div>
            <div className="notice">
              이 앱은 진단이나 예언이 아니라 자기이해와 독서 추천 활동을 위한 수업용 도구입니다.
            </div>
          </div>
        </aside>

        <section className="panel camera-stage">
          <div className="camera-frame">
            {!cameraOn && !photo ? (
              <div className="camera-empty">
                <strong>손바닥을 촬영하세요</strong>
                <span>노트북 웹캠을 켜거나, 기기에 저장된 손바닥 사진을 업로드할 수 있습니다.</span>
              </div>
            ) : photo ? (
              <img src={photo} alt="촬영한 손바닥" />
            ) : (
              <video ref={videoRef} playsInline muted autoPlay />
            )}
          </div>
          <div className="toolbar">
            <div className="toolbar-left">
              <button className="button secondary" onClick={startCamera} disabled={cameraOn || Boolean(busy)}>카메라 켜기</button>
              <button className="button" onClick={capturePhoto} disabled={!cameraOn || Boolean(busy)}>사진 찍기</button>
              <button className="button secondary" onClick={() => setPhoto("")} disabled={!photo || Boolean(busy)}>다시 찍기</button>
              <label className="button secondary">
                사진 업로드
                <input hidden type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
              </label>
            </div>
            <div className="toolbar-right">
              <button className="button blue" onClick={analyzePalm} disabled={!canAnalyze}>분석</button>
            </div>
          </div>
        </section>
      </section>

      {error ? <div className="error no-print">{error}</div> : null}

      <section className="output-grid">
        <section className="panel">
          <div className="panel-inner">
            <h2 className="section-title">손금 전체 가이드</h2>
            <div className="result-image">
              {analysisResult?.imageDataUrl ? (
                <img src={analysisResult.imageDataUrl} alt="AI가 만든 손금 전체 가이드 인포그래픽" />
              ) : busy.includes("손금") ? (
                <div className="placeholder">
                  <div className="small-loader" />
                  손금 가이드 인포그래픽을 생성하고 있습니다. 이미지 생성은 1~2분 정도 걸릴 수 있습니다.
                </div>
              ) : (
                <div className="placeholder">분석을 실행하면 업로드한 손바닥 사진을 바탕으로 만든 인포그래픽이 여기에 표시됩니다.</div>
              )}
            </div>
            {analysisResult ? (
              <div className="actions no-print">
                <button className="button secondary" onClick={() => window.print()}>PDF 저장/인쇄</button>
                <button className="button rose" onClick={recommendBooks} disabled={Boolean(busy)}>권장도서</button>
                <a className="link-button light" href="https://dcu.cbe.go.kr" target="_blank" rel="noreferrer">다채움</a>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-inner">
            <h2 className="section-title">해석 요약</h2>
            {analysisResult ? (
              <>
                <p className="book-meta">{analysisResult.analysis.summary}</p>
                <div className="analysis-list">
                  {analysisResult.analysis.lines.map((line) => (
                    <article className="line-item" key={line.name}>
                      <h3>{line.name}</h3>
                      <p>{line.reading}</p>
                      <div className="tags">
                        {line.keywords.map((keyword) => (
                          <span className="tag" key={keyword}>{keyword}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="placeholder">감정선, 지능선, 생명선, 운명선 등에서 독서 추천에 쓸 키워드를 추출합니다.</div>
            )}
          </div>
        </aside>
      </section>

      <section className="panel no-print" style={{ marginTop: 18 }}>
        <div className="panel-inner">
          <h2 className="section-title">권장도서</h2>
          {busy.includes("권장도서") ? (
            <div className="placeholder">
              <div className="small-loader" />
              알라딘 API에서 관련 도서를 찾고 있습니다. 검색어를 여러 개 확인하므로 잠시 걸릴 수 있습니다.
            </div>
          ) : bookGroups.length === 0 && books.length === 0 ? (
            <div className="placeholder">권장도서 버튼을 누르면 감정선, 지능선, 생명선, 운명선의 핵심어를 바탕으로 영역별 베스트셀러를 추천합니다.</div>
          ) : (
            <div className="book-groups">
              {(bookGroups.length > 0 ? bookGroups : [{ category: "종합 추천", keywords: [], theme: "손금 해석과 연결되는 성장 독서", books }]).map((group) => (
                <section className="book-group" key={group.category}>
                  <div className="book-group-head">
                    <div>
                      <h3>{group.category} 추천</h3>
                      <p>{group.theme}</p>
                    </div>
                    <div className="tags">
                      {group.keywords.map((keyword) => (
                        <span className="tag" key={`${group.category}-${keyword}`}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                  <div className="books">
                    {group.books.map((book) => {
                      const key = `${group.category}-${book.isbn13 || book.title}`;
                      const yes24Url = `https://www.yes24.com/Product/Search?domain=ALL&query=${encodeURIComponent(book.isbn13 || book.title)}`;
                      return (
                        <article className="book-card" key={key}>
                          <button className="book-summary" onClick={() => setOpenBooks({ ...openBooks, [key]: !openBooks[key] })}>
                            {book.cover ? <img src={book.cover} alt="" /> : <span />}
                            <span>
                              <p className="book-title">{book.title}</p>
                              <p className="book-meta">
                                {book.author} · {book.publisher} · {getYear(book.pubDate)} · {book.priceSales ? `${book.priceSales.toLocaleString()}원` : "가격 정보 없음"}
                              </p>
                              <p className="book-meta">{book.isbn13 || book.isbn ? `ISBN ${book.isbn13 || book.isbn}` : "ISBN 정보 없음"}</p>
                            </span>
                          </button>
                          {openBooks[key] ? (
                            <div className="book-detail">
                              <strong>추천 이유</strong>
                              <p>{book.why}</p>
                              <strong>책 소개</strong>
                              <p>{book.description || "알라딘 API에서 제공된 소개가 없습니다."}</p>
                              <p>출판연도: {getYear(book.pubDate)} · ISBN: {book.isbn13 || book.isbn || "정보 없음"}</p>
                              <p>알라딘 평점 지표: {book.customerReviewRank ?? "정보 없음"}</p>
                              <div className="book-links">
                                <a className="link-button" href={book.link} target="_blank" rel="noreferrer">알라딘</a>
                                <a className="link-button light" href={yes24Url} target="_blank" rel="noreferrer">YES24</a>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

async function makeCompressedImage(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  const ratio = video.videoWidth / video.videoHeight || 4 / 3;
  canvas.width = 1024;
  canvas.height = Math.round(1024 / ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리할 수 없습니다.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

async function compressFile(file: File) {
  const image = await loadImage(URL.createObjectURL(file));
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리할 수 없습니다.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getYear(pubDate: string) {
  const year = String(pubDate || "").slice(0, 4);
  return /^\d{4}$/.test(year) ? `${year}년` : "출판연도 정보 없음";
}
