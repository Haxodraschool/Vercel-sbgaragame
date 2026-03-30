'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ShadowCustomer.module.css';
import ShadowCustomer from './ShadowCustomer';
import QuestDialog from './QuestDialog';
import { useGameStore } from '@/stores/useGameStore';
import type { QuestData } from './ShadowCustomer';

/**
 * Sofa seat positions (% of the game container).
 * 8 seats: 4 on left sofa + 4 on right sofa.
 */
const SOFA_SEATS = [
  // Left sofa — facing left (from left to right)
  { left: '22.5%', top: '45%', sofa: 'left' },
  { left: '29%', top: '45.5%', sofa: 'left' },
  { left: '35%', top: '45.5%', sofa: 'left' },
  { left: '42%', top: '44.5%', sofa: 'left' },
  // Right sofa — facing right (from left to right)
  { left: '61%', top: '44.5%', sofa: 'right' }, 
  { left: '67%', top: '45.5%', sofa: 'right' },
  { left: '75%', top: '45.5%', sofa: 'right' },
  { left: '82%', top: '45%', sofa: 'right' },
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
}

export default function ShadowManager({ quests, onQuestAccepted }: Props) {
  const [phase, setPhase] = useState<ManagerPhase>('idle');
  const [bigAtSeat, setBigAtSeat] = useState(false);
  const [showIndividuals, setShowIndividuals] = useState(false);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null);
  const [removedQuestIds, setRemovedQuestIds] = useState<Set<number>>(new Set());
  const [leavingQuestIds, setLeavingQuestIds] = useState<Set<number>>(new Set());
  const [angryInfo, setAngryInfo] = useState<{ questId: number; text: string } | null>(null);

  const token = useGameStore((s) => s.token);
  const updateGarageHealth = useGameStore((s) => s.updateGarageHealth);
  const user = useGameStore((s) => s.user);

  // Show quests that are PENDING or currently in 'leaving' animation
  const visibleQuests = quests.filter(
    (q) => (!removedQuestIds.has(q.id)) && (q.status === 'PENDING' || leavingQuestIds.has(q.id))
  );
  const pendingQuests = quests.filter(
    (q) => q.status === 'PENDING' && !removedQuestIds.has(q.id)
  );

  // ═══ Phase 1: Start the big shadow walking after mount ═══
  useEffect(() => {
    if (pendingQuests.length === 0) return;

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
  }, [phase, removedQuestIds]);

  // ═══ Accept quest → switch to workshop ═══
  const handleAccept = useCallback(() => {
    if (!selectedQuest) return;
    const quest = selectedQuest;
    setSelectedQuest(null);
    onQuestAccepted(quest);
  }, [selectedQuest, onQuestAccepted]);

  // ═══ Final Close (called by QuestDialog after angry phase) ═══
  const handleCloseDialog = useCallback(() => {
    setSelectedQuest(null);
    setAngryInfo(null);
  }, []);

  // ═══ Reject quest → logic (reputation, status), dialog stays open ═══
  const handleReject = useCallback(async () => {
    if (!selectedQuest) return;
    const quest = selectedQuest;

    // Mark as leaving (triggers CSS leaving animation)
    setLeavingQuestIds((prev) => new Set(prev).add(quest.id));

    // Show legacy angry text for non-dialog views (fallback)
    const line = ANGRY_LINES[Math.floor(Math.random() * ANGRY_LINES.length)];
    setAngryInfo({ questId: quest.id, text: line });

    // Update backend: -5 reputation
    if (token && user) {
      try {
        const newHealth = Math.max(0, (user.garageHealth || 0) - 5);
        updateGarageHealth(newHealth);

        // Mark quest as FAILED
        await fetch(`/api/quest/${quest.id}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'FAILED' }),
        });
      } catch (err) {
        console.error('Error rejecting quest:', err);
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
  }, [selectedQuest, token, user, updateGarageHealth]);

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
          return (
            <React.Fragment key={quest.id}>
              <ShadowCustomer
                quest={quest}
                seatPosition={SOFA_SEATS[seatIndex]}
                isInteractive={phase === 'spawningInteractive' && !leavingQuestIds.has(quest.id)}
                isLeaving={leavingQuestIds.has(quest.id)}
                onShadowClick={handleShadowClick}
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
        />
      )}
    </>
  );
}
