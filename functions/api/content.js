/**
 * functions/api/content.js
 * 
 * GET /api/content - 公開取得全站最新營運資訊、品牌識別、匯款帳號、入住政策、FAQ、最新消息與訂房權益 (100% 資料庫驅動)
 */

const DEFAULT_BASIC_INFO = {
  brandNameZh: '山語 Villa 豪宅山莊包棟別墅',
  brandNameEn: 'Shan Yu Villa Luxury Estate',
  shortNameZh: '山語 Villa',
  shortNameEn: 'Shan Yu Villa',
  sloganZh: '山嵐隱逸・慢活時光',
  sloganEn: 'Oriental Serenity & Mountain Sanctuary',
  introZh: '全新完工山語 Villa 豪宅山莊坐落於山林之間，擁有寬敞舒適的空間與開闊山景視野。適合家庭旅遊、朋友聚會及想遠離城市喧囂、享受山林悠閒慢生活的旅人。',
  introEn: 'Brand-new Shan Yu Villa luxury estate is nestled amid tranquil mountain forests with expansive panoramic views. Perfect for families, friends, and travelers seeking slow mountain living.',
  bankName: '台灣銀行',
  bankCode: '004',
  bankAccount: '123-456-789012',
  bankHolder: '山語 Villa',
  phone: '0909-557-400',
  lineId: '@209yrich',
  lineUrl: 'https://line.me/R/ti/p/@209yrich',
  lineTemplateMsg: '您好，我想洽詢山語Villa全棟包棟預約：【預計入住日期：】【人數：位（最多18人）】',
  instagram: 'villa_forfun001',
  instagramUrl: 'https://www.instagram.com/villa_forfun001/',
  airbnbUrl: 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh',
  addressZh: '369苗栗縣卓蘭鎮景山里8鄰127-10號',
  addressEn: 'No. 127-10, Neighborhood 8, Jingshan Vil., Zhuolan Township, Miaoli County 369, Taiwan',
  googleMapUrl: 'https://maps.app.goo.gl/VhxGV5h3uJwU14mG9',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  depositAmount: 3000,
  maxGuests: 18,
  roomCount: 5,
  licenseNumber: '苗栗縣合法民宿登記'
};

const DEFAULT_RULES = {
  checkInRulesZh: [
    '入住時間：當日下午 15:00 以後。如超過 18:00 以後入住，請於訂房時備註或是打電話告知，逾時恕不保留客房亦不退費。',
    '退房時間：隔日上午 11:00 以前。退房時務必交還房門鑰匙；離開房間時請先關冷氣、電源。恕不延長退房，延長一小時另酌收 NT$ 2,000 元費用。',
    '現場押金：入住當天現場需收取押金 NT$ 3,000 元，退房時經檢查無損壞、環境整理乾淨歸位，將全額退還，敬請放心。',
    '寵物規範：全館請勿攜帶寵物入內，不便之處敬請見諒。',
    '嚴禁爆竹：園區內全面禁止施放煙火、放鞭炮及仙女棒，以維護山林與公共安全。',
    '人數限制：入住當天請依約定人數入住，整棟樓最多容納 18 個人，現場無法提供加床服務。',
    '全面禁菸：本民宿嚴格適用菸害防制法，室內（包含公共空間、走廊與所有房間）全面禁止吸菸（包含傳統紙菸與電子菸）。',
    '違法行為：屋內嚴禁轟趴、吸毒、嚼檳榔、酗酒、聚賭等任何違法性行為，若經發現一律報警處理並取消住宿且不予退費。',
    '續住備品：續住之房客，民宿不主動進房更換毛巾或浴巾，如需更換備品請主動告知管家。',
    '節能安全：請勿在客房內使用非民宿提供之瓦斯爐或電磁爐等危險物品，並請隨手關燈及節約用水。',
    '保管貴重：個人貴重物品請自行妥善保管，如有遺失恕不負責，敬請見諒。',
    '物品賠償：請愛惜並勿破壞屋內傢俱與設施，退房時若經發現損壞或遺失，需照價賠償。',
    '慢生活理念：山語 Villa 豪宅山莊是個適合慢生活的清幽民宿，期盼各位貴賓能好好放鬆享受山裡的林靜和美好，並歡迎您常回來看我們。'
  ],
  checkInRulesEn: [
    'Check-in begins at 15:00. For arrivals after 18:00, please notify us in advance. Failure to notify may result in reservation cancellation without refund.',
    'Check-out is by 11:00 AM. Please return all keys and turn off AC/power upon departure. Late checkout is subject to an additional fee of NT$ 2,000 per hour.',
    'Security Deposit: A refundable deposit of NT$ 3,000 is collected upon arrival and will be fully returned upon checkout inspection and tidy return.',
    'Pets Policy: Strictly no pets allowed on the premises. Thank you for your understanding.',
    'Fireworks Policy: Fireworks, firecrackers, and sparklers are strictly prohibited on property to ensure safety.',
    'Guest Capacity: Strict maximum capacity of 18 guests. No extra bed service is available.',
    'Non-Smoking: All indoor areas (including guest rooms and shared spaces) are strictly non-smoking (including e-cigarettes / vapes).',
    'Illegal Activities: Drug use, illegal gatherings, betel nuts, excessive drinking, or gambling are strictly prohibited and will be reported to the police immediately.',
    'Multi-Night Stays: For eco-friendly hospitality, we do not automatically replace towels during consecutive nights. Please notify our butler if replacement is needed.',
    'Safety & Energy: Portable gas stoves or high-power induction cookers are not permitted inside guest rooms. Please turn off appliances when leaving.',
    'Valuables: Please keep personal valuables secure at all times. Shan Yu Villa is not liable for lost items.',
    'Property Damage: Please care for our furniture and fixtures. Any damage or loss will be charged at replacement cost.',
    'Slow Living: Shan Yu Villa is designed for tranquility and slow living. Relax, breathe in the fresh mountain air, and enjoy your stay.'
  ],
  extraGuestsZh: {
    title: '容納人數與床位規範',
    content: '整棟樓總共 5 間房間，最多容納 18 位貴賓，全館床位已達舒適上限，恕無法提供加床或超額入住服務。請於預訂時確實填寫入住總人數。'
  },
  extraGuestsEn: {
    title: 'Capacity & Bedding Policy',
    content: 'Shan Yu Villa features 5 bedrooms accommodating up to 18 guests maximum. Extra beds are not available. Please confirm exact guest counts upon reservation.'
  },
  refundPolicyZh: {
    title: '山語Villa豪宅山莊退費規定',
    items: [
      '入住前15天取消，訂金可全額退款。',
      '入住前8-14天內取消，訂金可退還一半。',
      '入住前7 天內取消，訂金則不退還。'
    ]
  },
  refundPolicyEn: {
    title: 'Shan Yu Villa Cancellation & Refund Policy',
    items: [
      'Cancellations made 15 days or more prior to check-in: 100% full deposit refund.',
      'Cancellations made 8–14 days prior to check-in: 50% deposit refund.',
      'Cancellations made within 7 days prior to check-in: Deposit is non-refundable.'
    ]
  }
};

const DEFAULT_CHANNELS = {
  directBooking: {
    enabled: true,
    lineUrl: 'https://line.me/R/ti/p/@209yrich',
    lineId: '@209yrich',
    phone: '0909-557-400',
    perksZh: [
      '官網直訂免收平台手續費，享有最即時彈性檔期協調',
      '享有全棟 5 間房完整私密包棟使用權',
      '免費使用電動麻將桌、KTV歡唱、庭園烤肉爐與智能廚房',
      '全天候 24 小時專屬管家貼心諮詢支援'
    ],
    perksEn: [
      'Direct booking with zero third-party commission and flexible scheduling',
      'Exclusive private access to all 5 guest suites across two floors',
      'Complimentary access to auto-mahjong, KTV, BBQ grill & smart kitchen',
      '24-Hour dedicated concierge & butler support'
    ]
  },
  otaPlatforms: [
    {
      id: 'airbnb',
      name: 'Airbnb',
      badgeZh: '超讚房東嚴選房源',
      badgeEn: 'Superhost Selection',
      taglineZh: '山語 Villa 官方 Airbnb 認證預約頁面',
      taglineEn: 'Official Airbnb Listing for Shan Yu Villa',
      url: 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh',
      status: 'active'
    }
  ]
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
    titleZh: '山語 Villa 榮獲低碳綠色旅宿認證',
    titleEn: 'Shan Yu Villa Certified as Eco-Friendly Low Carbon Retreat',
    summaryZh: '全館採用高規格環保沐浴備品，響應不主動提供一次性備品，共同守護卓蘭翠綠山林生態。',
    summaryEn: 'Embracing organic botanical amenities and zero-plastic policies to protect regional biodiversity.',
    featured: false,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80',
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
    news: [...DEFAULT_NEWS],
    rules: { ...DEFAULT_RULES },
    channels: { ...DEFAULT_CHANNELS }
  };

  if (!env || !env.DB) {
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
          if (row.key === 'brand_name') {
            result.basicInfo.brandNameZh = row.content_zh;
            if (row.content_en) result.basicInfo.brandNameEn = row.content_en;
          }
          if (row.key === 'short_name') {
            result.basicInfo.shortNameZh = row.content_zh;
            if (row.content_en) result.basicInfo.shortNameEn = row.content_en;
          }
          if (row.key === 'slogan') {
            result.basicInfo.sloganZh = row.content_zh;
            if (row.content_en) result.basicInfo.sloganEn = row.content_en;
          }
          if (row.key === 'intro') {
            result.basicInfo.introZh = row.content_zh;
            if (row.content_en) result.basicInfo.introEn = row.content_en;
          }
          if (row.key === 'address') {
            result.basicInfo.addressZh = row.content_zh;
            if (row.content_en) result.basicInfo.addressEn = row.content_en;
          }
          if (row.key === 'google_map_url') result.basicInfo.googleMapUrl = row.content_zh;
          if (row.key === 'instagram') result.basicInfo.instagram = row.content_zh;
          if (row.key === 'instagram_url') result.basicInfo.instagramUrl = row.content_zh;
          if (row.key === 'airbnb_url') result.basicInfo.airbnbUrl = row.content_zh;
          if (row.key === 'license_number') result.basicInfo.licenseNumber = row.content_zh;
          if (row.key === 'room_count') result.basicInfo.roomCount = Number(row.content_zh) || 5;

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

      // 聚合 policies (rules)
      const policyRows = results.filter(r => r.category === 'policies');
      if (policyRows.length > 0) {
        for (const row of policyRows) {
          if (row.key === 'policies_checkin_rules') {
            try {
              if (row.content_zh) result.rules.checkInRulesZh = JSON.parse(row.content_zh);
              if (row.content_en) result.rules.checkInRulesEn = JSON.parse(row.content_en);
            } catch (e) {}
          }
          if (row.key === 'policies_refund_rules') {
            try {
              const data = JSON.parse(row.content_zh);
              if (data.titleZh) result.rules.refundPolicyZh = { title: data.titleZh, items: data.itemsZh || [] };
              if (data.titleEn) result.rules.refundPolicyEn = { title: data.titleEn, items: data.itemsEn || [] };
            } catch (e) {}
          }
          if (row.key === 'policies_extraguests_rules') {
            try {
              const data = JSON.parse(row.content_zh);
              if (data.titleZh) result.rules.extraGuestsZh = { title: data.titleZh, content: data.contentZh };
              if (data.titleEn) result.rules.extraGuestsEn = { title: data.titleEn, content: data.contentEn };
            } catch (e) {}
          }
        }
      }

      // 聚合 channels
      const channelRows = results.filter(r => r.category === 'channels');
      if (channelRows.length > 0) {
        for (const row of channelRows) {
          if (row.key === 'channels_direct_perks') {
            try {
              if (row.content_zh) result.channels.directBooking.perksZh = JSON.parse(row.content_zh);
              if (row.content_en) result.channels.directBooking.perksEn = JSON.parse(row.content_en);
            } catch (e) {}
          }
          if (row.key === 'channels_ota_list') {
            try {
              if (row.content_zh) result.channels.otaPlatforms = JSON.parse(row.content_zh);
            } catch (e) {}
          }
        }
      }
    }

    return Response.json(result, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (err) {
    console.warn('[Content API] D1 查詢異常，切換至備援預設資料:', err.message);
    return Response.json(result, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
