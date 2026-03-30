'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ShadowCustomer.module.css';
import type { QuestData } from './ShadowCustomer';
import { useGameStore } from '@/stores/useGameStore';

interface Props {
  quest: QuestData;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void; // Thêm callback để đóng hẳn dialog
}

export default function QuestDialog({ quest, onAccept, onReject, onClose }: Props) {
  const user = useGameStore((s) => s.user);
  const isInNorthKorea = (user as any)?.isInNorthKorea;

  // 1. Rejection & "Angry" Logic States
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionLine, setRejectionLine] = useState('');
  const [showReputationLoss, setShowReputationLoss] = useState(false);

  // 2. Determine NPC Image
  const npcImage = React.useMemo(() => {
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
    if (isInNorthKorea) {
      const index = (quest.id % 5) + 1;
      return `/gamenpcimg/npc${index}NK.png`;
    } else {
      const index = (quest.id % 15) + 1;
      return `/gamenpcimg/npc${index}.png`;
    }
  }, [quest, isInNorthKorea]);

  // 3. Typewriter Effect Logic
  const questDescription = quest.isBoss && quest.bossConfig?.description
    ? quest.bossConfig.description
    : `"Tôi cần lắp cho mình một con xe có sức chứa cỡ ${quest.requiredPower} HP. Các cậu có thể làm được không?"`;
    
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Internal function to clean up and start typing a new segment
  // isRejectMode is passed explicitly to avoid stale closure on isRejecting state
  const startTypingSegment = (text: string, speed: number = 35, isRejectMode: boolean = false) => {
    setIsTyping(true);
    setDisplayedText('');
    let currentIndex = 0;

    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        // If we are in rejection mode, wait 3s then close dialog and return to lobby
        if (isRejectMode) {
            setTimeout(() => {
                onClose(); // Đóng hẳn dialog sau 3 giây chờ → trở về lobby
            }, 3000);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    audioRef.current = new Audio('/sfx/npcchatsfx.mp3');
    if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = 0.6;
    }

    const firstTypeCleanup = setTimeout(() => {
        return startTypingSegment(questDescription);
    }, 500);

    return () => {
        clearTimeout(firstTypeCleanup);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, [questDescription]);

  // Handle local rejection
  const handleLocalReject = () => {
    setIsRejecting(true);
    setShowReputationLoss(true);
    
    // Trigger backend logic (reputation loss, mark quest FAILED, shadow leaves)
    onReject();

    // Pick an insult
    const insults = quest.isBoss 
        ? ["Ngươi dám từ chối ta sao? Ngươi sẽ phải hối hận vì sự xúc phạm này!", "Mất thời gian! Tiệm của ngươi không đủ đẳng cấp để ta ghé lại lần hai.", "Đúng là một quyết định tồi tệ. Vĩnh biệt thợ vườn!"]
        : ["Hừ! Làm thợ mà chê tiền à? Tiệm này làm ăn lôm côm quá!", "Vớ vẩn thật sự! Đúng là phí công tôi lặn lội tới đây.", "Kinh doanh kiểu này sớm muộn gì cũng dẹp tiệm thôi nhé!"];
    const randomLine = insults[Math.floor(Math.random() * insults.length)];
    setRejectionLine(randomLine);

    // Stop current typing and start new angry typing — pass true for isRejectMode
    startTypingSegment(randomLine, 25, true); // Faster typing for anger + auto-close after 3s
  };

  return (
    <div className={styles.dialogOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.newDialogContainer}>
        {/* NPC PORTRAIT */}
        <div className={styles.portraitWrapper}>
            <div className={styles.portraitBackground} />
            <img src={npcImage} alt="NPC" className={styles.portraitImage} />
        </div>

        {/* PIXEL CHAT BOX */}
        <div className={`${styles.pixelChatBox} ${isRejecting ? styles.angryBox : ''}`}>
            {showReputationLoss && (
               <div className={styles.reputationLossIndicator}>-5 UY TÍN</div>
            )}

            <div className={styles.chatHeader}>
               {quest.isBoss && quest.bossConfig 
                 ? `⚠ ${quest.bossConfig.name.toUpperCase()}` 
                 : `👤 KHÁCH HÀNG`}
            </div>
            
            <div className={styles.chatBody}>
               <p className={styles.typewriterText}>{displayedText}</p>
               
               {/* Quest Stats - Hide if rejecting */}
               {!isRejecting && (
                   <div className={`${styles.questStatsLine} ${!isTyping ? styles.statsFadeIn : ''}`}>
                        <span className={`${styles.questStatBadge} ${styles.power}`}>
                        ⚡ Y/C: {quest.requiredPower} HP
                        </span>
                        <span className={`${styles.questStatBadge} ${styles.gold}`}>
                        💰 Thưởng: {quest.rewardGold.toLocaleString()}G
                        </span>
                    </div>
               )}
            </div>

            {/* ACTION BUTTONS (Hide if typing still OR if rejecting) */}
            {!isRejecting && (
                <div className={`${styles.chatActions} ${!isTyping ? styles.showActions : ''}`}>
                   {/* ACCEPT */}
                   <div className={styles.actionBtnWrapper}>
                       <button className={`${styles.pixelBtn} ${styles.btnAccept}`} onClick={onAccept}>
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                               <rect x="4" y="10" width="4" height="4" />
                               <rect x="8" y="14" width="4" height="4" />
                               <rect x="12" y="10" width="4" height="4" />
                               <rect x="16" y="6" width="4" height="4" />
                           </svg>
                       </button>
                       <span className={styles.tooltipText}>chấp nhận</span>
                   </div>
                   
                   {/* REJECT */}
                   <div className={styles.actionBtnWrapper}>
                       <button className={`${styles.pixelBtn} ${styles.btnReject}`} onClick={handleLocalReject}>
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                               <rect x="6" y="6" width="4" height="4" />
                               <rect x="14" y="14" width="4" height="4" />
                               <rect x="10" y="10" width="4" height="4" />
                               <rect x="14" y="6" width="4" height="4" />
                               <rect x="6" y="14" width="4" height="4" />
                           </svg>
                       </button>
                       <span className={styles.tooltipText}>từ chối</span>
                   </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
