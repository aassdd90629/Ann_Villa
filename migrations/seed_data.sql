-- seed_data.sql: 山語 Villa 初始種子資料

-- 注入房型與包棟資料
INSERT OR REPLACE INTO rooms (id, name, subtitle, base_price, holiday_price, capacity_standard, capacity_max, extra_bed_price, is_active) VALUES
('villa-full', '山語・全區尊榮包棟', '獨享 180 坪山林莊園・4間獨立景觀套房・戶外戲水池・全套奢華公設', 38000, 48000, 14, 14, 1500, 1),
('room-01', '1樓 綠意四人景觀套房', '1樓無障礙便利動線・大面綠意窗景・獨立乾濕分離衛浴', 8800, 10800, 4, 4, 1500, 1),
('room-02', '1樓 山語隱逸雙人套房', '加大 Queen Size 舒眠名床・沉靜私密時光・獨立衛浴', 5800, 7200, 2, 2, 1500, 1),
('room-03', '1樓 雅緻舒活四人套房', '標準雙人床兩張・通透採光・清幽園景與獨立衛浴', 8800, 10800, 4, 4, 1500, 1),
('room-04', '2樓 沐月星空四人套房', '2樓獨立居高視野・戶外觀景露台・星空衛浴', 9800, 11800, 4, 4, 1500, 1);

-- 注入模擬管家自主鎖房檔期
INSERT OR IGNORE INTO availability_blocks (room_id, start_date, end_date, summary, source, external_uid) VALUES
('villa-full', '2026-11-07', '2026-11-08', '泳池與園藝例行保養', 'MANUAL_LOCK', 'lock-pool-20261107'),
('villa-full', '2026-11-28', '2026-11-29', '園區深度清潔與客房保養', 'MANUAL_LOCK', 'lock-clean-20261128'),
('villa-full', '2027-01-01', '2027-01-02', '屋主自留親友聚會', 'MANUAL_LOCK', 'lock-owner-20270101');
