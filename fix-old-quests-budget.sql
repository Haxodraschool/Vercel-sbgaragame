-- Fix quest cũ không có customerBudget
-- Cập nhật customerBudget = rewardGold * 3 cho quest thường đang PENDING

UPDATE daily_quests
SET customer_budget = reward_gold * 3
WHERE 
    is_boss = false 
    AND status = 'PENDING'
    AND (customer_budget = 0 OR customer_budget IS NULL);

-- Kiểm tra kết quả
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
ORDER BY day_number DESC
LIMIT 10;
