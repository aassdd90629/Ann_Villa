/**
 * functions/api/admin/bookings/[id]/adjustments.js
 * 
 * 訂單現場費用調整與尾款試算 API (P3 級別)
 * 支援：加人加床、烤肉清潔費、場地設備租借、折讓折扣、尾款自動試算
 * 遵守後端規範：參數化綁定、金流防竄改計算、審計日誌
 */

export async function onRequestGet(context) {
  const { params, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    // 1. 取得主訂單基本金額與狀態
    const booking = await env.DB.prepare(`
      SELECT id, total_amount, deposit_amount, deposit_status, status, guest_name, check_in, check_out
      FROM bookings WHERE id = ?
    `).bind(bookingId).first();

    if (!booking) {
      return Response.json({ success: false, message: `找不到訂單編號 ${bookingId}` }, { status: 404 });
    }

    // 2. 取得所有調整項目
    const { results } = await env.DB.prepare(`
      SELECT id, booking_id, title, amount, note, created_at, created_by
      FROM booking_adjustments
      WHERE booking_id = ?
      ORDER BY created_at ASC
    `).bind(bookingId).all();

    const adjustments = results || [];

    // 3. 計算即時匯總
    const originalTotal = Number(booking.total_amount) || 0;
    const depositAmount = Number(booking.deposit_amount) || 0;
    const totalAdjustments = adjustments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const finalTotal = Math.max(0, originalTotal + totalAdjustments);
    
    // 現場應收尾款：若定金已付 (PAID)，則扣除定金；若定金未付，尾款即為最終總額
    const paidDeposit = booking.deposit_status === 'PAID' ? depositAmount : 0;
    const balanceDue = Math.max(0, finalTotal - paidDeposit);

    return Response.json({
      success: true,
      bookingId,
      adjustments,
      summary: {
        originalTotal,
        depositAmount,
        depositStatus: booking.deposit_status,
        bookingStatus: booking.status,
        totalAdjustments,
        finalTotal,
        paidDeposit,
        balanceDue
      }
    });
  } catch (err) {
    return Response.json({ success: false, message: `查詢調整項目失敗: ${err.message}` }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { params, request, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const booking = await env.DB.prepare(`
      SELECT id, guest_name FROM bookings WHERE id = ?
    `).bind(bookingId).first();

    if (!booking) {
      return Response.json({ success: false, message: `找不到訂單編號 ${bookingId}` }, { status: 404 });
    }

    const body = await request.json();
    const { title, amount, note } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 100) : '';
    const numAmount = parseInt(amount, 10);
    const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 300) : '';

    if (!trimmedTitle) {
      return Response.json({ success: false, message: '費用調整項目名稱為必填（例如：現場加床 2 位、烤肉場地清潔費）。' }, { status: 400 });
    }

    if (isNaN(numAmount)) {
      return Response.json({ success: false, message: '調整金額必須為有效整數數值（正數為加收、負數為折讓）。' }, { status: 400 });
    }

    // 產生唯一 ID
    const adjId = `ADJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const currentAdmin = context.data?.adminUser;
    const operator = currentAdmin?.displayName || currentAdmin?.username || 'admin';

    await env.DB.prepare(`
      INSERT INTO booking_adjustments (id, booking_id, title, amount, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(adjId, bookingId, trimmedTitle, numAmount, trimmedNote, operator).run();

    // 記錄審計日誌
    try {
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('booking', 'ADD_ADJUSTMENT', ?, ?, ?, ?)
      `).bind(
        bookingId,
        `管家為訂單「${bookingId}」新增現場費用調整：${trimmedTitle}（${numAmount >= 0 ? '+' : ''}${numAmount} 元）`,
        JSON.stringify({ adjId, title: trimmedTitle, amount: numAmount, note: trimmedNote }),
        operator
      ).run();
    } catch (logErr) {
      console.warn('審計日誌寫入失敗:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '現場費用調整項目已成功新增！',
      adjustment: {
        id: adjId,
        bookingId,
        title: trimmedTitle,
        amount: numAmount,
        note: trimmedNote,
        createdBy: operator
      }
    }, { status: 201 });

  } catch (err) {
    return Response.json({ success: false, message: `新增調整項目失敗: ${err.message}` }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { params, request, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const adjId = url.searchParams.get('adjId');

    if (!adjId) {
      return Response.json({ success: false, message: '未指定欲刪除之調整項目 ID (adjId)' }, { status: 400 });
    }

    const existing = await env.DB.prepare(`
      SELECT id, title, amount FROM booking_adjustments WHERE id = ? AND booking_id = ?
    `).bind(adjId, bookingId).first();

    if (!existing) {
      return Response.json({ success: false, message: '找不到該費用調整項目或不屬於此訂單' }, { status: 404 });
    }

    await env.DB.prepare(`
      DELETE FROM booking_adjustments WHERE id = ? AND booking_id = ?
    `).bind(adjId, bookingId).run();

    // 記錄審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operator = currentAdmin?.displayName || currentAdmin?.username || 'admin';
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('booking', 'DELETE_ADJUSTMENT', ?, ?, ?, ?)
      `).bind(
        bookingId,
        `管家移除訂單「${bookingId}」現場調整項目：${existing.title}（${existing.amount >= 0 ? '+' : ''}${existing.amount} 元）`,
        JSON.stringify({ adjId, title: existing.title, amount: existing.amount }),
        operator
      ).run();
    } catch (logErr) {
      console.warn('審計日誌寫入失敗:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '費用調整項目已成功移除！'
    });

  } catch (err) {
    return Response.json({ success: false, message: `刪除調整項目失敗: ${err.message}` }, { status: 500 });
  }
}
