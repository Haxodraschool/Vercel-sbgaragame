'use client';

import { motion } from 'framer-motion';

interface ShopHUDProps {
  gold: number;
  pityCounter: number;
  nextPityAt: number;
  onClose: () => void;
}

export default function ShopHUD({ gold, pityCounter, nextPityAt, onClose }: ShopHUDProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* Gold Display */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15, 15, 20, 0.85)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
        }}
        key={gold}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <span style={{ fontSize: '1.1rem' }}>💰</span>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1.1rem',
            color: 'var(--color-gold)',
            fontWeight: 700,
            minWidth: 60,
            textAlign: 'right',
          }}
        >
          {gold.toLocaleString()}g
        </span>
      </motion.div>

      {/* Pity Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 15, 20, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
        }}
      >
        <span style={{ fontSize: '0.6rem', color: 'var(--rarity-4)' }}>⭐</span>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
          }}
        >
          Pity: {pityCounter}/10
        </span>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
          }}
        >
          (còn {nextPityAt})
        </span>
      </div>

      {/* Close / Return Button */}
      <motion.button
        onClick={onClose}
        style={{
          marginTop: 4,
          padding: '8px 18px',
          background: 'rgba(15, 15, 20, 0.85)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
        }}
        whileHover={{
          background: 'rgba(30, 30, 40, 0.9)',
          borderColor: 'var(--accent-cyan)',
          color: 'var(--text-primary)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        Trở lại Garage
      </motion.button>
    </div>
  );
}
