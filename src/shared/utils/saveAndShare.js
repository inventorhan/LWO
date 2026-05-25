/**
 * 네이티브(Android/iOS) 환경에서는 Capacitor Filesystem 으로 파일을 쓰고
 * Share Sheet 를 자동으로 띄워서 카카오톡/메일/드라이브로 즉시 공유 가능.
 * 웹(브라우저) 환경에서는 기존 Blob 다운로드로 fallback.
 */

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/* base64 encode for native filesystem (utf-8 string -> base64) */
function strToBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => {
      const result = r.result || ''
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

/* 파일을 폰의 Documents/LWO 폴더에 저장하고 공유 시트 자동 표시 */
async function saveNative({ filename, base64, title }) {
  const path = `LWO/${filename}`
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Documents,
    recursive: true
  })
  const fileInfo = await Filesystem.getUri({
    path,
    directory: Directory.Documents
  })
  // 공유 시트 자동 호출
  try {
    await Share.share({
      title: title || filename,
      text: `${filename}`,
      url: fileInfo.uri,
      dialogTitle: '파일 공유'
    })
  } catch {
    /* 사용자가 공유 취소해도 파일은 이미 저장됨 — 무시 */
  }
  return { path: fileInfo.uri }
}

/* 웹 fallback: 기존 다운로드 방식 */
function saveWeb({ filename, blob }) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
  return { path: '브라우저 다운로드 폴더' }
}

/**
 * JSON 데이터를 저장 + 공유.
 * @returns {{path:string}}
 */
export async function saveJson(filename, jsonString) {
  const native = Capacitor.isNativePlatform()
  if (native) {
    const b64 = strToBase64Utf8(jsonString)
    return saveNative({
      filename,
      base64: b64,
      mimeType: 'application/json',
      title: 'LWO 분석 데이터'
    })
  }
  const blob = new Blob([jsonString], { type: 'application/json' })
  return saveWeb({ filename, blob })
}

/**
 * Blob (Excel 등 바이너리) 저장 + 공유.
 * @returns {{path:string}}
 */
export async function saveBlob(filename, blob, opts = {}) {
  const native = Capacitor.isNativePlatform()
  if (native) {
    const b64 = await blobToBase64(blob)
    return saveNative({
      filename,
      base64: b64,
      mimeType: opts.mimeType || blob.type,
      title: opts.title || filename
    })
  }
  return saveWeb({ filename, blob })
}
