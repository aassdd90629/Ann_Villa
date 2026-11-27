-- migrations/0007_add_weekday_tier_guest_thresholds.sql
-- 用途: 新增全區包棟平日階梯人數門檻 (階梯一上限人數、階梯二上限人數)
-- 說明:
-- 階梯一: 1 至 weekday_tier1_max_guests 人 (預設 10 人)
-- 階梯二: (weekday_tier1_max_guests + 1) 至 weekday_tier2_max_guests 人 (預設 14 人)
-- 階梯三: (weekday_tier2_max_guests + 1) 至 max_capacity 人 (預設 18 人)

INSERT OR IGNORE INTO pricing_settings (setting_key, setting_value, description)
VALUES 
  ('weekday_tier1_max_guests', '10', '平日第一階梯最高人數 (預設 10人)'),
  ('weekday_tier2_max_guests', '14', '平日第二階梯最高人數 (預設 14人)');
