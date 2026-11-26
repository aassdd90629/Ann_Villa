/**
 * LINE 官方帳號 URL Scheme 產製工具
 * 
 * 依據 LINE 官方規格：
 * 1. 僅開啟官方帳號主頁 / 加好友：
 *    https://line.me/R/ti/p/@209yrich
 * 
 * 2. 開啟官方帳號聊天室並預先填入文字 (oaMessage)：
 *    https://line.me/R/oaMessage/@209yrich/?{UTF-8 Percent-Encoded Text}
 * 
 * 注意：
 * - ti/p 不支援 query parameters，帶 ?text= 會被 LINE 直接忽略。
 * - oaMessage 格式為 /?{文字}，不可包含 "text=" 鍵名。
 * - @ 符號以 %40 編碼以確保跨平台瀏覽器相容性。
 */

export const DEFAULT_LINE_ID = '@209yrich'

/**
 * 從 LINE 網址或 ID 字串中擷取標準官方帳號 ID (例如 '@209yrich')
 * @param {string} [input]
 * @returns {string}
 */
export function extractLineId(input) {
  if (!input || typeof input !== 'string') return DEFAULT_LINE_ID
  const trimmed = input.trim()
  if (!trimmed) return DEFAULT_LINE_ID

  // 嘗試從完整 URL 解析 ID (支援 ti/p/@xxx, oaMessage/@xxx, ti/p/%40xxx)
  const match = trimmed.match(/(?:ti\/p\/|oaMessage\/)([@%0-9A-Za-z_-]+)/)
  if (match && match[1]) {
    const rawId = decodeURIComponent(match[1])
    return rawId.startsWith('@') ? rawId : `@${rawId}`
  }

  // 處理純 ID 字串
  const clean = trimmed.replace(/^https?:\/\/[^/]+\/?/, '')
  if (clean.startsWith('@')) return clean
  if (clean.startsWith('%40')) return decodeURIComponent(clean)
  return `@${clean}`
}

/**
 * 產製開啟 LINE 對話並預填文字之正確連結
 * @param {Object} options
 * @param {string} [options.lineId] 官方帳號 ID 或完整網址
 * @param {string} [options.text] 欲預先填入的訊息內容
 * @returns {string}
 */
export function buildLineUrl({ lineId, text } = {}) {
  const targetId = extractLineId(lineId)

  // 若無預填文字，導向加好友主頁 (ti/p)
  if (!text || !text.trim()) {
    return `https://line.me/R/ti/p/${targetId}`
  }

  // 若有預填文字，使用 LINE OA 專屬 oaMessage Scheme
  const encodedId = encodeURIComponent(targetId)
  const encodedText = encodeURIComponent(text.trim())
  return `https://line.me/R/oaMessage/${encodedId}/?${encodedText}`
}

/**
 * 點擊並複製訊息到剪貼簿後開啟 LINE 對話 (提升電腦版相容性，即使瀏覽器不支援代入亦可貼上)
 * @param {Object} options
 * @param {string} [options.lineId]
 * @param {string} [options.text]
 */
export async function openLineWithText({ lineId, text } = {}) {
  if (text && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text.trim())
    } catch {
      // 靜默捕捉，不影響後續頁面跳轉
    }
  }
  const url = buildLineUrl({ lineId, text })
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return url
}
