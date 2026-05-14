# Budget Profit Debug Guide

## Issue
User reports that budget profit (kinh phí khách hàng) is not being added to gold when completing quests.

## Expected Behavior (SKILL.md §6.3)
When completing a quest successfully:
1. Calculate total card cost (thẻ 5★ chỉ tính 50% giá)
2. If total cost < customerBudget → budgetProfit = customerBudget - totalCardCost
3. Add budgetProfit to goldReward when completing quest

## Implementation Flow

### 1. Test API (`/api/workshop/test`)
**File**: `sb-garage/src/app/api/workshop/test/route.ts`
**Lines**: 672-693

```typescript
let budgetProfit = 0;
if (success && quest.customerBudget && quest.customerBudget > 0) {
  let totalCardCost = 0;
  for (const cid of filledCardIds) {
    const card = cardMap.get(cid);
    if (card) {
      const cardCost = card.rarity === 5 ? Math.floor(card.cost * 0.5) : card.cost;
      totalCardCost += cardCost;
    }
  }
  if (totalCardCost < quest.customerBudget) {
    budgetProfit = quest.customerBudget - totalCardCost;
  }
}
```

**Returns**: `result.budgetProfit` (line 713)

### 2. Frontend State (`WorkshopScreen.tsx`)
**File**: `sb-garage/src/components/Workshop/WorkshopScreen.tsx`

**State Declaration** (line 643):
```typescript
const [testBudgetProfit, setTestBudgetProfit] = useState<number>(0);
```

**Receiving Test Result** (line 1233):
```typescript
setTestFinalResult(data.result || null);
```

**Saving Budget Profit** (lines 1131-1136):
```typescript
if (testFinalResult?.budgetProfit) {
    console.log('💰 Saving budgetProfit:', testFinalResult.budgetProfit);
    setTestBudgetProfit(testFinalResult.budgetProfit);
} else {
    console.log('⚠️ No budgetProfit in test result');
}
```

**Sending to Complete API** (line 1290):
```typescript
body: JSON.stringify({ 
    status, 
    usedCardIds,
    budgetProfit: testBudgetProfit,
    ...bossChoice
})
```

### 3. Complete API (`/api/quest/[id]/complete`)
**File**: `sb-garage/src/app/api/quest/[id]/complete/route.ts`

**Receiving** (line 19):
```typescript
const { status, ..., budgetProfit } = await request.json();
```

**Adding to Gold** (lines 85-95):
```typescript
goldReward = quest.rewardGold;

if (budgetProfit && typeof budgetProfit === 'number' && budgetProfit > 0) {
    goldReward += budgetProfit;
    console.log('✅ Budget profit added! New goldReward:', goldReward);
}
```

**Updating Database** (lines 96-102):
```typescript
await prisma.user.update({
    where: { id: auth.userId },
    data: {
        gold: { increment: goldReward },
        exp: { increment: expReward },
        garageHealth: newHealth,
    },
});
```

## Debug Console Logs Added

### Test API
- `💰 BUDGET PROFIT CALCULATION:` - Shows calculation details

### Frontend
- `🎯 Test Result:` - Shows full test result object
- `💰 Saving budgetProfit:` - Confirms budgetProfit is saved to state
- `⚠️ No budgetProfit in test result` - Warning if missing
- `📤 Sending to complete API:` - Shows what's being sent

### Complete API
- `📥 Complete API received:` - Shows received data
- `💰 Processing budget profit:` - Shows validation checks
- `✅ Budget profit added!` - Confirms addition
- `❌ Budget profit NOT added` - Shows why it wasn't added

## Testing Steps

1. **Start a quest with customerBudget > 0**
   - Check quest details in lobby
   - Note the customerBudget value

2. **Build a car in workshop**
   - Use cards with total cost < customerBudget
   - Click "CHẠY THỬ XE"

3. **Check browser console** for:
   ```
   💰 BUDGET PROFIT CALCULATION: {
     customerBudget: 1000,
     totalCardCost: 600,
     budgetProfit: 400,
     success: true
   }
   ```

4. **After test completes**, check console for:
   ```
   🎯 Test Result: { ..., budgetProfit: 400 }
   💰 Saving budgetProfit: 400
   ```

5. **Click "VỀ LOBBY"**, check console for:
   ```
   📤 Sending to complete API: {
     status: 'SUCCESS',
     budgetProfit: 400,
     questId: 123
   }
   ```

6. **Check complete API logs**:
   ```
   📥 Complete API received: {
     questId: 123,
     status: 'SUCCESS',
     budgetProfit: 400,
     budgetProfitType: 'number'
   }
   💰 Processing budget profit: {
     budgetProfit: 400,
     type: 'number',
     isNumber: true,
     isPositive: true,
     baseGoldReward: 500
   }
   ✅ Budget profit added! New goldReward: 900
   ```

7. **Verify in database**:
   - Check user's gold increased by (baseReward + budgetProfit)

## Common Issues to Check

### Issue 1: budgetProfit is 0 in test result
**Possible causes**:
- Quest doesn't have customerBudget set
- Total card cost >= customerBudget
- Test failed (success = false)

### Issue 2: budgetProfit not saved to state
**Possible causes**:
- testFinalResult is null
- testFinalResult.budgetProfit is undefined
- React state not updating

### Issue 3: budgetProfit not sent to complete API
**Possible causes**:
- testBudgetProfit state is 0
- Complete API called before test completes
- State reset before sending

### Issue 4: budgetProfit not added to gold
**Possible causes**:
- budgetProfit is not a number
- budgetProfit is 0 or negative
- Database update failed

## Expected Console Output (Success Case)

```
[Test API] 💰 BUDGET PROFIT CALCULATION: {
  customerBudget: 1000,
  totalCardCost: 600,
  budgetProfit: 400,
  success: true
}

[Frontend] 🎯 Test Result: {
  success: true,
  totalPower: 450,
  budgetProfit: 400,
  ...
}

[Frontend] 💰 Saving budgetProfit: 400

[Frontend] 📤 Sending to complete API: {
  status: 'SUCCESS',
  budgetProfit: 400,
  questId: 123
}

[Complete API] 📥 Complete API received: {
  questId: 123,
  status: 'SUCCESS',
  budgetProfit: 400,
  budgetProfitType: 'number'
}

[Complete API] 💰 Processing budget profit: {
  budgetProfit: 400,
  type: 'number',
  isNumber: true,
  isPositive: true,
  baseGoldReward: 500
}

[Complete API] ✅ Budget profit added! New goldReward: 900
```

## Files Modified

1. `sb-garage/src/app/api/workshop/test/route.ts` - Added console.log for budget calculation
2. `sb-garage/src/components/Workshop/WorkshopScreen.tsx` - Added console.logs for state and API calls
3. `sb-garage/src/app/api/quest/[id]/complete/route.ts` - Added console.logs for receiving and processing

## Next Steps

1. Run the game and complete a quest
2. Check browser console (F12) for frontend logs
3. Check server console for backend logs
4. If budgetProfit is 0 at any step, identify where it's lost
5. Verify database update with: `SELECT gold FROM User WHERE id = <userId>;`
