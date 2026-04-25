'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { BuyTpModal, TopupGoldModal } from '@/components/CurrencyModal/CurrencyModals';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

import styles from './WorkshopScreen.module.css';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const CATEGORIES = [
  { type: 'ENGINE',     label: 'Đ.CƠ',    icon: '⚙️' },
  { type: 'TURBO',      label: 'TURBO',   icon: '💨' },
  { type: 'EXHAUST',    label: 'Ố.XẢ',    icon: '🔥' },
  { type: 'COOLING',    label: 'L.MÁT',   icon: '❄️' },
  { type: 'FILTER',     label: 'L.GIÓ',   icon: '🌬️' },
  { type: 'FUEL',       label: 'N.LIỆU',  icon: '⛽' },
  { type: 'SUSPENSION', label: 'TREO',    icon: '🔩' },
  { type: 'TIRE',       label: 'LỐP',     icon: '🛞' },
  { type: 'NITROUS',    label: 'NOS',     icon: '💥' },
  { type: 'TOOL',       label: 'D.CỤ',    icon: '🔧' },
  { type: 'CREW',       label: 'CREW',    icon: '👥' },
];

// Nhóm thẻ linh kiện (không tính CREW)
const CORE_PART_TYPES = ['ENGINE','TURBO','EXHAUST','COOLING','FILTER','FUEL','SUSPENSION','TIRE','NITROUS','TOOL'];

// Max crew slots a user can have
const MAX_CREW_SLOTS = 5;

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, cardId: number) => {
    const target = e.target as HTMLImageElement;
    const src = target.src;
    if (src.includes('.jpg') && !src.includes('.jpeg')) {
        target.src = `/componentcardimg/${cardId}.jpeg`;
    } else if (src.includes('.jpeg')) {
        target.src = `/componentcardimg/${cardId}.png`;
    } else {
        target.src = '/componentcardimg/placeholder.jpg';
    }
};

const getImageUrl = (card: any) => {
    if (card.imageUrl) return card.imageUrl.startsWith('/') ? card.imageUrl : `/componentcardimg/${card.imageUrl}`;
    return `/componentcardimg/${card.id}.jpg`;
};

// ─── NPC image resolver (đồng bộ với QuestDialog) ───
const AVAILABLE_NPC_INDICES = [1,2,4,5,6,7,8,9,10,11,12,13,14,15];
const getQuestNpcImage = (quest: any, isInNK: boolean): string => {
    if (!quest) return '';
    if (quest.isBoss && quest.bossConfig?.name) {
        const name = quest.bossConfig.name;
        if (name.includes('Đại Đế') || name.includes('Nga')) return '/gamebossimg/russianboss.png';
        if (name.includes('Chủ Tịch') || name.includes('Kim')) return '/gamebossimg/kimboss.png';
        if (name.includes('Đỗ Nam Trung') || name.includes('Trump')) return '/gamebossimg/trumpboss.png';
        if (name.includes('Đảo Chủ') || name.includes('EP')) return '/gamebossimg/islandboss.png';
        if (name.includes('Ông Hoàng Drift')) return '/gamebossimg/driftkingboss.png';
        if (name.includes('Huyền Thoại F1')) return '/gamebossimg/F1boss.png';
        if (name.includes('Nhà Sưu Tập')) return '/gamebossimg/colletorboss.png';
        if (name.includes('Cô Gái Liều Lĩnh')) return '/gamebossimg/daredevilgirlboss.png';
        if (name.includes('Bí Ẩn')) return '/gamebossimg/mysteriousmanboss.png';
        if (name.includes('Dầu Em Bé') || name.includes('Baby Oil')) return '/gamebossimg/babyoilboss.png';
        return quest.bossConfig.imageUrl || '/gamebossimg/mysteriousmanboss.png';
    }
    if (isInNK) {
        const index = (quest.id % 5) + 1;
        return `/gamenpcimg/npc${index}NK.png`;
    }
    const safeIndex = AVAILABLE_NPC_INDICES[quest.id % AVAILABLE_NPC_INDICES.length];
    return `/gamenpcimg/npc${safeIndex}.png`;
};

// ─── Map required power → car frame level (1..5) ───
// Dải theo SKILL.md mục 17.4: <=200, 350, 500, 750, 1000+
const getCarLevelFromPower = (power: number): number => {
    if (!power || power <= 200) return 1;
    if (power <= 350) return 2;
    if (power <= 500) return 3;
    if (power <= 750) return 4;
    return 5;
};

// ─── Áp PASSIVE effects của 1 thẻ lên baseline stats ───
// SKILL.md §2.4: PASSIVE luôn luôn có hiệu lực (kể cả preview chưa test).
const applyPassiveEffects = (card: any): { heat: number; stability: number; power: number } => {
    let heat = card.statHeat || 0;
    let stability = card.statStability || 0;
    let power = card.statPower || 0;
    const effects = card.effects || [];
    for (const eff of effects) {
        if (eff.triggerCondition !== 'PASSIVE') continue;
        const sign = eff.effectType === 'DEBUFF' ? -1 : 1;
        if (eff.targetStat === 'POWER') power += sign * eff.effectValue;
        else if (eff.targetStat === 'HEAT') heat += sign * eff.effectValue;
        else if (eff.targetStat === 'STABILITY') stability += sign * eff.effectValue;
    }
    return { heat, stability, power };
};

// ─── Sequential heat calc (đồng bộ với backend, ĐÃ áp PASSIVE) ───
// Công thức/Slot: currentHeat += (heat + passiveHeat);
//                 currentHeat = max(0, currentHeat - (stability + passiveStability))
const computeSequentialHeat = (cards: (any | null)[]): number => {
    let heat = 0;
    for (const c of cards) {
        if (!c) continue;
        const s = applyPassiveEffects(c);
        heat += s.heat;
        heat = Math.max(0, heat - s.stability);
    }
    return heat;
};

// ─── Tổng Power preview (đã áp PASSIVE, chưa áp ON_TEST/combo) ───
const computePreviewPower = (cards: (any | null)[]): number => {
    let total = 0;
    for (const c of cards) {
        if (!c) continue;
        total += applyPassiveEffects(c).power;
    }
    return total;
};

// ═══════════════════════════════════════════════════════════
// DRAGGABLE INVENTORY CARD — with hover big preview
// ═══════════════════════════════════════════════════════════

function DraggableInventoryCard({ card, quantity, onHoverPreview }: {
    card: any;
    quantity: number;
    onHoverPreview: (card: any | null) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `inv-${card.id}`,
        data: { source: 'inventory', card },
        disabled: quantity <= 0
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onMouseEnter={() => onHoverPreview(card)}
            onMouseLeave={() => onHoverPreview(null)}
            className={`relative group transition-all duration-200 touch-none ${
                isDragging ? 'opacity-20' :
                quantity > 0 ? 'cursor-grab active:cursor-grabbing hover:z-20' :
                'opacity-50 grayscale cursor-not-allowed'
            }`}
        >
            <div className="w-full relative transition-transform duration-200 group-hover:scale-105">
                <img
                    src={getImageUrl(card)}
                    alt={card.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageError(e, card.id)}
                    className={`w-full h-auto object-contain drop-shadow-lg transition-all pointer-events-none ${
                        card.rarity === 5 ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' :
                        card.rarity === 4 ? 'drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]' :
                        card.rarity === 3 ? 'drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]' :
                        card.rarity === 2 ? 'drop-shadow-[0_0_6px_rgba(74,222,128,0.3)]' :
                                            'drop-shadow-[0_0_4px_rgba(148,163,184,0.2)]'
                    }`}
                />
                <div className="absolute top-1 right-1 text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 shadow-xl border border-slate-600/50 backdrop-blur-md pointer-events-none">
                    x{quantity}
                </div>
                {quantity === 0 && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                        <span className="text-red-500 font-bold rotate-12 text-sm tracking-widest border-2 border-red-500/50 px-1">HẾT</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// WORKSHOP SLOT (10 khe xe)
// ═══════════════════════════════════════════════════════════

function WorkshopSlot({ index, card, isScanning, isTested, vfxText, disabledDnd, rejected, isCombo, comboName }: {
    index: number;
    card: any | null;
    isScanning?: boolean;
    isTested?: boolean;
    vfxText?: string;
    disabledDnd?: boolean;
    rejected?: boolean;
    isCombo?: boolean;
    comboName?: string;
}) {
    const { isOver, setNodeRef: setDropRef } = useDroppable({
        id: `slot-${index}`,
        data: { type: 'slot', index }
    });

    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: `slot-drag-${index}`,
        data: { source: 'slot', index, card },
        disabled: !card || disabledDnd
    });

    return (
        <div
            ref={setDropRef}
            className={`w-14 lg:w-[4rem] h-20 lg:h-24 border-2 border-dashed bg-slate-800/50 rounded-md flex flex-col items-center justify-center relative backdrop-blur-sm group transition-all overflow-visible shadow-lg ${
                rejected ? 'border-red-500 bg-red-900/30 ring-2 ring-red-500/50' :
                isScanning ? 'border-amber-400 bg-amber-900/60 ring-4 ring-amber-500/50 scale-110 z-30 transition-transform duration-200' :
                isTested ? 'border-cyan-400 bg-cyan-900/30 brightness-50' :
                isOver ? 'border-emerald-400 bg-emerald-900/40 ring-4 ring-emerald-500/20' :
                'border-cyan-600/40 hover:border-cyan-400 hover:bg-slate-700/80'
            } ${isCombo ? styles.comboGlowSlot : ''}`}
        >
            {/* Combo Chain Border (Framer Motion) */}
            {isCombo && (
                <motion.svg
                    className="absolute inset-0 w-full h-full pointer-events-none rounded-md z-[25]"
                    style={{ overflow: 'visible' }}
                >
                    <motion.rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        rx="6"
                        ry="6"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        strokeDasharray="10 5"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 60 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    />
                </motion.svg>
            )}

            {/* Combo badge (shown on the LEFT slot of the pair) */}
            {isCombo && comboName && (
                <div className={styles.comboSlotBadge}>
                    🔗 {comboName}
                </div>
            )}
            {vfxText && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-amber-300 font-bold text-[9px] drop-shadow-[0_0_5px_#fbbf24] animate-bounce z-50 pointer-events-none bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                    {vfxText}
                </div>
            )}
            <div
                ref={setDragRef}
                {...listeners}
                {...attributes}
                className={`absolute inset-0 flex items-center justify-center w-full h-full touch-none ${card && !isDragging ? 'cursor-grab hover:scale-105 transition-transform hover:z-20' : ''} ${isDragging ? 'opacity-20' : ''}`}
            >
                {card ? (
                    <img
                        src={getImageUrl(card)}
                        alt={card.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, card.id)}
                        className="w-[90%] h-[90%] object-contain drop-shadow-md pointer-events-none"
                    />
                ) : (
                    <>
                        <span className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-cyan-600/30 font-bold text-3xl group-hover:text-cyan-400/60 transition-colors drop-shadow-md pointer-events-none">
                            {(index + 1).toString().padStart(2, '0')}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// CREW SLOT
// ═══════════════════════════════════════════════════════════

function CrewSlot({ index, card, isUnlocked, disabledDnd, onLockedClick }: {
    index: number;
    card: any | null;
    isUnlocked: boolean;
    disabledDnd?: boolean;
    onLockedClick?: () => void;
}) {
    const { isOver, setNodeRef: setDropRef } = useDroppable({
        id: `crew-${index}`,
        data: { type: 'crew', index }
    });

    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: `crew-drag-${index}`,
        data: { source: 'crew', index, card },
        disabled: !card || disabledDnd || !isUnlocked
    });

    if (!isUnlocked) {
        return (
            <div 
                onClick={onLockedClick}
                className="w-14 h-20 border-2 border-slate-800/60 rounded-md bg-slate-950/80 flex flex-col items-center justify-center relative shadow-inner opacity-50 hover:opacity-80 hover:border-emerald-500/50 cursor-pointer transition-all"
            >
                <span className="text-2xl">🔒</span>
                <span className="text-[8px] text-slate-600 tracking-widest mt-1">CLICK</span>
            </div>
        );
    }

    return (
        <div
            ref={setDropRef}
            className={`w-14 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center relative backdrop-blur-sm group transition-all overflow-hidden shadow-lg ${
                isOver ? 'border-fuchsia-400 bg-fuchsia-900/40 ring-4 ring-fuchsia-500/30' :
                card ? 'border-fuchsia-500/70 bg-indigo-950/80' :
                'border-fuchsia-900/50 bg-gradient-to-b from-slate-900 to-indigo-950 hover:border-fuchsia-400 hover:scale-105 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)]'
            }`}
        >
            {!card && (
                <>
                    <div className="absolute top-1 left-1 rounded-full w-2 h-2 bg-fuchsia-500 opacity-50 shadow-[0_0_5px_#d946ef] group-hover:opacity-100" />
                    <div className="absolute bottom-1 right-1 rounded-full w-2 h-2 bg-amber-400 opacity-50 shadow-[0_0_5px_#fbbf24] group-hover:opacity-100" />
                    <span className="text-fuchsia-400/50 font-bold text-[8px] tracking-[0.15em] group-hover:text-fuchsia-300">CREW</span>
                    <span className="text-slate-600 text-[8px] tracking-widest mt-0.5">{index + 1}</span>
                </>
            )}
            <div
                ref={setDragRef}
                {...listeners}
                {...attributes}
                className={`absolute inset-0 flex items-center justify-center w-full h-full touch-none ${card && !isDragging ? 'cursor-grab' : ''} ${isDragging ? 'opacity-20' : ''}`}
            >
                {card && (
                    <img
                        src={getImageUrl(card)}
                        alt={card.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, card.id)}
                        className="w-[90%] h-[90%] object-contain drop-shadow-md pointer-events-none"
                    />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MISSING TYPES TOOLTIP (Notification Panel)
// ═══════════════════════════════════════════════════════════

function MissingTypesTooltip({ slots, crewSlots, activeQuest }: {
    slots: (any | null)[];
    crewSlots: (any | null)[];
    activeQuest: any | null;
}) {
    const slottedTypes = slots.filter(Boolean).map((c: any) => c.type);
    
    // Get banned types from quest (boss special conditions)
    const bannedTypes: string[] = useMemo(() => {
        if (!activeQuest?.bossConfig?.specialCondition) return [];
        const cond = activeQuest.bossConfig.specialCondition.toUpperCase();
        const banned: string[] = [];
        if (cond.includes('COOLING') || cond.includes('TẢN NHIỆT')) banned.push('COOLING');
        if (cond.includes('NITROUS') || cond.includes('NOS')) banned.push('NITROUS');
        if (cond.includes('TURBO')) banned.push('TURBO');
        return banned;
    }, [activeQuest]);

    const missingTypes = CORE_PART_TYPES.filter(t => !slottedTypes.includes(t) && !bannedTypes.includes(t));
    const hasCrew = crewSlots.some(Boolean);

    const hasAnyIssue = missingTypes.length > 0 || bannedTypes.length > 0;

    return (
        <div className="absolute left-[118px] top-6 w-[220px] bg-slate-950/90 border border-slate-700/60 p-3 shadow-2xl z-40 backdrop-blur-md">
            <div className="text-[9px] font-bold text-cyan-400 tracking-[0.15em] border-b border-slate-700 pb-1.5 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                PHÂN TÍCH HỆ THỐNG
            </div>

            {/* Banned types */}
            {bannedTypes.length > 0 && (
                <div className="mb-2">
                    <div className="text-[8px] font-bold text-red-400 tracking-widest mb-1">⛔ BỊ CẤM BỞI KHÁCH</div>
                    {bannedTypes.map(t => {
                        const cat = CATEGORIES.find(c => c.type === t);
                        return (
                            <div key={t} className="flex items-center gap-1.5 py-0.5 px-1.5 bg-red-900/20 rounded border border-red-800/40 mb-1">
                                <span className="text-sm">{cat?.icon}</span>
                                <span className="text-[9px] text-red-300 font-bold">{cat?.label}</span>
                                <span className="ml-auto text-red-500 text-[8px]">CẤM</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Missing core types */}
            {missingTypes.length > 0 ? (
                <div>
                    <div className="text-[8px] font-bold text-amber-400 tracking-widest mb-1">⚠ THIẾU HỆ THỐNG</div>
                    {missingTypes.map(t => {
                        const cat = CATEGORIES.find(c => c.type === t);
                        const isInSlot = slottedTypes.includes(t);
                        return (
                            <div key={t} className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded border mb-1 ${
                                isInSlot ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-slate-900/60 border-slate-700/40'
                            }`}>
                                <span className="text-sm">{cat?.icon}</span>
                                <span className={`text-[9px] font-bold ${isInSlot ? 'text-emerald-300' : 'text-slate-400'}`}>{cat?.label}</span>
                                <span className={`ml-auto text-[8px] ${isInSlot ? 'text-emerald-400' : 'text-slate-600'}`}>
                                    {isInSlot ? '✓' : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                !hasAnyIssue && (
                    <div className="text-[9px] text-emerald-400 font-bold text-center py-2">
                        ✓ ĐỦ LINH KIỆN
                    </div>
                )
            )}

            {/* Crew status */}
            <div className="mt-2 pt-1.5 border-t border-slate-800">
                <div className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded border ${hasCrew ? 'bg-fuchsia-900/20 border-fuchsia-800/40' : 'bg-slate-900/60 border-slate-700/40'}`}>
                    <span className="text-sm">👥</span>
                    <span className={`text-[9px] font-bold ${hasCrew ? 'text-fuchsia-300' : 'text-slate-400'}`}>CREW</span>
                    <span className={`ml-auto text-[8px] ${hasCrew ? 'text-fuchsia-400' : 'text-slate-600'}`}>
                        {hasCrew ? '✓' : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// CHAIN LINK SVG (for hover combo preview)
// ═══════════════════════════════════════════════════════════

function ChainLinkSVG({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={styles.comboChainIcon}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function WorkshopScreen() {
    const setScreen = useGameStore((state) => state.setScreen);
    const transitionScreen = useGameStore((state) => state.transitionScreen);
    const registerTask = useGameStore((state) => state.registerTask);
    const completeTask = useGameStore((state) => state.completeTask);
    const updateGarageHealth = useGameStore((state) => state.updateGarageHealth);
    const updateGold = useGameStore((state) => state.updateGold);
    const updateTechPoints = useGameStore((state) => state.updateTechPoints);
    const setUser = useGameStore((state) => state.setUser);
    const user = useGameStore((state) => state.user);
    const token = useGameStore((state) => state.token);
    const activeQuest = useGameStore((state) => state.activeQuest);
    const setSkipShadowIntro = useGameStore((state) => state.setSkipShadowIntro);
    const activeBossMusic = useGameStore((state) => state.activeBossMusic);
    const setActiveBossMusic = useGameStore((state) => state.setActiveBossMusic);

    // --- Loading readiness (global LoadingScreen) ---
    const [inventoryLoaded, setInventoryLoaded] = useState(false);
    const [combosLoaded, setCombosLoaded] = useState(false);
    const [wsBgLoaded, setWsBgLoaded] = useState(false);
    const bgmRef = useRef<HTMLAudioElement | null>(null);

    // Đăng ký task ngay khi mount
    useEffect(() => {
        registerTask('ws-inventory', 'Đang tải kho thẻ...');
        registerTask('ws-combos', 'Đang nạp danh sách combo...');
        registerTask('ws-bg', 'Đang bậy nắp capo...');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Background Music Setup ---
    // Nếu có boss music được truyền từ lobby → phát boss music
    // Nếu không → phát nhạc workshop mặc định
    useEffect(() => {
        const trackSrc = activeBossMusic || '/gamemusic/workshop.mp3';
        const bgm = new Audio(trackSrc);
        bgm.loop = true;
        bgm.volume = activeBossMusic ? 0.45 : 0.3;

        let played = false;
        const playMusic = () => {
            if (played) return;
            played = true;
            bgm.play().catch((e) => console.error('Workshop BGM play blocked:', e));
        };

        playMusic();
        document.addEventListener('click', playMusic, { once: true });
        bgmRef.current = bgm;

        return () => {
            document.removeEventListener('click', playMusic);
            bgm.pause();
            bgm.currentTime = 0;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [inventory, setInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isBoxOpen, setIsBoxOpen] = useState(false);

    // Hover preview state
    const [hoverPreviewCard, setHoverPreviewCard] = useState<any | null>(null);

    // Combo system state
    const [combos, setCombos] = useState<any[]>([]);

    // DND State — 10 chassis slots
    const [slots, setSlots] = useState<(any | null)[]>(Array(10).fill(null));
    // Crew slots
    const [crewSlots, setCrewSlots] = useState<(any | null)[]>(Array(MAX_CREW_SLOTS).fill(null));
    const [activeDragCard, setActiveDragCard] = useState<any | null>(null);

    // Rejected slot flash (visual feedback)
    const [rejectedSlotIndex, setRejectedSlotIndex] = useState<number | null>(null);

    // Phase 5: Testing Sequence States
    const [isTesting, setIsTesting] = useState(false);
    const [scanIndex, setScanIndex] = useState<number>(-1);
    const [testResult, setTestResult] = useState<'none' | 'success' | 'fail'>('none');
    const [failureReason, setFailureReason] = useState<'power' | 'heat' | null>(null);
    const [accumulatedPower, setAccumulatedPower] = useState(0);
    const [accumulatedHeat, setAccumulatedHeat] = useState(0);
    const [showVFX, setShowVFX] = useState<{index: number, text: string} | null>(null);

    // Backend test results (đã áp effect/combo/crew/boss)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [testSteps, setTestSteps] = useState<any[] | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [testFinalResult, setTestFinalResult] = useState<any | null>(null);
    const [testErrorMsg, setTestErrorMsg] = useState<string | null>(null);

    // Coins animation state
    const [flyingCoins, setFlyingCoins] = useState<{id: number, x: number, y: number, delay: number}[]>([]);

    // Overheat penalty — no "làm lại" after fail
    const [penaltyApplied, setPenaltyApplied] = useState(false);

    // Unlock crew slot modal
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockInfo, setUnlockInfo] = useState<{ nextCost: number; techPoints: number; currentSlots: number } | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    // ─── Install VFX (chớp / tóe lửa / rung) khi lắp thẻ vào slot ───
    // flashKey: increment mỗi lần để re-trigger animation overlay
    // sparkSlot: {index, key} — slot vừa lắp, key để restart animation
    // shakeKey: increment → shake root container
    const [flashKey, setFlashKey] = useState(0);
    const [sparkSlot, setSparkSlot] = useState<{ index: number; key: number } | null>(null);
    const [shakeActive, setShakeActive] = useState(false);
    const shakeTimerRef = useRef<any>(null);
    const triggerInstallVFX = (slotIndex: number) => {
        const now = Date.now();
        setFlashKey(now);
        setSparkSlot({ index: slotIndex, key: now });
        // shake: bật lại class trong 380ms (reset baseline để restart animation)
        setShakeActive(false);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        requestAnimationFrame(() => {
            setShakeActive(true);
            shakeTimerRef.current = setTimeout(() => setShakeActive(false), 400);
        });
        setTimeout(() => {
            setSparkSlot((cur) => (cur && cur.key === now ? null : cur));
        }, 700);
    };

    // Sensors config — allow clicking buttons without dragging
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    // ─── Fetch Inventory ───
    useEffect(() => {
        if (!token) return;
        const fetchInventory = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/user/inventory', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.inventory) setInventory(data.inventory);
            } catch (e) {
                console.error("Lỗi khi tải kho thẻ:", e);
            } finally {
                setIsLoading(false);
                setInventoryLoaded(true);
                completeTask('ws-inventory');
            }
        };
        fetchInventory();
    }, [token, completeTask]);

    // ─── Fetch Combos ───
    useEffect(() => {
        const fetchCombos = async () => {
            try {
                const res = await fetch('/api/cards/combos');
                const data = await res.json();
                if (data.combos) setCombos(data.combos);
            } catch (e) {
                console.error('Lỗi khi tải combo:', e);
            } finally {
                setCombosLoaded(true);
                completeTask('ws-combos');
            }
        };
        fetchCombos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Preload workshop background image ───
    useEffect(() => {
        let cancelled = false;
        const urls = ['/workshop-bg.png'];
        let remaining = urls.length;
        const done = () => {
            if (cancelled) return;
            remaining -= 1;
            if (remaining <= 0) {
                setWsBgLoaded(true);
                completeTask('ws-bg');
            }
        };
        urls.forEach((url) => {
            const img = new window.Image();
            img.onload = done;
            img.onerror = done;
            img.src = url;
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Kept for any downstream logic
    void inventoryLoaded; void combosLoaded; void wsBgLoaded;

    // ─── Detect Active Combos on Slots ───
    const activeSlotCombos = useMemo(() => {
        if (!combos.length) return [];
        const results: { slotA: number; slotB: number; combo: any }[] = [];
        for (let i = 1; i < 10; i++) {
            const cardA = slots[i - 1];
            const cardB = slots[i];
            if (!cardA || !cardB) continue;
            const combo = combos.find((c: any) =>
                (c.card1.id === cardA.id && c.card2.id === cardB.id) ||
                (c.card1.id === cardB.id && c.card2.id === cardA.id)
            );
            if (combo) results.push({ slotA: i - 1, slotB: i, combo });
        }
        return results;
    }, [slots, combos]);

    // Set of slot indices that are part of a combo (for glow effect)
    const comboSlotSet = useMemo(() => {
        const s = new Set<number>();
        for (const ac of activeSlotCombos) {
            s.add(ac.slotA);
            s.add(ac.slotB);
        }
        return s;
    }, [activeSlotCombos]);

    // Map: slotIndex → combo name (only for the LEFT slot of each pair, to show badge)
    const comboSlotBadgeMap = useMemo(() => {
        const m = new Map<number, string>();
        for (const ac of activeSlotCombos) {
            // Badge hiển thị ở giữa 2 slot (gắn vào slotA)
            m.set(ac.slotA, ac.combo.name);
        }
        return m;
    }, [activeSlotCombos]);

    // ─── Available Quantity Helper ───
    const getAvailableQuantity = (cardId: number) => {
        const totalOwned = inventory.find(i => i.card.id === cardId)?.quantity || 0;
        const usedInSlots = slots.filter(c => c && c.id === cardId).length;
        const usedInCrew = crewSlots.filter(c => c && c.id === cardId).length;
        return totalOwned - usedInSlots - usedInCrew;
    };

    // ─── Unlock Crew Slot Handler ───
    const handleLockedCrewClick = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/user/unlock-crew-slot', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUnlockInfo({ nextCost: data.nextCost, techPoints: data.techPoints, currentSlots: data.currentSlots });
                setShowUnlockModal(true);
            }
        } catch (e) {
            console.error('Error fetching unlock info:', e);
        }
    };

    const handleUnlockCrewSlot = async () => {
        if (!token || isUnlocking) return;
        setIsUnlocking(true);
        try {
            const res = await fetch('/api/user/unlock-crew-slot', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                setShowUnlockModal(false);
                if (user) {
                    setUser({
                        ...user,
                        crewSlots: data.crewSlots,
                        techPoints: data.techPoints
                    });
                    updateTechPoints(data.techPoints);
                }
            } else {
                alert(data.error || 'Không thể mở khóa slot');
            }
        } catch (e) {
            console.error('Error unlocking crew slot:', e);
        } finally {
            setIsUnlocking(false);
        }
    };

    // ─── Validation: can this card go into chassis slot? ───
    const canDropToSlot = (card: any): { ok: boolean; reason?: string } => {
        // CREW cards cannot go into chassis slots
        if (card.type === 'CREW') return { ok: false, reason: 'Thẻ Crew chỉ vào ô Crew' };

        // Check for banned types from active quest
        if (activeQuest?.bossConfig?.specialCondition) {
            const cond = activeQuest.bossConfig.specialCondition.toUpperCase();
            if (
                (card.type === 'COOLING' && (cond.includes('COOLING') || cond.includes('TẢN NHIỆT'))) ||
                (card.type === 'NITROUS' && (cond.includes('NITROUS') || cond.includes('NOS'))) ||
                (card.type === 'TURBO' && cond.includes('TURBO'))
            ) {
                return { ok: false, reason: `Thẻ ${card.type} bị cấm bởi khách hàng` };
            }
        }

        // For TOOL type — allow duplicates
        if (card.type === 'TOOL') return { ok: true };

        // For all other types — check if same type already exists on chassis
        const sameTypeExists = slots.some(s => s && s.type === card.type);
        if (sameTypeExists) return { ok: false, reason: `Đã có thẻ nhóm ${card.type} trên xe` };

        // Check exact duplicate card
        const sameCardExists = slots.some(s => s && s.id === card.id);
        if (sameCardExists) return { ok: false, reason: 'Thẻ này đã được lắp' };

        return { ok: true };
    };

    // ─── Drag Start ───
    const handleDragStart = (e: DragStartEvent) => {
        setIsBoxOpen(false);
        setHoverPreviewCard(null);
        const { active } = e;
        if (active.data.current?.card) {
            setActiveDragCard(active.data.current.card);
        }
    };

    // Flash rejection effect
    const triggerReject = (slotIndex: number) => {
        setRejectedSlotIndex(slotIndex);
        setTimeout(() => setRejectedSlotIndex(null), 800);
    };

    // ─── Drag End ───
    const handleDragEnd = (e: DragEndEvent) => {
        setActiveDragCard(null);
        const { active, over } = e;

        if (!over) {
            // Dropped outside — if from slot, remove it
            if (active.data.current?.source === 'slot') {
                const sourceIndex = active.data.current?.index as number;
                const newSlots = [...slots];
                newSlots[sourceIndex] = null;
                setSlots(newSlots);
            } else if (active.data.current?.source === 'crew') {
                const sourceIndex = active.data.current?.index as number;
                const newCrew = [...crewSlots];
                newCrew[sourceIndex] = null;
                setCrewSlots(newCrew);
            }
            return;
        }

        const source = active.data.current?.source;
        const card = active.data.current?.card;

        // ── Drop onto chassis slot ──
        if (over.data.current?.type === 'slot') {
            const targetIndex = over.data.current.index;
            const newSlots = [...slots];

            if (source === 'inventory') {
                const avail = getAvailableQuantity(card.id);
                if (avail <= 0) return;

                const validation = canDropToSlot(card);
                if (!validation.ok) {
                    triggerReject(targetIndex);
                    return;
                }
                newSlots[targetIndex] = card;
                setSlots(newSlots);
                triggerInstallVFX(targetIndex);
                // Play drop card sound
                const dropSound = new Audio('/sfx/dropcard.mp3');
                dropSound.volume = 0.5;
                dropSound.play().catch(err => console.error('Error playing drop sound:', err));

            } else if (source === 'slot') {
                const sourceIndex = active.data.current?.index as number;
                const sourceCard = slots[sourceIndex];
                
                // Validate the swap to prevent duplicate types
                if (sourceCard) {
                    const validation = canDropToSlot(sourceCard);
                    if (!validation.ok) {
                        triggerReject(targetIndex);
                        return;
                    }
                }
                
                // Swap between slots
                const temp = newSlots[targetIndex];
                newSlots[targetIndex] = newSlots[sourceIndex];
                newSlots[sourceIndex] = temp;
                setSlots(newSlots);

            } else if (source === 'crew') {
                // Crew card cannot go into chassis slot
                triggerReject(targetIndex);
                return;
            }
        }

        // ── Drop onto crew slot ──
        if (over.data.current?.type === 'crew') {
            const targetIndex = over.data.current.index;
            const unlockedCount = user?.crewSlots || 1;
            if (targetIndex >= unlockedCount) return; // Locked slot

            const newCrew = [...crewSlots];

            if (source === 'inventory') {
                if (card.type !== 'CREW') return; // Only crew cards
                const avail = getAvailableQuantity(card.id);
                if (avail <= 0) return;
                // No duplicate crew
                if (newCrew.some(c => c && c.id === card.id)) return;
                newCrew[targetIndex] = card;
                setCrewSlots(newCrew);
                // Play drop card sound for crew
                const dropSound = new Audio('/sfx/dropcard.mp3');
                dropSound.volume = 0.5;
                dropSound.play().catch(err => console.error('Error playing drop sound:', err));

            } else if (source === 'crew') {
                const sourceIndex = active.data.current?.index as number;
                const temp = newCrew[targetIndex];
                newCrew[targetIndex] = newCrew[sourceIndex];
                newCrew[sourceIndex] = temp;
                setCrewSlots(newCrew);

            } else if (source === 'slot') {
                // Chassis card cannot go into crew slot
                return;
            }
        }
    };

    // ─── Phase 5: Animation Sequence ───
    useEffect(() => {
        if (!isTesting) return;

        // Chỉ chạy khi đã có steps từ backend
        if (!testSteps) return;

        if (scanIndex < testSteps.length && scanIndex >= 0) {
            const timer = setTimeout(() => {
                const step = testSteps[scanIndex];
                if (step && step.cardType !== 'EMPTY') {
                    setAccumulatedPower(step.totalPower);
                    setAccumulatedHeat(step.currentHeat);

                    // VFX text đồng bộ backend (đã áp effect/combo/crew)
                    const sign = step.heatAdded >= 0 ? '+' : '';
                    const parts: string[] = [`+${step.powerAdded} PWR`, `${sign}${step.heatAdded}🌡`];
                    if (step.stabilityReduced) parts.push(`-${step.stabilityReduced}❄`);
                    if (step.comboTriggered) parts.push(`🔗 COMBO`);
                    if (step.effectTriggered) parts.push(`✨ EFFECT`);
                    setShowVFX({ index: scanIndex, text: parts.join(' / ') });
                }
                setScanIndex(prev => prev + 1);
            }, 600);
            return () => clearTimeout(timer);

        } else if (testSteps && scanIndex >= testSteps.length) {
            const timer = setTimeout(() => {
                setShowVFX(null);
                const success = testFinalResult?.success === true;
                const exploded = testFinalResult?.exploded === true;

                if (success) {
                    setTestResult('success');
                    const coins = Array.from({ length: 12 }, (_, i) => ({
                        id: i,
                        x: 45 + Math.random() * 10 - 5,
                        y: 55 + Math.random() * 10 - 5,
                        delay: i * 80,
                    }));
                    setFlyingCoins(coins);
                    setTimeout(() => setFlyingCoins([]), 2500);
                } else {
                    setTestResult('fail');
                    // Penalty sẽ được backend xử lý khi gọi quest complete API
                    // (không set local nữa để tránh desync với DB)
                    setPenaltyApplied(true);
                }
                setIsTesting(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isTesting, scanIndex, testSteps, testFinalResult, activeQuest, user, updateGarageHealth]);

    // ─── Start Test — GỌI BACKEND để áp effect/combo/crew/boss ───
    const handleStartTest = async () => {
        const filledSlots = slots.filter(s => s !== null);
        if (filledSlots.length === 0) return;

        // Calculate minimum required slots
        const isBoss = activeQuest?.isBoss;
        let minRequiredSlots = 10; // Default for normal NPCs

        if (isBoss && activeQuest?.bossConfig?.specialCondition) {
            // Boss may ban certain card groups, reducing required slots
            const bannedGroups = activeQuest.bossConfig.specialCondition.split(',').filter(Boolean);
            minRequiredSlots = 10 - bannedGroups.length;
        }

        if (filledSlots.length < minRequiredSlots) {
            setTestErrorMsg(isBoss
                ? `Boss yêu cầu ít nhất ${minRequiredSlots} thẻ (do bị cấm ${10 - minRequiredSlots} nhóm thẻ). Hiện tại bạn chỉ có ${filledSlots.length} thẻ.`
                : `NPC thường yêu cầu đầy đủ 10 thẻ. Hiện tại bạn chỉ có ${filledSlots.length} thẻ.`);
            return;
        }

        // Play on test sound
        const testSound = new Audio('/sfx/ontest-sfx.mp3');
        testSound.volume = 0.6;
        testSound.play().catch(err => console.error('Error playing test sound:', err));

        // Reset UI trước khi gọi API
        setTestErrorMsg(null);
        setTestSteps(null);
        setTestFinalResult(null);
        setAccumulatedPower(0);
        setAccumulatedHeat(0);
        setShowVFX(null);
        setIsBoxOpen(false);
        setPenaltyApplied(false);
        setFlyingCoins([]);
        setTestResult('none');
        setFailureReason(null);

        // Cần quest để chạy backend (áp effect/boss). Nếu không có → báo lỗi.
        if (!activeQuest?.id) {
            setTestErrorMsg('Chưa nhận quest — không thể chạy test áp effect/combo. Hãy nhận 1 quest trước.');
            return;
        }

        // Gửi 10-slot array (slot trống = null) để backend giữ đúng index combo
        const cardIds = slots.map(s => (s ? s.id : null));
        const crewCardIds = crewSlots.filter(Boolean).map((c: any) => c.id);

        try {
            setIsTesting(true);
            setScanIndex(-1); // chờ backend trả về rồi set 0
            const res = await fetch('/api/workshop/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cardIds,
                    questId: activeQuest.id,
                    crewCardIds,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setIsTesting(false);
                setTestErrorMsg(data?.error || 'Lỗi khi chạy test');
                return;
            }
            setTestSteps(data.steps || []);
            setTestFinalResult(data.result || null);
            setScanIndex(0); // kích hoạt animation
        } catch (err: any) {
            setIsTesting(false);
            setTestErrorMsg('Lỗi kết nối: ' + (err?.message || 'unknown'));
        }
    };

    // ─── Heat Calculation (Sequential — đồng bộ backend) ───
    // Duyệt tuần tự Slot 1→10, mỗi slot: heat += statHeat; heat = max(0, heat - statStability).
    // Cho phép cooling card (âm heat) giảm nhiệt cộng dồn + stability bù trừ đúng logic.
    const baseTotalHeat = useMemo(() => computeSequentialHeat(slots), [slots]);

    const currentDisplayHeat = isTesting ? accumulatedHeat : baseTotalHeat;
    const heatPercentage = Math.min(100, Math.max(0, currentDisplayHeat));
    const isOverheated = currentDisplayHeat >= 100 || testResult === 'fail';

    const filledSlotsCount = slots.filter(Boolean).length;

    // Calculate minimum required slots
    const isBoss = activeQuest?.isBoss;
    let minRequiredSlots = 10; // Default for normal NPCs

    if (isBoss && activeQuest?.bossConfig?.specialCondition) {
        // Boss may ban certain card groups, reducing required slots
        const bannedGroups = activeQuest.bossConfig.specialCondition.split(',').filter(Boolean);
        minRequiredSlots = 10 - bannedGroups.length;
    }

    const canStartTest = filledSlotsCount >= minRequiredSlots && !isTesting && testResult === 'none';

    // ─── Car Frame Brightness (10% → 100%) ───
    // Cơ chế: khung xe mờ (10%). Mỗi thẻ lắp vào → sáng dần.
    // Số slot có thể lắp = 10 − (số nhóm bị boss cấm).
    // Step = 90 / maxFillable ⇒ lắp đủ maxFillable → 100%.
    // ─── Return to lobby helper (skip shadow intro + complete quest via API) ───
    const goToLobby = useCallback(async () => {
        // Gọi API complete quest để backend persist kết quả + penalty
        if (activeQuest?.id && token && testResult !== 'none') {
            try {
                // The backend requires 'SUCCESS' or 'FAILED'
                const status = testResult === 'success' ? 'SUCCESS' : 'FAILED';
                
                // Collect used card IDs from slots and crew slots
                const usedCardIds: number[] = [];
                for (const slot of slots) {
                    if (slot?.id) usedCardIds.push(slot.id);
                }
                for (const crew of crewSlots) {
                    if (crew?.id) usedCardIds.push(crew.id);
                }
                
                const res = await fetch(`/api/quest/${activeQuest.id}/complete`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status, usedCardIds }),
                });
                if (res.ok) {
                    const data = await res.json();
                    // Cập nhật uy tín từ backend (đã trừ penalty hoặc cộng thưởng)
                    if (data.userState?.garageHealth !== undefined) {
                        updateGarageHealth(data.userState.garageHealth);
                    }
                    // Cập nhật vàng (bao gồm cả thưởng ngân sách nếu có)
                    if (data.userState?.gold !== undefined) {
                        updateGold(data.userState.gold);
                    }
                    // Game over check
                    if (data.gameOver) {
                        setScreen('ending');
                        return;
                    }
                }
            } catch (err) {
                console.error('Error completing quest:', err);
                // Fallback: local penalty nếu API fail
                if (testResult === 'fail') {
                    const penalty = activeQuest?.isBoss ? 20 : 10;
                    const newHealth = Math.max(0, (user?.garageHealth || 100) - penalty);
                    updateGarageHealth(newHealth);
                }
            }
        }
        setSkipShadowIntro(true);
        setActiveBossMusic(null); // Reset boss music khi về lobby
        transitionScreen('lobby');
    }, [activeQuest, token, testResult, user, slots, crewSlots, updateGarageHealth, updateGold, setSkipShadowIntro, setActiveBossMusic, setScreen, transitionScreen]);

    // ─── NPC image của quest hiện tại ───
    const isInNK = !!(user as any)?.isInNorthKorea;
    const questNpcImage = useMemo(() => getQuestNpcImage(activeQuest, isInNK), [activeQuest, isInNK]);

    const bannedCoreCount = useMemo(() => {
        if (!activeQuest?.bossConfig?.specialCondition) return 0;
        const cond = String(activeQuest.bossConfig.specialCondition).toUpperCase();
        const banned = new Set<string>();
        // Mô tả tự do (tooltip detection cũ)
        if (cond.includes('COOLING') || cond.includes('TẢN NHIỆT')) banned.add('COOLING');
        if (cond.includes('NITROUS') || cond.includes('NOS')) banned.add('NITROUS');
        if (cond.includes('TURBO')) banned.add('TURBO');
        // Mã specialCondition backend
        if (cond === 'NO_COOLING') banned.add('COOLING');
        // EP_ISLAND_CHOICE nhánh NO cấm COOLING — tính chặt cho an toàn
        if (cond === 'EP_ISLAND_CHOICE') banned.add('COOLING');
        // BABY_OIL_CHOICE nhánh YES cấm FUEL
        if (cond === 'BABY_OIL_CHOICE') banned.add('FUEL');
        return banned.size;
    }, [activeQuest]);

    const maxFillableSlots = Math.max(1, 10 - bannedCoreCount);
    const brightnessStep = 90 / maxFillableSlots;           // % / thẻ
    const carBrightnessPct = Math.min(100, 10 + filledSlotsCount * brightnessStep);

    // ─── Quest data ───
    const questName = activeQuest?.isBoss && activeQuest?.bossConfig?.name
        ? activeQuest.bossConfig.name
        : activeQuest ? `Khách #${activeQuest.id}` : 'Không có Quest';
    const questDesc = activeQuest?.isBoss && activeQuest?.bossConfig?.description
        ? activeQuest.bossConfig.description
        : activeQuest ? `"Cần ${activeQuest.requiredPower > 0 ? activeQuest.requiredPower + ' mã lực' : 'xe chạy tốt'}. Làm nhanh lên!"` : '"Chưa nhận Quest"';
    const questPower = activeQuest?.requiredPower || 0;
    const questGold = activeQuest?.rewardGold || activeQuest?.customerBudget || 0;
    const questBanned = activeQuest?.bossConfig?.specialCondition || null;
    const questImageUrl = activeQuest?.bossConfig?.imageUrl || null;
    const isBossQuest = activeQuest?.isBoss || false;

    // Customer Budget (chỉ áp dụng cho quest thường)
    const customerBudget: number = (!isBossQuest && activeQuest?.customerBudget > 0) ? activeQuest.customerBudget : 0;

    // Ước lượng chi phí thẻ hiện tại (5* chỉ tính 50%)
    const estimatedCardCost = useMemo(() => {
        const allCards = [...slots.filter(Boolean), ...crewSlots.filter(Boolean)];
        return allCards.reduce((sum, card: any) => {
            const effectiveCost = card.rarity === 5 ? Math.floor((card.cost || 0) * 0.5) : (card.cost || 0);
            return sum + effectiveCost;
        }, 0);
    }, [slots, crewSlots]);

    // Budget profit dự kiến: budget - chi phí thẻ
    const estimatedBudgetProfit = customerBudget > 0 ? Math.max(0, customerBudget - estimatedCardCost) : 0;

    const unlockedCrewSlots = user?.crewSlots || 1;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={!isTesting ? handleDragStart : undefined}
            onDragEnd={!isTesting ? handleDragEnd : undefined}
        >
        <div
            className={`relative min-h-screen bg-[url('/workshop-bg.png')] bg-cover bg-center overflow-hidden font-mono text-cyan-50 ${shakeActive ? styles.installShakeRoot : ''}`}
        >
            {/* Note: Gold/TP display removed from Workshop - only shown in Lobby */}
            {/* Modals kept for unlock crew slot functionality */}
            <BuyTpModal />
            <TopupGoldModal />

            {/* Install flash overlay (chớp trắng-vàng khi lắp thẻ) */}
            {flashKey !== 0 && (
                <div key={`flash-${flashKey}`} className={styles.installFlashOverlay} />
            )}

            {/* Dim overlay when inventory box is open (excludes sidebar + box) */}
            {isBoxOpen && (
                <div
                    className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-all"
                    onClick={() => setIsBoxOpen(false)}
                />
            )}

            {/* Missing Types Notification Tooltip */}
            <div className="absolute z-50" style={{ pointerEvents: 'none' }}>
                <MissingTypesTooltip slots={slots} crewSlots={crewSlots} activeQuest={activeQuest} />
            </div>

            {/* Card Hover Preview (appears next to inventory box) + combo partners chained to the right */}
            {hoverPreviewCard && isBoxOpen && (() => {
                const hoveredId = hoverPreviewCard.id;
                const relatedCombos = combos.filter((c: any) => c.card1.id === hoveredId || c.card2.id === hoveredId);
                return (
                    <div className="absolute left-[590px] top-1/2 -translate-y-1/2 z-[60] pointer-events-none flex items-center gap-3">
                        {/* Hovered card — large preview */}
                        <div className="w-48 shrink-0">
                            <div className="bg-slate-950/95 border border-cyan-500/40 p-2 shadow-[0_0_40px_rgba(34,211,238,0.3)] backdrop-blur-md">
                                <img
                                    src={getImageUrl(hoverPreviewCard)}
                                    alt={hoverPreviewCard.name}
                                    onError={(e) => handleImageError(e, hoverPreviewCard.id)}
                                    className="w-full h-auto object-contain"
                                />
                                <div className="mt-2 px-1">
                                    <div className="text-[10px] font-bold text-cyan-300 text-center leading-tight">{hoverPreviewCard.name}</div>
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-[9px] text-amber-400">⚡ {hoverPreviewCard.statPower || 0}</span>
                                        <span className="text-[9px] text-red-400">🌡 {hoverPreviewCard.statHeat || 0}</span>
                                        <span className="text-[9px] text-blue-400">❄ {hoverPreviewCard.statStability || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Combo partner cards — same big size, chained with link icon */}
                        {relatedCombos.map((combo: any) => {
                            const partner = combo.card1.id === hoveredId ? combo.card2 : combo.card1;
                            return (
                                <React.Fragment key={combo.id}>
                                    <ChainLinkSVG size={36} />
                                    <div className="w-48 shrink-0">
                                        <div className="bg-slate-950/95 border border-amber-500/60 p-2 shadow-[0_0_40px_rgba(251,191,36,0.35)] backdrop-blur-md">
                                            <img
                                                src={getImageUrl(partner)}
                                                alt={partner.name}
                                                onError={(e) => handleImageError(e, partner.id)}
                                                className="w-full h-auto object-contain"
                                            />
                                            <div className="mt-2 px-1">
                                                <div className="text-[10px] font-bold text-amber-300 text-center leading-tight">{partner.name}</div>
                                                <div className="mt-1.5 text-center">
                                                    <span className="text-[9px] text-amber-400 font-bold tracking-wider">🔗 {combo.name}</span>
                                                </div>
                                                {combo.description && (
                                                    <div className="text-[8px] text-amber-200/70 text-center mt-1 leading-tight line-clamp-2">
                                                        {combo.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                );
            })()}

            <div className="relative w-full h-screen flex p-6 gap-6">

                {/* ══════════════════════════════════════════════
                    LEFT PANEL: Kho Thẻ Sidebar (z-50 — above dim)
                ═══════════════════════════════════════════════*/}
                <div className="w-[100px] h-full flex flex-col items-center bg-slate-950/90 border-2 border-slate-700/60 py-4 shadow-[20px_0_30px_rgba(0,0,0,0.8)] z-50">
                    <div className="text-center border-b border-cyan-800/50 w-full pb-2 mb-4 shrink-0">
                        <div className="text-[10px] text-cyan-400 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                            KHO THẺ
                        </div>
                    </div>

                    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2 px-2 pb-10
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-cyan-900/60
                        [&::-webkit-scrollbar-thumb]:rounded">
                        {CATEGORIES.map(cat => {
                            const count = inventory.filter(i => i.card.type === cat.type).reduce((sum, i) => sum + i.quantity, 0);
                            const isActive = activeCategory === cat.type && isBoxOpen;
                            return (
                                <div
                                    key={cat.type}
                                    onClick={() => {
                                        if (isActive) {
                                            setIsBoxOpen(false);
                                        } else {
                                            setActiveCategory(cat.type);
                                            setIsBoxOpen(true);
                                        }
                                    }}
                                    className={`relative w-full flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all border
                                        ${isActive ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105' : 'bg-slate-900/50 border-transparent hover:border-slate-600 hover:bg-slate-800/80'}
                                    `}
                                >
                                    <div className={`text-2xl mb-1 ${isActive ? '' : 'opacity-70'}`}>{cat.icon}</div>
                                    <div className={`text-[8px] tracking-widest font-bold text-center ${isActive ? 'text-cyan-200' : 'text-slate-500'}`}>
                                        {cat.label}
                                    </div>
                                    {count > 0 && (
                                        <div className="absolute top-1 right-1 bg-red-900/90 text-red-100 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md border border-red-500/50">
                                            {count}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    POP-OUT INVENTORY BOX (z-50 — above dim)
                ═══════════════════════════════════════════════*/}
                <div
                    className={`absolute left-[130px] top-6 bottom-6 w-[350px] lg:w-[420px] bg-slate-950/95 border-2 border-slate-700/60 p-5 shadow-[40px_0_50px_rgba(0,0,0,0.9)] z-50 transition-all duration-300 origin-left flex flex-col
                        ${isBoxOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`}
                >
                    <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{CATEGORIES.find(c => c.type === activeCategory)?.icon}</span>
                            <h2 className="text-xl font-bold text-cyan-400 tracking-widest">
                                {CATEGORIES.find(c => c.type === activeCategory)?.label || 'LINH KIỆN'}
                            </h2>
                        </div>
                        <button onClick={() => setIsBoxOpen(false)} className="text-slate-500 hover:text-red-400 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-slate-900/50
                        [&::-webkit-scrollbar-thumb]:bg-cyan-900/60
                        [&::-webkit-scrollbar-thumb:hover]:bg-cyan-700">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-cyan-500">
                                <div className="animate-spin w-8 h-8 border-t-2 border-cyan-500 rounded-full" />
                            </div>
                        ) : inventory.filter(i => i.card.type === activeCategory).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs tracking-widest gap-2">
                                <span className="text-4xl opacity-20">📦</span>
                                CHƯA SỞ HỮU LINH KIỆN NÀY
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                {inventory.filter(item => item.card.type === activeCategory).map((item) => {
                                    const card = item.card;
                                    const availQty = getAvailableQuantity(card.id);
                                    return (
                                        <DraggableInventoryCard
                                            key={card.id}
                                            card={card}
                                            quantity={availQty}
                                            onHoverPreview={setHoverPreviewCard}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    CENTER PANEL: Workshop Core
                    ─────────────────────────────────────────────
                    🛠 VỊ TRÍ CỦA THANH HEAT & 10 SLOT có thể chỉnh
                       trong khối style={{ ... }} ở div "CORE STACK"
                       dưới đây (top / gap / marginTop...).
                    🛠 VỊ TRÍ ẢNH KHUNG XE (lvl1..lvl5) chỉnh ở
                       div "CAR FRAME ZONE" phía dưới
                       (top/left/width/height/bottom).
                ═══════════════════════════════════════════════*/}
                <div className="relative flex-1 h-full flex flex-col items-center z-10">

                    {/* ─────────────────────────────────────
                        CORE STACK: Crew → Heat Bar → 10 Slots
                        Điều chỉnh khoảng cách tại đây:
                        - paddingTop   : đẩy cả cụm xuống khỏi mép trên
                        - gap          : khoảng cách giữa Crew / Heat / Slot
                    ───────────────────────────────────────*/}
                    <div
                        className="w-full flex flex-col items-center"
                        style={{ paddingTop: '16px', gap: '18px' }}
                    >
                        {/* TOP: Crew Slots */}
                        <div className="w-full flex justify-center gap-4">
                            {Array.from({ length: MAX_CREW_SLOTS }).map((_, i) => (
                                <CrewSlot
                                    key={i}
                                    index={i}
                                    card={crewSlots[i]}
                                    isUnlocked={i < unlockedCrewSlots}
                                    disabledDnd={isTesting}
                                    onLockedClick={handleLockedCrewClick}
                                />
                            ))}
                        </div>

                        {/* 1. Heat Bar (ngay dưới Crew) */}
                        <div className={`w-[55%] max-w-xl relative transition-all ${isOverheated ? 'animate-pulse' : ''}`}>
                            <div className={`h-5 bg-slate-950 border-2 rounded-full overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isOverheated ? 'border-red-500' : 'border-slate-700/80'}`}>
                                <div
                                    className={`h-full relative transition-all duration-300 ${isOverheated ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-400' : heatPercentage > 75 ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500'}`}
                                    style={{ width: `${heatPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50" />
                                </div>
                                {isOverheated && (
                                    <div className="absolute inset-0 bg-red-500/20 animate-ping" />
                                )}
                            </div>
                            <div className={`absolute -top-5 left-1/2 -translate-x-1/2 border px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono shadow-lg tracking-widest transition-colors
                                ${isOverheated ? 'bg-red-900 border-red-500 text-red-200 animate-bounce' : 'bg-slate-800 border-slate-600 text-cyan-200'}
                            `}>
                                NHIỆT ĐỘ: {currentDisplayHeat}% {isOverheated ? '⚠ CẢNH BÁO' : ''}
                            </div>
                        </div>

                        {/* 1b. Power Bar (nhỏ — giữa Heat Bar & 10 Slot). */}
                        {/*     Chỉ hiển thị giá trị thực khi đang on-test hoặc vừa test xong. */}
                        {/*     Trước khi test → thanh tối + dấu "?". */}
                        {(() => {
                            const powerActive = isTesting || testResult !== 'none';
                            const powerTarget = questPower > 0 ? questPower : 500;
                            const powerPct = powerActive
                                ? Math.min(100, Math.max(0, (accumulatedPower / Math.max(1, powerTarget)) * 100))
                                : 0;
                            const powerMet = powerActive && questPower > 0 && accumulatedPower >= questPower;
                            return (
                                <div className="w-[42%] max-w-md relative">
                                    <div className={`h-3 border rounded-full overflow-hidden relative shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)] ${
                                        powerActive
                                            ? (powerMet ? 'bg-slate-950 border-emerald-500' : 'bg-slate-950 border-amber-600/70')
                                            : 'bg-slate-900/60 border-slate-700/40'
                                    }`}>
                                        {powerActive ? (
                                            <div
                                                className={`h-full transition-all duration-300 ${
                                                    powerMet
                                                        ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400'
                                                        : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                                                }`}
                                                style={{ width: `${powerPct}%` }}
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(100,116,139,0.15)_0_6px,transparent_6px_12px)]" />
                                        )}
                                    </div>
                                    <div className={`absolute -top-[18px] left-1/2 -translate-x-1/2 border px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono shadow-lg tracking-widest
                                        ${powerActive
                                            ? (powerMet ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200' : 'bg-amber-900/80 border-amber-500 text-amber-200')
                                            : 'bg-slate-900/80 border-slate-700 text-slate-500'}
                                    `}>
                                        {powerActive
                                            ? `MÃ LỰC: ${accumulatedPower}${questPower > 0 ? ` / ${questPower}` : ''}`
                                            : 'MÃ LỰC: ?'}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. 10 Slots Panel (ngay dưới Heat Bar) */}
                        <div className="flex justify-center gap-1 lg:gap-1.5 relative z-10 w-full px-4">
                            {/* SVG Combo Neon Lines Overlay */}
                            {activeSlotCombos.length > 0 && (
                                <svg className={styles.comboSvgOverlay} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 25 }}>
                                    <defs>
                                        <linearGradient id="comboGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                                            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                                        </linearGradient>
                                    </defs>
                                    {activeSlotCombos.map((ac, idx) => {
                                        // Tính toạ độ tương đối cho line: mỗi slot ~62px wide (w-14=56 + gap~6)
                                        const slotWidth = 62;
                                        const totalWidth = 10 * slotWidth;
                                        const offsetX = (100 - (totalWidth / 10)) / 2;
                                        const x1Pct = ((ac.slotA + 0.5) / 10) * 100;
                                        const x2Pct = ((ac.slotB + 0.5) / 10) * 100;
                                        return (
                                            <line
                                                key={idx}
                                                x1={`${x1Pct}%`}
                                                y1="50%"
                                                x2={`${x2Pct}%`}
                                                y2="50%"
                                                className={styles.comboSvgLine}
                                            />
                                        );
                                    })}
                                </svg>
                            )}
                            {slots.map((card, i) => (
                                <div key={i} className="relative">
                                    <WorkshopSlot
                                        index={i}
                                        card={card}
                                        isScanning={scanIndex === i}
                                        isTested={scanIndex > i && isTesting}
                                        disabledDnd={isTesting}
                                        vfxText={showVFX?.index === i ? showVFX.text : undefined}
                                        rejected={rejectedSlotIndex === i}
                                        isCombo={comboSlotSet.has(i)}
                                        comboName={comboSlotBadgeMap.get(i)}
                                    />
                                    {/* Install spark burst — tóe lửa khi vừa lắp thẻ vào slot này */}
                                    {sparkSlot?.index === i && (
                                        <div key={sparkSlot.key} className={styles.installSparkBurst}>
                                            <span className="text-2xl" style={{ ['--sx' as any]: '-22px', ['--sy' as any]: '-18px' }}>✨</span>
                                            <span className="text-xl"  style={{ ['--sx' as any]: '24px',  ['--sy' as any]: '-14px' }}>⚡</span>
                                            <span className="text-xl"  style={{ ['--sx' as any]: '-18px', ['--sy' as any]: '22px'  }}>💥</span>
                                            <span className="text-lg"  style={{ ['--sx' as any]: '20px',  ['--sy' as any]: '20px'  }}>✨</span>
                                            <span className="text-lg"  style={{ ['--sx' as any]: '0px',   ['--sy' as any]: '-26px' }}>🔥</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─────────────────────────────────────
                        CAR FRAME ZONE (ảnh khung xe lvl1..lvl5)
                        Chỉnh kích thước / vị trí ở style bên dưới.
                        Level = theo requiredPower của quest hiện tại.
                    ───────────────────────────────────────*/}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[5] flex items-center justify-center"
                        style={{
                            bottom: '20%',      // 🛠 nâng/hạ khung xe
                            left: '55%',       // 🛠 căn giữa khung xe
                            width: '55%',      // 🛠 chiều rộng vùng hiển thị
                            maxWidth: '620px',
                            height: '38%',     // 🛠 chiều cao vùng hiển thị
                        }}
                    >
                        <img
                            src={`/carframeimg/lvl${getCarLevelFromPower(questPower)}.png`}
                            alt={`Car Frame Lv${getCarLevelFromPower(questPower)}`}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            className="max-w-full max-h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] select-none transition-[filter] duration-500"
                            style={{ filter: `brightness(${carBrightnessPct}%)` }}
                        />
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    RIGHT PANEL: Quest Box + Rep + Actions
                ═══════════════════════════════════════════════*/}
                <div className="absolute top-6 right-6 w-[240px] flex flex-col gap-3 z-30 pointer-events-none">

                    {/* Active Quest Box */}
                    <div className={`border p-3 backdrop-blur-md shadow-2xl pointer-events-auto relative overflow-hidden ${
                        isBossQuest
                            ? 'bg-red-950/80 border-red-700/60'
                            : 'bg-slate-950/80 border-slate-700/50'
                    }`}>
                        {/* Live indicator */}
                        <div className="absolute top-0 right-0 p-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-lg ${isBossQuest ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]'}`} />
                        </div>

                        <h2 className={`text-[10px] font-bold tracking-[0.1em] border-b pb-1.5 mb-2 ${isBossQuest ? 'text-red-400 border-red-800' : 'text-amber-500 border-slate-700'}`}>
                            {isBossQuest ? '⚠ BOSS QUEST' : 'YÊU CẦU LẮP RÁP'}
                        </h2>

                        <div className="flex gap-2 mb-2">
                            {/* Avatar — NPC image của quest vừa nhận */}
                            <div className={`w-12 h-12 border flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden ${isBossQuest ? 'bg-red-900/50 border-red-700/50' : 'bg-slate-800 border-slate-600'}`}>
                                {questNpcImage ? (
                                    <img
                                        src={questNpcImage}
                                        alt={questName}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        className="w-full h-full object-cover"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                ) : (
                                    <span className="text-slate-500 text-[10px]">{isBossQuest ? '👤' : '?'}</span>
                                )}
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <div className="text-[8px] font-bold tracking-widest text-slate-400 leading-none">KHÁCH HÀNG</div>
                                <div className={`font-bold text-xs leading-none ${isBossQuest ? 'text-red-200' : 'text-cyan-100'}`}>{questName}</div>
                            </div>
                        </div>

                        {/* Quote */}
                        <div className={`px-2 py-1 rounded border-l-2 text-[9px] leading-relaxed italic mb-2 ${isBossQuest ? 'bg-red-900/40 border-red-500 text-red-200/80' : 'bg-slate-900/80 border-amber-500 text-cyan-100/90'}`}>
                            {questDesc}
                        </div>

                        {/* Quest Stats */}
                        <div className="space-y-1 p-1.5 bg-slate-900/60 rounded border border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] font-bold text-slate-500 tracking-wider">MÃ LỰC YÊU CẦU</span>
                                <span className="font-bold text-white text-[10px]">{questPower > 0 ? `≥ ${questPower}` : 'TUỲ Ý'}</span>
                            </div>
                            {questGold > 0 && (
                                <div className="flex justify-between items-center border-t border-slate-800/50 pt-1">
                                    <span className="text-[8px] font-bold text-slate-500 tracking-wider">THƯỞNG</span>
                                    <span className="font-bold text-amber-400 text-[10px]">{questGold.toLocaleString()} G</span>
                                </div>
                            )}
                            {/* Customer Budget — chỉ hiện cho quest thường */}
                            {customerBudget > 0 && (
                                <>
                                    <div className="flex justify-between items-center border-t border-emerald-900/50 pt-1">
                                        <span className="text-[8px] font-bold text-emerald-600 tracking-wider">NGÂN SÁCH KH</span>
                                        <span className="font-bold text-emerald-400 text-[10px]">{customerBudget.toLocaleString()} G</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-bold text-slate-500 tracking-wider">↳ CHI PHÍ THẺ</span>
                                        <span className={`font-bold text-[10px] ${
                                            estimatedCardCost === 0 ? 'text-slate-500' :
                                            estimatedCardCost <= customerBudget ? 'text-cyan-400' : 'text-red-400'
                                        }`}>{estimatedCardCost > 0 ? `${estimatedCardCost.toLocaleString()} G` : '---'}</span>
                                    </div>
                                    {estimatedCardCost > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-slate-500 tracking-wider">↳ LỢI NHUẬN DỰ ĐỰ</span>
                                            <span className={`font-bold text-[10px] ${
                                                estimatedBudgetProfit > 0 ? 'text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]' : 'text-red-400'
                                            }`}>
                                                {estimatedBudgetProfit > 0 ? `+${estimatedBudgetProfit.toLocaleString()} G` : 'âm lợi'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                            {questBanned && (
                                <div className="flex justify-between items-center border-t border-slate-800/50 pt-1">
                                    <span className="text-[8px] font-bold text-slate-500 tracking-wider">ĐIỀU KIỆN</span>
                                    <span className="font-bold text-red-400 text-[8px] tracking-wider">{questBanned}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats & Rep */}
                    <div className="bg-slate-950/80 border border-slate-700/50 p-2.5 backdrop-blur-md shadow-2xl pointer-events-auto flex items-center justify-between">
                        <div>
                            <div className="text-[8px] tracking-[0.2em] font-bold text-slate-500">UY TÍN XƯỞNG</div>
                            <div className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${(user?.garageHealth || 0) >= 75 ? 'text-emerald-500' : (user?.garageHealth || 0) >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                {(user?.garageHealth || 0) >= 75 ? 'TUYỆT HOÀN HẢO' : (user?.garageHealth || 0) >= 40 ? 'TRUNG BÌNH' : 'NGUY HIỂM'}
                            </div>
                        </div>
                        <div className={`text-2xl font-bold drop-shadow-lg ${(user?.garageHealth || 0) >= 75 ? 'text-emerald-400' : (user?.garageHealth || 0) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {user?.garageHealth || 0}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col gap-2 pointer-events-auto z-50">
                        {/* Test error message */}
                        {testErrorMsg && (
                            <div className="w-full px-3 py-2 bg-red-950/80 border-2 border-red-500/60 text-red-200 text-[10px] tracking-wide font-bold backdrop-blur-md">
                                ⚠ {testErrorMsg}
                            </div>
                        )}

                        {/* Main action button */}
                        {testResult === 'none' ? (
                            <button
                                disabled={!canStartTest}
                                onClick={handleStartTest}
                                className={`w-full py-3.5 rounded-lg font-bold tracking-[0.15em] transition-all uppercase text-sm border-2 ${
                                    canStartTest
                                        ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 hover:bg-cyan-800 hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer'
                                        : 'bg-slate-900/60 text-slate-600 border-slate-700/50 cursor-not-allowed opacity-60'
                                }`}
                            >
                                {isTesting ? '⏳ ĐANG CHẠY...' : filledSlotsCount === 0 ? 'LẮP THẺ ĐÃ' : 'CHẠY THỬ XE'}
                            </button>
                        ) : testResult === 'success' ? (
                            // SUCCESS — no làm lại, just show success state + close garage
                            <div className="w-full py-3 rounded-lg border-2 bg-emerald-950/80 border-emerald-700 text-center">
                                <div className="text-emerald-300 font-bold text-sm tracking-widest">🏆 HOÀN THÀNH!</div>
                                {questGold > 0 && (
                                    <div className="text-amber-400 text-[10px] mt-0.5 tracking-wider font-bold">+{questGold.toLocaleString()} G ĐÃ ĐƯỢC CỘNG</div>
                                )}
                            </div>
                        ) : (
                            // FAIL — có thể click để quay về lobby (không còn nút ĐÓNG GARA)
                            <button
                                onClick={goToLobby}
                                className="w-full py-3 rounded-lg border-2 bg-red-950/80 border-red-700 text-center cursor-pointer hover:bg-red-900/80 hover:border-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all"
                            >
                                <div className="text-red-300 font-bold text-sm tracking-widest">
                                    {failureReason === 'heat' ? '💥 thiết bị quá tải!!!' : '💀 xe này yếu quá!!!!'}
                                </div>
                                <div className="text-red-400 text-[9px] mt-0.5 tracking-wider">-{isBossQuest ? 20 : 10} UY TÍN ĐÃ BỊ KHẤU TRỪ</div>
                                <div className="text-red-500/80 text-[8px] mt-1 tracking-wider italic">▶ Nhấn để quay về lobby</div>
                            </button>
                        )}

                        {/* Chỉ hiện khi chưa test — trong lúc/sau test ẨN hết */}
                        {testResult === 'none' && !isTesting && (
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => { setSlots(Array(10).fill(null)); setCrewSlots(Array(MAX_CREW_SLOTS).fill(null)); setIsTesting(false); setScanIndex(-1); setTestResult('none'); setFailureReason(null); setTestSteps(null); setTestFinalResult(null); setTestErrorMsg(null); setAccumulatedPower(0); setAccumulatedHeat(0); setShowVFX(null); }}
                                    className="flex-1 py-2.5 bg-red-950/60 text-red-400 border border-red-800/50 flex items-center justify-center font-bold tracking-widest hover:bg-red-900 transition-colors uppercase text-[10px]"
                                >
                                    XOÁ TẤT CẢ
                                </button>
                                <button
                                    onClick={goToLobby}
                                    className="flex-1 py-2.5 bg-slate-900/60 text-slate-400 border border-slate-700/50 flex items-center justify-center font-bold tracking-widest hover:bg-slate-800 hover:text-white transition-colors uppercase text-[10px]"
                                >
                                    ĐÓNG GARA
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ══════════════════════════════════════════════
                FAIL STATE OVERLAY (no làm lại + penalty)
            ═══════════════════════════════════════════════*/}
            {testResult === 'fail' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-red-950/50 mix-blend-multiply animate-pulse pointer-events-none" />
                    <button
                        onClick={goToLobby}
                        className="relative text-red-400 text-5xl font-black tracking-widest drop-shadow-[0_0_30px_#ef4444] border-4 border-red-500 px-10 py-6 bg-slate-950/90 transform -rotate-6 backdrop-blur-md flex flex-col items-center gap-2 cursor-pointer hover:scale-105 hover:shadow-[0_0_60px_rgba(239,68,68,0.8)] transition-all"
                    >
                        <span>{failureReason === 'heat' ? 'Thiết bị quá tải!!!' : 'Xe này yếu quá!!!!'}</span>
                        <span className="text-xl text-red-300 font-bold tracking-widest">-{isBossQuest ? 20 : 10} UY TÍN</span>
                        <span className="text-sm text-slate-400 font-normal tracking-wider mt-1">▶ Nhấn để quay về lobby</span>
                    </button>
                </div>
            )}
            {/* WIN STATE OVERLAY */}
            {testResult === 'success' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-cyan-950/30 mix-blend-color-dodge animate-pulse pointer-events-none" />
                    <div className="relative text-emerald-400 text-5xl font-black tracking-widest drop-shadow-[0_0_30px_#10b981] border-4 border-emerald-500 px-10 py-6 bg-slate-950/90 rounded-xl transform rotate-3 backdrop-blur-md flex flex-col items-center gap-2">
                        <span>🏆 THÀNH CÔNG RỰC RỠ!</span>
                        {questPower > 0 && (
                            <span className="text-lg text-emerald-300 font-bold tracking-widest">Mã lực đạt yêu cầu ✓</span>
                        )}
                        {questGold > 0 && (
                            <span className="text-2xl text-amber-400 font-black tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">+{questGold.toLocaleString()} 💰</span>
                        )}
                        {/* Budget profit bonus */}
                        {estimatedBudgetProfit > 0 && (
                            <span className="text-xl text-emerald-300 font-black tracking-widest drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                                +{estimatedBudgetProfit.toLocaleString()} 💵 lời ngân sách!
                            </span>
                        )}
                        <button
                            onClick={goToLobby}
                            className="mt-3 px-8 py-3 bg-emerald-900/80 border-2 border-emerald-400 text-emerald-200 text-base font-bold tracking-[0.2em] rounded-lg uppercase cursor-pointer hover:bg-emerald-800 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all"
                        >
                            ▶ VỀ LOBBY
                        </button>
                    </div>
                    {/* Flying coin animation */}
                    {flyingCoins.map(coin => (
                        <div
                            key={coin.id}
                            className="absolute text-2xl pointer-events-none"
                            style={{
                                left: `${coin.x}%`,
                                top: `${coin.y}%`,
                                animation: `coinFly 1.8s ease-out ${coin.delay}ms forwards`,
                            }}
                        >
                            💰
                        </div>
                    ))}
                </div>
            )}

            <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeDragCard ? (
                    <div className="w-20 h-28 lg:w-24 lg:h-32 flex items-center justify-center opacity-90 drop-shadow-[0_20px_30px_rgba(34,211,238,0.5)]">
                        <img
                            src={getImageUrl(activeDragCard)}
                            alt={activeDragCard.name}
                            onError={(e) => handleImageError(e, activeDragCard.id)}
                            className="w-full h-auto object-contain scale-110"
                        />
                    </div>
                ) : null}
            </DragOverlay>

            {/* Unlock Crew Slot Modal */}
            {showUnlockModal && unlockInfo && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900 border-2 border-emerald-500/50 rounded-lg p-6 max-w-sm w-full mx-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                        <h3 className="text-xl font-bold text-emerald-400 mb-4 text-center">🔓 Mở Khóa Slot Crew</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Slot hiện tại:</span>
                                <span className="text-white font-bold">{unlockInfo.currentSlots} / 5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Chi phí mở khóa:</span>
                                <span className="text-emerald-400 font-bold">{unlockInfo.nextCost} TP</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">TechPoints của bạn:</span>
                                <span className={`font-bold ${unlockInfo.techPoints >= unlockInfo.nextCost ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {unlockInfo.techPoints} TP
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnlockModal(false)}
                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUnlockCrewSlot}
                                disabled={isUnlocking || unlockInfo.techPoints < unlockInfo.nextCost}
                                className={`flex-1 py-2 rounded font-bold transition-colors ${
                                    unlockInfo.techPoints >= unlockInfo.nextCost
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isUnlocking ? 'Đang mở...' : 'Mở Khóa'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
        </DndContext>
    );
}
