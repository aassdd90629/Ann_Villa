-- ==============================================================================
-- 遷移腳本：0015_add_guest_cancellation.sql
-- 目的：支援旅客訂單線上自主取消與退費申請流程
-- 1. 取消來源 (cancelled_by: 'GUEST' | 'ADMIN' | 'SYSTEM_EXPIRED')
-- 2. 取消時間戳記 (cancelled_at)
-- 3. 退款處理狀態 (refund_status: 'NONE' | 'PENDING' | 'COMPLETED' | 'FORFEITED')
-- 4. 精算後應退金額 (refund_amount)
-- 5. 旅客退款銀行資訊 (refund_bank_code, refund_bank_name, refund_account, refund_account_name)
-- 6. 管家退款核銷資訊 (refund_completed_at, refund_reference_no, refund_admin_note)
-- ==============================================================================

ALTER TABLE bookings ADD COLUMN cancelled_by TEXT;
ALTER TABLE bookings ADD COLUMN cancelled_at DATETIME;
ALTER TABLE bookings ADD COLUMN refund_status TEXT DEFAULT 'NONE';
ALTER TABLE bookings ADD COLUMN refund_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN refund_bank_code TEXT;
ALTER TABLE bookings ADD COLUMN refund_bank_name TEXT;
ALTER TABLE bookings ADD COLUMN refund_account TEXT;
ALTER TABLE bookings ADD COLUMN refund_account_name TEXT;
ALTER TABLE bookings ADD COLUMN refund_completed_at DATETIME;
ALTER TABLE bookings ADD COLUMN refund_reference_no TEXT;
ALTER TABLE bookings ADD COLUMN refund_admin_note TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON bookings (refund_status);
