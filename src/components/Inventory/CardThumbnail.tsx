'use client';

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

/** Resolves card image URL — handles full path, relative filename, or falls back to id-based path. */
function resolveCardImg(id: number, imageUrl: string | null): string {
  if (!imageUrl) return `/componentcardimg/${id}.jpg`;
  if (imageUrl.startsWith('/')) return imageUrl;
  return `/componentcardimg/${imageUrl}`;
}

/** Handles image load error — falls back to placeholder. */
function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  target.src = '/componentcardimg/placeholder.jpg';
}

export default function CardThumbnail({ card, quantity, isSelected, onClick }: CardThumbnailProps) {
  const owned = quantity > 0;
  const rarityClass = `rarity${card.rarity}` as keyof typeof styles;
  const imgSrc = resolveCardImg(card.id, card.imageUrl);

  // 3D Tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [17.5, -17.5]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-17.5, 17.5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`
        ${styles.card}
        ${owned ? styles[rarityClass] || '' : styles.unowned}
        ${isSelected ? styles.cardSelected : ''}
        ${card.rarity === 5 && owned ? styles.legendary : ''}
      `}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px' // Perspective set on container via style or CSS
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      title={card.name}
    >
      <div 
        style={{ transform: 'translateZ(20px)' }}
        className="w-full h-full relative flex items-center justify-center rounded-md overflow-hidden"
      >
        {/* Always show real card image, darkened/desaturated for unowned via CSS */}
        <img
          src={imgSrc}
          alt={card.name}
          className={styles.cardImage}
          loading="lazy"
          onError={handleImageError}
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
    </motion.div>
  );
}

