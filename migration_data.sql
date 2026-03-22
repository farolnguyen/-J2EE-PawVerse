-- ================================================================================
-- PAWVERSE DATA MIGRATION SCRIPT
-- Migration from old ASP.NET project to Spring Boot project
-- Generated: 2026-03-15
-- ================================================================================

-- ============================================================
-- 1. INSERT BRANDS (ThuongHieus → brands)
-- ============================================================
INSERT INTO brands (ten_brand, mo_ta, logo, trang_thai, ngay_tao, ngay_cap_nhat)
VALUES 
-- PATE
('Pate Hug', 'Pate cao cấp xuất xứ Thái Lan', '/images/brands/PateHug.jpg', 'Hoạt động', NOW(), NOW()),
('Miratorg', 'Pate cao cấp với dinh dưỡng toàn diện từ Mỹ', '/images/brands/Miratorg.jpg', 'Hoạt động', NOW(), NOW()),
('Pate Meowcat', 'Pate tinh túy nuôi dưỡng mèo từ Việt Nam', '/images/brands/PateMeowcat.jpg', 'Hoạt động', NOW(), NOW()),
('Whiskas', 'Pate thơm ngon nâng niu sức khỏe mèo từ Thái Lan', '/images/brands/Whiskas.jpg', 'Hoạt động', NOW(), NOW()),
('King''s Pet', 'Pate thượng hạng kết hợp trái cây từ Việt Nam', '/images/brands/KingsPet.jpg', 'Hoạt động', NOW(), NOW()),

-- THỨC ĂN HẠT
('Ganado Adult', 'Hạt dinh dưỡng thượng hạng nâng tầm sức khỏe thú cưng', '/images/brands/GanadoAdult.jpg', 'Hoạt động', NOW(), NOW()),
('Lapaw', 'Hạt bổ dưỡng rực rỡ dành cho chó con năng động', '/images/brands/Lapaw.jpg', 'Hoạt động', NOW(), NOW()),
('Reflex', 'Hạt tinh hoa hỗ trợ mèo triệt sản vượt trội', '/images/brands/Reflex.jpg', 'Hoạt động', NOW(), NOW()),
('Zenith', 'Hạt mềm quyến rũ, kiến tạo sức khỏe hoàn hảo cho mèo', '/images/brands/Zenith.jpg', 'Hoạt động', NOW(), NOW()),
('Catsrang All Life Stage', 'Hạt toàn diện chinh phục mọi giai đoạn sống của mèo', '/images/brands/Catsrang.jpg', 'Hoạt động', NOW(), NOW()),

-- BÁNH THƯỞNG
('Me-O', 'Thương hiệu Me-O rực rỡ từ Perfect Companion Group Thái Lan, mang đến dinh dưỡng đỉnh cao cho mèo', '/images/brands/MeO.jpg', 'Hoạt động', NOW(), NOW()),
('Catty Man', 'Catty Man lộng lẫy từ Nhật Bản, chuyên chinh phục mèo với thưởng thức tinh túy', '/images/brands/CattyMan.jpg', 'Hoạt động', NOW(), NOW()),
('Bowwow', 'Bowwow huyền thoại từ Hàn Quốc, nâng tầm sức khỏe và niềm vui cho chó', '/images/brands/Bowwow.jpg', 'Hoạt động', NOW(), NOW()),
('Doggy Man', 'Doggy Man trứ danh Nhật Bản, trao tặng chó những khoảnh khắc thưởng thức tuyệt vời', '/images/brands/DoggyMan.jpg', 'Hoạt động', NOW(), NOW()),

-- THỰC PHẨM CHỨC NĂNG
('Predogen', 'Predogen rực rỡ, mang đến sức khỏe vượt trội cho thú cưng với công thức tiên tiến', '/images/brands/Predogen.jpg', 'Hoạt động', NOW(), NOW()),
('Drontal', 'Drontal huyền thoại, bảo vệ thú cưng khỏi ký sinh trùng bằng tinh hoa y học', '/images/brands/Drontal.jpg', 'Hoạt động', NOW(), NOW()),
('Nexgard Spectra', 'Nexgard Spectra lộng lẫy, chinh phục ký sinh trùng với công nghệ đỉnh cao', '/images/brands/NexgardSpectra.jpg', 'Hoạt động', NOW(), NOW()),
('Frontline', 'Frontline trứ danh, trao tặng thú cưng lớp phòng thủ hoàn hảo trước côn trùng', '/images/brands/Frontline.jpg', 'Hoạt động', NOW(), NOW()),

-- ĐỒ CHƠI
('No Brand', 'No Brand tràn đầy sáng tạo, mang đến niềm vui bất tận cho thú cưng', '/images/brands/NoBrand.jpg', 'Hoạt động', NOW(), NOW()),
('Catty', 'Catty rực rỡ, khơi nguồn hứng khởi với đồ chơi đẳng cấp cho thú cưng', '/images/brands/Catty.jpg', 'Hoạt động', NOW(), NOW()),

-- DỤNG CỤ
('ND', 'ND lộng lẫy, trao tặng thú cưng dụng cụ tiện ích và phong cách đỉnh cao', '/images/brands/ND.jpg', 'Hoạt động', NOW(), NOW()),

-- PHỤ KIỆN
('Teddy', 'Teddy huyền ảo, mang đến phụ kiện sang trọng và đẳng cấp cho thú cưng', '/images/brands/Teddy.jpg', 'Hoạt động', NOW(), NOW()),

-- VỆ SINH
('Budle Budle', 'Budle Budle rực rỡ, mang đến sự tinh sạch vượt bậc cho thú cưng', '/images/brands/BudleBudle.jpg', 'Hoạt động', NOW(), NOW()),
('Yu', 'Yu lộng lẫy, bảo vệ thú cưng với hương thơm tinh tế và vệ sinh hoàn hảo', '/images/brands/Yu.jpg', 'Hoạt động', NOW(), NOW()),
('Cature', 'Cature huyền thoại, nâng niu thú cưng bằng giải pháp vệ sinh đỉnh cao', '/images/brands/Cature.jpg', 'Hoạt động', NOW(), NOW()),
('Tropiclean', 'Tropiclean trứ danh, trao tặng thú cưng làn da sạch sẽ và sức khỏe rạng ngời', '/images/brands/Tropiclean.jpg', 'Hoạt động', NOW(), NOW()),

-- THƯƠNG HIỆU KHÁC
('PawHut', 'Thương hiệu phụ kiện thú cưng cao cấp', '/images/brands/pawhut.png', 'Hoạt động', NOW(), NOW()),
('PetSafe', 'Chuyên về đồ dùng thú cưng an toàn', '/images/brands/petsafe.png', 'Hoạt động', NOW(), NOW()),
('Trixie', 'Thương hiệu chăm sóc thú cưng đến từ Đức', '/images/brands/trixie.png', 'Hoạt động', NOW(), NOW()),
('Catit', 'Chuyên dụng cho mèo với thiết kế sáng tạo', '/images/brands/catit.jpg', 'Hoạt động', NOW(), NOW()),
('Ferplast', 'Đồ dùng cao cấp cho thú cưng từ Ý', '/images/brands/ferplast.jpg', 'Hoạt động', NOW(), NOW()),
('Royal Canin', 'Thức ăn và phụ kiện cao cấp', '/images/brands/royal-canin.png', 'Hoạt động', NOW(), NOW());


-- ============================================================
-- 2. INSERT CATEGORIES (DanhMucs → categories)
-- ============================================================
INSERT INTO categories (ten_category, mo_ta, hinh_anh, trang_thai, ngay_tao, ngay_cap_nhat)
VALUES 
('Pate', 'Các loại pate chất lượng cho thú cưng', '/images/categories/Pate.png', 'Hoạt động', NOW(), NOW()),
('Thức ăn hạt', 'Thức ăn hạt chất lượng đỉnh cao cho thú cưng', '/images/categories/ThucAnHat.png', 'Hoạt động', NOW(), NOW()),
('Bánh thưởng', 'Các loại bánh thưởng cho thú cưng', '/images/categories/BanhThuong.png', 'Hoạt động', NOW(), NOW()),
('Thực phẩm chức năng', 'Các loại thuốc và thực phẩm bổ sung cho thú cưng', '/images/categories/ThucPhamChucNang.png', 'Hoạt động', NOW(), NOW()),
('Đồ chơi', 'Đồ chơi độc đáo lôi cuốn cho thú cưng', '/images/categories/DoChoi.png', 'Hoạt động', NOW(), NOW()),
('Dụng cụ', 'Dụng cụ tiện ích đa dụng cho thú cưng', '/images/categories/DungCu.png', 'Hoạt động', NOW(), NOW()),
('Phụ kiện', 'Phụ kiện sang trọng quyến rũ cho thú cưng', '/images/categories/PhuKien.png', 'Hoạt động', NOW(), NOW()),
('Vệ sinh', 'Sản phẩm vệ sinh cho thú cưng', '/images/categories/VeSinh.png', 'Hoạt động', NOW(), NOW());


-- ============================================================
-- 3. INSERT PRODUCTS (SanPhams → products)
-- Note: Category and Brand IDs are referenced by position (1-based)
-- Adjust id_category and id_brand values based on your actual inserted IDs
-- ============================================================

-- PATE PRODUCTS (Category: Pate = 1)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Pate Hug cho chó (120g)', 'Thức ăn cho chó đầy đủ dinh dưỡng, phù hợp mọi giống chó. Không dành cho thú cưng dị ứng đạm gà, gan cừu. Thích hợp cho Siberian_husky', 
 1, 1, 19000.00, 15000.00, NULL, 100, 50, '120g', 'Xanh lá', 'Thái Lan', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Pate Cho Chó - Thức Ăn Xốt Ướt Cho Chó (85g)', 'Pate cho chó đầy đủ dinh dưỡng toàn vẹn, giúp bé dễ dàng tiêu hóa. Không dành cho thú cưng dị ứng đạm gà, cừu, bò. Thích hợp cho Siberian_husky', 
 1, 2, 22000.00, 17000.00, NULL, 120, 60, '85g', 'Đỏ', 'Mỹ', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Pate Meowcat Dành Cho Mèo Đủ 8 Vị (70g)', 'Pate cho mèo kích thích thèm ăn, nuôi dưỡng hệ thần kinh, giúp mắt sáng khỏe. Luôn có sẵn nước cho mèo uống.', 
 1, 3, 15000.00, 12000.00, NULL, 150, 70, '70g', 'Hồng', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Pate Whiskas Dành Cho Mèo (400g)', 'Pate cho mèo kích thích thèm ăn, nuôi dưỡng hệ thần kinh, giúp mắt tinh anh. Luôn có nước, tránh nắng.', 
 1, 4, 42000.00, 35000.00, NULL, 200, 90, '400g', 'Vàng', 'Thái Lan', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Pate King pet cao cấp Gà, Cá & Trái Cây cho bé Cún và Mèo (380g)', 'Pate cho chó, mèo kết hợp trái cây hợp lý. Không ăn quá nhiều 3 ngày đầu, dùng trong 5 ngày sau khi khui.', 
 1, 5, 55000.00, 45000.00, NULL, 180, 80, '380g', 'Xanh dương', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- THỨC ĂN HẠT PRODUCTS (Category: Thức ăn hạt = 2)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Thức Ăn Hạt Ganado Adult Vị Cừu Và Gạo (3KG)', 'Thức ăn hạt khô dinh dưỡng tốt nhất cho thú cưng. Không ăn thường xuyên, cần uống nhiều nước.', 
 2, 6, 210000.00, 180000.00, NULL, 150, 70, '3kg', 'Xanh lá', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Thức Ăn Hạt Lapaw Dinh Dưỡng Hỗn Hợp Dành Cho Chó Con (400g)', 'Thức ăn hạt khô dinh dưỡng cho chó con. Không ăn thường xuyên, cần uống nhiều nước.', 
 2, 7, 65000.00, 55000.00, NULL, 120, 50, '400g', 'Đỏ', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Thức Ăn Hạt Reflex cho mèo triệt sản vị cá hồi (2kg)', 'Thức ăn hạt khô cho mèo triệt sản. Kiểm soát kỹ tránh béo phì, trộn với cơm hoặc pate.', 
 2, 8, 199000.00, 170000.00, NULL, 100, 40, '2kg', 'Hồng', 'Thổ Nhĩ Kỳ', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Thức Ăn hạt Zenith cho mèo dạng mềm (1.2Kg)', 'Thành phần dễ tiêu, hỗ trợ tiêu hóa và lông mượt. Tránh trộn hạt cứng, phù hợp chế độ riêng.', 
 2, 9, 260000.00, 220000.00, NULL, 80, 30, '1.2kg', 'Vàng', 'Mỹ', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Catsrang hỗn hợp hoàn chỉnh hỗn hợp cho mèo (2kg)', 'Thức ăn hạt hỗ trợ tiêu hóa, giảm mùi hôi. Kết hợp nước sạch hoặc pate, tuân theo chỉ định bác sĩ.', 
 2, 10, 320000.00, 280000.00, NULL, 90, 35, '2kg', 'Xanh dương', 'Mỹ', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- BÁNH THƯỞNG PRODUCTS (Category: Bánh thưởng = 3)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Bánh Thưởng Me-O Cho Mèo (50g)', 'Bánh thưởng Me-O rực rỡ từ Perfect Companion Group, mang hương vị hấp dẫn, hỗ trợ tiêu hóa và lông mượt. Phù hợp huấn luyện, không thay thế bữa chính, tránh lạm dụng.', 
 3, 11, 28000.00, 22000.00, NULL, 120, 60, '50g', 'Xanh lá', 'Thái Lan', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Viên thịt hỗ trợ tiêu búi lông Catty Man cho mèo (30g)', 'Viên thưởng Catty Man lộng lẫy, chinh phục mèo với tinh túy hỗ trợ tiêu búi lông. Không thay thế bữa chính, tham khảo bác sĩ nếu cần.', 
 3, 12, 32000.00, 25000.00, NULL, 100, 40, '30g', 'Đỏ', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Sandwich hỗn hợp Bowwow cho chó (120g)', 'Bánh sandwich Bowwow huyền thoại, nâng tầm sức khỏe và tiêu hóa cho chó. Không thay thế bữa chính, tránh ẩm sau mở bao.', 
 3, 13, 60000.00, 50000.00, NULL, 150, 70, '120g', 'Hồng', 'Hàn Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Que cuốn thịt gà cho chó 10 cây (100g)', 'Que thịt gà Doggy Man trứ danh, trao thưởng thức tuyệt vời, làm sạch răng và giảm căng thẳng. Dùng sau bữa chính, giữ nước sạch.', 
 3, 14, 77000.00, 65000.00, NULL, 90, 45, '100g', 'Vàng', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Que cỏ mèo (200g)', 'Que cỏ Me-O rực rỡ, kích thích thần kinh và giảm stress tự nhiên. Dùng 3-5 lần/tuần, theo dõi phản ứng ban đầu.', 
 3, 11, 45000.00, 35000.00, NULL, 110, 50, '200g', 'Xanh dương', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- THỰC PHẨM CHỨC NĂNG PRODUCTS (Category: Thực phẩm chức năng = 4)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Sữa Bột Cho Chó Predogen (110g)', 'Sữa Predogen rực rỡ bổ sung dinh dưỡng vượt trội cho chó con, hồi phục hoặc mang thai. Pha nước ấm 40-50°C, dùng ngay, tránh nước sôi. Chihuahua', 
 4, 15, 55000.00, 45000.00, NULL, 150, 70, '110g', 'Xanh lá', 'New Zealand', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Sữa Bột Cho Mèo Predogen (110g)', 'Sữa Predogen lộng lẫy hỗ trợ mèo con và mèo yếu, tăng đề kháng. Pha nước ấm 40-50°C, bảo quản lạnh 24h, không dùng nếu đổi màu.', 
 4, 15, 50000.00, 40000.00, NULL, 140, 60, '110g', 'Hồng', 'New Zealand', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Thuốc xổ giun Drontal cho bé cún', 'Drontal huyền thoại tẩy giun phổ rộng cho chó, hiệu quả nhanh. Dùng 1 viên/10kg, không kết hợp với Piperazine, tránh dùng cho chó mang thai dưới 40 ngày.', 
 4, 16, 50000.00, 40000.00, NULL, 120, 50, 'N/A', 'Đỏ', 'New Zealand', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Nexgard Spectra trị ve, bọ chét, giun cho cún (2 - 3.5kg)', 'Nexgard Spectra lộng lẫy bảo vệ chó nhỏ (2-3.5kg) khỏi ve, bọ chét, giun. Dùng 1 viên/tháng, không tăng liều, theo dõi phản ứng.', 
 4, 17, 300000.00, 250000.00, NULL, 100, 40, 'N/A', 'Vàng', 'Pháp', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Thuốc nhỏ gáy trị ve, rận, bọ chét Frontline cho mèo', 'Frontline trứ danh diệt ve, rận, bọ chét cho mèo, hiệu quả 24h, kéo dài 4 tuần. Không tắm 48h, tránh mèo liếm.', 
 4, 18, 155000.00, 130000.00, NULL, 130, 60, 'N/A', 'Xanh dương', 'Pháp', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- ĐỒ CHƠI PRODUCTS (Category: Đồ chơi = 5)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Trụ cào móng mèo 3 tầng cao 65cm', 'Trụ cào Me-O rực rỡ thiết kế 3 tầng, giúp mèo cào móng, leo trèo, giảm stress. Đặt cố định, kiểm tra ốc vít, tránh nhai dây sisal.', 
 5, 19, 750000.00, 600000.00, NULL, 80, 30, 'N/A', 'Xanh lá', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Đồ chơi cá lớn cho thú cưng', 'Đồ chơi No Brand tràn đầy sáng tạo, hình cá lớn mềm mại, giảm stress, phù hợp ôm ngủ. Kiểm tra định kỳ, tránh nhai rách.', 
 5, 20, 90000.00, 70000.00, NULL, 120, 50, 'N/A', 'Đỏ', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Que tét đít cho mèo 45cm', 'Que Catty rực rỡ kích thích săn mồi, tăng vận động cho mèo. Dùng 5-15 phút/lần, giám sát, tránh nuốt dây.', 
 5, 21, 35000.00, 25000.00, NULL, 150, 70, 'N/A', 'Hồng', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Chuông huấn luyện cho thú cưng', 'Chuông Me-O rực rỡ hỗ trợ huấn luyện, tăng phản xạ giao tiếp. Luyện 3-5 lần/ngày, không để cắn phá.', 
 5, 19, 49000.00, 40000.00, NULL, 100, 40, 'N/A', 'Vàng', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Bàn cào móng cho thú cưng', 'Bàn cào Catty rực rỡ giúp mài móng, giảm stress, bảo vệ nội thất. Thay khi mòn, tránh ẩm, vệ sinh khô.', 
 5, 21, 100000.00, 80000.00, NULL, 90, 35, 'N/A', 'Xanh dương', 'Trung Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- DỤNG CỤ PRODUCTS (Category: Dụng cụ = 6)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Bát ăn đơn hình trái dâu', 'Bát No Brand tràn đầy sáng tạo, dáng trái dâu ngộ nghĩnh, chống trượt, dễ vệ sinh. Rửa sau dùng, tránh nắng gắt, thay sau 6-12 tháng.', 
 6, 20, 50000.00, 40000.00, NULL, 200, 80, 'N/A', 'Đỏ', 'Trung Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Lược chải bọ chét ND cho thú cưng', 'Lược ND lộng lẫy loại bỏ bọ chét, lông rụng, làm sạch da. Dùng 2-3 lần/tuần, vệ sinh sau mỗi lần, tránh lực mạnh.', 
 6, 22, 150000.00, 120000.00, NULL, 150, 60, 'N/A', 'Xanh lá', 'Trung Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Set cây lăn làm sạch lông chó mèo trên quần áo', 'Cây lăn Me-O rực rỡ loại bỏ lông rụng nhanh chóng. Dùng hàng ngày, thay keo khi hết dính, tránh bề mặt ướt.', 
 6, 11, 120000.00, 100000.00, NULL, 180, 70, 'N/A', 'Hồng', 'Trung Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Bình thức ăn tự động (1.5 – 2.5kg)', 'Bình Whiskas trứ danh cung cấp thức ăn khô tự động, lý tưởng khi vắng nhà. Vệ sinh định kỳ, chỉ dùng hạt khô.', 
 6, 4, 300000.00, 250000.00, NULL, 120, 50, 'N/A', 'Vàng', 'Trung Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Máy lọc nước vuông cho thú cưng', 'Máy Catty rực rỡ lọc nước sạch, kích thích uống nước. Thay nước 1-2 ngày, vệ sinh định kỳ, thay lõi 2-4 tuần.', 
 6, 21, 140000.00, 110000.00, NULL, 100, 40, 'N/A', 'Xanh dương', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- PHỤ KIỆN PRODUCTS (Category: Phụ kiện = 7)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Vòng cổ có chuông cho thú cưng', 'Vòng cổ No Brand tràn đầy sáng tạo, phát chuông nhận diện vị trí, an toàn khi ra ngoài. Không siết chặt, kiểm tra định kỳ. Chihuahua', 
 7, 20, 25000.00, 20000.00, NULL, 250, 100, 'N/A', 'Xanh lá', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Balo mang thú cưng hộp vuông hình phi hành gia', 'Balo Me-O rực rỡ với kính phi hành gia, an toàn di chuyển. Thú cưng quen chật trước, kiểm tra khóa, vệ sinh thường xuyên.', 
 7, 11, 550000.00, 450000.00, NULL, 80, 30, 'N/A', 'Đỏ', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Dây dắt balo cho thú cưng', 'Dây dắt Teddy huyền ảo điều chỉnh linh hoạt, kiểm soát an toàn. Kiểm tra độ bền, vệ sinh định kỳ, không kéo mạnh.', 
 7, 23, 95000.00, 75000.00, NULL, 150, 60, 'N/A', 'Hồng', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Rọ mõm màu hồng', 'Rọ mõm Teddy huyền ảo kiểm soát cắn phá, thoáng khí. Không dùng lâu, tháo khi an toàn, tránh siết chặt.', 
 7, 23, 60000.00, 50000.00, NULL, 120, 50, 'N/A', 'Hồng', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Váy tết Trung Thu', 'Váy Me-O rực rỡ với họa tiết Trung Thu, chụp ảnh lý tưởng. Chọn size phù hợp, giặt tay, không mặc nóng.', 
 7, 11, 130000.00, 100000.00, NULL, 100, 40, 'N/A', 'Vàng', 'Việt Nam', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- VỆ SINH PRODUCTS (Category: Vệ sinh = 8)
INSERT INTO products (ten_product, mo_ta, id_category, id_brand, gia_ban, gia_goc, gia_khuyen_mai, 
                      so_luong_ton_kho, so_luong_da_ban, trong_luong, mau_sac, xuat_xu, 
                      ngay_san_xuat, han_su_dung, is_featured, is_enabled, so_lan_xem, 
                      ngay_tao, ngay_cap_nhat)
VALUES 
('Khay vệ sinh lưới cho chó', 'Khay Teddy huyền ảo hỗ trợ chó đi vệ sinh đúng chỗ, chống dẫm bẩn. Rửa thường xuyên, đặt cố định, huấn luyện kèm thưởng. Chihuahua', 
 8, 22, 280000.00, 230000.00, NULL, 120, 50, 'N/A', 'Xanh lá', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Xịt vệ sinh răng miệng cho chó Budle Budle (100ml)', 'Xịt Budle Budle rực rỡ khử mùi hôi miệng, ngăn mảng bám. Dùng 1-2 lần/ngày, tránh mắt, đậy kín.', 
 8, 23, 120000.00, 100000.00, NULL, 150, 60, 'N/A', 'Đỏ', 'Hàn Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Dầu tắm Yu cho thú cưng (400ml)', 'Dầu Yu lộng lẫy làm sạch lông, khử mùi, dưỡng da. Dùng 1-2 lần/tuần, tránh mắt, xả kỹ.', 
 8, 24, 380000.00, 320000.00, NULL, 100, 40, '400ml', 'Hồng', 'Hàn Quốc', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Cát Cature cho mèo (6L)', 'Cát Cature huyền thoại vón cục nhanh, khử mùi hiệu quả. Thay 5-7 ngày, không đổ toilet, bảo quản khô.', 
 8, 25, 155000.00, 130000.00, NULL, 200, 80, '6L', 'Xanh dương', 'Nhật Bản', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW()),

('Xịt răng miệng Tropiclean khử mùi hôi cho cún (118ml)', 'Xịt Tropiclean trứ danh khử mùi hôi miệng, giảm vi khuẩn. Dùng 1-2 lần/ngày, tránh mắt, không cho chó dưới 8 tuần.', 
 8, 26, 300000.00, 250000.00, NULL, 130, 50, '118ml', 'Vàng', 'Mỹ', 
 '2025-07-01 00:00:00', '2026-07-01 00:00:00', FALSE, TRUE, 0, NOW(), NOW());


-- ============================================================
-- 4. INSERT PRODUCT IMAGES
-- Mapping product images from old HinhAnh field to product_images table
-- Adjust product_id based on actual inserted product IDs
-- ============================================================
INSERT INTO product_images (id_product, image_url, is_thumbnail, display_order)
VALUES 
-- PATE images (products 1-5)
(1, '/Images/product/pate/pate_hug_120g.png', TRUE, 0),
(2, '/Images/product/pate/pate_miratorg_85g.png', TRUE, 0),
(3, '/Images/product/pate/pate_meowcat_70g.png', TRUE, 0),
(4, '/Images/product/pate/pate_whiskas_400g.png', TRUE, 0),
(5, '/Images/product/pate/pate_kings_pet_380g.png', TRUE, 0),

-- THỨC ĂN HẠT images (products 6-10)
(6, '/Images/product/thucanhat/ganado_3kg.png', TRUE, 0),
(7, '/Images/product/thucanhat/lapaw_400g.png', TRUE, 0),
(8, '/Images/product/thucanhat/reflex_2kg.png', TRUE, 0),
(9, '/Images/product/thucanhat/zenith_1.2kg.png', TRUE, 0),
(10, '/Images/product/thucanhat/catsrang_2kg.png', TRUE, 0),

-- BÁNH THƯỞNG images (products 11-15)
(11, '/Images/product/banhthuong/meo_50g.png', TRUE, 0),
(12, '/Images/product/banhthuong/catty_man_30g.png', TRUE, 0),
(13, '/Images/product/banhthuong/bowwow_120g.png', TRUE, 0),
(14, '/Images/product/banhthuong/doggy_man_100g.png', TRUE, 0),
(15, '/Images/product/banhthuong/que_co_meo_200g.png', TRUE, 0),

-- THỰC PHẨM CHỨC NĂNG images (products 16-20)
(16, '/Images/product/thucphamchucnang/predogen_cho_110g.png', TRUE, 0),
(17, '/Images/product/thucphamchucnang/predogen_meo_110g.png', TRUE, 0),
(18, '/Images/product/thucphamchucnang/drontal_cho.png', TRUE, 0),
(19, '/Images/product/thucphamchucnang/nexgard_spectra.png', TRUE, 0),
(20, '/Images/product/thucphamchucnang/frontline_meo.png', TRUE, 0),

-- ĐỒ CHƠI images (products 21-25)
(21, '/Images/product/dochoi/tru_cao_65cm.png', TRUE, 0),
(22, '/Images/product/dochoi/ca_lon.png', TRUE, 0),
(23, '/Images/product/dochoi/que_tet_45cm.png', TRUE, 0),
(24, '/Images/product/dochoi/chuong_huan_luyen.png', TRUE, 0),
(25, '/Images/product/dochoi/ban_cao_mong.png', TRUE, 0),

-- DỤNG CỤ images (products 26-30)
(26, '/Images/product/dungcu/bat_trai_dau.png', TRUE, 0),
(27, '/Images/product/dungcu/luoc_bo_chet.png', TRUE, 0),
(28, '/Images/product/dungcu/cay_lan_long.png', TRUE, 0),
(29, '/Images/product/dungcu/binh_thuc_an.png', TRUE, 0),
(30, '/Images/product/dungcu/may_loc_nuoc.png', TRUE, 0),

-- PHỤ KIỆN images (products 31-35)
(31, '/Images/product/phukien/vong_co_chuong.png', TRUE, 0),
(32, '/Images/product/phukien/balo_phuong_gia.png', TRUE, 0),
(33, '/Images/product/phukien/day_dat_balo.png', TRUE, 0),
(34, '/Images/product/phukien/ro_mom_hong.png', TRUE, 0),
(35, '/Images/product/phukien/vay_trung_thu.png', TRUE, 0),

-- VỆ SINH images (products 36-40)
(36, '/Images/product/vesinh/khay_luoi_cho.png', TRUE, 0),
(37, '/Images/product/vesinh/xit_rang_budle.png', TRUE, 0),
(38, '/Images/product/vesinh/dau_tam_yu.png', TRUE, 0),
(39, '/Images/product/vesinh/cat_cature_6l.png', TRUE, 0),
(40, '/Images/product/vesinh/xit_rang_tropiclean.png', TRUE, 0);


-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- SELECT COUNT(*) FROM brands;      -- Should return 33
-- SELECT COUNT(*) FROM categories;  -- Should return 8
-- SELECT COUNT(*) FROM products;    -- Should return 40
-- SELECT COUNT(*) FROM product_images; -- Should return 40

-- ============================================================
-- NOTES FOR USAGE:
-- ============================================================
-- 1. Make sure the database 'pawverse_db' exists and is selected
-- 2. Run this script in order - brands first, then categories, then products, then product_images
-- 3. Product IDs in product_images INSERT assume sequential IDs starting from 1
--    If you have existing products, adjust the id_product values accordingly
-- 4. All image paths are relative - ensure your image files exist at these locations
-- 5. TrangThai conversion: 1 (old) → 'Hoạt động' (new), 0 (old) → 'Ngưng hoạt động' (new)
-- 6. Date format: Old format 'YYYY-MM-DD' converted to MySQL DATETIME 'YYYY-MM-DD HH:MM:SS'
-- 7. Brand and Category IDs in products table assume sequential insertion starting from 1
--    Adjust id_brand and id_category if needed based on your actual IDs
-- ============================================================
