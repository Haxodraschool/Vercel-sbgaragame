'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopItemData } from './ShopCard';
import { CrewIcon, ToolIcon } from '@/components/CategoryIcons';

const RARITY_GLOW: Record<number, string> = {
  1: '0 0 18px 6px rgba(180,180,180,0.35), 0 0 40px 10px rgba(180,180,180,0.15)',
  2: '0 0 18px 6px rgba(76,175,80,0.4), 0 0 40px 10px rgba(76,175,80,0.18)',
  3: '0 0 18px 6px rgba(33,150,243,0.45), 0 0 40px 10px rgba(33,150,243,0.2)',
  4: '0 0 22px 8px rgba(156,39,176,0.5), 0 0 50px 14px rgba(156,39,176,0.25)',
  5: '0 0 28px 10px rgba(255,215,0,0.7), 0 0 60px 20px rgba(255,215,0,0.35), 0 0 90px 30px rgba(255,200,0,0.15)',
};

interface CardPreviewModalProps {
  item: ShopItemData | null;
  gold: number;
  isBuying: boolean;
  onBuy: (item: ShopItemData) => void;
  onClose: () => void;
}

export default function CardPreviewModal({
  item,
  gold,
  isBuying,
  onBuy,
  onClose,
}: CardPreviewModalProps) {
  if (!item) return null;

  const canAfford = gold >= item.cost;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Horizontal Layout: Card Image (left) + Action Panel (right) */}
          <motion.div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 24,
              maxHeight: '90vh',
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          >
            {/* Card Image — NO frame, just the raw image */}
            <motion.div
              style={{
                height: '80vh',
                maxHeight: 560,
                flexShrink: 0,
                borderRadius: 12,
                boxShadow: RARITY_GLOW[item.card?.rarity ?? item.rarity ?? 1] || RARITY_GLOW[1],
              }}
              initial={{ x: -40 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.05, type: 'spring', damping: 20 }}
            >
              {item.card ? (
                <PreviewCardImage cardId={item.card.id} name={item.card.name} type={item.type} />
              ) : (
                <div
                  style={{
                    height: '100%',
                    aspectRatio: '3 / 4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    background: 'rgba(20,20,30,0.8)',
                    borderRadius: 12,
                  }}
                >
                  {item.type === 'CREW' ? <CrewIcon size={64} /> : <ToolIcon size={64} />}
                </div>
              )}
            </motion.div>

            {/* Action Panel — right side */}
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
                minWidth: 140,
              }}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 20 }}
            >
              {/* Price Tag */}
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: canAfford ? 'var(--color-gold)' : '#ef4444',
                  textShadow: canAfford
                    ? '0 0 12px rgba(251,191,36,0.5)'
                    : '0 0 12px rgba(239,68,68,0.4)',
                  textAlign: 'center',
                }}
              >
                💰 {item.cost}g
                {!canAfford && (
                  <div style={{ fontSize: '0.8rem', marginTop: 2, color: '#ef4444' }}>
                    Thiếu {item.cost - gold}g
                  </div>
                )}
              </div>

              {/* Buy Button — pixel art style, gold glow on hover */}
              <motion.button
                onClick={() => canAfford && onBuy(item)}
                disabled={!canAfford || isBuying}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  cursor: canAfford && !isBuying ? 'pointer' : 'not-allowed',
                  opacity: canAfford && !isBuying ? 1 : 0.4,
                  filter: 'none',
                  transition: 'filter 0.2s',
                }}
                whileHover={
                  canAfford && !isBuying
                    ? {
                        scale: 1.08,
                        filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.7)) drop-shadow(0 0 30px rgba(251,191,36,0.3))',
                      }
                    : {}
                }
                whileTap={canAfford && !isBuying ? { scale: 0.93 } : {}}
                animate={!canAfford ? { x: [0, -2, 2, -2, 2, 0] } : {}}
                transition={!canAfford ? { duration: 0.4 } : { type: 'spring', stiffness: 300 }}
              >
                <img
                  src="/shopimg/buybutton.png"
                  alt="MUA HÀNG"
                  style={{ width: 140, height: 'auto' }}
                />
              </motion.button>

              {/* Cancel Button — pixel art style, red glow on hover */}
              <motion.button
                onClick={onClose}
                style={{
                  padding: '8px 24px',
                  background: 'rgba(30, 20, 20, 0.85)',
                  border: '2px solid rgba(180, 60, 60, 0.5)',
                  borderRadius: 4,
                  color: '#ccc',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-pixel)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  imageRendering: 'pixelated',
                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  filter: 'none',
                  transition: 'filter 0.2s, border-color 0.2s, color 0.2s',
                }}
                whileHover={{
                  scale: 1.06,
                  filter: 'drop-shadow(0 0 14px rgba(220,50,50,0.5)) drop-shadow(0 0 28px rgba(220,50,50,0.2))',
                  borderColor: 'rgba(220, 60, 60, 0.8)',
                  color: '#ff8888',
                }}
                whileTap={{ scale: 0.93 }}
              >
                HỦY
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Image with .jpg → .jpeg → .png fallback — NO border/frame, raw card art
function PreviewCardImage({ cardId, name, type }: { cardId: number; name: string; type: string }) {
  const [imgError, setImgError] = useState(0);

  const getSrc = () => {
    if (imgError === 0) return `/componentcardimg/${cardId}.jpg`;
    if (imgError === 1) return `/componentcardimg/${cardId}.jpeg`;
    if (imgError === 2) return `/componentcardimg/${cardId}.png`;
    return '';
  };

  if (imgError >= 3) {
    return (
      <div
        style={{
          height: '100%',
          aspectRatio: '3 / 4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          background: 'rgba(20,20,30,0.8)',
          borderRadius: 12,
        }}
      >
        {type === 'CREW' ? <CrewIcon size={64} /> : <ToolIcon size={64} />}
      </div>
    );
  }

  return (
    <img
      src={getSrc()}
      alt={name}
      style={{
        height: '100%',
        width: 'auto',
        objectFit: 'contain',
        borderRadius: 8,
      }}
      onError={() => setImgError((e) => e + 1)}
    />
  );
}
