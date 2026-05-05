'use client';

import React from 'react';
import styles from './BossTitle.module.css';

/**
 * BossTitle — renders event/boss names with distinctive animated effects.
 * Each boss type gets a unique visual identity (color, glow, animation).
 * Falls back to a default style for regular NPCs.
 */

export type BossTheme =
  | 'oil_gangster'    // Băng Đảng Xăng Dầu — orange fire
  | 'kim'             // Kim Jong Un — blood red  
  | 'trump'           // Donald Trump — gold luxury
  | 'russia'          // Nga Đại Đế — icy blue
  | 'ep_island'       // Đảo Chủ EP — tropical green
  | 'baby_oil'        // Baby Oil — toxic purple
  | 'drift_king'      // Ông Hoàng Drift — neon cyan
  | 'f1_legend'       // Huyền Thoại F1 — racing red
  | 'collector'       // Nhà Sưu Tập — legendary gold
  | 'daredevil_girl'  // Cô Gái Liều Lĩnh — hot pink
  | 'mysterious'      // Bí Ẩn — ghostly white
  | 'npc'             // Regular NPC — subtle
  | 'event';          // Generic event — warning yellow

interface BossTitleProps {
  name: string;
  theme?: BossTheme;
  /** If true, auto-detect theme from the name string */
  autoDetect?: boolean;
  className?: string;
}

/** Auto-detect boss theme from name */
function detectTheme(name: string): BossTheme {
  const n = name.toLowerCase();
  if (n.includes('xăng dầu') || n.includes('băng đảng')) return 'oil_gangster';
  if (n.includes('chủ tịch') || n.includes('kim')) return 'kim';
  if (n.includes('đỗ nam trung') || n.includes('trump')) return 'trump';
  if (n.includes('đại đế') || n.includes('nga')) return 'russia';
  if (n.includes('đảo chủ') || n.includes('ep')) return 'ep_island';
  if (n.includes('dầu em bé') || n.includes('baby oil')) return 'baby_oil';
  if (n.includes('drift') || n.includes('hoàng drift')) return 'drift_king';
  if (n.includes('f1') || n.includes('huyền thoại')) return 'f1_legend';
  if (n.includes('sưu tập') || n.includes('collector')) return 'collector';
  if (n.includes('liều lĩnh') || n.includes('cô gái')) return 'daredevil_girl';
  if (n.includes('bí ẩn') || n.includes('mysterious')) return 'mysterious';
  return 'event';
}

export default function BossTitle({ name, theme, autoDetect = true, className = '' }: BossTitleProps) {
  const resolvedTheme = theme || (autoDetect ? detectTheme(name) : 'event');

  return (
    <span
      className={`${styles.bossTitle} ${styles[resolvedTheme]} ${className}`}
      data-text={name}
    >
      {/* Warning icon for bosses/events */}
      {resolvedTheme !== 'npc' && (
        <span className={styles.icon}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
          </svg>
        </span>
      )}
      {resolvedTheme === 'npc' && (
        <span className={styles.icon}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </span>
      )}
      <span className={styles.text}>{name}</span>
      {/* Glitch layers for boss themes */}
      {resolvedTheme !== 'npc' && (
        <>
          <span className={styles.glitch1} aria-hidden="true">{name}</span>
          <span className={styles.glitch2} aria-hidden="true">{name}</span>
        </>
      )}
    </span>
  );
}

/**
 * Simple version for Workshop HUD (no glitch, just styled)
 */
export function BossTitleCompact({ name, isBoss }: { name: string; isBoss: boolean }) {
  const resolvedTheme = isBoss ? detectTheme(name) : 'npc';

  return (
    <span className={`${styles.compact} ${styles[resolvedTheme]}`}>
      {name}
    </span>
  );
}
