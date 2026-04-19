'use client';

import React from 'react';
import styles from './CardThumbnail.module.css';

interface CardData {
  id: number;
  name: string;
  rarity: number;
  imageUrl: string | null;
}

interface CardThumbnailProps {
  card: CardData;
  quantity: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Resolves the card image URL, trying multiple extensions.
 * Card images in /componentcardimg/ use mixed extensions (.jpg, .jpeg, .png).
 */
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

export default function CardThumbnail({ card, quantity, isSelected, onClick }: CardThumbnailProps) {
  const owned = quantity > 0;
  const rarityClass = `rarity${card.rarity}` as keyof typeof styles;
  // Always use the real card image based on card ID
  const imgSrc = card.imageUrl || `/componentcardimg/${card.id}.jpg`;

  return (
    <div
      className={`
        ${styles.card}
        ${owned ? styles[rarityClass] || '' : styles.unowned}
        ${isSelected ? styles.cardSelected : ''}
        ${card.rarity === 5 && owned ? styles.legendary : ''}
      `}
      onClick={onClick}
      title={card.name}
    >
      {/* Always show real card image, darkened/desaturated for unowned via CSS */}
      <img
        src={imgSrc}
        alt={card.name}
        className={styles.cardImage}
        loading="lazy"
        onError={(e) => handleImageError(e, card.id)}
      />

      {/* Quantity badge for owned cards */}
      {owned && (
        <div className={styles.quantityBadge}>
          ×{quantity}
        </div>
      )}

      {/* Lock icon for unowned cards */}
      {!owned && (
        <div className={styles.unownedBadge}>🔒</div>
      )}

      {/* Card name on hover */}
      <div className={styles.cardName}>
        {card.name}
      </div>
    </div>
  );
}

