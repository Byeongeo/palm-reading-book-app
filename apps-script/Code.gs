const APP_SECRET = ""; // Vercel의 APP_SECRET과 같은 값을 넣으세요. 실습에서는 비워둘 수 있습니다.

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (APP_SECRET && body.secret !== APP_SECRET) {
      return json({ ok: false, error: "invalid secret" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Results")
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Results");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "저장일시",
        "학년",
        "반",
        "번호",
        "이름",
        "AI",
        "요약",
        "추천검색어"
      ]);
    }

    const student = body.student || {};
    const analysis = body.analysis || {};

    sheet.appendRow([
      new Date(),
      student.grade || "",
      student.classNo || "",
      student.studentNo || "",
      student.name || "",
      body.provider || "",
      analysis.summary || "",
      (analysis.recommendationQueries || []).join(", ")
    ]);

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
