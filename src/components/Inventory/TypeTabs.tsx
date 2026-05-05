'use client';

import React from 'react';
import styles from './TypeTabs.module.css';
import { CategoryIcon } from '@/components/CategoryIcons';

const CARD_TYPES = [
  { key: 'ALL', label: 'TẤT CẢ', styleKey: '' },
  { key: 'ENGINE', label: 'Đ.CƠ', styleKey: 'typeEngine' },
  { key: 'TURBO', label: 'TURBO', styleKey: 'typeTurbo' },
  { key: 'EXHAUST', label: 'Ố.XẢ', styleKey: 'typeExhaust' },
  { key: 'COOLING', label: 'L.MÁT', styleKey: 'typeCooling' },
  { key: 'FILTER', label: 'L.GIÓ', styleKey: 'typeFilter' },
  { key: 'FUEL', label: 'N.LIỆU', styleKey: 'typeFuel' },
  { key: 'SUSPENSION', label: 'TREO', styleKey: 'typeSuspension' },
  { key: 'TIRE', label: 'LỐP', styleKey: 'typeTire' },
  { key: 'NITROUS', label: 'NOS', styleKey: 'typeNitrous' },
  { key: 'TOOL', label: 'D.CỤ', styleKey: 'typeTool' },
  { key: 'CREW', label: 'CREW', styleKey: 'typeCrew' },
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
      {CARD_TYPES.map(({ key, label, styleKey }) => {
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
            <span className={styles.tabIcon}><CategoryIcon type={key} size={16} /></span>
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

