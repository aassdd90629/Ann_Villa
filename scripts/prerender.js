import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const publicDir = path.resolve(projectRoot, 'public');

const SITE_URL = 'https://ann-villa.pages.dev';
const BRAND_NAME = '山語 Villa';
const BRAND_TITLE = '山語 Villa 豪宅山莊包棟別墅';
const BRAND_ADDRESS = '苗栗縣卓蘭鎮景山里8鄰127-10號';
const BRAND_PHONE = '0909-557-400';
const BRAND_LINE = 'https://line.me/R/ti/p/@209yrich';

// 7 大公開核心頁面之預渲染設定與語意化骨架資料
const routes = [
  {
    path: '/',
    dir: '',
    title: '首頁 ｜ 山語 Villa 豪宅山莊包棟別墅｜頂級山林奢華隱逸',
    description: '全新完工山語 Villa 豪宅山莊包棟別墅，坐落於苗栗卓蘭山嵐雲海之間，提供 5 間獨立景觀奢華套房、無邊際山景泳池、日式石造溫泉湯屋與星空劇院，全區一日僅接待一組貴賓。',
    image: `${SITE_URL}/img/og-cover.jpg`,
    h1: '山語 Villa 豪宅山莊包棟別墅',
    tagline: '山嵐隱逸・慢活時光 ｜ 苗栗・全新完工豪宅山莊包棟',
    contentHtml: `
      <section class="seo-intro">
        <h2>苗栗頂級包棟首選・一日僅接待一組貴賓</h2>
        <p>山語 Villa 坐落於苗栗卓蘭山嵐幽境，佔地寬敞，專為家庭家族聚會、高端商務沉浸會議、求婚派對與隱逸度假打造。全區採東方靜謐留白美學，享有群山環繞的極致私密性。</p>
        <div class="seo-stats">
          <p><strong>容納人數：</strong>標準包棟 10 ~ 14 人（最多可容納 18 位貴賓，全館 5 間獨立客房）</p>
          <p><strong>設施亮點：</strong>挑高客廳、專業 KTV 歡唱系統、過山車電動麻將、智能中島餐廚、戶外庭園美式 BBQ 烤肉、景觀品茗茶席與觀星露台</p>
          <p><strong>包棟定價：</strong>平日 NT$ 20,000 起，假日 NT$ 35,000，國定連假依專案計費</p>
        </div>
      </section>
      <section class="seo-nav-guide">
        <h3>全站核心單元導覽</h3>
        <ul>
          <li><a href="/rooms">房型導覽 (5 間獨立套房規格、床型與圖集)</a></li>
          <li><a href="/facilities">園區設施 (KTV、廚房、電動麻將、烤肉區、茶席)</a></li>
          <li><a href="/packages">包棟方案與加值服務 (平日/假日價目表、食材代訂)</a></li>
          <li><a href="/rules">入住須知與 FAQ (訂房條款、定金退訂政策、生活公約)</a></li>
          <li><a href="/guide">交通指引與周邊景點 (自駕導航、私房美食與農場)</a></li>
          <li><a href="/news">最新消息與優惠 (當季專案與節慶優惠公告)</a></li>
        </ul>
      </section>
    `
  },
  {
    path: '/rooms',
    dir: 'rooms',
    title: '房型導覽 ｜ 5 間獨立客房 ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '山語 Villa 全館共 5 間獨立客房（1樓三間、2樓兩間），最多可容納 18 位貴賓。配備五星級頂級名床、獨立乾濕分離衛浴、大面採光景觀窗與全套草本洗沐備品。',
    image: `${SITE_URL}/img/room-1/room-1-01.webp`,
    h1: '房型導覽 ｜ 5 間獨立景觀奢華客房',
    tagline: '全館共 5 間獨立客房（1樓三間、2樓兩間），最多可容納 18 位貴賓，享受極致悠閒的山林包棟假期。',
    contentHtml: `
      <section class="rooms-summary">
        <article class="room-item">
          <h2>1樓 綠意四人景觀套房 (1F Garden View Quad Suite)</h2>
          <p><strong>容納人數：</strong>4 人 ｜ <strong>格局：</strong>加大雙人床 (Queen Size) x 1 + 標準雙人床 x 1，約 12 坪</p>
          <p>位於1樓無障礙便利動線，長輩小孩入住安心便利。大面採光觀景窗盡攬綠意山林晨光，獨立乾濕分離衛浴與冷暖變頻空調。</p>
        </article>
        <article class="room-item">
          <h2>1樓 晨曦雙人觀景套房 (1F Sunrise Double Suite)</h2>
          <p><strong>容納人數：</strong>2 人 ｜ <strong>格局：</strong>加大雙人床 (Queen Size) x 1，約 8 坪</p>
          <p>晨曦微光灑落的寧靜雙人客房，溫潤原木質感搭配景觀窗，享受自在放鬆的兩人靜謐時光。</p>
        </article>
        <article class="room-item">
          <h2>1樓 庭園雙人景觀套房 (1F Courtyard Double Suite)</h2>
          <p><strong>容納人數：</strong>2 人 ｜ <strong>格局：</strong>加大雙人床 (Queen Size) x 1，約 8 坪</p>
          <p>面臨庭園盎然綠意，獨立衛浴設備齊全，享受推窗即見山林的愜意假期。</p>
        </article>
        <article class="room-item">
          <h2>2樓 山嵐全景家庭六人套房 (2F Mountain Panoramic Family Suite)</h2>
          <p><strong>容納人數：</strong>6 人 ｜ <strong>格局：</strong>加大雙人床 (Queen Size) x 3，約 18 坪</p>
          <p>2樓視野開闊的超大坪數家庭套房，挑高開闊，配置 3 張雙人床與全景視野景觀窗，俯瞰卓蘭山嵐雲海。</p>
        </article>
        <article class="room-item">
          <h2>2樓 雲海雙人觀星套房 (2F Starlight Cloud View Suite)</h2>
          <p><strong>容納人數：</strong>2 ~ 4 人 ｜ <strong>格局：</strong>加大雙人床 (Queen Size) x 1 + 景觀臥榻，約 10 坪</p>
          <p>2樓視野極佳之頂級套房，夜晚坐擁無光害璀璨星空，清晨沐浴於漫漫雲海之中。</p>
        </article>
      </section>
    `
  },
  {
    path: '/facilities',
    dir: 'facilities',
    title: '園區設施 ｜ 麻將・KTV・烤肉・智能廚房・泡茶 ｜ 山語 Villa',
    description: '探索山語 Villa 頂級休閒設施：挑高客廳、專業卡拉OK歡唱系統、過山車全自動電動麻將桌、智能中島開放式廚房、戶外庭園美式 BBQ 烤肉區與景觀品茗茶席。',
    image: `${SITE_URL}/img/living-ktv/living-ktv-01.webp`,
    h1: '園區設施與休閒空間 ｜ 頂級私邸奢華體驗',
    tagline: '挑高奢華大客廳、專業KTV歡唱、電動麻將娛樂、智能中島餐廚、戶外品茗茶席與庭園BBQ烤肉，為您的包棟假期增添無盡奢華與愜意。',
    contentHtml: `
      <section class="facilities-summary">
        <article class="facility-item">
          <h2>01. 大客廳與專業卡拉OK歡唱系統</h2>
          <p>挑高寬敞的豪華大客廳，配備專業音響、大螢幕電視與最新點歌卡拉OK系統，支援多人對唱，讓歡聚之夜充滿歌聲與笑聲。</p>
          <ul><li>海量最新雲端伴唱歌單</li><li>雙支無線抗噪動圈麥克風</li><li>高傳真立體環繞音響</li><li>寬敞深座舒適真皮大沙發</li></ul>
        </article>
        <article class="facility-item">
          <h2>02. 頂級智能廚房與時尚 Mini Bar</h2>
          <p>現代化開放式智能中島廚房與高腳 Mini Bar，大型雙門冰箱、微波爐、電鍋、熱水壺及餐具一應俱全，無論料理下廚或調飲皆隨心所欲。</p>
          <ul><li>開放式智能料理中島與高腳吧台</li><li>大型雙門家用冷藏冷凍冰箱</li><li>微波爐、快煮壺、全套碗盤刀叉</li><li>精緻高腳酒杯與品飲器皿</li></ul>
        </article>
        <article class="facility-item">
          <h2>03. 頂級電動過山車麻將娛樂室</h2>
          <p>專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。</p>
          <ul><li>最新四口過山車全自動靜音洗牌機</li><li>配備兩副頂級磁吸刻字專用麻將牌</li><li>人體工學高承重透氣皮椅</li></ul>
        </article>
        <article class="facility-item">
          <h2>04. 戶外庭院專業美式 BBQ 烤肉區</h2>
          <p>寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。</p>
          <ul><li>專業級大型美式厚鋼附蓋烤肉爐</li><li>戶外獨立洗滌料理水槽與操作檯面</li><li>庭園夜間照明營造溫馨聚會氣氛</li></ul>
        </article>
        <article class="facility-item">
          <h2>05. 高山景觀品茗賞景茶席</h2>
          <p>特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山茶，沉澱心靈享受隱逸慢時光。</p>
        </article>
        <article class="facility-item">
          <h2>06. 觀景木棧露台與璀璨星夜</h2>
          <p>白天盡覽群山起伏與漫漫雲海，入夜後微光倒影輝映漫天星空，無光害夜間觀星的最佳場所。</p>
        </article>
      </section>
    `
  },
  {
    path: '/packages',
    dir: 'packages',
    title: '包棟方案與加值服務 ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '透明清楚的定價方案，全棟 5 間客房與所有公設完全獨立專屬，享有最極致的私密性。平日包棟 10 人 NT$ 20,000 起，假日 NT$ 35,000，包含早餐與全套休閒設施。',
    image: `${SITE_URL}/img/homebanner/homebanner-01.webp`,
    h1: '全館尊榮包棟方案與加值服務',
    tagline: '透明清楚的定價方案，全棟 5 間客房與所有公設完全獨立專屬，享有最極致的私密性。',
    contentHtml: `
      <section class="packages-summary">
        <h2>尊榮全包式包棟計價標準</h2>
        <div class="pricing-table">
          <p><strong>平日（週一至週四）：</strong></p>
          <ul>
            <li>10 人以下：NT$ 20,000 / 晚（含早餐）</li>
            <li>11 ~ 14 人：NT$ 25,000 / 晚（含早餐）</li>
            <li>15 ~ 18 人：NT$ 30,000 / 晚（含早餐）</li>
          </ul>
          <p><strong>一般假日（週五至週日）：</strong>NT$ 35,000 / 晚（含早餐）</p>
          <p><strong>國定連續假期：</strong>NT$ 42,000 ~ 60,000 / 晚（假日前一天起算，農曆春節等依公告）</p>
          <p><strong>現場押金：</strong>入住當日收取 NT$ 3,000 履約保證金，退房確認無損壞全額退還。</p>
        </div>
        <h3>包棟專屬免費服務</h3>
        <ul>
          <li>歡唱卡拉OK與電動麻將娛樂全天候免費尊享</li>
          <li>戶外庭園大型美式烤肉爐與備料水槽使用</li>
          <li>智能廚房設備、雙門冰箱、餐具器具全套提供</li>
          <li>24 小時貼心管家在地諮詢與行程導覽</li>
        </ul>
      </section>
    `
  },
  {
    path: '/rules',
    dir: 'rules',
    title: '入住須知與 FAQ ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '山語 Villa 包棟入住須知、生活公約與常見問答。入住時間 15:00 以後，退房時間 11:00 以前。定金退費規範遵循觀光局定型化契約辦理，室內全面禁菸。',
    image: `${SITE_URL}/img/og-cover.jpg`,
    h1: '入住須知、包棟規章與 FAQ',
    tagline: '為維護每一位住客之安全、隱私與山林清幽環境，請於預約前詳細閱讀以下規範。',
    contentHtml: `
      <section class="rules-summary">
        <h2>重要入住規章</h2>
        <ol>
          <li><strong>入住與退房：</strong>入住時間為當日 15:00 以後，退房時間為隔日 11:00 以前。延遲退房每小時酌收 NT$ 2,000 元。</li>
          <li><strong>現場押金：</strong>入住當天收取押金 NT$ 3,000 元，退房檢查設施無損後全額無息退還。</li>
          <li><strong>寵物政策：</strong>全館請勿攜帶寵物入內，維護客房無過敏原與整潔環境。</li>
          <li><strong>全面禁菸：</strong>室內空間（包含所有房間、客廳、走廊、浴廁）全面嚴禁吸菸與電子菸。</li>
          <li><strong>嚴禁煙火：</strong>為保護山林與木造建築安全，全區嚴禁施放煙火、鞭炮及仙女棒。</li>
          <li><strong>人數限制：</strong>整棟別墅最多容納 18 位貴賓，現場無加床服務，請依約定人數入住。</li>
        </ol>
        <h2>定金退款政策（遵循觀光局定型化契約）</h2>
        <ul>
          <li>住宿日 14 天前通知取消，退還已付定金 100%</li>
          <li>住宿日 10 至 13 天前通知取消，退還已付定金 70%</li>
          <li>住宿日 7 至 9 天前通知取消，退還已付定金 50%</li>
          <li>住宿日 4 至 6 天前通知取消，退還已付定金 40%</li>
          <li>住宿日 2 至 3 天前通知取消，退還已付定金 30%</li>
          <li>住宿日 1 天前通知取消，退還已付定金 20%</li>
          <li>住宿當日通知取消或未抵達，定金恕不退還</li>
        </ul>
      </section>
    `
  },
  {
    path: '/guide',
    dir: 'guide',
    title: '交通指引與周邊景點 ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '前往苗栗卓蘭山語 Villa 的自駕交通指引與周邊旅遊地圖。國道 1 號三義交流道或國道 4 號東勢端前來，鄰近鯉魚潭水庫、大湖草莓園與在地客家私房美食。',
    image: `${SITE_URL}/img/cloud-sea/cloud-sea-01.webp`,
    h1: '地理位置、交通指引與周邊推薦',
    tagline: '坐落於苗栗卓蘭山林幽境，坐擁開闊山嵐景致。便利自駕路線，輕鬆探訪周邊私房景點、溫泉名勝與客家道地美食。',
    contentHtml: `
      <section class="guide-summary">
        <h2>自駕路線指引</h2>
        <ul>
          <li><strong>國道 1 號（三義交流道下）：</strong>接台 13 線往卓蘭方向 -> 轉苗 52 線（經鯉魚潭水庫風景區）接台 3 線 -> 抵達卓蘭景山里，循山語 Villa 指標即可抵達。</li>
          <li><strong>國道 4 號（豐原/東勢端下）：</strong>沿台 3 線往石岡、東勢、卓蘭方向前行 -> 進入苗栗卓蘭景山里 -> 依指標上行即可抵達。</li>
          <li><strong>GPS 導航建議：</strong>Google 地圖直接搜尋「苗栗縣卓蘭鎮景山里8鄰127-10號」或「山語 Villa」，沿途為平整雙向柏油道路。</li>
        </ul>
        <h2>周邊推薦美食與私房景點</h2>
        <ul>
          <li><strong>苗栗大湖福菜園客家菜餐廳：</strong>道地客家風味合菜，份量澎湃、CP 值極高（建議提前預訂）。</li>
          <li><strong>大湖雲也居休閒農場：</strong>薑麻園山脈景觀農場，招牌客家定食與漫漫雲海景致。</li>
          <li><strong>卓蘭鵝肉擔：</strong>在地超人氣排隊名店，鵝肉鮮嫩多汁搭配客家傳統粄條。</li>
          <li><strong>鯉魚潭水庫風景區：</strong>車程約 15 分鐘，飽覽鋸齒堰壯闊水庫美景。</li>
        </ul>
      </section>
    `
  },
  {
    path: '/news',
    dir: 'news',
    title: '最新消息與優惠 ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '掌握山語 Villa 最新消息、早鳥包棟專案、節慶優惠公告與園區動態。全新完工頂級私邸，預約專屬山林假期。',
    image: `${SITE_URL}/img/homebanner/homebanner-02.webp`,
    h1: '最新消息、節慶優惠與公告',
    tagline: '掌握山語 Villa 最新檔期開放、早鳥限定禮遇與專案活動資訊。',
    contentHtml: `
      <section class="news-summary">
        <article class="news-item">
          <h2>全新完工開幕預約享專屬禮遇</h2>
          <p><strong>發布日期：</strong>2026 年最新公告 ｜ <strong>分類：</strong>包棟禮遇</p>
          <p>山語 Villa 全新完工盛大迎賓，凡官網直訂包棟貴賓，即贈送精選在地高山冷泡茶葉禮盒與專業 BBQ 烤肉備品組。歡迎家庭團聚與好友歡聚預約。</p>
        </article>
        <article class="news-item">
          <h2>國定連假與春節包棟檔期開放預約</h2>
          <p><strong>發布日期：</strong>檔期公告 ｜ <strong>分類：</strong>連假專案</p>
          <p>連假與特殊節慶期間每日僅接待一組貴賓，檔期席次有限，歡迎提早透過官網日曆查詢或直接聯繫 LINE 管家預約鎖房。</p>
        </article>
      </section>
    `
  },
  {
    path: '/booking-lookup',
    dir: 'booking-lookup',
    title: '訂單查詢與線上對帳 ｜ 山語 Villa 豪宅山莊包棟別墅',
    description: '山語 Villa 官方直訂貴賓訂單查詢系統。輸入手機號碼與電子信箱，即刻掌握最新檔期保留進度、定金匯款資訊與線上回報。',
    image: `${SITE_URL}/img/og-cover.jpg`,
    h1: '貴賓訂單查詢與線上對帳 ｜ 山語 Villa',
    tagline: '輸入預約時填寫的手機號碼與電子信箱，即刻掌握最新檔期保留進度、定金匯款資訊與線上回報。',
    contentHtml: `
      <section class="lookup-summary">
        <h2>官方直訂貴賓訂單查詢</h2>
        <p>山語 Villa 提供貴賓即時查詢線上預約狀態與對帳進度服務。請備妥當初預約之聯絡手機電話與電子信箱，即可隨時核對定金款項與掌握入住行前資訊。</p>
      </section>
    `
  }
];

function generateSitemapXml() {
  const today = new Date().toISOString().split('T')[0];
  const items = routes.map(r => {
    const loc = r.path === '/' ? SITE_URL : `${SITE_URL}${r.path}`;
    const priority = r.path === '/' ? '1.0' : '0.8';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function generateJsonLd(route) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: BRAND_TITLE,
    alternateName: BRAND_NAME,
    url: `${SITE_URL}${route.path === '/' ? '' : route.path}`,
    image: route.image,
    description: route.description,
    telephone: BRAND_PHONE,
    priceRange: 'NT$ 20,000 - 60,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '景山里8鄰127-10號',
      addressLocality: '卓蘭鎮',
      addressRegion: '苗栗縣',
      postalCode: '369',
      addressCountry: 'TW'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '24.3216',
      longitude: '120.8872'
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: '專業KTV歡唱系統', value: true },
      { '@type': 'LocationFeatureSpecification', name: '全自動電動麻將桌', value: true },
      { '@type': 'LocationFeatureSpecification', name: '開放式智能中島廚房', value: true },
      { '@type': 'LocationFeatureSpecification', name: '戶外美式BBQ烤肉區', value: true },
      { '@type': 'LocationFeatureSpecification', name: '無邊際景觀露台', value: true },
      { '@type': 'LocationFeatureSpecification', name: '5間獨立景觀套房', value: true }
    ],
    checkinTime: '15:00',
    checkoutTime: '11:00'
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function prerender() {
  console.log('🚀 開始執行山語 Villa 靜態預渲染 (SSG Pre-rendering)...');

  const baseHtmlPath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(baseHtmlPath)) {
    console.error('❌ 找不到 dist/index.html，請先執行 vite build！');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8');

  for (const route of routes) {
    let html = baseHtml;

    // 1. 置換 Page Title
    html = html.replace(/<title>.*?<\/title>/is, `<title>${route.title}</title>`);

    // 2. 置換或注入 Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta name="description" content=".*?" \/>/is, `<meta name="description" content="${route.description}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${route.description}" />\n</head>`);
    }

    // 3. 更新 Open Graph Tags
    const ogUrl = route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`;
    html = html.replace(/<meta property="og:url" content=".*?" \/>/is, `<meta property="og:url" content="${ogUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/is, `<meta property="og:title" content="${route.title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/is, `<meta property="og:description" content="${route.description}" />`);
    html = html.replace(/<meta property="og:image" content=".*?" \/>/is, `<meta property="og:image" content="${route.image}" />`);

    // 4. 更新 Twitter Card
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/is, `<meta name="twitter:title" content="${route.title}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/is, `<meta name="twitter:description" content="${route.description}" />`);
    html = html.replace(/<meta name="twitter:image" content=".*?" \/>/is, `<meta name="twitter:image" content="${route.image}" />`);

    // 5. 注入 Canonical 標籤與結構化資料 (JSON-LD)
    const jsonLdHtml = generateJsonLd(route);
    const seoHeadTags = `  <link rel="canonical" href="${ogUrl}" />\n  ${jsonLdHtml}\n`;
    html = html.replace('</head>', `${seoHeadTags}</head>`);

    // 6. 注入非空殼之語意化 DOM 結構至 <div id="app"> 內
    // 爬蟲無 JS 時可爬取完整文字與標題；真實瀏覽器加載 JS 後 Vue 會接管 mount
    const semanticBody = `
      <header class="prerender-header" style="padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
        <p style="font-size: 1.25rem; font-weight: bold; margin: 0;"><a href="/" style="text-decoration: none; color: inherit;">${BRAND_TITLE}</a></p>
        <nav style="margin-top: 10px; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          <a href="/">首頁</a>
          <a href="/rooms">房型導覽</a>
          <a href="/facilities">園區設施</a>
          <a href="/packages">包棟方案</a>
          <a href="/rules">入住須知</a>
          <a href="/guide">交通景點</a>
          <a href="/news">最新消息</a>
        </nav>
      </header>
      <main class="prerender-main" style="max-width: 1000px; margin: 30px auto; padding: 0 20px; line-height: 1.8;">
        <h1 style="font-size: 2rem; margin-bottom: 10px;">${route.h1}</h1>
        <p style="font-size: 1.1rem; color: #555; margin-bottom: 30px;">${route.tagline}</p>
        <div class="prerender-content">
          ${route.contentHtml}
        </div>
      </main>
      <footer class="prerender-footer" style="padding: 30px 20px; background: #f8f6f0; text-align: center; margin-top: 50px; font-size: 0.9rem; color: #666;">
        <p><strong>${BRAND_TITLE}</strong> ｜ 地址：${BRAND_ADDRESS} ｜ 客服專線：<a href="tel:${BRAND_PHONE}">${BRAND_PHONE}</a></p>
        <p>官方 LINE 諮詢：<a href="${BRAND_LINE}">${BRAND_LINE}</a> ｜ 一日僅接待一組貴賓專屬包棟</p>
        <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      </footer>
    `;

    // 置換 <div id="app"></div> 為帶有語意化內容的預渲染 DOM
    html = html.replace('<div id="app"></div>', `<div id="app">${semanticBody}</div>`);

    // 7. 寫出目標 HTML 檔案
    if (route.dir === '') {
      // 首頁覆寫 dist/index.html
      fs.writeFileSync(baseHtmlPath, html, 'utf-8');
      console.log(`  ✓ 預渲染完成: / -> dist/index.html`);
    } else {
      const targetDir = path.resolve(distDir, route.dir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const targetFile = path.resolve(targetDir, 'index.html');
      fs.writeFileSync(targetFile, html, 'utf-8');
      console.log(`  ✓ 預渲染完成: ${route.path} -> dist/${route.dir}/index.html`);
    }
  }

  // 8. 產出 sitemap.xml 到 dist/ 與 public/
  const sitemapXml = generateSitemapXml();
  fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`  ✓ 產出站點地圖: sitemap.xml -> dist/sitemap.xml & public/sitemap.xml`);

  console.log('🎉 靜態預渲染 (SSG) 與 Sitemap 生成完畢！全站 7 大頁面已具備實體爬蟲友善 HTML。');
}

prerender();
