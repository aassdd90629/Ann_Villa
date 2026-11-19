/**
 * functions/api/content.js
 * 
 * GET /api/content - 公開取得全站最新營運資訊、匯款帳號、FAQ 與最新消息
 * 
 * 核心特色：
 * 1. 優先查詢 Cloudflare D1 之 site_content 表中 is_active = 1 之動態設定
 * 2. 具備 Graceful Fallback 機制：若 D1 離線或尚未遷移，自動回傳預設高質量內容
 * 3. 雙語支援 (繁中與英文)
 */

const DEFAULT_BASIC_INFO = {
  bankName: '台灣銀行',
  bankCode: '004',
  bankAccount: '123-456-789012',
  bankHolder: '山語 Villa',
  phone: '0909-557-400',
  lineId: '@209yrich',
  lineUrl: 'https://line.me/R/ti/p/@209yrich',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  depositAmount: 3000,
  maxGuests: 18
};

const DEFAULT_FAQS = [
  {
    id: 'faq-01',
    qZh: '平假日與國定連假的收費標準與早餐如何規定？',
    qEn: 'What are the pricing rules for weekdays, weekends, consecutive holidays, and breakfast?',
    aZh: '【平日 (週一至週四)】：10人以下 20,000$ (含早餐)、11-14人以下 25,000$ (含早餐)、15-18人以下 30,000$ (含早餐)。【一般假日 (週五、六、日)】：35,000$ (含早餐)。【國定假日】：一律自國定假日前一天起算國定假日房價 (含早餐)，唯農曆春節過年房價不提供早餐。',
    aEn: 'Weekdays (Mon-Thu): <=10 guests NT$20k, 11-14 guests NT$25k, 15-18 guests NT$30k with breakfast. Weekends (Fri-Sun): NT$35k with breakfast. Consecutive holidays start from day before holiday; Lunar New Year is NT$60k without breakfast.',
    sortOrder: 1
  },
  {
    id: 'faq-02',
    qZh: '民宿內有提供廚房與烤肉設備嗎？收費與規範為何？',
    qEn: 'Do you provide kitchen and BBQ facilities? What are the charges and guidelines?',
    aZh: '全棟包棟免費開放使用中島開放式廚房與戶外庭院專業美式 BBQ 烤肉爐。我們提供鍋具、餐具與基本烤肉網；食材、木炭、瓦斯罐及調味料需由貴賓自行準備。使用完畢請協助垃圾分類與器具清洗歸位。',
    aEn: 'Yes, full villa reservations include complimentary access to our open island kitchen and outdoor premium BBQ grill. Cookware, tableware, and grill racks are provided.',
    sortOrder: 2
  },
  {
    id: 'faq-03',
    qZh: '續住會主動更換毛巾或備品嗎？',
    qEn: 'Do you automatically replace towels and toiletries during consecutive nights?',
    aZh: '為實踐友善山林低碳永續理念，續住期間管家不主動進入客房更換毛巾、浴巾與床單。如需更換毛巾備品或清理垃圾，請隨時通知駐館管家為您安排。',
    aEn: 'For eco-friendly sustainability, we do not enter rooms automatically to change linens during consecutive stays. Please notify our butler if fresh towels or trash removal are needed.',
    sortOrder: 3
  },
  {
    id: 'faq-04',
    qZh: '可以攜帶寵物或在園區施放煙火嗎？',
    qEn: 'Are pets allowed or can we set off fireworks on the property?',
    aZh: '全館室內嚴禁攜帶任何寵物入內。同時為維護山林生態與園區安全，園區內全面禁止施放煙火、鞭炮及仙女棒，敬請各位貴賓共同愛護山林清幽環境。',
    aEn: 'Pets are strictly prohibited indoors. To protect mountain wildlife and safety, all fireworks, firecrackers, and sparklers are strictly banned across the estate.',
    sortOrder: 4
  },
  {
    id: 'faq-05',
    qZh: '整棟包棟總共可以使用哪些娛樂與放鬆設施？',
    qEn: 'What entertainment and leisure amenities are included in the exclusive buyout?',
    aZh: '包棟貴賓尊享全棟 5 大主題套房，並獨享：Grand Lounge 挑高交誼大廳、百吋大螢幕專業 KTV 視聽劇院、頂級電動過山車麻將桌、戶外山景賞星茶席及星空烤肉庭院，全區無其他外客打擾。',
    aEn: 'Exclusive villa buyout includes 5 private suites, Grand Lounge, professional 100-inch KTV theater, automatic mahjong table, scenic outdoor tea pavilion, and private BBQ courtyard.',
    sortOrder: 5
  }
];

const DEFAULT_NEWS = [
  {
    id: 'news-01',
    date: '2026-03-15',
    categoryZh: '最新公告',
    categoryEn: 'Announcement',
    titleZh: '2026 春夏包棟檔期正式開放預訂與早鳥禮遇',
    titleEn: '2026 Spring & Summer Bookings Open with Early Bird Privileges',
    summaryZh: '即日起預訂 2026 年 5 月至 9 月包棟住宿，即贈送苗栗在地精選迎賓茶點組及產地冷泡茶禮盒。',
    summaryEn: 'Book your exclusive summer retreat now and receive a complimentary artisan welcome tea set and handcrafted local gift box.',
    featured: true,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    sortOrder: 1
  },
  {
    id: 'news-02',
    date: '2026-02-28',
    categoryZh: '加值服務',
    categoryEn: 'Exclusive Service',
    titleZh: '全新引進「私廚星空無菜單饗宴」尊榮訂製服務',
    titleEn: "Launching 'Private Master Chef Dining' Experience Under the Stars",
    summaryZh: '山語攜手在地頂級名廚，為包棟貴賓提供量身打造之高山山海無菜單料理晚宴。',
    summaryEn: 'Partnering with top regional chefs to deliver a bespoke dining journey showcasing premium local delicacies.',
    featured: false,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    sortOrder: 2
  },
  {
    id: 'news-03',
    date: '2026-01-10',
    categoryZh: '永續環保',
    categoryEn: 'Sustainability',
    titleZh: '山語 Villa 榮獲綠色低碳旅宿認證與全區 EV 充電升級',
    titleEn: 'Certified Green Sustainable Stay & Complete EV Charging Station Upgrade',
    summaryZh: '全區全面導入天然草本環保洗沐品與 2 座高效能充電樁，實踐人與自然和諧共生。',
    summaryEn: 'Fully integrated with eco-friendly herbal toiletries and 2 high-speed EV chargers to support sustainable luxury travel.',
    featured: false,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
    sortOrder: 3
  }
];

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const reqCategory = url.searchParams.get('category');

  const result = {
    success: true,
    basicInfo: { ...DEFAULT_BASIC_INFO },
    faq: [...DEFAULT_FAQS],
    news: [...DEFAULT_NEWS]
  };

  if (!env.DB) {
    return Response.json(result);
  }

  try {
    let query = `
      SELECT key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active
      FROM site_content
      WHERE is_active = 1
    `;
    const params = [];

    if (reqCategory) {
      query += ` AND category = ?`;
      params.push(reqCategory);
    }

    query += ` ORDER BY sort_order ASC, updated_at DESC`;

    const { results } = await env.DB.prepare(query).bind(...params).all();

    if (results && results.length > 0) {
      // 聚合 basic_info
      const basicRows = results.filter(r => r.category === 'basic_info');
      if (basicRows.length > 0) {
        for (const row of basicRows) {
          if (row.key === 'bank_name') result.basicInfo.bankName = row.content_zh;
          if (row.key === 'bank_code') result.basicInfo.bankCode = row.content_zh;
          if (row.key === 'bank_account') result.basicInfo.bankAccount = row.content_zh;
          if (row.key === 'bank_holder') result.basicInfo.bankHolder = row.content_zh;
          if (row.key === 'phone') result.basicInfo.phone = row.content_zh;
          if (row.key === 'line_id') result.basicInfo.lineId = row.content_zh;
          if (row.key === 'line_url') result.basicInfo.lineUrl = row.content_zh;
          if (row.key === 'check_in_time') result.basicInfo.checkInTime = row.content_zh;
          if (row.key === 'check_out_time') result.basicInfo.checkOutTime = row.content_zh;
          if (row.key === 'deposit_amount') result.basicInfo.depositAmount = Number(row.content_zh) || 3000;
          if (row.key === 'max_guests') result.basicInfo.maxGuests = Number(row.content_zh) || 18;
        }
      }

      // 聚合 faq
      const faqRows = results.filter(r => r.category === 'faq');
      if (faqRows.length > 0) {
        result.faq = faqRows.map(r => ({
          id: r.key,
          qZh: r.title_zh,
          qEn: r.title_en || r.title_zh,
          aZh: r.content_zh,
          aEn: r.content_en || r.content_zh,
          sortOrder: r.sort_order
        }));
      }

      // 聚合 news
      const newsRows = results.filter(r => r.category === 'news');
      if (newsRows.length > 0) {
        result.news = newsRows.map(r => {
          let extra = {};
          try {
            extra = JSON.parse(r.content_zh);
          } catch (e) {
            extra = { summaryZh: r.content_zh, summaryEn: r.content_en };
          }
          return {
            id: r.key,
            date: extra.date || r.title_zh,
            categoryZh: extra.categoryZh || '最新公告',
            categoryEn: extra.categoryEn || 'Announcement',
            titleZh: extra.titleZh || r.title_zh,
            titleEn: extra.titleEn || r.title_en || r.title_zh,
            summaryZh: extra.summaryZh || r.content_zh,
            summaryEn: extra.summaryEn || r.content_en || r.content_zh,
            featured: Boolean(extra.featured),
            image: extra.image || '',
            sortOrder: r.sort_order
          };
        });
      }
    }

    return Response.json(result);

  } catch (err) {
    console.warn('[Content API] D1 查詢異常，切換至備援預設資料:', err.message);
    return Response.json(result);
  }
}
