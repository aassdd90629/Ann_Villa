# 山語 Villa 頂級形象官網｜前端開發規範與技術規格書 (Specification)

> 本規格書依據 [民宿網站建置需求訪談確認書.md](file:///d:/hotel/民宿網站建置需求訪談確認書.md) 制定，作為前端開發、設計系統、資料結構與 CMS 整合之統一技術依歸。

---

## 一、 設計系統規範 (Design System Tokens)

以「虹夕諾雅 谷關」與「里奧東方 The O Group」為標竿，貫徹**「東方靜謐留白美學」**與**「山林奢華沉浸感」**。

### 1. 色彩規範 (Color Palette)

| 語意變數 | 淺色模式 (Light Mode - 晨曦雲霧) | 深色模式 (Dark Mode - 靜謐夜景) | 應用情境 |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#F8F6F0` (柔和象牙白) | `#121415` (深邃玄武岩黑) | 全站主背景 |
| `--bg-card` | `#FFFFFF` (純白) | `#1A1E1F` (炭木沉穩黑) | 卡片容器、導航列背景 |
| `--text-primary` | `#1A1E1F` (深岩灰) | `#F8F6F0` (晨曦米白) | 一級主標題、核心文案 |
| `--text-sub` | `#555047` (暖茶褐) | `#B8B3A8` (冷杉霧灰) | 二級說明、副標題、文章內文 |
| `--text-muted` | `#8C857B` (淺暖灰) | `#736D65` (沉木暗灰) | 備註說明、次要標籤、時間 |
| `--gold-primary` | `#C5A880` (流金原色) | `#D4BC9B` (夜光暖金) | 品牌標準色、強調標籤、重點字 |
| `--gold-light` | `#E6D5BE` (晨曦香檳金) | `#EADBC8` (高光香檳) | 懸浮高亮、細邊框微光 |
| `--gold-dark` | `#91754F` (古銅深金) | `#B59972` (沉金) | 按鈕 Active 狀態、重度強調 |
| `--border-color` | `rgba(226, 220, 206, 0.6)` | `rgba(255, 255, 255, 0.1)` | 模組分割線、細緻邊框 | 

### 2. 字體與排版系統 (Typography)

* **英文字體 (Display Font)**：`'Cormorant Garamond', Georgia, serif` —— 展現優雅頂級古典美感。
* **中文字體 (Title & Heading)**：`'Noto Serif TC', serif` (思源宋體) —— 傳遞東方書卷與山水隱逸韻味。
* **正文字體 (Body Text)**：`'Noto Sans TC', sans-serif` (思源黑體) —— 保證手機與各裝置上的極致易讀性。
* **排版規範**：
  - 標題字元間距（Letter Spacing）：`0.05em ~ 0.15em`（留白呼吸感）。
  - 行高（Line Height）：大標題 `1.3`，正文段落 `1.85 ~ 2.0`。
  - 網格留白：大區塊間距（Section Padding）桌面端 `120px ~ 160px`，手機端 `60px ~ 80px`。

### 3. 微動態與轉場規範 (Micro-interactions)

- **主題切換**：`transition: background-color 0.4s ease, color 0.4s ease`，實現無閃爍平滑切換。
- **視差與滾動淡入**：區塊進場統一使用 `cubic-bezier(0.16, 1, 0.3, 1)` 平滑緩動。
- **圖片互動**：懸浮時 `transform: scale(1.04)`，過渡時間 `0.8s ease-out`。

---

## 二、 頁面架構與路由規劃 (Routing)

系統共分為 **7 大核心頁面模組**，採 SPA + 靜態預渲染架構：

```text
/                      --> 首頁 (Home)
├── /rooms             --> 房型導覽 (4 間獨立景觀套房詳細頁與燈箱圖集)
├── /facilities        --> 園區設施與空間 (泳池/溫泉湯屋/劇院/觀景台)
├── /packages          --> 包棟方案與加值服務 (包棟規則/婚紗拍攝/派對)
├── /rules             --> 包棟須知、入住規章與 FAQ
├── /guide             --> 周邊景點與交通指引 (自駕地圖/即時導航)
└── /news              --> 最新消息與優惠公告
```

### 全站通用常駐元件規範：
1. **頂部透明沉浸導航列 (Navbar)**：
   - 頂部滾動監聽（置頂時透明，向下滾動時變為毛玻璃背景 `backdrop-filter: blur(12px)`）。
   - 中/英雙語切換開關、Dark/Light Mode 燈光切換開關、預約諮詢按鈕。
2. **手機端底部常駐懸浮列 (Mobile Action Bar)**：
   - 螢幕寬度 `< 768px` 時常駐底部。
   - 包含：「一鍵撥號」、「LINE 官方預約諮詢（自動帶入諮詢範本）」、「地圖導航」。
3. **頁尾 (Footer)**：
   - 民宿登記資訊、官方 LINE（`@209yrich`）、官方 IG（`villa_forfun001`）、版權宣告與 `/admin` 後台隱藏入口。

---

## 三、 資料模型規範 (Data Schemas for Git-based CMS)

所有內容以 JSON / Markdown 結構化儲存在 `src/data/`，供前端響應式讀取，並直接對應 Decap/Sveltia CMS 欄位。

### 1. 民宿基本資料 (`site.json`)
```json
{
  "brandNameZh": "山語 Villa 豪宅山莊包棟別墅",
  "brandNameEn": "Shan Yu Villa Luxury Estate",
  "phone": "0900-000-000",
  "lineId": "@209yrich",
  "lineUrl": "https://line.me/R/ti/p/@209yrich",
  "lineTemplateMsg": "您好，我想洽詢山語Villa包棟預約：【入住日期：】【人數：】【需求方案：包棟 / 婚紗拍攝 / 活動包場】",
  "instagram": "villa_forfun001",
  "address": "南投縣（地址與自駕指引）",
  "googleMapUrl": "https://maps.google.com/?q=...",
  "maxGuests": 18,
  "roomCount": 4
}
```

### 2. 房價與方案規範 (`pricing.json`)
```json
{
  "currency": "TWD",
  "exclusivePackage": {
    "weekday": 38000,
    "weekend": 48000,
    "holiday": 58000,
    "deposit": 10000,
    "includedGuests": 18,
    "checkInTime": "15:00",
    "checkOutTime": "11:00"
  },
  "additionalServices": [
    {
      "id": "wedding-shoot",
      "title": "婚紗 / 商業攝影場租方案",
      "hourlyRate": 3500,
      "minHours": 3,
      "maxPeople": 8,
      "note": "提供專屬獨立更衣室與化妝間"
    },
    {
      "id": "private-party",
      "title": "私人派對 / 企業高階閉門會議",
      "pricing": "專案洽詢",
      "note": "可協助預約私廚無菜單料理與活動佈置"
    }
  ]
}
```

### 3. 4 間獨立景觀套房規範 (`rooms.json`)
| 房型代號 | 房型名稱 (中文 / 英文) | 建議容納人數 | 特色設施 |
| :--- | :--- | :--- | :--- |
| `room-01` | **雲海景觀旗艦尊爵套房**<br>(Sea of Clouds Suite) | 4 ~ 6 人 | 270度超大落地窗、專屬全景景觀浴缸、獨立景觀陽台 |
| `room-02` | **山語隱逸庭園雙人套房**<br>(Zen Garden Suite) | 2 ~ 4 人 | 私人日式枯山水庭園出入口、雙人石造泡湯池 |
| `room-03` | **星空露台家庭精緻套房**<br>(Starry Terrace Suite) | 4 人 | 頂樓專屬觀星露台、頂級劇院投影、乾濕分離衛浴 |
| `room-04` | **林岫沉靜大器家庭套房**<br>(Forest Whisper Suite) | 4 人 | 暖木大器起居空間、頂級獨立筒大床、全套精品茶具 |

---

## 四、 多語言 (i18n) 規範

1. **語言切換**：支援繁體中文 (`zh-TW`) 與英文 (`en-US`)。
2. **存儲機制**：預設為 `zh-TW`，使用者切換後存入 `localStorage('villa_lang')`。
3. **文案分流**：
   - 靜態介面文字（如按鈕、選單、標籤）透過輕量 i18n 模組渲染。
   - 動態內容（房型描述、活動文章）在 JSON 中配置 `_zh` 與 `_en` 對應欄位。

---

## 五、 代碼品質與組件化工程規範

1. **Vue 3 標準**：
   - 一律採用 `<script setup>` 與 Composition API。
   - 樣式一律使用 `<style lang="scss" scoped>`。
2. **圖片載入規範**：
   - 圖片統一採用 WebP 格式，並加上 `loading="lazy"` 與 `aspect-ratio` 防版面抖動 (CLS)。
   - 首頁 Hero 橫幅大圖加上 `fetchpriority="high"` 確保首屏 1 秒內極速渲染。
3. **SEO 與語意化**：
   - 每個頁面具備唯一 `<h1>`。
   - 整合 `Schema.org` 之 `LodgingBusiness` 結構化資料，提升 Google 搜尋在地能見度。
4. **Git-based CMS 規範**：
   - 後台靜態檔案放置於 `public/admin/`，以 `config.yml` 定義完整結構化欄位。

---

## 六、 第一版純前端「為第二版全端鋪路」之關鍵規範

> 完整後端與資料庫規範詳見手冊：[`d:\hotel\1014record.md`](file:///d:/hotel/1014record.md)

為了確保第一版純前端（靜態展示 + LINE / 外部預訂導流）在日後擴充升級為第二版（Cloudflare Pages Functions + MySQL 線上預訂系統）時**「不需大規模重構」**，所有前端工程師開發時必須落實以下 3 點：

1. **資料層一律透過 Service 存取**：
   - 禁止在 Vue 組件內直接 `import` JSON 寫死；一律透過 [`src/services/roomService.js`](file:///d:/hotel/Ann_Villa/src/services/roomService.js) 異步取得房型資料。
2. **預約與跳轉行為抽象封裝**：
   - 預約諮詢按鈕一律呼叫 [`src/services/bookingService.js`](file:///d:/hotel/Ann_Villa/src/services/bookingService.js) 的 `handleBookingAction()` 函式，由 Service 集中負責組裝 LINE 預約訊息或未來切換為 API 送出。
3. **日期與 Schema 嚴格對齊**：
   - 組件間傳遞的日期狀態一律使用標準 `YYYY-MM-DD` 格式字串。
   - JSON 與資料模型欄位命名嚴格參照 [`1014record.md`](file:///d:/hotel/1014record.md) 中的 Prisma Schema。

