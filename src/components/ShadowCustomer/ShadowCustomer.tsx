'use client';

import React, { useState } from 'react';
import styles from './ShadowCustomer.module.css';

export interface QuestData {
  id: number;
  requiredPower: number;
  rewardGold: number;
  isBoss: boolean;
  bossConfig?: {
    name: string;
    description?: string;
    imageUrl?: string;
  } | null;
  status: string;
}

interface Props {
  quest: QuestData;
  seatPosition: { left: string; top: string; sofa: string };
  isInteractive: boolean;
  isLeaving: boolean;
  onShadowClick: (quest: QuestData) => void;
}

// shadowsitleft.png / shadowsitright.png: 6 frames each (1 row)
const SIT_FRAMES = 6;

export default function ShadowCustomer({
  quest,
  seatPosition,
  isInteractive,
  isLeaving,
  onShadowClick,
}: Props) {
  // Random sitting pose: pick 1 of 4 frames from sitleft/sitright
  const [sitPose] = useState(() => Math.floor(Math.random() * SIT_FRAMES));



  const handleClick = () => {
    if (!isInteractive || quest.status !== 'PENDING') return;
    onShadowClick(quest);
  };

  const isRightSofa = seatPosition.sofa === 'right';

  const containerClass = [
    styles.shadowContainer,
    styles.visible,
    styles.spawnAnimation, // Add a tiny pop-in animation
    isInteractive ? styles.interactive : '',
    isLeaving ? styles.leaving : '',
  ].filter(Boolean).join(' ');

  // 6 frames, background-size: 600% → mỗi frame cách nhau 20%
  const sitBgPosX = `${sitPose * 20}%`;

  return (
    <div
      className={containerClass}
      style={{
        left: seatPosition.left,
        top: seatPosition.top,
      }}
      onClick={handleClick}
    >
      {/* Sitting pose — same sprite for both boss and normal shadows */}
      <div
        className={`${styles.sitSprite} ${isRightSofa ? styles.sitSpriteRight : styles.sitSpriteLeft}`}
        style={{
          backgroundPosition: `${sitBgPosX} 0%`,
        }}
      />
    </div>
  );
}
