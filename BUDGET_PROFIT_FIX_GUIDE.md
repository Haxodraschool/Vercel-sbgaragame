# Hướng Dẫn Sửa Lỗi Budget Profit

## Vấn Đề Đã Tìm Ra

### Bug #1: Backend Không Tính Crew Cards ✅ ĐÃ SỬA
**File**: `sb-garage/src/app/api/workshop/test/route.ts`

**Vấn đề**: Backend chỉ tính chi phí 10 thẻ linh kiện, KHÔNG tính crew cards vào `totalCardCost`

**Đã sửa**: 
- Backend giờ fetch crew cards và cộng chi phí vào `totalCardCost`
- Crew cards 5★ cũng chỉ tính 50% giá

### Bug #2: Quest Cũ Không Có customerBudget ⚠️ CẦN FIX
**Vấn đề**: Quest được tạo trước khi có feature này có `customerBudget = 0`

**Giải pháp**: Có 3 cách

## Cách 1: Chuyển Sang Ngày Mới (Đơn Giản Nhất)

1. Vào game
2. Hoàn thành tất cả quest hiện tại (hoặc bỏ qua)
3. Click "CHUYỂN NGÀY" trong lobby
4. Quest mới sẽ có `customerBudget` đúng

## Cách 2: Dùng API Fix (Nhanh Nhất)

1. Mở trình duyệt
2. Truy cập: `http://localhost:3000/api/dev/fix-budget`
3. API sẽ tự động update tất cả quest PENDING
4. Refresh lại game

**Kết quả mong đợi**:
```json
{
  "message": "Fixed 3 quests",
  "updatedCount": 3,
  "sampleQuests": [
    {
      "id": 1,
      "dayNumber": 1,
      "requiredPower": 150,
      "rewardGold": 100,
      "customerBudget": 300,
      "userId": 1
    }
  ]
}
```

## Cách 3: Chạy SQL Trực Tiếp

```sql
-- Cập nhật customerBudget cho quest cũ
UPDATE daily_quests
SET customer_budget = reward_gold * 3
WHERE 
    is_boss = false 
    AND status = 'PENDING'
    AND (customer_budget = 0 OR customer_budget IS NULL);
```

## Kiểm Tra Sau Khi Fix

### 1. Kiểm Tra Database
```sql
SELECT 
    id,
    day_number,
    is_boss,
    required_power,
    reward_gold,
    customer_budget,
    status
FROM daily_quests
WHERE status = 'PENDING'
ORDER BY day_number DESC;
```

**Kết quả mong đợi**:
- Quest thường (is_boss = false): `customer_budget > 0` (thường = reward_gold × 2-4)
- Boss quest (is_boss = true): `customer_budget = 0` (đúng theo thiết kế)

### 2. Kiểm Tra Frontend

1. Vào Workshop với quest thường
2. Lắp thẻ có tổng chi phí < customerBudget
3. Phải thấy box **"LỜI NGÂN SÁCH"** màu xanh lá hiển thị số tiền lời

**Ví dụ**:
- Quest có `customerBudget = 1000`
- Lắp thẻ tổng chi phí = 600
- Hiển thị: **"LỜI NGÂN SÁCH +400 G"**

### 3. Kiểm Tra Console Logs

Mở Console (F12) và chạy test, phải thấy:

```
💰 BUDGET PROFIT CALCULATION: {
  customerBudget: 1000,
  totalCardCost: 600,
  budgetProfit: 400,
  success: true,
  componentCardCount: 8,
  crewCardCount: 2
}

🎯 Test Result: { success: true, budgetProfit: 400, ... }
💰 Saving budgetProfit: 400

📤 Sending to complete API: { status: 'SUCCESS', budgetProfit: 400, ... }

📥 Complete API received: { budgetProfit: 400, budgetProfitType: 'number', ... }
✅ Budget profit added! New goldReward: 900

💰 Gold update: { oldGold: 500, newGold: 1400, goldReward: 900, budgetProfit: 400 }
```

### 4. Kiểm Tra Gold Sau Khi Hoàn Thành

**Trước quest**: Gold = 500
**Quest reward**: 500 G
**Budget profit**: 400 G
**Sau quest**: Gold = 500 + 500 + 400 = **1400 G** ✅

## Lưu Ý Quan Trọng

### Budget Profit CHỈ Áp Dụng Khi:
1. ✅ Quest thường (KHÔNG phải boss)
2. ✅ Test thành công (không nổ máy, đủ power)
3. ✅ Tổng chi phí thẻ < customerBudget
4. ✅ Quest có customerBudget > 0

### Công Thức Tính:
```
totalCardCost = Σ(card.cost) cho tất cả thẻ (bao gồm crew)
  - Thẻ 5★: chỉ tính 50% giá
  - Thẻ khác: tính 100% giá

budgetProfit = customerBudget - totalCardCost (nếu > 0)

totalGold = baseReward + budgetProfit
```

### Ví Dụ Cụ Thể:

**Scenario 1: Có Lời**
- customerBudget: 1000
- Thẻ lắp: 3★ (cost 200) + 4★ (cost 300) + 5★ (cost 800, tính 400)
- totalCardCost: 200 + 300 + 400 = 900
- budgetProfit: 1000 - 900 = **100 G** ✅

**Scenario 2: Không Lời**
- customerBudget: 1000
- Thẻ lắp: 5★ (cost 1000, tính 500) + 4★ (cost 600)
- totalCardCost: 500 + 600 = 1100
- budgetProfit: 0 (vì 1100 > 1000) ❌

**Scenario 3: Boss Quest**
- customerBudget: 0 (boss không có budget)
- budgetProfit: 0 ❌

## Files Đã Sửa

1. ✅ `sb-garage/src/app/api/workshop/test/route.ts`
   - Thêm tính crew cards vào totalCardCost
   - Thêm console.log debug

2. ✅ `sb-garage/src/components/Workshop/WorkshopScreen.tsx`
   - Thêm console.log debug (code hiển thị đã có sẵn)

3. ✅ `sb-garage/src/app/api/quest/[id]/complete/route.ts`
   - Thêm console.log debug (code cộng gold đã có sẵn)

4. ✅ `sb-garage/src/app/api/dev/fix-budget/route.ts`
   - API mới để fix quest cũ

## Tóm Tắt

**Bug đã sửa**:
1. ✅ Backend không tính crew cards → ĐÃ SỬA
2. ⚠️ Quest cũ không có customerBudget → DÙNG API FIX hoặc CHUYỂN NGÀY

**Cách test nhanh**:
1. Truy cập: `http://localhost:3000/api/dev/fix-budget`
2. Vào game, chọn quest thường
3. Lắp thẻ rẻ (tổng < budget)
4. Phải thấy "LỜI NGÂN SÁCH" màu xanh
5. Hoàn thành quest, check gold tăng đúng

**Nếu vẫn không thấy**:
- Check console logs để xem budgetProfit = bao nhiêu ở mỗi bước
- Kiểm tra quest có phải boss không (boss không có budget)
- Kiểm tra tổng chi phí thẻ có < customerBudget không
