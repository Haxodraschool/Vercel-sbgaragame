// Auth Utilities - JWT & Password Hashing
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'sb-garage-default-secret';
const SALT_ROUNDS = 10;

// ============================================================
// Password Hashing
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================
// JWT Token
// ============================================================

export interface JwtPayload {
  userId: number;
  username: string;
}

export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ============================================================
// Request Authentication
// ============================================================

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticateRequest(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// ============================================================
// Game Constants
// ============================================================

export const GAME_CONSTANTS = {
  MAX_DAY: 50,
  MAX_GARAGE_HEALTH: 100,
  MAX_CREW_SLOTS: 5,
  SLOTS_PER_CAR: 10,
  HEAT_THRESHOLD: 100,
  BOSS_INTERVAL: 5, // Boss xuất hiện mỗi 5 ngày
  FIXED_QUEST_DAYS: 5, // Ngày 1-5 quest cố định
  FINAL_ROUND_BOSSES: 10,
  SHOP_UNLOCK_DAY: 2,
  PACK_CARDS_COUNT: 5,
  PACK_CHANCE_IN_SHOP: 0.1, // 10% chance pack xuất hiện
  SHOP_ITEMS_COUNT: 6,

  // Drop rates
  DROP_RATES: {
    1: 0.60,  // Common (Xám) - 60%
    2: 0.20,  // Uncommon (Xanh lá) - 20%
    3: 0.15,  // Rare (Xanh dương) - 15%
    4: 0.035, // Epic (Tím) - 3.5%
    5: 0.015, // Legendary (Vàng) - 1.5%
  } as Record<number, number>,

  // Garage health penalty on fail
  FAIL_HEALTH_PENALTY: 10,
  BOSS_FAIL_HEALTH_PENALTY: 20,

  // EXP rewards
  SUCCESS_EXP: 100,
  BOSS_SUCCESS_EXP: 300,
  TECH_POINTS_PER_DAY: 10,

  // Garage health bonus on success
  SUCCESS_HEALTH_BONUS: 1,       // +1 uy tín khi thắng quest thường
  BOSS_SUCCESS_HEALTH_BONUS: 5,  // +5 uy tín khi thắng boss

  // Crew slot upgrade cost
  CREW_SLOT_COSTS: [0, 50, 100, 200, 350] as number[],

  // Starter Perk codes
  PERK_CODES: {
    STARTUP_FUND: 'STARTUP_FUND',       // +200 Gold
    OLD_STASH: 'OLD_STASH',             // 5 thẻ 2-3★
    HOT_HANDS: 'HOT_HANDS',             // Ngưỡng nổ +15
    CONNECTIONS: 'CONNECTIONS',           // +1 crew slot
    VIP_CARD: 'VIP_CARD',               // Shop -20% 10 ngày đầu
    TECH_GENIUS: 'TECH_GENIUS',          // +100 Tech Points
  },
};

// Hàm random theo drop rate
export function rollRarity(): number {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, rate] of Object.entries(GAME_CONSTANTS.DROP_RATES)) {
    cumulative += rate;
    if (roll <= cumulative) return parseInt(rarity);
  }
  return 1; // fallback Common
}

// Hàm random trong khoảng min-max
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
