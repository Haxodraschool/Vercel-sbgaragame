'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './ShadowCustomer.module.css';
import type { QuestData } from './ShadowCustomer';
import { useGameStore } from '@/stores/useGameStore';
import BossTitle from '@/components/BossTitle/BossTitle';

interface Props {
  quest: QuestData;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  penaltyAmount?: number;
}

// ══════════════════════════════════════════════════════════════
// Boss-specific insult lines when player rejects/refuses
// ══════════════════════════════════════════════════════════════
const BOSS_INSULTS: Record<string, string[]> = {
  'KIM_JONG_UN': [
    '☠️ Ngươi dám từ chối Chủ Tịch? Đây là quyết định cuối cùng của ngươi...',
    '☠️ Không ai nói "KHÔNG" với Chủ Tịch mà còn thấy ánh mặt trời!',
  ],
  'EP_ISLAND_CHOICE': [
    // EP NO is NOT a rejection — player goes to workshop with harder conditions
    // These are shown as "info text" rather than insults
    '🏝️ Ngươi không muốn lên đảo? Vậy ta sẽ thử thách ngươi với điều kiện khắc nghiệt hơn!',
  ],
  'BABY_OIL_CHOICE': [
    '💀 Ngươi từ chối ta?! NHẬN LẤY CƠN THỊNH NỘ CỦA DẦU EM BÉ!!!',
    '💀 Đổ dầu! ĐỔ DẦU LÊN KHẮP GARAGE NÀY! Tất cả khách hàng... BỎ CHẠY ĐI!',
  ],
  'DONALD_TRUMP': [
    '🏛️ Sai lầm lớn! Rất lớn! Ta sẽ đánh thuế tiệm ngươi 47% ngày mai!',
    '🏛️ Ngươi đã đuổi thương vụ lớn nhất! Thuế ngày mai sẽ là bài học!',
  ],
  'RUSSIA_EMPEROR': [
    '🐻 Nga Đại Đế không tha thứ kẻ hèn nhát... Gấu! Tấn công!',
    '🐻 Ngươi khinh thường Đại Đế Nga? Mùa đông sẽ đến với garage ngươi!',
  ],
};

const NORMAL_BOSS_INSULTS = [
  'Ngươi dám từ chối ta sao? Ngươi sẽ phải hối hận vì sự xúc phạm này!',
  'Mất thời gian! Tiệm của ngươi không đủ đẳng cấp để ta ghé lại lần hai.',
  'Đúng là một quyết định tồi tệ. Vĩnh biệt thợ vườn!',
];

const NORMAL_NPC_INSULTS = [
  'Hừ! Làm thợ mà chê tiền à? Tiệm này làm ăn lôm côm quá!',
  'Vớ vẩn thật sự! Đúng là phí công tôi lặn lội tới đây.',
  'Kinh doanh kiểu này sớm muộn gì cũng dẹp tiệm thôi nhé!',
];

// ══════════════════════════════════════════════════════════════
// Get tooltip labels per boss special condition
// ══════════════════════════════════════════════════════════════
function getBossLabels(condition: string | undefined, isInNK: boolean) {
  switch (condition) {
    case 'KIM_JONG_UN':
      if (isInNK) return { accept: 'nhận lệnh', reject: 'từ chối' };
      return { accept: '🇰🇵 gia nhập', reject: '❌ từ chối' };
    case 'EP_ISLAND_CHOICE':
      return { accept: '🏝️ lên đảo', reject: '🚫 từ chối đảo' };
    case 'BABY_OIL_CHOICE':
      return { accept: '🛢️ chấp nhận', reject: '🚫 từ chối' };
    case 'DONALD_TRUMP':
      return { accept: 'nhận thử thách', reject: 'từ chối' };
    case 'RUSSIA_EMPEROR':
      return { accept: '🇷🇺 nhận quest', reject: 'từ chối' };
    default:
      return { accept: 'chấp nhận', reject: 'từ chối' };
  }
}

export default function QuestDialog({ quest, onAccept, onReject, onClose, penaltyAmount = 10 }: Props) {
  const user = useGameStore((s) => s.user);
  const isInNorthKorea = (user as any)?.isInNorthKorea;

  const condition = quest.bossConfig?.specialCondition;

  // 1. Rejection & "Angry" Logic States
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionLine, setRejectionLine] = useState('');
  const [showReputationLoss, setShowReputationLoss] = useState(false);

  // 2. Determine NPC Image — only map to files that actually exist
  // Available: npc1-npc15 EXCEPT npc3 is missing
  const AVAILABLE_NPC_INDICES = [1,2,4,5,6,7,8,9,10,11,12,13,14,15];
  const npcImage = useMemo(() => {
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
      // Available NK: npc1NK-npc5NK
      const index = (quest.id % 5) + 1;
      return `/gamenpcimg/npc${index}NK.png`;
    } else {
      // Map to available indices only (skip 3)
      const safeIndex = AVAILABLE_NPC_INDICES[quest.id % AVAILABLE_NPC_INDICES.length];
      return `/gamenpcimg/npc${safeIndex}.png`;
    }
  }, [quest, isInNorthKorea]);

  // 3. Get boss-specific labels
  const labels = useMemo(() => getBossLabels(condition, !!isInNorthKorea), [condition, isInNorthKorea]);

  // 4. Determine reputation display text
  // EP NO = +15 uy tín (positive!), Kim NO = GAME OVER, Baby Oil NO = -45%, Others = penalty
  const reputationDisplayText = useMemo(() => {
    if (!isRejecting) return '';
    if (condition === 'EP_ISLAND_CHOICE') return '+15 UY TÍN'; // EP NO is good!
    if (condition === 'KIM_JONG_UN' && !isInNorthKorea) return '💀 GAME OVER';
    if (condition === 'BABY_OIL_CHOICE') return `-${penaltyAmount} UY TÍN (45%)`;
    if (condition === 'DONALD_TRUMP') return '⚠ THUẾ +47%'; // Trump penalty = 0 uy tín, just tax
    if (penaltyAmount > 0) return `-${penaltyAmount} UY TÍN`;
    return '';
  }, [isRejecting, condition, penaltyAmount, isInNorthKorea]);

  // 5. Is reputation display positive? (for EP NO)
  const isPositiveReputation = condition === 'EP_ISLAND_CHOICE';

  // 6. Typewriter Effect Logic
  const customerDialogue = useMemo(() => {
    if (quest.isBoss || !quest) return null;
    const pw = quest.requiredPower || 0;
    const pwStr = pw > 0 ? `${pw} mã lực` : '';
    const id = quest.id || 0;

    const templates = pw > 0 ? [
        { before: '"Tao muốn con xe này phải đạt ', power: pwStr, after: '. Không đạt thì miễn trả tiền."' },
        { before: '"Ê bro, cần ít nhất ', power: pwStr, after: ' nha. Tao còn phải đi đua tối nay."' },
        { before: '"Vợ tao bảo cần ', power: pwStr, after: '. Không đạt là tao ngủ ngoài đường."' },
        { before: '"Nghe nói xưởng giỏi lắm? Chứng minh đi — ', power: pwStr, after: ' là tối thiểu."' },
        { before: '"Con trai tao mới 18 tuổi, nhưng nó muốn ', power: pwStr, after: '. Tuổi trẻ mà..."' },
        { before: '"Tao đặt cọc rồi đó, ', power: pwStr, after: ' là phải có. Đừng có mà lừa tao."' },
        { before: '"Ủa sao rẻ vậy? Tao tưởng ', power: pwStr, after: ' phải đắt hơn chứ. Làm đi!"' },
        { before: '"Đêm qua tao nằm mơ thấy xe chạy ', power: pwStr, after: '. Giúp tao hiện thực hoá đi."' },
        { before: '"Bạn tao khoe xe nó có ', power: pwStr, after: '. Tao phải hơn nó mới chịu!"' },
        { before: '"Xe cũ tao chỉ có 50 mã lực... giờ cần ', power: pwStr, after: '. Nâng cấp thôi!"' },
        { before: '"Mẹ tao bảo đừng chơi xe, nhưng ', power: pwStr, after: ' thì ai mà cưỡng lại được?"' },
        { before: '"Tao cần chính xác ', power: pwStr, after: '. Không hơn, không kém. Tao khó tính lắm."' },
        { before: '"Sếp tao đang chờ, làm cho tao ', power: pwStr, after: ' trước 5 giờ chiều nhé."' },
        { before: '"Con gái tao thích tốc độ, ', power: pwStr, after: ' là quà sinh nhật cho nó."' },
        { before: '"Xe taxi tao mà có ', power: pwStr, after: ' thì khách đông lắm anh ơi."' },
        { before: '"Ông nội tao ngày xưa lái xe ', power: pwStr, after: '. Tao muốn nối tiếp truyền thống."' },
        { before: '"Tao vừa ly dị, cần ', power: pwStr, after: ' để bắt đầu cuộc sống mới!"' },
        { before: '"Dealer bảo xe này chạy ', power: pwStr, after: ' mới đủ tiêu chuẩn xuất xưởng."' },
        { before: '"Đua với thằng hàng xóm, tao cần ', power: pwStr, after: '. Không thắng là mất mặt!"' },
        { before: '"Nghe nói ', power: pwStr, after: ' là đủ đi Đà Lạt rồi? Làm luôn đi!"' },
    ] : [
        { before: '"Xe tao hư rồi, sửa cho nó ', power: 'chạy được', after: ' là được. Đơn giản thôi."' },
        { before: '"Không cần nhanh đâu, ', power: 'chạy êm', after: ' là tao vui rồi."' },
        { before: '"Tao chỉ cần con xe ', power: 'qua đăng kiểm', after: '. Đừng hỏi nhiều."' },
        { before: '"Xe cũ mà, ', power: 'nổ máy được', after: ' là tao cảm ơn lắm rồi."' },
        { before: '"Làm gì cũng được, miễn ', power: 'chạy tốt', after: ' là tao trả tiền."' },
    ];

    const index = Math.abs(id * 7 + 13) % templates.length;
    return templates[index];
  }, [quest]);

  const questDescription = quest.isBoss && quest.bossConfig?.description
    ? quest.bossConfig.description
    : customerDialogue ? (customerDialogue.before + customerDialogue.power + customerDialogue.after) : '';
    
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Internal function to clean up and start typing a new segment
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
                onClose();
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

  // ══════════════════════════════════════════════════════════════
  // Handle local rejection — picks boss-specific insult text
  // ══════════════════════════════════════════════════════════════
  const handleLocalReject = () => {
    // NOTE: For EP_ISLAND_CHOICE, the ShadowManager.handleReject sends the player to workshop
    // So this local handler won't show angry text for EP — it will immediately transition.
    // But we still set rejecting state in case the transition takes a moment.
    
    setIsRejecting(true);
    
    // Show reputation indicator (except EP NO which is handled differently by ShadowManager)
    if (condition !== 'EP_ISLAND_CHOICE') {
      setShowReputationLoss(true);
    }
    
    // Trigger backend logic via ShadowManager  
    onReject();

    // Pick boss-specific insult
    let insultPool: string[];
    if (condition && BOSS_INSULTS[condition]) {
      insultPool = BOSS_INSULTS[condition];
    } else if (quest.isBoss) {
      insultPool = NORMAL_BOSS_INSULTS;
    } else {
      insultPool = NORMAL_NPC_INSULTS;
    }
    
    const randomLine = insultPool[Math.floor(Math.random() * insultPool.length)];
    setRejectionLine(randomLine);

    // EP NO goes to workshop immediately (via ShadowManager), no need for angry typing
    if (condition === 'EP_ISLAND_CHOICE') {
      return; // ShadowManager handles the transition
    }

    // Start angry typing with auto-close after 3s
    startTypingSegment(randomLine, 25, true);
  };

  const renderTypedText = () => {
    // If it's a boss or a reject message, or no dialogue, just return text
    if (isRejecting || quest.isBoss || !customerDialogue) {
      return displayedText;
    }

    const bLen = customerDialogue.before.length;
    const pLen = customerDialogue.power.length;
    const currentLen = displayedText.length;

    if (currentLen <= bLen) {
      return <span>{displayedText}</span>;
    } else if (currentLen <= bLen + pLen) {
      const typedBefore = customerDialogue.before;
      const typedPower = displayedText.slice(bLen);
      return (
        <>
          <span>{typedBefore}</span>
          <span className="font-black" style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.6)' }}>{typedPower}</span>
        </>
      );
    } else {
      const typedBefore = customerDialogue.before;
      const typedPower = customerDialogue.power;
      const typedAfter = displayedText.slice(bLen + pLen);
      return (
        <>
          <span>{typedBefore}</span>
          <span className="font-black" style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.6)' }}>{typedPower}</span>
          <span>{typedAfter}</span>
        </>
      );
    }
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
            {showReputationLoss && reputationDisplayText && (
               <div className={`${styles.reputationLossIndicator} ${isPositiveReputation ? styles.reputationGainIndicator : ''}`}>
                 {reputationDisplayText}
               </div>
            )}

            <div className={styles.chatHeader}>
               {quest.isBoss && quest.bossConfig 
                 ? <BossTitle name={quest.bossConfig.name.toUpperCase()} autoDetect /> 
                 : <BossTitle name="KHÁCH HÀNG" theme="npc" />}
            </div>
            
            <div className={styles.chatBody}>
               <p className={styles.typewriterText}>{renderTypedText()}</p>
               
               {/* Quest Stats - Hide if rejecting */}
               {!isRejecting && (
                   <div className={`${styles.questStatsLine} ${!isTyping ? styles.statsFadeIn : ''}`}>
                        <span className={`${styles.questStatBadge} ${styles.power}`}>
                        ⚡ Y/C: {quest.requiredPower} HP
                        </span>
                        <span className={`${styles.questStatBadge} ${styles.gold}`}>
                        💰 Thưởng: {quest.rewardGold.toLocaleString()}G
                        </span>
                        {!quest.isBoss && (quest.customerBudget || 0) > 0 && (
                            <span className={`${styles.questStatBadge} ${styles.gold}`}>
                            💵 Ngân sách: {(quest.customerBudget || 0).toLocaleString()}G
                            </span>
                        )}
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
                       <span className={styles.tooltipText}>{labels.accept}</span>
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
                       <span className={styles.tooltipText}>{labels.reject}</span>
                   </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
