export function splitDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("이미지 형식이 올바르지 않습니다.");
  }
  return {
    mimeType: match[1],
    base64: match[2],
    buffer: Buffer.from(match[2], "base64")
  };
}

export function ensureReasonableImage(dataUrl: string) {
  const { buffer } = splitDataUrl(dataUrl);
  const maxBytes = 4 * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw new Error("사진 용량이 큽니다. 다시 촬영하거나 더 작은 이미지로 업로드하세요.");
  }
}
