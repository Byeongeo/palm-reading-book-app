# 손금 독서 추천 Vercel 템플릿

노트북 웹캠으로 손바닥을 촬영하고, OpenAI 또는 Gemini API로 손금 가이드 인포그래픽을 만든 뒤, 알라딘 API를 이용해 관련 권장도서를 추천하는 교사 연수용 템플릿입니다.

## 교사가 하는 일

1. 이 템플릿을 GitHub 저장소로 복사합니다.
2. Vercel에 로그인합니다.
3. `Add New Project`에서 저장소를 선택합니다.
4. Environment Variables에 API 키를 넣습니다.
5. Deploy를 누릅니다.

## 필수 환경변수

Vercel 프로젝트의 `Settings > Environment Variables`에 아래 값을 넣습니다.

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-proj-...` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API 키 | `AIza...` |
| `ALADIN_TTB_KEY` | 알라딘 OpenAPI TTB 키 | 알라딘에서 발급 |

셋 중 일부만 넣어도 됩니다. 예를 들어 OpenAI 키만 넣으면 OpenAI 분석만 실제 호출되고, Gemini 쪽은 데모 결과가 표시됩니다.

## 모델 환경변수

아래 값은 선택입니다. 비워두면 템플릿 기본값을 씁니다.

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `OPENAI_TEXT_MODEL` | `gpt-5.2` | 손금 해석 JSON을 만드는 모델 |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | 손금 인포그래픽 이미지를 만드는 모델 |
| `GEMINI_TEXT_MODEL` | `gemini-3.5-flash` | 손금 해석 JSON을 만드는 모델 |
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-pro-image` | 손금 인포그래픽 이미지를 만드는 모델 |

OpenAI 이미지 모델은 계정 화면에 따라 `chatgpt-image-latest`, `gpt-image-2`, `gpt-image-2-2026-04-21`, `gpt-image-1.5` 등으로 바꿀 수 있습니다. 연수에서는 `gpt-image-2`를 기본으로 두고, 접근 권한 문제가 있으면 `gpt-image-1.5`로 낮추면 됩니다.

## 선택 환경변수: 구글 시트 저장

구글 시트에 결과를 저장하려면 `apps-script/Code.gs`를 구글 Apps Script에 붙여 넣고 웹앱으로 배포한 뒤, 배포 URL을 넣습니다.

| 이름 | 설명 |
| --- | --- |
| `GOOGLE_SHEET_WEBHOOK_URL` | Apps Script 웹앱 URL |
| `APP_SECRET` | 간단한 저장 보호용 토큰. Apps Script 코드의 값과 맞춥니다. |

## 수업 운영 주의

- 손금 결과는 과학적 진단이나 미래 예측이 아니라 자기이해와 독서 추천 활동으로 안내하세요.
- 학생 사진을 저장하지 않는 운영을 권장합니다. 기본 템플릿은 원본 사진을 별도 저장하지 않습니다.
- 결과를 시트에 저장할 때도 이름, 학년, 반, 번호, 해석 요약 정도만 저장하는 것이 좋습니다.
- 학생에게 촬영 목적과 사용 범위를 설명하고 동의를 받은 뒤 진행하세요.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## Vercel 배포 후 확인

1. 배포 주소로 접속합니다.
2. 학년, 반, 번호, 이름을 입력합니다.
3. `카메라 켜기`를 누르고 브라우저 카메라 권한을 허용합니다.
4. `사진 찍기`를 누릅니다.
5. OpenAI 또는 Gemini를 선택한 뒤 `분석`을 누릅니다.
6. 결과가 보이면 `PDF 저장/인쇄` 또는 `권장도서`를 누릅니다.

## 문제가 생길 때

- 카메라가 안 켜지면 HTTPS 주소인지 확인하세요. Vercel 배포 주소는 HTTPS라서 카메라 사용이 가능합니다.
- OpenAI 이미지 생성이 실패하면 `OPENAI_IMAGE_MODEL`을 `gpt-image-1.5`로 바꿔보세요.
- Gemini 이미지 생성이 실패하면 `GEMINI_IMAGE_MODEL`을 `gemini-3.1-flash-image`로 바꿔보세요.
- 알라딘 도서가 안 나오면 `ALADIN_TTB_KEY`가 맞는지 확인하세요.

## 확인한 모델 문서

- OpenAI 공식 이미지 생성 문서에는 `gpt-image-1.5`가 최신 고급 이미지 모델로 안내되어 있습니다. 다만 OpenAI Platform 모델 선택 화면에서 `gpt-image-2`, `gpt-image-2-2026-04-21`, `chatgpt-image-latest`가 보이면 해당 값을 `OPENAI_IMAGE_MODEL`에 넣어 사용할 수 있습니다.
- Gemini 공식 모델 문서 기준으로 텍스트/이미지 입력 후 텍스트 출력을 할 때는 `gemini-3.5-flash`, 이미지 생성은 `gemini-3.1-pro-image` 또는 빠른 `gemini-3.1-flash-image`를 사용할 수 있습니다.

참고 문서:

- https://platform.openai.com/docs/guides/image-generation
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/image-generation
