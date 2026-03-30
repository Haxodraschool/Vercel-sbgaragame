// ============================================
// Zustand Store — Inventory & Cards
// ============================================
import { create } from 'zustand';

export interface CardEffect {
  id: number;
  triggerCondition: string;
  targetStat: string;
  effectType: string;
  effectValue: number;
  description: string;
}

export interface Card {
  id: number;
  name: string;
  type: string;
  rarity: number;
  statPower: number;
  statHeat: number;
  statStability: number;
  cost: number;
  imageUrl: string | null;
  description: string;
  effects: CardEffect[];
}

export interface InventoryItem {
  cardId: number;
  quantity: number;
  card: Card;
}

interface InventoryState {
  // Inventory
  items: InventoryItem[];

  // Workshop Slots (10 card slots + crew slots)
  carSlots: (Card | null)[];
  crewSlots: (Card | null)[];

  // Actions
  setInventory: (items: InventoryItem[]) => void;
  setCarSlot: (slotIndex: number, card: Card | null) => void;
  setCrewSlot: (slotIndex: number, card: Card | null) => void;
  clearAllSlots: () => void;
  getCardsByType: (type: string) => InventoryItem[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  carSlots: Array(10).fill(null),
  crewSlots: Array(5).fill(null),

  setInventory: (items) => set({ items }),

  setCarSlot: (slotIndex, card) => set((state) => {
    const newSlots = [...state.carSlots];
    newSlots[slotIndex] = card;
    return { carSlots: newSlots };
  }),

  setCrewSlot: (slotIndex, card) => set((state) => {
    const newSlots = [...state.crewSlots];
    newSlots[slotIndex] = card;
    return { crewSlots: newSlots };
  }),

  clearAllSlots: () => set({
    carSlots: Array(10).fill(null),
    crewSlots: Array(5).fill(null),
  }),

  getCardsByType: (type) => {
    return get().items.filter((item) => item.card.type === type);
  },
}));
