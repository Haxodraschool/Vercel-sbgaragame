'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useGameStore } from '@/stores/useGameStore';
import { api } from '@/lib/api';
import ShelfGrid from './ShelfGrid';
import { ShopItemData } from './ShopCard';
import CardPreviewModal from './CardPreviewModal';
import LootBox from './LootBox';
import LootBoxModal from './LootBoxModal';
import ShopHUD from './ShopHUD';
import { SHOP_LAYOUT } from './shopConfig';

const REROLL_BASE_COST = 50;

export default function ShopScreen() {
  const transitionScreen = useGameStore((s) => s.transitionScreen);
  const markScreenReady = useGameStore((s) => s.markScreenReady);
  const updateGold = useGameStore((s) => s.updateGold);
  const user = useGameStore((s) => s.user);

  // Shop data — fallback gold from store
  const fallbackGold = useRef(user?.gold ?? 0);
  const hasFetched = useRef(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [gold, setGold] = useState(user?.gold ?? 0);
  const [allItems, setAllItems] = useState<ShopItemData[]>([]);
  const [crewSlot, setCrewSlot] = useState<ShopItemData | null>(null);
  const [pityCounter, setPityCounter] = useState(0);
  const [nextPityAt, setNextPityAt] = useState(10);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [shopBgLoaded, setShopBgLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItemData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [rerollCount, setRerollCount] = useState(0);
  const [isRerolling, setIsRerolling] = useState(false);
  const [lootBoxOpen, setLootBoxOpen] = useState(false);

  // Derived: separate shelf items vs pack items
  const shelfItems = allItems.filter(
    (item) => item.type !== 'PACK' && item.type !== 'X2_PACK'
  );
  const packItems = allItems.filter(
    (item) => item.type === 'PACK' || item.type === 'X2_PACK'
  );

  // --- Preload shop background image ---
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    const done = () => { if (!cancelled) setShopBgLoaded(true); };
    img.onload = done;
    img.onerror = done;
    img.src = '/shopimg/shopbg.jpg';
    return () => { cancelled = true; };
  }, []);

  // --- Dismiss global LoadingScreen once all shop resources are ready ---
  useEffect(() => {
    if (!isLoading && shopBgLoaded) {
      markScreenReady();
    }
  }, [isLoading, shopBgLoaded, markScreenReady]);

  // --- Background Music Setup ---
  useEffect(() => {
    const bgm = new Audio('/gamemusic/shopmusic.mp3');
    bgm.loop = true;
    bgm.volume = 0.4;
    
    const playMusic = () => {
      bgm.play().catch((e) => console.error('BGM play blocked:', e));
    };
    
    playMusic();
    
    // In case browser blocks autoplay, play on first click anywhere
    document.addEventListener('click', playMusic, { once: true });
    
    // Save to ref to clean up later
    bgmRef.current = bgm;

    return () => {
      document.removeEventListener('click', playMusic);
      bgm.pause();
      bgm.currentTime = 0;
    };
  }, []);

  // Fetch shop data — only ONCE on mount, guarded by ref
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        setIsLoading(true);
        const data = await api.shop.items() as any;
        if (data.error) {
          toast.error(data.error);
          setGold(fallbackGold.current);
          return;
        }
        setGold(data.gold ?? fallbackGold.current);
        setAllItems(data.items || []);
        setCrewSlot(data.crewSlot || null);
        setPityCounter(data.pityCounter || 0);
        setNextPityAt(data.nextPityAt || 10);
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải Shop');
        setGold(fallbackGold.current);
      } finally {
        setIsLoading(false);
      }
    })();

    // Cleanup: pause audio when shop unmounts
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reroll handler
  const handleReroll = async () => {
    if (isRerolling) return;
    const cost = REROLL_BASE_COST * Math.pow(2, rerollCount);
    if (gold < cost) {
      toast.error(`Không đủ vàng! Cần ${cost}g`);
      return;
    }

    try {
      // Play SFX
      const audio = new Audio('/shopsfx/rerollsfx.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});

      setIsRerolling(true);
      const data = await api.shop.reroll({ rerollCount }) as any;
      setGold(data.gold);
      setAllItems(data.items || []);
      setCrewSlot(data.crewSlot || null);
      setPityCounter(data.pityCounter || 0);
      setNextPityAt(data.nextPityAt || 10);
      setRerollCount((c) => c + 1);
      updateGold(data.gold);
      toast.success(`Reroll thành công! -${cost}g`);
    } catch (err: any) {
      toast.error(err.message || 'Reroll thất bại');
    } finally {
      setIsRerolling(false);
    }
  };

  // Buy card/bundle/crew handler
  const handleBuyCard = async (item: ShopItemData) => {
    if (isBuying) return;
    try {
      setIsBuying(true);
      const payload: any = {
        type: item.type,
        cost: item.cost,
      };
      if (item.card) payload.cardId = item.card.id;
      if (item.bundleQuantity) payload.bundleQuantity = item.bundleQuantity;

      const data = await api.shop.buy(payload) as any;
      const newGold = data.remainingGold;
      setGold(newGold);
      updateGold(newGold);

      // Remove bought item from shelf
      setAllItems((prev) =>
        prev.filter((i) => i.slotIndex !== item.slotIndex)
      );
      if (item.type === 'CREW') {
        setCrewSlot(null);
      }

      setSelectedItem(null);
      toast.success(data.message || 'Mua thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Mua thất bại!');
    } finally {
      setIsBuying(false);
    }
  };

  // Buy pack handler (for LootBoxModal)
  // Removes the purchased pack from local state (gone until reroll/reset)
  // Does NOT call updateGold to avoid triggering parent re-renders
  const handleBuyPack = async (packItem: ShopItemData) => {
    try {
      const payload: any = {
        type: packItem.type,
        cost: packItem.cost,
      };
      const data = await api.shop.buy(payload) as any;
      const newGold = data.remainingGold;
      setGold(newGold);
      setPityCounter(data.totalPacksOpened ? data.totalPacksOpened % 10 : pityCounter);

      // Remove this pack from local shelf
      setAllItems((prev) => {
        const idx = prev.findIndex(
          (i) =>
            (i.type === 'PACK' || i.type === 'X2_PACK') &&
            i.slotIndex === packItem.slotIndex
        );
        if (idx >= 0) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });

      return {
        cards: data.cards || [],
        wasPity: data.wasPity || false,
      };
    } catch (err: any) {
      toast.error(err.message || 'Mở Pack thất bại!');
      return null;
    }
  };

  // Close shop — transition back to lobby with loading overlay
  const handleClose = () => {
    transitionScreen('lobby');
  };

  const rerollCost = REROLL_BASE_COST * Math.pow(2, rerollCount);

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          overflow: 'hidden',
        }}
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/shopimg/shopbg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Dark overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        />

        {/* Loading */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              zIndex: 20,
            }}
          >
            <motion.div
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '1.5rem',
                color: 'var(--color-gold)',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Đang mở Shop...
            </motion.div>
          </div>
        )}

        {/* HUD — Top Right */}
        <ShopHUD
          gold={gold}
          pityCounter={pityCounter}
          nextPityAt={nextPityAt}
          onClose={handleClose}
        />

        {/* Main Layout */}
        {!isLoading && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '20px 0',
            }}
          >
            {/* Shelf Area — Aligned to the metal shelf rows in shopbg.jpg */}
            <div
              style={{
                position: 'absolute',
                top: SHOP_LAYOUT.shelf.top,
                left: SHOP_LAYOUT.shelf.left,
                width: SHOP_LAYOUT.shelf.width,
                height: SHOP_LAYOUT.shelf.height,
              }}
            >
              <ShelfGrid
                shelfItems={shelfItems}
                crewSlot={crewSlot}
                rerollCount={rerollCount}
                rerollCost={rerollCost}
                isRerolling={isRerolling}
                onCardClick={(item) => setSelectedItem(item)}
                onReroll={handleReroll}
              />
            </div>

            {/* Loot Box Area — On the wooden counter between radio and shopkeeper */}
            <div
              style={{
                position: 'absolute',
                bottom: SHOP_LAYOUT.lootBox.bottom,
                left: SHOP_LAYOUT.lootBox.left,
              }}
            >
              <LootBox
                packItems={packItems}
                onClick={() => setLootBoxOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Card Preview Modal */}
        {selectedItem && (
          <CardPreviewModal
            item={selectedItem}
            gold={gold}
            isBuying={isBuying}
            onBuy={handleBuyCard}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* Loot Box Modal */}
        <LootBoxModal
          packItems={packItems}
          gold={gold}
          isOpen={lootBoxOpen}
          onBuyPack={handleBuyPack}
          onClose={() => setLootBoxOpen(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
}
