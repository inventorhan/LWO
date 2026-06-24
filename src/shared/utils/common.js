/**
 * 숫자 변환 및 계산 유틸리티
 */

/**
 * 값을 float 숫자로 변환합니다. 실패 시 0을 반환합니다.
 */
export function n(v) {
  return parseFloat(v) || 0;
}

/**
 * 미입력(빈 문자열/null/undefined)이면 기본값을, 그 외에는 숫자로 파싱해 반환합니다.
 * - 명시적으로 0을 입력한 경우에는 0을 그대로 반환합니다 (n과 달리 0을 기본값으로 덮지 않음).
 * @param {*} v - 값
 * @param {number} fallback - 미입력 시 사용할 기본값 (기본 0)
 */
export function nOr(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const p = parseFloat(v);
  return Number.isFinite(p) ? p : fallback;
}

/**
 * 숫자를 포맷팅하여 문자열로 반환합니다.
 * @param {number} v - 값
 * @param {string} unit - 단위 (선택)
 * @param {number} decimals - 소수점 자리수 (기본 2)
 * @returns {string} 포맷팅된 문자열
 */
export function fmtN(v, unit = '', decimals = 2) {
  return v !== null && !isNaN(v) && isFinite(v) && v > 0 
    ? `${v.toLocaleString(undefined, { maximumFractionDigits: decimals })}${unit}` 
    : '—';
}

/**
 * 면적을 계산합니다 (가로 * 세로).
 */
export function calcArea(w, h) {
  const a = n(w) * n(h);
  return a > 0 ? a : null;
}

/**
 * 타임스탬프를 HH:mm:ss 형식으로 변환합니다.
 */
export function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/**
 * 두 시점 사이의 차이(초)를 계산합니다.
 */
export function getGap(start, end) {
  if (!start) return null;
  const stop = end || Date.now();
  return ((stop - start) / 1000).toFixed(1);
}

/**
 * 이미지를 캔버스로 리사이즈/JPEG 압축한 base64 문자열을 반환합니다.
 * - localStorage 용량 초과 방지를 위해 자동 다운스케일.
 * - 일반 파일은 그대로 base64.
 */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) return reject(new Error('no file'));

  // 이미지 압축 처리
  if (file.type && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX = 1280; // long edge
        let { width: w, height: h } = img;
        const scale = Math.min(1, MAX / Math.max(w, h));
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // 이미지 로딩 실패 시 원본 base64로 fallback
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
    };
    img.src = url;
    return;
  }

  // 비이미지: 그대로 base64
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
