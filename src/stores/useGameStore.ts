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

interface GameState {
  // Auth
  token: string | null;
  isAuthenticated: boolean;

  // User
  user: UserProfile | null;

  // UI State
  currentScreen: 'login' | 'lobby' | 'workshop' | 'testrun' | 'shop' | 'event' | 'endday' | 'ending';
  isLoading: boolean;
  activeQuestId: number | null;

  // Actions
  initializeStore: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  setLoading: (loading: boolean) => void;
  setActiveQuest: (questId: number | null) => void;
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
  isLoading: false,
  activeQuestId: null,

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

  setScreen: (screen) => set({ currentScreen: screen }),

  setLoading: (loading) => set({ isLoading: loading }),

  setActiveQuest: (questId) => set({ activeQuestId: questId }),

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
