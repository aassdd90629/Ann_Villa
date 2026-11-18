-- ============================================================================
-- Migration: 0003_create_admin_audit_logs.sql
-- Description: 建立後台通用審計與業務操作日誌表 (admin_audit_logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,                -- 'sync', 'booking', 'calendar', 'pricing', 'security'
  action TEXT NOT NULL,                  -- 'UPDATE_PRICING', 'CONFIRM_DEPOSIT', 'MANUAL_LOCK', 'LOGIN' 等
  target_id TEXT,                        -- 關聯項目 ID (如訂單編號 SY-..., 假期 ID 等)
  summary TEXT NOT NULL,                 -- 人類可讀的操作簡述
  details_json TEXT,                     -- 詳細的前後數值或額外上下文 (JSON 字串)
  operator TEXT DEFAULT 'admin',         -- 操作者 (管家帳號或 system)
  ip_address TEXT,                       -- 來源 IP
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_category ON admin_audit_logs(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target_id ON admin_audit_logs(target_id);

-- 初始示範日誌資料 (真實呈現各頁籤軌跡)
INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, created_at)
VALUES 
  ('pricing', 'UPDATE_PRICING', 'pricing_settings', '更新全區包棟平日階梯定價：10人以下2萬/14人2.5萬/18人3萬，一般假日3.5萬', '{"weekdayTier1":20000,"weekdayTier2":25000,"weekdayTier3":30000,"weekend":35000}', 'admin', datetime('now', '-2 hours')),
  ('pricing', 'IMPORT_GOV_HOLIDAYS', '2027', '一鍵匯入 2027 年度政府公告連續假期（共 9 組，包含假日前一天起算與春節不含早餐規範）', '{"year":2027,"count":9}', 'admin', datetime('now', '-1 hours')),
  ('calendar', 'MANUAL_LOCK', 'range-20270116-20270117', '管家手動自訂關房：2027-01-16 ~ 2027-01-17 全區維護保養', '{"startDate":"2027-01-16","endDate":"2027-01-17","reason":"全區保養維護"}', 'admin', datetime('now', '-5 hours')),
  ('booking', 'CONFIRM_DEPOSIT', 'SY-20261114-8821', '核銷直訂單 50% 定金入帳：NT$ 10,000，狀態變更為【已付定金】', '{"bookingNumber":"SY-20261114-8821","depositAmount":10000,"status":"DEPOSIT_PAID"}', 'admin', datetime('now', '-1 days')),
  ('security', 'ADMIN_LOGIN', 'admin', '管家帳號成功登入後台管理系統', '{"authMethod":"password"}', 'admin', datetime('now', '-30 minutes'));
