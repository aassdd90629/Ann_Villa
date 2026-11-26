/**
 * _security.js - 全域資安防護與邊緣安全工具函式庫 (P2 級別)
 * 
 * 包含：
 * 1. 取得客戶端真實 IP (getClientIp)
 * 2. 特殊字元與 XSS 消毒 (sanitizeText)
 * 3. D1 分散式速率限制 (checkRateLimit)
 * 4. 連續暴力比對失敗鎖定 (isLocked, recordFailAttempt, clearFailAttempt)
 * 5. Cloudflare Turnstile 無感人機驗證 (verifyTurnstileToken)
 */

export function getClientIp(request) {
  if (!request || !request.headers) return '127.0.0.1';
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-real-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         '127.0.0.1';
}

export function sanitizeText(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // 濾除 HTML 標籤
    .replace(/[<>'"]/g, '')    // 濾除殘存尖括號與引號
    .trim()
    .slice(0, maxLength);
}

/**
 * 檢查速率限制
 * @param {Object} db D1 資料庫實例
 * @param {string} key 限制鍵 (例: 'lookup:ip:1.2.3.4')
 * @param {number} maxAttempts 上限次數
 * @param {number} windowSeconds 限制時間窗口 (秒)
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
export async function checkRateLimit(db, key, maxAttempts = 15, windowSeconds = 60) {
  if (!db) return { allowed: true, remaining: maxAttempts };

  try {
    // 自動清理過期紀錄
    await db.prepare("DELETE FROM rate_limit_logs WHERE reset_at < DATETIME('now')").run();

    const record = await db.prepare(
      "SELECT attempt_count, reset_at FROM rate_limit_logs WHERE rate_key = ?"
    ).bind(key).first();

    if (!record) {
      await db.prepare(`
        INSERT INTO rate_limit_logs (rate_key, attempt_count, reset_at)
        VALUES (?, 1, DATETIME('now', ? || ' seconds'))
      `).bind(key, String(windowSeconds)).run();
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.attempt_count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: record.reset_at };
    }

    await db.prepare(`
      UPDATE rate_limit_logs 
      SET attempt_count = attempt_count + 1 
      WHERE rate_key = ?
    `).bind(key).run();

    return { allowed: true, remaining: Math.max(0, maxAttempts - (record.attempt_count + 1)) };
  } catch (err) {
    console.warn('[RateLimit Warning]:', err.message);
    return { allowed: true, remaining: maxAttempts }; // 異常時優雅降級放行
  }
}

/**
 * 檢查目標對象是否已被暴力失敗鎖定
 */
export async function isLocked(db, key, maxFailures = 5) {
  if (!db) return false;
  try {
    const record = await db.prepare(
      "SELECT attempt_count FROM rate_limit_logs WHERE rate_key = ? AND reset_at >= DATETIME('now')"
    ).bind(key).first();
    return record && record.attempt_count >= maxFailures;
  } catch (_) {
    return false;
  }
}

/**
 * 記錄一次比對失敗
 */
export async function recordFailAttempt(db, key, windowSeconds = 900) {
  if (!db) return;
  try {
    const record = await db.prepare(
      "SELECT attempt_count FROM rate_limit_logs WHERE rate_key = ? AND reset_at >= DATETIME('now')"
    ).bind(key).first();

    if (!record) {
      await db.prepare(`
        INSERT OR REPLACE INTO rate_limit_logs (rate_key, attempt_count, reset_at)
        VALUES (?, 1, DATETIME('now', ? || ' seconds'))
      `).bind(key, String(windowSeconds)).run();
    } else {
      await db.prepare(`
        UPDATE rate_limit_logs 
        SET attempt_count = attempt_count + 1 
        WHERE rate_key = ?
      `).bind(key).run();
    }
  } catch (_) {}
}

/**
 * 清除失敗次數 (驗證成功時呼叫)
 */
export async function clearFailAttempt(db, key) {
  if (!db) return;
  try {
    await db.prepare("DELETE FROM rate_limit_logs WHERE rate_key = ?").bind(key).run();
  } catch (_) {}
}

/**
 * Cloudflare Turnstile 人機驗證
 */
export async function verifyTurnstileToken(secretKey, token, clientIp) {
  if (!secretKey) return { success: true }; // 未配置密鑰時自動放行 (Local / Demo)
  if (!token) return { success: false, message: '缺少人機安全驗證 Token' };

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) formData.append('remoteip', clientIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return { success: !!data.success, message: data['error-codes']?.join(', ') || '' };
  } catch (err) {
    console.warn('[Turnstile Verify Warning]:', err.message);
    return { success: false, message: err.message };
  }
}
