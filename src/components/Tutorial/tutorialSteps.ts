import type { TutorialStepId } from '@/stores/useTutorialStore';

export interface TutorialStepConfig {
  id: TutorialStepId;
  targetSelector: string;
  spotlightRadius: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  text: string;
  clickToAdvance: boolean;
  screen: 'lobby' | 'workshop';
}

export const TUTORIAL_STEPS: Record<TutorialStepId, TutorialStepConfig> = {
  'lobby-shadow': {
    id: 'lobby-shadow',
    targetSelector: '[data-tutorial="shadow-0"]',
    spotlightRadius: 100,
    arrowPosition: 'top',
    text: 'Click vào khách hàng này\nđể nhận quest!',
    clickToAdvance: true,
    screen: 'lobby',
  },
  'lobby-accept': {
    id: 'lobby-accept',
    targetSelector: '[data-tutorial="quest-accept-btn"]',
    spotlightRadius: 80,
    arrowPosition: 'top',
    text: 'Click để nhận quest\nvào xưởng lắp ráp!',
    clickToAdvance: true,
    screen: 'lobby',
  },
  'ws-slots': {
    id: 'ws-slots',
    targetSelector: '[data-tutorial="ws-slots"]',
    spotlightRadius: 160,
    arrowPosition: 'bottom',
    text: 'Đây là vị trí lắp thẻ.\nKéo thẻ từ kho vào đây!',
    clickToAdvance: false,
    screen: 'workshop',
  },
  'ws-inventory': {
    id: 'ws-inventory',
    targetSelector: '[data-tutorial="ws-sidebar"]',
    spotlightRadius: 140,
    arrowPosition: 'right',
    text: 'Click vào những mục linh kiện\nnày để chọn thẻ bạn muốn.',
    clickToAdvance: false,
    screen: 'workshop',
  },
  'ws-analysis': {
    id: 'ws-analysis',
    targetSelector: '[data-tutorial="ws-analysis"]',
    spotlightRadius: 180,
    arrowPosition: 'bottom',
    text: 'Những thứ bạn cần và thiếu\nhay bị cấm nếu có.',
    clickToAdvance: false,
    screen: 'workshop',
  },
  'ws-quest': {
    id: 'ws-quest',
    targetSelector: '[data-tutorial="ws-quest-box"]',
    spotlightRadius: 160,
    arrowPosition: 'left',
    text: 'Bạn có thể xem tiền thưởng\nvà yêu cầu của khách hàng tại đây.',
    clickToAdvance: false,
    screen: 'workshop',
  },
  'ws-heat': {
    id: 'ws-heat',
    targetSelector: '[data-tutorial="ws-heat-bar"]',
    spotlightRadius: 100,
    arrowPosition: 'bottom',
    text: 'Bạn sẽ bị tính là thua nếu không đủ\npower hay heat vượt 100%\ntrong quá trình chạy thử!',
    clickToAdvance: false,
    screen: 'workshop',
  },
  'ws-power': {
    id: 'ws-power',
    targetSelector: '[data-tutorial="ws-power-bar"]',
    spotlightRadius: 100,
    arrowPosition: 'bottom',
    text: 'Bạn cần tính toán và nhớ power\nbạn đã có vì nó sẽ bị ẩn\ncho tới khi bạn chạy thử xe!',
    clickToAdvance: false,
    screen: 'workshop',
  },
};

export function getStepConfig(stepId: TutorialStepId): TutorialStepConfig {
  return TUTORIAL_STEPS[stepId];
}
