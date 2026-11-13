-- seed_data.sql: 山語 Villa 初始種子資料

-- 注入房型與包棟資料
INSERT OR REPLACE INTO rooms (id, name, subtitle, base_price, holiday_price, capacity_standard, capacity_max, extra_bed_price, is_active) VALUES
('villa-full', '山語・全區尊榮包棟', '獨享 180 坪山林莊園・4間獨立景觀套房・戶外戲水池・全套奢華公設', 38000, 48000, 14, 14, 1500, 1),
('room-01', '1樓 綠意四人景觀套房', '1樓無障礙便利動線・大面綠意窗景・獨立乾濕分離衛浴', 8800, 10800, 4, 4, 1500, 1),
('room-02', '1樓 山語隱逸雙人套房', '加大 Queen Size 舒眠名床・沉靜私密時光・獨立衛浴', 5800, 7200, 2, 2, 1500, 1),
('room-03', '1樓 雅緻舒活四人套房', '標準雙人床兩張・通透採光・清幽園景與獨立衛浴', 8800, 10800, 4, 4, 1500, 1),
('room-04', '2樓 沐月星空四人套房', '2樓獨立居高視野・戶外觀景露台・星空衛浴', 9800, 11800, 4, 4, 1500, 1);

-- 注入 Airbnb 現有 14 組真實檔期佔用區間
INSERT OR IGNORE INTO availability_blocks (room_id, start_date, end_date, summary, source, external_uid) VALUES
('villa-full', '2026-11-07', '2026-11-08', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-5f5f00655a43300dd98229aff1e3274c@airbnb.com'),
('villa-full', '2026-11-14', '2026-11-15', 'Reserved', 'AIRBNB', '1418fb94e984-dfb10b5256927ed4332087a51e2c7888@airbnb.com'),
('villa-full', '2026-11-21', '2026-11-22', 'Reserved', 'AIRBNB', '1418fb94e984-a5a2bd7bb7c1d894d6690eef326fb87f@airbnb.com'),
('villa-full', '2026-11-28', '2026-11-29', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-4c0d617c974a763f9f8f3bc12947409d@airbnb.com'),
('villa-full', '2026-12-05', '2026-12-06', 'Reserved', 'AIRBNB', '1418fb94e984-60524b6d7e1bb9ae75b4c13f62144814@airbnb.com'),
('villa-full', '2026-12-12', '2026-12-13', 'Reserved', 'AIRBNB', '1418fb94e984-aa205786074d8f4f99ea2622341e8983@airbnb.com'),
('villa-full', '2026-12-19', '2026-12-20', 'Reserved', 'AIRBNB', '1418fb94e984-c9bce1aef4e94f67731a8e5661390e53@airbnb.com'),
('villa-full', '2027-01-01', '2027-01-02', 'Reserved', 'AIRBNB', '1418fb94e984-f007e65a8cd70b30ea9971cd7403612f@airbnb.com'),
('villa-full', '2027-01-16', '2027-01-17', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-8bb9135f003cbed942d47513dc5574f8@airbnb.com'),
('villa-full', '2027-01-23', '2027-01-24', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-17dbf381240246192e8982261a393f0a@airbnb.com'),
('villa-full', '2027-02-07', '2027-02-08', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-356b46146ce2355462cf69bf002f66ad@airbnb.com'),
('villa-full', '2027-02-08', '2027-02-09', 'Reserved', 'AIRBNB', '1418fb94e984-904d9e335559cf361bf1507f3ea7f311@airbnb.com'),
('villa-full', '2027-02-27', '2027-03-01', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-7935fb31db48ffbcfe9586fe890885e3@airbnb.com'),
('villa-full', '2027-04-30', '2027-11-01', 'Airbnb (Not available)', 'AIRBNB', '7f662ec65913-ec84c35e35496ee8ef3097c55e903a45@airbnb.com');

