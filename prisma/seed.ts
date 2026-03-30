// Seed Data - Dữ liệu khởi tạo cho SB-GARAGE
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚗 Bắt đầu seed dữ liệu SB-GARAGE...\n');

  console.log('🗑️ Xóa dữ liệu cũ...');
  // Xóa theo thứ tự phụ thuộc (bảng con trước, bảng cha sau)
  await prisma.starterPerk.deleteMany();
  await prisma.cardCombo.deleteMany();
  await prisma.cardEffect.deleteMany();
  await prisma.levelReward.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.bossConfig.deleteMany();
  await prisma.gameEvent.deleteMany();
  await prisma.ending.deleteMany();
  await prisma.questConfig.deleteMany();
  await prisma.card.deleteMany();
  console.log('✅ Xóa dữ liệu cũ hoàn tất\n');

  // ============================================================
  // 1. CARDS - Thẻ bài (30 thẻ)
  // ============================================================
  console.log('📦 Tạo thẻ bài...');

  const cards = await Promise.all([
    // === FILTER (Lọc gió) - Tổng 18 thẻ ===
    prisma.card.create({ data: { name: 'Lọc Gió Bằng Giấy', type: 'FILTER', rarity: 1, statPower: 3, statHeat: 5, statStability: 0, cost: 20, description: 'Rất mỏng manh, dễ rách và bám bụi.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Xốp Dày', type: 'FILTER', rarity: 1, statPower: 4, statHeat: 3, statStability: 1, cost: 35, description: 'Dày hơn nhưng làm giảm luồng không khí.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Lưới Sắt', type: 'FILTER', rarity: 1, statPower: 6, statHeat: 7, statStability: 2, cost: 45, description: 'Luồng gió mạnh nhưng hút cả khí nóng của máy.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Tái Chế', type: 'FILTER', rarity: 1, statPower: 4, statHeat: 6, statStability: 0, cost: 25, description: 'Hàng rẻ tiền từ bãi rác, không bền.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Cơ Bản', type: 'FILTER', rarity: 1, statPower: 5, statHeat: 3, statStability: 1, cost: 50, description: 'Bộ lọc gió tiêu chuẩn, giúp không khí sạch vào động cơ.' } }),
    
    prisma.card.create({ data: { name: 'Lọc Gió Cotton', type: 'FILTER', rarity: 2, statPower: 9, statHeat: 5, statStability: 2, cost: 85, description: 'Cản bụi tốt, giữ gió sạch và mát.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Hình Nón', type: 'FILTER', rarity: 2, statPower: 14, statHeat: 8, statStability: 1, cost: 110, description: 'Cone cone intake - nạp nhanh nhưng nóng máy.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Hộp Kín', type: 'FILTER', rarity: 2, statPower: 10, statHeat: 3, statStability: 4, cost: 130, description: 'Cách nhiệt tốt, hút không khí từ bên ngoài xe.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Màng Dầu', type: 'FILTER', rarity: 2, statPower: 11, statHeat: 5, statStability: 3, cost: 140, description: 'Phủ dầu cản bụi siêu bụi, bảo vệ động cơ.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Performance', type: 'FILTER', rarity: 2, statPower: 12, statHeat: 6, statStability: 3, cost: 120, description: 'Bộ lọc gió hiệu năng cao, tăng luồng gió đáng kể.' } }),
    
    prisma.card.create({ data: { name: 'Lọc Gió Thể Thao K&N', type: 'FILTER', rarity: 3, statPower: 20, statHeat: 6, statStability: 5, cost: 220, description: 'Thương hiệu uy tín, ngon bổ rẻ cho mọi dòng xe.' } }),
    prisma.card.create({ data: { name: 'Cold Air Intake', type: 'FILTER', rarity: 3, statPower: 22, statHeat: 2, statStability: 8, cost: 280, description: 'Ống dẫn hút khí lạnh trực tiếp từ gầm xe.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Dual Cone', type: 'FILTER', rarity: 3, statPower: 28, statHeat: 9, statStability: 4, cost: 310, description: 'Hai nón hút gió song song, luồng khí dồi dào mãnh liệt.' } }),
    prisma.card.create({ data: { name: 'Lọc Gió Carbon Fiber', type: 'FILTER', rarity: 3, statPower: 25, statHeat: 5, statStability: 7, cost: 250, description: 'Lọc gió sợi carbon siêu nhẹ, luồng gió cực mạnh.' } }),
    
    prisma.card.create({ data: { name: 'Hệ Thống Ram Air', type: 'FILTER', rarity: 4, statPower: 40, statHeat: 7, statStability: 12, cost: 650, description: 'Ép gió tốc độ cao. (Hiệu ứng: Giảm 10 Heat cho xe)' } }),
    prisma.card.create({ data: { name: 'Bộ Gió Big Bore', type: 'FILTER', rarity: 4, statPower: 45, statHeat: 12, statStability: 8, cost: 720, description: 'Hút khí cưỡng bức. (Hiệu ứng: +15 Power khi chạy thử)' } }),
    
    prisma.card.create({ data: { name: 'Hyper-Flow Titanium', type: 'FILTER', rarity: 5, statPower: 65, statHeat: 6, statStability: 20, cost: 1400, description: 'Khí động học Titan. (Hiệu ứng: +1 Power cho mỗi 1 Stability tổng)' } }),
    prisma.card.create({ data: { name: 'Quantum Intake', type: 'FILTER', rarity: 5, statPower: 70, statHeat: -4, statStability: 25, cost: 1800, description: 'Hút gió lượng tử khí âm sâu. (Hiệu ứng: Giảm 50% Heat của Engine!)' } }),

    // === ENGINE (Động cơ) - Tổng 25 thẻ ===
    prisma.card.create({ data: { name: 'Động Cơ Xe Máy 50cc', type: 'ENGINE', rarity: 1, statPower: 8, statHeat: 2, statStability: 5, cost: 20, description: 'Rất yếu nhưng được cái không nóng.' } }),
    prisma.card.create({ data: { name: 'Động Cơ Máy Phát Điện', type: 'ENGINE', rarity: 1, statPower: 12, statHeat: 12, statStability: 2, cost: 35, description: 'Yếu, hú to, rung bần bật.' } }),
    prisma.card.create({ data: { name: 'Động Cơ 1.0L 3 Xy-lanh', type: 'ENGINE', rarity: 1, statPower: 15, statHeat: 9, statStability: 4, cost: 65, description: 'Chỉ dùng chạy siêu thị, tiếng lạch cạch.' } }),
    prisma.card.create({ data: { name: 'V4 Cũ Nát', type: 'ENGINE', rarity: 1, statPower: 18, statHeat: 17, statStability: 1, cost: 80, description: 'Ăn dầu, lúc nổ lúc xịt.' } }),
    prisma.card.create({ data: { name: 'Động Cơ 1.5L', type: 'ENGINE', rarity: 1, statPower: 25, statHeat: 14, statStability: 2, cost: 100, description: 'Động cơ 4 xi-lanh 1.5L, đáng tin cậy nhưng công suất thấp.' } }),

    prisma.card.create({ data: { name: 'Động Cơ Dầu 2.5L Cũ', type: 'ENGINE', rarity: 2, statPower: 25, statHeat: 23, statStability: 5, cost: 120, description: 'Khói đen mịt mù nhưng moment xoắn ổn.' } }),
    prisma.card.create({ data: { name: 'I4 1.8L Bền Bỉ', type: 'ENGINE', rarity: 2, statPower: 28, statHeat: 14, statStability: 15, cost: 160, description: 'Không có gì để hỏng, nồi đồng cối đá.' } }),
    prisma.card.create({ data: { name: 'Boxer 2.0L Hút Khí Tự Nhiên', type: 'ENGINE', rarity: 2, statPower: 32, statHeat: 21, statStability: 25, cost: 210, description: 'Trọng tâm cực thấp, xe rất thăng bằng.' } }),
    prisma.card.create({ data: { name: 'V6 2.5L Tiêu Chuẩn', type: 'ENGINE', rarity: 2, statPower: 35, statHeat: 25, statStability: 8, cost: 190, description: 'Mẫu động cơ quốc dân.' } }),
    prisma.card.create({ data: { name: 'Động Cơ 2.0L Turbo', type: 'ENGINE', rarity: 2, statPower: 50, statHeat: 23, statStability: 5, cost: 200, description: 'Động cơ 2.0L tăng áp, cân bằng nhẹ giữa sức mạnh và nhiệt.' } }),

    prisma.card.create({ data: { name: 'I6 3.0L Cầm Chừng', type: 'ENGINE', rarity: 3, statPower: 55, statHeat: 32, statStability: 12, cost: 280, description: 'Êm ả, mượt mà ở vòng tua cao.' } }),
    prisma.card.create({ data: { name: 'V6 3.5L Hút Khí Tự Nhiên', type: 'ENGINE', rarity: 3, statPower: 60, statHeat: 35, statStability: 18, cost: 320, description: 'Đủ sức đi tour bạo lực trên cao tốc.' } }),
    prisma.card.create({ data: { name: 'V8 4.0L Nhỏ', type: 'ENGINE', rarity: 3, statPower: 65, statHeat: 40, statStability: 8, cost: 360, description: 'Sức mạnh cơ bắp của Mỹ đời đầu.' } }),
    prisma.card.create({ data: { name: 'Rotary Wankel Đúc Xương', type: 'ENGINE', rarity: 3, statPower: 70, statHeat: 52, statStability: 5, cost: 420, description: 'Vòng tua cao ngất ngưởng, tốn nhớt tốn xăng.' } }),
    prisma.card.create({ data: { name: 'V6 Twin-Turbo', type: 'ENGINE', rarity: 3, statPower: 85, statHeat: 35, statStability: 7, cost: 400, description: 'Động cơ V6 đôi tăng áp, sức mạnh vượt trội.' } }),

    prisma.card.create({ data: { name: 'Động Cơ Inline-6 2JZ', type: 'ENGINE', rarity: 4, statPower: 85, statHeat: 35, statStability: 40, cost: 850, description: 'Quái vật độ xe huyền thoại. (Hiệu ứng: Chịu Đựng - Trừ 15 Heat cho tất cả Turbo)' } }),
    prisma.card.create({ data: { name: 'V8 5.0L N/A', type: 'ENGINE', rarity: 4, statPower: 90, statHeat: 46, statStability: 15, cost: 700, description: 'Sức mạnh thuần túy, tiếng gầm đã tai. (Thuần sức mạnh)' } }),
    prisma.card.create({ data: { name: 'Động Cơ Điện Dual-Motor', type: 'ENGINE', rarity: 4, statPower: 100, statHeat: 57, statStability: 35, cost: 750, description: 'Đáp ứng momen xoắn tức thời. (Chỉ số thuần túy)' } }),
    prisma.card.create({ data: { name: 'V10 5.2L Screamer', type: 'ENGINE', rarity: 4, statPower: 110, statHeat: 69, statStability: 20, cost: 950, description: 'Tua máy 9000rpm chọc lủng màng nhĩ. (Hiệu ứng: V10 Screamer - +20 Power On-Test)' } }),
    prisma.card.create({ data: { name: 'V8 Supercharged', type: 'ENGINE', rarity: 4, statPower: 180, statHeat: 63, statStability: 12, cost: 800, description: 'Quái vật V8 siêu nạp! Công suất khổng lồ nhưng rất nóng.' } }),

    prisma.card.create({ data: { name: 'I4 F1 Turbo-Hybrid 1.6L', type: 'ENGINE', rarity: 5, statPower: 140, statHeat: 81, statStability: 50, cost: 1800, description: 'Công nghệ đường đua F1 tân tiến nhất! (Hiệu ứng: KERS Hệ Thống)' } }),
    prisma.card.create({ data: { name: 'Động Cơ V12 6.5L Ý', type: 'ENGINE', rarity: 5, statPower: 150, statHeat: 92, statStability: 25, cost: 1500, description: 'Tác phẩm nghệ thuật cơ khí đỉnh cao. (Chỉ số khổng lồ)' } }),
    prisma.card.create({ data: { name: 'Động Cơ Điện Quad-Motor TriMax', type: 'ENGINE', rarity: 5, statPower: 180, statHeat: 115, statStability: 60, cost: 2200, description: 'Gia tốc 0-100km/h trong 1.9s! Nhiệt từ pin siêu cao. (Hiệu ứng: Tương Lai - Tự động x2 Stability)' } }),
    prisma.card.create({ data: { name: 'W16 Quad-Turbo', type: 'ENGINE', rarity: 5, statPower: 250, statHeat: 52, statStability: 20, cost: 2000, description: 'Động cơ W16 huyền thoại - đỉnh cao kỹ thuật cơ khí. (Hiệu ứng đặc biệt!)' } }),
    prisma.card.create({ data: { name: 'Động Cơ Phản Lực J58', type: 'ENGINE', rarity: 5, statPower: 250, statHeat: 173, statStability: 0, cost: 1900, description: 'SR-71 Blackbird nhét vào ô tô. Rất dễ nổ! (Thuần sát thương diện rộng)' } }),


    // === TURBO - Tổng 18 thẻ ===
    prisma.card.create({ data: { name: 'Turbo Cũ Phế Liệu', type: 'TURBO', rarity: 1, statPower: 8, statHeat: 17, statStability: 0, cost: 30, description: 'Nhặt từ bãi rác, chạy được là may, cực nóng!' } }),
    prisma.card.create({ data: { name: 'Turbo Rỉ Sét', type: 'TURBO', rarity: 1, statPower: 10, statHeat: 14, statStability: 0, cost: 40, description: 'Kêu cót két nhưng vẫn ép gió tạm.' } }),
    prisma.card.create({ data: { name: 'Turbo Đơn Cỡ Nhỏ', type: 'TURBO', rarity: 1, statPower: 14, statHeat: 13, statStability: 2, cost: 65, description: 'Loại thông dụng gắn sẵn trên các dòng xe gia đình.' } }),
    prisma.card.create({ data: { name: 'Chông Gió Giả Turbo', type: 'TURBO', rarity: 1, statPower: 5, statHeat: 2, statStability: 5, cost: 25, description: 'Gắn bô xả tạo tiếng giả turbo, rẻ tiền ít nóng.' } }),
    prisma.card.create({ data: { name: 'Turbo Nhỏ', type: 'TURBO', rarity: 1, statPower: 12, statHeat: 12, statStability: 1, cost: 80, description: 'Turbo nhỏ tăng áp nhẹ cho động cơ.' } }),

    prisma.card.create({ data: { name: 'Turbo Máy Kéo', type: 'TURBO', rarity: 2, statPower: 20, statHeat: 21, statStability: 1, cost: 130, description: 'Tháo từ máy cày, trâu bò nhưng độ trễ kinh hồn.' } }),
    prisma.card.create({ data: { name: 'Turbo Cánh Khế', type: 'TURBO', rarity: 2, statPower: 25, statHeat: 17, statStability: 3, cost: 170, description: 'Billet compressor - trọng lượng nhẹ, xoay nhanh.' } }),
    prisma.card.create({ data: { name: 'Turbo Ổ Bi', type: 'TURBO', rarity: 2, statPower: 22, statHeat: 14, statStability: 5, cost: 210, description: 'Ball bearing quay siêu mượt, giảm ma sát tạo nhiệt.' } }),
    prisma.card.create({ data: { name: 'Turbo Tăng Áp Dầu', type: 'TURBO', rarity: 2, statPower: 28, statHeat: 23, statStability: 2, cost: 190, description: 'Bốc mạnh ở dải vòng tua cao, cần nhiều nhớt.' } }),

    prisma.card.create({ data: { name: 'Turbo Bi-Turbo Nhỏ', type: 'TURBO', rarity: 3, statPower: 35, statHeat: 18, statStability: 4, cost: 310, description: 'Đáp ứng cực nhanh trong phố lẫn đường trường.' } }),
    prisma.card.create({ data: { name: 'Supercharger Yếu', type: 'TURBO', rarity: 3, statPower: 38, statHeat: 23, statStability: 2, cost: 360, description: 'Dây đai truyền động trục tiếp, không độ trễ nhưng ồn.' } }),
    prisma.card.create({ data: { name: 'Turbo Biến Thiên', type: 'TURBO', rarity: 3, statPower: 32, statHeat: 14, statStability: 8, cost: 400, description: 'VNT Turbo điều chỉnh khe hở gió, giữ mát tốt.' } }),
    prisma.card.create({ data: { name: 'Turbo Tăng Áp Đôi', type: 'TURBO', rarity: 3, statPower: 42, statHeat: 21, statStability: 3, cost: 350, description: 'Hệ thống tăng áp kép, boost mạnh mẽ!' } }),

    prisma.card.create({ data: { name: 'Turbo Twin-Scroll', type: 'TURBO', rarity: 4, statPower: 55, statHeat: 29, statStability: 10, cost: 750, description: 'Đường xoắn kép nạp max hiệu suất. (Hiệu ứng: +20 Power ON_TEST)' } }),
    prisma.card.create({ data: { name: 'Supercharger Roots', type: 'TURBO', rarity: 4, statPower: 65, statHeat: 40, statStability: 5, cost: 850, description: 'Siêu nạp khổng lồ nắp capo. (Hiệu ứng: x1.5 Power bản thân)' } }),

    prisma.card.create({ data: { name: 'Vortex Hố Đen', type: 'TURBO', rarity: 5, statPower: 120, statHeat: 46, statStability: 0, cost: 1900, description: 'Hút cả ánh sáng! (Hiệu ứng: Hút 50% Power từ Engine làm của mình, tăng 30 Heat)' } }),
    prisma.card.create({ data: { name: 'Anti-Lag System', type: 'TURBO', rarity: 5, statPower: 90, statHeat: 17, statStability: 30, cost: 2200, description: 'Bang-bang nổ pô liên thanh. (Hiệu ứng: Engine +50 Power, Ống Xả -20 Heat)' } }),
    prisma.card.create({ data: { name: 'Turbo Titan X', type: 'TURBO', rarity: 5, statPower: 100, statHeat: 23, statStability: 15, cost: 1500, description: 'Turbo cấp huyền thoại! (Hiệu ứng: Titan Boost - +30 Power khi chạy thử, không tăng Heat)' } }),

    // === EXHAUST (Ống xả) - Tổng 18 thẻ ===
    prisma.card.create({ data: { name: 'Ống Bơ Hài Hước', type: 'EXHAUST', rarity: 1, statPower: 1, statHeat: 0, statStability: 1, cost: 15, description: 'Chế từ ống bơ, kêu như bò rống, khách chê.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Gỉ Sét', type: 'EXHAUST', rarity: 1, statPower: 3, statHeat: -1, statStability: 2, cost: 25, description: 'Thoát khí kém, xả nhiệt ít, sắp rụng.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Xe Máy', type: 'EXHAUST', rarity: 1, statPower: 4, statHeat: -2, statStability: 3, cost: 40, description: 'Cố nhét pô xe máy vào ô tô, bí hơi.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Cắt Ngắn', type: 'EXHAUST', rarity: 1, statPower: 12, statHeat: -4, statStability: 0, cost: 50, description: 'Cắt thẳng cổ xả ra ngoài, ồn ào và rung lắc.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Tiêu Chuẩn', type: 'EXHAUST', rarity: 1, statPower: 8, statHeat: -3, statStability: 4, cost: 60, description: 'Ống xả mặc định, thoát khí ổn định.' } }),

    prisma.card.create({ data: { name: 'Ống Xả Inox 304', type: 'EXHAUST', rarity: 2, statPower: 10, statHeat: -6, statStability: 8, cost: 110, description: 'Bền bỉ, sáng bóng, chống rỉ sét rạn nứt tuyệt đối.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Cat-back', type: 'EXHAUST', rarity: 2, statPower: 12, statHeat: -4, statStability: 5, cost: 130, description: 'Giữ lại bầu lọc khí thải nhưng ống to hơn.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Kép Dạng Y', type: 'EXHAUST', rarity: 2, statPower: 15, statHeat: -7, statStability: 4, cost: 145, description: 'Phân luồng khí xả hai bên, tản nhiệt tốt.' } }),
    prisma.card.create({ data: { name: 'Header Thép Cuộn', type: 'EXHAUST', rarity: 2, statPower: 20, statHeat: -3, statStability: 3, cost: 160, description: 'Cổ pô uốn cong tối ưu hóa dòng khí xả.' } }),
    prisma.card.create({ data: { name: 'Ống Xả Performance', type: 'EXHAUST', rarity: 2, statPower: 18, statHeat: -5, statStability: 7, cost: 150, description: 'Ống xả thể thao, thoát khí nhanh giảm nhiệt.' } }),

    prisma.card.create({ data: { name: 'Ống Xả Trị Liệu Âm', type: 'EXHAUST', rarity: 3, statPower: 15, statHeat: -8, statStability: 15, cost: 250, description: 'Âm thanh trầm ấm êm tai, cấu trúc vững chãi.' } }),
    prisma.card.create({ data: { name: 'Titanium Nhiệt Tiêu', type: 'EXHAUST', rarity: 3, statPower: 25, statHeat: -13, statStability: 8, cost: 350, description: 'Mỏng nhẹ tản nhiệt cực nhanh vì chế tác bằng Titan.' } }),
    prisma.card.create({ data: { name: 'Header Chéo Racing', type: 'EXHAUST', rarity: 3, statPower: 30, statHeat: -10, statStability: 6, cost: 380, description: 'Cổ xả phức tạp đồng bộ nhịp nổ của xi-lanh.' } }),
    
    prisma.card.create({ data: { name: 'Hệ Thống Side-Exit', type: 'EXHAUST', rarity: 4, statPower: 45, statHeat: -15, statStability: 10, cost: 650, description: 'Pô hông xe phong cách JDM! (Hiệu ứng: Lan tỏa - giảm 10 Heat cho thẻ ngay sau lưng)' } }),
    prisma.card.create({ data: { name: 'Catless Downpipe', type: 'EXHAUST', rarity: 4, statPower: 60, statHeat: -8, statStability: 5, cost: 720, description: 'Khạc lửa ầm ầm! (Hiệu ứng: Xả nhiệt toàn bộ xe -2 Heat mọi thẻ)' } }),
    prisma.card.create({ data: { name: 'Ống Xả Titan Racing', type: 'EXHAUST', rarity: 4, statPower: 50, statHeat: -17, statStability: 18, cost: 600, description: 'Ống xả titanium racing! Giảm nhiệt mạnh + tăng power.' } }),

    prisma.card.create({ data: { name: 'Ghost Exhaust', type: 'EXHAUST', rarity: 5, statPower: 55, statHeat: -38, statStability: 40, cost: 1600, description: 'Công nghệ tàng hình âm thanh. (Hiệu ứng: Bypass "NO_EXHAUST", nhân đôi Stability gốc)' } }),
    prisma.card.create({ data: { name: 'Plasma Đỏ Lửa', type: 'EXHAUST', rarity: 5, statPower: 80, statHeat: -25, statStability: 25, cost: 2100, description: 'Pô gốm vũ trụ plasma. (Hiệu ứng: Nhân đôi Heat âm thành -60 Heat!)' } }),

    // === COOLING (Hệ thống làm mát) - Tổng 19 thẻ ===
    prisma.card.create({ data: { name: 'Nước Lã Cây Xăng', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -1, statStability: 0, cost: 10, description: 'Đổ nước máy cho két nước rỉ sét.' } }),
    prisma.card.create({ data: { name: 'Quạt Chĩa Điều Hòa', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -2, statStability: 2, cost: 25, description: 'Cột quạt điện vào lưới tản nhiệt.' } }),
    prisma.card.create({ data: { name: 'Két Nước Nhựa', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -3, statStability: 0, cost: 45, description: 'Dễ bung mối nối khi vòng tua cao.' } }),
    prisma.card.create({ data: { name: 'Quạt Làm Mát', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -4, statStability: 8, cost: 70, description: 'Quạt tản nhiệt cơ bản, giúp hạ nhiệt động cơ.' } }),

    prisma.card.create({ data: { name: 'Nước Làm Mát Pha Loãng', type: 'COOLING', rarity: 2, statPower: 0, statHeat: -5, statStability: 4, cost: 80, description: 'Xanh lè nhưng nhiều cặn.' } }),
    prisma.card.create({ data: { name: 'Ống Dẫn Nhiệt Silicon', type: 'COOLING', rarity: 2, statPower: 0, statHeat: -7, statStability: 8, cost: 110, description: 'Tản nhiệt mạch máu bền bỉ.' } }),
    prisma.card.create({ data: { name: 'Két Nước Đôi Nhôm Lớn', type: 'COOLING', rarity: 2, statPower: 2, statHeat: -10, statStability: 6, cost: 140, description: 'Nặng nhưng khá mát.' } }),
    prisma.card.create({ data: { name: 'Két Nước Racing', type: 'COOLING', rarity: 2, statPower: 3, statHeat: -8, statStability: 12, cost: 160, description: 'Két nước cỡ lớn cho xe đua.' } }),

    prisma.card.create({ data: { name: 'Quạt Điện Đôi Hiệu Năng', type: 'COOLING', rarity: 3, statPower: 3, statHeat: -15, statStability: 10, cost: 260, description: 'Giải nhiệt tức thì khi kẹt xe.' } }),
    prisma.card.create({ data: { name: 'Dung Dịch Nước Đá', type: 'COOLING', rarity: 3, statPower: 5, statHeat: -19, statStability: 8, cost: 320, description: 'Chất lỏng đặc biệt siêu sủi bọt.' } }),
    prisma.card.create({ data: { name: 'Bộ Két Nhôm CNC 3 Lõi', type: 'COOLING', rarity: 3, statPower: 4, statHeat: -21, statStability: 15, cost: 390, description: 'Hút gió đỉnh, chịu áp lực cao.' } }),
    prisma.card.create({ data: { name: 'Intercooler Carbon', type: 'COOLING', rarity: 3, statPower: 7, statHeat: -15, statStability: 18, cost: 380, description: 'Bộ tản nhiệt trung gian carbon, giảm nhiệt cực mạnh.' } }),

    prisma.card.create({ data: { name: 'Nước Làm Mát Ngoại Cỡ', type: 'COOLING', rarity: 4, statPower: 5, statHeat: -34, statStability: 20, cost: 650, description: 'Sôi ở 190 độ C, không bao giờ trào.' } }),
    prisma.card.create({ data: { name: 'Bộ Làm Mát Bằng Cồn Methanol', type: 'COOLING', rarity: 4, statPower: 15, statHeat: -30, statStability: 5, cost: 800, description: 'Phun Methanol! (Hiệu ứng: Bốc Hơi Ác Liệt - +10 Power nhờ nạp khí lạnh)' } }),
    prisma.card.create({ data: { name: 'Két Nước Khổng Lồ Tích Hợp', type: 'COOLING', rarity: 4, statPower: 0, statHeat: -42, statStability: 25, cost: 850, description: 'Nhìn như chiếc khiên che hết đầu xe.' } }),

    prisma.card.create({ data: { name: 'Khí Nito Lỏng Làm Mát Trực Tiếp', type: 'COOLING', rarity: 5, statPower: 20, statHeat: -68, statStability: 10, cost: 1900, description: 'Sương giá bủa vây động cơ! (Hiệu ứng: Deep Freeze - Bất bạo động Boss nhiệt)' } }),
    prisma.card.create({ data: { name: 'Bộ Tản Nhiệt Graphene', type: 'COOLING', rarity: 5, statPower: 10, statHeat: -59, statStability: 40, cost: 1800, description: 'Siêu vật liệu dẫn nhiệt tuyệt đối.' } }),
    prisma.card.create({ data: { name: 'Hệ Thống Từ Trường Lượng Tử', type: 'COOLING', rarity: 5, statPower: 0, statHeat: -85, statStability: 50, cost: 2300, description: 'Công nghệ ngoài vũ trụ. (Hiệu ứng: Không Độ Tuyệt Đối - Ép Heat toàn xe bằng 0)' } }),
    prisma.card.create({ data: { name: 'Cryo Cooling System', type: 'COOLING', rarity: 5, statPower: 15, statHeat: -30, statStability: 35, cost: 1800, description: 'Hệ thống đóng băng mọi nhiệt độ. (Giảm 10 Heat toàn xe bằng Passive)' } }),


    // === FUEL (Nhiên liệu) - Tổng 18 thẻ ===
    prisma.card.create({ data: { name: 'Xăng Pha Nước', type: 'FUEL', rarity: 1, statPower: 2, statHeat: 12, statStability: -5, cost: 15, description: 'Xe giật cục, đánh lửa lỗi liên tục.' } }),
    prisma.card.create({ data: { name: 'Nhiên Liệu Tái Chế Cặn', type: 'FUEL', rarity: 1, statPower: 5, statHeat: 9, statStability: -2, cost: 25, description: 'Lấy từ ống xả lò đốt rác.' } }),
    prisma.card.create({ data: { name: 'Xăng A92 Giá Rẻ', type: 'FUEL', rarity: 1, statPower: 8, statHeat: 6, statStability: 0, cost: 35, description: 'Tạm xài được qua ngày.' } }),
    prisma.card.create({ data: { name: 'Xăng RON 95', type: 'FUEL', rarity: 1, statPower: 10, statHeat: 7, statStability: 2, cost: 50, description: 'Nhiên liệu tiêu chuẩn.' } }),

    prisma.card.create({ data: { name: 'Dầu Diesel Dân Dụng', type: 'FUEL', rarity: 2, statPower: 12, statHeat: 12, statStability: 5, cost: 65, description: 'Chậm chạp nhưng mô-men xoắn đều.' } }),
    prisma.card.create({ data: { name: 'Xăng Sinh Học E5', type: 'FUEL', rarity: 2, statPower: 10, statHeat: 5, statStability: 6, cost: 70, description: 'Bảo vệ môi trường, xe chạy êm.' } }),
    prisma.card.create({ data: { name: 'Phụ Gia Xăng Thập Cẩm', type: 'FUEL', rarity: 2, statPower: 15, statHeat: 14, statStability: 2, cost: 90, description: 'Bỏ lọ làm sạch kim phun tăng chút bốc.' } }),

    prisma.card.create({ data: { name: 'Xăng RON 97', type: 'FUEL', rarity: 3, statPower: 22, statHeat: 9, statStability: 5, cost: 180, description: 'Xịn hơn 95, đánh lửa ngọt ngào.' } }),
    prisma.card.create({ data: { name: 'Xăng Hàng Không AvGas', type: 'FUEL', rarity: 3, statPower: 35, statHeat: 21, statStability: -5, cost: 250, description: 'Trộn ít chì từ sân bay, cẩn thận tắc pô.' } }),
    prisma.card.create({ data: { name: 'Nhiên Liệu Cồn Ethanol E85', type: 'FUEL', rarity: 3, statPower: 40, statHeat: 17, statStability: 8, cost: 290, description: 'Cồn sinh học cháy lạnh, lấy Power cực cao!' } }),
    prisma.card.create({ data: { name: 'Xăng Racing 100', type: 'FUEL', rarity: 3, statPower: 32, statHeat: 12, statStability: 5, cost: 300, description: 'Xăng cao cấp cho xe đua, cháy sạch hơn.' } }),

    prisma.card.create({ data: { name: 'Diesel Tàu Biển Rút Rọn', type: 'FUEL', rarity: 4, statPower: 50, statHeat: 35, statStability: 15, cost: 550, description: 'Khói mù mịt, lực kéo đẩy cả xe lu.' } }),
    prisma.card.create({ data: { name: 'Hỗn Hợp Nitromethane', type: 'FUEL', rarity: 4, statPower: 75, statHeat: 52, statStability: -10, cost: 850, description: 'Chỉ dùng cho xe đua Top Fuel kéo sập đường. (Hiệu ứng: Cháy Kiệt Cực - Slot 1-3: +25 Power. Slot 8-10: +15 Heat)' } }),
    prisma.card.create({ data: { name: 'Phụ Gia Đua Hexane Tinh Khiết', type: 'FUEL', rarity: 4, statPower: 60, statHeat: 29, statStability: 20, cost: 680, description: 'Đánh lửa siêu hoàn hảo.' } }),
    prisma.card.create({ data: { name: 'Nhiên Liệu Tên Lửa', type: 'FUEL', rarity: 4, statPower: 70, statHeat: 35, statStability: 5, cost: 700, description: 'Nhiên liệu quân sự! (+20 Heat On-Test cực nguy hiểm)' } }),

    prisma.card.create({ data: { name: 'Nhiên Liệu Ion Phản Tích Tụ', type: 'FUEL', rarity: 5, statPower: 100, statHeat: 23, statStability: 50, cost: 1800, description: 'Đóng gói Power cực cao mà ít nhiệt dư thừa!' } }),
    prisma.card.create({ data: { name: 'Xăng Nhựa Thông Cực Đoan', type: 'FUEL', rarity: 5, statPower: 130, statHeat: 92, statStability: -20, cost: 2000, description: 'Khét lẹt! (Hiệu ứng: Khi Heat vượt 90%, nhân đôi Power toàn xe!)' } }),
    prisma.card.create({ data: { name: 'Hoạt Chất Lõi Mặt Trời', type: 'FUEL', rarity: 5, statPower: 200, statHeat: 138, statStability: 0, cost: 2500, description: 'Lõi Plasma. (Hiệu ứng: Mặt Trời Thu Nhỏ - Giảm 80% Stability tổng toàn xe)' } }),


    // === SUSPENSION (Hệ thống treo) - Tổng 17 thẻ ===
    prisma.card.create({ data: { name: 'Lò Xo Gãy Nát', type: 'SUSPENSION', rarity: 1, statPower: 0, statHeat: 0, statStability: 1, cost: 10, description: 'Nảy tưng tưng qua từng hòn sỏi.' } }),
    prisma.card.create({ data: { name: 'Giảm Xóc Chảy Dầu', type: 'SUSPENSION', rarity: 1, statPower: 0, statHeat: 0, statStability: 3, cost: 20, description: 'Bập bềnh như ngồi thuyền sóng lớn.' } }),
    prisma.card.create({ data: { name: 'Lò Xo Cắt Ngắn Bằng Máy', type: 'SUSPENSION', rarity: 1, statPower: -2, statHeat: 0, statStability: 4, cost: 40, description: 'Dân chơi hạ gầm bất chấp hỏng gầm.' } }),
    prisma.card.create({ data: { name: 'Giảm Xóc Cơ Bản', type: 'SUSPENSION', rarity: 1, statPower: 2, statHeat: 0, statStability: 6, cost: 60, description: 'Giảm xóc tiêu chuẩn, giữ xe ổn định.' } }),

    prisma.card.create({ data: { name: 'Phuộc Nhún Taxi Cũ', type: 'SUSPENSION', rarity: 2, statPower: 0, statHeat: 0, statStability: 8, cost: 85, description: 'Thay lại từ bản base bãi xe phế thải.' } }),
    prisma.card.create({ data: { name: 'Giảm Xóc Dầu Kép', type: 'SUSPENSION', rarity: 2, statPower: 0, statHeat: 0, statStability: 12, cost: 120, description: 'Đủ xài chở đồ đi phố êm ái.' } }),
    prisma.card.create({ data: { name: 'Phuộc Có Thanh Cân Bằng', type: 'SUSPENSION', rarity: 2, statPower: 5, statHeat: 0, statStability: 15, cost: 160, description: 'Gia cố vào khoang máy cho chắc tay lái.' } }),

    prisma.card.create({ data: { name: 'Hệ Thống Treo Túi Khí Cơm', type: 'SUSPENSION', rarity: 3, statPower: -5, statHeat: 0, statStability: 25, cost: 250, description: 'Air-suspension nhưng chỉnh bằng tay cực chậm.' } }),
    prisma.card.create({ data: { name: 'Coilover Thể Thao Phố', type: 'SUSPENSION', rarity: 3, statPower: 5, statHeat: 0, statStability: 28, cost: 300, description: 'Cứng cáp vào cua rất ngọt.' } }),
    prisma.card.create({ data: { name: 'Phuộc Offroad Giảm Lực', type: 'SUSPENSION', rarity: 3, statPower: 0, statHeat: 0, statStability: 32, cost: 380, description: 'Lút gầm vào cua vẫn không lật xe.' } }),
    prisma.card.create({ data: { name: 'Coilover Racing', type: 'SUSPENSION', rarity: 3, statPower: 10, statHeat: 0, statStability: 15, cost: 350, description: 'Hệ thống treo có thể chỉnh độ cao và độ cứng.' } }),

    prisma.card.create({ data: { name: 'Coilover Trục Lồng Replica', type: 'SUSPENSION', rarity: 4, statPower: 12, statHeat: 0, statStability: 45, cost: 650, description: 'Chất lượng Thụy Điển nhưng bản sao, ôm đường chuẩn.' } }),
    prisma.card.create({ data: { name: 'Khí Nén Tự Động Phân Bổ', type: 'SUSPENSION', rarity: 4, statPower: 0, statHeat: -4, statStability: 55, cost: 850, description: 'Bơm AI tự phân bổ lực. (Hiệu ứng: Xóa sạch mọi yếu tố trừ điểm Stability trên xe)' } }),
    prisma.card.create({ data: { name: 'Giảm Xóc Thanh Xoắn Track-Use', type: 'SUSPENSION', rarity: 4, statPower: 15, statHeat: 0, statStability: 50, cost: 720, description: 'Cực kì xóc, bám đường như keo 502.' } }),

    prisma.card.create({ data: { name: 'Treo Thủy Lực Nhảy Múa', type: 'SUSPENSION', rarity: 5, statPower: 0, statHeat: 12, statStability: 70, cost: 1600, description: 'Lowrider bơm nhảy nhót! (Hiệu ứng: Trình Diễn Thu Hút - Cuối màn x2 Gold)' } }),
    prisma.card.create({ data: { name: 'Treo Điện Từ MagneRide', type: 'SUSPENSION', rarity: 5, statPower: 25, statHeat: 6, statStability: 80, cost: 1850, description: 'Vật chất từ tính biến thiên độ cứng từng mili-giây.' } }),
    prisma.card.create({ data: { name: 'Cân Bằng Lực Hấp Dẫn Anti-G', type: 'SUSPENSION', rarity: 5, statPower: 50, statHeat: 0, statStability: 120, cost: 2400, description: 'Phi thuyền UFO bám đất dẫu chạy ở 500km/h. (Hiệu ứng: Không lật xe, x1.5 Stability gốc)' } }),

    // === TIRE (15 Thẻ Mới) ===
    prisma.card.create({ data: { name: 'Lốp Cũ Nứt Nẻ', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 1, cost: 10, description: 'Nứt toác, chạy nhanh là nổ.' } }),
    prisma.card.create({ data: { name: 'Lốp Xe Đạp Mũi Dày', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 2, cost: 20, description: 'Gắn tạm cho xe nhẹ.' } }),
    prisma.card.create({ data: { name: 'Lốp Tái Chế Trọc', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 4, cost: 35, description: 'Chỉ dùng trượt băng là giỏi.' } }),
    prisma.card.create({ data: { name: 'Lốp Đường Phố', type: 'TIRE', rarity: 1, statPower: 3, statHeat: 0, statStability: 8, cost: 55, description: 'Lốp tiêu chuẩn, bám đường ổn định.' } }),
    prisma.card.create({ data: { name: 'Lốp Địa Hình Cũ', type: 'TIRE', rarity: 2, statPower: -2, statHeat: 0, statStability: 8, cost: 90, description: 'Cản gió to, ì ạch nhưng chắc xe.' } }),
    prisma.card.create({ data: { name: 'Lốp Dự Phòng Tạm Thời', type: 'TIRE', rarity: 2, statPower: 0, statHeat: 0, statStability: 6, cost: 70, description: 'Chỉ giới hạn 50km/h.' } }),
    prisma.card.create({ data: { name: 'Lốp All-Season Bền', type: 'TIRE', rarity: 2, statPower: 0, statHeat: 0, statStability: 10, cost: 120, description: 'Đi được bốn mùa, an toàn.' } }),
    prisma.card.create({ data: { name: 'Lốp Semi-Slick', type: 'TIRE', rarity: 2, statPower: 8, statHeat: 2, statStability: 16, cost: 180, description: 'Lốp bán chuyên, độ bám tốt trên mặt khô.' } }),
    prisma.card.create({ data: { name: 'Lốp Performance Trơn', type: 'TIRE', rarity: 3, statPower: 5, statHeat: 2, statStability: 15, cost: 250, description: 'Bám dính nhè nhẹ ở tốc độ cao.' } }),
    prisma.card.create({ data: { name: 'Lốp Drifting Khói Mù', type: 'TIRE', rarity: 3, statPower: 2, statHeat: 9, statStability: 12, cost: 220, description: 'Sinh ma sát cao để tạo khói nghệ thuật.' } }),
    prisma.card.create({ data: { name: 'Lốp Off-Road Gai To', type: 'TIRE', rarity: 3, statPower: -5, statHeat: 0, statStability: 22, cost: 280, description: 'Không lún bùn, bò trên đá.' } }),
    prisma.card.create({ data: { name: 'Lốp Track-Day Bán Chuyên', type: 'TIRE', rarity: 4, statPower: 10, statHeat: 6, statStability: 28, cost: 500, description: 'Cao su mềm bám đường đua. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Lốp Mùa Đông Đinh Tán', type: 'TIRE', rarity: 4, statPower: -5, statHeat: -8, statStability: 25, cost: 480, description: 'Đinh tản nhiệt truyền băng giá lên xe. (Hiệu ứng: Giới hạn -10 Heat)' } }),
    prisma.card.create({ data: { name: 'Lốp Compound Bề Mặt Kép', type: 'TIRE', rarity: 4, statPower: 8, statHeat: 2, statStability: 32, cost: 550, description: 'Chuyên dụng góc cua gắt. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Lốp Racing Slick', type: 'TIRE', rarity: 4, statPower: 25, statHeat: 6, statStability: 35, cost: 650, description: 'Lốp đua chuyên nghiệp! Bám cực tốt nhưng nóng nhẹ.' } }),
    prisma.card.create({ data: { name: 'Lốp Cao Su Chảy Siêu Bám', type: 'TIRE', rarity: 5, statPower: 15, statHeat: 12, statStability: 42, cost: 1200, description: 'Ma sát nung chảy lốp. (Hiệu ứng: Đốt Lốp - Thêm 15 Power khi On-Test)' } }),
    prisma.card.create({ data: { name: 'Lốp Thủy Tinh Khí Động Học', type: 'TIRE', rarity: 5, statPower: 20, statHeat: 0, statStability: 28, cost: 1500, description: 'Triệt tiêu lực cản gió hoàn toàn. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Lốp Từ Tính Nam Châm Điện', type: 'TIRE', rarity: 5, statPower: 5, statHeat: 0, statStability: 65, cost: 2000, description: 'Bám dính mặt đường. (Hiệu ứng: Lực Từ Tính - Nhân đôi Stability gốc)' } }),

    // === NITROUS (15 Thẻ Mới) ===
    prisma.card.create({ data: { name: 'Bình Xịt Phanh', type: 'NITROUS', rarity: 1, statPower: 2, statHeat: 6, statStability: -1, cost: 20, description: 'Đốt cháy dung môi kém.' } }),
    prisma.card.create({ data: { name: 'Lon Khí Bơm Bóng', type: 'NITROUS', rarity: 1, statPower: 3, statHeat: 6, statStability: -2, cost: 25, description: 'Khí rác làm xe nổ rát nghẹt.' } }),
    prisma.card.create({ data: { name: 'Hút Khí Y Tế', type: 'NITROUS', rarity: 1, statPower: 4, statHeat: 2, statStability: -1, cost: 35, description: 'Bình Oxy mini bệnh viện, mang lại tý khí tươi.' } }),
    prisma.card.create({ data: { name: 'Bình Găng-tay Rẻ Tiền', type: 'NITROUS', rarity: 1, statPower: 5, statHeat: 9, statStability: -4, cost: 40, description: 'Chế tạo chui lủi, dễ xì khí.' } }),
    prisma.card.create({ data: { name: 'Bộ Nén Khí Bằng Tay', type: 'NITROUS', rarity: 2, statPower: 10, statHeat: 17, statStability: -5, cost: 80, description: 'Gắn van xe đạp xì hơi vào buồng đốt.' } }),
    prisma.card.create({ data: { name: 'NOS Chợ Đen Rỉ Sét', type: 'NITROUS', rarity: 2, statPower: 15, statHeat: 23, statStability: -8, cost: 120, description: 'Vỏ bình rỉ sét, uy hiếp nổ tung.' } }),
    prisma.card.create({ data: { name: 'NOS Dỏm Tự Pha', type: 'NITROUS', rarity: 2, statPower: 18, statHeat: 29, statStability: -10, cost: 140, description: 'Pha tạp chất chạy cực sốc.' } }),
    prisma.card.create({ data: { name: 'NOS Nhỏ', type: 'NITROUS', rarity: 2, statPower: 25, statHeat: 21, statStability: -5, cost: 180, description: 'Bình NOS nhỏ, tăng sức mạnh tức thì!' } }),
    prisma.card.create({ data: { name: 'Hệ Thống Phun Khô Cũ', type: 'NITROUS', rarity: 3, statPower: 20, statHeat: 12, statStability: -2, cost: 250, description: 'Phun không cầu kỳ, cực cháy.' } }),
    prisma.card.create({ data: { name: 'Hệ Thống Phun Ướt Đi Phố', type: 'NITROUS', rarity: 3, statPower: 25, statHeat: 17, statStability: -5, cost: 320, description: 'Đục đường xăng trộn chung NOS.' } }),
    prisma.card.create({ data: { name: 'NOS Dual-Stage Tiêu Chuẩn', type: 'NITROUS', rarity: 4, statPower: 35, statHeat: 23, statStability: -5, cost: 500, description: 'Xịt hai giai đoạn chuẩn thi đấu. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Bình NOS Sợi Carbon', type: 'NITROUS', rarity: 4, statPower: 30, statHeat: 12, statStability: 0, cost: 580, description: 'Nhẹ nhàng điều tốc an toàn. (Hiệu ứng: Bình Ổn - Không bị trừ Stability)' } }),
    prisma.card.create({ data: { name: 'NOS Tri-Stage Xịt Liên Tục', type: 'NITROUS', rarity: 4, statPower: 45, statHeat: 40, statStability: -15, cost: 750, description: 'Liên hoàn xịt ba nấc đầy bạo lực. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'NOS Mega', type: 'NITROUS', rarity: 4, statPower: 80, statHeat: 46, statStability: -20, cost: 650, description: 'Bình NOS cỡ lớn! Bùng nổ cực đoan.' } }),
    prisma.card.create({ data: { name: 'NOS Hỗn Hợp Oxy Lỏng', type: 'NITROUS', rarity: 5, statPower: 60, statHeat: 35, statStability: -10, cost: 1300, description: 'Biến buồng đốt thành dung nham. (Hiệu ứng: Hút 10 Stability thành 40 Power)' } }),
    prisma.card.create({ data: { name: 'Nitro Kích Quang Pha Lê', type: 'NITROUS', rarity: 5, statPower: 85, statHeat: 52, statStability: -20, cost: 1800, description: 'Khoa học viễn tưởng siêu tưởng. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Lõi Phản Vật Chất Xịt Cấp Tốc', type: 'NITROUS', rarity: 5, statPower: 120, statHeat: 103, statStability: -40, cost: 2500, description: 'Chạm là nổ, tốc độ ánh sáng! (Hiệu ứng: Đỉnh Điểm - +100 Power rủi ro cực lớn)' } }),

    // === TOOL (15 Thẻ Mới) ===
    prisma.card.create({ data: { name: 'Cờ Lê Rỉ Trượt Ốc', type: 'TOOL', rarity: 1, statPower: -2, statHeat: 0, statStability: -2, cost: 5, description: 'Làm lỏng thêm chi tiết xe.' } }),
    prisma.card.create({ data: { name: 'Búa Gò Móp Méo', type: 'TOOL', rarity: 1, statPower: 0, statHeat: 0, statStability: -3, cost: 10, description: 'Đập rách vỏ xe.' } }),
    prisma.card.create({ data: { name: 'Băng Dính Vạn Năng Đen', type: 'TOOL', rarity: 1, statPower: 0, statHeat: 0, statStability: 5, cost: 20, description: 'Dán mọi khe hở tản mạn!' } }),
    prisma.card.create({ data: { name: 'Bộ Cờ Lê', type: 'TOOL', rarity: 1, statPower: 2, statHeat: 0, statStability: 5, cost: 40, description: 'Bộ cờ lê cơ bản, lắp ráp chắc chắn.' } }),
    prisma.card.create({ data: { name: 'Dây Rút Nhựa Trắng', type: 'TOOL', rarity: 2, statPower: 0, statHeat: 0, statStability: 8, cost: 50, description: 'Cố định ống xả rơi rụng.' } }),
    prisma.card.create({ data: { name: 'Súng Bắn Ốc Pin Yếu', type: 'TOOL', rarity: 2, statPower: 2, statHeat: 0, statStability: 2, cost: 65, description: 'Thêm chút khí động học.' } }),
    prisma.card.create({ data: { name: 'Kìm Chết Gãy Mỏ', type: 'TOOL', rarity: 2, statPower: 0, statHeat: -4, statStability: 0, cost: 85, description: 'Bóp gãy van xả nhiệt thừa.' } }),
    prisma.card.create({ data: { name: 'Máy Chẩn Đoán OBD2', type: 'TOOL', rarity: 2, statPower: 6, statHeat: -3, statStability: 9, cost: 130, description: 'Máy quét lỗi, an tâm vặn ga.' } }),
    prisma.card.create({ data: { name: 'Keo Dán AB Đa Dụng', type: 'TOOL', rarity: 3, statPower: 0, statHeat: -2, statStability: 15, cost: 200, description: 'Khóa cứng các lỗ hổng nhiệt.' } }),
    prisma.card.create({ data: { name: 'Súng Đo Nhiệt', type: 'TOOL', rarity: 3, statPower: 0, statHeat: -13, statStability: 0, cost: 300, description: 'Tránh điểm mù nhiệt.' } }),
    prisma.card.create({ data: { name: 'Bộ Chỉnh ECU Bỏ Túi', type: 'TOOL', rarity: 3, statPower: 10, statHeat: 6, statStability: 5, cost: 380, description: 'Hack map engine nhẹ.' } }),
    prisma.card.create({ data: { name: 'Cánh Gió Gắn Tạm (Canards)', type: 'TOOL', rarity: 4, statPower: 0, statHeat: 0, statStability: 25, cost: 450, description: 'Lắp canard 3M. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Bản Đồ Mạch Điện Tử', type: 'TOOL', rarity: 4, statPower: 18, statHeat: 0, statStability: 0, cost: 550, description: 'Khơi thông dòng đánh lửa. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Hệ Thống Đo Lường Từ Xa', type: 'TOOL', rarity: 4, statPower: 5, statHeat: 0, statStability: 20, cost: 680, description: 'Telemetry xe đua. (Hiệu ứng: Hoàn thành màn thưởng 15% Vàng)' } }),
    prisma.card.create({ data: { name: 'Drone Phân Tích Đường Đua', type: 'TOOL', rarity: 5, statPower: 10, statHeat: -8, statStability: 30, cost: 1200, description: 'Drone bay soi đường. (Không có hiệu ứng)' } }),
    prisma.card.create({ data: { name: 'Hộp Đồ Nghề Dát Vàng', type: 'TOOL', rarity: 5, statPower: 0, statHeat: -17, statStability: 45, cost: 4000, description: 'Snap-On Gold. (Hiệu ứng: Hoàn trả 100% Gold mua sắm)' } }),
    prisma.card.create({ data: { name: 'Thiết Bị Hack Trụ Trạm', type: 'TOOL', rarity: 5, statPower: 50, statHeat: 57, statStability: -10, cost: 3500, description: 'Cướp quyền trạm xăng, thay luật đỏ. (Hiệu ứng: Cướp Quyền Boss)' } }),

    // === CREW: 6 Normal (Mua tại Shop) ===
    prisma.card.create({
      data: { name: 'Kỹ Sư Nhiệt (The Cooler)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 300, unlockType: 'SHOP', description: '"Giải nhiệt cấp tốc": Giảm 10% Nhiệt độ tổng cho mọi Turbo được lắp.' },
    }),
    prisma.card.create({
      data: { name: 'Chuyên Gia Ống Xả (The Flow)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 800, unlockType: 'SHOP', description: '"Luồng khí mượt mà": Thẻ Ống xả +15 Power, không tăng thêm Heat.' },
    }),
    prisma.card.create({
      data: { name: 'Tay Lái Thử (The Stuntman)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 1000, unlockType: 'SHOP', description: '"Kiểm soát giới hạn": Ngưỡng nổ máy tăng thêm +5 điểm (105 thay vì 100) khi Heat vượt 95%.' },
    }),
    prisma.card.create({
      data: { name: 'Kế Toán Trưởng (The Accountant)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 500, unlockType: 'SHOP', description: '"Tối ưu ngân sách": Hoàn trả 10% tiền mua linh kiện sau mỗi màn thắng.' },
    }),
    prisma.card.create({
      data: { name: 'Thợ Sơn (The Artist)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 400, unlockType: 'SHOP', description: '"Vẻ ngoài hào nhoáng": +15% sự hài lòng khách, nhận thêm tiền tip ngẫu nhiên.' },
    }),
    prisma.card.create({
      data: { name: 'Chuyên Gia Lốp (The Grip)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 1200, unlockType: 'SHOP', description: '"Bám đường tuyệt đối": +20 Stability cho xe có động cơ trên 400 mã lực.' },
    }),

    // === CREW: 5 Normal MỚI (Mua tại Shop) ===
    prisma.card.create({
      data: { name: 'Bác Sĩ Xăng (The Fuel Doctor)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 900, unlockType: 'SHOP', description: '"Pha Chế Hoàn Hảo": Slot FUEL tăng gấp đôi Power, nhưng Heat của slot FUEL cũng tăng x1.5. Đánh đổi sức mạnh lấy rủi ro.' },
    }),
    prisma.card.create({
      data: { name: 'Thợ Hàn Ngầm (The Welder)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 350, unlockType: 'SHOP', description: '"Mối Hàn Hoàn Hảo": Slot EXHAUST nhận thêm +10 Stability. Hệ thống xả được hàn chắc chắn, xe bám đường hơn.' },
    }),
    prisma.card.create({
      data: { name: 'Thợ Điện Ngầm (The Wireman)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 1800, unlockType: 'SHOP', description: '"Đấu Nối Thần Tốc": Slot NITROUS xoá hoàn toàn chỉ số trừ Stability. Hệ thống điện giữ xe ổn định khi bơm NOS.' },
    }),
    prisma.card.create({
      data: { name: 'Thầy Phong Thuỷ Xe (The Feng Shui)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 450, unlockType: 'SHOP', description: '"Ngũ Hành Cân Bằng": Nếu cả 3 slot FILTER + ENGINE + COOLING đều có thẻ cùng độ hiếm → +25 Stability tổng.' },
    }),
    prisma.card.create({
      data: { name: 'Chiến Binh Đêm (The Night Rider)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 2500, unlockType: 'SHOP', description: '"Bóng Đêm Tốc Độ": Từ Ngày 25 trở đi, slot TIRE và slot TURBO đều nhận thêm +15 Power. Đường đêm là sân chơi của hắn.' },
    }),

    // === CREW: 5 Hidden (Cần Achievement) ===
    prisma.card.create({
      data: { name: 'Kẻ Đào Tẩu (The Fugitive)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '"Chạy trốn": Bỏ qua mọi yêu cầu khắt khe của Boss.' },
    }),
    prisma.card.create({
      data: { name: 'Linh Hồn Gara (Ghost Mechanic)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '"Hồi sinh": 1 lần/màn, cứu xe khi nổ máy. Xe hoàn thành với 1 HP.' },
    }),
    prisma.card.create({
      data: { name: 'Chủ Tịch Tập Đoàn (The CEO)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '"Đầu tư mạo hiểm": Mượn 1 linh kiện Legendary (5 sao) dùng thử 1 màn.' },
    }),
    prisma.card.create({
      data: { name: 'Hacker Mũ Đen (Black-Hat)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '"Chỉnh sửa mã nguồn": Đảo ngược chỉ số Heat ↔ Stability của mọi thẻ trên xe. (VD: 100 Heat + 50 Stability → 50 Heat + 100 Stability)' },
    }),
    prisma.card.create({
      data: { name: 'Huyền Thoại Giải Nghệ (The Legend)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '"Bàn tay vàng": Common/Uncommon tự động nâng chỉ số lên ngang Rare.' },
    }),
  ]);

  console.log(`✅ Đã tạo ${cards.length} thẻ bài\n`);

  // ============================================================
  // 2. CARD EFFECTS (Hiệu ứng đặc biệt cho thẻ 4-5 sao)
  // ============================================================
  console.log('✨ Tạo hiệu ứng thẻ...');

  await Promise.all([
    // === 1. FILTER EFFECTS ===
    // Hệ Thống Ram Air (rarity 4, index 14)
    prisma.cardEffect.create({
      data: { cardId: cards[14].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Mát Mẻ: Giảm 10 Heat cho toàn hệ thống.' },
    }),
    // Bộ Gió Big Bore (rarity 4, index 15)
    prisma.cardEffect.create({
      data: { cardId: cards[15].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 15, description: 'Rộng Mở: +15 Power khi khởi động thử.' },
    }),
    // Hyper-Flow Titanium (rarity 5, index 16)
    prisma.cardEffect.create({
      data: { cardId: cards[16].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 1.0, description: 'Bão Táp: +1 Power cho mỗi 1 Stability tổng của xe.' }, // Ghi chú: Logic tính cộng đồn cần xử lý ở frontend, ở đây set tạm 1.0 hệ số
    }),
    // Quantum Intake (rarity 5, index 17)
    prisma.cardEffect.create({
      data: { cardId: cards[17].id, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -0.5, description: 'Đóng Băng: Giảm 50% Heat tỏa ra của Engine.' },
    }),

    // === 2. ENGINE EFFECTS ===
    // Động Cơ Inline-6 2JZ Huyền Thoại (rarity 4, index 33)
    prisma.cardEffect.create({
      data: { cardId: cards[33].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -15, description: 'Chịu Đựng: Trừ 15 Heat cho mỗi Turbo.' },
    }),
    // V10 5.2L Screamer (rarity 4, index 36)
    prisma.cardEffect.create({
      data: { cardId: cards[36].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 20, description: 'V10 Screamer: +20 Power khi On-Test.' },
    }),
    // V8 Supercharged (rarity 4, index 37)
    prisma.cardEffect.create({
      data: { cardId: cards[37].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 30, description: 'V8 Rage: +30 Power khi chạy thử.' },
    }),
    // I4 F1 Turbo-Hybrid 1.6L (rarity 5, index 38)
    prisma.cardEffect.create({
      data: { cardId: cards[38].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -1, description: 'KERS Hệ Thống: Trừ 1 Heat mỗi giây (Logic xử lý ở frontend).' },
    }),
    // Động Cơ Điện Quad-Motor TriMax (rarity 5, index 40)
    prisma.cardEffect.create({
      data: { cardId: cards[40].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Tương Lai: Tự động x2 Stability của toàn xe.' },
    }),
    // W16 Quad-Turbo (rarity 5, index 41)
    prisma.cardEffect.create({
      data: { cardId: cards[41].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 50, description: 'W16 Ultimate: +50 Power cực đại!' },
    }),
    prisma.cardEffect.create({
      data: { cardId: cards[41].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 10, description: 'Kỹ thuật hoàn hảo: +10 Stability.' },
    }),

    // === 3. TURBO EFFECTS ===
    // Turbo Twin-Scroll (rarity 4, index 56)
    prisma.cardEffect.create({
      data: { cardId: cards[56].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 20, description: 'Phản Xạ Nhanh: +20 Power khi On-test.' },
    }),
    // Supercharger Roots (rarity 4, index 57)
    prisma.cardEffect.create({
      data: { cardId: cards[57].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 1.5, description: 'Siêu Phàm: x1.5 Power của bản thân nó.' },
    }),
    // Vortex Hố Đen (rarity 5, index 58)
    prisma.cardEffect.create({
      data: { cardId: cards[58].id, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0.5, description: 'Hút Cạn: Hút 50% Power Engine đắp vào bản thân, bù lại +30 Heat.' },
    }),
    prisma.cardEffect.create({
      data: { cardId: cards[58].id, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 30, description: 'Hút Cạn: Kéo theo mức nhiệt cực đoan!' },
    }),
    // Anti-Lag System (rarity 5, index 59)
    prisma.cardEffect.create({
      data: { cardId: cards[59].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 50, description: 'Liên Hoàn Nổ: Engine +50 Power!' },
    }),
    // Turbo Titan X (rarity 5, index 60)
    prisma.cardEffect.create({
      data: { cardId: cards[60].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 30, description: 'Titan Boost: +30 Power khi chạy thử, không tăng Heat.' },
    }),

    // === 4. EXHAUST EFFECTS ===
    // Hệ Thống Side-Exit (rarity 4, index 74)
    prisma.cardEffect.create({
      data: { cardId: cards[74].id, effectType: 'BUFF', triggerCondition: 'ADJACENT', targetStat: 'HEAT', effectValue: -10, description: 'Xả Ngang: Trừ 10 Heat cho thẻ phía sau.' },
    }),
    // Catless Downpipe (rarity 4, index 75)
    prisma.cardEffect.create({
      data: { cardId: cards[75].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -2, description: 'Lan Tỏa: Mỗi linh kiện trên xe được -2 Heat.' },
    }),
    // Ống Xả Titan Racing (rarity 4, index 76)
    prisma.cardEffect.create({
      data: { cardId: cards[76].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'HEAT', effectValue: -15, description: 'Titan Exhaust: Giảm thêm 15 Heat.' },
    }),
    // Ghost Exhaust (rarity 5, index 77)
    prisma.cardEffect.create({
      data: { cardId: cards[77].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Tàng Hình: x2 Stability, Bypass mọi luật ngặt nghèo.' },
    }),
    // Plasma Đỏ Lửa (rarity 5, index 78)
    prisma.cardEffect.create({
      data: { cardId: cards[78].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 2.0, description: 'Cột Lửa: Nhân đôi hệ số âm Heat của thẻ thành -60.' },
    }),

    // === 5. COOLING EFFECTS ===
    // Bộ Làm Mát Bằng Cồn Methanol (rarity 4, index 92)
    prisma.cardEffect.create({
      data: { cardId: cards[92].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 10, description: 'Bốc Hơi Ác Liệt: Thêm 10 Power nhờ nạp khí lạnh.' },
    }),
    // Khí Nito Lỏng Làm Mát Trực Tiếp (rarity 5, index 94)
    prisma.cardEffect.create({
      data: { cardId: cards[94].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 0, description: 'Deep Freeze: Bypass Boss Heat.' },
    }),
    // Hệ Thống Từ Trường Lượng Tử (rarity 5, index 96)
    prisma.cardEffect.create({
      data: { cardId: cards[96].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 0, description: 'Không Độ Tuyệt Đối: Ép Heat toàn xe luôn bằng 0.' },
    }),
    // Cryo Cooling System (rarity 5, index 97)
    prisma.cardEffect.create({
      data: { cardId: cards[97].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Cryo Freeze: Giảm 10 Heat cho toàn bộ xe.' },
    }),

    // === 6. FUEL EFFECTS ===
    // Hỗn Hợp Nitromethane (rarity 4, index 110)
    prisma.cardEffect.create({
      data: { cardId: cards[110].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 25, description: 'Cháy Kiệt Cực: Nếu ở Slot 1-3, +25 Power. Nếu ở Slot 8-10, +15 Heat thêm.' },
    }),
    // Nhiên Liệu Tên Lửa (rarity 4, index 112)
    prisma.cardEffect.create({
      data: { cardId: cards[112].id, effectType: 'DEBUFF', triggerCondition: 'ON_TEST', targetStat: 'HEAT', effectValue: 20, description: 'Rocket Burn: +20 Heat nguy hiểm!' },
    }),
    // Xăng Nhựa Thông Cực Đoan (rarity 5, index 114)
    prisma.cardEffect.create({
      data: { cardId: cards[114].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 2.0, description: 'Hủy Diệt Đổi Lấy Vinh Quang: Khi Heat > 90%, nổ sức mạnh x2 toàn xe.' },
    }),
    // Hoạt Chất Lõi Mặt Trời (rarity 5, index 115)
    prisma.cardEffect.create({
      data: { cardId: cards[115].id, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0.2, description: 'Mặt Trời Thu Nhỏ: Giảm 80% Stability tổng toàn xe (chỉ giữ lại 20%).' },
    }),

    // === 7. SUSPENSION EFFECTS ===
    // Khí Nén Tự Động Phân Bổ (rarity 4, index 128)
    prisma.cardEffect.create({
      data: { cardId: cards[128].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Tự Động Định Tuyến: Xóa mọi ảnh hưởng yếu điểm Stability.' },
    }),
    // Treo Thủy Lực Nhảy Múa (rarity 5, index 130)
    prisma.cardEffect.create({
      data: { cardId: cards[130].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 2.0, description: 'Trình Diễn Thu Hút: Kết thúc màn x2 Gold.' },
    }),
    // Cân Bằng Lực Hấp Dẫn Anti-G (rarity 5, index 132)
    prisma.cardEffect.create({
      data: { cardId: cards[132].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 1.5, description: 'Khóa Tọa Độ: Stability gốc của thẻ x1.5, không thể cản phá.' },
    }),

    // === 8. TIRE EFFECTS ===
    // Lốp Mùa Đông Đinh Tán (rarity 4, index 145)
    prisma.cardEffect.create({
      data: { cardId: cards[145].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Băng Giá: Giảm 10 Heat cho xe.' },
    }),
    // Lốp Cao Su Chảy Siêu Bám (rarity 5, index 148)
    prisma.cardEffect.create({
      data: { cardId: cards[148].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 15, description: 'Đốt Lốp: Thêm 15 Power khi khởi động!' },
    }),
    // Lốp Từ Tính Nam Châm Điện (rarity 5, index 150)
    prisma.cardEffect.create({
      data: { cardId: cards[150].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Lực Từ Tính: Nhân đôi hệ số Stability gốc của toàn xe.' },
    }),

    // === 9. NITROUS EFFECTS ===
    // Bình NOS Sợi Carbon (rarity 4, index 162)
    prisma.cardEffect.create({
      data: { cardId: cards[162].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Bình Ổn: Loại bỏ chỉ số trừ Stability của bình NOS.' },
    }),
    // NOS Hỗn Hợp Oxy Lỏng (rarity 5, index 165)
    prisma.cardEffect.create({
      data: { cardId: cards[165].id, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 40, description: 'Xung Lực Vi Dấu: Hút 10 Stability để hóa thành +40 Power.' },
    }),
    // Lõi Phản Vật Chất Xịt Cấp Tốc (rarity 5, index 167)
    prisma.cardEffect.create({
      data: { cardId: cards[167].id, effectType: 'DEBUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 100, description: 'Đỉnh Điểm: Cung cấp +100 Power sức mạnh phá hủy cấp độ rủi ro cực lớn.' },
    }),

    // === 10. TOOL EFFECTS ===
    // Hệ Thống Đo Lường Từ Xa (rarity 4, index 181)
    prisma.cardEffect.create({
      data: { cardId: cards[181].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 1.15, description: 'Định Giá Dữ Liệu: Hoàn thành màn với thẻ này thưởng +15% Vàng.' },
    }),
    // Hộp Đồ Nghề Dát Vàng (Snap-On) (rarity 5, index 183)
    prisma.cardEffect.create({
      data: { cardId: cards[183].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 2.0, description: 'Xa Xỉ Phẩm: Hoàn trả hoàn toàn số Gold đã mua linh kiện (Bonus x2).' },
    }),
    // Thiết Bị Hack Trụ Trạm (rarity 5, index 184)
    prisma.cardEffect.create({
      data: { cardId: cards[184].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Cướp Quyền Boss: Bypass mọi luật lệ khắt khe của Boss!' },
    }),

    // === 10. CREW EFFECTS (11 Crew Members) ===
    // Normal Crew Effects
    // index 140: The Cooler - Giảm 10% Heat cho Turbo
    prisma.cardEffect.create({
      data: { cardId: cards[140].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Giải nhiệt cấp tốc: Giảm 10% Heat cho mọi Turbo.' },
    }),
    // index 141: The Flow - Ống xả +15 Power
    prisma.cardEffect.create({
      data: { cardId: cards[141].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 15, description: 'Luồng khí mượt mà: Ống xả +15 Power, 0 Heat thêm.' },
    }),
    // index 142: The Stuntman - Chậm nổ 2s (handled by frontend flag)
    prisma.cardEffect.create({
      data: { cardId: cards[142].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 5, description: 'Kiểm soát giới hạn: Ngưỡng nổ +5% khi Heat > 95%.' },
    }),
    // index 143: The Accountant - Hoàn 10% gold
    prisma.cardEffect.create({
      data: { cardId: cards[143].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 10, description: 'Tối ưu ngân sách: Hoàn trả 10% tiền mua linh kiện.' },
    }),
    // index 144: The Artist - +15% gold tip
    prisma.cardEffect.create({
      data: { cardId: cards[144].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 15, description: 'Vẻ ngoài hào nhoáng: +15% tiền tip ngẫu nhiên.' },
    }),
    // index 145: The Grip - +20 Stability nếu Power > 400
    prisma.cardEffect.create({
      data: { cardId: cards[145].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 20, description: 'Bám đường tuyệt đối: +20 Stability cho xe > 400 HP.' },
    }),

    // === 5 NEW Normal Crew Effects (Redesigned) ===
    // index 146: The Fuel Doctor - Slot FUEL x2 Power, x1.5 Heat
    prisma.cardEffect.create({
      data: { cardId: cards[146].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 2.0, description: 'Pha Chế Hoàn Hảo: Slot FUEL x2 Power, nhưng Heat x1.5.' },
    }),
    // index 147: The Welder - Slot EXHAUST +10 Stability
    prisma.cardEffect.create({
      data: { cardId: cards[147].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 10, description: 'Mối Hàn Hoàn Hảo: Slot EXHAUST +10 Stability.' },
    }),
    // index 148: The Wireman - Slot NITROUS xoá trừ Stability
    prisma.cardEffect.create({
      data: { cardId: cards[148].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Đấu Nối Thần Tốc: Slot NITROUS không trừ Stability.' },
    }),
    // index 149: The Feng Shui - FILTER+ENGINE+COOLING cùng rarity → +25 Stability
    prisma.cardEffect.create({
      data: { cardId: cards[149].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 25, description: 'Ngũ Hành Cân Bằng: FILTER+ENGINE+COOLING cùng sao → +25 Stability.' },
    }),
    // index 150: The Night Rider - Ngày 25+: TIRE & TURBO +15 Power
    prisma.cardEffect.create({
      data: { cardId: cards[150].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 15, description: 'Bóng Đêm Tốc Độ: Từ Ngày 25, TIRE & TURBO +15 Power mỗi slot.' },
    }),

    // Hidden Crew Effects (indices shifted +5)
    // index 151: The Fugitive - Bypass Boss conditions
    prisma.cardEffect.create({
      data: { cardId: cards[151].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Chạy trốn: Bypass mọi điều kiện Boss.' },
    }),
    // index 152: Ghost Mechanic - 1x cứu nổ
    prisma.cardEffect.create({
      data: { cardId: cards[152].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 0, description: 'Hồi sinh: 1 lần/màn cứu xe khi nổ máy.' },
    }),
    // index 153: The CEO - Mượn 1 Legendary
    prisma.cardEffect.create({
      data: { cardId: cards[153].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Đầu tư mạo hiểm: Mượn 1 Legendary miễn phí.' },
    }),
    // index 154: Black-Hat - Đảo ngược Heat ↔ Stability
    prisma.cardEffect.create({
      data: { cardId: cards[154].id, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT_STABILITY_SWAP', effectValue: 1, description: 'Chỉnh sửa mã nguồn: Đảo ngược chỉ số Heat ↔ Stability của mọi thẻ trên xe.' },
    }),
    // index 155: The Legend - Common/Uncommon → Rare stats
    prisma.cardEffect.create({
      data: { cardId: cards[155].id, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Bàn tay vàng: Common/Uncommon nâng chỉ số thành Rare.' },
    }),
  ]);

  console.log('✅ Đã tạo hiệu ứng thẻ\n');

  // ============================================================
  // 3. CARD COMBOS (Phản ứng dây chuyền - 25 combo sáng tạo)
  // ============================================================
  console.log('🔗 Tạo combos...');

  await Promise.all([
    // ========== COMBO LINH KIỆN ==========

    // 1. Lọc Gió Performance (9) + Động Cơ 2.0L Turbo (27)
    prisma.cardCombo.create({
      data: { cardId1: cards[9].id, cardId2: cards[27].id, effectType: 'BONUS_POWER', effectValue: 20, name: '⚡ Tăng Áp Hiệu Quả', description: 'Turbo hút gió sạch từ bộ lọc Performance, +20 Power mà không tăng Heat từ turbo.' },
    }),
    // 2. Turbo Tăng Áp Đôi (55) + Ống Xả Titan Racing (76)
    prisma.cardCombo.create({
      data: { cardId1: cards[55].id, cardId2: cards[76].id, effectType: 'POWER_TO_STABILITY', effectValue: 0.05, name: '💨 Thoát Khí Tự Do', description: 'Mỗi 100 Power tạo ra sẽ tự động cộng thêm 5 Stability - áp suất khí xả được giải phóng hoàn hảo.' },
    }),
    // 3. Lọc Gió Carbon Fiber (13) + Turbo Titan X (60)
    prisma.cardCombo.create({
      data: { cardId1: cards[13].id, cardId2: cards[60].id, effectType: 'MULTIPLY_POWER', effectValue: 2.5, name: '🌪️ Cơn Lốc Carbon', description: 'Sợi carbon siêu nhẹ + turbo huyền thoại tạo cơn lốc không khí, x2.5 Power turbo!' },
    }),
    // 4. V8 Supercharged (37) + Cryo Cooling System (97)
    prisma.cardCombo.create({
      data: { cardId1: cards[37].id, cardId2: cards[97].id, effectType: 'NEGATE_HEAT', effectValue: 1.0, name: '❄️ Quái Thú Băng Giá', description: 'Cryo đóng băng hoàn toàn V8! Xóa toàn bộ Heat của V8 Supercharged.' },
    }),
    // 5. W16 Quad-Turbo (41) + Nhiên Liệu Tên Lửa (112)
    prisma.cardCombo.create({
      data: { cardId1: cards[41].id, cardId2: cards[112].id, effectType: 'MULTIPLY_POWER', effectValue: 3.0, name: '🚀 Ngày Tận Thế', description: 'W16 + Nhiên liệu Tên Lửa = sức mạnh x3! Nhưng Heat cũng tăng x1.5 - cẩn thận!' },
    }),
    // 6. V6 Twin-Turbo (32) + Xăng Racing 100 (108)
    prisma.cardCombo.create({
      data: { cardId1: cards[32].id, cardId2: cards[108].id, effectType: 'REDUCE_HEAT', effectValue: 0.6, name: '🔥 Cháy Sạch Hoàn Hảo', description: 'Xăng Racing cao cấp + V6 = cháy sạch hoàn toàn, giảm 40% Heat từ engine.' },
    }),
    // 7. NOS Mega (164) + Ống Xả Performance (70)
    prisma.cardCombo.create({
      data: { cardId1: cards[164].id, cardId2: cards[70].id, effectType: 'BONUS_POWER', effectValue: 35, name: '💥 Sóng Xung Kích', description: 'NOS phun ngược qua ống xả tạo sóng xung kích cực mạnh, +35 Power bùng nổ!' },
    }),
    // 8. NOS Nhỏ (158) + Xăng RON 95 (101)
    prisma.cardCombo.create({
      data: { cardId1: cards[158].id, cardId2: cards[101].id, effectType: 'BONUS_POWER', effectValue: 15, name: '🎆 Pháo Hoa Đường Phố', description: 'NOS nhỏ + RON 95 tạo hiệu ứng pháo hoa ngoạn mục, +15 Power thêm.' },
    }),
    // 9. Intercooler Carbon (90) + Turbo Nhỏ (47)
    prisma.cardCombo.create({
      data: { cardId1: cards[90].id, cardId2: cards[47].id, effectType: 'REDUCE_HEAT', effectValue: 0.3, name: '🧊 Turbo Lạnh', description: 'Intercooler carbon giữ turbo mát lạnh, giảm 70% Heat từ turbo nhỏ.' },
    }),
    // 10. Két Nước Racing (86) + Động Cơ 1.5L (22)
    prisma.cardCombo.create({
      data: { cardId1: cards[86].id, cardId2: cards[22].id, effectType: 'BONUS_STABILITY', effectValue: 12, name: '🌊 Dòng Chảy Hoàn Hảo', description: 'Két nước cỡ lớn + động cơ nhỏ gọn = hệ thống làm mát hoàn hảo, +12 Stability.' },
    }),
    // 11. Coilover Racing (126) + Lốp Racing Slick (147)
    prisma.cardCombo.create({
      data: { cardId1: cards[126].id, cardId2: cards[147].id, effectType: 'MULTIPLY_STABILITY', effectValue: 1.5, name: '🏎️ Bám Đường Tuyệt Đối', description: 'Hệ thống treo racing + lốp slick chuyên nghiệp = x1.5 tổng Stability.' },
    }),
    // 12. Giảm Xóc Cơ Bản (119) + Lốp Semi-Slick (140)
    prisma.cardCombo.create({
      data: { cardId1: cards[119].id, cardId2: cards[140].id, effectType: 'BONUS_STABILITY', effectValue: 10, name: '🛞 Cân Bằng Đường Phố', description: 'Setup đường phố cân bằng và đáng tin cậy, +10 Stability.' },
    }),
    // 13. Máy Chẩn Đoán OBD2 (175) + V8 Supercharged (37)
    prisma.cardCombo.create({
      data: { cardId1: cards[175].id, cardId2: cards[37].id, effectType: 'REDUCE_HEAT', effectValue: 0.7, name: '🔧 Tinh Chỉnh Quái Thú', description: 'OBD2 tối ưu thông số V8, giảm 30% Heat nhờ chạy đúng hiệu suất tối ưu.' },
    }),
    // 14. Bộ Cờ Lê (171) + Quạt Làm Mát (82)
    prisma.cardCombo.create({
      data: { cardId1: cards[171].id, cardId2: cards[82].id, effectType: 'BONUS_STABILITY', effectValue: 8, name: '🛠️ Thợ Máy Chăm Chỉ', description: 'Lắp ráp cẩn thận với cờ lê + quạt mát chạy ổn định = +8 Stability.' },
    }),
    // 15. Nhiên Liệu Tên Lửa (112) + NOS Mega (164)
    prisma.cardCombo.create({
      data: { cardId1: cards[112].id, cardId2: cards[164].id, effectType: 'MULTIPLY_POWER', effectValue: 2.0, name: '☠️ Canh Bạc Tử Thần', description: 'ALL IN! x2 Power tổng nhưng Heat cũng x2 - chỉ dành cho kẻ liều mạng!' },
    }),
    // 16. Lốp Đường Phố (136) + Quạt Làm Mát (82)
    prisma.cardCombo.create({
      data: { cardId1: cards[136].id, cardId2: cards[82].id, effectType: 'BONUS_STABILITY', effectValue: 15, name: '🌆 Xe Hàng Ngày Tin Cậy', description: 'Setup daily-driver hoàn hảo cho xe hàng ngày, +15 Stability.' },
    }),

    // ========== COMBO CREW ==========

    // 17. Kỹ Sư Nhiệt (185) + Intercooler Carbon (90)
    prisma.cardCombo.create({
      data: { cardId1: cards[185].id, cardId2: cards[90].id, effectType: 'REDUCE_HEAT', effectValue: 0.5, name: '🧪 Phòng Thí Nghiệm Lạnh', description: 'Kỹ sư nhiệt vận hành Intercooler ở hiệu suất tối đa, giảm 50% tổng Heat!' },
    }),
    // 18. Chuyên Gia Ống Xả (186) + Ống Xả Titan Racing (76)
    prisma.cardCombo.create({
      data: { cardId1: cards[186].id, cardId2: cards[76].id, effectType: 'BONUS_POWER', effectValue: 30, name: '🎵 Bản Giao Hưởng Titan', description: 'Chuyên gia tinh chỉnh ống xả Titan đạt âm thanh hoàn hảo, +30 Power.' },
    }),
    // 19. Tay Lái Thử (187) + NOS Mega (164)
    prisma.cardCombo.create({
      data: { cardId1: cards[187].id, cardId2: cards[164].id, effectType: 'REDUCE_HEAT', effectValue: 0.8, name: '🎯 Drift Tử Thần', description: 'Tay lái kiểm soát NOS bằng kỹ năng drift, giảm 20% Heat từ NOS.' },
    }),
    // 20. Kế Toán Trưởng (188) + Bộ Cờ Lê (171)
    prisma.cardCombo.create({
      data: { cardId1: cards[188].id, cardId2: cards[171].id, effectType: 'BONUS_GOLD', effectValue: 20, name: '💰 Tiết Kiệm Là Làm Giàu', description: 'Kế toán tối ưu chi phí công cụ, +20% Gold thưởng mỗi màn thắng.' },
    }),
    // 21. Chuyên Gia Lốp (190) + Lốp Racing Slick (147)
    prisma.cardCombo.create({
      data: { cardId1: cards[190].id, cardId2: cards[147].id, effectType: 'MULTIPLY_STABILITY', effectValue: 2.0, name: '🏆 Vua Đường Đua', description: 'Chuyên gia lốp + slick chuyên nghiệp = x2 Stability từ lốp!' },
    }),
    // 22. Huyền Thoại Giải Nghệ (195) + W16 Quad-Turbo (41)
    prisma.cardCombo.create({
      data: { cardId1: cards[195].id, cardId2: cards[41].id, effectType: 'MULTIPLY_POWER', effectValue: 1.5, name: '👑 Bàn Tay Vàng W16', description: 'Huyền thoại chạm vào W16, mọi stat của W16 được nhân x1.5!' },
    }),
    // 23. Ghost Mechanic (192) + Cryo Cooling System (97)
    prisma.cardCombo.create({
      data: { cardId1: cards[192].id, cardId2: cards[97].id, effectType: 'NEGATE_HEAT', effectValue: 0.5, name: '👻 Linh Hồn Đông Lạnh', description: 'Linh hồn gara + Cryo = xóa 50% tổng Heat toàn bộ xe.' },
    }),
    // 24. Hacker Mũ Đen (194) + Máy Chẩn Đoán OBD2 (175)
    prisma.cardCombo.create({
      data: { cardId1: cards[194].id, cardId2: cards[175].id, effectType: 'BONUS_POWER', effectValue: 25, name: '💻 Hack Hệ Thống', description: 'Hack OBD2 → overclock toàn bộ hệ thống xe, +25 Power.' },
    }),
    // 25. Thợ Sơn (189) + Lốp Semi-Slick (140)
    prisma.cardCombo.create({
      data: { cardId1: cards[189].id, cardId2: cards[140].id, effectType: 'BONUS_GOLD', effectValue: 15, name: '🎨 Show Car', description: 'Xe đẹp + lốp đẹp = khách hàng mê mẩn, +15% Gold thêm.' },
    }),
  ]);

  console.log('✅ Đã tạo 25 combos\n');

  // ============================================================
  // 4. BOSS CONFIGS (10+ Bosses)
  // ============================================================
  console.log('👹 Tạo Boss configs...');

  await Promise.all([
    prisma.bossConfig.create({
      data: { name: 'Ông Hoàng Drift', description: '"Nghệ thuật Drift! Cấm dùng phuộc xịn (SUSPENSION ≥ 3★). Tổng Stability cuối cùng ≥ 150!"', specialCondition: 'DRIFT_KING_CHALLENGE', requiredPower: 400, rewardGold: 1200 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Đảo chủ EP', description: '"Có đồng ý lên đảo của ta tham gia cuộc thi không?"', specialCondition: 'EP_ISLAND_CHOICE', requiredPower: 500, rewardGold: 2000 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Nhà Sưu Tập', description: '"Chỉ dùng thẻ 3 sao trở lên thôi nhé!"', specialCondition: 'MIN_RARITY_3', requiredPower: 450, rewardGold: 1500 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Chủ Tịch Kim', description: '"Gia nhập triều tiên ko?"', specialCondition: 'KIM_JONG_UN', requiredPower: 500, rewardGold: 3000 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Cô Gái Liều Lĩnh', description: '"Đạp lút ga! Heat cuối cùng phải sát ngưỡng nổ (≥ 85%)!"', specialCondition: 'DAREDEVIL_DEATH_WISH', requiredPower: 400, rewardGold: 1800 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Đỗ Nam Trung', description: '"Make Garage Great Again! Mọi thẻ 5* đều bị khóa!"', specialCondition: 'DONALD_TRUMP', requiredPower: 470, rewardGold: 4700 },
    }),

    prisma.bossConfig.create({
      data: { name: 'Huyền Thoại F1', description: '"Chỉ có thể dùng Engine và Turbo. No Cooling!"', specialCondition: 'NO_COOLING', requiredPower: 550, rewardGold: 2200 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Kẻ Bí Ẩn', description: '"..."', specialCondition: null, requiredPower: 800, rewardGold: 5000 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Chúa tể dầu em bé', description: '"DO YOU LOVE ME??!??"', specialCondition: 'BABY_OIL_CHOICE', requiredPower: 420, rewardGold: 2500 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Nga Đại Đế', description: '"Vodka? Nyet? Da? Hãy chứng minh sức mạnh cho Đế Chế!"', specialCondition: 'RUSSIA_EMPEROR', requiredPower: 1, rewardGold: 0 },
    }),
  ]);

  console.log('✅ Đã tạo 11 Boss configs\n');

  // ============================================================
  // 5. GAME EVENTS (Sự kiện ngẫu nhiên)
  // ============================================================
  console.log('⚡ Tạo game events...');

  await Promise.all([
    prisma.gameEvent.create({
      data: { name: 'Tay Buôn Lậu Gõ Cửa', description: 'Một gã bí ẩn xuất hiện! Chấp nhận: Mua linh kiện hiếm giá rẻ (-5 uy tín/món), bán thẻ lấy gold (50% giá). Đổi lại: -10 uy tín và bị trừ 15% tiền thưởng ngày tiếp theo.', type: 'CHOICE', targetAttribute: 'GARAGE_HEALTH', effectValue: -10, probability: 0.3 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Ánh Trăng Racing', description: 'Tổ đội đua xe ngầm thách thức bạn! Chấp nhận: Trừ 15 Uy tín để đua, nhưng nhận về 800 Gold tiền cược.', type: 'CHOICE', targetAttribute: 'GOLD', effectValue: 800, probability: 0.15 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Băng Đảng Xăng Dầu', description: 'Băng đảng thao túng giá nguyên liệu! Gara bị ép đóng "phí bảo kê" mất 10% tổng số Gold hiện có.', type: 'PASSIVE', targetAttribute: 'GOLD_PERCENTAGE', effectValue: -0.10, probability: 0.15 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Độ Channel Bốc Phốt', description: 'Kênh Youtube triệu view bất ngờ live-stream xưởng của bạn. Uy tín tăng vọt (+40), nhưng bạn phải cắn răng chi 200 Gold "phí bôi trơn PR".', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 40, probability: 0.1 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Đấu Giá Kho Xưởng', description: 'Ngân hàng thanh lý kho JDM cũ. Chấp nhận: Cược 300 Gold mua mù. Đổi lại bạn nhận được lượng lớn kinh nghiệm (500 Tech Points) từ đồ phế liệu!', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 500, probability: 0.15 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Kẻ Chế Tạo Cuồng Tín', description: 'Một kỹ sư điên rồ đưa bản thiết kế cấm kỵ. Chấp nhận: Nhận 400 Tech Points thăng cấp thần tốc, đổi lại Gara mang tiếng nguy hiểm (-20 Uy Tín).', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 400, probability: 0.1 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Cảnh Sát Đột Kích', description: 'Cơ động xét hỏi xưởng chui! Bạn mất 150 Gold tiền phạt ngầm và bị bêu rếu trên báo (-10 Uy Tín).', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: -10, probability: 0.15 },
    }),
    
    // North Korea Events
    prisma.gameEvent.create({
      data: { name: 'Camera Ngoại Bang', description: 'Phát hiện gián điệp cầm máy quay! Tố cáo hắn để được vinh danh và thưởng nóng (+1000 Gold).', type: 'CHOICE', targetAttribute: 'GOLD', effectValue: 1000, probability: 0.4 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Kiểm Tra Ảnh Cán Bộ', description: 'Đoàn kiểm tra đột xuất xem quán có treo ảnh Chủ Tịch không. Cẩn thận, nếu uy tín thấp sẽ gặp xui xẻo!', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 0, probability: 0.5 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Sát Thủ Gọi Mời', description: 'Một tên sát thủ yêu cầu bạn giúp ám sát Chủ Tịch Kim. Nguy hiểm cực độ! (Tỉ lệ thành công sẽ cao hơn nếu uy tín càng thấp).', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 0, probability: 0 }, // Spawn 100% at day 10
    }),
    prisma.gameEvent.create({
      data: { name: 'Cảnh Sát Triều Tiên', description: 'Cảnh sát đến thanh tra. Nếu hôm qua bạn giao dịch buôn lậu, bạn sẽ bị phạt nặng!', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 0, probability: 0.1 },
    }),
  ]);

  console.log('✅ Đã tạo 11 game events\n');

  // ============================================================
  // 6. ENDINGS (Đa kết cục)
  // ============================================================
  console.log('🏆 Tạo endings...');

  await Promise.all([
    prisma.ending.create({
      data: { name: 'Wasted Potential', type: 'STANDARD', description: 'Kẻ Vứt Đi - Uy tín tụt về 0. Gara đóng cửa, giấc mơ tan vỡ. Bạn đã thất bại...' },
    }),
    prisma.ending.create({
      data: { name: 'Good Ending', type: 'STANDARD', description: 'Cái Kết Có Hậu - Sống sót 50 ngày! Gara SB-GARAGE trở thành địa điểm tin cậy trong thành phố.' },
    }),
    prisma.ending.create({
      data: { name: 'The Absolute Victory', type: 'PERFECT', description: 'Chiến Thắng Tuyệt Đối - 50 ngày, 0 thất bại! Bạn là huyền thoại không tì vết!' },
    }),
    prisma.ending.create({
      data: { name: 'Invictus', type: 'FINAL', description: 'Bất Bại - Đánh bại cả 10 Boss mạnh nhất! Gara SB-GARAGE trở thành huyền thoại vĩnh cửu!' },
    }),
    prisma.ending.create({
      data: { name: 'The Missing Percent', type: 'FINAL', description: 'Thiếu Đi Một Chút - Gần đạt được vinh quang tuyệt đối... nhưng một Boss đã hạ gục bạn.' },
    }),
    prisma.ending.create({
      data: { name: 'Bị Tiêu Diệt Bởi Chủ Tịch', type: 'BAD', description: 'Bạn đã dám chọc giận hoặc làm trái ý Chủ Tịch. Kết cục không thể tránh khỏi.' },
    }),
    prisma.ending.create({
      data: { name: 'Bị Sát Thủ Tiêu Diệt', type: 'BAD', description: 'Từ chối hoặc thất bại trong vụ ám sát. Tổ chức ngầm đã kết liễu bạn.' },
    }),
    prisma.ending.create({
      data: { name: 'Bóng Ma Tốc Độ', type: 'BOSS_HIDDEN', description: 'Ending ẩn - Fail trước Kẻ Bí Ẩn... và khám phá ra bí mật kinh hoàng của hắn.' },
    }),
  ]);

  console.log('✅ Đã tạo 9 endings\n');

  // ============================================================
  // 7. QUEST CONFIGS (Cấu hình sinh khách)
  // ============================================================
  console.log('📋 Tạo quest configs...');

  await Promise.all([
    prisma.questConfig.create({
      data: { minLevel: 1, maxLevel: 3, minPowerReq: 100, maxPowerReq: 250, minGoldReward: 100, maxGoldReward: 250, minCustomers: 1, maxCustomers: 3 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 4, maxLevel: 7, minPowerReq: 200, maxPowerReq: 400, minGoldReward: 200, maxGoldReward: 500, minCustomers: 2, maxCustomers: 4 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 8, maxLevel: 12, minPowerReq: 350, maxPowerReq: 600, minGoldReward: 400, maxGoldReward: 900, minCustomers: 3, maxCustomers: 5 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 13, maxLevel: 99, minPowerReq: 500, maxPowerReq: 800, minGoldReward: 600, maxGoldReward: 1500, minCustomers: 3, maxCustomers: 6 },
    }),
  ]);

  console.log('✅ Đã tạo quest configs\n');

  // ============================================================
  // 8. LEVEL REWARDS (Quà thăng cấp)
  // ============================================================
  console.log('🎁 Tạo level rewards...');

  await Promise.all([
    prisma.levelReward.create({ data: { level: 2, cardId: cards[18].id, quantity: 2 } }),  // Lv2: 2x Động Cơ 1.5L -> Động Cơ Xe Máy 50cc (đổi item 1 chút để logic khớp - 18)
    prisma.levelReward.create({ data: { level: 3, cardId: cards[65].id, quantity: 2 } }), // Lv3: 2x Ống Xả Tiêu Chuẩn (65)
    prisma.levelReward.create({ data: { level: 5, cardId: cards[27].id, quantity: 1 } }),  // Lv5: 1x Động Cơ 2.0L Turbo (27)
    prisma.levelReward.create({ data: { level: 7, cardId: cards[55].id, quantity: 1 } }), // Lv7: 1x Turbo Tăng Áp Đôi (55)
    prisma.levelReward.create({ data: { level: 10, cardId: cards[76].id, quantity: 1 } }), // Lv10: 1x Ống Xả Titan Racing (76)
    prisma.levelReward.create({ data: { level: 15, cardId: cards[37].id, quantity: 1 } }), // Lv15: 1x V8 Supercharged (37)
  ]);

  console.log('✅ Đã tạo level rewards\n');

  // ============================================================
  // 9. ACHIEVEMENTS (Thành tựu cho Crew ẩn)
  // ============================================================
  console.log('🏅 Tạo achievements...');

  await Promise.all([
    prisma.achievement.create({
      data: {
        code: 'HEAT_SURVIVOR',
        name: 'Kẻ Sống Sót Trong Lửa',
        description: 'Chạy thử xe với Heat >90% từ đầu đến cuối mà không nổ máy.',
        conditionType: 'HEAT_FULL_RUN_90',
        conditionValue: 90,
        rewardCrewId: cards[191].id, // The Fugitive (191)
        isHidden: true,
      },
    }),
    prisma.achievement.create({
      data: {
        code: 'EXPLOSION_MASTER',
        name: 'Bậc Thầy Nổ Máy',
        description: 'Để xe nổ máy 10 lần trong cùng một phiên chơi.',
        conditionType: 'TOTAL_EXPLOSIONS',
        conditionValue: 10,
        rewardCrewId: cards[192].id, // Ghost Mechanic (192)
        isHidden: true,
      },
    }),
    prisma.achievement.create({
      data: {
        code: 'ZERO_COST_WIN',
        name: 'Chiến Thắng Với Giá 0 Đồng',
        description: 'Hoàn thành quest chỉ dùng linh kiện miễn phí/Common mà đạt đủ yêu cầu mã lực.',
        conditionType: 'ZERO_COST_QUEST',
        conditionValue: 1,
        rewardCrewId: cards[193].id, // The CEO (193)
        isHidden: true,
      },
    }),
    prisma.achievement.create({
      data: {
        code: 'MIDNIGHT_HACKER',
        name: 'Hacker Nửa Đêm',
        description: 'Nhấn vào đồng hồ trong gara 13 lần vào lúc nửa đêm.',
        conditionType: 'SECRET_CLOCK',
        conditionValue: 13,
        rewardCrewId: cards[194].id, // Black-Hat (194)
        isHidden: true,
      },
    }),
    prisma.achievement.create({
      data: {
        code: 'LEGENDARY_SACRIFICE',
        name: 'Hiến Tế Huyền Thoại',
        description: 'Sở hữu ít nhất 1 thẻ Legendary mỗi loại và bán hết cho Tay Buôn Lậu.',
        conditionType: 'SELL_ALL_LEGENDARY',
        conditionValue: 1,
        rewardCrewId: cards[195].id, // The Legend (195)
        isHidden: true,
      },
    }),
  ]);

  console.log('✅ Đã tạo 5 achievements\n');

  // ============================================================
  // 10. STARTER PERKS (Đặc quyền đầu trận)
  // ============================================================
  console.log('🎯 Tạo starter perks...');

  await Promise.all([
    prisma.starterPerk.create({
      data: { code: 'STARTUP_FUND', name: '🏦 Quỹ Khởi Nghiệp', description: '+200 Gold khi bắt đầu run mới. Vốn khởi nghiệp cho thợ máy mới!', effectType: 'GOLD_BONUS', effectValue: 200, unlockCondition: null, isDefault: true },
    }),
    prisma.starterPerk.create({
      data: { code: 'OLD_STASH', name: '📦 Kho Đồ Cũ', description: 'Nhận 5 thẻ ngẫu nhiên 2-3★ khi bắt đầu. Đồ cũ nhưng chất lượng!', effectType: 'CARDS_BONUS', effectValue: 5, unlockCondition: 'GOOD_ENDING', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'HOT_HANDS', name: '🔥 Bàn Tay Nóng', description: 'Ngưỡng nổ máy tăng lên 115% thay vì 100% suốt run. Thợ máy dày dạn kinh nghiệm!', effectType: 'HEAT_THRESHOLD', effectValue: 15, unlockCondition: 'TOTAL_EXPLOSIONS_15', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'CONNECTIONS', name: '👥 Mối Quan Hệ', description: '+1 Crew Slot khi bắt đầu run (cộng dồn với slot đã mở khóa vĩnh viễn).', effectType: 'CREW_SLOT', effectValue: 1, unlockCondition: 'OWN_8_CREW', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'VIP_CARD', name: '🏷️ Thẻ VIP Cửa Hàng', description: 'Shop giảm giá 20% trong 10 ngày đầu. Khách VIP luôn được ưu đãi!', effectType: 'SHOP_DISCOUNT', effectValue: 0.2, unlockCondition: 'TOTAL_SHOP_SPENT_10000', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'TECH_GENIUS', name: '⚙️ Thiên Tài Cơ Khí', description: '+100 Tech Points khi bắt đầu. Kinh nghiệm từ runs trước biến thành lợi thế!', effectType: 'TECH_POINTS', effectValue: 100, unlockCondition: 'REACH_LEVEL_10', isDefault: false },
    }),
  ]);

  console.log('✅ Đã tạo 6 starter perks\n');

  console.log('🎉 SEED HOÀN TẤT! SB-GARAGE sẵn sàng hoạt động!');
  console.log(`📊 Tổng kết:`);
  console.log(`   - ${cards.length} thẻ bài (185 linh kiện + 6 crew thường + 5 crew ẩn)`);
  console.log(`   - 34 hiệu ứng đặc biệt (23 linh kiện + 11 crew)`);
  console.log(`   - 25 combos`);
  console.log(`   - 12 Boss configs`);
  console.log(`   - 7 game events`);
  console.log(`   - 6 endings`);
  console.log(`   - 4 quest configs`);
  console.log(`   - 6 level rewards`);
  console.log(`   - 5 achievements (crew ẩn)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

