-- ==============================================================================
-- 增量遷移腳本：0010_remove_airbnb_references.sql
-- 目的：全面拆離與移除 Airbnb 相關數據、佔用檔期與外部渠道設定
-- ==============================================================================

-- 1. 清理 availability_blocks 中舊有 Airbnb 來源的檔期佔用
DELETE FROM availability_blocks WHERE source = 'AIRBNB';

-- 2. 清理 site_content 中 Airbnb 專屬設定與連結
DELETE FROM site_content WHERE key = 'airbnb_url';

-- 3. 更新 channels_ota_platforms 為空陣列（全站聚焦自營官網直訂，無第三方 OTA 抽成）
UPDATE site_content 
SET content_zh = '[]', content_en = '[]', updated_at = datetime('now')
WHERE key = 'channels_ota_platforms';

-- 4. 清理 sync_logs 中 Airbnb 渠道之歷史排程日誌
DELETE FROM sync_logs WHERE channel = 'AIRBNB';
