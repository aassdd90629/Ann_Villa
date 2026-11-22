import { ref } from 'vue'

const INITIAL_FACILITIES = [
  {
    id: 'ktv-theater',
    titleZh: '大客廳與專業卡拉OK歡唱系統',
    titleEn: 'Grand Living Hall & Professional KTV System',
    descZh: '挑高寬敞的豪華大客廳，配備高階音響、大螢幕電視與最新點歌卡拉OK系統，支援多人對唱，讓您的歡聚之夜充滿歌聲與笑聲。',
    descEn: 'Soaring, spacious living hall equipped with professional acoustics, big-screen display, and the latest karaoke system with wireless microphones.',
    image: '/img/living-ktv/living-ktv-01.webp',
    featuresZh: ['海量最新雲端伴唱歌單', '雙支無線抗噪動圈麥克風', '高傳真立體環繞音響', '寬敞深座舒適真皮大沙發'],
    featuresEn: ['Cloud-updated song catalog', 'Dual anti-feedback wireless microphones', 'Hi-Fi dynamic surround sound', 'Spacious deep leather seating'],
    gallery: ['/img/living-ktv/living-ktv-01.webp', '/img/living-ktv/living-ktv-03.webp', '/img/living-ktv/living-ktv-04.webp', '/img/living-ktv/living-ktv-02.webp', '/img/living-ktv/living-ktv-05.webp']
  },
  {
    id: 'smart-kitchen',
    titleZh: '頂級智能廚房與時尚 Mini Bar',
    titleEn: 'Smart Gourmet Kitchen & Mini Bar Lounge',
    descZh: '現代化開放式智能中島廚房與高腳 Mini Bar，大型雙門冰箱、微波爐、電鍋、熱水壺及餐具一應俱全，無論料理下廚或調飲皆隨心所欲。',
    descEn: 'Contemporary open-concept island kitchen and stylish high-top mini bar, equipped with large double-door refrigerator, appliances, and glassware.',
    image: '/img/kitchen-bar/kitchen-bar-06.webp',
    featuresZh: ['開放式智能料理中島與高腳吧台', '大型雙門家用冷藏冷凍冰箱', '微波爐、快煮壺、全套碗盤刀叉', '精緻高腳酒杯與品飲器皿'],
    featuresEn: ['Smart cooking island & high bar', 'Spacious double-door refrigerator', 'Microwave, kettle, full cutlery sets', 'Premium glassware & drink accessories'],
    gallery: ['/img/kitchen-bar/kitchen-bar-06.webp', '/img/kitchen-bar/kitchen-bar-04.webp', '/img/kitchen-bar/kitchen-bar-02.webp', '/img/kitchen-bar/kitchen-bar-03.webp', '/img/kitchen-bar/kitchen-bar-05.webp']
  },
  {
    id: 'mahjong-room',
    titleZh: '頂級電動過山車麻將娛樂室',
    titleEn: 'Automatic Mahjong Table Experience',
    descZh: '專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。',
    descEn: 'Features the latest whisper-quiet automatic mahjong table with rapid shuffling and zero jams. Ergonomic executive chairs ensure comfortable gaming sessions.',
    image: '/img/living-ktv/living-ktv-04.webp',
    featuresZh: ['最新四口過山車全自動靜音洗牌機', '配備兩副頂級磁吸刻字專用麻將牌', '人體工學高承重透氣皮椅', '專屬飲料杯架與籌碼置物槽'],
    featuresEn: ['Whisper-quiet auto-shuffling table mechanism', 'Dual sets of weighted engraved tiles', 'Ergonomic supportive executive seating', 'Integrated cup holders and chip trays'],
    gallery: ['/img/living-ktv/living-ktv-04.webp', '/img/living-ktv/living-ktv-02.webp', '/img/living-ktv/living-ktv-05.webp']
  },
  {
    id: 'outdoor-bbq',
    titleZh: '戶外庭院專業美式 BBQ 烤肉區',
    titleEn: 'Outdoor Courtyard Premium BBQ Area',
    descZh: '寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。',
    descEn: 'Generous private courtyard featuring heavy-duty American BBQ grill, stainless food prep tables, and picnic bench seating beneath forest canopies.',
    image: '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
    featuresZh: ['專業級大型美式厚鋼附蓋烤肉爐', '戶外獨立洗滌料理水槽與操作檯面', '庭園夜間照明營造溫馨聚會氣氛', '寬敞戶外休閒用餐長桌椅'],
    featuresEn: ['Heavy-duty American barrel smoker grill', 'Dedicated outdoor wash sink & food prep station', 'Atmospheric ambient warm courtyard lighting', 'Generous outdoor dining picnic tables'],
    gallery: ['/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp', '/img/outdoor-bbq-tea/outdoor-bbq-tea-10.webp', '/img/outdoor-bbq-tea/outdoor-bbq-tea-08.webp']
  },
  {
    id: 'tea-ceremony',
    titleZh: '高山景觀品茗賞景茶席',
    titleEn: 'Scenic Mountain Tea Tasting Lounge',
    descZh: '特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山冷泡茶或東方美人茶，沉澱心靈享受隱逸慢時光。',
    descEn: 'A tranquil space dedicated to slow tea appreciation, complete with handcrafted ceramic tea ware, overlooking panoramic mountain mists.',
    image: '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
    featuresZh: ['典雅手作陶藝高山品茗茶具組', '專屬山景茶席座位，採光清幽恬靜', '附贈苗栗在地特產精選高山冷泡茶葉', '適合三五好友午後靜心對談'],
    featuresEn: ['Handcrafted ceramic tea set with pot and cups', 'Sun-drenched scenic seating with forest views', 'Complimentary local Miaoli specialty mountain tea', 'Perfect for mindful conversations and serene afternoons'],
    gallery: ['/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp', '/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp', '/img/outdoor-bbq-tea/outdoor-bbq-tea-06.webp', '/img/outdoor-bbq-tea/outdoor-bbq-tea-02.webp']
  },
  {
    id: 'viewing-deck',
    titleZh: '觀景木棧露台與璀璨星夜',
    titleEn: 'Panoramic Viewing Deck & Starlight Terrace',
    descZh: '寬敞的戶外木棧觀景露台，白天盡覽群山起伏與漫漫雲海，入夜後微光倒影輝映漫天星空，為您營造最浪漫沉靜的山居慢活時光。',
    descEn: 'Spacious timber viewing terrace offering panoramic vistas of rolling mountains and cloud sea by day, and star-studded skies by night.',
    image: '/img/homebanner/homebanner-02.webp',
    featuresZh: ['全景開闊無遮蔽山巒視野', '戶外高架景觀木棧平台', '無光害夜間觀星與倒影氛圍', '晨曦日出與夕陽彩霞暮色'],
    featuresEn: ['Panoramic unobstructed mountain views', 'Elevated timber viewing terrace', 'Zero light pollution stargazing', 'Sunrise mist & crimson sunset twilight'],
    gallery: ['/img/homebanner/homebanner-02.webp', '/img/cloud-sea/cloud-sea-01.webp', '/img/scenery-night/scenery-night-02.webp', '/img/scenery-night/scenery-night-01.webp']
  }
]

const facilities = ref([...INITIAL_FACILITIES])
const isLoaded = ref(false)
const isLoading = ref(false)

export function useFacilities() {
  const fetchFacilities = async (force = false) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    try {
      const res = await fetch('/api/facilities')
      if (res.ok) {
        const data = await res.json()
        if (data && data.success && Array.isArray(data.facilities)) {
          facilities.value = data.facilities
          isLoaded.value = true
        }
      }
    } catch (err) {
      console.warn('[useFacilities] 載入設施失敗，使用預設值:', err)
    } finally {
      isLoading.value = false
    }
  }

  if (!isLoaded.value && !isLoading.value) {
    fetchFacilities()
  }

  return {
    facilities,
    isLoading,
    isLoaded,
    fetchFacilities
  }
}
