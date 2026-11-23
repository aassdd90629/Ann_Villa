-- ==============================================================================
-- 檔案名稱: 0008_update_admin_password.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 更新超級管理員 (admin) 帳號安全密碼雜湊與鹽值。
-- ==============================================================================

UPDATE admin_users
SET password_hash = '4e11ed2f81b1db021810f93780ab1fc2a9e0720376f7490122175ca270dd5090',
    salt = '596a9427ad9549c2e12a65d156a35878',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';
