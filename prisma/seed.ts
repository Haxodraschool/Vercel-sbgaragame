// Seed Data - Dữ liệu khởi tạo cho SB-GARAGE
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚗 Bắt đầu seed dữ liệu SB-GARAGE...\n');

  console.log('🗑️ Xóa dữ liệu cũ...');
  // Xóa theo thứ tự phụ thuộc (bảng con trước, bảng cha sau)
  await prisma.userInventory.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userEnding.deleteMany();
  await prisma.userActiveEvent.deleteMany();
  await prisma.dailyQuest.deleteMany();
  await prisma.user.deleteMany();
  // Game data
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

  const cardsData = [
  { id: 1, name: 'Lọc Gió Performance', type: 'FILTER', rarity: 2, statPower: 12, statHeat: 6, statStability: 3, cost: 120, description: 'Bộ lọc gió hiệu năng cao, tăng luồng gió đáng kể.' },
  { id: 2, name: 'Lọc Gió Bằng Giấy', type: 'FILTER', rarity: 1, statPower: 3, statHeat: 5, statStability: 0, cost: 20, description: 'Rất mỏng manh, dễ rách và bám bụi.' },
  { id: 3, name: 'Lọc Gió Lưới Sắt', type: 'FILTER', rarity: 1, statPower: 6, statHeat: 7, statStability: 2, cost: 45, description: 'Luồng gió mạnh nhưng hút cả khí nóng của máy.' },
  { id: 4, name: 'Lọc Gió Xốp Dày', type: 'FILTER', rarity: 1, statPower: 4, statHeat: 3, statStability: 1, cost: 35, description: 'Dày hơn nhưng làm giảm luồng không khí.' },
  { id: 5, name: 'Lọc Gió Tái Chế', type: 'FILTER', rarity: 1, statPower: 4, statHeat: 6, statStability: 0, cost: 25, description: 'Hàng rẻ tiền từ bãi rác, không bền.' },
  { id: 6, name: 'Lọc Gió Cơ Bản', type: 'FILTER', rarity: 1, statPower: 5, statHeat: 3, statStability: 1, cost: 50, description: 'Bộ lọc gió tiêu chuẩn, giúp không khí sạch vào động cơ.' },
  { id: 7, name: 'Lọc Gió Cotton', type: 'FILTER', rarity: 2, statPower: 9, statHeat: 5, statStability: 2, cost: 85, description: 'Cản bụi tốt, giữ gió sạch và mát.' },
  { id: 8, name: 'Lọc Gió Hình Nón', type: 'FILTER', rarity: 2, statPower: 14, statHeat: 8, statStability: 1, cost: 110, description: 'Cone cone intake - nạp nhanh nhưng nóng máy.' },
  { id: 9, name: 'Lọc Gió Hộp Kín', type: 'FILTER', rarity: 2, statPower: 10, statHeat: 3, statStability: 4, cost: 130, description: 'Cách nhiệt tốt, hút không khí từ bên ngoài xe.' },
  { id: 10, name: 'Lọc Gió Màng Dầu', type: 'FILTER', rarity: 2, statPower: 11, statHeat: 5, statStability: 3, cost: 140, description: 'Phủ dầu cản bụi siêu bụi, bảo vệ động cơ.' },
  { id: 11, name: 'Lọc Gió Thể Thao K&N', type: 'FILTER', rarity: 3, statPower: 20, statHeat: 6, statStability: 5, cost: 165, description: 'Thương hiệu uy tín, ngon bổ rẻ cho mọi dòng xe.' },
  { id: 12, name: 'Cold Air Intake', type: 'FILTER', rarity: 3, statPower: 22, statHeat: 2, statStability: 8, cost: 210, description: 'Ống dẫn hút khí lạnh trực tiếp từ gầm xe.' },
  { id: 13, name: 'Lọc Gió Dual Cone', type: 'FILTER', rarity: 3, statPower: 28, statHeat: 9, statStability: 4, cost: 232, description: 'Hai nón hút gió song song, luồng khí dồi dào mãnh liệt.' },
  { id: 14, name: 'Lọc Gió Carbon Fiber', type: 'FILTER', rarity: 3, statPower: 25, statHeat: 5, statStability: 7, cost: 187, description: 'Lọc gió sợi carbon siêu nhẹ, luồng gió cực mạnh.' },
  { id: 15, name: 'Hệ Thống Ram Air', type: 'FILTER', rarity: 4, statPower: 40, statHeat: 7, statStability: 12, cost: 487, description: 'Ép gió tốc độ cao. ⚡ **Passive: Mát Mẻ** — Giảm 10 Heat cho tổng Heat toàn xe (áp dụng sau khi cộng tất cả slot).' },
  { id: 16, name: 'Bộ Gió Big Bore', type: 'FILTER', rarity: 4, statPower: 45, statHeat: 12, statStability: 8, cost: 540, description: 'Hút khí cưỡng bức. ⚡ **On-Test: Rộng Mở** — Khi bắt đầu chạy thử (test run), cộng thêm +15 Power vào tổng Power xe.' },
  { id: 17, name: 'Hyper-Flow Titanium', type: 'FILTER', rarity: 5, statPower: 65, statHeat: 6, statStability: 20, cost: 1050, description: 'Khí động học Titan. ⚡ **Passive: Bão Táp** — Cứ mỗi 1 điểm Stability tổng của xe → cộng thêm +1 Power. (VD: xe có 80 Stability → +80 Power)' },
  { id: 22, name: 'Quantum Intake', type: 'FILTER', rarity: 5, statPower: 70, statHeat: -4, statStability: 25, cost: 1350, description: 'Hút gió lượng tử khí âm sâu. ⚡ **Passive: Đóng Băng** — Giảm 50% tổng Heat tỏa ra từ tất cả thẻ ENGINE trên xe.' },
  { id: 18, name: 'Động Cơ Xe Máy 50cc', type: 'ENGINE', rarity: 1, statPower: 8, statHeat: 2, statStability: 5, cost: 20, description: 'Rất yếu nhưng được cái không nóng.' },
  { id: 19, name: 'Động Cơ Máy Phát Điện', type: 'ENGINE', rarity: 1, statPower: 12, statHeat: 12, statStability: 2, cost: 35, description: 'Yếu, hú to, rung bần bật.' },
  { id: 20, name: 'Động Cơ 1.0L 3 Xy-lanh', type: 'ENGINE', rarity: 1, statPower: 15, statHeat: 9, statStability: 4, cost: 65, description: 'Chỉ dùng chạy siêu thị, tiếng lạch cạch.' },
  { id: 21, name: 'V4 Cũ Nát', type: 'ENGINE', rarity: 1, statPower: 18, statHeat: 17, statStability: 1, cost: 80, description: 'Ăn dầu, lúc nổ lúc xịt.' },
  { id: 23, name: 'Động Cơ 1.5L', type: 'ENGINE', rarity: 1, statPower: 25, statHeat: 14, statStability: 2, cost: 100, description: 'Động cơ 4 xi-lanh 1.5L, đáng tin cậy nhưng công suất thấp.' },
  { id: 24, name: 'Động Cơ Dầu 2.5L Cũ', type: 'ENGINE', rarity: 2, statPower: 25, statHeat: 23, statStability: 5, cost: 120, description: 'Khói đen mịt mù nhưng moment xoắn ổn.' },
  { id: 25, name: 'I4 1.8L Bền Bỉ', type: 'ENGINE', rarity: 2, statPower: 28, statHeat: 14, statStability: 15, cost: 160, description: 'Không có gì để hỏng, nồi đồng cối đá.' },
  { id: 26, name: 'Boxer 2.0L Hút Khí Tự Nhiên', type: 'ENGINE', rarity: 2, statPower: 32, statHeat: 21, statStability: 25, cost: 210, description: 'Trọng tâm cực thấp, xe rất thăng bằng.' },
  { id: 27, name: 'V6 2.5L Tiêu Chuẩn', type: 'ENGINE', rarity: 2, statPower: 35, statHeat: 25, statStability: 8, cost: 190, description: 'Mẫu động cơ quốc dân.' },
  { id: 28, name: 'Động Cơ 2.0L Turbo', type: 'ENGINE', rarity: 2, statPower: 50, statHeat: 23, statStability: 5, cost: 200, description: 'Động cơ 2.0L tăng áp, cân bằng nhẹ giữa sức mạnh và nhiệt.' },
  { id: 29, name: 'I6 3.0L Cầm Chừng', type: 'ENGINE', rarity: 3, statPower: 55, statHeat: 32, statStability: 12, cost: 210, description: 'Êm ả, mượt mà ở vòng tua cao.' },
  { id: 30, name: 'V6 3.5L Hút Khí Tự Nhiên', type: 'ENGINE', rarity: 3, statPower: 60, statHeat: 35, statStability: 18, cost: 240, description: 'Đủ sức đi tour bạo lực trên cao tốc.' },
  { id: 31, name: 'V8 4.0L Nhỏ', type: 'ENGINE', rarity: 3, statPower: 65, statHeat: 40, statStability: 8, cost: 270, description: 'Sức mạnh cơ bắp của Mỹ đời đầu.' },
  { id: 32, name: 'Rotary Wankel Đúc Xương', type: 'ENGINE', rarity: 3, statPower: 70, statHeat: 52, statStability: 5, cost: 315, description: 'Vòng tua cao ngất ngưởng, tốn nhớt tốn xăng.' },
  { id: 33, name: 'V6 Twin-Turbo', type: 'ENGINE', rarity: 3, statPower: 85, statHeat: 35, statStability: 7, cost: 300, description: 'Động cơ V6 đôi tăng áp, sức mạnh vượt trội.' },
  { id: 34, name: 'Động Cơ Inline-6 2JZ', type: 'ENGINE', rarity: 4, statPower: 85, statHeat: 35, statStability: 40, cost: 637, description: 'Quái vật độ xe huyền thoại. ⚡ **Passive: Chịu Đựng** — Mỗi thẻ TURBO trên xe được giảm 15 Heat. (VD: 2 Turbo → -30 Heat tổng)' },
  { id: 35, name: 'V8 5.0L N/A', type: 'ENGINE', rarity: 4, statPower: 90, statHeat: 46, statStability: 15, cost: 525, description: 'Sức mạnh thuần túy, tiếng gầm đã tai. Không có hiệu ứng — thuần chỉ số cao.' },
  { id: 36, name: 'Động Cơ Điện Dual-Motor', type: 'ENGINE', rarity: 4, statPower: 100, statHeat: 57, statStability: 35, cost: 562, description: 'Đáp ứng momen xoắn tức thời. Không có hiệu ứng — thuần chỉ số cân bằng.' },
  { id: 37, name: 'V10 5.2L Screamer', type: 'ENGINE', rarity: 4, statPower: 110, statHeat: 69, statStability: 20, cost: 712, description: 'Tua máy 9000rpm chọc lủng màng nhĩ. ⚡ **On-Test: V10 Screamer** — Khi bắt đầu chạy thử, cộng thêm +20 Power vào tổng Power xe.' },
  { id: 38, name: 'V8 Supercharged', type: 'ENGINE', rarity: 4, statPower: 180, statHeat: 63, statStability: 12, cost: 600, description: 'Quái vật V8 siêu nạp! ⚡ **On-Test: V8 Rage** — Khi bắt đầu chạy thử, cộng thêm +30 Power vào tổng Power xe. Công suất khổng lồ nhưng Heat rất cao.' },
  { id: 39, name: 'I4 F1 Turbo-Hybrid 1.6L', type: 'ENGINE', rarity: 5, statPower: 140, statHeat: 81, statStability: 50, cost: 1350, description: 'Công nghệ đường đua F1! ⚡ **On-Test: KERS Hệ Thống - Faster Faster** — Cứ mỗi thẻ được quét TRƯỚC thẻ này, cộng thêm +5 Power. Tối đa 9 stack = +45 Power. (VD: đặt ở Slot 6 → 5 thẻ trước = +25 Power. Slot 10 → 9 thẻ trước = +45 Power)' },
  { id: 40, name: 'Động Cơ V12 6.5L Ý', type: 'ENGINE', rarity: 5, statPower: 150, statHeat: 92, statStability: 25, cost: 1125, description: 'Tác phẩm nghệ thuật cơ khí đỉnh cao. Không có hiệu ứng — thuần chỉ số Power/Heat cực lớn.' },
  { id: 41, name: 'Động Cơ Điện Quad-Motor TriMax', type: 'ENGINE', rarity: 5, statPower: 180, statHeat: 115, statStability: 60, cost: 1650, description: 'Gia tốc 0-100km/h trong 1.9s! ⚡ **Passive: Tương Lai** — Tự động nhân đôi (x2) tổng Stability của toàn xe. (VD: 100 Stability → 200)' },
  { id: 42, name: 'W16 Quad-Turbo', type: 'ENGINE', rarity: 5, statPower: 250, statHeat: 52, statStability: 20, cost: 1500, description: 'Động cơ W16 huyền thoại! ⚡ **On-Test: W16 Ultimate** — +50 Power khi chạy thử. **Passive:** +10 Stability cố định.' },
  { id: 43, name: 'Động Cơ Phản Lực J58', type: 'ENGINE', rarity: 5, statPower: 250, statHeat: 173, statStability: 0, cost: 1425, description: 'SR-71 Blackbird nhét vào ô tô. Không có hiệu ứng — thuần Power/Heat cực đoan (173 Heat, rất dễ nổ máy!).' },
  { id: 44, name: 'Turbo Cũ Phế Liệu', type: 'TURBO', rarity: 1, statPower: 8, statHeat: 17, statStability: 0, cost: 30, description: 'Nhặt từ bãi rác, chạy được là may, cực nóng!' },
  { id: 45, name: 'Turbo Rỉ Sét', type: 'TURBO', rarity: 1, statPower: 10, statHeat: 14, statStability: 0, cost: 40, description: 'Kêu cót két nhưng vẫn ép gió tạm.' },
  { id: 46, name: 'Turbo Đơn Cỡ Nhỏ', type: 'TURBO', rarity: 1, statPower: 14, statHeat: 13, statStability: 2, cost: 65, description: 'Loại thông dụng gắn sẵn trên các dòng xe gia đình.' },
  { id: 47, name: 'Chông Gió Giả Turbo', type: 'TURBO', rarity: 1, statPower: 5, statHeat: 2, statStability: 5, cost: 25, description: 'Gắn bô xả tạo tiếng giả turbo, rẻ tiền ít nóng.' },
  { id: 48, name: 'Turbo Nhỏ', type: 'TURBO', rarity: 1, statPower: 12, statHeat: 12, statStability: 1, cost: 80, description: 'Turbo nhỏ tăng áp nhẹ cho động cơ.' },
  { id: 49, name: 'Turbo Máy Kéo', type: 'TURBO', rarity: 2, statPower: 20, statHeat: 21, statStability: 1, cost: 130, description: 'Tháo từ máy cày, trâu bò nhưng độ trễ kinh hồn.' },
  { id: 50, name: 'Turbo Cánh Khế', type: 'TURBO', rarity: 2, statPower: 25, statHeat: 17, statStability: 3, cost: 170, description: 'Billet compressor - trọng lượng nhẹ, xoay nhanh.' },
  { id: 51, name: 'Turbo Tăng Áp Dầu', type: 'TURBO', rarity: 2, statPower: 28, statHeat: 23, statStability: 2, cost: 190, description: 'Bốc mạnh ở dải vòng tua cao, cần nhiều nhớt.' },
  { id: 52, name: 'Turbo Ổ Bi', type: 'TURBO', rarity: 2, statPower: 22, statHeat: 14, statStability: 5, cost: 210, description: 'Ball bearing quay siêu mượt, giảm ma sát tạo nhiệt.' },
  { id: 53, name: 'Turbo Bi-Turbo Nhỏ', type: 'TURBO', rarity: 3, statPower: 35, statHeat: 18, statStability: 4, cost: 232, description: 'Đáp ứng cực nhanh trong phố lẫn đường trường.' },
  { id: 54, name: 'Supercharger Yếu', type: 'TURBO', rarity: 3, statPower: 38, statHeat: 23, statStability: 2, cost: 270, description: 'Dây đai truyền động trục tiếp, không độ trễ nhưng ồn.' },
  { id: 55, name: 'Turbo Biến Thiên', type: 'TURBO', rarity: 3, statPower: 32, statHeat: 14, statStability: 8, cost: 300, description: 'VNT Turbo điều chỉnh khe hở gió, giữ mát tốt.' },
  { id: 56, name: 'Turbo Tăng Áp Đôi', type: 'TURBO', rarity: 3, statPower: 42, statHeat: 21, statStability: 3, cost: 262, description: 'Hệ thống tăng áp kép, boost mạnh mẽ!' },
  { id: 57, name: 'Turbo Twin-Scroll', type: 'TURBO', rarity: 4, statPower: 55, statHeat: 29, statStability: 10, cost: 562, description: 'Đường xoắn kép nạp max hiệu suất. ⚡ **On-Test: Phản Xạ Nhanh** — Khi bắt đầu chạy thử, cộng thêm +20 Power vào tổng.' },
  { id: 58, name: 'Supercharger Roots', type: 'TURBO', rarity: 4, statPower: 65, statHeat: 40, statStability: 5, cost: 637, description: 'Siêu nạp khổng lồ nắp capo. ⚡ **Passive: Siêu Phàm** — Power gốc của chính thẻ này được nhân x1.5 (65 → 97 Power).' },
  { id: 59, name: 'Vortex Hố Đen', type: 'TURBO', rarity: 5, statPower: 120, statHeat: 46, statStability: 0, cost: 1425, description: 'Hút cả ánh sáng! ⚡ **Passive: Hút Cạn** — Lấy 50% Power từ thẻ ENGINE cộng vào Power Turbo này + tăng thêm 30 Heat tổng xe. Đánh đổi Engine yếu đi để Turbo mạnh vượt trội.' },
  { id: 60, name: 'Anti-Lag System', type: 'TURBO', rarity: 5, statPower: 90, statHeat: 17, statStability: 30, cost: 1650, description: 'Bang-bang nổ pô liên thanh. ⚡ **Passive: Liên Hoàn Nổ** — Cộng thêm +50 Power cho thẻ ENGINE trên xe.' },
  { id: 61, name: 'Turbo Titan X', type: 'TURBO', rarity: 5, statPower: 100, statHeat: 23, statStability: 15, cost: 1125, description: 'Turbo cấp huyền thoại! ⚡ **On-Test: Titan Boost** — Khi bắt đầu chạy thử, cộng +30 Power mà KHÔNG tăng thêm Heat.' },
  { id: 62, name: 'Ống Bơ Hài Hước', type: 'EXHAUST', rarity: 1, statPower: 1, statHeat: 0, statStability: 1, cost: 15, description: 'Chế từ ống bơ, kêu như bò rống, khách chê.' },
  { id: 63, name: 'Ống Xả Gỉ Sét', type: 'EXHAUST', rarity: 1, statPower: 3, statHeat: -1, statStability: 2, cost: 25, description: 'Thoát khí kém, xả nhiệt ít, sắp rụng.' },
  { id: 64, name: 'Ống Xả Xe Máy', type: 'EXHAUST', rarity: 1, statPower: 4, statHeat: -2, statStability: 3, cost: 40, description: 'Cố nhét pô xe máy vào ô tô, bí hơi.' },
  { id: 65, name: 'Ống Xả Cắt Ngắn', type: 'EXHAUST', rarity: 1, statPower: 12, statHeat: -4, statStability: 0, cost: 50, description: 'Cắt thẳng cổ xả ra ngoài, ồn ào và rung lắc.' },
  { id: 66, name: 'Ống Xả Tiêu Chuẩn', type: 'EXHAUST', rarity: 1, statPower: 8, statHeat: -3, statStability: 4, cost: 60, description: 'Ống xả mặc định, thoát khí ổn định.' },
  { id: 67, name: 'Ống Xả Inox 304', type: 'EXHAUST', rarity: 2, statPower: 10, statHeat: -6, statStability: 8, cost: 110, description: 'Bền bỉ, sáng bóng, chống rỉ sét rạn nứt tuyệt đối.' },
  { id: 68, name: 'Ống Xả Cat-back', type: 'EXHAUST', rarity: 2, statPower: 12, statHeat: -4, statStability: 5, cost: 130, description: 'Giữ lại bầu lọc khí thải nhưng ống to hơn.' },
  { id: 69, name: 'Ống Xả Kép Dạng Y', type: 'EXHAUST', rarity: 2, statPower: 15, statHeat: -7, statStability: 4, cost: 145, description: 'Phân luồng khí xả hai bên, tản nhiệt tốt.' },
  { id: 70, name: 'Header Thép Cuộn', type: 'EXHAUST', rarity: 2, statPower: 20, statHeat: -3, statStability: 3, cost: 160, description: 'Cổ pô uốn cong tối ưu hóa dòng khí xả.' },
  { id: 71, name: 'Ống Xả Performance', type: 'EXHAUST', rarity: 2, statPower: 18, statHeat: -5, statStability: 7, cost: 150, description: 'Ống xả thể thao, thoát khí nhanh giảm nhiệt.' },
  { id: 72, name: 'Ống Xả Trị Liệu Âm', type: 'EXHAUST', rarity: 3, statPower: 15, statHeat: -8, statStability: 15, cost: 187, description: 'Âm thanh trầm ấm êm tai, cấu trúc vững chãi.' },
  { id: 73, name: 'Titanium Nhiệt Tiêu', type: 'EXHAUST', rarity: 3, statPower: 25, statHeat: -13, statStability: 8, cost: 262, description: 'Mỏng nhẹ tản nhiệt cực nhanh vì chế tác bằng Titan.' },
  { id: 74, name: 'Header Chéo Racing', type: 'EXHAUST', rarity: 3, statPower: 30, statHeat: -10, statStability: 6, cost: 285, description: 'Cổ xả phức tạp đồng bộ nhịp nổ của xi-lanh.' },
  { id: 76, name: 'Hệ Thống Side-Exit', type: 'EXHAUST', rarity: 4, statPower: 45, statHeat: -15, statStability: 10, cost: 487, description: 'Pô hông xe phong cách JDM! ⚡ **Adjacent: Lan Tỏa** — Thẻ được đặt ngay SAU thẻ này trong dãy slot được giảm 10 Heat.' },
  { id: 77, name: 'Catless Downpipe', type: 'EXHAUST', rarity: 4, statPower: 60, statHeat: -8, statStability: 5, cost: 540, description: 'Khạc lửa ầm ầm! ⚡ **Passive: Xả Nhiệt Toàn Bộ** — Mọi thẻ linh kiện trên xe đều được giảm 2 Heat. (VD: 10 thẻ → -20 Heat tổng)' },
  { id: 78, name: 'Ống Xả Titan Racing', type: 'EXHAUST', rarity: 4, statPower: 50, statHeat: -17, statStability: 18, cost: 450, description: 'Ống xả titanium racing! ⚡ **On-Test: Titan Exhaust** — Khi chạy thử, giảm thêm 15 Heat khỏi tổng Heat xe.' },
  { id: 79, name: 'Ghost Exhaust', type: 'EXHAUST', rarity: 5, statPower: 55, statHeat: -38, statStability: 40, cost: 1200, description: 'Công nghệ tàng hình âm thanh. ⚡ **Passive: Tàng Hình** — Nhân đôi (x2) tổng Stability của toàn xe + Bypass luật Boss cấm dùng ống xả (NO_EXHAUST).' },
  { id: 80, name: 'Plasma Đỏ Lửa', type: 'EXHAUST', rarity: 5, statPower: 80, statHeat: -25, statStability: 25, cost: 1575, description: 'Pô gốm vũ trụ plasma. ⚡ **Passive: Cột Lửa** — Nhân đôi bộ số âm Heat gốc của chính thẻ này (Heat -25 → -50).' },
  { id: 75, name: 'Quạt Chĩa Điều Hòa', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -2, statStability: 2, cost: 25, description: 'Cột quạt điện vào lưới tản nhiệt.' },
  { id: 81, name: 'Nước Lã Cây Xăng', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -1, statStability: 0, cost: 10, description: 'Đổ nước máy cho két nước rỉ sét.' },
  { id: 82, name: 'Két Nước Nhựa', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -3, statStability: 0, cost: 45, description: 'Dễ bung mối nối khi vòng tua cao.' },
  { id: 83, name: 'Quạt Làm Mát', type: 'COOLING', rarity: 1, statPower: 0, statHeat: -4, statStability: 8, cost: 70, description: 'Quạt tản nhiệt cơ bản, giúp hạ nhiệt động cơ.' },
  { id: 84, name: 'Nước Làm Mát Pha Loãng', type: 'COOLING', rarity: 2, statPower: 0, statHeat: -5, statStability: 4, cost: 80, description: 'Xanh lè nhưng nhiều cặn.' },
  { id: 85, name: 'Ống Dẫn Nhiệt Silicon', type: 'COOLING', rarity: 2, statPower: 0, statHeat: -7, statStability: 8, cost: 110, description: 'Tản nhiệt mạch máu bền bỉ.' },
  { id: 86, name: 'Két Nước Đôi Nhôm Lớn', type: 'COOLING', rarity: 2, statPower: 2, statHeat: -10, statStability: 6, cost: 140, description: 'Nặng nhưng khá mát.' },
  { id: 87, name: 'Két Nước Racing', type: 'COOLING', rarity: 2, statPower: 3, statHeat: -8, statStability: 12, cost: 160, description: 'Két nước cỡ lớn cho xe đua.' },
  { id: 88, name: 'Quạt Điện Đôi Hiệu Năng', type: 'COOLING', rarity: 3, statPower: 3, statHeat: -15, statStability: 10, cost: 195, description: 'Giải nhiệt tức thì khi kẹt xe.' },
  { id: 89, name: 'Dung Dịch Nước Đá', type: 'COOLING', rarity: 3, statPower: 5, statHeat: -19, statStability: 8, cost: 240, description: 'Chất lỏng đặc biệt siêu sủi bọt.' },
  { id: 90, name: 'Bộ Két Nhôm CNC 3 Lõi', type: 'COOLING', rarity: 3, statPower: 4, statHeat: -21, statStability: 15, cost: 292, description: 'Hút gió đỉnh, chịu áp lực cao.' },
  { id: 91, name: 'Intercooler Carbon', type: 'COOLING', rarity: 3, statPower: 7, statHeat: -15, statStability: 18, cost: 285, description: 'Bộ tản nhiệt trung gian carbon, giảm nhiệt cực mạnh.' },
  { id: 92, name: 'Nước Làm Mát Ngoại Cỡ', type: 'COOLING', rarity: 4, statPower: 5, statHeat: -34, statStability: 20, cost: 487, description: 'Sôi ở 190 độ C, không bao giờ trào.' },
  { id: 93, name: 'Bộ Làm Mát Bằng Cồn Methanol', type: 'COOLING', rarity: 4, statPower: 15, statHeat: -30, statStability: 5, cost: 600, description: 'Phun Methanol! ⚡ **Passive: Bốc Hơi Ác Liệt** — Cộng thêm +10 Power vào tổng Power xe nhờ khí lạnh nạp thêm.' },
  { id: 94, name: 'Két Nước Khổng Lồ Tích Hợp', type: 'COOLING', rarity: 4, statPower: 0, statHeat: -42, statStability: 25, cost: 637, description: 'Nhìn như chiếc khiên che hết đầu xe. Không có hiệu ứng — thuần chỉ số Heat -42 rất cao.' },
  { id: 95, name: 'Khí Nito Lỏng Làm Mát Trực Tiếp', type: 'COOLING', rarity: 5, statPower: 20, statHeat: -68, statStability: 10, cost: 1425, description: 'Sương giá bủa vây động cơ! ⚡ **Passive: Deep Freeze** — Vô hiệu hóa hoàn toàn luật Boss yêu cầu về nhiệt (điều kiện Heat của Boss bị bỏ qua).' },
  { id: 96, name: 'Bộ Tản Nhiệt Graphene', type: 'COOLING', rarity: 5, statPower: 10, statHeat: -59, statStability: 40, cost: 1350, description: 'Siêu vật liệu dẫn nhiệt tuyệt đối. Không có hiệu ứng — thuần chỉ số Heat -59 + 40 Stability cực cân bằng.' },
  { id: 97, name: 'Hệ Thống Từ Trường Lượng Tử', type: 'COOLING', rarity: 5, statPower: 0, statHeat: -85, statStability: 50, cost: 1725, description: 'Công nghệ ngoài vũ trụ. ⚡ **Passive: Không Độ Tuyệt Đối** — Tổng Heat cuối cùng của toàn xe luôn bị ép về 0, bất kể bao nhiêu thẻ được lắp.' },
  { id: 98, name: 'Cryo Cooling System', type: 'COOLING', rarity: 5, statPower: 15, statHeat: -30, statStability: 35, cost: 1350, description: 'Hệ thống đóng băng mọi nhiệt độ. ⚡ **Passive: Cryo Freeze** — Giảm 10 Heat cố định cho tổng Heat toàn xe (cộng thêm vào chỉ số -30 sẵn có).' },
  { id: 99, name: 'Xăng Pha Nước', type: 'FUEL', rarity: 1, statPower: 2, statHeat: 12, statStability: -5, cost: 15, description: 'Xe giật cục, đánh lửa lỗi liên tục.' },
  { id: 100, name: 'Nhiên Liệu Tái Chế Cặn', type: 'FUEL', rarity: 1, statPower: 5, statHeat: 9, statStability: -2, cost: 25, description: 'Lấy từ ống xả lò đốt rác.' },
  { id: 101, name: 'Xăng A92 Giá Rẻ', type: 'FUEL', rarity: 1, statPower: 8, statHeat: 6, statStability: 0, cost: 35, description: 'Tạm xài được qua ngày.' },
  { id: 102, name: 'Xăng RON 95', type: 'FUEL', rarity: 1, statPower: 10, statHeat: 7, statStability: 2, cost: 50, description: 'Nhiên liệu tiêu chuẩn.' },
  { id: 103, name: 'Dầu Diesel Dân Dụng', type: 'FUEL', rarity: 2, statPower: 12, statHeat: 12, statStability: 5, cost: 65, description: 'Chậm chạp nhưng mô-men xoắn đều.' },
  { id: 104, name: 'Xăng Sinh Học E5', type: 'FUEL', rarity: 2, statPower: 10, statHeat: 5, statStability: 6, cost: 70, description: 'Bảo vệ môi trường, xe chạy êm.' },
  { id: 105, name: 'Phụ Gia Xăng Thập Cẩm', type: 'FUEL', rarity: 2, statPower: 15, statHeat: 14, statStability: 2, cost: 90, description: 'Bỏ lọ làm sạch kim phun tăng chút bốc.' },
  { id: 106, name: 'Xăng RON 97', type: 'FUEL', rarity: 3, statPower: 22, statHeat: 9, statStability: 5, cost: 135, description: 'Xịn hơn 95, đánh lửa ngọt ngào.' },
  { id: 107, name: 'Xăng Hàng Không AvGas', type: 'FUEL', rarity: 3, statPower: 35, statHeat: 21, statStability: -5, cost: 187, description: 'Trộn ít chì từ sân bay, cẩn thận tắc pô.' },
  { id: 108, name: 'Nhiên Liệu Cồn Ethanol E85', type: 'FUEL', rarity: 3, statPower: 40, statHeat: 17, statStability: 8, cost: 217, description: 'Cồn sinh học cháy lạnh, lấy Power cực cao!' },
  { id: 109, name: 'Xăng Racing 100', type: 'FUEL', rarity: 3, statPower: 32, statHeat: 12, statStability: 5, cost: 225, description: 'Xăng cao cấp cho xe đua, cháy sạch hơn.' },
  { id: 110, name: 'Diesel Tàu Biển Rút Rọn', type: 'FUEL', rarity: 4, statPower: 50, statHeat: 35, statStability: 15, cost: 412, description: 'Khói mù mịt, lực kéo đẩy cả xe lu.' },
  { id: 111, name: 'Hỗn Hợp Nitromethane', type: 'FUEL', rarity: 4, statPower: 75, statHeat: 52, statStability: -10, cost: 637, description: 'Chỉ dùng cho xe đua Top Fuel! ⚡ **On-Test: Cháy Kiệt Cực** — Nếu lắp ở Slot 1–3: cộng thêm +25 Power. Nếu lắp ở Slot 8–10: tăng thêm +15 Heat.' },
  { id: 112, name: 'Phụ Gia Đua Hexane Tinh Khiết', type: 'FUEL', rarity: 4, statPower: 60, statHeat: 29, statStability: 20, cost: 510, description: 'Đánh lửa siêu hoàn hảo. Không có hiệu ứng — thuần chỉ số cao cân bằng.' },
  { id: 113, name: 'Nhiên Liệu Tên Lửa', type: 'FUEL', rarity: 4, statPower: 70, statHeat: 35, statStability: 5, cost: 525, description: 'Nhiên liệu quân sự! ⚡ **On-Test: Rocket Burn** — Khi chạy thử, tăng thêm +20 Heat vào tổng Heat xe. Cực nguy hiểm!' },
  { id: 114, name: 'Nhiên Liệu Ion Phản Tích Tụ', type: 'FUEL', rarity: 5, statPower: 100, statHeat: 23, statStability: 50, cost: 1350, description: 'Đóng gói Power cực cao mà ít nhiệt dư thừa! Không có hiệu ứng — thuần chỉ số 100 Power + 50 Stability tuyệt vời.' },
  { id: 115, name: 'Xăng Nhựa Thông Cực Đoan', type: 'FUEL', rarity: 5, statPower: 130, statHeat: 92, statStability: -20, cost: 1500, description: 'Khét lẹt! ⚡ **Passive: Hủy Diệt** — Khi tổng Heat toàn xe vượt 90% ngưỡng nổ (≥ 90 Heat), nhân đôi (x2) tổng Power toàn xe. Gamble cực lớn!' },
  { id: 116, name: 'Hoạt Chất Lõi Mặt Trời', type: 'FUEL', rarity: 5, statPower: 200, statHeat: 138, statStability: 0, cost: 1875, description: 'Lõi Plasma. ⚡ **Passive: Mặt Trời Thu Nhỏ** — Giảm 80% tổng Stability toàn xe (chỉ giữ lại 20%). Power 200 nhưng xe cực kỳ mất ổn định.' },
  { id: 117, name: 'Lò Xo Gãy Nát', type: 'SUSPENSION', rarity: 1, statPower: 0, statHeat: 0, statStability: 1, cost: 10, description: 'Nảy tưng tưng qua từng hòn sỏi.' },
  { id: 118, name: 'Giảm Xóc Chảy Dầu', type: 'SUSPENSION', rarity: 1, statPower: 0, statHeat: 0, statStability: 3, cost: 20, description: 'Bập bềnh như ngồi thuyền sóng lớn.' },
  { id: 119, name: 'Lò Xo Cắt Ngắn Bằng Máy', type: 'SUSPENSION', rarity: 1, statPower: -2, statHeat: 0, statStability: 4, cost: 40, description: 'Dân chơi hạ gầm bất chấp hỏng gầm.' },
  { id: 120, name: 'Giảm Xóc Cơ Bản', type: 'SUSPENSION', rarity: 1, statPower: 2, statHeat: 0, statStability: 6, cost: 60, description: 'Giảm xóc tiêu chuẩn, giữ xe ổn định.' },
  { id: 121, name: 'Phuộc Nhún Taxi Cũ', type: 'SUSPENSION', rarity: 2, statPower: 0, statHeat: 0, statStability: 8, cost: 85, description: 'Thay lại từ bản base bãi xe phế thải.' },
  { id: 122, name: 'Giảm Xóc Dầu Kép', type: 'SUSPENSION', rarity: 2, statPower: 0, statHeat: 0, statStability: 12, cost: 120, description: 'Đủ xài chở đồ đi phố êm ái.' },
  { id: 123, name: 'Phuộc Có Thanh Cân Bằng', type: 'SUSPENSION', rarity: 2, statPower: 5, statHeat: 0, statStability: 15, cost: 160, description: 'Gia cố vào khoang máy cho chắc tay lái.' },
  { id: 124, name: 'Hệ Thống Treo Túi Khí Cơm', type: 'SUSPENSION', rarity: 3, statPower: -5, statHeat: 0, statStability: 25, cost: 187, description: 'Air-suspension nhưng chỉnh bằng tay cực chậm.' },
  { id: 125, name: 'Coilover Thể Thao Phố', type: 'SUSPENSION', rarity: 3, statPower: 5, statHeat: 0, statStability: 28, cost: 225, description: 'Cứng cáp vào cua rất ngọt.' },
  { id: 126, name: 'Phuộc Offroad Giảm Lực', type: 'SUSPENSION', rarity: 3, statPower: 0, statHeat: 0, statStability: 32, cost: 285, description: 'Không lún bùn, bò trên đá.' },
  { id: 127, name: 'Coilover Racing', type: 'SUSPENSION', rarity: 3, statPower: 10, statHeat: 0, statStability: 15, cost: 262, description: 'Hệ thống treo có thể chỉnh độ cao và độ cứng.' },
  { id: 128, name: 'Coilover Trục Lồng Replica', type: 'SUSPENSION', rarity: 4, statPower: 12, statHeat: 0, statStability: 45, cost: 487, description: 'Chất lượng Thụy Điển nhưng bản sao, ôm đường chuẩn.' },
  { id: 129, name: 'Khí Nén Tự Động Phân Bổ', type: 'SUSPENSION', rarity: 4, statPower: 0, statHeat: -4, statStability: 55, cost: 637, description: 'Bơm AI tự phân bổ lực. ⚡ **Passive: Tự Động Định Tuyến** — Xóa toàn bộ chỉ số Stability âm (trừ điểm) của mọi thẻ trên xe. Chỉ giữ lại Stability dương.' },
  { id: 130, name: 'Giảm Xóc Thanh Xoắn Track-Use', type: 'SUSPENSION', rarity: 4, statPower: 15, statHeat: 0, statStability: 50, cost: 540, description: 'Cực kì xóc, bám đường như keo 502. Không có hiệu ứng — thuần chỉ số 50 Stability + 15 Power.' },
  { id: 131, name: 'Treo Thủy Lực Nhảy Múa', type: 'SUSPENSION', rarity: 5, statPower: 0, statHeat: 12, statStability: 70, cost: 1200, description: 'Lowrider bơm nhảy nhót! ⚡ **Passive: Trình Diễn Thu Hút** — Khi hoàn thành màn thắng, số Gold nhận được được nhân đôi (x2 Gold).' },
  { id: 132, name: 'Treo Điện Từ MagneRide', type: 'SUSPENSION', rarity: 5, statPower: 25, statHeat: 6, statStability: 80, cost: 1387, description: 'Vật chất từ tính biến thiên độ cứng từng mili-giây. Không có hiệu ứng — thuần chỉ số 80 Stability cực cao.' },
  { id: 133, name: 'Cân Bằng Lực Hấp Dẫn Anti-G', type: 'SUSPENSION', rarity: 5, statPower: 50, statHeat: 0, statStability: 120, cost: 1800, description: 'Phi thuyền UFO bám đất! ⚡ **Passive: Khóa Tọa Độ** — Stability gốc của chính thẻ này được nhân x1.5 (120 → 180). Xe không thể bị lật.' },
  { id: 134, name: 'Lốp Cũ Nứt Nẻ', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 1, cost: 10, description: 'Nứt toác, chạy nhanh là nổ.' },
  { id: 135, name: 'Lốp Xe Đạp Mũi Dày', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 2, cost: 20, description: 'Gắn tạm cho xe nhẹ.' },
  { id: 136, name: 'Lốp Tái Chế Trọc', type: 'TIRE', rarity: 1, statPower: 0, statHeat: 0, statStability: 4, cost: 35, description: 'Chỉ dùng trượt băng là giỏi.' },
  { id: 137, name: 'Lốp Đường Phố', type: 'TIRE', rarity: 1, statPower: 3, statHeat: 0, statStability: 8, cost: 55, description: 'Lốp tiêu chuẩn, bám đường ổn định.' },
  { id: 138, name: 'Lốp Địa Hình Cũ', type: 'TIRE', rarity: 2, statPower: -2, statHeat: 0, statStability: 8, cost: 90, description: 'Cản gió to, ì ạch nhưng chắc xe.' },
  { id: 139, name: 'Lốp Dự Phòng Tạm Thời', type: 'TIRE', rarity: 2, statPower: 0, statHeat: 0, statStability: 6, cost: 70, description: 'Chỉ giới hạn 50km/h.' },
  { id: 140, name: 'Lốp All-Season Bền', type: 'TIRE', rarity: 2, statPower: 0, statHeat: 0, statStability: 10, cost: 120, description: 'Đi được bốn mùa, an toàn.' },
  { id: 141, name: 'Lốp Semi-Slick', type: 'TIRE', rarity: 2, statPower: 8, statHeat: 2, statStability: 16, cost: 180, description: 'Lốp bán chuyên, độ bám tốt trên mặt khô.' },
  { id: 142, name: 'Lốp Performance Trơn', type: 'TIRE', rarity: 3, statPower: 5, statHeat: 2, statStability: 15, cost: 187, description: 'Bám dính nhè nhẹ ở tốc độ cao.' },
  { id: 143, name: 'Lốp Drifting Khói Mù', type: 'TIRE', rarity: 3, statPower: 2, statHeat: 9, statStability: 12, cost: 165, description: 'Sinh ma sát cao để tạo khói nghệ thuật.' },
  { id: 144, name: 'Lốp Off-Road Gai To', type: 'TIRE', rarity: 3, statPower: -5, statHeat: 0, statStability: 22, cost: 210, description: 'Không lún bùn, bò trên đá.' },
  { id: 145, name: 'Lốp Track-Day Bán Chuyên', type: 'TIRE', rarity: 4, statPower: 10, statHeat: 6, statStability: 28, cost: 375, description: 'Cao su mềm bám đường đua. (Không có hiệu ứng)' },
  { id: 146, name: 'Lốp Mùa Đông Đinh Tán', type: 'TIRE', rarity: 4, statPower: -5, statHeat: -8, statStability: 25, cost: 360, description: 'Đinh tản nhiệt truyền băng giá lên xe. ⚡ **Passive: Băng Giá** — Giảm 10 Heat cố định cho tổng Heat toàn xe.' },
  { id: 147, name: 'Lốp Compound Bề Mặt Kép', type: 'TIRE', rarity: 4, statPower: 8, statHeat: 2, statStability: 32, cost: 412, description: 'Chuyên dụng góc cua gắt. Không có hiệu ứng — thuần chỉ số 32 Stability.' },
  { id: 148, name: 'Lốp Racing Slick', type: 'TIRE', rarity: 4, statPower: 25, statHeat: 6, statStability: 35, cost: 487, description: 'Lốp đua chuyên nghiệp! Không có hiệu ứng — thuần chỉ số Power + Stability cao.' },
  { id: 149, name: 'Lốp Cao Su Chảy Siêu Bám', type: 'TIRE', rarity: 5, statPower: 15, statHeat: 12, statStability: 42, cost: 900, description: 'Ma sát nung chảy lốp. ⚡ **On-Test: Đốt Lốp** — Khi bắt đầu chạy thử, cộng thêm +15 Power vào tổng Power xe.' },
  { id: 150, name: 'Lốp Thủy Tinh Khí Động Học', type: 'TIRE', rarity: 5, statPower: 20, statHeat: 0, statStability: 28, cost: 1125, description: 'Triệt tiêu lực cản gió hoàn toàn. Không có hiệu ứng — thuần chỉ số.' },
  { id: 151, name: 'Lốp Từ Tính Nam Châm Điện', type: 'TIRE', rarity: 5, statPower: 5, statHeat: 0, statStability: 65, cost: 1500, description: 'Bám dính mặt đường. ⚡ **Passive: Lực Từ Tính** — Nhân đôi (x2) tổng Stability gốc của toàn bộ xe. (VD: 100 Stability → 200)' },
  { id: 152, name: 'Bình Xịt Phanh', type: 'NITROUS', rarity: 1, statPower: 2, statHeat: 6, statStability: -1, cost: 20, description: 'Đốt cháy dung môi kém.' },
  { id: 153, name: 'Lon Khí Bơm Bóng', type: 'NITROUS', rarity: 1, statPower: 3, statHeat: 6, statStability: -2, cost: 25, description: 'Khí rác làm xe nổ rát nghẹt.' },
  { id: 154, name: 'Hút Khí Y Tế', type: 'NITROUS', rarity: 1, statPower: 4, statHeat: 2, statStability: -1, cost: 35, description: 'Bình Oxy mini bệnh viện, mang lại tý khí tươi.' },
  { id: 155, name: 'Bình Găng-tay Rẻ Tiền', type: 'NITROUS', rarity: 1, statPower: 5, statHeat: 9, statStability: -4, cost: 40, description: 'Chế tạo chui lủi, dễ xì khí.' },
  { id: 156, name: 'Bộ Nén Khí Bằng Tay', type: 'NITROUS', rarity: 2, statPower: 10, statHeat: 17, statStability: -5, cost: 80, description: 'Gắn van xe đạp xì hơi vào buồng đốt.' },
  { id: 157, name: 'NOS Chợ Đen Rỉ Sét', type: 'NITROUS', rarity: 2, statPower: 15, statHeat: 23, statStability: -8, cost: 120, description: 'Vỏ bình rỉ sét, uy hiếp nổ tung.' },
  { id: 158, name: 'NOS Dỏm Tự Pha', type: 'NITROUS', rarity: 2, statPower: 18, statHeat: 29, statStability: -10, cost: 140, description: 'Pha tạp chất chạy cực sốc.' },
  { id: 159, name: 'NOS Nhỏ', type: 'NITROUS', rarity: 2, statPower: 25, statHeat: 21, statStability: -5, cost: 180, description: 'Bình NOS nhỏ, tăng sức mạnh tức thì!' },
  { id: 160, name: 'Hệ Thống Phun Khô Cũ', type: 'NITROUS', rarity: 3, statPower: 20, statHeat: 12, statStability: -2, cost: 187, description: 'Phun không cầu kỳ, cực cháy.' },
  { id: 161, name: 'Hệ Thống Phun Ướt Đi Phố', type: 'NITROUS', rarity: 3, statPower: 25, statHeat: 17, statStability: -5, cost: 240, description: 'Đục đường xăng trộn chung NOS.' },
  { id: 162, name: 'Hệ Thống Phun Khô Racing', type: 'NITROUS', rarity: 3, statPower: 35, statHeat: 21, statStability: -8, cost: 262, description: 'Hệ thống phun khô chuyên nghiệp, tăng tốc tức thì.' },
  { id: 163, name: 'Hệ Thống Phun Ướt Stage 2', type: 'NITROUS', rarity: 3, statPower: 40, statHeat: 26, statStability: -10, cost: 300, description: 'Cấp độ 2, cháy mạnh hơn.' },
  { id: 164, name: 'Bình NOS Khổng Lồ', type: 'NITROUS', rarity: 4, statPower: 60, statHeat: 35, statStability: -12, cost: 562, description: 'Bình NOS cỡ lớn, tăng sức mạnh khổng lồ! Không có hiệu ứng — thuần chỉ số.' },
  { id: 165, name: 'NOS Progressive Controller', type: 'NITROUS', rarity: 4, statPower: 45, statHeat: 23, statStability: -5, cost: 525, description: 'Điều khiển tăng dần. ⚡ **On-Test: Tăng Tốc Tiến Bộ** — Khi bắt đầu chạy thử, cộng thêm +20 Power vào tổng Power xe.' },
  { id: 166, name: 'Hệ Thống Phun Ướt Stage 3', type: 'NITROUS', rarity: 4, statPower: 70, statHeat: 40, statStability: -15, cost: 637, description: 'Cấp độ 3, cực mạnh! Không có hiệu ứng — thuần chỉ số.' },
  { id: 167, name: 'NOS Direct Port Injection', type: 'NITROUS', rarity: 5, statPower: 100, statHeat: 52, statStability: -20, cost: 1350, description: 'Phun trực tiếp từng xi-lanh! ⚡ **On-Test: Đột Phá** — Khi bắt đầu chạy thử, cộng thêm +40 Power vào tổng Power xe.' },
  { id: 168, name: 'Hệ Thống NOS Nitro-Max', type: 'NITROUS', rarity: 5, statPower: 120, statHeat: 69, statStability: -25, cost: 1500, description: 'Hệ thống NOS tối đa! Không có hiệu ứng — thuần chỉ số cực lớn.' },
  { id: 169, name: 'Plasma Nitrous Oxide', type: 'NITROUS', rarity: 5, statPower: 150, statHeat: 81, statStability: -30, cost: 1875, description: 'NOS plasma vũ trụ! ⚡ **On-Test: Plasma Surge** — Khi bắt đầu chạy thử, cộng thêm +50 Power vào tổng Power xe.' },
  { id: 170, name: 'Cờ Lê Rỉ Trượt Ốc', type: 'TOOL', rarity: 1, statPower: -2, statHeat: 0, statStability: -2, cost: 5, description: 'Làm lỏng thêm chi tiết xe.' },
  { id: 171, name: 'Búa Gò Móp Méo', type: 'TOOL', rarity: 1, statPower: 0, statHeat: 0, statStability: -3, cost: 10, description: 'Đập rách vỏ xe.' },
  { id: 172, name: 'Băng Dính Vạn Năng Đen', type: 'TOOL', rarity: 1, statPower: 0, statHeat: 0, statStability: 5, cost: 20, description: 'Dán mọi khe hở tản mạn!' },
  { id: 173, name: 'Bộ Cờ Lê', type: 'TOOL', rarity: 1, statPower: 2, statHeat: 0, statStability: 5, cost: 40, description: 'Bộ cờ lê cơ bản, lắp ráp chắc chắn.' },
  { id: 174, name: 'Dây Rút Nhựa Trắng', type: 'TOOL', rarity: 2, statPower: 0, statHeat: 0, statStability: 8, cost: 50, description: 'Cố định ống xả rơi rụng.' },
  { id: 175, name: 'Súng Bắn Ốc Pin Yếu', type: 'TOOL', rarity: 2, statPower: 2, statHeat: 0, statStability: 2, cost: 65, description: 'Thêm chút khí động học.' },
  { id: 176, name: 'Kìm Chết Gãy Mỏ', type: 'TOOL', rarity: 2, statPower: 0, statHeat: -4, statStability: 0, cost: 85, description: 'Bóp gãy van xả nhiệt thừa.' },
  { id: 177, name: 'Máy Chẩn Đoán OBD2', type: 'TOOL', rarity: 2, statPower: 6, statHeat: -3, statStability: 9, cost: 130, description: 'Máy quét lỗi, an tâm vặn ga.' },
  { id: 178, name: 'Keo Dán AB Đa Dụng', type: 'TOOL', rarity: 3, statPower: 0, statHeat: -2, statStability: 15, cost: 150, description: 'Khóa cứng các lỗ hổng nhiệt.' },
  { id: 179, name: 'Súng Đo Nhiệt', type: 'TOOL', rarity: 3, statPower: 0, statHeat: -13, statStability: 0, cost: 225, description: 'Tránh điểm mù nhiệt.' },
  { id: 180, name: 'Bộ Chỉnh ECU Bỏ Túi', type: 'TOOL', rarity: 3, statPower: 10, statHeat: 6, statStability: 5, cost: 285, description: 'Hack map engine nhẹ.' },
  { id: 181, name: 'Cánh Gió Gắn Tạm (Canards)', type: 'TOOL', rarity: 4, statPower: 0, statHeat: 0, statStability: 25, cost: 337, description: 'Lắp canard 3M. (Không có hiệu ứng)' },
  { id: 182, name: 'Bản Đồ Mạch Điện Tử', type: 'TOOL', rarity: 4, statPower: 18, statHeat: 0, statStability: 0, cost: 412, description: 'Khơi thông dòng đánh lửa. (Không có hiệu ứng)' },
  { id: 183, name: 'Hệ Thống Đo Lường Từ Xa', type: 'TOOL', rarity: 4, statPower: 5, statHeat: 0, statStability: 20, cost: 510, description: 'Telemetry xe đua. ⚡ **Passive: Định Giá Dữ Liệu** — Khi lắp thẻ này và hoàn thành màn thắng, nhận thêm +15% Gold thưởng.' },
  { id: 184, name: 'Hộp Đồ Nghề Dát Vàng', type: 'TOOL', rarity: 5, statPower: 0, statHeat: -17, statStability: 45, cost: 3000, description: 'Snap-On Gold. ⚡ **Passive: Xa Xỉ Phẩm** — Khi hoàn thành màn thắng, hoàn trả 100% số Gold đã chi mua linh kiện trong màn đó (x2 Gold bonus).' },
  { id: 185, name: 'Drone Phân Tích Đường Đua', type: 'TOOL', rarity: 5, statPower: 10, statHeat: -8, statStability: 30, cost: 900, description: 'Drone bay soi đường. Không có hiệu ứng — thuần chỉ số cân bằng: 10 Power, -8 Heat, 30 Stability.' },
  { id: 186, name: 'Thiết Bị Hack Trụ Trạm', type: 'TOOL', rarity: 5, statPower: 50, statHeat: 57, statStability: -10, cost: 2625, description: 'Cướp quyền trạm xăng! ⚡ **Passive: Cướp Quyền Boss** — Bypass hoàn toàn mọi luật lệ khắt khe của Boss (VD: cấm dùng Cooling, yêu cầu tối thiểu sao, v.v).' },
  { id: 187, name: 'Kỹ Sư Nhiệt (The Cooler)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 300, unlockType: 'SHOP', description: '⚡ **Passive: Giải Nhiệt Cấp Tốc** — Giảm 10% tổng Heat của tất cả thẻ TURBO được lắp trên xe.' },
  { id: 188, name: 'Chuyên Gia Ống Xả (The Flow)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 800, unlockType: 'SHOP', description: '⚡ **Passive: Luồng Khí Mượt Mà** — Tất cả thẻ ỐNG XẢ được cộng thêm +15 Power mà KHÔNG tăng thêm Heat.' },
  { id: 189, name: 'Kế Toán Trưởng (The Accountant)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 500, unlockType: 'SHOP', description: '⚡ **Passive: Tối Ưu Ngân Sách** — Sau mỗi màn thắng, hoàn trả 10% tổng số Gold đã chi mua linh kiện trong màn đó.' },
  { id: 190, name: 'Tay Lái Thử (The Stuntman)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 1000, unlockType: 'SHOP', description: '⚡ **Passive: Kiểm Soát Giới Hạn** — Ngưỡng nổ máy tăng thêm +5 điểm (từ 100 lên 105). Chỉ kích hoạt khi currentHeat vượt 95.' },
  { id: 191, name: 'Thợ Sơn (The Artist)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 400, unlockType: 'SHOP', description: '⚡ **Passive: Vẻ Ngoài Hào Nhoáng** — +15% sự hài lòng khách hàng, có cơ hội nhận thêm tiền tip ngẫu nhiên khi hoàn thành quest.' },
  { id: 192, name: 'Chuyên Gia Lốp (The Grip)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 1200, unlockType: 'SHOP', description: '⚡ **Passive: Bám Đường Tuyệt Đối** — Nếu tổng Power xe vượt 400, cộng thêm +20 Stability.' },
  { id: 193, name: 'Bác Sĩ Xăng (The Fuel Doctor)', type: 'CREW', rarity: 3, statPower: 0, statHeat: 0, statStability: 0, cost: 900, unlockType: 'SHOP', description: '⚡ **Passive: Pha Chế Hoàn Hảo** — Tất cả slot FUEL được nhân đôi (x2) Power, nhưng Heat của các slot FUEL cũng tăng x1.5. Đánh đổi sức mạnh lấy nhiệt.' },
  { id: 194, name: 'Thợ Hàn Ngầm (The Welder)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 350, unlockType: 'SHOP', description: '⚡ **Passive: Mối Hàn Hoàn Hảo** — Tất cả slot EXHAUST được cộng thêm +10 Stability.' },
  { id: 195, name: 'Thợ Điện Ngầm (The Wireman)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 1800, unlockType: 'SHOP', description: '⚡ **Passive: Đấu Nối Thần Tốc** — Tất cả slot NITROUS được xóa hoàn toàn chỉ số âm Stability (giữ Stability ≥ 0).' },
  { id: 196, name: 'Chiến Binh Đêm (The Night Rider)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 2500, unlockType: 'SHOP', description: '⚡ **Passive: Bóng Đêm Tốc Độ** — Từ Ngày 25 trở đi, mỗi slot TIRE và slot TURBO đều được cộng thêm +15 Power.' },
  { id: 197, name: 'Thầy Phong Thuỷ Xe (The Feng Shui)', type: 'CREW', rarity: 2, statPower: 0, statHeat: 0, statStability: 0, cost: 450, unlockType: 'SHOP', description: '⚡ **Passive: Ngũ Hành Cân Bằng** — Nếu cả 3 slot FILTER + ENGINE + COOLING đều có thẻ cùng độ hiếm (rarity) → cộng thêm +25 Stability tổng xe.' },
  { id: 198, name: 'Kẻ Đào Tẩu (The Fugitive)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '🔒Ẩn (Achievement). ⚡ **Passive: Chạy Trốn** — Bypass hoàn toàn mọi điều kiện đặc biệt của Boss (cấm thẻ, yêu cầu rarity tối thiểu, v.v).' },
  { id: 199, name: 'Linh Hồn Gara (Ghost Mechanic)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '🔒Ẩn (Achievement). ⚡ **Passive: Hồi Sinh** — 1 lần/lượt chạy thử, khi currentHeat vượt 100 (nổ máy), tự động reset Heat về 50 và tiếp tục duyệt slot kế tiếp thay vì kết thúc sớm.' },
  { id: 200, name: 'Chủ Tịch Tập Đoàn (The CEO)', type: 'CREW', rarity: 4, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '🔒Ẩn (Achievement). ⚡ **Passive: Đầu Tư Mạo Hiểm** — Mỗi màn, được mượn miễn phí 1 linh kiện Legendary (5 sao) ngẫu nhiên để dùng. Hết màn trả lại.' },
  { id: 201, name: 'Hacker Mũ Đen (Black-Hat)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '🔒Ẩn (Achievement). ⚡ **Passive: Chỉnh Sửa Mã Nguồn** — Đảo ngược chỉ số Heat ↔ Stability của MỌI thẻ trên xe. (VD: thẻ có 100 Heat + 50 Stability → 50 Heat + 100 Stability)' },
  { id: 202, name: 'Huyền Thoại Giải Nghệ (The Legend)', type: 'CREW', rarity: 5, statPower: 0, statHeat: 0, statStability: 0, cost: 0, unlockType: 'ACHIEVEMENT', description: '🔒Ẩn (Achievement). ⚡ **Passive: Bàn Tay Vàng** — Tự động nâng chỉ số của mọi thẻ Common (★) và Uncommon (★★) lên ngang bằng mức Rare (★★★).' },
];;

  const cards = [];
  for (const data of cardsData) {
    cards.push(await prisma.card.create({ data: data as any }));
  }

  console.log(`✅ Đã tạo ${cards.length} thẻ bài\n`);

  // ============================================================
  // 2. CARD EFFECTS (Hiệu ứng đặc biệt cho thẻ 4-5 sao)
  // ============================================================
  console.log('✨ Tạo hiệu ứng thẻ...');

  await Promise.all([
    // === 1. FILTER EFFECTS ===
    // Hệ Thống Ram Air (rarity 4, index 14)
    prisma.cardEffect.create({
      data: { cardId: 15, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Mát Mẻ: Giảm 10 Heat cho toàn hệ thống.' },
    }),
    // Bộ Gió Big Bore (rarity 4, index 15)
    prisma.cardEffect.create({
      data: { cardId: 16, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 15, description: 'Rộng Mở: +15 Power khi khởi động thử.' },
    }),
    // Hyper-Flow Titanium (rarity 5, index 16)
    prisma.cardEffect.create({
      data: { cardId: 17, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 1.0, description: 'Bão Táp: +1 Power cho mỗi 1 Stability tổng của xe.' }, // Ghi chú: Logic tính cộng đồn cần xử lý ở frontend, ở Ä‘ây set tạm 1.0 hệ số
    }),
    // Quantum Intake (rarity 5, index 17)
    prisma.cardEffect.create({
      data: { cardId: 22, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -0.5, description: 'Đóng Băng: Giảm 50% Heat tỏa ra của Engine.' },
    }),

    // === 2. ENGINE EFFECTS ===
    // Động Cơ Inline-6 2JZ Huyền Thoại (rarity 4, index 33)
    prisma.cardEffect.create({
      data: { cardId: 34, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -15, description: 'Chịu Đựng: Trừ 15 Heat cho mỗi Turbo.' },
    }),
    // V10 5.2L Screamer (rarity 4, index 36)
    prisma.cardEffect.create({
      data: { cardId: 37, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 20, description: 'V10 Screamer: +20 Power khi On-Test.' },
    }),
    // V8 Supercharged (rarity 4, index 37)
    prisma.cardEffect.create({
      data: { cardId: 38, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 30, description: 'V8 Rage: +30 Power khi chạy thử.' },
    }),
    // I4 F1 Turbo-Hybrid 1.6L (rarity 5, index 38)
    prisma.cardEffect.create({
      data: { cardId: 39, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 5, description: 'KERS Hệ Thống - Faster Faster: +5 Power cho mỗi thẻ được quét trước thẻ này. Tối đa 9 stack (+45 Power).' },
    }),
    // Động Cơ Điện Quad-Motor TriMax (rarity 5, index 40)
    prisma.cardEffect.create({
      data: { cardId: 41, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Tương Lai: Tự động x2 Stability của toàn xe.' },
    }),
    // W16 Quad-Turbo (rarity 5, index 41)
    prisma.cardEffect.create({
      data: { cardId: 42, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 50, description: 'W16 Ultimate: +50 Power cực đại!' },
    }),
    prisma.cardEffect.create({
      data: { cardId: 42, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 10, description: 'Kỹ thuật hoàn hảo: +10 Stability.' },
    }),

    // === 3. TURBO EFFECTS ===
    // Turbo Twin-Scroll (rarity 4, index 56)
    prisma.cardEffect.create({
      data: { cardId: 57, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 20, description: 'Phản Xạ Nhanh: +20 Power khi On-test.' },
    }),
    // Supercharger Roots (rarity 4, index 57)
    prisma.cardEffect.create({
      data: { cardId: 58, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 1.5, description: 'Siêu Phàm: x1.5 Power của bản thân nó.' },
    }),
    // Vortex Hố Đen (rarity 5, index 58)
    prisma.cardEffect.create({
      data: { cardId: 59, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0.5, description: 'Hút Cạn: Hút 50% Power Engine đắp vào bản thân, bù lại +30 Heat.' },
    }),
    prisma.cardEffect.create({
      data: { cardId: 59, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 30, description: 'Hút Cạn: Kéo theo mức nhiệt cực đoan!' },
    }),
    // Anti-Lag System (rarity 5, index 59)
    prisma.cardEffect.create({
      data: { cardId: 60, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 50, description: 'Liên Hoàn Nổ: Engine +50 Power!' },
    }),
    // Turbo Titan X (rarity 5, index 60)
    prisma.cardEffect.create({
      data: { cardId: 61, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 30, description: 'Titan Boost: +30 Power khi chạy thử, không tăng Heat.' },
    }),

    // === 4. EXHAUST EFFECTS ===
    // Hệ Thống Side-Exit (rarity 4, index 74)
    prisma.cardEffect.create({
      data: { cardId: 76, effectType: 'BUFF', triggerCondition: 'ADJACENT', targetStat: 'HEAT', effectValue: -10, description: 'Xả Ngang: Trừ 10 Heat cho thẻ phía sau.' },
    }),
    // Catless Downpipe (rarity 4, index 75)
    prisma.cardEffect.create({
      data: { cardId: 77, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -2, description: 'Lan Tỏa: Mỗi linh kiện trên xe được -2 Heat.' },
    }),
    // Ống Xả Titan Racing (rarity 4, index 76)
    prisma.cardEffect.create({
      data: { cardId: 78, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'HEAT', effectValue: -15, description: 'Titan Exhaust: Giảm thêm 15 Heat.' },
    }),
    // Ghost Exhaust (rarity 5, index 77)
    prisma.cardEffect.create({
      data: { cardId: 79, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Tàng Hình: x2 Stability, Bypass mọi luật ngặt nghèo.' },
    }),
    // Plasma Đỏ Lửa (rarity 5, index 78)
    prisma.cardEffect.create({
      data: { cardId: 80, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 2.0, description: 'Cột Lửa: Nhân Ä‘ôi hệ số âm Heat của thẻ thành -60.' },
    }),

    // === 5. COOLING EFFECTS ===
    // Bộ Làm Mát Bằng Cồn Methanol (rarity 4, index 92)
    prisma.cardEffect.create({
      data: { cardId: 93, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 10, description: 'Bốc Hơi Ác Liệt: Thêm 10 Power nhờ nạp khí lạnh.' },
    }),
    // Khí Nito Lỏng Làm Mát Trực Tiếp (rarity 5, index 94)
    prisma.cardEffect.create({
      data: { cardId: 95, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 0, description: 'Deep Freeze: Bypass Boss Heat.' },
    }),
    // Hệ Thống Từ Trường Lượng Tử (rarity 5, index 96)
    prisma.cardEffect.create({
      data: { cardId: 97, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 0, description: 'Không Độ Tuyệt Đối: Ép Heat toàn xe luôn bằng 0.' },
    }),
    // Cryo Cooling System (rarity 5, index 97)
    prisma.cardEffect.create({
      data: { cardId: 98, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Cryo Freeze: Giảm 10 Heat cho toàn bộ xe.' },
    }),

    // === 6. FUEL EFFECTS ===
    // Hỗn Hợp Nitromethane (rarity 4, index 110)
    prisma.cardEffect.create({
      data: { cardId: 111, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 25, description: 'Cháy Kiệt Cực: Nếu ở Slot 1-3, +25 Power. Nếu ở Slot 8-10, +15 Heat thêm.' },
    }),
    // Nhiên Liệu Tên Lửa (rarity 4, index 112)
    prisma.cardEffect.create({
      data: { cardId: 113, effectType: 'DEBUFF', triggerCondition: 'ON_TEST', targetStat: 'HEAT', effectValue: 20, description: 'Rocket Burn: +20 Heat nguy hiểm!' },
    }),
    // Xăng Nhựa Thông Cực Đoan (rarity 5, index 114)
    prisma.cardEffect.create({
      data: { cardId: 115, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 2.0, description: 'Hủy Diệt Đổi Lấy Vinh Quang: Khi Heat > 90%, nổ sức mạnh x2 toàn xe.' },
    }),
    // Hoạt Chất Lõi Mặt Trời (rarity 5, index 115)
    prisma.cardEffect.create({
      data: { cardId: 116, effectType: 'DEBUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0.2, description: 'Mặt Trời Thu Nhỏ: Giảm 80% Stability tổng toàn xe (chỉ giữ lại 20%).' },
    }),

    // === 7. SUSPENSION EFFECTS ===
    // Khí Nén Tự Động Phân Bổ (rarity 4, index 128)
    prisma.cardEffect.create({
      data: { cardId: 129, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Tự Động Định Tuyến: Xóa mọi ảnh hưởng yếu điểm Stability.' },
    }),
    // Treo Thủy Lực Nhảy Múa (rarity 5, index 130)
    prisma.cardEffect.create({
      data: { cardId: 131, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 2.0, description: 'Trình Diễn Thu Hút: Kết thúc màn x2 Gold.' },
    }),
    // Cân Bằng Lực Hấp Dẫn Anti-G (rarity 5, index 132)
    prisma.cardEffect.create({
      data: { cardId: 133, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 1.5, description: 'Khóa Tọa Độ: Stability gốc của thẻ x1.5, không thể cản phá.' },
    }),

    // === 8. TIRE EFFECTS ===
    // Lốp Mùa Đông Đinh Tán (rarity 4, index 145)
    prisma.cardEffect.create({
      data: { cardId: 146, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Băng Giá: Giảm 10 Heat cho xe.' },
    }),
    // Lốp Cao Su Chảy Siêu Bám (rarity 5, index 148)
    prisma.cardEffect.create({
      data: { cardId: 149, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 15, description: 'Đốt Lốp: Thêm 15 Power khi khởi động!' },
    }),
    // Lốp Từ Tính Nam Châm Điện (rarity 5, index 150)
    prisma.cardEffect.create({
      data: { cardId: 151, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 2.0, description: 'Lực Từ Tính: Nhân Ä‘ôi hệ số Stability gốc của toàn xe.' },
    }),

    // === 9. NITROUS EFFECTS ===
    // Bình NOS Sợi Carbon (rarity 4, index 162)
    prisma.cardEffect.create({
      data: { cardId: 163, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Bình Ổn: Loại bỏ chỉ số trừ Stability của bình NOS.' },
    }),
    // NOS Hỗn Hợp Oxy Lỏng (rarity 5, index 165)
    prisma.cardEffect.create({
      data: { cardId: 166, effectType: 'BUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 40, description: 'Xung Lực Vi Dấu: Hút 10 Stability để hóa thành +40 Power.' },
    }),
    // Lõi Phản Vật Chất Xịt Cấp Tốc (rarity 5, index 167)
    prisma.cardEffect.create({
      data: { cardId: 168, effectType: 'DEBUFF', triggerCondition: 'ON_TEST', targetStat: 'POWER', effectValue: 100, description: 'Đỉnh Điểm: Cung cấp +100 Power sức mạnh phá hủy cấp độ rủi ro cực lớn.' },
    }),

    // === 10. TOOL EFFECTS ===
    // Hệ Thống Đo Lường Từ Xa (rarity 4, index 181)
    prisma.cardEffect.create({
      data: { cardId: 182, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 1.15, description: 'Định Giá Dữ Liệu: Hoàn thành màn với thẻ này thưởng +15% Vàng.' },
    }),
    // Hộp Đồ Nghề Dát Vàng (Snap-On) (rarity 5, index 183)
    prisma.cardEffect.create({
      data: { cardId: 183, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 2.0, description: 'Xa Xỉ Phẩm: Hoàn trả hoàn toàn số Gold Ä‘ã mua linh kiện (Bonus x2).' },
    }),
    // Thiết Bị Hack Trụ Trạm (rarity 5, index 184)
    prisma.cardEffect.create({
      data: { cardId: 185, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Cướp Quyền Boss: Bypass mọi luật lệ khắt khe của Boss!' },
    }),

    // === 10. CREW EFFECTS (11 Crew Members) ===
    // Normal Crew Effects - CREW cards have IDs 186-201
    // 186: The Cooler - Giảm 10% Heat cho Turbo
    prisma.cardEffect.create({
      data: { cardId: 186, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: -10, description: 'Giải nhiệt cấp tốc: Giảm 10% Heat cho mọi Turbo.' },
    }),
    // 187: The Flow - Ống xả +15 Power
    prisma.cardEffect.create({
      data: { cardId: 187, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 15, description: 'Luồng khí mượt mà: Ống xả +15 Power, 0 Heat thêm.' },
    }),
    // 188: The Accountant - Hoàn 10% gold
    prisma.cardEffect.create({
      data: { cardId: 188, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 10, description: 'Tối ưu ngân sách: Hoàn trả 10% tiền mua linh kiện.' },
    }),
    // 189: The Stuntman - Ngưỡng nổ +5
    prisma.cardEffect.create({
      data: { cardId: 189, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 5, description: 'Kiểm soát giới hạn: Ngưỡng nổ +5 (từ 100 lên 105).' },
    }),
    // 190: The Artist - +15% gold tip
    prisma.cardEffect.create({
      data: { cardId: 190, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'GOLD', effectValue: 15, description: 'Vẻ ngoài hào nhoáng: +15% tiền tip ngẫu nhiên.' },
    }),
    // 191: The Grip - +20 Stability nếu Power > 400
    prisma.cardEffect.create({
      data: { cardId: 191, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 20, description: 'Bám đường tuyệt đối: +20 Stability cho xe > 400 HP.' },
    }),
    // 192: The Fuel Doctor - Slot FUEL x2 Power, x1.5 Heat
    prisma.cardEffect.create({
      data: { cardId: 192, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 2.0, description: 'Pha Chế Hoàn Hảo: Slot FUEL x2 Power, nhưng Heat x1.5.' },
    }),
    // 193: The Welder - Slot EXHAUST +10 Stability
    prisma.cardEffect.create({
      data: { cardId: 193, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 10, description: 'Mối Hàn Hoàn Hảo: Slot EXHAUST +10 Stability.' },
    }),
    // 194: The Wireman - Slot NITROUS xoá trừ Stability
    prisma.cardEffect.create({
      data: { cardId: 194, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 0, description: 'Đấu Nối Thần Tốc: Slot NITROUS không trừ Stability.' },
    }),
    // 195: The Night Rider - Ngày 25+: TIRE & TURBO +15 Power
    prisma.cardEffect.create({
      data: { cardId: 195, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 15, description: 'Bóng Đêm Tốc Độ: Từ Ngày 25, TIRE & TURBO +15 Power mỗi slot.' },
    }),
    // 196: The Feng Shui - FILTER+ENGINE+COOLING cùng rarity → +25 Stability
    prisma.cardEffect.create({
      data: { cardId: 196, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'STABILITY', effectValue: 25, description: 'Ngũ Hành Cân Bằng: FILTER+ENGINE+COOLING cùng sao → +25 Stability.' },
    }),

    // Hidden Crew Effects (Achievement unlocks)
    // 197: The Fugitive - Bypass Boss conditions
    prisma.cardEffect.create({
      data: { cardId: 197, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Chạy trốn: Bypass mọi điều kiện Boss.' },
    }),
    // 198: Ghost Mechanic - 1x cứu nổ
    prisma.cardEffect.create({
      data: { cardId: 198, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT', effectValue: 50, description: 'Hồi sinh: Khi Heat >= 100 (nổ máy), reset Heat về 50 và tiếp tục duyệt slot kế tiếp. Chỉ 1 lần/lượt chạy thử.' },
    }),
    // 199: The CEO - Mượn 1 Legendary
    prisma.cardEffect.create({
      data: { cardId: 199, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Đầu tư mạo hiểm: Mượn 1 Legendary miễn phí.' },
    }),
    // 200: Black-Hat - Đảo ngược Heat ↔ Stability
    prisma.cardEffect.create({
      data: { cardId: 200, effectType: 'UTILITY', triggerCondition: 'PASSIVE', targetStat: 'HEAT_STABILITY_SWAP', effectValue: 1, description: 'Chỉnh sửa mã nguồn: Đảo ngược chỉ số Heat ↔ Stability của mọi thẻ trên xe.' },
    }),
    // 201: The Legend - Common/Uncommon → Rare stats
    prisma.cardEffect.create({
      data: { cardId: 201, effectType: 'BUFF', triggerCondition: 'PASSIVE', targetStat: 'POWER', effectValue: 0, description: 'Bàn tay vàng: Common/Uncommon nâng chỉ số thành Rare.' },
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
      data: { cardId1: 1, cardId2: 28, effectType: 'BONUS_POWER', effectValue: 20, name: '⚡ Tăng Áp Hiệu Quả', description: 'Turbo hút gió sạch từ bộ lọc Performance, +20 Power mà không tăng Heat từ turbo.' },
    }),
    // 2. Turbo Tăng Áp Đôi (55) + Ống Xả Titan Racing (76)
    prisma.cardCombo.create({
      data: { cardId1: 56, cardId2: 78, effectType: 'POWER_TO_STABILITY', effectValue: 0.05, name: '💨 Thoát Khí Tự Do', description: 'Mỗi 100 Power tạo ra sẽ tự động cộng thêm 5 Stability - áp suất khí xả được giải phóng hoàn hảo.' },
    }),
    // 3. Lọc Gió Carbon Fiber (13) + Turbo Titan X (60)
    prisma.cardCombo.create({
      data: { cardId1: 14, cardId2: 61, effectType: 'MULTIPLY_POWER', effectValue: 2.5, name: '🌪️ Cơn Lốc Carbon', description: 'Sợi carbon siêu nhẹ + turbo huyền thoại tạo cơn lốc không khí, x2.5 Power turbo!' },
    }),
    // 4. V8 Supercharged (37) + Cryo Cooling System (97)
    prisma.cardCombo.create({
      data: { cardId1: 38, cardId2: 98, effectType: 'NEGATE_HEAT', effectValue: 1.0, name: '❄️ Quái Thú Băng Giá', description: 'Cryo Ä‘óng băng hoàn toàn V8! Xóa toàn bộ Heat của V8 Supercharged.' },
    }),
    // 5. W16 Quad-Turbo (41) + Nhiên Liệu Tên Lửa (112)
    prisma.cardCombo.create({
      data: { cardId1: 42, cardId2: 113, effectType: 'MULTIPLY_POWER', effectValue: 3.0, name: '🚀 Ngày Tận Thế', description: 'W16 + Nhiên liệu Tên Lửa = sức mạnh x3! Nhưng Heat cũng tăng x1.5 - cẩn thận!' },
    }),
    // 6. V6 Twin-Turbo (32) + Xăng Racing 100 (108)
    prisma.cardCombo.create({
      data: { cardId1: 33, cardId2: 109, effectType: 'REDUCE_HEAT', effectValue: 0.6, name: '🔥 Cháy Sạch Hoàn Hảo', description: 'Xăng Racing cao cấp + V6 = cháy sạch hoàn toàn, giảm 40% Heat từ engine.' },
    }),
    // 7. NOS Mega (164) + Ống Xả Performance (70)
    prisma.cardCombo.create({
      data: { cardId1: 165, cardId2: 71, effectType: 'BONUS_POWER', effectValue: 35, name: '💥 Sóng Xung Kích', description: 'NOS phun ngược qua ống xả tạo sóng xung kích cực mạnh, +35 Power bùng nổ!' },
    }),
    // 8. NOS Nhỏ (158) + Xăng RON 95 (101)
    prisma.cardCombo.create({
      data: { cardId1: 159, cardId2: 102, effectType: 'BONUS_POWER', effectValue: 15, name: '🎆 Pháo Hoa Đường Phố', description: 'NOS nhỏ + RON 95 tạo hiệu ứng pháo hoa ngoạn mục, +15 Power thêm.' },
    }),
    // 9. Intercooler Carbon (90) + Turbo Nhỏ (47)
    prisma.cardCombo.create({
      data: { cardId1: 91, cardId2: 48, effectType: 'REDUCE_HEAT', effectValue: 0.3, name: '🧊 Turbo Lạnh', description: 'Intercooler carbon giữ turbo mát lạnh, giảm 70% Heat từ turbo nhỏ.' },
    }),
    // 10. Két Nước Racing (86) + Động Cơ 1.5L (22)
    prisma.cardCombo.create({
      data: { cardId1: 87, cardId2: 23, effectType: 'BONUS_STABILITY', effectValue: 12, name: '🌊 Dòng Chảy Hoàn Hảo', description: 'Két nước cỡ lớn + động cơ nhỏ gọn = hệ thống làm mát hoàn hảo, +12 Stability.' },
    }),
    // 11. Coilover Racing (126) + Lốp Racing Slick (147)
    prisma.cardCombo.create({
      data: { cardId1: 127, cardId2: 148, effectType: 'MULTIPLY_STABILITY', effectValue: 1.5, name: '🏎️ Bám Đường Tuyệt Đối', description: 'Hệ thống treo racing + lốp slick chuyên nghiệp = x1.5 tổng Stability.' },
    }),
    // 12. Giảm Xóc Cơ Bản (119) + Lốp Semi-Slick (140)
    prisma.cardCombo.create({
      data: { cardId1: 120, cardId2: 141, effectType: 'BONUS_STABILITY', effectValue: 10, name: '🛞 Cân Bằng Đường Phố', description: 'Setup đường phố cân bằng và Ä‘áng tin cậy, +10 Stability.' },
    }),
    // 13. Máy Chẩn Đoán OBD2 (175) + V8 Supercharged (37)
    prisma.cardCombo.create({
      data: { cardId1: 176, cardId2: 38, effectType: 'REDUCE_HEAT', effectValue: 0.7, name: '🔧 Tinh Chỉnh Quái Thú', description: 'OBD2 tối ưu thông số V8, giảm 30% Heat nhờ chạy Ä‘úng hiệu suất tối ưu.' },
    }),
    // 14. Bộ Cờ Lê (171) + Quạt Làm Mát (82)
    prisma.cardCombo.create({
      data: { cardId1: 172, cardId2: 83, effectType: 'BONUS_STABILITY', effectValue: 8, name: '🛠️ Thợ Máy Chăm Chỉ', description: 'Lắp ráp cẩn thận với cờ lê + quạt mát chạy ổn định = +8 Stability.' },
    }),
    // 15. Nhiên Liệu Tên Lửa (112) + NOS Mega (164)
    prisma.cardCombo.create({
      data: { cardId1: 113, cardId2: 165, effectType: 'MULTIPLY_POWER', effectValue: 2.0, name: '☠️ Canh Bạc Tử Thần', description: 'ALL IN! x2 Power tổng nhưng Heat cũng x2 - chỉ dành cho kẻ liều mạng!' },
    }),
    // 16. Lốp Đường Phố (136) + Quạt Làm Mát (82)
    prisma.cardCombo.create({
      data: { cardId1: 137, cardId2: 83, effectType: 'BONUS_STABILITY', effectValue: 15, name: '🌆 Xe Hàng Ngày Tin Cậy', description: 'Setup daily-driver hoàn hảo cho xe hàng ngày, +15 Stability.' },
    }),

    // ========== COMBO CREW ==========

    // 17. Kỹ Sư Nhiệt (187) + Intercooler Carbon (91)
    prisma.cardCombo.create({
      data: { cardId1: 187, cardId2: 91, effectType: 'REDUCE_HEAT', effectValue: 0.5, name: '🧪 Phòng Thí Nghiệm Lạnh', description: 'Kỹ sư nhiệt vận hành Intercooler ở hiệu suất tối đa, giảm 50% tổng Heat!' },
    }),
    // 18. Chuyên Gia Ống Xả (188) + Ống Xả Titan Racing (78)
    prisma.cardCombo.create({
      data: { cardId1: 188, cardId2: 78, effectType: 'BONUS_POWER', effectValue: 30, name: '🎵 Bản Giao Hưởng Titan', description: 'Chuyên gia tinh chỉnh ống xả Titan đạt âm thanh hoàn hảo, +30 Power.' },
    }),
    // 19. Tay Lái Thử (190) + NOS Mega (164)
    prisma.cardCombo.create({
      data: { cardId1: 190, cardId2: 164, effectType: 'REDUCE_HEAT', effectValue: 0.8, name: '🎯 Drift Tử Thần', description: 'Tay lái kiểm soát NOS bằng kỹ năng drift, giảm 20% Heat từ NOS.' },
    }),
    // 20. Kế Toán Trưởng (189) + Bộ Cờ Lê (173)
    prisma.cardCombo.create({
      data: { cardId1: 189, cardId2: 173, effectType: 'BONUS_GOLD', effectValue: 20, name: '💰 Tiết Kiệm Là Làm Giàu', description: 'Kế toán tối ưu chi phí công cụ, +20% Gold thưởng mỗi màn thắng.' },
    }),
    // 21. Chuyên Gia Lốp (192) + Lốp Racing Slick (148)
    prisma.cardCombo.create({
      data: { cardId1: 192, cardId2: 148, effectType: 'MULTIPLY_STABILITY', effectValue: 2.0, name: '🏆 Vua Đường Đua', description: 'Chuyên gia lốp + slick chuyên nghiệp = x2 Stability từ lốp!' },
    }),
    // 22. Huyền Thoại Giải Nghệ (202) + W16 Quad-Turbo (42)
    prisma.cardCombo.create({
      data: { cardId1: 202, cardId2: 42, effectType: 'MULTIPLY_POWER', effectValue: 1.5, name: '👑 Bàn Tay Vàng W16', description: 'Huyền thoại chạm vào W16, mọi stat của W16 được nhân x1.5!' },
    }),
    // 23. Ghost Mechanic (199) + Cryo Cooling System (98)
    prisma.cardCombo.create({
      data: { cardId1: 199, cardId2: 98, effectType: 'NEGATE_HEAT', effectValue: 0.5, name: '👻 Linh Hồn Đông Lạnh', description: 'Linh hồn gara + Cryo = xóa 50% tổng Heat toàn bộ xe.' },
    }),
    // 24. Hacker Mũ Đen (201) + Máy Chẩn Đoán OBD2 (177)
    prisma.cardCombo.create({
      data: { cardId1: 201, cardId2: 177, effectType: 'BONUS_POWER', effectValue: 25, name: '💻 Hack Hệ Thống', description: 'Hack OBD2 → overclock toàn bộ hệ thống xe, +25 Power.' },
    }),
    // 25. Thợ Sơn (191) + Lốp Semi-Slick (141)
    prisma.cardCombo.create({
      data: { cardId1: 191, cardId2: 141, effectType: 'BONUS_GOLD', effectValue: 15, name: '🎨 Show Car', description: 'Xe đẹp + lốp đẹp = khách hàng mê mẩn, +15% Gold thêm.' },
    }),

    // ========== NEW POWER-GIVING COMBOS (12 new combos) ==========

    // 26. Lọc Gió Cotton (7) + Quạt Làm Mát (83)
    prisma.cardCombo.create({
      data: { cardId1: 7, cardId2: 83, effectType: 'BONUS_POWER', effectValue: 18, name: '🌬️ Gió Mát Tươi', description: 'Lọc gió cotton + quạt mát = luồng khí mát lạnh, +18 Power.' },
    }),
    // 27. Ống Xả Inox 304 (67) + Coilover Racing (127)
    prisma.cardCombo.create({
      data: { cardId1: 67, cardId2: 127, effectType: 'BONUS_POWER', effectValue: 22, name: '🔧 Setup Racing Cơ Bản', description: 'Ống xả inox + coilover racing = setup đua cơ bản, +22 Power.' },
    }),
    // 28. Lốp All-Season Bền (140) + Bộ Cờ Lê (172)
    prisma.cardCombo.create({
      data: { cardId1: 140, cardId2: 172, effectType: 'BONUS_POWER', effectValue: 15, name: '🛠️ Xe Bền Bỉ', description: 'Lốp bền + cờ lê = lắp ráp chắc chắn, +15 Power.' },
    }),
    // 29. NOS Nhỏ (159) + Xăng RON 97 (106)
    prisma.cardCombo.create({
      data: { cardId1: 159, cardId2: 106, effectType: 'BONUS_POWER', effectValue: 25, name: '⚡ Tăng Tốc Nhanh', description: 'NOS nhỏ + xăng RON 97 = tăng tốc tức thì, +25 Power.' },
    }),
    // 30. Két Nước Racing (87) + Phuộc Offroad Giảm Lực (126)
    prisma.cardCombo.create({
      data: { cardId1: 87, cardId2: 126, effectType: 'BONUS_POWER', effectValue: 20, name: '🏔️ Offroad Power', description: 'Két nước racing + phuộc offroad = sức mạnh offroad, +20 Power.' },
    }),
    // 31. Lọc Gió Hình Nón (8) + Lốp Địa Hình Cũ (138)
    prisma.cardCombo.create({
      data: { cardId1: 8, cardId2: 138, effectType: 'BONUS_POWER', effectValue: 16, name: '🏞️ Explorer Power', description: 'Lọc gió hình nón + lốp địa hình = sức mạnh khám phá, +16 Power.' },
    }),
    // 32. Ống Xả Cat-back (68) + Intercooler Carbon (91)
    prisma.cardCombo.create({
      data: { cardId1: 68, cardId2: 91, effectType: 'BONUS_POWER', effectValue: 24, name: '❄️ Xả Lạnh Carbon', description: 'Ống xả cat-back + intercooler carbon = xả lạnh hiệu quả, +24 Power.' },
    }),
    // 33. Giảm Xóc Dầu Kép (122) + Lốp Track-Day Bán Chuyên (145)
    prisma.cardCombo.create({
      data: { cardId1: 122, cardId2: 145, effectType: 'BONUS_POWER', effectValue: 28, name: '🏁 Track Day Ready', description: 'Giảm xóc dầu kép + lốp track-day = sẵn sàng đua, +28 Power.' },
    }),
    // 34. Súng Đo Nhiệt (179) + Lọc Gió Màng Dầu (10)
    prisma.cardCombo.create({
      data: { cardId1: 179, cardId2: 10, effectType: 'BONUS_POWER', effectValue: 17, name: '🌡️ Tinh Chỉnh Nhiệt', description: 'Súng đo nhiệt + lọc gió màng dầu = tinh chỉnh nhiệt độ, +17 Power.' },
    }),
    // 35. Nước Làm Mát Ngoại Cỡ (92) + Xăng Sinh Học E5 (104)
    prisma.cardCombo.create({
      data: { cardId1: 92, cardId2: 104, effectType: 'BONUS_POWER', effectValue: 19, name: '🌱 Eco Power', description: 'Nước làm mát ngoại cỡ + xăng sinh học = sức mạnh eco, +19 Power.' },
    }),
    // 36. Header Thép Cuộn (70) + Lốp Mùa Đông Đinh Tán (146)
    prisma.cardCombo.create({
      data: { cardId1: 70, cardId2: 146, effectType: 'BONUS_POWER', effectValue: 21, name: '❄️ Winter Power', description: 'Header thép cuộn + lốp mùa đông = sức mạnh mùa đông, +21 Power.' },
    }),
    // 37. Lọc Gió Hộp Kín (9) + Khí Nén Tự Động Phân Bổ (129)
    prisma.cardCombo.create({
      data: { cardId1: 9, cardId2: 129, effectType: 'BONUS_POWER', effectValue: 23, name: '⚖️ Cân Bằng Hoàn Hảo', description: 'Lọc gió hộp kín + khí nén tự động = cân bằng hoàn hảo, +23 Power.' },
    }),
  ]);

  console.log('✅ Đã tạo 37 combos\n');

  // ============================================================
  // 4. BOSS CONFIGS (10+ Bosses)
  // ============================================================
  console.log('👹 Tạo Boss configs...');

  await Promise.all([
    prisma.bossConfig.create({
      data: { name: 'Ông Hoàng Drift', description: '"Nghệ thuật Drift! Cấm dùng phuộc xịn (SUSPENSION ≥ 3★). Tổng Stability cuối cùng ≥ 50!"', specialCondition: 'DRIFT_KING_CHALLENGE', requiredPower: 350, rewardGold: 2200 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Đảo Chủ EP', description: '"Có đồng ý lên đảo của ta tham gia cuộc thi không?"', specialCondition: 'EP_ISLAND_CHOICE', requiredPower: 467, rewardGold: 3333 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Nhà Sưu Tập', description: '"Chỉ dùng thẻ 3 sao trở lên thôi nhé!"', specialCondition: 'MIN_RARITY_3', requiredPower: 400, rewardGold: 2900 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Chủ Tịch Kim', description: '"Gia nhập triều tiên ko?"', specialCondition: 'KIM_JONG_UN', requiredPower: 365, rewardGold: 3500 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Cô Gái Liều Lĩnh', description: '"Đạp lút ga! Heat cuối cùng phải sát ngưỡng nổ (≥ 75%)!"', specialCondition: 'DAREDEVIL_DEATH_WISH', requiredPower: 325, rewardGold: 2700 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Đỗ Nam Trung', description: '"Make Garage Great Again! Mọi thẻ 5* đều bị khóa!"', specialCondition: 'DONALD_TRUMP', requiredPower: 470, rewardGold: 4700 },
    }),

    prisma.bossConfig.create({
      data: { name: 'Huyền Thoại F1', description: '"Chỉ có thể dùng Engine và Turbo. No Cooling!"', specialCondition: 'NO_COOLING', requiredPower: 400, rewardGold: 2800 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Kẻ Bí Ẩn', description: '"..."', specialCondition: null, requiredPower: 666, rewardGold: 5500 },
    }),
    prisma.bossConfig.create({
      data: { name: 'Chúa Tể Dầu Em Bé', description: '"DO YOU LOVE ME??!?"', specialCondition: 'BABY_OIL_CHOICE', requiredPower: 369, rewardGold: 3700 },
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
      data: { name: 'Tay Buôn Lậu Gõ Cửa', description: 'EVENT: Smuggler appears. CHOICE: Accept = buy rare parts cheap (-5 reputation/item) OR sell cards for 50% value. REFUSE: -10 reputation and -15% gold reward next day.', type: 'CHOICE', targetAttribute: 'GARAGE_HEALTH', effectValue: -10, probability: 0.3 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Ánh Trăng Racing', description: 'EVENT: Underground racing team challenges you. CHOICE: Accept = pay 15 reputation to race, win 800 gold betting. REFUSE: nothing happens.', type: 'CHOICE', targetAttribute: 'GOLD', effectValue: 800, probability: 0.15 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Băng Đảng Xăng Dầu', description: 'EVENT: Fuel gang controls prices. PASSIVE: Lose 10% of current gold as "protection fee". No choice - automatic penalty.', type: 'PASSIVE', targetAttribute: 'GOLD_PERCENTAGE', effectValue: -0.10, probability: 0.15 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Độ Channel Bốc Phốt', description: 'EVENT: Famous YouTuber livestreams your garage. PASSIVE: +40 reputation, but pay 200 gold for PR promotion. No choice - automatic effect.', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 40, probability: 0.1 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Đấu Giá Kho Xưởng', description: 'EVENT: Bank liquidates old JDM warehouse. CHOICE: Bet 700 gold blind auction. WIN: Receive 400 Tech Points from scrap materials. LOSE: Lose 700 gold.', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 400, probability: 0.1 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Kẻ Chế Tạo Cuồng Tín', description: 'EVENT: Mad engineer offers forbidden blueprints. CHOICE: Accept = gain 400 Tech Points (fast level up), lose 20 reputation (dangerous reputation). REFUSE: nothing happens.', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 400, probability: 0.1 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Cảnh Sát Đột Kích', description: 'EVENT: Police raid your illegal workshop. PASSIVE: Lose 150 gold fine and -10 reputation (public shaming). No choice - automatic penalty.', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: -10, probability: 0.15 },
    }),
    
    // North Korea Events (only spawn when isInNorthKorea = true)
    prisma.gameEvent.create({
      data: { name: 'Camera Ngoại Bang', description: 'EVENT (NK only): Spy with camera detected! CHOICE: Report him = gain +1000 gold reward and reputation. REFUSE: nothing happens. High probability in NK.', type: 'CHOICE', targetAttribute: 'GOLD', effectValue: 1000, probability: 0.4 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Kiểm Tra Ảnh Cán Bộ', description: 'EVENT (NK only): Inspection team checks if Chairman portrait is displayed. PASSIVE: If reputation is low, bad luck may occur. No choice - automatic check.', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 0, probability: 0.5 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Sát Thủ Gọi Mời', description: 'EVENT (NK only): Assassin asks you to help kill Chairman Kim. CHOICE: Accept = dangerous assassination mission (success rate depends on low reputation). REFUSE: nothing happens. Spawns 100% at day 10 in NK.', type: 'CHOICE', targetAttribute: 'TECH_POINTS', effectValue: 0, probability: 0 },
    }),
    prisma.gameEvent.create({
      data: { name: 'Cảnh Sát Triều Tiên', description: 'EVENT (NK only): NK police inspection. PASSIVE: If you traded with smuggler yesterday, heavy penalty. No choice - automatic check.', type: 'PASSIVE', targetAttribute: 'GARAGE_HEALTH', effectValue: 0, probability: 0.1 },
    }),
  ]);

  console.log('✅ Đã tạo 11 game events\n');

  // ============================================================
  // 6. ENDINGS (Đa kết cục)
  // ============================================================
  console.log('🏆 Tạo endings...');

  await Promise.all([
    prisma.ending.create({
      data: { name: 'Wasted Potential', type: 'STANDARD', description: 'Kẻ Vứt Đi - Uy tín tụt về 0. Gara Ä‘óng cửa, giấc mơ tan vỡ. Bạn Ä‘ã thất bại...' },
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
      data: { name: 'The Missing Percent', type: 'FINAL', description: 'Thiếu Đi Một Chút - Gần đạt được vinh quang tuyệt đối... nhưng một Boss Ä‘ã hạ gục bạn.' },
    }),
    prisma.ending.create({
      data: { name: 'Bị Tiêu Diệt Bởi Chủ Tịch', type: 'BAD', description: 'Bạn Ä‘ã dám chọc giận hoặc làm trái ý Chủ Tịch. Kết cục không thể tránh khỏi.' },
    }),
    prisma.ending.create({
      data: { name: 'Bị Sát Thủ Tiêu Diệt', type: 'BAD', description: 'Từ chối hoặc thất bại trong vụ ám sát. Tổ chức ngầm Ä‘ã kết liễu bạn.' },
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
      data: { minLevel: 1, maxLevel: 3, minPowerReq: 75, maxPowerReq: 125, minGoldReward: 200, maxGoldReward: 300, minCustomers: 1, maxCustomers: 3 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 4, maxLevel: 7, minPowerReq: 125, maxPowerReq: 180, minGoldReward: 400, maxGoldReward: 600, minCustomers: 2, maxCustomers: 4 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 8, maxLevel: 12, minPowerReq: 180, maxPowerReq: 300, minGoldReward: 800, maxGoldReward: 1200, minCustomers: 3, maxCustomers: 5 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 13, maxLevel: 20, minPowerReq: 250, maxPowerReq: 350, minGoldReward: 1300, maxGoldReward: 1800, minCustomers: 3, maxCustomers: 6 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 21, maxLevel: 30, minPowerReq: 300, maxPowerReq: 380, minGoldReward: 1500, maxGoldReward: 2500, minCustomers: 3, maxCustomers: 6 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 31, maxLevel: 40, minPowerReq: 300, maxPowerReq: 400, minGoldReward: 1500, maxGoldReward: 3500, minCustomers: 3, maxCustomers: 7 },
    }),
    prisma.questConfig.create({
      data: { minLevel: 41, maxLevel: 99, minPowerReq: 350, maxPowerReq: 400, minGoldReward: 2000, maxGoldReward: 5000, minCustomers: 3, maxCustomers: 8 },
    }),
  ]);

  console.log('✅ Đã tạo quest configs\n');

  // ============================================================
  // 8. LEVEL REWARDS (Quà thăng cấp)
  // ============================================================
  console.log('🎁 Tạo level rewards...');

  await Promise.all([
    prisma.levelReward.create({ data: { level: 2, cardId: 18, quantity: 2 } }),  // Lv2: 2x Động Cơ 1.5L -> Động Cơ Xe Máy 50cc (đổi item 1 chút để logic khớp - 18)
    prisma.levelReward.create({ data: { level: 3, cardId: 66, quantity: 2 } }), // Lv3: 2x Ống Xả Tiêu Chuẩn (65)
    prisma.levelReward.create({ data: { level: 5, cardId: 28, quantity: 1 } }),  // Lv5: 1x Động Cơ 2.0L Turbo (27)
    prisma.levelReward.create({ data: { level: 7, cardId: 56, quantity: 1 } }), // Lv7: 1x Turbo Tăng Áp Đôi (55)
    prisma.levelReward.create({ data: { level: 10, cardId: 78, quantity: 1 } }), // Lv10: 1x Ống Xả Titan Racing (76)
    prisma.levelReward.create({ data: { level: 15, cardId: 38, quantity: 1 } }), // Lv15: 1x V8 Supercharged (37)
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
        rewardCrewId: 192, // The Fugitive (191)
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
        rewardCrewId: 186, // Ghost Mechanic (192)
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
        rewardCrewId: 187, // The CEO (193)
        isHidden: true,
      },
    }),
    prisma.achievement.create({
      data: {
        code: 'MIDNIGHT_HACKER',
        name: 'Hacker Nửa Đêm',
        description: 'Nhấn vào đồng hồ trong gara 13 lần vào lúc nửa Ä‘êm.',
        conditionType: 'SECRET_CLOCK',
        conditionValue: 13,
        rewardCrewId: 189, // Black-Hat (194)
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
        rewardCrewId: 188, // The Legend (195)
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
      data: { code: 'CONNECTIONS', name: '👥 Mối Quan Hệ', description: '+1 Crew Slot khi bắt đầu run (cộng dồn với slot Ä‘ã mở khóa vĩnh viễn).', effectType: 'CREW_SLOT', effectValue: 1, unlockCondition: 'OWN_8_CREW', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'VIP_CARD', name: '🏷️ Thẻ VIP Cửa Hàng', description: 'Shop giảm giá 20% trong 10 ngày đầu. Khách VIP luôn được ưu Ä‘ãi!', effectType: 'SHOP_DISCOUNT', effectValue: 0.2, unlockCondition: 'TOTAL_SHOP_SPENT_10000', isDefault: false },
    }),
    prisma.starterPerk.create({
      data: { code: 'TECH_GENIUS', name: '⚙️ Thiên Tài Cơ Khí', description: '+100 Tech Points khi bắt đầu. Kinh nghiệm từ runs trước biến thành lợi thế!', effectType: 'TECH_POINTS', effectValue: 100, unlockCondition: 'REACH_LEVEL_10', isDefault: false },
    }),
  ]);

  console.log('✅ Đã tạo 6 starter perks\n');

  console.log('🎉 SEED HOÀN TẤT! SB-GARAGE sẵn sàng hoạt động!');
  console.log('📊 Tổng kết:');

  console.log(`   - ${cards.length} thẻ bài (185 linh kiện + 6 crew thường + 5 crew ẩn)`);
  console.log(`   - 34 hiệu ứng đặc biệt (23 linh kiện + 11 crew)`);
  console.log(`   - 25 combos`);
  console.log(`   - 12 Boss configs`);
  console.log(`   - 7 game events`);
  console.log(`   - 6 endings`);
  console.log(`   - 4 quest configs`);
  console.log(`   - 6 level rewards`);
  console.log(`   - 5 achievements (crew ẩn)`);

  // Reset PostgreSQL sequences sau khi seed với ID cố định
  console.log('\n🔄 Reset PostgreSQL sequences...');
  const sequences = [
    { table: 'users', seq: 'users_id_seq' },
    { table: 'user_inventory', seq: 'user_inventory_id_seq' },
    { table: 'daily_quests', seq: 'daily_quests_id_seq' },
    { table: 'user_active_events', seq: 'user_active_events_id_seq' },
    { table: 'user_endings', seq: 'user_endings_id_seq' },
    { table: 'cards', seq: 'cards_id_seq' },
    { table: 'card_effects', seq: 'card_effects_id_seq' },
    { table: 'card_combos', seq: 'card_combos_id_seq' },
    { table: 'boss_configs', seq: 'boss_configs_id_seq' },
    { table: 'game_events', seq: 'game_events_id_seq' },
    { table: 'endings', seq: 'endings_id_seq' },
    { table: 'quest_configs', seq: 'quest_configs_id_seq' },
    { table: 'level_rewards', seq: 'level_rewards_id_seq' },
    { table: 'achievements', seq: 'achievements_id_seq' },
    { table: 'user_achievements', seq: 'user_achievements_id_seq' },
    { table: 'starter_perks', seq: 'starter_perks_id_seq' },
  ];
  for (const { table, seq } of sequences) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1));`
    );
  }
  console.log('✅ Đã reset tất cả sequences\n');
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

