-- Kiểm tra quest hiện tại có customerBudget không
SELECT 
    id,
    user_id,
    day_number,
    is_boss,
    required_power,
    reward_gold,
    customer_budget,
    status
FROM daily_quests
WHERE status = 'PENDING'
ORDER BY user_id, day_number DESC
LIMIT 20;

-- Nếu customer_budget = 0 cho quest thường (is_boss = false), 
-- thì đó là quest cũ được tạo trước khi có feature này
