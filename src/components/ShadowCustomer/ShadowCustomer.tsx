'use client';

import React, { useState } from 'react';
import styles from './ShadowCustomer.module.css';
import spriteAtlas from '../../data/shadow-sit-atlas.json';

export interface QuestData {
  id: number;
  requiredPower: number;
  rewardGold: number;
  isBoss: boolean;
  bossConfig?: {
    name: string;
    description?: string;
    imageUrl?: string;
    specialCondition?: string;
  } | null;
  status: string;
  customerBudget?: number;
}

interface Props {
  quest: QuestData;
  seatPosition: { left: string; top: string; sofa: string };
  isInteractive: boolean;
  isLeaving: boolean;
  onShadowClick: (quest: QuestData) => void;
  zIndex?: number;
}

// Sprite atlas types
type Frame = { x: number; y: number; w: number; h: number };
type AtlasEntry = { frames: Frame[]; width: number; height: number; src: string };
type SpriteAtlas = { frames: { shadowsitleft: AtlasEntry; shadowsitright: AtlasEntry } };

export default function ShadowCustomer({
  quest,
  seatPosition,
  isInteractive,
  isLeaving,
  onShadowClick,
  zIndex,
}: Props) {
  const atlas = (spriteAtlas as unknown as SpriteAtlas).frames;
  const spriteKey = seatPosition.sofa === 'right' ? 'shadowsitright' : 'shadowsitleft';
  const spriteData = atlas[spriteKey];
  
  // Random sitting pose: pick 1 of 6 frames
  const [sitPose] = useState(() => Math.floor(Math.random() * spriteData.frames.length));
  const frame = spriteData.frames[sitPose];

  const handleClick = () => {
    if (!isInteractive || quest.status !== 'PENDING') return;
    onShadowClick(quest);
  };

  const containerClass = [
    styles.shadowContainer,
    styles.visible,
    styles.spawnAnimation, // Add a tiny pop-in animation
    isInteractive ? styles.interactive : '',
    isLeaving ? styles.leaving : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClass}
      style={{
        left: seatPosition.left,
        top: seatPosition.top,
        zIndex: zIndex !== undefined ? zIndex : undefined,
      }}
      onClick={handleClick}
    >
      {/* Sitting pose — using JSON atlas with exact pixel coordinates */}
      <div
        className={styles.sitSprite}
        style={{
          // Exact pixel coordinates from JSON atlas
          aspectRatio: `${frame.w} / ${frame.h}`,
          backgroundImage: `url(${spriteData.src})`,
          backgroundSize: `${spriteData.width}px ${spriteData.height}px`,
          backgroundPosition: `-${frame.x}px -${frame.y}px`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}
