'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface ShopItemData {
  slotIndex: number | string;
  type: 'CARD' | 'BUNDLE' | 'PACK' | 'X2_PACK' | 'CREW';
  name: string;
  description: string | null;
  cost: number;
  rarity: number | null;
  card: {
    id: number;
    name: string;
    type: string;
    rarity: number;
    statPower: number;
    statHeat: number;
    statStability: number;
    imageUrl: string | null;
    effects: Array<{
      id: number;
      effectType: string;
      triggerCondition: string;
      targetStat: string;
      effectValue: number;
      description: string | null;
    }>;
  } | null;
  bundleQuantity: number | null;
}

const RARITY_COLORS: Record<number, string> = {
  1: 'var(--rarity-1)',
  2: 'var(--rarity-2)',
  3: 'var(--rarity-3)',
  4: 'var(--rarity-4)',
  5: 'var(--rarity-5)',
};


interface ShopCardProps {
  item: ShopItemData;
  onClick: (item: ShopItemData) => void;
}

export default function ShopCard({ item, onClick }: ShopCardProps) {
  const rarity = item.rarity || item.card?.rarity || 1;
  const borderColor = RARITY_COLORS[rarity] || RARITY_COLORS[1];
  const glowClass = `rarity-glow-${rarity}`;

  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(item)}
      layout
    >
      {/* Card Image Frame */}
      <div
        className={`shop-card ${glowClass}`}
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        <CardImage item={item} borderColor={borderColor} />

        {/* Bundle Badge */}
        {item.type === 'BUNDLE' && item.bundleQuantity && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: '#dc2626',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 4,
              fontFamily: 'var(--font-pixel)',
            }}
          >
            x{item.bundleQuantity}
          </div>
        )}

        {/* Crew Badge */}
        {item.type === 'CREW' && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              background: 'var(--color-gold)',
              color: '#000',
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
              fontFamily: 'var(--font-pixel)',
            }}
          >
            CREW
          </div>
        )}
      </div>

      {/* Price Tag — separate box below card with small gap */}
      <div
        style={{
          marginTop: '2%',
          padding: '4px 12px',
          background: 'rgba(15, 15, 20, 0.9)',
          borderRadius: 4,
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-pixel)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        💰 {item.cost}g
      </div>
    </motion.div>
  );
}

// Exported helper: resolve card image path by card ID
export function getCardImageSrc(cardId: number, imageUrl?: string | null): string {
  return imageUrl || `/componentcardimg/${cardId}.jpg`;
}

// Helper: resolve card image from /componentcardimg/{id}
function CardImage({ item, borderColor }: { item: ShopItemData; borderColor: string }) {
  const [imgError, setImgError] = useState(0); // 0 = try jpg, 1 = try jpeg, 2 = fallback icon

  if (!item.card) {
    return (
      <div style={{ fontSize: '2rem', color: borderColor, fontFamily: 'var(--font-pixel)' }}>
        {item.type === 'CREW' ? '👤' : '🔧'}
      </div>
    );
  }

  const cardId = item.card.id;

  // Try: imageUrl from DB → /componentcardimg/{id}.jpg → .jpeg → .png → icon fallback
  const getSrc = () => {
    if (imgError === 0) return item.card!.imageUrl || `/componentcardimg/${cardId}.jpg`;
    if (imgError === 1) return `/componentcardimg/${cardId}.jpeg`;
    if (imgError === 2) return `/componentcardimg/${cardId}.png`;
    return '';
  };

  if (imgError >= 3) {
    return (
      <div style={{ fontSize: '2rem', color: borderColor, fontFamily: 'var(--font-pixel)' }}>
        {item.type === 'CREW' ? '👤' : '🔧'}
      </div>
    );
  }

  return (
    <img
      src={getSrc()}
      alt={item.card.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setImgError((e) => e + 1)}
    />
  );
}
