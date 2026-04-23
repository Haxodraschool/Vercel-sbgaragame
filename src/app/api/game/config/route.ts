// GET /api/game/config - Game constants & cấu hình
// Public endpoint, không cần auth
import { NextResponse } from 'next/server';

const GAME_CONSTANTS = {
  MAX_DAY: 50,
  MAX_GARAGE_HEALTH: 100,
  MAX_CREW_SLOTS: 5,
  SLOTS_PER_CAR: 10,
  HEAT_THRESHOLD: 100,
  BOSS_INTERVAL: 5,
  FIXED_QUEST_DAYS: 5,
  FINAL_ROUND_BOSSES: 10,
  SHOP_UNLOCK_DAY: 2,
  PACK_CARDS_COUNT: 5,
  PACK_CHANCE_IN_SHOP: 0.1, // 10% per SKILL.md
  SHOP_ITEMS_COUNT: 6,
  PITY_INTERVAL: 10, // Pack thứ 10 đảm bảo 4-5★
  FAIL_HEALTH_PENALTY: 10,
  BOSS_FAIL_HEALTH_PENALTY: 20,
  SUCCESS_EXP: 100,
  BOSS_SUCCESS_EXP: 300,
  SUCCESS_HEALTH_BONUS: 1,
  BOSS_SUCCESS_HEALTH_BONUS: 5,
  TECH_POINTS_PER_DAY: 10,
  CREW_SLOT_COSTS: [0, 50, 100, 200, 350],
  DROP_RATES: {
    1: 0.6,
    2: 0.2,
    3: 0.15,
    4: 0.035,
    5: 0.015,
  },
};

const CARD_TYPES = [
  'ENGINE', 'TURBO', 'EXHAUST', 'COOLING', 'FILTER',
  'FUEL', 'SUSPENSION', 'TIRE', 'NITROUS', 'TOOL', 'CREW',
];

const RARITIES = [
  { stars: 1, name: 'Common', color: 'Xám', dropRate: '60%' },
  { stars: 2, name: 'Uncommon', color: 'Xanh lá', dropRate: '20%' },
  { stars: 3, name: 'Rare', color: 'Xanh dương', dropRate: '15%' },
  { stars: 4, name: 'Epic', color: 'Tím', dropRate: '3.5%' },
  { stars: 5, name: 'Legendary', color: 'Vàng', dropRate: '1.5%' },
];

export async function GET() {
  return NextResponse.json({
    constants: GAME_CONSTANTS,
    cardTypes: CARD_TYPES,
    rarities: RARITIES,
  });
}
