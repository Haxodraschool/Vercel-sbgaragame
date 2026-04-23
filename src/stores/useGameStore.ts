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

  // Music State — nhạc boss được chọn ở Lobby, tiếp tục phát sang Workshop
  activeBossMusic: string | null; // e.g. '/gamemusic/babyoilboss.mp3'

  // Modals
  isTopupGoldModalOpen: boolean;
  isBuyTpModalOpen: boolean;

  // Loading progress tracking (cho LoadingScreen)
  loadingPending: string[]; // list of pending task IDs
  loadingTotal: number;      // total tasks registered in current transition
  loadingLabel: string;      // latest status label ("Đang tải thuộc tính...")

  // Actions
  initializeStore: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  setTopupGoldModalOpen: (open: boolean) => void;
  setBuyTpModalOpen: (open: boolean) => void;
  /** Transition to a destination screen WITH a loading overlay; call markScreenReady() from destination when its resources are fully loaded. */
  transitionScreen: (screen: GameState['currentScreen']) => void;
  markScreenReady: () => void;
  /** Register a loading task (shows in progress bar). Call completeTask(id) when done. */
  registerTask: (taskId: string, label?: string) => void;
  /** Mark a loading task complete. When all tasks complete, automatically marks screen ready. */
  completeTask: (taskId: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveQuest: (quest: any | null) => void;
  setBossChoice: (choice: BossChoiceData | null) => void;
  setSkipShadowIntro: (skip: boolean) => void;
  setActiveBossMusic: (track: string | null) => void;
  updateGold: (gold: number) => void;
  updateGarageHealth: (health: number) => void;
  updateTechPoints: (tp: number) => void;
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
  activeBossMusic: null,
  isTopupGoldModalOpen: false,
  isBuyTpModalOpen: false,
  loadingPending: [],
  loadingTotal: 0,
  loadingLabel: '',

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
      loadingPending: [],
      loadingTotal: 0,
      loadingLabel: '',
    })),

  markScreenReady: () =>
    set({ isTransitioning: false, loadingPending: [], loadingTotal: 0, loadingLabel: '' }),

  registerTask: (taskId, label) =>
    set((state) => {
      if (state.loadingPending.includes(taskId)) return state;
      return {
        loadingPending: [...state.loadingPending, taskId],
        loadingTotal: state.loadingTotal + 1,
        loadingLabel: label || state.loadingLabel,
      };
    }),

  completeTask: (taskId) =>
    set((state) => {
      const nextPending = state.loadingPending.filter((t) => t !== taskId);
      // Auto-mark ready when all tasks complete during a transition
      const allDone = state.isTransitioning && state.loadingTotal > 0 && nextPending.length === 0;
      return {
        loadingPending: nextPending,
        isTransitioning: allDone ? false : state.isTransitioning,
        loadingTotal: allDone ? 0 : state.loadingTotal,
        loadingLabel: allDone ? '' : state.loadingLabel,
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setActiveQuest: (quest) => set({ activeQuestId: quest?.id || null, activeQuest: quest }),
  setBossChoice: (choice) => set({ bossChoice: choice }),
  setSkipShadowIntro: (skip) => set({ skipShadowIntro: skip }),
  setActiveBossMusic: (track) => set({ activeBossMusic: track }),

  updateGold: (gold) => set((state) => ({
    user: state.user ? { ...state.user, gold } : null,
  })),

  updateGarageHealth: (health) => set((state) => ({
    user: state.user ? { ...state.user, garageHealth: health } : null,
  })),

  updateTechPoints: (tp) => set((state) => ({
    user: state.user ? { ...state.user, techPoints: tp } : null,
  })),

  setTopupGoldModalOpen: (open) => set({ isTopupGoldModalOpen: open }),
  setBuyTpModalOpen: (open) => set({ isBuyTpModalOpen: open }),

  logout: () => {
    localStorage.removeItem('sb-token');
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      currentScreen: 'login',
      activeQuestId: null,
      activeBossMusic: null,
    });
  },
}));
