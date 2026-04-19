'use client';

import React from 'react';
import styles from './TypeTabs.module.css';

const CARD_TYPES = [
  { key: 'ALL', label: 'TẤT CẢ', icon: '📋', styleKey: '' },
  { key: 'ENGINE', label: 'Đ.CƠ', icon: '⚙️', styleKey: 'typeEngine' },
  { key: 'TURBO', label: 'TURBO', icon: '💨', styleKey: 'typeTurbo' },
  { key: 'EXHAUST', label: 'Ố.XẢ', icon: '🔥', styleKey: 'typeExhaust' },
  { key: 'COOLING', label: 'L.MÁT', icon: '❄️', styleKey: 'typeCooling' },
  { key: 'FILTER', label: 'L.GIÓ', icon: '🌬️', styleKey: 'typeFilter' },
  { key: 'FUEL', label: 'N.LIỆU', icon: '⛽', styleKey: 'typeFuel' },
  { key: 'SUSPENSION', label: 'TREO', icon: '🔩', styleKey: 'typeSuspension' },
  { key: 'TIRE', label: 'LỐP', icon: '🛞', styleKey: 'typeTire' },
  { key: 'NITROUS', label: 'NOS', icon: '💥', styleKey: 'typeNitrous' },
  { key: 'TOOL', label: 'D.CỤ', icon: '🔧', styleKey: 'typeTool' },
  { key: 'CREW', label: 'CREW', icon: '👥', styleKey: 'typeCrew' },
] as const;

interface TypeTabsProps {
  activeType: string;
  onTypeChange: (type: string) => void;
  /** Map of type -> { owned: number, total: number } */
  typeCounts: Record<string, { owned: number; total: number }>;
}

export default function TypeTabs({ activeType, onTypeChange, typeCounts }: TypeTabsProps) {
  return (
    <div className={styles.tabStrip}>
      {CARD_TYPES.map(({ key, label, icon, styleKey }) => {
        const isActive = activeType === key;
        const counts = typeCounts[key] || { owned: 0, total: 0 };

        return (
          <button
            key={key}
            className={`
              ${styles.tab}
              ${isActive ? styles.tabActive : ''}
              ${styleKey ? styles[styleKey as keyof typeof styles] || '' : ''}
            `}
            onClick={() => onTypeChange(key)}
            title={`${label} (${counts.owned}/${counts.total})`}
          >
            <span className={styles.tabIcon}>{icon}</span>
            <span className={styles.tabLabel}>{label}</span>
            <span className={styles.tabCount}>
              {counts.owned}/{counts.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { CARD_TYPES };
