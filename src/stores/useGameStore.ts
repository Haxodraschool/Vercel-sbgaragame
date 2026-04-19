// ============================================
// Zustand Store — Game State
// ============================================
import { create } from 'zustand';

interface UserProfile {
  id: number;
  username: string;
  gold: number;
  level: number;
  exp: number;
  currentDay: number;
  garageHealth: number;
  techPoints: number;
  crewSlots: number;
  isFinalRound: boolean;
  activePerkCode: string | null;
}

// Boss-specific choice data passed from dialog to workshop
export interface BossChoiceData {
  epIslandChoice?: 'YES' | 'NO';
  babyOilChoice?: 'YES' | 'NO';
  kimChoice?: 'YES' | 'NO';
  russiaPhase?: number;
  vodkaChoice?: 'YES' | 'NO';
}

interface GameState {
  // Auth
  token: string | null;
  isAuthenticated: boolean;

  // User
  user: UserProfile | null;

  // UI State
  currentScreen: 'login' | 'lobby' | 'workshop' | 'testrun' | 'shop' | 'event' | 'endday' | 'ending';
  isLoading: boolean;
  isTransitioning: boolean; // true when a loading screen should cover the destination until resources ready
  transitionKey: number; // increments per transition — destination screens use this to guard stale markReady() calls
  activeQuestId: number | null;
  activeQuest: any | null; // Storing full QuestData object
  bossChoice: BossChoiceData | null; // Stores boss-specific choices for workshop
  skipShadowIntro: boolean; // Skip shadow-walking animation khi quay lại lobby từ workshop

  // Actions
  initializeStore: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  /** Transition to a destination screen WITH a loading overlay; call markScreenReady() from destination when its resources are fully loaded. */
  transitionScreen: (screen: GameState['currentScreen']) => void;
  markScreenReady: () => void;
  setLoading: (loading: boolean) => void;
  setActiveQuest: (quest: any | null) => void;
  setBossChoice: (choice: BossChoiceData | null) => void;
  setSkipShadowIntro: (skip: boolean) => void;
  updateGold: (gold: number) => void;
  updateGarageHealth: (health: number) => void;
  logout: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state (không lấy từ localStorage qua init render)
  token: null,
  isAuthenticated: false,
  user: null,
  currentScreen: 'login',
  isLoading: true,
  isTransitioning: false,
  transitionKey: 0,
  activeQuestId: null,
  activeQuest: null,
  bossChoice: null,
  skipShadowIntro: false,

  // Actions
  initializeStore: () => {
    const savedToken = localStorage.getItem('sb-token');
    if (savedToken) {
      set({ token: savedToken, isAuthenticated: true });
    }
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('sb-token', token);
    } else {
      localStorage.removeItem('sb-token');
    }
    set({ token, isAuthenticated: !!token });
  },

  setUser: (user) => set({ user }),

  setScreen: (screen) => set({ currentScreen: screen, isTransitioning: false }),

  transitionScreen: (screen) =>
    set((state) => ({
      currentScreen: screen,
      isTransitioning: true,
      transitionKey: state.transitionKey + 1,
    })),

  markScreenReady: () => set({ isTransitioning: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setActiveQuest: (quest) => set({ activeQuestId: quest?.id || null, activeQuest: quest }),
  setBossChoice: (choice) => set({ bossChoice: choice }),
  setSkipShadowIntro: (skip) => set({ skipShadowIntro: skip }),

  updateGold: (gold) => set((state) => ({
    user: state.user ? { ...state.user, gold } : null,
  })),

  updateGarageHealth: (health) => set((state) => ({
    user: state.user ? { ...state.user, garageHealth: health } : null,
  })),

  logout: () => {
    localStorage.removeItem('sb-token');
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      currentScreen: 'login',
      activeQuestId: null,
    });
  },
}));
