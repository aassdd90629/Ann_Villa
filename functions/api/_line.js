/**
 * functions/api/_line.js
 * 
 * 山語 Villa LINE 官方帳號 Messaging API 推播核心服務模組
 * 負責組織品牌專屬 Flex Message Bubble 卡片、呼叫 LINE Push Message API、
 * 並將發送紀錄留存於 line_notification_logs 資料表以利追蹤。
 * 
 * 遵守專案後端紅線：
 * 1. 嚴格使用 env.DB.prepare(...).bind(...) 參數化綁定寫入紀錄。
 * 2. 具備完全非阻塞容錯保護：即使 LINE API 異常或旅客封鎖，亦絕不中斷主業務訂單交易。
 * 3. 金鑰與敏感資訊由環境變數 LINE_CHANNEL_ACCESS_TOKEN 注入。
 */

/**
 * 建立山語 Villa 品牌專屬 Flex Message 卡片結構
 * @param {'BOOKING_PENDING' | 'PAYMENT_REPORTED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'} eventType 
 * @param {object} data 訂單相關資訊
 * @returns {object} LINE Flex Bubble Object
 */
export function buildFlexTemplate(eventType, data) {
  const {
    bookingId = '',
    guestName = '貴賓',
    checkIn = '',
    checkOut = '',
    nights = 1,
    guestCount = 14,
    totalAmount = 0,
    depositAmount = 0,
    bankCode = '004 (臺灣銀行)',
    bankAccount = '001-008-123456',
    bankAccountName = '山語旅宿管理顧問有限公司',
    bankLast5 = '',
    refundAmount = 0,
    refundStatus = 'NONE',
    cancelReason = '',
    lookupUrl = ''
  } = data;

  const headerColors = {
    BOOKING_PENDING: { bg: '#2b2621', title: '山語 Villa・預訂已送出 (待匯定金)', sub: '保留 24 小時' },
    PAYMENT_REPORTED: { bg: '#2f3e46', title: '山語 Villa・匯款末五碼回報確認', sub: '管家對帳中' },
    BOOKING_CONFIRMED: { bg: '#1f3d2b', title: '山語 Villa・預訂成功 (已保留檔期)', sub: '定金已核銷' },
    BOOKING_CANCELLED: { bg: '#4a2525', title: '山語 Villa・預訂已取消', sub: '檔期已釋出' }
  };

  const currentTheme = headerColors[eventType] || headerColors.BOOKING_PENDING;

  // 組織主要內容行 (Rows)
  const detailRows = [];

  const addRow = (label, value, isHighlight = false, highlightColor = '#2b2621') => {
    detailRows.push({
      type: 'box',
      layout: 'horizontal',
      spacing: 'md',
      contents: [
        { type: 'text', text: label, size: 'xs', color: '#8c827a', flex: 3 },
        { 
          type: 'text', 
          text: String(value), 
          size: 'xs', 
          color: isHighlight ? highlightColor : '#2b2621', 
          weight: isHighlight ? 'bold' : 'regular',
          flex: 6, 
          wrap: true 
        }
      ]
    });
  };

  addRow('訂單編號', bookingId, true, '#9e7d53');
  addRow('訂房貴賓', guestName);
  addRow('入住期間', `${checkIn} 至 ${checkOut} (${nights} 晚)`);
  addRow('包棟方案', `全區尊榮包棟・${guestCount} 位`);

  if (eventType === 'BOOKING_PENDING') {
    addRow('總住宿費', `NT$ ${Number(totalAmount).toLocaleString()}`);
    addRow('應付定金', `NT$ ${Number(depositAmount).toLocaleString()} (50%)`, true, '#c0392b');
    addRow('匯款銀行', bankCode);
    addRow('匯款帳號', bankAccount, true, '#1b1b1b');
    addRow('戶名', bankAccountName);
    addRow('保留期限', '請於下單後 24 小時內完成定金匯款並回報');
  } else if (eventType === 'PAYMENT_REPORTED') {
    addRow('應付定金', `NT$ ${Number(depositAmount).toLocaleString()}`);
    addRow('回報帳號末五碼', bankLast5, true, '#27ae60');
    addRow('對帳狀態', '管家正核對網銀入帳中，確認後將發送正式確認卡');
  } else if (eventType === 'BOOKING_CONFIRMED') {
    addRow('定金狀態', '已收到定金 NT$ ' + Number(depositAmount).toLocaleString(), true, '#2e7d32');
    addRow('入住時間', '當日 15:00 起開放入住 (退房次日 11:00)');
    addRow('行前須知', '管家將於入住日前 2 天與您聯繫確認抵達時間');
  } else if (eventType === 'BOOKING_CANCELLED') {
    let refundDesc = '無退款 (未付定金或逾規沒入)';
    if (refundStatus === 'PENDING') {
      refundDesc = `待匯退 NT$ ${Number(refundAmount).toLocaleString()}`;
    } else if (refundStatus === 'COMPLETED') {
      refundDesc = `已完成匯退 NT$ ${Number(refundAmount).toLocaleString()}`;
    }
    addRow('退款處理狀態', refundDesc, true, '#c0392b');
    if (cancelReason) {
      addRow('取消備註', cancelReason);
    }
  }

  // 組織 Footer 按鈕
  const footerContents = [];

  if (eventType === 'BOOKING_PENDING') {
    footerContents.push({
      type: 'button',
      action: {
        type: 'uri',
        label: '前往回報匯款末五碼',
        uri: lookupUrl || 'https://ann-villa.pages.dev/booking/lookup'
      },
      style: 'primary',
      color: '#9e7d53',
      height: 'sm'
    });
  } else {
    footerContents.push({
      type: 'button',
      action: {
        type: 'uri',
        label: '查看官網訂單詳細資訊',
        uri: lookupUrl || 'https://ann-villa.pages.dev/booking/lookup'
      },
      style: 'secondary',
      color: '#f0ece1',
      height: 'sm'
    });
  }

  // 小警語/管家備註
  footerContents.push({
    type: 'text',
    text: '如有任何疑問，可直接在此 LINE 對話框留言洽詢管家。',
    size: 'xxs',
    color: '#999999',
    align: 'center',
    margin: 'md',
    wrap: true
  });

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: currentTheme.bg,
      paddingTop: '16px',
      paddingBottom: '16px',
      paddingStart: '20px',
      paddingEnd: '20px',
      contents: [
        {
          type: 'text',
          text: currentTheme.title,
          weight: 'bold',
          color: '#e8c99b',
          size: 'md'
        },
        {
          type: 'text',
          text: currentTheme.sub,
          color: '#ffffffaa',
          size: 'xs',
          margin: 'xs'
        }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingTop: '20px',
      paddingBottom: '16px',
      contents: detailRows
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: footerContents
    }
  };
}

/**
 * 發送 LINE 推播訊息給指定客戶 (非阻塞容錯保護)
 * 
 * @param {object} env Cloudflare 環境變數 (包含 DB, LINE_CHANNEL_ACCESS_TOKEN)
 * @param {object} params
 * @param {string} params.bookingId 訂單編號 (例: SY-20261126-1234)
 * @param {string} params.lineUserId 旅客 LINE 專屬識別碼 (U-ID)
 * @param {'BOOKING_PENDING' | 'PAYMENT_REPORTED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'} params.eventType 事件類別
 * @param {object} params.bookingData 訂單欄位資訊
 * @param {string} [params.altText] 聊天室外預覽文字
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export async function sendLineNotification(env, { bookingId, lineUserId, eventType, bookingData = {}, altText = '' }) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;

  // 1. 檢核基本發送條件
  if (!token) {
    await recordNotificationLog(env, {
      bookingId,
      eventType,
      lineUserId: lineUserId || 'UNKNOWN',
      status: 'SKIPPED',
      httpStatus: 0,
      responseBody: '未設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數，跳過推播'
    });
    return { success: false, status: 'SKIPPED', error: 'Missing LINE_CHANNEL_ACCESS_TOKEN' };
  }

  if (!lineUserId || !lineUserId.startsWith('U')) {
    await recordNotificationLog(env, {
      bookingId,
      eventType,
      lineUserId: lineUserId || 'EMPTY',
      status: 'SKIPPED',
      httpStatus: 0,
      responseBody: '訂單尚未綁定有效的 line_user_id，跳過推播'
    });
    return { success: false, status: 'SKIPPED', error: 'Missing valid line_user_id' };
  }

  try {
    const bubble = buildFlexTemplate(eventType, {
      bookingId,
      ...bookingData
    });

    const defaultAltTexts = {
      BOOKING_PENDING: `【山語 Villa】您的預訂已送出（訂單編號: ${bookingId}），請於 24 小時內完成定金匯款。`,
      PAYMENT_REPORTED: `【山語 Villa】已收到您的匯款回報（訂單編號: ${bookingId}），管家對帳中。`,
      BOOKING_CONFIRMED: `【山語 Villa】預訂已確認！定金核銷成功（訂單編號: ${bookingId}），檔期已為您正式保留。`,
      BOOKING_CANCELLED: `【山語 Villa】預訂已取消（訂單編號: ${bookingId}），款項異動請參閱明細。`
    };

    const payload = {
      to: lineUserId,
      messages: [
        {
          type: 'flex',
          altText: altText || defaultAltTexts[eventType] || `【山語 Villa】訂單通知：${bookingId}`,
          contents: bubble
        }
      ]
    };

    // 2. 呼叫 LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text().catch(() => '');
    const isSuccess = response.ok;

    // 3. 記錄推播稽核紀錄
    await recordNotificationLog(env, {
      bookingId,
      eventType,
      lineUserId,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      httpStatus: response.status,
      responseBody: responseText.slice(0, 500)
    });

    // 4. 若成功，更新訂單最後推播時間
    if (isSuccess && env.DB) {
      await env.DB.prepare(`
        UPDATE bookings 
        SET line_notified_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(bookingId).run().catch(() => {});
    }

    return {
      success: isSuccess,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      httpStatus: response.status,
      error: isSuccess ? undefined : responseText
    };

  } catch (err) {
    // 關鍵保護：錯誤一律捕獲並記錄，絕不拋出異常中斷調用方的主流程
    await recordNotificationLog(env, {
      bookingId,
      eventType,
      lineUserId,
      status: 'FAILED',
      httpStatus: 500,
      responseBody: '推播處理例外: ' + (err.message || String(err))
    });

    return { success: false, status: 'FAILED', error: err.message };
  }
}

/**
 * 內部日誌記錄輔助函式
 */
async function recordNotificationLog(env, { bookingId, eventType, lineUserId, status, httpStatus, responseBody }) {
  if (!env || !env.DB) return;
  try {
    await env.DB.prepare(`
      INSERT INTO line_notification_logs (booking_id, event_type, line_user_id, status, http_status, response_body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      bookingId || 'UNKNOWN',
      eventType || 'UNKNOWN',
      lineUserId || 'UNKNOWN',
      status,
      httpStatus || 0,
      responseBody || null
    ).run();
  } catch (e) {
    console.error('[LINE Log Error]', e);
  }
}

/**
 * 使用 replyToken 回覆旅客訊息 (被動回覆，100% 免費，不計入 200 則月額度)
 */
export async function replyLineMessage(env, replyToken, messages) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !replyToken) return { success: false, error: 'Missing token or replyToken' };

  try {
    const payload = {
      replyToken,
      messages: Array.isArray(messages) ? messages : [messages]
    };

    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    return { success: res.ok, status: res.status };
  } catch (err) {
    console.error('[LINE Reply Error]', err);
    return { success: false, error: err.message };
  }
}

/**
 * 驗證 LINE Webhook 簽章 (HMAC-SHA256)
 */
export async function verifyLineSignature(channelSecret, bodyText, signatureHeader) {
  if (!channelSecret || !signatureHeader) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(channelSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));

    let binary = '';
    const bytes = new Uint8Array(signatureBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const computedSignature = btoa(binary);

    return computedSignature === signatureHeader;
  } catch (e) {
    console.error('[LINE Signature Verify Error]', e);
    return false;
  }
}
