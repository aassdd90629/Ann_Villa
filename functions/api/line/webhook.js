import { verifyLineSignature, replyLineMessage, buildFlexTemplate } from '../_line.js';

/**
 * POST /api/line/webhook - LINE 官方帳號 Webhook 接收端點
 * 
 * 支援功能：
 * 1. 簽章安全核驗 (x-line-signature + HMAC-SHA256)
 * 2. 加好友歡迎訊息 (follow 事件)：自動以 replyToken (0成本) 回覆歡迎詞與綁定教學
 * 3. 聊天室輸入「綁定 訂單編號」(途徑 B)：自動核對並綁定 line_user_id，即時回覆最新狀態卡片
 * 4. 聊天室輸入「查詢訂單」：自動回覆該用戶名下最新預訂進度
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const signature = request.headers.get('x-line-signature') || '';
    const rawBody = await request.text().catch(() => '');

    // 1. 若配置了 LINE_CHANNEL_SECRET，執行嚴格簽章校驗
    if (env.LINE_CHANNEL_SECRET) {
      const isValid = await verifyLineSignature(env.LINE_CHANNEL_SECRET, rawBody, signature);
      if (!isValid) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const events = payload.events || [];

    for (const event of events) {
      const replyToken = event.replyToken;
      const userId = event.source?.userId;

      // 事件 A：加入好友 (follow)
      if (event.type === 'follow') {
        const welcomeText = 
          '您好，歡迎加入【山語 Villa 官方 LINE】🌲\n\n' +
          '我們提供全自動訂單通知服務，若您已在官網完成線上預約，您可以直接在對話框輸入：\n' +
          '👉「綁定 您的訂單編號」（例如：綁定 SY-20261126-1234）\n\n' +
          '系統將自動連動，日後預訂確認、定金入帳與退款進度皆會即時推播給您。\n' +
          '如有包棟、包車或專案活動需求，亦可直接在此留言，管家將儘速為您服務！';

        if (replyToken) {
          await replyLineMessage(env, replyToken, {
            type: 'text',
            text: welcomeText
          });
        }
      }

      // 事件 B：收到使用者文字訊息 (message)
      else if (event.type === 'message' && event.message?.type === 'text') {
        const userText = String(event.message.text || '').trim();

        // 檢查是否為「綁定 訂單編號」指令
        const bindMatch = userText.match(/^(?:綁定|bind)\s*[:：]?\s*([A-Za-z0-9-]+)/i);

        if (bindMatch && bindMatch[1]) {
          const bookingId = bindMatch[1].trim().toUpperCase();

          if (!env.DB) {
            if (replyToken) {
              await replyLineMessage(env, replyToken, { type: 'text', text: '系統資料庫維護中，請稍後再試。' });
            }
            continue;
          }

          // 查詢訂單
          const booking = await env.DB.prepare(`
            SELECT 
              id, room_id, guest_name, guest_phone, guest_email, guest_count,
              check_in, check_out, nights, total_amount, deposit_amount, deposit_status,
              status, bank_last_5, refund_amount, refund_status, cancel_reason_note
            FROM bookings 
            WHERE UPPER(id) = ?
          `).bind(bookingId).first();

          if (!booking) {
            if (replyToken) {
              await replyLineMessage(env, replyToken, {
                type: 'text',
                text: `抱歉，系統找不到訂單編號「${bookingId}」，請確認編號是否正確（格式範例：SY-20261126-1234）。`
              });
            }
            continue;
          }

          // 更新 line_user_id
          await env.DB.prepare(`
            UPDATE bookings 
            SET line_user_id = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(userId, booking.id).run();

          // 依據當前狀態產生卡片
          let eventType = 'BOOKING_PENDING';
          if (booking.status === 'CANCELLED') eventType = 'BOOKING_CANCELLED';
          else if (booking.deposit_status === 'PAID') eventType = 'BOOKING_CONFIRMED';
          else if (booking.bank_last_5) eventType = 'PAYMENT_REPORTED';

          const bubble = buildFlexTemplate(eventType, {
            bookingId: booking.id,
            guestName: booking.guest_name,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: booking.nights,
            guestCount: booking.guest_count,
            totalAmount: booking.total_amount,
            depositAmount: booking.deposit_amount,
            bankLast5: booking.bank_last_5 || '',
            refundAmount: booking.refund_amount || 0,
            refundStatus: booking.refund_status || 'NONE',
            cancelReason: booking.cancel_reason_note || ''
          });

          if (replyToken) {
            await replyLineMessage(env, replyToken, [
              {
                type: 'text',
                text: `✅ 訂單【${booking.id}】已成功綁定！往後您將在此聊天室即時收到定金核銷、行前提醒與異動通知。`
              },
              {
                type: 'flex',
                altText: `【山語 Villa】您的訂單進度：${booking.id}`,
                contents: bubble
              }
            ]);
          }
        }

        // 檢查是否為「查詢訂單」指令
        else if (/^(?:查詢訂單|查訂單|我的訂單)/i.test(userText)) {
          if (!env.DB) continue;

          const booking = await env.DB.prepare(`
            SELECT 
              id, room_id, guest_name, guest_phone, guest_email, guest_count,
              check_in, check_out, nights, total_amount, deposit_amount, deposit_status,
              status, bank_last_5, refund_amount, refund_status, cancel_reason_note
            FROM bookings 
            WHERE line_user_id = ?
            ORDER BY created_at DESC 
            LIMIT 1
          `).bind(userId).first();

          if (!booking) {
            if (replyToken) {
              await replyLineMessage(env, replyToken, {
                type: 'text',
                text: '您目前尚未綁定任何訂單。如需綁定，請輸入「綁定 您的訂單編號」（例如：綁定 SY-20261126-1234）。'
              });
            }
            continue;
          }

          let eventType = 'BOOKING_PENDING';
          if (booking.status === 'CANCELLED') eventType = 'BOOKING_CANCELLED';
          else if (booking.deposit_status === 'PAID') eventType = 'BOOKING_CONFIRMED';
          else if (booking.bank_last_5) eventType = 'PAYMENT_REPORTED';

          const bubble = buildFlexTemplate(eventType, {
            bookingId: booking.id,
            guestName: booking.guest_name,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: booking.nights,
            guestCount: booking.guest_count,
            totalAmount: booking.total_amount,
            depositAmount: booking.deposit_amount,
            bankLast5: booking.bank_last_5 || '',
            refundAmount: booking.refund_amount || 0,
            refundStatus: booking.refund_status || 'NONE',
            cancelReason: booking.cancel_reason_note || ''
          });

          if (replyToken) {
            await replyLineMessage(env, replyToken, {
              type: 'flex',
              altText: `【山語 Villa】您的最新訂單狀態：${booking.id}`,
              contents: bubble
            });
          }
        }
      }
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[LINE Webhook Handler Error]', err);
    return new Response('OK', { status: 200 }); // LINE Webhook 規範回傳 200 避免重試洪峰
  }
}
