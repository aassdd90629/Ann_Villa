-- ==============================================================================
-- 檔案名稱: 0004_create_site_content.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 建立全站動態內容管理表 (site_content)，支援業主與管家自主維護
-- 匯款銀行資訊、聯絡管道、入住須知、FAQ 常見問答與最新消息公告。
-- ==============================================================================

CREATE TABLE IF NOT EXISTS site_content (
  -- 唯一識別鍵值 (例如 'bank_name', 'faq-01', 'news-01')
  key TEXT PRIMARY KEY,
  
  -- 內容分類 ('basic_info', 'policies', 'faq', 'news')
  category TEXT NOT NULL,
  
  -- 標籤或標題 (繁中)
  title_zh TEXT NOT NULL,
  
  -- 標籤或標題 (英文，支援雙語)
  title_en TEXT,
  
  -- 內容或數值 (繁中，支援純字串或 JSON 格式)
  content_zh TEXT NOT NULL,
  
  -- 內容或數值 (英文)
  content_en TEXT,
  
  -- 排序權重 (數字越小排越前)
  sort_order INTEGER DEFAULT 1,
  
  -- 啟用顯示狀態: 1 為啟用顯示, 0 為隱藏停用
  is_active INTEGER DEFAULT 1,
  
  -- 最後修改時間戳記 (UTC)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立分類與排序索引
CREATE INDEX IF NOT EXISTS idx_site_content_category ON site_content(category, is_active, sort_order ASC);

-- ------------------------------------------------------------------------------
-- 初始基本營運資訊種子資料注入 (匯款銀行、官方聯絡資訊)
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO site_content (key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active) VALUES
  ('bank_name', 'basic_info', '收款銀行名稱', 'Bank Name', '台灣銀行', 'Bank of Taiwan', 1, 1),
  ('bank_code', 'basic_info', '銀行代碼', 'Bank Code', '004', '004', 2, 1),
  ('bank_account', 'basic_info', '收款銀行帳號', 'Bank Account Number', '123-456-789012', '123-456-789012', 3, 1),
  ('bank_holder', 'basic_info', '戶名', 'Account Holder', '山語 Villa', 'Shan Yu Villa', 4, 1),
  ('phone', 'basic_info', '客服諮詢專線', 'Customer Service Phone', '0909-557-400', '0909-557-400', 5, 1),
  ('line_id', 'basic_info', '官方 LINE ID', 'Official LINE ID', '@209yrich', '@209yrich', 6, 1),
  ('line_url', 'basic_info', '官方 LINE 邀請連結', 'LINE Invite URL', 'https://line.me/R/ti/p/@209yrich', 'https://line.me/R/ti/p/@209yrich', 7, 1),
  ('check_in_time', 'basic_info', '入住時間 (Check-in)', 'Check-in Time', '15:00', '15:00', 8, 1),
  ('check_out_time', 'basic_info', '退房時間 (Check-out)', 'Check-out Time', '11:00', '11:00', 9, 1),
  ('deposit_amount', 'basic_info', '現場保證金 (押金)', 'Security Deposit', '3000', '3000', 10, 1);
