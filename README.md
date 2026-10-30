# 山語 Villa 豪宅山莊包棟別墅｜官方形象網站

> **山嵐隱逸・慢活時光** —— 專為「山語 Villa」量身打造之頂級品牌形象官網。  
> 秉持東方靜謐留白美學與山林奢華沉浸感，結合極速 Jamstack 現代前端架構，提供無縫的跨裝置直客預約體驗。

---

## 🌿 核心特色與功能亮點

- **東方靜謐留白設計系統**：對標頂級旅宿視覺標準，以沉穩大地金棕與石墨灰構建高奢山莊氛圍。
- **雙模式自由切換**：支援「晨曦雲霧（Light Mode）」與「靜謐夜景（Dark Mode）」無閃爍微動態切換。
- **完整雙語體系**：繁體中文 (`zh-TW`) 與英文 (`en-US`) 雙語即時切換，語言狀態自動持久化。
- **全方位響應式體驗 (RWD)**：桌面端頂部毛玻璃沉浸導航列；手機端底部常駐「一鍵撥號 / LINE 官方預約 / 地圖導航」快捷選單。
- **即時房態行事曆**：直覺選取入住與退房日期，自動計算平日、假日、連假包棟金額，支援一鍵帶入日期字串至 LINE 官方客服。
- **全資料驅動架構 (Data-Driven)**：全站文案、價格、房型與設施完全抽離至結構化 JSON，無需改動程式碼即可輕鬆維護。

---

## 🛠 技術規格 (Tech Stack)

| 領域 | 採用技術 |
| :--- | :--- |
| **核心框架** | [Vue 3](https://vuejs.org/) (`<script setup>` + Composition API) |
| **建構工具** | [Vite 8](https://vite.dev/) (極速熱重載與最佳化打包) |
| **路由管理** | [Vue Router 4](https://router.vuejs.org/) (支援 7 大核心頁面與捲軸平滑復原) |
| **樣式架構** | SCSS / SASS + 語意化 CSS Token 變數系統 |
| **圖標系統** | [Lucide Vue Next](https://lucide.dev/) (現代化輕量向量圖標) |
| **字體系統** | Cormorant Garamond (英文展示) + Noto Serif TC (思源宋體) + Noto Sans TC (思源黑體) |

---

## 🚀 快速開始 (Getting Started)

### 1. 環境需求
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- `npm` 或 `pnpm`

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 本地開發伺服器
```bash
npm run dev
```
啟動後於瀏覽器造訪 `http://localhost:5173`。

### 4. 正式生產環境打包
```bash
npm run build
```
打包完成後，靜態檔案將輸出至 `dist/` 目錄。

### 5. 本地預覽生產版本
```bash
npm run preview
```

---

## 📂 專案目錄結構

```text
Ann_Villa/
├── public/                 # 靜態資源 (品牌 LOGO、實景照片集、favicon)
│   ├── favicon.svg
│   └── img/                # 各空間與房型高畫質照片
├── src/
│   ├── assets/             # 全域 SCSS 樣式與設計 Token
│   ├── components/         # 模組化 Vue 組件
│   │   ├── booking/        # 即時房態月曆與試算組件
│   │   ├── common/         # 通用組件 (按鈕、燈箱圖集、手風琴等)
│   │   ├── home/           # 首頁專用組件 (輪播橫幅等)
│   │   └── layout/         # 全站導航列 (Navbar)、頁尾 (Footer)、手機懸浮列
│   ├── composables/        # 組合式邏輯 (useI18n 雙語、useTheme 日夜模式)
│   ├── data/               # 核心資料庫 (★ 內容更新請修改此處)
│   │   ├── site.json       # 品牌聯絡資訊、地址、電話、證號
│   │   ├── rooms.json      # 5 間獨立景觀套房規格與照片
│   │   ├── pricing.json    # 包棟方案收費標準與加人計費
│   │   ├── facilities.json # 園區設施與休閒空間介紹
│   │   ├── rules.json      # 入住須知、包棟規章與常見問答 FAQ
│   │   ├── guide.json      # 周邊推薦景點與交通指引
│   │   └── news.json       # 最新消息與優惠公告
│   ├── router/             # 頁面路由定義 (7 大核心頁面)
│   ├── services/           # 資料服務層 (roomService, bookingService)
│   ├── views/              # 7 大核心頁面視圖
│   ├── App.vue             # 根組件
│   └── main.js             # 入口檔案
├── index.html              # HTML 骨架與品牌 Favicon
├── package.json            # 專案相依設定
└── LICENSE                 # 專有商業版權宣告
```

---

## 📝 網站內容與資料維護指南 (Content Maintenance)

網站內容已完全結構化，日常修改**無需變動任何 Vue 程式碼**，只需直接編輯 `src/data/` 中的對應 JSON 檔案：

| 想修改的項目 | 對應檔案路徑 | 說明 |
| :--- | :--- | :--- |
| **基本資料** | `src/data/site.json` | 修改官方電話、地址、LINE ID、IG、民宿登記證號 |
| **包棟房價** | `src/data/pricing.json` | 調整平日、假日、旺季包棟價格及押金規範 |
| **套房規格** | `src/data/rooms.json` | 增修各套房床型、坪數、照片與設施重點 |
| **園區設施** | `src/data/facilities.json` | 更新客廳劇院、泡湯池、泳池、廚房吧台介紹 |
| **入住規章** | `src/data/rules.json` | 調整進退房時間、烤肉清潔費、FAQ 常見問答 |
| **景點交通** | `src/data/guide.json` | 新增周邊私房景點、自駕導航路線資訊 |
| **最新消息** | `src/data/news.json` | 發布限時促銷公告、包棟優惠方案 |

---

## 🌐 部署指南 (Deployment)

本專案為標準靜態現代架構，推薦部署至 **Cloudflare Pages**：

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) 進入 **Workers & Pages**。
2. 連結 GitHub / GitLab 專案儲存庫。
3. 建立設定（Build Settings）：
   - **Framework Preset**：`Vite`
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - **Root directory**：`Ann_Villa`
4. 點擊 **Save and Deploy**，即可享有全球 CDN 加速、自動 SSL 憑證與無流量上限保障。

---

## 📄 版權與智慧財產權聲明 (License)

Copyright © 2026 山語 Villa (Shan Yu Villa / Ann Villa). All Rights Reserved.  
**PROPRIETARY AND CONFIDENTIAL**

本專案原始碼、網站視覺設計、品牌識別、攝影多媒體資產及隨附文件均為「山語 Villa」之專有財產，受著作權法保護。未經書面許可，嚴禁任意重製、散布或轉作商業用途。詳細規範請參閱 [LICENSE](./LICENSE)。
