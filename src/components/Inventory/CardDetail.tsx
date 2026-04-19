'use client';

import React from 'react';
import styles from './CardDetail.module.css';
import type { Card, CardEffect } from '@/stores/useInventoryStore';

interface CardDetailProps {
  card: Card | null;
  quantity: number;
}

const RARITY_NAMES: Record<number, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
};

const RARITY_COLORS: Record<number, string> = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#eab308',
};

const TYPE_NAMES: Record<string, string> = {
  ENGINE: 'Động Cơ',
  TURBO: 'Tăng Áp',
  EXHAUST: 'Ống Xả',
  COOLING: 'Làm Mát',
  FILTER: 'Lọc Gió',
  FUEL: 'Nhiên Liệu',
  SUSPENSION: 'Hệ Thống Treo',
  TIRE: 'Lốp Xe',
  NITROUS: 'NOS',
  TOOL: 'Dụng Cụ',
  CREW: 'Đội Ngũ',
};

function getTriggerClass(trigger: string): string {
  switch (trigger) {
    case 'PASSIVE': return styles.triggerPassive;
    case 'ON_TEST': return styles.triggerOnTest;
    case 'ADJACENT': return styles.triggerAdjacent;
    default: return styles.triggerPassive;
  }
}

function getTriggerLabel(trigger: string): string {
  switch (trigger) {
    case 'PASSIVE': return 'Passive';
    case 'ON_TEST': return 'On-Test';
    case 'ADJACENT': return 'Adjacent';
    default: return trigger;
  }
}

/** Resolves image with fallback cascade */
function handleImageError(e: React.SyntheticEvent<HTMLImageElement>, cardId: number) {
  const target = e.target as HTMLImageElement;
  const src = target.src;
  if (src.includes('.jpg') && !src.includes('.jpeg')) {
    target.src = `/componentcardimg/${cardId}.jpeg`;
  } else if (src.includes('.jpeg')) {
    target.src = `/componentcardimg/${cardId}.png`;
  } else {
    target.src = '/componentcardimg/placeholder.jpg';
  }
}

export default function CardDetail({ card, quantity }: CardDetailProps) {
  if (!card) {
    return (
      <div className={styles.emptyPanel}>
        <div className={styles.icon}>🔍</div>
        <p className={styles.hint}>
          BẤM VÀO MỘT LÁ BÀI<br/>
          ĐỂ XEM CHI TIẾT
        </p>
      </div>
    );
  }

  const owned = quantity > 0;
  const imgRarityClass = `imgRarity${card.rarity}` as keyof typeof styles;
  const imgSrc = card.imageUrl || `/componentcardimg/${card.id}.jpg`;

  // Calculate bar widths (scaled to max values)
  const maxPower = 250;
  const maxHeat = 175;
  const maxStability = 120;

  const powerWidth = Math.min(Math.abs(card.statPower) / maxPower * 100, 100);
  const heatWidth = Math.min(Math.abs(card.statHeat) / maxHeat * 100, 100);
  const stabilityWidth = Math.min(Math.abs(card.statStability) / maxStability * 100, 100);

  return (
    <div className={styles.panel} key={card.id}>
      {/* Card Image */}
      <div className={`${styles.imageContainer} ${styles[imgRarityClass] || ''}`}>
        <img
          src={imgSrc}
          alt={card.name}
          loading="lazy"
          onError={(e) => handleImageError(e, card.id)}
        />
      </div>

      {/* Card Info */}
      <div className={styles.cardInfo}>
        <h2 className={styles.cardName}>{card.name}</h2>

        <div className={styles.rarityLine}>
          <span className={styles.stars} style={{ color: RARITY_COLORS[card.rarity] }}>
            {'★'.repeat(card.rarity)}{'☆'.repeat(5 - card.rarity)}
          </span>
          <span style={{ color: RARITY_COLORS[card.rarity], fontSize: 11 }}>
            {RARITY_NAMES[card.rarity]}
          </span>
        </div>

        <div className={styles.rarityLine}>
          <span className={styles.typeBadge}>
            {TYPE_NAMES[card.type] || card.type}
          </span>
        </div>

        {owned && (
          <>
            <div className={styles.costLine}>
              💰 {card.cost}g
            </div>
            <div className={styles.quantityLine}>
              Sở hữu: <strong>×{quantity}</strong>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {owned && card.type !== 'CREW' && (
        <div className={styles.statsSection}>
          <div className={styles.statsTitle}>── CHỈ SỐ ──</div>

          {/* Power */}
          <div className={styles.statRow}>
            <span className={`${styles.statLabel} ${styles.statPower}`}>
              🔥 Power
            </span>
            <div className={styles.statBarTrack}>
              <div
                className={`${styles.statBarFill} ${styles.fillPower}`}
                style={{ width: `${powerWidth}%` }}
              />
            </div>
            <span className={`${styles.statValue} ${styles.statPower}`}>
              {card.statPower > 0 ? '+' : ''}{card.statPower}
            </span>
          </div>

          {/* Heat */}
          <div className={styles.statRow}>
            <span className={`${styles.statLabel} ${styles.statHeat}`}>
              🌡️ Heat
            </span>
            <div className={styles.statBarTrack}>
              <div
                className={`${styles.statBarFill} ${card.statHeat < 0 ? styles.fillNegative : styles.fillHeat}`}
                style={{ width: `${heatWidth}%` }}
              />
            </div>
            <span className={`${styles.statValue} ${card.statHeat < 0 ? styles.statStability : styles.statHeat}`}>
              {card.statHeat > 0 ? '+' : ''}{card.statHeat}
            </span>
          </div>

          {/* Stability */}
          <div className={styles.statRow}>
            <span className={`${styles.statLabel} ${styles.statStability}`}>
              ⚖️ Stability
            </span>
            <div className={styles.statBarTrack}>
              <div
                className={`${styles.statBarFill} ${card.statStability < 0 ? styles.fillHeat : styles.fillStability}`}
                style={{ width: `${stabilityWidth}%` }}
              />
            </div>
            <span className={`${styles.statValue} ${card.statStability < 0 ? styles.statHeat : styles.statStability}`}>
              {card.statStability > 0 ? '+' : ''}{card.statStability}
            </span>
          </div>
        </div>
      )}

      {/* Effects */}
      {owned && card.effects && card.effects.length > 0 && (
        <div className={styles.effectsSection}>
          <div className={styles.effectTitle}>⚡ HIỆU ỨNG ĐẶC BIỆT</div>
          {card.effects.map((effect: CardEffect) => (
            <div key={effect.id} className={styles.effectItem}>
              <span className={`${styles.effectTrigger} ${getTriggerClass(effect.triggerCondition)}`}>
                {getTriggerLabel(effect.triggerCondition)}
              </span>
              {effect.description}
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {owned && card.description && (
        <div className={styles.description}>
          &ldquo;{card.description}&rdquo;
        </div>
      )}

      {/* Unowned notice */}
      {!owned && (
        <div className={styles.unownedNotice}>
          🔒 CHƯA SỞ HỮU<br/>
          Tìm trong Shop hoặc<br/>
          mở Pack để nhận!
        </div>
      )}
    </div>
  );
}
