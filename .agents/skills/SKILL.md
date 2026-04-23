---
name: SB-GARAGE Game Bible
description: Tổng hợp toàn bộ nội dung, cơ chế, cách hoạt động, tiến trình game SB-GARAGE
---

# SB-GARAGE — Game Bible (Tài Liệu Toàn Diện)

> **SB-GARAGE** là game quản lý garage sửa xe theo lượt (turn-based), nơi người chơi lắp ráp linh kiện lên khung xe 10 slot, hoàn thành quest cho khách hàng, đối mặt với Boss, sống sót qua 50 ngày để mở kết cục. Xây dựng trên **Next.js + Prisma + MySQL**.

---

## 📋 MỤC LỤC

1. [Vòng Lặp Game Chính (Core Game Loop)](#1-vòng-lặp-game-chính)
2. [Hệ Thống Thẻ Bài (Card System)](#2-hệ-thống-thẻ-bài)
3. [Workshop — Chạy Thử Xe (Core Gameplay)](#3-workshop--chạy-thử-xe)
4. [Hệ Thống Quest & Khách Hàng](#4-hệ-thống-quest--khách-hàng)
5. [Hệ Thống Boss](#5-hệ-thống-boss)
6. [Shop & Kinh Tế](#6-shop--kinh-tế)
7. [Hệ Thống Sự Kiện Ngẫu Nhiên](#7-hệ-thống-sự-kiện-ngẫu-nhiên)
8. [Tuyến Truyện Triều Tiên (North Korea Storyline)](#8-tuyến-truyện-triều-tiên)
9. [Crew — Đội Ngũ](#9-crew--đội-ngũ)
10. [Combo — Phản Ứng Dây Chuyền](#10-combo--phản-ứng-dây-chuyền)
11. [Hệ Thống Nâng Cấp & Tiến Trình](#11-hệ-thống-nâng-cấp--tiến-trình)
12. [Hệ Thống Kết Cục (Endings)](#12-hệ-thống-kết-cục)
13. [Thành Tựu Ẩn (Hidden Achievements)](#13-thành-tựu-ẩn)
14. [Hằng Số Game (Game Constants)](#14-hằng-số-game)
15. [Kiến Trúc Kỹ Thuật (Technical Architecture)](#15-kiến-trúc-kỹ-thuật)

---

## 1. Vòng Lặp Game Chính

```
┌─────────────────────────────────────────────────────────────┐
│                     MỖI NGÀY (1 Turn)                       │
│                                                             │
│  1. Bắt đầu ngày → POST /api/quest/daily (sinh quest)      │
│  2. Sự kiện ngẫu nhiên → GET /api/events/random             │
│  3. Vào Shop mua thẻ/pack → GET/POST /api/shop/items        │
│  4. Lắp xe + Chạy thử → POST /api/workshop/test             │
│  5. Xác nhận kết quả → POST /api/quest/[id]/complete        │
│  6. Lặp lại bước 4-5 cho mỗi khách hàng                    │
│  7. Kết thúc ngày → POST /api/game/end-day                  │
│     - Trừ uy tín quest pending                               │
│     - Giảm lượt sự kiện active                               │
│     - Cộng Tech Points                                       │
│     - Check level up                                         │
│  8. Kiểm tra kết cục (Ngày 50 hoặc uy tín = 0)             │
│                                                             │
│  Lặp lại 50 ngày → Good Ending hoặc Final Round            │
└─────────────────────────────────────────────────────────────┘
```

### Tiến trình theo ngày:

| Giai đoạn       | Ngày | Đặc điểm                                      |
| --------------- | ---- | --------------------------------------------- |
| **Ngày đầu**    | 1–5  | Số khách cố định (1→4), không có Boss         |
| **Phát triển**  | 6–49 | Số khách random theo level, Boss mỗi 5 ngày   |
| **Kết thúc**    | 50   | Ngày cuối → Good Ending hoặc chọn Final Round |
| **Final Round** | 51   | 10 Boss liên tiếp, thưởng x2                  |

---

## 2. Hệ Thống Thẻ Bài

### 2.1 Phân loại thẻ — 11 CardType

| Type         | Tên Việt      | Vai trò chính                          | Số thẻ |
| ------------ | ------------- | -------------------------------------- | ------ |
| `ENGINE`     | Động cơ       | Power cao, Heat cao                    | 25     |
| `TURBO`      | Tăng áp       | Power + Heat cực đoan                  | 18     |
| `EXHAUST`    | Ống xả        | Power nhẹ, **Heat âm** (giảm nhiệt)    | 18     |
| `COOLING`    | Làm mát       | Heat âm mạnh, Stability cao            | 19     |
| `FILTER`     | Lọc gió       | Power + Stability cân bằng             | 18     |
| `FUEL`       | Nhiên liệu    | Power cao, Heat + Stability rủi ro     | 18     |
| `SUSPENSION` | Hệ thống treo | Stability rất cao, ít Power            | 17     |
| `TIRE`       | Lốp xe        | Stability chính, ít Heat               | 18     |
| `NITROUS`    | NOS           | Power bùng nổ, Heat cao, trừ Stability | 17     |
| `TOOL`       | Dụng cụ       | Utility đa dạng                        | 17     |
| `CREW`       | Đội ngũ       | Buff passive, không lắp lên xe         | 16     |

**Tổng: 201 thẻ** (185 linh kiện + 11 crew thường + 5 crew ẩn)

### 2.2 Hệ thống Rarity (Độ hiếm) — 5 cấp

| Sao   | Tên       | Drop Rate | Màu        |
| ----- | --------- | --------- | ---------- |
| ★     | Common    | 60%       | Xám        |
| ★★    | Uncommon  | 20%       | Xanh lá    |
| ★★★   | Rare      | 15%       | Xanh dương |
| ★★★★  | Epic      | 3.5%      | Tím        |
| ★★★★★ | Legendary | 1.5%      | Vàng       |

### 2.3 Chỉ số thẻ — 3 stat chính

| Stat              | Ý nghĩa        | Cơ chế                                                          |
| ----------------- | -------------- | --------------------------------------------------------------- |
| **statPower**     | Mã lực (Power) | Cộng dồn → so sánh với `requiredPower` của quest                |
| **statHeat**      | Nhiệt độ       | Cộng dồn, giá trị **âm** = giảm nhiệt. Vượt 100 = **NỔ MÁY**    |
| **statStability** | Độ ổn định     | Trừ cho Heat mỗi slot: `currentHeat = max(0, heat - stability)` |

### 2.4 Card Effects — Hiệu ứng đặc biệt (thẻ 4-5★)

Có 3 loại trigger:

| TriggerCondition | Khi nào kích hoạt        |
| ---------------- | ------------------------ |
| `PASSIVE`        | Luôn luôn có hiệu lực    |
| `ON_TEST`        | Chỉ khi chạy thử xe      |
| `ADJACENT`       | Khi đặt cạnh thẻ phù hợp |

Có 3 loại hiệu ứng: `BUFF`, `DEBUFF`, `UTILITY`

**Ví dụ hiệu ứng tiêu biểu:**

- **W16 Quad-Turbo** (Engine 5★): +50 Power ON_TEST, +10 Stability PASSIVE
- **Quantum Intake** (Filter 5★): Giảm 50% Heat của Engine
- **Hệ Thống Từ Trường Lượng Tử** (Cooling 5★): Ép Heat toàn xe = 0
- **Ghost Exhaust** (Exhaust 5★): x2 Stability, Bypass luật NO_EXHAUST
- **Hoạt Chất Lõi Mặt Trời** (Fuel 5★): +200 Power, +138 Heat, Giảm 80% Stability toàn xe

---

## 3. Workshop — Chạy Thử Xe (Core Gameplay)

**Endpoint**: `POST /api/workshop/test`

### 3.1 Input

- `cardIds`: Mảng 10 card ID (bắt buộc đầy đủ 10 slot)
- `crewCardIds`: Mảng crew card ID (tùy chọn, tối đa theo `crewSlots`)
- `questId`: ID quest đang thực hiện
- Các tham số boss đặc biệt: `epIslandChoice`, `babyOilChoice`, `russiaPhase`, `vodkaChoice`

### 3.2 Quy trình chạy thử — Sequential Test Run

```
Slot 1 → Slot 2 → ... → Slot 10 (tuần tự)

Mỗi slot:
  1. Lấy thẻ tại slot
  2. Tính base stats: powerAdded, heatAdded, stabilityReduced
  3. Áp dụng buff Moscow (+20% power nếu active)
  4. Áp dụng hiệu ứng Gấu (Russia boss nếu có)
  5. Cộng crew buffs (power, heat, stability)
  6. Check combo với thẻ liền trước (adjacent)
  7. Check card effects (ON_TEST)
  8. Cộng dồn: totalPower += powerAdded
  9. Tính heat: currentHeat += heatAdded - stabilityReduced
  10. Check boss conditions (during run)
  11. Check explosion: currentHeat >= 100 → NỔ MÁY, dừng ngay
```

### 3.3 Kết quả chạy thử

| Kết quả                    | Điều kiện                                                            |
| -------------------------- | -------------------------------------------------------------------- |
| **✅ Thành công**          | Không nổ + không fail boss condition + `totalPower >= requiredPower` |
| **💥 Nổ máy**              | `currentHeat >= 100` bất kỳ lúc nào                                  |
| **❌ Thiếu Power**         | `totalPower < requiredPower`                                         |
| **❌ Boss condition fail** | Điều kiện boss đặc biệt không đạt                                    |

### 3.4 Kiểm tra sở hữu thẻ

- Server kiểm tra user có sở hữu đủ số lượng mỗi thẻ trong inventory
- Cùng 1 thẻ có thể dùng nhiều slot nếu sở hữu đủ quantity

---

## 4. Hệ Thống Quest & Khách Hàng

### 4.1 Sinh Quest (POST /api/quest/daily)

**Ngày 1–5 (Fixed)**:

- Số khách = `min(currentDay, 4)` → 1, 2, 3, 4, 4

**Ngày 6+ (Random)**:

- Dựa vào `QuestConfig` theo level người chơi
- Số khách random trong khoảng `minCustomers` – `maxCustomers`

**Quest Configs theo level:**

| Level | Power Required | Gold Reward | Customers |
| ----- | -------------- | ----------- | --------- |
| 1–3   | 75-125        | 200-300     | 1–3       |
| 4–7   | 125-180        | 400-600     | 2–4       |
| 8–12  | 180–300        | 800-1200    | 3–5       |
| 13-20  | 250–350        | 1300-1800    | 3–6       |
| 20-30 | 300-380        | 1500-2500   | 3–6       |
| 30-40 | 300-400        | 1500-3500   | 3–7       |
| 40-50 | 350-400        | 2000-5000   | 3–8       |


### 4.2 Boss Day

- Mỗi **5 ngày** (day % 5 === 0) → thêm 1 Boss quest
- Boss random từ pool, có weighted spawn rate cho Kim Jong Un (+20%), Nga Đại Đế (+20% nếu Kim bị ám sát hoặc thắng Đỗ Nam Trung)

### 4.3 Ngân sách khách hàng (Customer Budget)

- `customerBudget = baseGold × (2.0 – 4.0)` random
- Nếu tổng chi phí thẻ lắp < ngân sách khách → người chơi **giữ lời lãi** (Budget Profit Bonus)
- Thẻ 5★ chỉ tính 50% giá khi tính lợi nhuận

### 4.4 Hoàn thành Quest (POST /api/quest/[id]/complete)

**Thành công:**

- +Gold (có thể bị modifier bởi: smuggler penalty -15%, Underworld Buff +50%, Kim Buff x2-x3)
- +EXP: 100 (quest thường) hoặc 300 (boss)
- **+1 Uy tín** (quest thường) / **+5 Uy tín** (boss) — tối đa 100

**Thất bại:**

- -10 Uy tín (quest thường)
- -20 Uy tín (boss)
- Đặc biệt: Boss EP, Donald Trump, Baby Oil có luật riêng

---

## 5. Hệ Thống Boss

### 5.1 Danh sách 10 Boss

| Boss                  | Điều kiện đặc biệt                                     | Power yêu cầu | Thưởng Gold |
| --------------------- | ------------------------------------------------------ | ------------- | ----------- |
| **Ông Hoàng Drift**   | `DRIFT_KING_CHALLENGE` — Trượt ly tâm, Stability ≥ 150 | 350           | 1500        |
| **Huyền Thoại F1**    | `NO_COOLING` — Cấm dùng thẻ COOLING                    | 450           | 2500        |
| **Nhà Sưu Tập**       | `MIN_RARITY_3` — Chỉ thẻ ≥ 3★                          | 400           | 1800        |
| **Cô Gái Liều Lĩnh**  | `DAREDEVIL_DEATH_WISH` — Bơm Heat tử thần, Đáy 85%     | 325           | 2100        |
| **Kẻ Bí Ẩn**          | Không có — Pure power check 800. **Chỉ xuất hiện sau ngày 10** | 666           | 5500        |
| **Đảo Chủ EP**        | `EP_ISLAND_CHOICE` — Nhánh lựa chọn                    | 467           | 2500        |
| **Chúa Tể Dầu Em Bé** | `BABY_OIL_CHOICE` — Nhánh lựa chọn                     | 369           | 3000        |
| **Chủ Tịch Kim**      | `KIM_JONG_UN` — Storyline Triều Tiên                   | 365           | 3000        |
| **Đỗ Nam Trung**      | `DONALD_TRUMP` — Tax + khóa 5★                         | 470           | 4700        |
| **Nga Đại Đế**        | `RUSSIA_EMPEROR` — 2 Phase + Gấu                       | dynamic       | dynamic     |

### 5.2 Chi Tiết Boss Đặc Biệt

#### Ông Hoàng Drift (`DRIFT_KING_CHALLENGE`)

- **Pre-run**: Cấm dùng thẻ loại Hệ thống treo (`SUSPENSION`) có độ hiếm ≥ 3★ (Bắt buộc dùng phuộc "mềm" 1-2★ để văng xe).
- **Active-run (Trượt ly tâm)**: Tại các Slot Chẵn (Slot 2, 4, 6, 8, 10):
  - Nhận thêm quán tính: **+15% Power**.
  - Mất gió trực diện: Khả năng làm mát của thẻ bị **giảm 30%**.
- **Post-run**: Tổng `Stability` cuối cùng của xe phải **≥ 50** (Xác nhận xe không lật).

#### Cô Gái Liều Lĩnh (`DAREDEVIL_DEATH_WISH`)

- **Active-run (Thốc Ga Tử Thần)**: Tại đúng **Slot 7**, Nhiệt độ (Heat) xe bị sốc bất ngờ **tăng đột biến +15 Heat**.
- **Post-run**: Tổng Nhiệt độ (Heat) cuối cùng của xe bắt buộc phải đạt độ nỏng sát viền vực nổ máy: **≥ 75%**. (Và dĩ nhiên không được vượt quá 100% gây nổ).
- _Lưu ý_: Với perk Bàn Tay Nóng (ngưỡng 115%), mức tối thiểu yêu cầu sẽ chạy theo là ≥ 90%.

#### Đảo Chủ EP (`EP_ISLAND_CHOICE`)

- **Hỏi**: "Có đồng ý lên đảo không?"
- **Nhánh YES**: -50 Uy tín, power ≥ 400, Heat ≤ 69%, ≥1 Combo
- **Nhánh NO**: +15 Uy tín, cấm dùng COOLING 5★, cần 1 thẻ 5★ + 1 thẻ 4★, power ≥ 470
- **Thưởng thắng**: 3 Pack + 1 thẻ 4★ + Unlock Donald Trump appearance (`hasDefeatedEP = true`)

#### Chúa Tể Dầu Em Bé (`BABY_OIL_CHOICE`)

- **Nhánh YES**: Cấm FUEL, Heat ≥ 60%, Power ≤ 400 → Thắng: +2500 Gold + 2 Pack
- **Nhánh NO**: Tự động fail → **-45% Uy tín** + tất cả khách trong ngày bỏ đi (auto-fail pending quests)

#### Đỗ Nam Trung (`DONALD_TRUMP`)

- **Pre-run**: Khóa tất cả thẻ 5★
- **Post-run**: Heat > 47% VÀ Power  400≤470
- **Thắng**: +4700 Gold, +47 Uy tín, giảm 4.7% thuế Shop ngày mai (`shopTaxModifier = 0.953`)
- **Thua**: Tăng 47% thuế Shop ngày mai (`shopTaxModifier = 1.47`), KHÔNG trừ Uy tín
- **Chỉ xuất hiện sau khi thắng Đảo Chủ EP** (`hasDefeatedEP = true`)

#### Chủ Tịch Kim (`KIM_JONG_UN`)

- **Lần đầu gặp**: Hỏi "Gia nhập Triều Tiên không?"
  - **YES**: Bắt đầu tuyến truyện Triều Tiên (xem Mục 8)
  - **NO**: **BAD ENDING — "Bị Tiêu Diệt Bởi Chủ Tịch"** (Game Over!)
- **Gặp lại tại NK**: Nếu thắng → +2000 Gold thưởng thêm

#### Nga Đại Đế (`RUSSIA_EMPEROR`)

- **Phase 1**: Chạy thử xe bình thường, Gold = totalPower × 1, Heat ≤ 36%
- **Phase 2**: Hỏi "Có vodka không?"
  - **YES**: Heat max 67%, Gold = totalPower × 2
  - **NO**: 3 Gấu tấn công:
    - 🐻 **Gấu nâu**: 50% chance giảm 20% Power mỗi thẻ
    - 🐼 **Gấu trúc**: 30% chance nuốt mất thẻ mỗi slot
    - 🐻‍❄️ **Gấu trắng**: Đóng băng thẻ cao sao nhất (power = 0)
- **Thắng cả 2 phase**: Buff Hào Quang Moskva (+20% Power ngày mai) + `hasMoscowBuff = true`
- **Spawn bonus +20%** khi Kim bị ám sát hoặc đã thắng Đỗ Nam Trung

---

## 6. Shop & Kinh Tế

### 6.1 Cơ chế xuất hiện Shop

- **Không có nút Shop ở sảnh** — Shop tự động mở sau khi:
  1. Người chơi bấm "Kết Thúc Ngày"
  2. Event ngẫu nhiên xuất hiện trước (nếu có)
  3. Shop mở ra (Ngày 2+)
  4. Người chơi mua hàng hoặc đóng Shop → Shop biến mất
  5. Ngày mới bắt đầu → Vòng lặp tiếp tục
- `POST /api/game/end-day` response trả `shopPhase: true` để frontend biết mở Shop

### 6.2 Shop chính (GET /api/shop/items)

- **Mở khóa từ Ngày 2** (`SHOP_UNLOCK_DAY = 2`)
- **6 slot** random mỗi lần (tối đa 6 cụm thẻ):

**Ưu tiên loại thẻ thiếu:**

- 50% slot ưu tiên pick từ **top 3 loại thẻ** player sở hữu ít nhất
- 50% slot random bình thường

**Các loại item trong slot:**

| Loại             | Chance          | Chi tiết                                                    |
| ---------------- | --------------- | ----------------------------------------------------------- |
| **x2 Pack Deal** | 0.5%            | Mua giá 1 Pack, nhận 10 thẻ (gấp đôi). Cực hiếm!            |
| **Pack thường**  | 10%             | Gói Thẻ Bí Ẩn: 5 thẻ random. Giá scale 350g→1000g theo ngày |
| **Cụm thẻ 1★**   | 20% (1/3 × 60%) | 3 thẻ giống nhau, giảm 10% tổng giá                         |
| **Cụm thẻ 2★**   | ~7% (1/3 × 20%) | 2 thẻ giống nhau, giảm 10% tổng giá                         |
| **Thẻ lẻ**       | Còn lại         | Theo drop rate gốc (không CREW)                             |

- **1 slot CREW riêng**: Random 1 crew chưa sở hữu (unlockType = 'SHOP')
- **Tax modifier**: `shopTaxModifier` (boss Đỗ Nam Trung), Perk VIP_CARD (-20% 10 ngày đầu)

### 6.3 Pity System (Pack thứ 10)

- Field `totalPacksOpened` trong bảng users, đếm tổng pack đã mở
- **Mỗi pack thứ 10** (modulo 10) → thẻ đầu tiên trong pack **đảm bảo 4★ hoặc 5★** (50/50)
- x2 Pack cũng đếm 2 lần vào pity counter
- Response GET shop trả `pityCounter` và `nextPityAt` để frontend hiển thị

### 6.4 Mua thẻ (POST /api/shop/items)

Hỗ trợ 4 type:

- `CARD`: Mua thẻ lẻ → trừ Gold, thêm 1 thẻ inventory
- `BUNDLE`: Mua cụm → trừ Gold, thêm bundleQuantity thẻ cùng loại
- `PACK`: Mở pack 5 thẻ (có pity check)
- `X2_PACK`: Mở x2 pack = 10 thẻ (có pity check, đếm 2 lần)

### 6.5 Reroll Shop (POST /api/shop/reroll)

- **Giá reroll**: `50 × 2^count` (lần 1: 50g, lần 2: 100g, lần 3: 200g...)
- **Chức năng**: Random lại toàn bộ 6 slot shop + crew slot
- **Giữ nguyên**: Pity counter, tax modifier, ngày hiện tại
- Response trả về `rerollCost` và `nextRerollCost` để frontend hiển thị

### 6.6 Smuggler — Tay Buôn Lậu (GET/POST /api/events/smuggler)

Chỉ khi event "Tay Buôn Lậu Gõ Cửa" đang active:

| Tính năng           | Chi tiết                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| **Mua**             | Thẻ 3★+ với giá **60% giá gốc** (giảm 40%), -5 Uy tín/món                 |
| **Bán**             | Bán bất kỳ thẻ nào với giá **50% giá gốc**                                |
| **Shop size**       | 4 món hiếm random                                                         |
| **Underworld Buff** | Nếu có `hasUnderworldBuff` → giảm giá mua thêm 20%                        |
| **Rủi ro**          | Ngày sau có thể bị "Cảnh Sát Triều Tiên" kiểm tra (-80 Uy tín nếu bị bắt) |

### 6.7 Nguồn thu nhập Gold

| Nguồn           | Chi tiết                                 |
| --------------- | ---------------------------------------- |
| Quest thường    | Random 100–1500g theo level              |
| Boss thường     | 800–5000g tùy boss                       |
| Level up        | `newLevel² × 100` Gold                   |
| Budget Profit   | Tiền khách dư - chi phí thẻ              |
| Sự kiện         | Đua ngầm 800g, Camera NK 1000g, v.v.     |
| Boss đặc biệt   | Donald Trump 4700g, Baby Oil 2500g bonus |
| Bán đồ Smuggler | 50% giá gốc                              |

---

## 7. Hệ Thống Sự Kiện Ngẫu Nhiên

### 7.1 Events thông thường

| Event                    | Type    | Xác suất | Hiệu ứng                                         |
| ------------------------ | ------- | -------- | ------------------------------------------------ |
| **Tay Buôn Lậu Gõ Cửa**  | CHOICE  | 30%      | Mở Smuggler Shop, -10 Uy tín, -15% Gold ngày sau |
| **Ánh Trăng Racing**     | CHOICE  | 15%      | +800 Gold, -15 Uy tín (cần Uy tín > 15)          |
| **Băng Đảng Xăng Dầu**   | PASSIVE | 15%      | -10% tổng Gold hiện có                           |
| **Độ Channel Bốc Phốt**  | PASSIVE | 10%      | +40 Uy tín, -200 Gold                            |
| **Đấu Giá Kho Xưởng**    | CHOICE  | 15%      | -300 Gold, +500 Tech Points                      |
| **Kẻ Chế Tạo Cuồng Tín** | CHOICE  | 10%      | +400 Tech Points, -20 Uy tín                     |
| **Cảnh Sát Đột Kích**    | PASSIVE | 15%      | -150 Gold, -10 Uy tín                            |

### 7.2 Events Triều Tiên (chỉ khi `isInNorthKorea = true`)

| Event                   | Xác suất                         | Hiệu ứng                                                  |
| ----------------------- | -------------------------------- | --------------------------------------------------------- |
| **Camera Ngoại Bang**   | 40%                              | Tố cáo gián điệp → +1000 Gold                             |
| **Kiểm Tra Ảnh Cán Bộ** | 50%                              | Pass (65–100% tùy Uy tín), Fail → **Bad Ending**          |
| **Sát Thủ Gọi Mời**     | 100% (Ngày NK 10)                | Chấp nhận ám sát Kim → thoát NK. Từ chối → **Bad Ending** |
| **Cảnh Sát Triều Tiên** | 10% (sau khi có Underworld Buff) | Nếu mua Smuggler hôm qua → -80 Uy tín                     |

### 7.3 Cơ chế Event

- Events kéo dài **3 ngày** (remainingTurns = 3)
- Giảm 1 turn mỗi ngày kết thúc
- Tự xóa khi hết turn

---

## 8. Tuyến Truyện Triều Tiên (North Korea Storyline)

```
Boss Kim Jong Un xuất hiện (ngày chia hết 5)
        │
        ├── YES → Gia nhập Triều Tiên
        │         │
        │         ├── Minigame vỗ tay thành công → hasKimBuff = true (x2-x3 Gold khách NK)
        │         ├── Minigame fail → Không có buff
        │         │
        │         ├── Ngày 1–9 NK: Events Camera (40%) + Kiểm Tra Ảnh (50%)
        │         │    └── Fail Kiểm Tra Ảnh → BAD ENDING: "Bị Tiêu Diệt Bởi Chủ Tịch"
        │         │
        │         ├── Ngày 10 NK: Event Sát Thủ (100%)
        │         │    ├── Chấp nhận ám sát:
        │         │    │    ├── Thành công (xác suất = (100 - health)/100):
        │         │    │    │    → Thoát NK, hasUnderworldBuff (+50% lợi nhuận)
        │         │    │    │    → isKimAssassinated = true
        │         │    │    └── Thất bại → BAD ENDING: "Bị Tiêu Diệt"
        │         │    └── Từ chối → BAD ENDING: "Bị Sát Thủ Tiêu Diệt"
        │         │
        │         └── NK Customers: Power 150–300, Gold 50–150 (rất thấp, bù bằng Kim Buff)
        │
        └── NO → BAD ENDING: "Bị Tiêu Diệt Bởi Chủ Tịch" (GAME OVER!)
```

**Đặc điểm khi ở Triều Tiên:**

- Khách hàng yếu hơn (power 150–300, gold 50–150)
- Có Kim Buff → gold x2 hoặc x3 cho quest thường
- Events riêng biệt (không roll events thường)
- `northKoreaDayCount` tăng mỗi ngày kết thúc

---

## 9. Crew — Đội Ngũ

### 9.1 Cơ chế Crew

- Crew **không lắp lên 10 slot xe**, chỉ gắn vào crew slots
- Mặc định 1 crew slot, tối đa 5 slot
- Crew cho buff **PASSIVE** áp dụng lên toàn bộ xe
- Buff crew = cộng dồn vào `powerAdded`, `heatAdded`, `stabilityReduced` mỗi slot

### 9.2 Crew mua tại Shop (11 crew, unlockType = 'SHOP')

| Crew                            | Rarity | Giá  | Hiệu ứng                                          |
| ------------------------------- | ------ | ---- | ------------------------------------------------- |
| Kỹ Sư Nhiệt (The Cooler)        | 2★     | 300  | -10% Heat cho Turbo                               |
| Thợ Sơn (The Artist)            | 2★     | 400  | +15% tiền tip                                     |
| Thợ Hàn Ngầm (The Welder)       | 2★     | 350  | EXHAUST +10 Stability                             |
| Thầy Phong Thuỷ (Feng Shui)     | 2★     | 450  | FILTER+ENGINE+COOLING cùng rarity → +25 Stability |
| Kế Toán Trưởng (The Accountant) | 2★     | 500  | Hoàn trả 10% tiền mua linh kiện                   |
| Chuyên Gia Ống Xả (The Flow)    | 3★     | 800  | Ống xả +15 Power                                  |
| Bác Sĩ Xăng (Fuel Doctor)       | 3★     | 900  | FUEL x2 Power, Heat x1.5                          |
| Tay Lái Thử (The Stuntman)      | 3★     | 1000 | Ngưỡng nổ +5 điểm (105) khi Heat > 95%            |
| Chuyên Gia Lốp (The Grip)       | 3★     | 1200 | +20 Stability cho xe > 400 HP                     |
| Thợ Điện Ngầm (Wireman)         | 4★     | 1800 | NITROUS xoá trừ Stability                         |
| Chiến Binh Đêm (Night Rider)    | 4★     | 2500 | Ngày 25+: TIRE & TURBO +15 Power                  |

### 9.3 Crew ẩn (5 crew, unlockType = 'ACHIEVEMENT')

| Crew                               | Rarity | Achievement cần              | Hiệu ứng                           |
| ---------------------------------- | ------ | ---------------------------- | ---------------------------------- |
| Kẻ Đào Tẩu (The Fugitive)          | 4★     | Kẻ Sống Sót Trong Lửa        | Bypass mọi điều kiện Boss          |
| Linh Hồn Gara (Ghost Mechanic)     | 5★     | Bậc Thầy Nổ Máy (10 lần nổ)  | 1 lần/màn cứu xe khi nổ            |
| Chủ Tịch Tập Đoàn (The CEO)        | 4★     | Chiến Thắng Với Giá 0 Đồng   | Mượn 1 Legendary/màn               |
| Hacker Mũ Đen (Black-Hat)          | 5★     | Click đồng hồ 13 lần nửa đêm | Đảo ngược Heat ↔ Stability mọi thẻ |
| Huyền Thoại Giải Nghệ (The Legend) | 5★     | Hiến Tế Huyền Thoại          | Common/Uncommon → Rare stats       |

---

## 10. Combo — Phản Ứng Dây Chuyền

### 10.1 Cơ chế Combo

- Combo kích hoạt khi **2 thẻ đặt cạnh nhau** (adjacent slots)
- Check combo: slot i với slot i-1
- Mỗi combo có `effectType` và `effectValue`

### 10.2 Các loại Combo Effect

| effectType           | Ý nghĩa                      |
| -------------------- | ---------------------------- |
| `MULTIPLY_POWER`     | Nhân Power của thẻ hiện tại  |
| `REDUCE_HEAT`        | Nhân Heat (< 1.0 = giảm)     |
| `BONUS_POWER`        | Cộng thêm Power cố định      |
| `BONUS_STABILITY`    | Cộng thêm Stability cố định  |
| `MULTIPLY_STABILITY` | Nhân Stability               |
| `NEGATE_HEAT`        | Xóa Heat (1.0 = xóa hết)     |
| `BONUS_GOLD`         | Thưởng thêm % Gold           |
| `POWER_TO_STABILITY` | Chuyển Power thành Stability |

### 10.3 Danh sách 25 Combo

**Combo Linh Kiện (16):**

1. ⚡ **Tăng Áp Hiệu Quả** — Lọc Gió Performance + Động Cơ 2.0L Turbo → +20 Power
2. 💨 **Thoát Khí Tự Do** — Turbo Tăng Áp Đôi + Ống Xả Titan Racing → +5% Power→Stability
3. 🌪️ **Cơn Lốc Carbon** — Lọc Gió Carbon + Turbo Titan X → x2.5 Power
4. ❄️ **Quái Thú Băng Giá** — V8 Supercharged + Cryo Cooling → Xóa Heat V8
5. 🚀 **Ngày Tận Thế** — W16 + Nhiên Liệu Tên Lửa → x3 Power (Heat x1.5)
6. 🔥 **Cháy Sạch Hoàn Hảo** — V6 Twin-Turbo + Xăng Racing → -40% Heat
7. 💥 **Sóng Xung Kích** — NOS Mega + Ống Xả Performance → +35 Power
8. 🎆 **Pháo Hoa Đường Phố** — NOS Nhỏ + Xăng RON 95 → +15 Power
9. 🧊 **Turbo Lạnh** — Intercooler Carbon + Turbo Nhỏ → -70% Heat turbo
10. 🌊 **Dòng Chảy Hoàn Hảo** — Két Nước Racing + Động Cơ 1.5L → +12 Stability
11. 🏎️ **Bám Đường Tuyệt Đối** — Coilover Racing + Lốp Slick → x1.5 Stability
12. 🛞 **Cân Bằng Đường Phố** — Giảm Xóc Cơ Bản + Lốp Semi-Slick → +10 Stability
13. 🔧 **Tinh Chỉnh Quái Thú** — OBD2 + V8 Supercharged → -30% Heat
14. 🛠️ **Thợ Máy Chăm Chỉ** — Bộ Cờ Lê + Quạt Làm Mát → +8 Stability
15. ☠️ **Canh Bạc Tử Thần** — Nhiên Liệu Tên Lửa + NOS Mega → x2 Power (Heat x2!)
16. 🌆 **Xe Hàng Ngày Tin Cậy** — Lốp Đường Phố + Quạt Làm Mát → +15 Stability

**Combo Crew (9):**
17–25: Crew + linh kiện tương ứng → buff cực mạnh (VD: Huyền Thoại + W16 → x1.5 Power W16)

---

## 11. Hệ Thống Nâng Cấp & Tiến Trình

### 11.1 Level Up

- **EXP cần**: `level × 500` (Level 1 → 500 EXP, Level 10 → 5000 EXP)
- **Gold thưởng khi lên cấp**: `newLevel² × 100` (Level 5 = 2500g, Level 10 = 10000g)
- **Level rewards** (thẻ bài miễn phí):

| Level | Thẻ nhận               |
| ----- | ---------------------- |
| 2     | 2x Động Cơ Xe Máy 50cc |
| 3     | 2x Ống Xả Tiêu Chuẩn   |
| 5     | 1x Động Cơ 2.0L Turbo  |
| 7     | 1x Turbo Tăng Áp Đôi   |
| 10    | 1x Ống Xả Titan Racing |
| 15    | 1x V8 Supercharged     |

### 11.2 Tech Points

- **+10 Tech Points** mỗi ngày kết thúc
- Dùng để nâng cấp Crew Slots

### 11.3 Crew Slot Upgrade (POST /api/game/upgrade)

| Slot mới | Chi phí Tech Points |
| -------- | ------------------- |
| 1 → 2    | 50                  |
| 2 → 3    | 100                 |
| 3 → 4    | 200                 |
| 4 → 5    | 350                 |

### 11.4 Uy tín (Garage Health)

- Bắt đầu: 100, Tối đa: 100
- Tụt về 0 → **BAD ENDING: "Wasted Potential"**
- Tăng: **+1 thắng quest thường**, **+5 thắng boss**, boss EP nhánh NO (+15), event Bốc Phốt (+40), boss Donald Trump thắng (+47)
- Giảm: Fail quest (-10), fail boss (-20), events, smuggler mua (-5/món)

---

## 12. Hệ Thống Kết Cục (Endings)

### 12.1 Danh sách 8 Endings

| Ending                        | Type        | Điều kiện                         |
| ----------------------------- | ----------- | --------------------------------- |
| **Good Ending**               | STANDARD    | Sống sót 50 ngày (có ≥1 fail)     |
| **The Absolute Victory**      | PERFECT     | 50 ngày, **0 fail**               |
| **Wasted Potential**          | STANDARD    | Uy tín = 0 bất kỳ lúc nào         |
| **Invictus**                  | FINAL       | Final Round: Thắng hết 10 Boss    |
| **The Missing Percent**       | FINAL       | Final Round: Thua bất kỳ boss nào |
| **Bóng Ma Tốc Độ**            | BOSS_HIDDEN | Final Round: Thua boss "Kẻ Bí Ẩn" |
| **Bị Tiêu Diệt Bởi Chủ Tịch** | BAD         | Từ chối Kim / Fail Kiểm Tra Ảnh   |
| **Bị Sát Thủ Tiêu Diệt**      | BAD         | Từ chối ám sát / Ám sát thất bại  |

### 12.2 Final Round (POST /api/game/final-round)

- Chỉ có thể vào sau Ngày 50 khi đạt Good Ending
- Set `isFinalRound = true`, `currentDay = 51`
- Sinh 10 Boss quest random từ pool
- Thưởng **x2 Gold** cho mỗi boss
- Thắng hết 10 → **Invictus** (ending tốt nhất)

---

## 13. Thành Tựu Ẩn (Hidden Achievements)

| Code                  | Tên                    | Điều kiện                                | Thưởng Crew    |
| --------------------- | ---------------------- | ---------------------------------------- | -------------- |
| `HEAT_SURVIVOR`       | Kẻ Sống Sót Trong Lửa  | Heat > 90% cả run mà không nổ            | The Fugitive   |
| `EXPLOSION_MASTER`    | Bậc Thầy Nổ Máy        | Nổ máy 10 lần tổng                       | Ghost Mechanic |
| `ZERO_COST_WIN`       | Chiến Thắng Giá 0 Đồng | Thắng quest chỉ dùng thẻ Common/miễn phí | The CEO        |
| `MIDNIGHT_HACKER`     | Hacker Nửa Đêm         | Click đồng hồ 13 lần lúc 23h–1h          | Black-Hat      |
| `LEGENDARY_SACRIFICE` | Hiến Tế Huyền Thoại    | Sở hữu + bán hết Legendary cho Smuggler  | The Legend     |

**Easter Egg**: `POST /api/achievements/secret` với `secretCode: 'MIDNIGHT_CLOCK'`, `clickCount >= 13` và server time giữa 23h–1h

---

## 14. Hằng Số Game (Game Constants)

```typescript
GAME_CONSTANTS = {
  MAX_DAY: 50, // Số ngày chơi
  MAX_GARAGE_HEALTH: 100, // Uy tín tối đa
  MAX_CREW_SLOTS: 5, // Tối đa crew slots
  SLOTS_PER_CAR: 10, // Số slot trên xe
  HEAT_THRESHOLD: 100, // Ngưỡng nổ máy
  BOSS_INTERVAL: 5, // Boss mỗi 5 ngày
  FIXED_QUEST_DAYS: 5, // 5 ngày đầu quest cố định
  FINAL_ROUND_BOSSES: 10, // Số boss Final Round
  SHOP_UNLOCK_DAY: 2, // Shop mở Ngày 2
  PACK_CARDS_COUNT: 5, // Số thẻ trong pack
  PACK_CHANCE_IN_SHOP: 0.1, // 10% pack trong shop
  SHOP_ITEMS_COUNT: 6, // Số slot shop
  PITY_INTERVAL: 10, // Pack thứ 10 đảm bảo 4-5★
  FAIL_HEALTH_PENALTY: 10, // -10 uy tín fail quest
  BOSS_FAIL_HEALTH_PENALTY: 20, // -20 uy tín fail boss
  SUCCESS_EXP: 100, // EXP thắng quest
  BOSS_SUCCESS_EXP: 300, // EXP thắng boss
  SUCCESS_HEALTH_BONUS: 1, // +1 uy tín thắng quest thường
  BOSS_SUCCESS_HEALTH_BONUS: 5, // +5 uy tín thắng boss
  TECH_POINTS_PER_DAY: 10, // Tech points mỗi ngày
  CREW_SLOT_COSTS: [0, 50, 100, 200, 350],
  DROP_RATES: {
    1: 0.6, // Common 60%
    2: 0.2, // Uncommon 20%
    3: 0.15, // Rare 15%
    4: 0.035, // Epic 3.5%
    5: 0.015, // Legendary 1.5%
  },
  PERK_CODES: {
    STARTUP_FUND: 'STARTUP_FUND',     // +200 Gold
    OLD_STASH: 'OLD_STASH',           // 5 thẻ 2-3★
    HOT_HANDS: 'HOT_HANDS',           // Ngưỡng nổ +15 (115%)
    CONNECTIONS: 'CONNECTIONS',       // +1 crew slot
    VIP_CARD: 'VIP_CARD',             // Shop -20% 10 ngày đầu
    TECH_GENIUS: 'TECH_GENIUS',       // +100 Tech Points
  },
};
```

---

## 15. Kiến Trúc Kỹ Thuật

### 15.1 Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API Routes (18 endpoints)
- **Database**: MySQL (MariaDB adapter)
- **ORM**: Prisma
- **Auth**: JWT (Bearer token), bcrypt password hashing

### 15.2 Database Schema — 16 Tables

**Group A: User Data (Dữ liệu người dùng)**

- `users` — Hồ sơ & tiến trình (gold, level, exp, day, health, buffs, flags)
- `user_achievements` — Thành tựu đã đạt
- `user_inventory` — Kho thẻ bài
- `user_active_events` — Sự kiện đang hoạt động
- `user_endings` — Bộ sưu tập kết thúc

**Group B: System Data (Cấu hình tĩnh)**

- `cards` — 201 thẻ bài (11 types, 5 rarities, 3 stats)
- `card_effects` — Hiệu ứng đặc biệt thẻ 4-5★
- `card_combos` — 25 combo phản ứng dây chuyền
- `boss_configs` — 11 boss + điều kiện đặc biệt
- `game_events` — 11 sự kiện ngẫu nhiên
- `endings` — 9 kết cục

**Group C: Game Rules**

- `quest_configs` — Công thức sinh quest theo level
- `level_rewards` — Thẻ thưởng khi lên cấp
- `achievements` — 5 thành tựu ẩn
- `starter_perks` — 6 đặc quyền đầu trận (Roguelite progression)

### 15.3 API Endpoints — 35 Endpoints (27 Routes)

| Route                      | Method | Mô tả                    |
| -------------------------- | ------ | ------------------------ |
| `/api/auth/register`       | POST   | Đăng ký tài khoản        |
| `/api/auth/login`          | POST   | Đăng nhập                |
| `/api/user/profile`        | GET    | Thông tin user           |
| `/api/user/inventory`      | GET    | Kho đồ (tất cả thẻ)      |
| `/api/user/crew`           | GET    | Crew đang sở hữu + slots |
| `/api/cards`               | GET    | Danh sách thẻ (filter)   |
| `/api/cards/[id]`          | GET    | Chi tiết thẻ             |
| `/api/cards/combos`        | GET    | Danh sách 25 combo       |
| `/api/quest/daily`         | GET    | Lấy quest hàng ngày      |
| `/api/quest/daily`         | POST   | Sinh quest mới           |
| `/api/quest/[id]/complete` | POST   | Hoàn thành quest         |
| `/api/shop/items`          | GET    | Xem shop (6 slot)        |
| `/api/shop/items`          | POST   | Mua thẻ/pack             |
| `/api/shop/reroll`         | POST   | Reroll shop (giá tăng dần) |
| `/api/workshop/test`       | POST   | Chạy thử xe (core)       |
| `/api/boss/configs`        | GET    | Danh sách/chi tiết Boss  |
| `/api/game/end-day`        | GET    | Xem tổng kết ngày        |
| `/api/game/end-day`        | POST   | Kết thúc ngày            |
| `/api/game/upgrade`        | POST   | Nâng cấp crew slot       |
| `/api/game/final-round`    | GET    | Xem trạng thái Final     |
| `/api/game/final-round`    | POST   | Bắt đầu Final Round      |
| `/api/game/reset`          | POST   | Reset game               |
| `/api/game/perks`          | GET    | Danh sách starter perks  |
| `/api/game/perks`          | POST   | Chọn perk cho vòng chơi  |
| `/api/game/stats`          | GET    | Thống kê tổng hợp        |
| `/api/game/leaderboard`    | GET    | Bảng xếp hạng            |
| `/api/game/endings`        | GET    | Bộ sưu tập kết cục       |
| `/api/game/config`         | GET    | Game constants & configs |
| `/api/events/random`       | GET    | Roll sự kiện ngẫu nhiên  |
| `/api/events/random`       | POST   | Phản hồi sự kiện         |
| `/api/events/smuggler`     | GET    | Xem Smuggler shop        |
| `/api/events/smuggler`     | POST   | Mua/Bán tại Smuggler     |
| `/api/achievements`        | GET    | Xem achievements         |
| `/api/achievements`        | POST   | Kiểm tra & mở khóa       |
| `/api/achievements/secret` | POST   | Easter egg (midnight)    |
| `/api/dev/cheat`          | POST   | Công cụ hỗ trợ (Cheat)   |

### Admin Endpoints (yêu cầu role ADMIN)

| Route                          | Method | Mô tả                              |
| ------------------------------ | ------ | ---------------------------------- |
| `/api/admin/cards`             | GET    | Danh sách tất cả thẻ               |
| `/api/admin/cards`             | POST   | Tạo thẻ mới                        |
| `/api/admin/cards/[id]`        | GET    | Chi tiết thẻ                       |
| `/api/admin/cards/[id]`        | PUT    | Cập nhật thẻ                       |
| `/api/admin/cards/[id]`        | DELETE | Xóa thẻ                            |
| `/api/admin/cards/[id]/image`  | POST   | Upload ảnh thẻ                     |
| `/api/admin/config`            | GET    | Xem cấu hình game                  |
| `/api/admin/db`                | POST   | Reset database                     |
| `/api/admin/stats`             | GET    | Thống kê hệ thống                  |
| `/api/admin/users`             | GET    | Danh sách users                    |
| `/api/admin/users/[id]`        | GET    | Chi tiết user                      |
| `/api/admin/users/[id]`        | DELETE | Xóa user                           |
| `/api/admin/users/[id]/inventory` | GET | Inventory của user              |
| `/api/admin/verify`            | POST   | Verify admin token                 |

### 15.4 User Flags quan trọng (trong bảng users)

| Flag                     | Ý nghĩa                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `isFinalRound`           | Đang trong Final Round                                             |
| `totalExplosions`        | Tổng số lần nổ máy (cho achievement)                               |
| `totalShopSpent`         | Tổng Gold đã chi tại Shop (cho unlock perk VIP_CARD)              |
| `totalPacksOpened`       | Tổng số pack đã mở (cho Pity System)                               |
| `smugglerPenalty`        | 0.15 = -15% Gold (từ event Tay Buôn Lậu)                           |
| `hasDefeatedEP`          | Đã thắng Đảo Chủ EP → Unlock Donald Trump                          |
| `shopTaxModifier`        | Hệ số thuế shop (default 1.0)                                      |
| `shopTaxExpiresAt`       | Ngày hết hạn thuế                                                  |
| `isInNorthKorea`         | Đang ở Triều Tiên                                                  |
| `northKoreaDayCount`     | Số ngày ở NK                                                       |
| `hasKimBuff`             | Có buff Kim (x2-x3 Gold khách NK)                                  |
| `hasUnderworldBuff`      | Ám sát Kim thành công (+50% lợi nhuận)                             |
| `lastSmugglerBuyDay`     | Ngày cuối mua từ Smuggler (cho event cảnh sát)                     |
| `isKimAssassinated`      | Kim đã bị ám sát (loại Kim khỏi boss pool + tăng spawn Nga Đại Đế) |
| `hasDefeatedDonaldTrump` | Thắng Donald Trump (tăng spawn Nga Đại Đế)                         |
| `hasMoscowBuff`          | Buff Hào Quang Moskva (+20% Power)                                 |
| `moscowBuffDay`          | Ngày buff Moscow có hiệu lực                                       |

---

## 16. STARTER PERKS (Đặc Quyền Đầu Trận)

Khi bắt đầu một vòng chơi mới (hoặc đăng ký người dùng mới), người chơi sẽ được chọn **1 Đặc Quyền Duy Nhất** để mang vào game, tạo lợi thế lớn ngay từ Ngày 1. Hệ thống này được thiết kế tương tự Starter Deck trong Balatro.

| #   | Tên Đặc Quyền           | Hiệu Ứng                                                                 | Điều Kiện Mở Khóa (Tích Lũy Bất Kể Vòng Chơi)    |
| --- | ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| 1   | 🏦 **Quỹ Khởi Nghiệp**  | Nhận **+200 Gold** khi bắt đầu.                                          | **Mặc định (Luôn có sẵn)**                       |
| 2   | 📦 **Kho Đồ Cũ**        | Bắt đầu với **5 thẻ ngẫu nhiên 2-3★** (không chứa crew).                 | Đã đạt **Good Ending** ít nhất 1 lần             |
| 3   | 🔥 **Bàn Tay Nóng**     | Ngưỡng nổ máy tăng vĩnh viễn lên **115%** (thay vì 100%).                | Tổng số lần nổ máy trên mọi run ≥ **15 lần**     |
| 4   | 👥 **Mối Quan Hệ**      | Khởi đầu với **+1 Crew Slot** phụ trợ (cộng dồn với Slot mua vĩnh viễn). | Sở hữu ≥ **8 Crew Cards** khác nhau trong kho    |
| 5   | 🏷️ **Thẻ VIP Cửa Hàng** | Shop giảm giá **20%** trong **10 ngày đầu tiên**.                        | Tổng số Gold chi trả tại Shop ≥ **10,000 Gold**  |
| 6   | ⚙️ **Thiên Tài Cơ Khí** | Khởi đầu với **+100 Tech Points** miễn phí.                              | Từng đạt **Level 10** trong một vòng chơi bất kỳ |

> **Ghi chú**: Starter Perks cộng dồn trực tiếp với tiến trình Roguelite. Ví dụ: Bạn đã mở khóa 2 Crew Slots vĩnh viễn, chọn perk "Mối Quan Hệ" → Bạn có 3 Crew Slots ngay Ngày 1! Tài khoản tạo mới mặc định dùng perk "Quỹ Khởi Nghiệp".

---

## 17. Hướng Dẫn Chạy Lệnh (Commands)

### Chạy Seed (cập nhật dữ liệu vào DB)

> **Lưu ý:** Trên Windows PowerShell có thể bị lỗi `UnauthorizedAccess` do Execution Policy chặn script `.ps1`. Dùng `cmd /c` để bypass:

```bash
# ❌ Lỗi trên PowerShell:
npx prisma db seed

# ✅ Cách chạy đúng (dùng cmd /c):
cmd /c "npx prisma db seed"
```

⚠️ **Cảnh báo:** Seed sẽ **xóa toàn bộ dữ liệu cũ** (cards, combos, bosses, events...) và tạo lại từ đầu. User data (users, inventory, quests) cũng có thể bị ảnh hưởng. Backup trước khi chạy.

### Chạy Dev Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`
