import { create } from 'zustand';

export type TutorialStepId =
  | 'lobby-shadow'
  | 'lobby-accept'
  | 'ws-slots'
  | 'ws-inventory'
  | 'ws-analysis'
  | 'ws-quest'
  | 'ws-heat'
  | 'ws-power';

const TUTORIAL_STEP_ORDER: TutorialStepId[] = [
  'lobby-shadow',
  'lobby-accept',
  'ws-slots',
  'ws-inventory',
  'ws-analysis',
  'ws-quest',
  'ws-heat',
  'ws-power',
];

const STORAGE_KEY = 'sb-tutorial-day1-completed';

interface TutorialState {
  isActive: boolean;
  currentStep: TutorialStepId | null;
  isCompleted: boolean;

  startStep: (stepId: TutorialStepId) => void;
  nextStep: () => void;
  complete: () => void;
  skip: () => void;
  checkCompletion: () => void;
  /** Dev reset — clears localStorage and re-enables tutorial */
  devReset: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  isActive: false,
  currentStep: null,
  isCompleted: false,

  startStep: (stepId) => {
    const { isCompleted } = get();
    if (isCompleted) return;
    set({ isActive: true, currentStep: stepId });
  },

  nextStep: () => {
    const { currentStep, isCompleted } = get();
    if (isCompleted || !currentStep) return;

    const idx = TUTORIAL_STEP_ORDER.indexOf(currentStep);
    if (idx === -1 || idx >= TUTORIAL_STEP_ORDER.length - 1) {
      // Last step — complete tutorial (persists to localStorage)
      get().complete();
      return;
    }
    set({ currentStep: TUTORIAL_STEP_ORDER[idx + 1] });
  },

  complete: () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    set({ isActive: false, currentStep: null, isCompleted: true });
  },

  // Skip = session only. Does NOT persist to localStorage.
  // Tutorial will show again on next login.
  skip: () => {
    set({ isActive: false, currentStep: null, isCompleted: true });
  },

  checkCompletion: () => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        set({ isCompleted: true, isActive: false, currentStep: null });
      }
    } catch {}
  },

  devReset: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    set({ isActive: false, currentStep: null, isCompleted: false });
  },
}));
