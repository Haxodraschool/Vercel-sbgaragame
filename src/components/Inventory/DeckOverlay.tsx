'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styles from './DeckOverlay.module.css';
import TypeTabs from './TypeTabs';
import CardThumbnail from './CardThumbnail';
import CardDetail from './CardDetail';
import CardGridStyles from './CardGrid.module.css';
import type { Card, CardEffect } from '@/stores/useInventoryStore';

/* ─── Types ─── */
interface FullCard extends Card {
  id: number;
  name: string;
  type: string;
  rarity: number;
  statPower: number;
  statHeat: number;
  statStability: number;
  cost: number;
  imageUrl: string | null;
  description: string;
  effects: CardEffect[];
}

interface DeckOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortKey = 'id' | 'name' | 'power' | 'heat' | 'stability' | 'rarity' | 'cost';

/* ─── Helpers ─── */
function sortCards(cards: FullCard[], sortBy: SortKey): FullCard[] {
  const sorted = [...cards];
  switch (sortBy) {
    case 'id':
      return sorted.sort((a, b) => a.id - b.id);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    case 'power':
      return sorted.sort((a, b) => b.statPower - a.statPower);
    case 'heat':
      return sorted.sort((a, b) => b.statHeat - a.statHeat);
    case 'stability':
      return sorted.sort((a, b) => b.statStability - a.statStability);
    case 'rarity':
      return sorted.sort((a, b) => b.rarity - a.rarity);
    case 'cost':
      return sorted.sort((a, b) => b.cost - a.cost);
    default:
      return sorted;
  }
}

/* ─── Component ─── */
export default function DeckOverlay({ isOpen, onClose }: DeckOverlayProps) {
  // ─── State ───
  const [allCards, setAllCards] = useState<FullCard[]>([]);
  const [ownedMap, setOwnedMap] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [activeType, setActiveType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('id');
  const [filterRarity, setFilterRarity] = useState(0); // 0 = all
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Fetch data when overlay opens ───
  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem('sb-token');
    if (!token) return;

    setIsLoading(true);
    setIsClosing(false);

    // Play SFX immediately on open (don't wait for data)
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sfx/Deckopen.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch { /* ignore audio errors */ }

    Promise.all([
      fetch('/api/cards', {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(r => r.json()),
      fetch('/api/user/inventory', {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([cardsData, inventoryData]) => {
        // Process cards — matches GET /api/cards response { cards: [...] }
        const cards: FullCard[] = (cardsData.cards || []).map((c: Record<string, unknown>) => ({
          id: c.id as number,
          name: (c.name as string) || '',
          type: (c.type as string) || '',
          rarity: (c.rarity as number) || 1,
          statPower: (c.statPower as number) || 0,
          statHeat: (c.statHeat as number) || 0,
          statStability: (c.statStability as number) || 0,
          cost: (c.cost as number) || 0,
          imageUrl: (c.imageUrl as string | null) || null,
          description: (c.description as string) || '',
          effects: ((c.effects || []) as Record<string, unknown>[]).map((e) => ({
            id: (e.id as number) || 0,
            triggerCondition: (e.triggerCondition as string) || 'PASSIVE',
            targetStat: (e.targetStat as string) || '',
            effectType: (e.effectType as string) || '',
            effectValue: (e.effectValue as number) || 0,
            description: (e.description as string) || '',
          })),
        }));
        setAllCards(cards);

        // Process inventory — matches GET /api/user/inventory response
        // API returns: { inventory: [{ id, quantity, card: { id, name, ... } }] }
        const inventory = inventoryData.inventory || [];
        const owned: Record<number, number> = {};
        interface InventoryApiItem {
          quantity: number;
          card?: { id: number };
          cardId?: number;
        }
        (inventory as InventoryApiItem[]).forEach((item) => {
          // The API nests card data inside item.card
          const cid = item.card?.id ?? item.cardId;
          if (cid != null) {
            owned[cid] = (owned[cid] || 0) + (item.quantity || 1);
          }
        });
        setOwnedMap(owned);
      })
      .catch((err) => {
        console.error('Error fetching deck data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      // Small delay to let close animation finish
      const t = setTimeout(() => {
        setSelectedCardId(null);
        setSearchQuery('');
        setActiveType('ALL');
        setSortBy('id');
        setFilterRarity(0);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ─── Close with animation ───
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 450);
  }, [onClose]);

  // ─── Keyboard: Escape to close ───
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  // ─── Computed: type counts ───
  const typeCounts = useMemo(() => {
    const counts: Record<string, { owned: number; total: number }> = {
      ALL: { owned: 0, total: allCards.length },
    };

    allCards.forEach((card) => {
      if (!counts[card.type]) {
        counts[card.type] = { owned: 0, total: 0 };
      }
      counts[card.type].total++;
      if (ownedMap[card.id]) {
        counts[card.type].owned++;
        counts.ALL.owned++;
      }
    });

    return counts;
  }, [allCards, ownedMap]);

  // ─── Computed: filtered & sorted cards ───
  const filteredCards = useMemo(() => {
    let result = allCards;

    // Filter by type
    if (activeType !== 'ALL') {
      result = result.filter((c) => c.type === activeType);
    }

    // Filter by rarity
    if (filterRarity > 0) {
      result = result.filter((c) => c.rarity === filterRarity);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    // Sort
    return sortCards(result, sortBy);
  }, [allCards, activeType, filterRarity, searchQuery, sortBy]);

  // ─── Selected card data ───
  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return allCards.find((c) => c.id === selectedCardId) || null;
  }, [allCards, selectedCardId]);

  const selectedQuantity = selectedCardId ? (ownedMap[selectedCardId] || 0) : 0;

  // ─── Owned count for display ───
  const ownedCount = Object.keys(ownedMap).length;

  // ─── Don't render if never opened ───
  if (!isOpen && !isClosing) return null;

  return (
    <div className={`${styles.backdrop} ${isOpen && !isClosing ? styles.open : ''}`}>
      <div
        className={`
          ${styles.frame}
          ${isOpen && !isClosing ? styles.open : ''}
          ${isClosing ? styles.closing : ''}
        `}
      >
        {/* Corner Rivets */}
        <div className={`${styles.rivet} ${styles.rivetTL}`} />
        <div className={`${styles.rivet} ${styles.rivetTR}`} />
        <div className={`${styles.rivet} ${styles.rivetBL}`} />
        <div className={`${styles.rivet} ${styles.rivetBR}`} />

        {/* Rust Streaks */}
        <div className={`${styles.rustStreak} ${styles.rust1}`} />
        <div className={`${styles.rustStreak} ${styles.rust2}`} />
        <div className={`${styles.rustStreak} ${styles.rust3}`} />

        {/* Content */}
        <div className={styles.content}>
          {/* ═══ LEFT PANEL — Card Grid ═══ */}
          <div className={styles.leftPanel}>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>📒 SỔ TAY KỸ THUẬT</h1>
                <div className={styles.collectionStats}>
                  Bộ sưu tập: <span>{ownedCount}</span> / {allCards.length} thẻ
                </div>
              </div>
              <button className={styles.closeBtn} onClick={handleClose}>
                ✕ QUAY LẠI GARA
              </button>
            </div>

            {/* Type Tabs */}
            <TypeTabs
              activeType={activeType}
              onTypeChange={setActiveType}
              typeCounts={typeCounts}
            />

            {/* Toolbar: Search + Sort + Rarity Filter */}
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm kiếm theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.selectWrap}>
                <select
                  className={styles.selectControl}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="id">Mặc định (ID)</option>
                  <option value="rarity">Độ hiếm ↓</option>
                  <option value="power">Power ↓</option>
                  <option value="heat">Heat ↓</option>
                  <option value="stability">Stability ↓</option>
                  <option value="cost">Giá ↓</option>
                  <option value="name">Tên A-Z</option>
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>

              <div className={styles.selectWrap}>
                <select
                  className={styles.selectControl}
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(Number(e.target.value))}
                >
                  <option value={0}>Tất cả ★</option>
                  <option value={1}>★ Common</option>
                  <option value={2}>★★ Uncommon</option>
                  <option value={3}>★★★ Rare</option>
                  <option value={4}>★★★★ Epic</option>
                  <option value={5}>★★★★★ Legendary</option>
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>

            {/* Card Grid */}
            <div className={CardGridStyles.gridContainer}>
              {isLoading ? (
                <div className={CardGridStyles.noResults}>
                  <div className={CardGridStyles.emoji}>⚙️</div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className={CardGridStyles.noResults}>
                  <div className={CardGridStyles.emoji}>🔍</div>
                  <p>Không tìm thấy thẻ nào<br/>phù hợp bộ lọc.</p>
                </div>
              ) : (
                <>
                  <div className={CardGridStyles.resultsInfo}>
                    <span>
                      Hiển thị <strong>{filteredCards.length}</strong> thẻ
                    </span>
                    <span>
                      {filteredCards.filter(c => ownedMap[c.id]).length} đã sở hữu
                    </span>
                  </div>
                  <div className={CardGridStyles.grid}>
                    {filteredCards.map((card) => (
                      <CardThumbnail
                        key={card.id}
                        card={card}
                        quantity={ownedMap[card.id] || 0}
                        isSelected={selectedCardId === card.id}
                        onClick={() => setSelectedCardId(card.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══ RIGHT PANEL — Card Detail Blueprint ═══ */}
          <div className={styles.rightPanel}>
            <CardDetail
              card={selectedCard}
              quantity={selectedQuantity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
