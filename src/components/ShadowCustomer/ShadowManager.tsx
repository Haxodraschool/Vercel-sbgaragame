'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ShadowCustomer.module.css';
import ShadowCustomer from './ShadowCustomer';
import QuestDialog from './QuestDialog';
import { useGameStore } from '@/stores/useGameStore';
import type { BossChoiceData } from '@/stores/useGameStore';
import type { QuestData } from './ShadowCustomer';

// ─── Boss Music Map — mỗi boss → file mp3 tương ứng ─────────────────────────
const BOSS_MUSIC_MAP: Record<string, string> = {
  'DRIFT_KING_CHALLENGE': '/gamemusic/driftking.mp3',
  'NO_COOLING':           '/gamemusic/f1boss.mp3',
  'MIN_RARITY_3':         '/gamemusic/colletorboss.mp3',
  'DAREDEVIL_DEATH_WISH': '/gamemusic/DAREDEVILgirlboss.mp3',
  // Kẻ Bí Ẩn không có specialCondition cụ thể, dùng tên boss để fallback
  'MYSTERIOUS':           '/gamemusic/mysteriousboss.mp3',
  'EP_ISLAND_CHOICE':     '/gamemusic/islandboss.mp3',
  'BABY_OIL_CHOICE':      '/gamemusic/babyoilboss.mp3',
  'KIM_JONG_UN':          '/gamemusic/kimboss.mp3',
  'DONALD_TRUMP':         '/gamemusic/trumpboss.mp3',
  'RUSSIA_EMPEROR_P1':    '/gamemusic/russianbossp1.mp3',
  'RUSSIA_EMPEROR_P2':    '/gamemusic/russianbossp2.mp3',
};

/** Lấy đường dẫn nhạc boss dựa theo quest */
function getBossMusic(quest: QuestData): string | null {
  if (!quest.isBoss) return null;
  const condition = quest.bossConfig?.specialCondition;
  if (!condition) {
    // Kẻ Bí Ẩn (không có specialCondition)
    const name = quest.bossConfig?.name || '';
    if (name.includes('Bí Ẩn')) return BOSS_MUSIC_MAP['MYSTERIOUS'];
    return null;
  }
  if (condition === 'RUSSIA_EMPEROR') return BOSS_MUSIC_MAP['RUSSIA_EMPEROR_P1'];
  return BOSS_MUSIC_MAP[condition] || null;
}

/**
 * Sofa seat positions (% of the game container).
 * 8 seats: 4 on left sofa + 4 on right sofa.
 */
const SOFA_SEATS = [
  // Left sofa — facing left (from left to right)
  { left: '21%', top: '38.5%', sofa: 'left' },
  { left: '28%', top: '37%', sofa: 'left' },
  { left: '35%', top: '36%', sofa: 'left' },
  { left: '41%', top: '35%', sofa: 'left' },
  // Right sofa — facing right (from left to right)
  { left: '54%', top: '36%', sofa: 'right' }, 
  { left: '63%', top: '37.5%', sofa: 'right' },
  { left: '73%', top: '39%', sofa: 'right' },
  { left: '82%', top: '40%', sofa: 'right' },
];

// Red X position where big shadow walks to before splitting
const SOFA_CENTER = { left: '25%', top: '48%' };

// Angry reject lines
const ANGRY_LINES = [
  'Hmph! Đồ vô dụng!',
  'Tôi sẽ tìm thợ khác!',
  'Phí thời gian của tôi!',
  'Có ngày tôi quay lại!',
  'Garage tệ nhất!',
  'Không ai muốn đến đây!',
  'Thật thất vọng!',
  'Uy tín gì chứ!',
];

/**
 * Animation phases:
 *   idle → bigWalking → bigSitting → splitting → spawningInteractive
 */
type ManagerPhase =
  | 'idle'
  | 'bigWalking'
  | 'bigSitting'
  | 'splitting'
  | 'spawningInteractive';

interface Props {
  quests: QuestData[];
  onQuestAccepted: (quest: QuestData) => void;
  onQuestRejected?: (quest: QuestData) => void;
  lobbyBgmRef?: React.RefObject<HTMLAudioElement | null>; // ← nhận từ LobbyScreen
}

export default function ShadowManager({ quests, onQuestAccepted, onQuestRejected, lobbyBgmRef }: Props) {
  const [phase, setPhase] = useState<ManagerPhase>('idle');
  const [bigAtSeat, setBigAtSeat] = useState(false);
  const [showIndividuals, setShowIndividuals] = useState(false);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null);
  const [removedQuestIds, setRemovedQuestIds] = useState<Set<number>>(new Set());
  const [leavingQuestIds, setLeavingQuestIds] = useState<Set<number>>(new Set());
  const [angryInfo, setAngryInfo] = useState<{ questId: number; text: string } | null>(null);
  const [lastPenalty, setLastPenalty] = useState(10); // Actual penalty from backend

  // Boss music management
  const bossMusicRef = useRef<HTMLAudioElement | null>(null);

  const token = useGameStore((s) => s.token);
  const updateGarageHealth = useGameStore((s) => s.updateGarageHealth);
  const user = useGameStore((s) => s.user);
  const setBossChoice = useGameStore((s) => s.setBossChoice);
  const setScreen = useGameStore((s) => s.setScreen);
  const skipShadowIntro = useGameStore((s) => s.skipShadowIntro);
  const setSkipShadowIntro = useGameStore((s) => s.setSkipShadowIntro);
  const setActiveBossMusic = useGameStore((s) => s.setActiveBossMusic);

  // ─── Boss Music helpers ──────────────────────────────────────────────────
  const playBossMusic = useCallback((musicSrc: string) => {
    // Dừng TẤT CẢ audio đang phát trong document (để chắc chắn tắt nhạc lobby)
    document.querySelectorAll('audio').forEach((audio) => {
      audio.pause();
      (audio as any).intentionalPause = true;
    });
    // Dừng & tắt lobby bgm ref nếu có
    if (lobbyBgmRef?.current) {
      (lobbyBgmRef.current as any).intentionalPause = true;
      lobbyBgmRef.current.pause();
    }
    // Dừng boss music cũ nếu có
    if (bossMusicRef.current) {
      bossMusicRef.current.pause();
      bossMusicRef.current.currentTime = 0;
    }
    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.volume = 0.45;
    audio.play().catch(() => {});
    bossMusicRef.current = audio;
  }, [lobbyBgmRef]);

  const stopBossMusic = useCallback((resumeLobby = true) => {
    if (bossMusicRef.current) {
      bossMusicRef.current.pause();
      bossMusicRef.current.currentTime = 0;
      bossMusicRef.current = null;
    }
    // Phát lại lobby bgm
    if (resumeLobby && lobbyBgmRef?.current) {
      (lobbyBgmRef.current as any).intentionalPause = false;
      lobbyBgmRef.current.play().catch(() => {});
    }
  }, [lobbyBgmRef]);

  // Cleanup khi unmount (workshop về lobby sẽ destroy ref)
  useEffect(() => {
    return () => {
      if (bossMusicRef.current) {
        bossMusicRef.current.pause();
        bossMusicRef.current = null;
      }
    };
  }, []);

  // Show quests that are PENDING or currently in 'leaving' animation
  const visibleQuests = quests.filter(
    (q) => (!removedQuestIds.has(q.id)) && (q.status === 'PENDING' || leavingQuestIds.has(q.id))
  );
  const pendingQuests = quests.filter(
    (q) => q.status === 'PENDING' && !removedQuestIds.has(q.id)
  );

  // ═══ Phase 1: Start the big shadow walking after mount ═══
  // Nếu skipShadowIntro = true (quay lại từ workshop) → bỏ qua toàn bộ intro
  // và spawn cá nhân ngay lập tức.
  useEffect(() => {
    if (pendingQuests.length === 0) return;

    if (skipShadowIntro) {
      setPhase('spawningInteractive');
      setShowIndividuals(true);
      setSpawnedCount(pendingQuests.length); // Hiện tất cả cùng lúc, không delay
      setSkipShadowIntro(false); // reset cờ
      return;
    }

    const timer = setTimeout(() => {
      setPhase('bigWalking');
      // Trigger CSS transition to sofa center after rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setBigAtSeat(true);
        });
      });
    }, 500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══ Phase 2: Big shadow reaches sofa → start sitting animation ═══
  useEffect(() => {
    if (!bigAtSeat) return;

    const timer = setTimeout(() => {
      setPhase('bigSitting');
    }, 3100); // Walk transition is 3s

    return () => clearTimeout(timer);
  }, [bigAtSeat]);

  // ═══ Phase 2.5: Sitting animation completes → start splitting ═══
  useEffect(() => {
    if (phase !== 'bigSitting') return;

    const timer = setTimeout(() => {
      setPhase('splitting');
    }, 1500); // Wait 1.5s for sit animation to finish

    return () => clearTimeout(timer);
  }, [phase]);

  // ═══ Phase 3: Split animation → start spawning individuals ═══
  useEffect(() => {
    if (phase !== 'splitting') return;

    const timer = setTimeout(() => {
      setPhase('spawningInteractive');
      setShowIndividuals(true);
    }, 600); // Split fade-out is 0.6s

    return () => clearTimeout(timer);
  }, [phase]);

  // ═══ Phase 4: Sequential spawning of individuals ═══
  useEffect(() => {
    if (phase !== 'spawningInteractive' || !showIndividuals) return;
    
    // Spawn one by one every 200ms
    if (spawnedCount < visibleQuests.length) {
      const timer = setTimeout(() => {
        setSpawnedCount((prev) => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [phase, showIndividuals, spawnedCount, visibleQuests.length]);

  // ═══ Click on a sitting shadow → show quest dialog ═══
  const handleShadowClick = useCallback((quest: QuestData) => {
    if (phase !== 'spawningInteractive') return;
    if (quest.status !== 'PENDING' || removedQuestIds.has(quest.id)) return;
    setSelectedQuest(quest);

    // Phát nhạc boss khi click vào shadow boss
    if (quest.isBoss) {
      const musicSrc = getBossMusic(quest);
      if (musicSrc) playBossMusic(musicSrc);
    }
  }, [phase, removedQuestIds, playBossMusic]);

  // ═══ Accept quest → switch to workshop ═══
  // For boss with choices (EP, Baby Oil, Kim, Russia), YES = accept with bossChoice
  const handleAccept = useCallback((bossChoiceOverride?: BossChoiceData) => {
    if (!selectedQuest) return;
    const quest = selectedQuest;
    setSelectedQuest(null);

    // Ghi nhớ nhạc boss vào store để Workshop tiếp tục phát
    if (quest.isBoss && bossMusicRef.current) {
      const musicSrc = getBossMusic(quest);
      setActiveBossMusic(musicSrc);
      // Không dừng nhạc — để Workshop tiếp nhận và dừng ở cuối
    } else {
      setActiveBossMusic(null);
    }

    // Store boss choice for workshop to use
    const condition = quest.bossConfig?.specialCondition;
    if (condition && bossChoiceOverride) {
      setBossChoice(bossChoiceOverride);
    } else if (condition === 'EP_ISLAND_CHOICE') {
      setBossChoice({ epIslandChoice: 'YES' }); // Default YES when accepting EP
    } else if (condition === 'BABY_OIL_CHOICE') {
      setBossChoice({ babyOilChoice: 'YES' });
    } else if (condition === 'KIM_JONG_UN') {
      setBossChoice({ kimChoice: 'YES' });
    } else if (condition === 'RUSSIA_EMPEROR') {
      setBossChoice({ russiaPhase: 1 });
    } else {
      setBossChoice(null); // Normal quest, no boss choice
    }

    onQuestAccepted(quest);
  }, [selectedQuest, onQuestAccepted, setBossChoice, setActiveBossMusic]);

  // ═══ Final Close (called by QuestDialog after angry phase) ═══
  const handleCloseDialog = useCallback(() => {
    setSelectedQuest(null);
    setAngryInfo(null);
    // Đóng dialog boss (không accept) → tắt boss music + phát lại lobby
    stopBossMusic(true);
  }, [stopBossMusic]);

  // ═══════════════════════════════════════════════════════════════
  // REJECT HANDLER — Boss-specific flows per Game Bible
  // ═══════════════════════════════════════════════════════════════
  const handleReject = useCallback(async () => {
    if (!selectedQuest) return;
    const quest = selectedQuest;
    const condition = quest.bossConfig?.specialCondition;
    const isInNorthKorea = (user as any)?.isInNorthKorea;

    // ─── EP ISLAND: NO = +15 Uy Tín, still goes to workshop (harder conditions) ───
    if (condition === 'EP_ISLAND_CHOICE') {
      // EP NO doesn't reject — it accepts with different conditions
      setSelectedQuest(null);
      setBossChoice({ epIslandChoice: 'NO' });
      // Lưu nhạc boss vào store để Workshop tiếp tục phát
      const musicSrc = getBossMusic(quest);
      setActiveBossMusic(musicSrc);
      onQuestAccepted(quest); // Goes to workshop with EP NO conditions
      return;
    }

    // ─── KIM (first encounter): NO = GAME OVER ───
    if (condition === 'KIM_JONG_UN' && !isInNorthKorea) {
      // Mark as leaving
      setLeavingQuestIds((prev) => new Set(prev).add(quest.id));
      const line = '☠️ Chủ Tịch nổi giận... Không ai từ chối Chủ Tịch mà sống sót!';
      setAngryInfo({ questId: quest.id, text: line });

      if (token && user) {
        try {
          const res = await fetch(`/api/quest/${quest.id}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'FAILED', kimChoice: 'NO' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.userState?.garageHealth !== undefined) {
              updateGarageHealth(data.userState.garageHealth);
            }
            setLastPenalty(0); // Kim NO doesn't show normal penalty
            // Game Over → redirect to ending screen after delay
            if (data.gameOver) {
              stopBossMusic(false); // Tắt nhạc boss, không phục hồi lobby
              setTimeout(() => {
                setScreen('ending');
              }, 3500);
              return;
            }
          }
        } catch (err) {
          console.error('Error rejecting Kim:', err);
        }
      }
      return;
    }

    // ─── BABY OIL: NO = -45% Uy Tín + all customers auto-fail ───
    if (condition === 'BABY_OIL_CHOICE') {
      stopBossMusic(true); // Tắt boss music, phục hồi lobby music
      setLeavingQuestIds((prev) => new Set(prev).add(quest.id));
      const line = '💀 Chúa Tể Dầu Em Bé nổi cơn thịnh nộ! Đổ dầu lên khắp garage!';
      setAngryInfo({ questId: quest.id, text: line });

      if (token && user) {
        try {
          const res = await fetch(`/api/quest/${quest.id}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'FAILED', babyOilChoice: 'NO' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.userState?.garageHealth !== undefined) {
              updateGarageHealth(data.userState.garageHealth);
            }
            const oldHealth = user.garageHealth || 0;
            const newHealth = data.userState?.garageHealth ?? oldHealth;
            const actualPenalty = oldHealth - newHealth;
            setLastPenalty(actualPenalty > 0 ? actualPenalty : Math.floor(oldHealth * 0.45));

            // Check for game over (uy tín = 0 after -45%)
            if (data.gameOver) {
              setTimeout(() => { setScreen('ending'); }, 3500);
              return;
            }
          }
        } catch (err) {
          console.error('Error rejecting Baby Oil:', err);
        }
      }

      // After animation, remove ALL pending shadows (baby oil makes everyone leave)
      setTimeout(() => {
        // Mark all pending quests as removed
        quests.forEach((q) => {
          if (q.status === 'PENDING') {
            setRemovedQuestIds((prev) => new Set(prev).add(q.id));
          }
        });
        setLeavingQuestIds(new Set());
      }, 2500);
      return;
    }

    // ─── STANDARD REJECT: All other bosses and NPC ───
    // Trump (DONALD_TRUMP): penalty=0 on backend, just tax increase
    // Russia (RUSSIA_EMPEROR): standard -20
    // Boss thường (Drift, F1, Collector, Daredevil, Bí Ẩn): -20
    // NPC thường: -10
    stopBossMusic(true); // Tắt nhạc boss nếu có, phục hồi lobby
    setLeavingQuestIds((prev) => new Set(prev).add(quest.id));

    const line = ANGRY_LINES[Math.floor(Math.random() * ANGRY_LINES.length)];
    setAngryInfo({ questId: quest.id, text: line });

    if (token && user) {
      try {
        const res = await fetch(`/api/quest/${quest.id}/complete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'FAILED' }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.userState?.garageHealth !== undefined) {
            updateGarageHealth(data.userState.garageHealth);
          }
          const oldHealth = user.garageHealth || 0;
          const newHealth = data.userState?.garageHealth ?? oldHealth;
          const actualPenalty = oldHealth - newHealth;
          setLastPenalty(actualPenalty > 0 ? actualPenalty : (quest.isBoss ? 20 : 10));

          // Notify parent component that quest was rejected (to refresh quests)
          if (onQuestRejected) {
            onQuestRejected(quest);
          }

          // Check for game over (uy tín = 0)
          if (data.gameOver) {
            setTimeout(() => { setScreen('ending'); }, 3500);
            return;
          }
        } else {
          const fallbackPenalty = quest.isBoss ? 20 : 10;
          const newHealth = Math.max(0, (user.garageHealth || 0) - fallbackPenalty);
          updateGarageHealth(newHealth);
          setLastPenalty(fallbackPenalty);
        }
      } catch (err) {
        console.error('Error rejecting quest:', err);
        const fallbackPenalty = quest.isBoss ? 20 : 10;
        const newHealth = Math.max(0, (user.garageHealth || 0) - fallbackPenalty);
        updateGarageHealth(newHealth);
        setLastPenalty(fallbackPenalty);
      }
    }

    // After angry text and leaving animation, fully remove the shadow
    setTimeout(() => {
      setRemovedQuestIds((prev) => new Set(prev).add(quest.id));
      setLeavingQuestIds((prev) => {
        const next = new Set(prev);
        next.delete(quest.id);
        return next;
      });
    }, 2500);
  }, [selectedQuest, token, user, updateGarageHealth, setBossChoice, setActiveBossMusic, onQuestAccepted, setScreen, quests, stopBossMusic]);


  if (pendingQuests.length === 0 && phase === 'idle') return null;

  return (
    <>
      {/* ... previous code remains the same ... */}
      {/* ── Big Shadow (Phase 1-3: walks in → sits → splits) ── */}
      {(phase === 'bigWalking' || phase === 'bigSitting' || phase === 'splitting') && (
        <div
          className={`${styles.bigShadow} ${phase === 'splitting' ? styles.splitting : ''}`}
          style={{
            left: bigAtSeat ? SOFA_CENTER.left : '0%',
            top: bigAtSeat ? SOFA_CENTER.top : '40.85%',
          }}
        >
          <div className={phase === 'bigWalking' ? styles.bigShadowSprite : styles.bigSittingSprite} />
        </div>
      )}

      {/* ── Individual Shadows (Phase 4+: spawn sequentially in place) ── */}
      {showIndividuals &&
        visibleQuests.map((quest, i) => {
          if (i >= spawnedCount) return null; // Wait for sequential spawn
          const seatIndex = i % SOFA_SEATS.length;
          // Calculate z-index for left sofa sprites: frame càng trái càng cao z-index
          // Left sofa indices: 0, 1, 2, 3. Base z-index is 15 from CSS.
          // Index 0 (trái nhất): cao nhất, Index 3: thấp nhất
          let zIndexOverride: number | undefined;
          if (seatIndex === 0) zIndexOverride = 18; // cao nhất
          else if (seatIndex === 1) zIndexOverride = 17;
          else if (seatIndex === 2) zIndexOverride = 16;
          else if (seatIndex === 3) zIndexOverride = 15; // thấp nhất
          // Right sofa uses default z-index: 15
          return (
            <React.Fragment key={quest.id}>
              <ShadowCustomer
                quest={quest}
                seatPosition={SOFA_SEATS[seatIndex]}
                isInteractive={phase === 'spawningInteractive' && !leavingQuestIds.has(quest.id)}
                isLeaving={leavingQuestIds.has(quest.id)}
                onShadowClick={handleShadowClick}
                zIndex={zIndexOverride}
              />
              {/* Angry text overlay for this specific shadow */}
              {angryInfo && angryInfo.questId === quest.id && (
                <div
                  className={styles.angryText}
                  style={{
                    left: SOFA_SEATS[seatIndex].left,
                    top: SOFA_SEATS[seatIndex].top,
                  }}
                >
                  {angryInfo.text}
                </div>
              )}
            </React.Fragment>
          );
        })}

      {/* ── Quest Dialog Overlay ── */}
      {selectedQuest && (
        <QuestDialog
          quest={selectedQuest}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={handleCloseDialog}
          penaltyAmount={lastPenalty}
        />
      )}
    </>
  );
}
