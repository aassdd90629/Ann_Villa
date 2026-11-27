/**
 * LINE 官方帳號 URL Scheme 產製工具
 * 
 * 依據 LINE 官方規格與跨裝置適配：
 * 1. 行動裝置 (Mobile: iOS / Android):
 *    - 僅開啟官方帳號主頁 / 加好友：
 *      https://line.me/R/ti/p/@209yrich
 *    - 開啟官方帳號聊天室並預先填入文字 (oaMessage)：
 *      https://line.me/R/oaMessage/@209yrich/?{UTF-8 Percent-Encoded Text}
 * 
 * 2. 電腦桌面版 (Desktop: Windows / macOS / Linux):
 *    - 注意：LINE 官方伺服器針對桌面瀏覽器會將 line.me/R/ (包含 oaMessage 與 ti/p)
 *      強制 302 重導向至 line.me/tw，導致電腦端使用者被轉往 LINE 台灣宣傳首頁。
 *    - 為此，電腦桌面版一律自動適配為 LINE 官方專屬網頁版：
 *      https://page.line.me/{cleanId} (例如 https://page.line.me/209yrich)
 *      或直接使用官方短網址 https://lin.ee/...
 *      該頁面完整展示官方帳號名稱、頭像與加好友專屬 QR Code，徹底杜絕跳轉首頁。
 * 
 * 注意：
 * - ti/p 不支援 query parameters，帶 ?text= 會被 LINE 直接忽略。
 * - oaMessage 格式為 /?{文字}，不可包含 "text=" 鍵名。
 * - @ 符號以 %40 編碼以確保跨平台瀏覽器相容性。
 */

export const DEFAULT_LINE_ID = '@209yrich'

/**
 * 判斷當前環境是否為行動裝置 (iOS / Android / 平板)
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 從 LINE 網址或 ID 字串中擷取標準官方帳號 ID (例如 '@209yrich')
 * @param {string} [input]
 * @returns {string}
 */
export function extractLineId(input) {
  if (!input || typeof input !== 'string') return DEFAULT_LINE_ID
  const trimmed = input.trim()
  if (!trimmed) return DEFAULT_LINE_ID

  // 若已經是 lin.ee 官方短網址，直接返回
  if (trimmed.includes('lin.ee/')) return trimmed

  // 嘗試從完整 URL 解析 ID (支援 ti/p/@xxx, oaMessage/@xxx, page.line.me/xxx)
  const match = trimmed.match(/(?:ti\/p\/|oaMessage\/|page\.line\.me\/)([@%0-9A-Za-z_-]+)/)
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
 * 產製開啟 LINE 對話並預填文字之正確連結 (具備桌面端與行動端自適應)
 * @param {Object} options
 * @param {string} [options.lineId] 官方帳號 ID 或完整網址
 * @param {string} [options.text] 欲預先填入的訊息內容
 * @param {boolean} [options.forceMobile] 強制使用行動版連結
 * @returns {string}
 */
export function buildLineUrl({ lineId, text, forceMobile = false } = {}) {
  // 若傳入的是 lin.ee 短網址，電腦與手機皆能正常處理
  if (typeof lineId === 'string' && lineId.includes('lin.ee/')) {
    return lineId.trim()
  }

  const targetId = extractLineId(lineId)
  const isMobile = forceMobile || isMobileDevice()
  const cleanId = targetId.replace(/^@/, '')

  // 🖥️ 電腦桌面端：導向官方 page.line.me 網頁版，防止被重導向至 line.me/tw
  if (!isMobile) {
    return `https://page.line.me/${cleanId}`
  }

  // 📱 行動端環境：使用 LINE App 專屬 Scheme
  if (!text || !text.trim()) {
    return `https://line.me/R/ti/p/${targetId}`
  }

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
