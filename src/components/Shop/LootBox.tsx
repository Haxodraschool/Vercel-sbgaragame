'use client';

import { motion } from 'framer-motion';
import { ShopItemData } from './ShopCard';

interface LootBoxProps {
  packItems: ShopItemData[];
  onClick: () => void;
}

export default function LootBox({ packItems, onClick }: LootBoxProps) {
  if (packItems.length === 0) return null;

  const hasX2 = packItems.some((p) => p.type === 'X2_PACK');
  const totalPacks = packItems.reduce((sum, p) => {
    return sum + (p.type === 'X2_PACK' ? 2 : 1);
  }, 0);
  const packPrice = packItems[0]?.cost || 0;

  return (
    <motion.div
      style={{
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Glow cho X2 Pack */}
      {hasX2 && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -12,
            borderRadius: 16,
            background: 'radial-gradient(ellipse, rgba(234,179,8,0.3) 0%, transparent 70%)',
            zIndex: 0,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Vali image */}
      <motion.img
        src="/shopimg/lootbox.png"
        alt="Loot Box"
        style={{
          width: 270,
          height: 'auto',
          position: 'relative',
          zIndex: 1,
          filter: hasX2 ? 'drop-shadow(0 0 12px rgba(234,179,8,0.6))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
        }}
        animate={{
          rotate: [-1, 1, -1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Badge xN */}
      {packItems.length > 1 && (
        <motion.div
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            background: hasX2 ? 'linear-gradient(135deg, #eab308, #f59e0b)' : '#3b82f6',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '2px 10px',
            borderRadius: 10,
            fontFamily: 'var(--font-pixel)',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          x{packItems.length}
        </motion.div>
      )}

      {/* X2 Deal label */}
      {hasX2 && (
        <motion.div
          style={{
            position: 'absolute',
            top: -18,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #eab308, #f97316)',
            color: '#000',
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '1px 8px',
            borderRadius: 6,
            fontFamily: 'var(--font-pixel)',
            whiteSpace: 'nowrap',
            zIndex: 3,
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          DEAL HIẾM!
        </motion.div>
      )}

      {/* Price label */}
      <div
        style={{
          marginTop: 6,
          fontSize: '0.75rem',
          fontFamily: 'var(--font-pixel)',
          color: 'var(--color-gold)',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        💰 {packPrice}g / pack
      </div>
    </motion.div>
  );
}
