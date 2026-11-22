/**
 * functions/api/facilities.js
 * 
 * GET /api/facilities - 公開取得所有公共休閒娛樂設施與相片圖集 (100% 資料庫驅動)
 */

const DEFAULT_FACILITIES = [
  {
    id: 'ktv-theater',
    titleZh: '大客廳與專業卡拉OK歡唱系統',
    titleEn: 'Grand Living Hall & Professional KTV System',
    descZh: '挑高寬敞的豪華大客廳，配備高階音響、大螢幕電視與最新點歌卡拉OK系統，支援多人對唱，讓您的歡聚之夜充滿歌聲與笑聲。',
    descEn: 'Soaring, spacious living hall equipped with professional acoustics, big-screen display, and the latest karaoke system with wireless microphones.',
    image: '/img/living-ktv/living-ktv-01.webp',
    featuresZh: [
      '海量最新雲端伴唱歌單',
      '雙支無線抗噪動圈麥克風',
      '高傳真立體環繞音響',
      '寬敞深座舒適真皮大沙發'
    ],
    featuresEn: [
      'Cloud-updated song catalog',
      'Dual anti-feedback wireless microphones',
      'Hi-Fi dynamic surround sound',
      'Spacious deep leather seating'
    ],
    gallery: [
      '/img/living-ktv/living-ktv-01.webp',
      '/img/living-ktv/living-ktv-03.webp',
      '/img/living-ktv/living-ktv-04.webp',
      '/img/living-ktv/living-ktv-02.webp',
      '/img/living-ktv/living-ktv-05.webp'
    ],
    sortOrder: 1
  },
  {
    id: 'smart-kitchen',
    titleZh: '頂級智能廚房與時尚 Mini Bar',
    titleEn: 'Smart Gourmet Kitchen & Mini Bar Lounge',
    descZh: '現代化開放式智能中島廚房與高腳 Mini Bar，大型雙門冰箱、微波爐、電鍋、熱水壺及餐具一應俱全，無論料理下廚或調飲皆隨心所欲。',
    descEn: 'Contemporary open-concept island kitchen and stylish high-top mini bar, equipped with large double-door refrigerator, appliances, and glassware.',
    image: '/img/kitchen-bar/kitchen-bar-06.webp',
    featuresZh: [
      '開放式智能料理中島與高腳吧台',
      '大型雙門家用冷藏冷凍冰箱',
      '微波爐、快煮壺、全套碗盤刀叉',
      '精緻高腳酒杯與品飲器皿'
    ],
    featuresEn: [
      'Smart cooking island & high bar',
      'Spacious double-door refrigerator',
      'Microwave, kettle, full cutlery sets',
      'Premium glassware & drink accessories'
    ],
    gallery: [
      '/img/kitchen-bar/kitchen-bar-06.webp',
      '/img/kitchen-bar/kitchen-bar-04.webp',
      '/img/kitchen-bar/kitchen-bar-02.webp',
      '/img/kitchen-bar/kitchen-bar-03.webp',
      '/img/kitchen-bar/kitchen-bar-05.webp'
    ],
    sortOrder: 2
  },
  {
    id: 'mahjong-room',
    titleZh: '頂級電動過山車麻將娛樂室',
    titleEn: 'Automatic Mahjong Table Experience',
    descZh: '專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。',
    descEn: 'Features the latest whisper-quiet automatic mahjong table with rapid shuffling and zero jams. Ergonomic executive chairs ensure comfortable gaming sessions.',
    image: '/img/mahjong/mahjong-01.webp',
    featuresZh: [
      '最新四口過山車全自動靜音洗牌機',
      '配備兩副頂級磁吸刻字專用麻將牌',
      '人體工學高承重透氣皮椅',
      '專屬飲料杯架與籌碼置物槽'
    ],
    featuresEn: [
      'Whisper-quiet auto-shuffling table mechanism',
      'Dual sets of weighted engraved tiles',
      'Ergonomic supportive executive seating',
      'Integrated cup holders and chip trays'
    ],
    gallery: [
      '/img/mahjong/mahjong-01.webp',
      '/img/mahjong/mahjong-02.webp',
      '/img/mahjong/mahjong-03.webp',
      '/img/mahjong/mahjong-04.webp'
    ],
    sortOrder: 3
  },
  {
    id: 'outdoor-bbq',
    titleZh: '戶外庭院專業美式 BBQ 烤肉區',
    titleEn: 'Outdoor Courtyard Premium BBQ Area',
    descZh: '寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。',
    descEn: 'Generous private courtyard featuring heavy-duty American BBQ grill, stainless food prep tables, and picnic bench seating beneath forest canopies.',
    image: '/img/bbq/bbq-01.webp',
    featuresZh: [
      '專業級大型美式厚鋼附蓋烤肉爐',
      '戶外獨立洗滌料理水槽與操作檯面',
      '庭園夜間照明營造溫馨聚會氣氛',
      '寬敞戶外休閒用餐長桌椅'
    ],
    featuresEn: [
      'Heavy-duty American barrel smoker grill',
      'Dedicated outdoor wash sink & food prep station',
      'Atmospheric ambient warm courtyard lighting',
      'Generous outdoor dining picnic tables'
    ],
    gallery: [
      '/img/bbq/bbq-01.webp',
      '/img/bbq/bbq-02.webp',
      '/img/bbq/bbq-03.webp',
      '/img/bbq/bbq-04.webp'
    ],
    sortOrder: 4
  },
  {
    id: 'tea-ceremony',
    titleZh: '高山景觀品茗賞景茶席',
    titleEn: 'Scenic Mountain Tea Tasting Lounge',
    descZh: '特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山冷泡茶或東方美人茶，沉澱心靈享受隱逸慢時光。',
    descEn: 'A tranquil space dedicated to slow tea appreciation, complete with handcrafted ceramic tea ware, overlooking panoramic mountain mists.',
    image: '/img/tea/tea-01.webp',
    featuresZh: [
      '典雅手作陶藝高山品茗茶具組',
      '專屬山景茶席座位，採光清幽恬靜',
      '附贈苗栗在地特產精選高山冷泡茶葉',
      '適合三五好友午後靜心對談'
    ],
    featuresEn: [
      'Handcrafted ceramic tea set with pot and cups',
      'Sun-drenched scenic seating with forest views',
      'Complimentary local Miaoli specialty mountain tea',
      'Perfect for mindful conversations and serene afternoons'
    ],
    gallery: [
      '/img/tea/tea-01.webp',
      '/img/tea/tea-02.webp',
      '/img/tea/tea-03.webp',
      '/img/tea/tea-04.webp'
    ],
    sortOrder: 5
  }
];

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({
        success: true,
        facilities: DEFAULT_FACILITIES
      }, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 嘗試查詢 facilities 資料表
    const { results } = await env.DB.prepare(`
      SELECT 
        id, 
        title_zh AS titleZh, 
        title_en AS titleEn,
        desc_zh AS descZh, 
        desc_en AS descEn,
        image,
        features_zh_json AS featuresZhJson,
        features_en_json AS featuresEnJson,
        gallery_json AS galleryJson,
        sort_order AS sortOrder
      FROM facilities
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `).all();

    if (!results || results.length === 0) {
      return Response.json({
        success: true,
        facilities: DEFAULT_FACILITIES
      }, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const formattedFacilities = results.map(f => {
      const defaultMatch = DEFAULT_FACILITIES.find(d => d.id === f.id) || {};
      
      let featuresZh = defaultMatch.featuresZh || [];
      if (f.featuresZhJson) {
        try { featuresZh = JSON.parse(f.featuresZhJson); } catch (e) {}
      }

      let featuresEn = defaultMatch.featuresEn || [];
      if (f.featuresEnJson) {
        try { featuresEn = JSON.parse(f.featuresEnJson); } catch (e) {}
      }

      let gallery = defaultMatch.gallery || [];
      if (f.galleryJson) {
        try { gallery = JSON.parse(f.galleryJson); } catch (e) {}
      }

      return {
        id: f.id,
        titleZh: f.titleZh || defaultMatch.titleZh,
        titleEn: f.titleEn || defaultMatch.titleEn,
        descZh: f.descZh || defaultMatch.descZh,
        descEn: f.descEn || defaultMatch.descEn,
        image: f.image || defaultMatch.image,
        featuresZh,
        featuresEn,
        gallery,
        sortOrder: f.sortOrder || defaultMatch.sortOrder || 1
      };
    });

    return Response.json({
      success: true,
      facilities: formattedFacilities
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    console.warn('[Facilities API] 讀取設施資料失敗，切換為安全預設值:', err.message);
    return Response.json({
      success: true,
      facilities: DEFAULT_FACILITIES,
      _fallback: true
    }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
