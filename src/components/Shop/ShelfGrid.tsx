'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ShopCard, { ShopItemData } from './ShopCard';
import { SHOP_LAYOUT } from './shopConfig';

interface ShelfGridProps {
  shelfItems: ShopItemData[];
  crewSlot: ShopItemData | null;
  rerollCount: number;
  rerollCost: number;
  isRerolling: boolean;
  onCardClick: (item: ShopItemData) => void;
  onReroll: () => void;
}

export default function ShelfGrid({
  shelfItems,
  crewSlot,
  rerollCount,
  rerollCost,
  isRerolling,
  onCardClick,
  onReroll,
}: ShelfGridProps) {
  // Pad shelfItems to fill 6 slots (some might be PACK → empty)
  const topRow: (ShopItemData | null)[] = [];
  const bottomRow: (ShopItemData | null)[] = [];

  // Distribute non-PACK items into 6 shelf positions
  let slotIdx = 0;
  for (let i = 0; i < 6; i++) {
    const item = shelfItems[slotIdx];
    if (i < 3) {
      topRow.push(item || null);
    } else {
      bottomRow.push(item || null);
    }
    slotIdx++;
  }

  // Crew goes as 4th item in bottom row
  if (crewSlot) {
    bottomRow.push(crewSlot);
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Reroll Button — top right of shelf */}
      <div style={{ position: 'absolute', top: -45, right: -20, zIndex: 5 }}>
        <motion.button
          onClick={onReroll}
          disabled={isRerolling}
          style={{
            background: 'none',
            border: 'none',
            cursor: isRerolling ? 'not-allowed' : 'pointer',
            position: 'relative',
            opacity: isRerolling ? 0.5 : 1,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <img
            src="/shopimg/rerollbutton.png"
            alt="Reroll"
            style={{ width: 96, height: 'auto' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-pixel)',
              color: 'var(--color-gold)',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            💰 {rerollCost}g
          </div>
        </motion.button>
      </div>

      {/* Top Row — 3 slots */}
      <ShelfRow
        items={topRow}
        rowIndex={0}
        onCardClick={onCardClick}
      />

      {/* Bottom Row — 3-4 slots (includes crew) */}
      <ShelfRow
        items={bottomRow}
        rowIndex={1}
        onCardClick={onCardClick}
      />
    </div>
  );
}

function ShelfRow({
  items,
  rowIndex,
  onCardClick,
}: {
  items: (ShopItemData | null)[];
  rowIndex: number;
  onCardClick: (item: ShopItemData) => void;
}) {
  const { width: cardW, height: cardH, gap } = SHOP_LAYOUT.card;

  return (
    <div
      style={{
        display: 'flex',
        gap,
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: '48%',
        padding: '0 2%',
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <motion.div
            key={item ? `shelf-${item.slotIndex}-${item.card?.id || i}` : `empty-${rowIndex}-${i}`}
            style={{ width: cardW, height: cardH, flexShrink: 0 }}
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ delay: (rowIndex * 3 + i) * 0.08, duration: 0.3 }}
          >
            {item ? (
              <ShopCard item={item} onClick={onCardClick} />
            ) : (
              <EmptySlot />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-md)',
        border: '2px dashed rgba(255,255,255,0.1)',
        background: 'rgba(20, 20, 30, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-pixel)',
      }}
    >
      Trống
    </div>
  );
}
