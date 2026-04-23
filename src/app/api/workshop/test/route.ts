// POST /api/workshop/test - Chạy thử xe (Core Gameplay)
// Nhận 10 card IDs, mô phỏng sequential test run
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

interface TestStep {
  slot: number;
  cardId: number;
  cardName: string;
  cardType: string;
  rarity: number;
  powerAdded: number;
  heatAdded: number;
  stabilityReduced: number;
  comboTriggered: boolean;
  comboEffect: string | null;
  comboValue: number;
  effectTriggered: boolean;
  effectDescription: string | null;
  totalPower: number;
  currentHeat: number;
  exploded: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { cardIds, questId, crewCardIds, epIslandChoice, babyOilChoice, russiaPhase, vodkaChoice } = await request.json();

    // Validate 10 slot array (cho phép slot trống = null/0). Phải đúng 10 phần tử.
    if (!Array.isArray(cardIds) || cardIds.length !== GAME_CONSTANTS.SLOTS_PER_CAR) {
      return NextResponse.json(
        { error: `Khung xe phải có đúng ${GAME_CONSTANTS.SLOTS_PER_CAR} ô (slot trống = null).` },
        { status: 400 }
      );
    }
    // Phải có ít nhất 1 thẻ
    const filledCardIds = (cardIds as (number | null)[]).filter((c): c is number => !!c);
    if (filledCardIds.length === 0) {
      return NextResponse.json(
        { error: 'Phải lắp ít nhất 1 thẻ lên khung xe!' },
        { status: 400 }
      );
    }

    // Get quest info
    const quest = await prisma.dailyQuest.findFirst({
      where: { id: questId, userId: auth.userId, status: 'PENDING' },
      include: { bossConfig: true },
    });

    if (!quest) {
      return NextResponse.json(
        { error: 'Quest không hợp lệ hoặc đã hoàn thành' },
        { status: 400 }
      );
    }

    // ============================================================
    // INVENTORY OWNERSHIP CHECK - Kiểm tra user có sở hữu thẻ không
    // ============================================================
    const allCardIds: number[] = [...filledCardIds];
    if (crewCardIds && Array.isArray(crewCardIds)) {
      allCardIds.push(...(crewCardIds as number[]).filter((c): c is number => !!c));
    }

    const inventory = await prisma.userInventory.findMany({
      where: { userId: auth.userId, cardId: { in: allCardIds } },
    });

    const ownedMap = new Map<number, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const inv of inventory as any[]) {
      ownedMap.set(inv.cardId, inv.quantity);
    }

    // Count card usage (same card can be used multiple times)
    const usageCount = new Map<number, number>();
    for (const cid of allCardIds) {
      usageCount.set(cid, (usageCount.get(cid) || 0) + 1);
    }

    for (const [cid, needed] of usageCount.entries()) {
      const owned = ownedMap.get(cid) || 0;
      if (owned < needed) {
        return NextResponse.json(
          { error: `Không đủ thẻ ID ${cid}! Cần ${needed}, có ${owned}.` },
          { status: 400 }
        );
      }
    }

    // Fetch all cards (chỉ slot có thẻ)
    const cards = await prisma.card.findMany({
      where: { id: { in: filledCardIds } },
      include: { effects: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardMap = new Map<number, any>(cards.map((c: any) => [c.id, c]));

    // ============================================================
    // BOSS SPECIAL CONDITION VALIDATION (PRE-RUN)
    // ============================================================
    if (quest.bossConfig?.specialCondition) {
      const condition = quest.bossConfig.specialCondition;
      const cardTypes = filledCardIds.map((id: number) => cardMap.get(id)?.type);
      const cardRarities = filledCardIds.map((id: number) => cardMap.get(id)?.rarity);

      // DRIFT_KING_CHALLENGE: Cấm dùng thẻ SUSPENSION ≥ 3 sao
      if (condition === 'DRIFT_KING_CHALLENGE') {
        const invalidSuspension = filledCardIds.find((id: number) => {
          const card = cardMap.get(id);
          return card && card.type === 'SUSPENSION' && card.rarity >= 3;
        });
        if (invalidSuspension) {
          const card = cardMap.get(invalidSuspension);
          return NextResponse.json(
            { error: `🚫 Boss "${quest.bossConfig.name}" cấm dùng Hệ Thống Treo xịn! Thẻ "${card?.name}" quá cứng (${card?.rarity} sao).` },
            { status: 400 }
          );
        }
      }

      // NO_COOLING: Cấm thẻ COOLING
      if (condition === 'NO_COOLING' && cardTypes.includes('COOLING')) {
        return NextResponse.json(
          { error: `🚫 Boss "${quest.bossConfig.name}" cấm dùng thẻ Làm Mát (COOLING)!` },
          { status: 400 }
        );
      }

      // MIN_RARITY_3: Chỉ thẻ ≥ 3 sao
      if (condition === 'MIN_RARITY_3') {
        const lowRarityCard = filledCardIds.find((id: number) => {
          const card = cardMap.get(id);
          return card && card.rarity < 3;
        });
        if (lowRarityCard) {
          const card = cardMap.get(lowRarityCard);
          return NextResponse.json(
            { error: `🚫 Boss "${quest.bossConfig.name}" yêu cầu thẻ ≥ 3 sao! Thẻ "${card?.name}" chỉ ${card?.rarity} sao.` },
            { status: 400 }
          );
        }
      }

      // EP_ISLAND_CHOICE (Đảo chủ EP): Pre-run check cho nhánh NO (SKILL.md §5.2)
      if (condition === 'EP_ISLAND_CHOICE' && epIslandChoice === 'NO') {
        // Cấm dùng COOLING 5★ (không phải tất cả COOLING)
        const has5StarCooling = filledCardIds.find((id: number) => {
          const card = cardMap.get(id);
          return card && card.type === 'COOLING' && card.rarity === 5;
        });
        if (has5StarCooling) {
          const card = cardMap.get(has5StarCooling);
          return NextResponse.json(
            { error: `🚫 Boss "${quest.bossConfig.name}" nổi giận: Đã từ chối lên đảo thì KHÔNG ĐƯỢC dùng thẻ Làm Mát 5 sao! Thẻ "${card?.name}" bị cấm.` },
            { status: 400 }
          );
        }
        
        const has5Star = cardRarities.includes(5);
        const has4Star = cardRarities.includes(4);
        if (!has5Star || !has4Star) {
          return NextResponse.json(
            { error: `🚫 Boss "${quest.bossConfig.name}" nổi giận: Xe phải có ít nhất 1 thẻ 5 sao và 1 thẻ 4 sao!` },
            { status: 400 }
          );
        }
      }

      // BABY_OIL_CHOICE (Chúa tể dầu em bé): Pre-run check
      if (condition === 'BABY_OIL_CHOICE') {
        if (babyOilChoice === 'YES') {
          // YES branch: no FUEL allowed
          if (cardTypes.includes('FUEL')) {
            return NextResponse.json(
              { error: `🚫 Boss "${quest.bossConfig.name}" nổi giận: Đã nói YES thì cơ thể phải tự cháy, KHÔNG ĐƯỢC dùng thẻ Nhiên Liệu (FUEL)!` },
              { status: 400 }
            );
          }
        }
      }

      // DONALD_TRUMP (Đỗ Nam Trung): Pre-run check
      if (condition === 'DONALD_TRUMP') {
        if (cardRarities.includes(5)) {
          return NextResponse.json(
            { error: `🚫 Boss "${quest.bossConfig.name}" nổi giận: Mọi thẻ 5 sao đều bị khóa khi tao giám sát!` },
            { status: 400 }
          );
        }
      }
    }

    // Fetch combos
    const combos = await prisma.cardCombo.findMany({
      where: {
        OR: [
          { cardId1: { in: filledCardIds }, cardId2: { in: filledCardIds } },
        ],
      },
    });

    // Fetch crew cards (passive buffs)
    const crewBuffs = { power: 0, heat: 0, stability: 0 };
    if (crewCardIds && Array.isArray(crewCardIds)) {
      const crewCards = await prisma.card.findMany({
        where: { id: { in: crewCardIds as number[] }, type: 'CREW' },
        include: { effects: true },
      });
      for (const crew of crewCards) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const effect of (crew as any).effects) {
          if (effect.triggerCondition === 'PASSIVE') {
            if (effect.targetStat === 'POWER') crewBuffs.power += effect.effectValue;
            if (effect.targetStat === 'HEAT') crewBuffs.heat += effect.effectValue;
            if (effect.targetStat === 'STABILITY') crewBuffs.stability += effect.effectValue;
          }
        }
      }
    }

    // ============================================================
    // SEQUENTIAL TEST RUN - Quét tuần tự từ Slot 1 đến Slot 10
    // ============================================================
    const steps: TestStep[] = [];
    let totalPower = 0;
    let totalStability = 0;
    let currentHeat = 0;
    let exploded = false;
    let comboCount = 0;

    // ============================================================
    // RUSSIA_EMPEROR - Hiệu ứng Gấu (Phase 2 NO branch)
    // ============================================================
    let bearBrownActive = false;  // Gấu nâu: 50% giảm 20% power mỗi thẻ
    let bearPandaActive = false;  // Gấu trúc: 30% xoá thẻ khỏi slot (pre-run)
    let bearPolarActive = false;  // Gấu trắng: vô hiệu thẻ cao sao nhất
    const removedSlots: number[] = [];       // Slots bị Gấu trúc xoá
    let frozenCardId: number | null = null;  // Thẻ bị Gấu trắng đóng băng

    if (quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR' && russiaPhase === 2 && vodkaChoice === 'NO') {
      bearBrownActive = true;
      bearPandaActive = true;
      bearPolarActive = true;

      // Gấu trúc ngứa mồm: 30% mỗi slot CÓ thẻ bị xoá thẻ (trước khi chạy)
      for (let i = 0; i < (cardIds as (number | null)[]).length; i++) {
        if ((cardIds as (number | null)[])[i] && Math.random() < 0.3) {
          removedSlots.push(i);
        }
      }

      // Gấu trắng gian trá: tìm thẻ cao sao nhất và đóng băng
      let maxRarity = 0;
      let maxRarityCardId: number | null = null;
      for (let i = 0; i < (cardIds as (number | null)[]).length; i++) {
        const cid = (cardIds as (number | null)[])[i];
        if (!cid) continue;
        const c = cardMap.get(cid);
        if (c && c.rarity > maxRarity && !removedSlots.includes(i)) {
          maxRarity = c.rarity;
          maxRarityCardId = cid;
        }
      }
      frozenCardId = maxRarityCardId;
    }

    // Fetch user cho buff Moskva
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moscowBuffActive = (user as any)?.hasMoscowBuff && (user as any)?.moscowBuffDay === user?.currentDay;

    for (let i = 0; i < cardIds.length; i++) {
      const cardId = (cardIds as (number | null)[])[i];

      // Slot trống → push step rỗng để frontend animate đúng index
      if (!cardId) {
        steps.push({
          slot: i + 1,
          cardId: 0,
          cardName: '(trống)',
          cardType: 'EMPTY',
          rarity: 0,
          powerAdded: 0, heatAdded: 0, stabilityReduced: 0,
          comboTriggered: false, comboEffect: null, comboValue: 0,
          effectTriggered: false, effectDescription: null,
          totalPower, currentHeat: Math.round(currentHeat), exploded: false,
        });
        continue;
      }

      const card = cardMap.get(cardId);

      if (!card) {
        return NextResponse.json(
          { error: `Thẻ ID ${cardId} không tồn tại` },
          { status: 400 }
        );
      }

      // Base stats
      let powerAdded = card.statPower;
      let heatAdded = card.statHeat;
      let stabilityReduced = card.statStability;

      // Buff Hào quang Moskva: +20% power cho tất cả thẻ
      if (moscowBuffActive) {
        powerAdded = Math.floor(powerAdded * 1.2);
      }

      // Gấu trúc: slot bị xoá → thẻ không đóng góp gì
      if (removedSlots.includes(i)) {
        const step: TestStep = {
          slot: i + 1,
          cardId: cardId,
          cardName: card.name,
          cardType: card.type,
          rarity: card.rarity,
          powerAdded: 0, heatAdded: 0, stabilityReduced: 0,
          comboTriggered: false, comboEffect: null, comboValue: 0,
          effectTriggered: true, effectDescription: '🐼 Gấu trúc ngứa mồm đã nuốt thẻ này!',
          totalPower, currentHeat, exploded: false,
        };
        steps.push(step);
        continue; // Skip hẳn thẻ này
      }

      // Gấu trắng: thẻ cao sao nhất bị đóng băng → power = 0
      if (frozenCardId === cardId) {
        powerAdded = 0;
      }

      // Gấu nâu: 50% giảm 20% power
      if (bearBrownActive && Math.random() < 0.5) {
        powerAdded = Math.floor(powerAdded * 0.8);
      }

      // Apply crew buffs
      powerAdded += crewBuffs.power;
      heatAdded = Math.max(0, heatAdded + crewBuffs.heat);
      stabilityReduced += crewBuffs.stability;

      // ============================================================
      // PASSIVE EFFECTS của chính thẻ (luôn có hiệu lực khi được lắp)
      //   SKILL.md §2.4: PASSIVE = luôn luôn có hiệu lực
      // Áp dụng theo effectType (BUFF/DEBUFF) lên powerAdded / heatAdded /
      // stabilityReduced của slot này.
      // ============================================================
      let passiveTriggered = false;
      const passiveDescs: string[] = [];
      for (const effect of card.effects) {
        if (effect.triggerCondition !== 'PASSIVE') continue;
        passiveTriggered = true;
        if (effect.description) passiveDescs.push(effect.description);
        const sign = effect.effectType === 'DEBUFF' ? -1 : 1;
        if (effect.targetStat === 'POWER') {
          powerAdded += sign * effect.effectValue;
        } else if (effect.targetStat === 'HEAT') {
          heatAdded += sign * effect.effectValue;
        } else if (effect.targetStat === 'STABILITY') {
          stabilityReduced += sign * effect.effectValue;
        }
      }

      // Check for combos with adjacent card
      let comboTriggered = false;
      let comboEffect: string | null = null;
      let comboValue = 0;

      // Combo chỉ check nếu slot trước CÓ thẻ
      const prevCardIdRaw = (cardIds as (number | null)[])[i - 1];
      if (i > 0 && prevCardIdRaw) {
        const prevCardId = prevCardIdRaw as number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const combo = combos.find((c: any) =>
          (c.cardId1 === prevCardId && c.cardId2 === cardId) ||
          (c.cardId1 === cardId && c.cardId2 === prevCardId)
        );
        if (combo) {
          comboTriggered = true;
          comboCount++;
          comboEffect = combo.effectType;
          comboValue = combo.effectValue;

          if (combo.effectType === 'MULTIPLY_POWER') {
            powerAdded = Math.floor(powerAdded * combo.effectValue);
          } else if (combo.effectType === 'REDUCE_HEAT') {
            heatAdded = Math.floor(heatAdded * combo.effectValue);
          } else if (combo.effectType === 'BONUS_STABILITY') {
            stabilityReduced += combo.effectValue;
          }
        }
      }

      // Check card effects (ON_TEST type)
      let effectTriggered = passiveTriggered;
      let effectDescription: string | null = passiveDescs.length ? passiveDescs.join(' | ') : null;

      for (const effect of card.effects) {
        if (effect.triggerCondition === 'ON_TEST') {
          effectTriggered = true;
          const onTestDesc = effect.description || '';
          if (effect.targetStat === 'POWER') {
            if (effect.effectType === 'BUFF') {
              // KERS Faster Faster: +5 Power per card scanned before this card, max 9 stacks
              if (onTestDesc.includes('KERS')) {
                const stacks = Math.min(i, 9); // i = number of cards scanned before this one
                const kersBonus = stacks * effect.effectValue;
                powerAdded += kersBonus;
                effectDescription = (effectDescription ? effectDescription + ' | ' : '') + `${onTestDesc} (${stacks} stack${stacks !== 1 ? 's' : ''} = +${kersBonus} Power)`;
              } else {
                powerAdded += effect.effectValue;
                effectDescription = (effectDescription ? effectDescription + ' | ' : '') + onTestDesc;
              }
            } else {
              powerAdded -= effect.effectValue;
              effectDescription = (effectDescription ? effectDescription + ' | ' : '') + onTestDesc;
            }
          } else if (effect.targetStat === 'HEAT') {
            if (effect.effectType === 'DEBUFF') {
              heatAdded += effect.effectValue;
            } else {
              heatAdded -= effect.effectValue;
            }
            effectDescription = (effectDescription ? effectDescription + ' | ' : '') + onTestDesc;
          } else if (effect.targetStat === 'STABILITY') {
            stabilityReduced += effect.effectValue;
            effectDescription = (effectDescription ? effectDescription + ' | ' : '') + onTestDesc;
          }
        }
      }

      // ============================================================
      // BOSS ACTIVE-RUN MODIFIERS
      // ============================================================
      if (quest.bossConfig?.specialCondition) {
        const cond = quest.bossConfig.specialCondition;

        // DRIFT_KING_CHALLENGE: Slot chẵn (index lẻ i % 2 !== 0) bị trượt nhẹ
        if (cond === 'DRIFT_KING_CHALLENGE' && i % 2 !== 0) {
          powerAdded = Math.floor(powerAdded * 1.15); // +15% power
          if (heatAdded < 0) {
            heatAdded = Math.floor(heatAdded / 2); // Giảm một nửa hiệu quả làm mát
          }
          effectTriggered = true;
          effectDescription = (effectDescription ? effectDescription + ' | ' : '') + '🏎️ Trượt ly tâm (Slot Chẵn): +15% Power, Giảm 50% Làm Mát!';
        }

        // DAREDEVIL_DEATH_WISH: Slot 7 (index 6) thốc ga cực mạnh
        if (cond === 'DAREDEVIL_DEATH_WISH' && i === 6) {
          heatAdded += 15;
          effectTriggered = true;
          effectDescription = (effectDescription ? effectDescription + ' | ' : '') + '🔥 Đạp lút ga đi! (Slot 7): Tăng đột ngột +15 Nhiệt độ!';
        }
      }

      // Apply stats
      totalPower += powerAdded;
      totalStability += stabilityReduced;
      currentHeat += heatAdded;
      currentHeat = Math.max(0, currentHeat - stabilityReduced);

      // ============================================================
      // BOSS SPECIAL CONDITIONS (DURING RUN)
      // ============================================================
      if (quest.bossConfig?.specialCondition) {
        const cond = quest.bossConfig.specialCondition;
        // RUSSIA_EMPEROR during-run: heat penalty
        if (cond === 'RUSSIA_EMPEROR') {
          const maxHeatForPhase = (russiaPhase === 2 && vodkaChoice === 'YES') ? 67 : 36;
          if (currentHeat > maxHeatForPhase) {
            currentHeat += 15; // Penalty
          }
        }

      }

      // Check explosion — HOT_HANDS perk raises threshold to 115
      const heatThreshold = (user as any)?.activePerkCode === 'HOT_HANDS'
        ? GAME_CONSTANTS.HEAT_THRESHOLD + 15
        : GAME_CONSTANTS.HEAT_THRESHOLD;
      if (currentHeat >= heatThreshold) {
        exploded = true;
      }

      steps.push({
        slot: i + 1,
        cardId,
        cardName: card.name,
        cardType: card.type,
        rarity: card.rarity,
        powerAdded,
        heatAdded,
        stabilityReduced,
        comboTriggered,
        comboEffect,
        comboValue,
        effectTriggered,
        effectDescription,
        totalPower,
        currentHeat: Math.round(currentHeat),
        exploded,
      });

      if (exploded) break;
    }

    // ============================================================
    // POST-RUN BOSS CONDITIONS (After all 10 slots)
    // ============================================================
    let conditionFailed = false;
    let conditionMessage = '';

    if (!exploded && quest.bossConfig?.specialCondition) {
      const cond = quest.bossConfig.specialCondition;

      // DAREDEVIL_DEATH_WISH: Heat cuối cùng phải ≥ 75% (hoặc ≥ 90% nếu có HOT_HANDS perk)
      if (cond === 'DAREDEVIL_DEATH_WISH') {
        const hasHotHands = (user as any)?.activePerkCode === 'HOT_HANDS';
        const targetHeat = hasHotHands ? 90 : 75; // SKILL.md: ≥75%, với HOT_HANDS là ≥90%
        if (currentHeat < targetHeat) {
          conditionFailed = true;
          conditionMessage = `Cô Gái Liều Lĩnh chê xe chưa đủ nóng! Yêu cầu Nhiệt độ ≥ ${targetHeat}%. Hiện tại: ${Math.round(currentHeat)}%`;
        }
      }

      // DRIFT_KING_CHALLENGE: Tổng Stability ≥ 50 (SKILL.md §5.2)
      if (cond === 'DRIFT_KING_CHALLENGE') {
        if (totalStability < 50) {
          conditionFailed = true;
          conditionMessage = `Ông Hoàng Drift chê xe không đủ cân bằng để drift! Yêu cầu Stability ≥ 50. Hiện tại: ${totalStability}`;
        }
      }

      // EP_ISLAND_CHOICE (Đảo chủ EP) Post-run checks
      if (cond === 'EP_ISLAND_CHOICE') {
        if (epIslandChoice === 'YES') {
          // Nhánh YES: Heat ≤ 69%, ≥1 Combo, Power ≥ 400 (SKILL.md §5.2)
          if (currentHeat > 69) {
            conditionFailed = true;
            conditionMessage = `Đảo chủ EP yêu cầu Nhiệt độ không quá 69%! Hiện tại: ${Math.round(currentHeat)}%`;
          } else if (comboCount < 1) {
            conditionFailed = true;
            conditionMessage = `Đảo chủ EP yêu cầu phải tạo được ít nhất 1 Combo linh kiện!`;
          } else if (totalPower < 400) {
            conditionFailed = true;
            conditionMessage = `Lên đảo phải đủ 400 Power! Hiện tại: ${totalPower}`;
          }
        } else if (epIslandChoice === 'NO') {
          // Nhánh NO: Power ≥ 470 (SKILL.md §5.2: cấm COOLING 5★, cần 1 thẻ 5★ + 1 thẻ 4★)
          if (totalPower < 470) {
            conditionFailed = true;
            conditionMessage = `Từ chối lên đảo thì phải đạt 470 Power! Hiện tại: ${totalPower}`;
          }
        }
      }

      // BABY_OIL_CHOICE (Chúa tể dầu em bé) Post-run checks
      if (cond === 'BABY_OIL_CHOICE') {
        if (babyOilChoice === 'YES') {
           // YES branch requires MIN_HEAT_60 and MAX_POWER_400
           if (currentHeat < 60) {
             conditionFailed = true;
             conditionMessage = `Chúa tể dầu em bé yêu cầu Nhiệt độ ít nhất 60%! Hiện tại: ${Math.round(currentHeat)}%`;
           } else if (totalPower > 400) {
             conditionFailed = true;
             conditionMessage = `Chúa tể dầu em bé yêu cầu Power tốn đa là 400! Hiện tại: ${totalPower}`;
           }
        }
        // NO branch has no special stats condition, it automatically fails later if they chose NO. But wait, if they chose NO, do they just auto-fail the quest?
        // Let's explicitly let them "test" but we will fail it anyway or we can just say success=false if babyOilChoice === 'NO'.
        // Actually, if NO, they don't even need to test, but if they do, we'll let the standard result happen (or force fail). 
        // We will force conditionFailed if NO so it counts as a loss.
        if (babyOilChoice === 'NO') {
          conditionFailed = true;
          conditionMessage = `Bạn đã thảnh thừng từ chối Chúa tể dầu em bé...`;
        }
      }

      // DONALD_TRUMP (Đỗ Nam Trung) Post-run checks: Heat > 47% VÀ Power 400≤470 (SKILL.md §5.2)
      if (cond === 'DONALD_TRUMP') {
         if (currentHeat <= 47) {
            conditionFailed = true;
            conditionMessage = `Đỗ Nam Trung yêu cầu Nhiệt độ phải trên 47%! Hiện tại: ${Math.round(currentHeat)}%`;
         } else if (totalPower < 400 || totalPower > 470) {
            conditionFailed = true;
            conditionMessage = `Đỗ Nam Trung yêu cầu Power trong khoảng 400-470! Hiện tại: ${totalPower}`;
         }
      }
      // RUSSIA_EMPEROR Post-run checks
      if (cond === 'RUSSIA_EMPEROR') {
        const maxHeatForPhase = (russiaPhase === 2 && vodkaChoice === 'YES') ? 67 : 36;
        if (currentHeat > maxHeatForPhase) {
          conditionFailed = true;
          conditionMessage = `Nga Đại Đế yêu cầu Nhiệt độ không quá ${maxHeatForPhase}%! Hiện tại: ${Math.round(currentHeat)}%`;
        }
        // Power check không cần vì "power càng cao càng tốt" — gold = power
      }
    }

    // Determine result
    let success = false;
    if (quest.bossConfig?.specialCondition === 'EP_ISLAND_CHOICE' || quest.bossConfig?.specialCondition === 'BABY_OIL_CHOICE' || quest.bossConfig?.specialCondition === 'DONALD_TRUMP' || quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR') {
      // Nhánh Choice / Dynamic: Power check được xử lý trong Post-run conditionFailed
      success = !exploded && !conditionFailed;
    } else {
      success = !exploded && !conditionFailed && totalPower >= quest.requiredPower;
    }

    return NextResponse.json({
      message: exploded
        ? `💥 NỔ MÁY tại Slot ${steps.length}! Nhiệt độ vượt ${GAME_CONSTANTS.HEAT_THRESHOLD}%!`
        : conditionFailed
        ? `❌ ĐIỀU KIỆN BOSS THẤT BẠI! ${conditionMessage}`
        : success
        ? `✅ THÀNH CÔNG! Xe đạt ${totalPower} mã lực (yêu cầu: ${quest.requiredPower})`
        : `❌ KHÔNG ĐẠT! Xe chỉ đạt ${totalPower}/${quest.requiredPower} mã lực`,
      result: {
        success,
        exploded,
        conditionFailed,
        conditionMessage: conditionMessage || null,
        totalPower,
        totalStability,
        requiredPower: quest.requiredPower,
        finalHeat: Math.round(currentHeat),
        stepsCompleted: steps.length,
        totalSlots: GAME_CONSTANTS.SLOTS_PER_CAR,
      },
      steps,
      questId: quest.id,
      bossInfo: quest.bossConfig ? {
        name: quest.bossConfig.name,
        specialCondition: quest.bossConfig.specialCondition,
      } : null,
      // Extra info cho Russia boss
      ...(quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR' ? {
        russiaReward: {
          dynamicGold: russiaPhase === 2 ? totalPower * 2 : totalPower,
          phase: russiaPhase || 1,
          bearEffects: bearBrownActive ? {
            removedSlots: removedSlots.map(s => s + 1),
            frozenCard: frozenCardId ? cardMap.get(frozenCardId)?.name : null,
          } : null,
          moscowBuffActive: !!moscowBuffActive,
        }
      } : {}),
    });

  } catch (error) {
    console.error('Workshop test error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
