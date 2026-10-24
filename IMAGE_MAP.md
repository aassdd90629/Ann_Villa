# 山語 Villa 官方照片目錄與中英文對照表 (Image Mapping Guide)

> 本對照表記錄由客戶提供之原 LINE 繁體中文分類照片，轉化為前端專案工程化英文路徑之完整對照關係。
> **規範提醒**：前端組件請透過 `src/data/rooms.json`、`src/data/facilities.json` 等資料層引用，切勿寫死路徑，以利日後自由抽換。

## 總覽目錄對照 (Directory Mapping)

| 空間類別 | 原中文目錄名稱 | 新英文目錄名稱 (Web Path) | 照片張數 | 備註說明 |
| :--- | :--- | :--- | :--- | :--- |
| 1樓房間1四人房 | `房間1四人房` | `/img/room-1/` | 5 張 | 1F 四人房 (一張Queen + 一張一般雙人床/或雙床) |
| 1樓房間2雙人房 | `房間2雙人房` | `/img/room-2/` | 5 張 | 1F 雙人房 (Queen Size 雙人床 1 張) |
| 1樓房間3四人房 | `房間3四人房` | `/img/room-3/` | 4 張 | 1F 四人房 (一般 Size 雙人床 2 張) |
| 2樓房間4四人房 | `二樓房間4四人房 / 房間4四人房` | `/img/room-4/` | 4 張 | 2F 四人房 (一般 Size 雙人床 2 張) |
| 2樓房間5四人房 | `二樓房間5浴室在一樓` | `/img/room-5/` | 4 張 | 2F 四人房 (一般 Size 雙人床 2 張，專屬獨立衛浴位於1樓) |
| 客廳與卡拉OK | `客廳和卡啦ok` | `/img/living-ktv/` | 4 張 | 公共客廳、KTV 卡拉OK、電動麻將桌 |
| 智能廚房與Mini Bar | `智能廚房跟米妮吧` | `/img/kitchen-bar/` | 6 張 | 開放式智能中島廚房、Mini Bar、咖啡機與高腳吧台 |
| 建築外觀、泡茶區、烤肉區 | `建築物、泡茶區、烤肉區` | `/img/outdoor-bbq-tea/` | 11 張 | 獨棟建築外觀、戶外泡茶茶几、美式戶外烤肉 BBQ 區 |
| 日落與夜晚景色 | `日落與夜晚景色` | `/img/scenery-night/` | 7 張 | 山莊日落晚霞、暮色氛圍與無光害星空夜景 |

---

## 詳細單張照片對照表 (Detailed File Mapping)

| 序號 | 空間分組 | 原檔名 (Original File) | 新檔名與路徑 (New Web Path) |
| :---: | :--- | :--- | :--- |
| 1 | 1樓房間1四人房 | `LINE_ALBUM_山語villa豪宅山莊房間1四人房_261009_1.jpg` | `/img/room-1/room-1-01.jpg` |
| 2 | 1樓房間1四人房 | `LINE_ALBUM_山語villa豪宅山莊房間1四人房_261009_2.jpg` | `/img/room-1/room-1-02.jpg` |
| 3 | 1樓房間1四人房 | `LINE_ALBUM_山語villa豪宅山莊房間1四人房_261009_3.jpg` | `/img/room-1/room-1-03.jpg` |
| 4 | 1樓房間1四人房 | `LINE_ALBUM_山語villa豪宅山莊房間1四人房_261009_4.jpg` | `/img/room-1/room-1-04.jpg` |
| 5 | 1樓房間1四人房 | `LINE_ALBUM_山語villa豪宅山莊房間1四人房_261009_5.jpg` | `/img/room-1/room-1-05.jpg` |
| 6 | 1樓房間2雙人房 | `LINE_ALBUM_房間2雙人房_261009_1.jpg` | `/img/room-2/room-2-01.jpg` |
| 7 | 1樓房間2雙人房 | `LINE_ALBUM_房間2雙人房_261009_2.jpg` | `/img/room-2/room-2-02.jpg` |
| 8 | 1樓房間2雙人房 | `LINE_ALBUM_房間2雙人房_261009_3.jpg` | `/img/room-2/room-2-03.jpg` |
| 9 | 1樓房間2雙人房 | `LINE_ALBUM_房間2雙人房_261009_4.jpg` | `/img/room-2/room-2-04.jpg` |
| 10 | 1樓房間2雙人房 | `LINE_ALBUM_房間2雙人房_261009_5.jpg` | `/img/room-2/room-2-05.jpg` |
| 11 | 1樓房間3四人房 | `LINE_ALBUM_房間3四人房_261009_1.jpg` | `/img/room-3/room-3-01.jpg` |
| 12 | 1樓房間3四人房 | `LINE_ALBUM_房間3四人房_261009_2.jpg` | `/img/room-3/room-3-02.jpg` |
| 13 | 1樓房間3四人房 | `LINE_ALBUM_房間3四人房_261009_3.jpg` | `/img/room-3/room-3-03.jpg` |
| 14 | 1樓房間3四人房 | `LINE_ALBUM_房間3四人房_261009_4.jpg` | `/img/room-3/room-3-04.jpg` |
| 15 | 2樓房間4四人房 | `LINE_ALBUM_二樓房間4四人房_261009_1.jpg` | `/img/room-4/room-4-01.jpg` |
| 16 | 2樓房間4四人房 | `LINE_ALBUM_二樓房間4四人房_261009_2.jpg` | `/img/room-4/room-4-02.jpg` |
| 17 | 2樓房間4四人房 | `LINE_ALBUM_二樓房間4四人房_261009_3.jpg` | `/img/room-4/room-4-03.jpg` |
| 18 | 2樓房間4四人房 | `LINE_ALBUM_二樓房間4四人房_261009_4.jpg` | `/img/room-4/room-4-04.jpg` |
| 19 | 2樓房間5四人房(衛浴在1樓) | `LINE_ALBUM_二樓房間5浴室在一樓_261009_1.jpg` | `/img/room-5/room-5-01.jpg` |
| 20 | 2樓房間5四人房(衛浴在1樓) | `LINE_ALBUM_二樓房間5浴室在一樓_261009_2.jpg` | `/img/room-5/room-5-02.jpg` |
| 21 | 2樓房間5四人房(衛浴在1樓) | `LINE_ALBUM_二樓房間5浴室在一樓_261009_3.jpg` | `/img/room-5/room-5-03.jpg` |
| 22 | 2樓房間5四人房(衛浴在1樓) | `LINE_ALBUM_二樓房間5浴室在一樓_261009_4.jpg` | `/img/room-5/room-5-04.jpg` |
| 23 | 客廳與卡拉OK交誼廳 | `LINE_ALBUM_客廳和卡啦ok_261009_1.jpg` | `/img/living-ktv/living-ktv-01.jpg` |
| 24 | 客廳與卡拉OK交誼廳 | `LINE_ALBUM_客廳和卡啦ok_261009_2.jpg` | `/img/living-ktv/living-ktv-02.jpg` |
| 25 | 客廳與卡拉OK交誼廳 | `LINE_ALBUM_客廳和卡啦ok_261009_3.jpg` | `/img/living-ktv/living-ktv-03.jpg` |
| 26 | 客廳與卡拉OK交誼廳 | `LINE_ALBUM_客廳和卡啦ok_261009_4.jpg` | `/img/living-ktv/living-ktv-04.jpg` |
| 27 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_1.jpg` | `/img/kitchen-bar/kitchen-bar-01.jpg` |
| 28 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_2.jpg` | `/img/kitchen-bar/kitchen-bar-02.jpg` |
| 29 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_3.jpg` | `/img/kitchen-bar/kitchen-bar-03.jpg` |
| 30 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_4.jpg` | `/img/kitchen-bar/kitchen-bar-04.jpg` |
| 31 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_5.jpg` | `/img/kitchen-bar/kitchen-bar-05.jpg` |
| 32 | 智能廚房與Mini Bar | `LINE_ALBUM_智能廚房跟米妮吧_261009_6.jpg` | `/img/kitchen-bar/kitchen-bar-06.jpg` |
| 33 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_1.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-01.jpg` |
| 34 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_2.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-02.jpg` |
| 35 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_3.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-03.jpg` |
| 36 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_4.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-04.jpg` |
| 37 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_5.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-05.jpg` |
| 38 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_6.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-06.jpg` |
| 39 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_7.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-07.jpg` |
| 40 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_8.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-08.jpg` |
| 41 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_9.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-09.jpg` |
| 42 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_10.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-10.jpg` |
| 43 | 建築外觀、泡茶區與烤肉區 | `LINE_ALBUM_建築物、泡茶區和烤肉區_261009_11.jpg` | `/img/outdoor-bbq-tea/outdoor-bbq-tea-11.jpg` |
| 44 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_1.jpg` | `/img/scenery-night/scenery-night-01.jpg` |
| 45 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_2.jpg` | `/img/scenery-night/scenery-night-02.jpg` |
| 46 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_3.jpg` | `/img/scenery-night/scenery-night-03.jpg` |
| 47 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_4.jpg` | `/img/scenery-night/scenery-night-04.jpg` |
| 48 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_5.jpg` | `/img/scenery-night/scenery-night-05.jpg` |
| 49 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_6.jpg` | `/img/scenery-night/scenery-night-06.jpg` |
| 50 | 日落晚霞與夜晚夜景 | `LINE_ALBUM_日落與夜晚景色_261009_7.jpg` | `/img/scenery-night/scenery-night-07.jpg` |
