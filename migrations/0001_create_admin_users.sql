-- ==============================================================================
-- 檔案名稱: 0001_create_admin_users.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 本增量遷移腳本建立山語 Villa 後台管理員/管家專屬帳號表 (admin_users)，
-- 支援後台登入驗證、安全密碼雜湊與權限角色劃分。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 後台管理員/管家帳號表 (admin_users)
-- 用途: 儲存具有山語 Villa 官方後台存取權限之管家與管理員資訊。
-- 業務規則: 嚴禁儲存明文密碼，強制儲存 SHA-256 加鹽雜湊值 (password_hash)。
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  -- 管理員唯一識別碼 (Primary Key)，格式例如 'admin-01' 或 UUID
  id TEXT PRIMARY KEY,
  
  -- 登入帳號 (Username)，具唯一性約束 (UNIQUE)，不允許重複
  username TEXT NOT NULL UNIQUE,
  
  -- 密碼雜湊值 (Password Hash)，由密碼與鹽值計算之 SHA-256 16進制字串
  password_hash TEXT NOT NULL,
  
  -- 獨立密碼鹽值 (Salt)，用於抵禦彩虹表攻擊
  salt TEXT NOT NULL,
  
  -- 管家或管理員在後台顯示之稱謂或姓名，例如 '山語執行長', '駐館管家'
  display_name TEXT NOT NULL,
  
  -- 權限角色: SUPERADMIN (超級管理員 - 完整權限), HOST (駐館管家 - 訂單核銷與鎖房)
  role TEXT NOT NULL DEFAULT 'HOST',
  
  -- 帳號啟用狀態: 1 為啟用正常, 0 為停用凍結
  is_active INTEGER DEFAULT 1,
  
  -- 最後一次成功登入的時間戳記 (UTC)
  last_login_at DATETIME,
  
  -- 帳號建立時間 (UTC 時間戳記，預設當前時間)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 帳號資訊最後修改時間
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 建立帳號唯一索引 (確保查詢極速並防重複)
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- ------------------------------------------------------------------------------
-- 2. 初始管理員種子資料注入 (預設帳號: admin，預設密碼: ryan1123_Ann)
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO admin_users (
  id,
  username,
  password_hash,
  salt,
  display_name,
  role,
  is_active
) VALUES (
  'admin-shanyu-01',
  'admin',
  '29f659084369aadb3eb0602e939c7d227fc03ef824058b57630964242e677836',
  'shanyu_villa_salt_2026',
  '山語專屬管家',
  'SUPERADMIN',
  1
);
