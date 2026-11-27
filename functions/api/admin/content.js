/**
 * functions/api/admin/content.js
 * 
 * 山語 Villa 全站動態內容管理後台 API
 * 支援管家自主維護：
 * 1. 收款銀行帳號與官方聯絡管道 (basic_info)
 * 2. 常見問答管理 (faq)
 * 3. 最新消息與促銷活動 (news)
 * 
 * 遵守規範：
 * - 參數化綁定 env.DB.prepare(...).bind(...)
 * - 異動操作留痕寫入 admin_audit_logs
 * - 內建 ensureSiteContentTable 自我修復建表
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 確保 site_content 表與基本種子存在 (自我修復)
 */
async function ensureSiteContentTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS site_content (
        key TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title_zh TEXT NOT NULL,
        title_en TEXT,
        content_zh TEXT NOT NULL,
        content_en TEXT,
        sort_order INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_site_content_category ON site_content(category, is_active, sort_order ASC)`).run();

    // 檢查是否有種子資料
    const check = await db.prepare('SELECT COUNT(*) as cnt FROM site_content').first();
    if (!check || check.cnt === 0) {
      await db.prepare(`
        INSERT INTO site_content (key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active) VALUES
          ('bank_name', 'basic_info', '收款銀行名稱', 'Bank Name', '台灣銀行', 'Bank of Taiwan', 1, 1),
          ('bank_code', 'basic_info', '銀行代碼', 'Bank Code', '004', '004', 2, 1),
          ('bank_account', 'basic_info', '收款銀行帳號', 'Bank Account Number', '123-456-789012', '123-456-789012', 3, 1),
          ('bank_holder', 'basic_info', '戶名', 'Account Holder', '山語 Villa', 'Shan Yu Villa', 4, 1),
          ('phone', 'basic_info', '客服諮詢專線', 'Customer Service Phone', '0909-557-400', '0909-557-400', 5, 1),
          ('line_id', 'basic_info', '官方 LINE ID', 'Official LINE ID', '@209yrich', '@209yrich', 6, 1),
          ('line_url', 'basic_info', '官方 LINE 邀請連結', 'LINE Invite URL', 'https://page.line.me/209yrich', 'https://page.line.me/209yrich', 7, 1),
          ('check_in_time', 'basic_info', '入住時間 (Check-in)', 'Check-in Time', '15:00', '15:00', 8, 1),
          ('check_out_time', 'basic_info', '退房時間 (Check-out)', 'Check-out Time', '11:00', '11:00', 9, 1),
          ('deposit_amount', 'basic_info', '現場保證金 (押金)', 'Security Deposit', '3000', '3000', 10, 1),
          ('faq-01', 'faq', '平假日與國定連假的收費標準與早餐如何規定？', 'What are the pricing rules?', '【平日 (週一至週四)】：10人以下 20,000$ (含早餐)、11-14人以下 25,000$ (含早餐)、15-18人以下 30,000$ (含早餐)。【一般假日 (週五、六、日)】：35,000$ (含早餐)。【國定假日】：一律自國定假日前一天起算國定假日房價 (含早餐)，唯農曆春節過年房價不提供早餐。', '', 1, 1),
          ('faq-02', 'faq', '民宿內有提供廚房與烤肉設備嗎？收費與規範為何？', 'Do you provide kitchen and BBQ facilities?', '全棟包棟免費開放使用中島開放式廚房與戶外庭院專業美式 BBQ 烤肉爐。我們提供鍋具、餐具與基本烤肉網；食材、木炭、瓦斯罐及調味料需由貴賓自行準備。使用完畢請協助垃圾分類與器具清洗歸位。', '', 2, 1),
          ('faq-03', 'faq', '續住會主動更換毛巾或備品嗎？', 'Do you replace towels during consecutive stays?', '為實踐友善山林低碳永續理念，續住期間管家不主動進入客房更換毛巾、浴巾與床單。如需更換毛巾備品或清理垃圾，請隨時通知駐館管家為您安排。', '', 3, 1),
          ('faq-04', 'faq', '可以攜帶寵物或在園區施放煙火嗎？', 'Are pets allowed or fireworks permitted?', '全館室內嚴禁攜帶任何寵物入內。同時為維護山林生態與園區安全，園區內全面禁止施放煙火、鞭炮及仙女棒，敬請各位貴賓共同愛護山林清幽環境。', '', 4, 1),
          ('news-01', 'news', '2026 春夏包棟檔期正式開放預訂與早鳥禮遇', '2026 Spring & Summer Bookings Open', '{"date":"2026-03-15","categoryZh":"最新公告","categoryEn":"Announcement","titleZh":"2026 春夏包棟檔期正式開放預訂與早鳥禮遇","titleEn":"2026 Spring & Summer Bookings Open with Early Bird Privileges","summaryZh":"即日起預訂 2026 年 5 月至 9 月包棟住宿，即贈送苗栗在地精選迎賓茶點組及產地冷泡茶禮盒。","summaryEn":"Book your exclusive summer retreat now and receive artisan welcome tea set.","featured":true,"image":"https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80"}', '', 1, 1)
      `).run();
    }
  } catch (err) {
    console.warn('[AdminContent] ensureSiteContentTable warning:', err.message);
  }
}

function getOperatorTag(adminUser) {
  if (!adminUser) return 'admin';
  return `${adminUser.displayName || adminUser.username} (${adminUser.username || 'admin'})`;
}

/**
 * GET /api/admin/content
 * 取得全站內容管理清單
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureSiteContentTable(env.DB);

    const { results } = await env.DB.prepare(`
      SELECT key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active, updated_at
      FROM site_content
      ORDER BY category ASC, sort_order ASC, updated_at DESC
    `).all();

    const basicInfo = {};
    const faqs = [];
    const news = [];

    for (const row of (results || [])) {
      if (row.category === 'basic_info') {
        basicInfo[row.key] = row.content_zh;
      } else if (row.category === 'faq') {
        faqs.push({
          key: row.key,
          qZh: row.title_zh,
          qEn: row.title_en || '',
          aZh: row.content_zh,
          aEn: row.content_en || '',
          sortOrder: row.sort_order,
          isActive: Boolean(row.is_active),
          updatedAt: row.updated_at
        });
      } else if (row.category === 'news') {
        let details = {};
        try {
          details = JSON.parse(row.content_zh);
        } catch (e) {
          details = { summaryZh: row.content_zh };
        }
        news.push({
          key: row.key,
          date: details.date || row.updated_at?.split(' ')[0] || '',
          categoryZh: details.categoryZh || '最新公告',
          categoryEn: details.categoryEn || 'Announcement',
          titleZh: details.titleZh || row.title_zh,
          titleEn: details.titleEn || row.title_en || '',
          summaryZh: details.summaryZh || '',
          summaryEn: details.summaryEn || '',
          featured: Boolean(details.featured),
          image: details.image || '',
          sortOrder: row.sort_order,
          isActive: Boolean(row.is_active),
          updatedAt: row.updated_at
        });
      }
    }

    return Response.json({
      success: true,
      basicInfo,
      faqs,
      news
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '讀取內容失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/admin/content
 * 新增 FAQ 或最新消息
 */
export async function onRequestPost(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureSiteContentTable(env.DB);
    const body = await request.json();
    const { category, faq, newsItem } = body;

    const operator = getOperatorTag(currentAdmin);

    if (category === 'faq') {
      if (!faq || !faq.qZh || !faq.aZh) {
        return Response.json({ success: false, message: '請完整填寫常見問題題目與回答內容。' }, { status: 400, headers: CORS_HEADERS });
      }

      const key = 'faq-' + Date.now();
      const sortOrder = Number(faq.sortOrder) || 1;

      await env.DB.prepare(`
        INSERT INTO site_content (key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active)
        VALUES (?, 'faq', ?, ?, ?, ?, ?, ?)
      `).bind(
        key,
        faq.qZh.trim(),
        faq.qEn ? faq.qEn.trim() : '',
        faq.aZh.trim(),
        faq.aEn ? faq.aEn.trim() : '',
        sortOrder,
        faq.isActive !== false ? 1 : 0
      ).run();

      // 寫入審計日誌
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'CREATE_FAQ', ?, ?, ?, ?)
      `).bind(
        key,
        `新增常見問答：「${faq.qZh.trim()}」`,
        JSON.stringify(faq),
        operator
      ).run();

      return Response.json({ success: true, message: '已成功新增常見問題！', key }, { headers: CORS_HEADERS });
    }

    if (category === 'news') {
      if (!newsItem || !newsItem.titleZh || !newsItem.summaryZh) {
        return Response.json({ success: false, message: '請完整填寫消息標題與內文摘要。' }, { status: 400, headers: CORS_HEADERS });
      }

      const key = 'news-' + Date.now();
      const sortOrder = Number(newsItem.sortOrder) || 1;
      const contentJson = JSON.stringify({
        date: newsItem.date || new Date().toISOString().split('T')[0],
        categoryZh: newsItem.categoryZh || '最新公告',
        categoryEn: newsItem.categoryEn || 'Announcement',
        titleZh: newsItem.titleZh.trim(),
        titleEn: newsItem.titleEn ? newsItem.titleEn.trim() : '',
        summaryZh: newsItem.summaryZh.trim(),
        summaryEn: newsItem.summaryEn ? newsItem.summaryEn.trim() : '',
        featured: Boolean(newsItem.featured),
        image: newsItem.image || ''
      });

      await env.DB.prepare(`
        INSERT INTO site_content (key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active)
        VALUES (?, 'news', ?, ?, ?, '', ?, ?)
      `).bind(
        key,
        newsItem.titleZh.trim(),
        newsItem.titleEn ? newsItem.titleEn.trim() : '',
        contentJson,
        sortOrder,
        newsItem.isActive !== false ? 1 : 0
      ).run();

      // 寫入審計日誌
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'CREATE_NEWS', ?, ?, ?, ?)
      `).bind(
        key,
        `發布最新消息：「${newsItem.titleZh.trim()}」`,
        contentJson,
        operator
      ).run();

      return Response.json({ success: true, message: '已成功發布最新消息！', key }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '未知的分類類型。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    return Response.json({ success: false, message: '新增內容失敗: ' + err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * PATCH /api/admin/content
 * 更新基本營運資訊、FAQ 或最新消息
 */
export async function onRequestPatch(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureSiteContentTable(env.DB);
    const body = await request.json();
    const { action, basicInfo, faq, newsItem, key, isActive } = body;
    const operator = getOperatorTag(currentAdmin);

    // 1. 批量儲存基本營運資訊 (匯款銀行與聯絡資訊)
    if (action === 'update_basic_info' && basicInfo) {
      const allowedKeys = [
        'bank_name', 'bank_code', 'bank_account', 'bank_holder',
        'phone', 'line_id', 'line_url', 'check_in_time', 'check_out_time', 'deposit_amount'
      ];

      for (const k of allowedKeys) {
        if (basicInfo[k] !== undefined) {
          const val = String(basicInfo[k]).trim();
          await env.DB.prepare(`
            INSERT INTO site_content (key, category, title_zh, content_zh, updated_at)
            VALUES (?, 'basic_info', ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
              content_zh = excluded.content_zh,
              updated_at = CURRENT_TIMESTAMP
          `).bind(k, k, val).run();
        }
      }

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'UPDATE_BASIC_INFO', 'basic_info', ?, ?, ?)
      `).bind(
        `更新全站基本營運與匯款資訊：銀行（${basicInfo.bank_name || ''} ${basicInfo.bank_code || ''} ${basicInfo.bank_account || ''}），LINE（${basicInfo.line_id || ''}）`,
        JSON.stringify(basicInfo),
        operator
      ).run();

      return Response.json({ success: true, message: '基本營運與匯款資訊已成功儲存並同步至官網！' }, { headers: CORS_HEADERS });
    }

    // 2. 切換單一項目的顯示/隱藏狀態 (is_active)
    if (action === 'toggle_active' && key) {
      const target = await env.DB.prepare('SELECT key, title_zh, is_active FROM site_content WHERE key = ?').bind(key).first();
      if (!target) {
        return Response.json({ success: false, message: '找不到該項目。' }, { status: 404, headers: CORS_HEADERS });
      }

      const nextActive = isActive ? 1 : 0;
      await env.DB.prepare('UPDATE site_content SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').bind(nextActive, key).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'TOGGLE_STATUS', ?, ?, ?, ?)
      `).bind(
        key,
        `${nextActive === 1 ? '顯示發布' : '隱藏下架'}項目「${target.title_zh}」`,
        JSON.stringify({ key, isActive: Boolean(nextActive) }),
        operator
      ).run();

      return Response.json({ success: true, message: `項目已成功${nextActive === 1 ? '發布顯示' : '隱藏'}！` }, { headers: CORS_HEADERS });
    }

    // 3. 更新單一 FAQ
    if (action === 'update_faq' && faq && faq.key) {
      await env.DB.prepare(`
        UPDATE site_content
        SET title_zh = ?, title_en = ?, content_zh = ?, content_en = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `).bind(
        faq.qZh.trim(),
        faq.qEn ? faq.qEn.trim() : '',
        faq.aZh.trim(),
        faq.aEn ? faq.aEn.trim() : '',
        Number(faq.sortOrder) || 1,
        faq.isActive ? 1 : 0,
        faq.key
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'UPDATE_FAQ', ?, ?, ?, ?)
      `).bind(
        faq.key,
        `更新常見問答內容：「${faq.qZh.trim()}」`,
        JSON.stringify(faq),
        operator
      ).run();

      return Response.json({ success: true, message: '常見問題已成功更新！' }, { headers: CORS_HEADERS });
    }

    // 4. 更新單一新聞公告 (news)
    if (action === 'update_news' && newsItem && newsItem.key) {
      const contentJson = JSON.stringify({
        date: newsItem.date,
        categoryZh: newsItem.categoryZh,
        categoryEn: newsItem.categoryEn,
        titleZh: newsItem.titleZh.trim(),
        titleEn: newsItem.titleEn ? newsItem.titleEn.trim() : '',
        summaryZh: newsItem.summaryZh.trim(),
        summaryEn: newsItem.summaryEn ? newsItem.summaryEn.trim() : '',
        featured: Boolean(newsItem.featured),
        image: newsItem.image || ''
      });

      await env.DB.prepare(`
        UPDATE site_content
        SET title_zh = ?, title_en = ?, content_zh = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `).bind(
        newsItem.titleZh.trim(),
        newsItem.titleEn ? newsItem.titleEn.trim() : '',
        contentJson,
        Number(newsItem.sortOrder) || 1,
        newsItem.isActive ? 1 : 0,
        newsItem.key
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('content', 'UPDATE_NEWS', ?, ?, ?, ?)
      `).bind(
        newsItem.key,
        `更新消息公告內容：「${newsItem.titleZh.trim()}」`,
        contentJson,
        operator
      ).run();

      return Response.json({ success: true, message: '消息公告已成功更新！' }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '無效的操作指令。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    return Response.json({ success: false, message: '更新內容失敗: ' + err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * DELETE /api/admin/content
 * 刪除 FAQ 或最新消息
 */
export async function onRequestDelete(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return Response.json({ success: false, message: '缺少目標項目 key。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 查詢原項目
    const existing = await env.DB.prepare('SELECT key, category, title_zh FROM site_content WHERE key = ?').bind(key).first();
    if (!existing) {
      return Response.json({ success: false, message: '找不到欲刪除的項目。' }, { status: 404, headers: CORS_HEADERS });
    }

    // 嚴禁刪除 basic_info 核心鍵
    if (existing.category === 'basic_info') {
      return Response.json({ success: false, message: '基本營運資訊欄位不可刪除，僅可修改內容。' }, { status: 400, headers: CORS_HEADERS });
    }

    await env.DB.prepare('DELETE FROM site_content WHERE key = ?').bind(key).run();

    const operator = getOperatorTag(currentAdmin);
    await env.DB.prepare(`
      INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
      VALUES ('content', 'DELETE_CONTENT', ?, ?, ?, ?)
    `).bind(
      key,
      `刪除${existing.category === 'faq' ? '常見問答' : '消息公告'}：「${existing.title_zh}」`,
      JSON.stringify(existing),
      operator
    ).run();

    return Response.json({ success: true, message: `已成功刪除項目「${existing.title_zh}」！` }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json({ success: false, message: '刪除失敗: ' + err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
