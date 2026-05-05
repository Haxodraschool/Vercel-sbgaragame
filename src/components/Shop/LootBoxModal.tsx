'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopItemData } from './ShopCard';
import { ToolIcon } from '@/components/CategoryIcons';

const RARITY_COLORS: Record<number, string> = {
  1: 'var(--rarity-1)',
  2: 'var(--rarity-2)',
  3: 'var(--rarity-3)',
  4: 'var(--rarity-4)',
  5: 'var(--rarity-5)',
};

const RARITY_NAMES: Record<number, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
};

const RARITY_GLOW: Record<number, string> = {
  4: '0 0 22px 8px rgba(156,39,176,0.5), 0 0 50px 14px rgba(156,39,176,0.25)',
  5: '0 0 28px 8px rgba(255,195,0,0.45), 0 0 55px 14px rgba(255,180,0,0.2)',
};

interface PackCard {
  id: number;
  name: string;
  type: string;
  rarity: number;
  statPower: number;
  statHeat: number;
  statStability: number;
}

interface LootBoxModalProps {
  packItems: ShopItemData[];
  gold: number;
  isOpen: boolean;
  onBuyPack: (packItem: ShopItemData) => Promise<{ cards: PackCard[]; wasPity: boolean } | null>;
  onClose: () => void;
}

export default function LootBoxModal({
  packItems,
  gold,
  isOpen,
  onBuyPack,
  onClose,
}: LootBoxModalProps) {
  const [buyCount, setBuyCount] = useState(1);
  const [phase, setPhase] = useState<'select' | 'opening' | 'reveal'>('select');
  const [revealedCards, setRevealedCards] = useState<PackCard[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [wasPity, setWasPity] = useState(false);

  // Save initial pack info on open so buying packs doesn't kill the modal mid-animation
  const [initialPackInfo, setInitialPackInfo] = useState<{ count: number; price: number } | null>(null);

  useEffect(() => {
    if (isOpen && !initialPackInfo && packItems.length > 0) {
      setInitialPackInfo({ count: packItems.length, price: packItems[0]?.cost || 0 });
    }
    if (!isOpen && initialPackInfo) {
      setInitialPackInfo(null);
    }
  }, [isOpen, packItems.length, initialPackInfo]);

  if (!isOpen) return null;
  if (!initialPackInfo && packItems.length === 0) return null;

  const maxBuy = initialPackInfo?.count ?? packItems.length;
  const pricePerPack = initialPackInfo?.price ?? packItems[0]?.cost ?? 0;
  const totalCost = pricePerPack * buyCount;
  const canAfford = gold >= totalCost;

  const handleBuy = async () => {
    if (!canAfford || isBuying) return;
    setIsBuying(true);
    setPhase('opening');

    // Play shake SFX
    const shakeAudio = new Audio('/shopsfx/lootboxshake.mp3');
    shakeAudio.volume = 0.6;
    shakeAudio.play().catch(() => {});

    // Play open burst SFX after shake ends
    setTimeout(() => {
      const openAudio = new Audio('/shopsfx/openboxsfx.mp3');
      openAudio.volume = 0.7;
      openAudio.play().catch(() => {});
    }, 2100);

    const allCards: PackCard[] = [];
    let anyPity = false;

    for (let i = 0; i < buyCount; i++) {
      const pack = packItems[i];
      if (!pack) break;
      const result = await onBuyPack(pack);
      if (result) {
        allCards.push(...result.cards);
        if (result.wasPity) anyPity = true;
      } else {
        break; // Dừng mở nếu có lỗi xảy ra
      }
    }

    setRevealedCards(allCards);
    setWasPity(anyPity);
    setIsBuying(false);

    // Delay before showing cards
    setTimeout(() => {
      setPhase('reveal');
    }, 3000);
  };

  const handleCollect = () => {
    setPhase('select');
    setRevealedCards([]);
    setBuyCount(1);
    setInitialPackInfo(null);
    onClose();
  };

  return (
    <AnimatePresence>
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
            background: 'rgba(0, 0, 0, 0.8)',
          }}
          onClick={phase === 'select' ? onClose : undefined}
        />

        {/* Content */}
        <motion.div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: 32,
            maxWidth: 1200,
            width: '95vw',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          {/* Phase: Select quantity */}
          {phase === 'select' && (
            <motion.div
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 28,
                textAlign: 'center',
                width: '100%',
                maxWidth: 500,
              }}
              initial={{ y: 50 }}
              animate={{ y: 0 }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '1.3rem',
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                GÓI THẺ BÍ ẨN
              </h3>

              <img
                src="/shopimg/lootbox.png"
                alt="Loot Box"
                style={{ width: 160, margin: '0 auto 16px', display: 'block' }}
              />

              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                Có {maxBuy} gói sẵn. Chọn số lượng muốn mở:
              </p>

              {/* Quantity Selector */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <motion.button
                  onClick={() => setBuyCount(Math.max(1, buyCount - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-pixel)',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  -
                </motion.button>

                <div
                  style={{
                    fontSize: '1.8rem',
                    fontFamily: 'var(--font-pixel)',
                    color: 'var(--color-gold)',
                    minWidth: 50,
                    textAlign: 'center',
                  }}
                >
                  {buyCount}
                </div>

                <motion.button
                  onClick={() => setBuyCount(Math.min(maxBuy, buyCount + 1))}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-pixel)',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>

              {/* Total Cost */}
              <div
                style={{
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-pixel)',
                  color: canAfford ? 'var(--color-gold)' : '#ef4444',
                  marginBottom: 16,
                }}
              >
                Tổng: 💰 {totalCost}g
                {!canAfford && (
                  <span style={{ fontSize: '0.85rem', display: 'block', marginTop: 4 }}>
                    Thiếu {totalCost - gold}g!
                  </span>
                )}
              </div>

              {/* Buttons — pixel art style matching CardPreviewModal */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                {/* Buy Button — gold glow on hover */}
                <motion.button
                  onClick={handleBuy}
                  disabled={!canAfford}
                  style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    opacity: canAfford ? 1 : 0.4,
                    filter: 'none',
                    transition: 'filter 0.2s',
                  }}
                  whileHover={
                    canAfford
                      ? {
                          scale: 1.08,
                          filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.7)) drop-shadow(0 0 30px rgba(251,191,36,0.3))',
                        }
                      : {}
                  }
                  whileTap={canAfford ? { scale: 0.93 } : {}}
                  animate={!canAfford ? { x: [0, -2, 2, -2, 2, 0] } : {}}
                  transition={!canAfford ? { duration: 0.4 } : { type: 'spring', stiffness: 300 }}
                >
                  <img
                    src="/shopimg/buybutton.png"
                    alt="MỞ GÓI"
                    style={{ width: 160, height: 'auto' }}
                  />
                </motion.button>

                {/* Cancel Button — pixel art, red glow on hover */}
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
              </div>
            </motion.div>
          )}

          {/* Phase: Opening animation */}
          {phase === 'opening' && (
            <>
              {/* Full-screen flash burst — appears right after closed lootbox vanishes */}
              <motion.div
                style={{
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <motion.div
                  style={{
                    width: '80vw',
                    height: '80vh',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255,255,230,0.95) 0%, rgba(255,250,200,0.6) 30%, rgba(255,240,180,0.2) 60%, transparent 80%)',
                  }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 1.5] }}
                  transition={{ delay: 2.05, duration: 0.45, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.div
                style={{
                  position: 'relative',
                  width: '60vw',
                  height: '60vw',
                  maxWidth: '60vh',
                  maxHeight: '60vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                {/* Closed lootbox — shakes then vanishes instantly */}
                <motion.div
                  style={{ width: '100%', height: '100%' }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 1, 0] }}
                  transition={{ duration: 2.1, times: [0, 0.95, 1], ease: 'linear' }}
                >
                  <motion.img
                    src="/shopimg/lootbox.png"
                    alt="Opening..."
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    animate={{
                      rotate: [-3, 3, -3, 3, 0],
                      x: [-8, 8, -8, 8, 0],
                    }}
                    transition={{ duration: 0.7, repeat: 2 }}
                  />
                </motion.div>

                {/* Open lootbox — appears right after flash */}
                <motion.img
                  src="/shopimg/lootboxopen.png"
                  alt="Opened"
                  style={{
                    width: '110%',
                    height: '110%',
                    objectFit: 'contain',
                    display: 'block',
                    position: 'absolute',
                    left: '0%',
                    top: '0%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.2, duration: 0.35, ease: 'easeOut' }}
                />
              </motion.div>
            </>
          )}

          {/* Phase: Reveal cards */}
          {phase === 'reveal' && (
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                gap: 16,
                width: '100%',
                maxHeight: '85vh',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Left: Cards panel */}
              <div
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  textAlign: 'center',
                  overflowY: 'auto',
                  minWidth: 0,
                }}
              >
                {wasPity && (
                  <motion.div
                    style={{
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-pixel)',
                      color: 'var(--rarity-5)',
                      marginBottom: 12,
                      textShadow: '0 0 10px rgba(234,179,8,0.6)',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ⭐ PITY ACTIVATED! Đảm bảo thẻ hiếm!
                  </motion.div>
                )}

                <h3
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                    marginBottom: 16,
                  }}
                >
                  Nhận được {revealedCards.length} thẻ!
                </h3>

                {/* Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 16,
                  }}
                >
                  {revealedCards.map((card, idx) => (
                    <motion.div
                      key={`${card.id}-${idx}`}
                      style={{
                        overflow: 'visible',
                        borderRadius: 6,
                        boxShadow: RARITY_GLOW[card.rarity] || 'none',
                      }}
                      initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{
                        delay: idx * 0.15,
                        duration: 0.4,
                        type: 'spring',
                        damping: 15,
                      }}
                    >
                      {/* Card Image — NO frame, raw card art */}
                      <RevealCardImage cardId={card.id} name={card.name} rarity={card.rarity} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: Claim button */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <motion.button
                  onClick={handleCollect}
                  style={{
                    padding: '16px 28px',
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.3))',
                    border: '2px solid var(--accent-cyan)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  NHẬN TẤT CẢ
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Image component with .jpg → .jpeg → .png fallback — NO frame, raw card art
function RevealCardImage({ cardId, name, rarity }: { cardId: number; name: string; rarity?: number }) {
  const [imgError, setImgError] = useState(0);

  const getSrc = () => {
    if (imgError === 0) return `/componentcardimg/${cardId}.jpg`;
    if (imgError === 1) return `/componentcardimg/${cardId}.jpeg`;
    if (imgError === 2) return `/componentcardimg/${cardId}.png`;
    return '';
  };

  if (imgError >= 3) {
    return (
      <div style={{ width: '100%', aspectRatio: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'rgba(20,20,30,0.6)', borderRadius: 8 }}>
        <ToolIcon size={32} />
      </div>
    );
  }

  return (
    <img
      src={getSrc()}
      alt={name}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
      onError={() => setImgError((e) => e + 1)}
    />
  );
}
