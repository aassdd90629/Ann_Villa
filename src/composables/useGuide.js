import { ref } from 'vue'

const INITIAL_GUIDE = {
  transportation: {
    byCarZh: [
      '國道 1 號（三義交流道下）：接台 13 線往卓蘭方向 -> 轉苗 52 線（經鯉魚潭水庫風景區）接台 3 線 -> 抵達卓蘭景山里，循山語 Villa 指標即可抵達。',
      '國道 4 號（豐原/東勢端下）：沿台 3 線往石岡、東勢、卓蘭方向前行 -> 進入苗栗卓蘭景山里 -> 依指標上行即可抵達。',
      '導航定位建議：Google 地圖搜尋「苗栗縣卓蘭鎮景山里8鄰127-10號」或「山語 Villa」，沿途均為平整雙向柏油道路，行車順暢安全。'
    ],
    byCarEn: [
      'Via National Freeway 1 (Sanyi Interchange): Take Provincial Hwy 13 toward Zhuolan -> Connect to Miaoli Route 52 (via Liyutan Reservoir) to Hwy 3 -> Follow Shan Yu Villa signs.',
      'Via National Freeway 4 (Fengyuan/Dongshi End): Follow Provincial Hwy 3 toward Shigang, Dongshi, and Zhuolan -> Enter Jingshan Village, Zhuolan Township.',
      "GPS Navigation: Search for 'Shan Yu Villa' or 'No. 127-10, Neighborhood 8, Jingshan Vil., Zhuolan Township, Miaoli'. Roads are paved and safe for all standard passenger vehicles."
    ],
    byPublicZh: '搭乘高鐵至「苗栗站」或「台中站」，轉乘計程車或自駕租車前往苗栗卓蘭山語 Villa；亦可提前向管家諮詢推薦在地專車接駁服務。',
    byPublicEn: 'Take Taiwan High Speed Rail to Miaoli or Taichung Station, then transfer via taxi or rental car to Zhuolan, Miaoli. Concierge driver coordination is available upon prior request.'
  },
  dining: [
    {
      id: 'fucai-yuan',
      nameZh: '苗栗大湖福菜園客家菜餐廳',
      nameEn: 'Miaoli Dahu Fucaiyuan Hakka Restaurant',
      locationZh: '苗栗縣大湖鄉',
      locationEn: 'Dahu Township, Miaoli',
      tagZh: '合菜預約制・CP值極高',
      tagEn: 'Set Table Pre-booking · High Value',
      descZh: '道地客家風味餐廳。一桌型的菜要預先預定才有，特別推薦 6,800 元桌菜，份量澎湃、CP 值極高（如果要訂兩桌以上需預付 2,000 元訂金）；亦有 1,500 ~ 3,000 元合菜可供選擇。',
      descEn: 'Authentic Hakka banquet restaurant. Pre-booking required for table set menus. The NT$ 6,800 set menu offers incredible value (NT$ 2,000 deposit required for 2+ tables); 1,500-3,000 options also available.',
      parking: true,
      noticeZh: '一桌型菜需事先預訂；訂兩桌以上需先預付 2,000 元訂金',
      noticeEn: 'Pre-booking required; NT$ 2,000 deposit for 2+ tables',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'yun-ye-ju',
      nameZh: '苗栗縣大湖鄉 雲也居休閒農場',
      nameEn: 'Dahu Yun Ye Ju Leisure Farm',
      locationZh: '苗栗縣大湖鄉',
      locationEn: 'Dahu Township, Miaoli',
      tagZh: '招牌定食・雲海景致',
      tagEn: 'Signature Set Meals · Mountain Vista',
      descZh: '坐落於薑麻園山脈之上的景觀農場餐廳，主打精緻美味的特色定食與客家家常料理，飽覽晨昏壯闊雲霧。座位熱門，強烈建議事先電話預約。',
      descEn: 'Scenic farm restaurant on the Jiangmayuan ridge, famous for flavorful farm-to-table set meals and sweeping cloud views. Advance phone reservation is highly recommended.',
      parking: true,
      noticeZh: '主打精緻定食，最好事先電話預約',
      noticeEn: 'Specializes in set meals; advance phone booking advised',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'zhuolan-goose-dan',
      nameZh: '苗栗縣卓蘭鎮 鵝肉擔',
      nameEn: 'Zhuolan Goose Dan Restaurant',
      locationZh: '苗栗縣卓蘭鎮',
      locationEn: 'Zhuolan Township, Miaoli',
      tagZh: '鮮嫩多汁・在地超人氣老店',
      tagEn: 'Juicy Tender Goose · Local Favorite',
      descZh: '卓蘭鎮上遠近馳名的老字號排隊美食！鵝肉鮮嫩多汁肉質甘甜，搭配特製沾醬與客家傳統粄條，深受在地人與外地饕客推崇喜愛。',
      descEn: 'Legendary local eatery in downtown Zhuolan famous for tender, succulent goose meat paired with signature herbal dip and Hakka flat rice noodles.',
      parking: true,
      noticeZh: '假日排隊人潮眾多，建議提早前往或先電話洽詢',
      noticeEn: 'Peak weekend queues; early arrival recommended',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'chuan-ji-breeze',
      nameZh: '苗栗縣大湖鄉 穿龍豆腐坊',
      nameEn: 'Chuanlong Tofu Workshop',
      locationZh: '苗栗縣大湖鄉',
      locationEn: 'Dahu Township, Miaoli',
      tagZh: '古法鹽鹵・有機天然豆香',
      tagEn: 'Traditional Nigari Tofu · Organic Soy',
      descZh: '座落於老圳水畔的特色豆腐手作工坊，堅持以本土非基改有機黃豆與傳統天然鹽鹵手工凝固，豆漿與豆花口感濃醇香綿，是不可錯過的純樸好滋味。',
      descEn: 'Artisan tofu workshop perched over an old stone canal, handcrafted using local non-GMO beans and natural seawater nigari. Renowned for velvety soy milk.',
      parking: true,
      noticeZh: '每週二公休，每日新鮮限量供應賣完為止',
      noticeEn: 'Closed Tuesdays; daily batches sold until sold out',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'vilavilla-dining',
      nameZh: '苗栗卓蘭 魔法莊園 Vilavilla 景觀餐廳',
      nameEn: 'Vilavilla Fantasy Garden Restaurant',
      locationZh: '苗栗縣卓蘭鎮',
      locationEn: 'Zhuolan Township, Miaoli',
      tagZh: '精緻排餐・花園景觀',
      tagEn: 'Gourmet Steaks · Fairy Garden Views',
      descZh: '隱身於綠意森林中的歐風庭園莊園，提供精緻義大利麵、主廚特選排餐與手作花果下午茶，環境夢幻優雅，極具異國情調。',
      descEn: 'European fairytale garden estate offering artisanal pastas, steaks, and botanical afternoon tea amidst manicured floral woods.',
      parking: true,
      noticeZh: '入園需購買門票（可折抵餐飲消費）',
      noticeEn: 'Admission ticket required; partially redeemable for dining',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80'
    }
  ],
  attractions: [
    {
      id: 'grand-canyon',
      nameZh: '卓蘭大峽谷（大安溪峽谷）',
      nameEn: 'Zhuolan Grand Canyon (Da-an River Canyon)',
      locationZh: '苗栗縣卓蘭鎮景山里',
      locationEn: 'Jingshan Vil., Zhuolan Township',
      tagZh: '自然奇景・地質景觀',
      tagEn: 'Natural Wonder · Geological Landscape',
      descZh: '因 921 地震與雨水沖刷而自然形成的地質奇觀，氣勢磅礴的大安溪兩側裸露出層次分明的砂頁岩層，鬼斧神工宛如縮小版的大峽谷。',
      descEn: 'A striking geological formation carved by the Da-an River after the 921 earthquake. Grand layered sedimentary rocks resemble a miniature grand canyon.',
      parking: true,
      noticeZh: '雨季及颱風過後溪水湍急請勿靠近水邊，注意防曬與步道行走安全',
      noticeEn: 'Exercise caution along riverbanks; wear sunscreen and sturdy walking shoes',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'jiangmayuan-trail',
      nameZh: '大湖薑麻園休閒農業區・聖衡宮步道',
      nameEn: 'Dahu Jiangmayuan Trail & Shengheng Temple',
      locationZh: '苗栗縣大湖鄉栗林村',
      locationEn: 'Lilin Vil., Dahu Township',
      tagZh: '高山雲海・雲霧仙境步道',
      tagEn: 'Sea of Clouds · Misty Ridge Trails',
      descZh: '海拔約 800 公尺的薑麻園是全台著名的賞雲海聖地。漫步於聖衡宮觀景台與出關步道，秋冬春季極易遇見翻騰奔流的波瀾雲海與金黃夕陽。',
      descEn: 'Perched at 800m elevation, Jiangmayuan is world-class for cloud seas. Stroll the Chuguan Trail to witness breathtaking golden sunsets.',
      parking: true,
      noticeZh: '清晨與傍晚為觀賞雲海最佳黃金時段，山區氣溫偏低請備薄外套',
      noticeEn: 'Dawn and dusk are optimal for cloud seas; bring a light warm jacket',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'liyutan-reservoir',
      nameZh: '鯉魚潭水庫風景區・鋸齒堰',
      nameEn: 'Liyutan Reservoir Scenic Area & Serrated Weir',
      locationZh: '苗栗縣三義鄉與卓蘭鎮交界',
      locationEn: 'Border of Sanyi & Zhuolan',
      tagZh: '全台唯一鋸齒堰・水庫湖景',
      tagEn: 'Unique Serrated Spillway · Serene Lake',
      descZh: '全台灣唯一的鋸齒狀自然溢洪堰，湖面波光粼粼被翠綠青山環繞，沿途設有平緩好走的觀景步道與綠草如茵的野餐休憩區。',
      descEn: "Taiwan's only serrated natural overflow spillway. Glistening emerald waters framed by mountain peaks provide scenic walking trails and picnic spots.",
      parking: true,
      noticeZh: '免門票入園，設有大型免費停車場與洗手間',
      noticeEn: 'Free admission; spacious parking lot and restrooms available',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'dahu-strawberry-orchards',
      nameZh: '大湖草莓觀光果園群',
      nameEn: 'Dahu Strawberry Tourist Orchards',
      locationZh: '苗栗縣大湖鄉台 3 線沿線',
      locationEn: 'Provincial Hwy 3, Dahu Township',
      tagZh: '產季採果・親子同樂',
      tagEn: 'Seasonal Picking · Family Friendly',
      descZh: '每年 11 月至翌年 4 月為大湖草莓盛產季，沿著台 3 線兩側有眾多高架或地植無毒有機草莓園，享受親手現採香甜草莓的滿滿樂趣。',
      descEn: 'From November through April, the world-famous Dahu strawberry harvest fills the valley. Pick fresh fragrant strawberries in sunlit orchards.',
      parking: true,
      noticeZh: '各果園收費標準採秤斤計費，建議下田前先詢問當日價格',
      noticeEn: 'Priced by weight; ask individual orchards for current daily rates',
      image: 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'flower-home',
      nameZh: '花露休閒農場 Flower Home',
      nameEn: 'Flower Home Leisure Farm',
      locationZh: '苗栗縣卓蘭鎮西坪里',
      locationEn: 'Xiping Vil., Zhuolan Township',
      tagZh: '繡球花季・波波草・香草精油',
      tagEn: 'Hydrangeas · Kochia Fields · Essential Oils',
      descZh: '以繽紛花卉與精油芳療聞名全台的休閒農場，四季皆有主題花季盛開（繡球花、波波草、薰衣草），園區優美宛如莫內花園。',
      descEn: 'Acclaimed botanical garden farm renowned for seasonal flower blooms (hydrangeas, lavender, kochia), essential oil spa, and romantic garden paths.',
      parking: true,
      noticeZh: '入園門票可部分折抵園內各項消費與下午茶',
      noticeEn: 'Admission tickets redeemable against farm retail and tea café',
      image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1000&q=80'
    }
  ]
}

// 預設保持純空容器，寫死資料保留常數但不引用，100% 透過 /api/guide 資料庫驅動
const guide = ref({
  transportation: INITIAL_GUIDE.transportation,
  categories: [],
  items: [],
  attractions: [],
  dining: []
})

const isLoaded = ref(false)
const isLoading = ref(false)

export function useGuide() {
  const fetchGuide = async (force = false) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    try {
      const res = await fetch('/api/guide')
      if (res.ok) {
        const data = await res.json()
        if (data && data.success && data.guide) {
          guide.value = {
            transportation: data.guide.transportation || INITIAL_GUIDE.transportation,
            categories: data.guide.categories || [],
            items: data.guide.items || [],
            attractions: data.guide.attractions || [],
            dining: data.guide.dining || []
          }
          isLoaded.value = true
        }
      }
    } catch (err) {
      console.warn('[useGuide] 載入導覽失敗:', err)
    } finally {
      isLoading.value = false
    }
  }

  if (!isLoaded.value && !isLoading.value) {
    fetchGuide()
  }

  return {
    guide,
    isLoading,
    isLoaded,
    fetchGuide
  }
}
