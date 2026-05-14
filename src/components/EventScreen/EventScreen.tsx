'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';
import styles from './EventScreen.module.css';
import BossTitle from '@/components/BossTitle/BossTitle';

export default function EventScreen() {
  const token = useGameStore((state) => state.token);
  const activeEvent = useGameStore((state) => state.activeEvent);
  const nextScreen = useGameStore((state) => state.nextScreen) || 'lobby';
  const transitionScreen = useGameStore((state) => state.transitionScreen);
  const completeTask = useGameStore((state) => state.completeTask);
  const registerTask = useGameStore((state) => state.registerTask);

  const [isProcessing, setIsProcessing] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showResult, setShowResult] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map event names to their images and custom stories
  const eventConfig: Record<string, { image: string; story: string; theme: string }> = {
    'Băng Đảng Xăng Dầu': {
      image: '/eventimg/event-oilgangster.jpg',
      story: "Ê thằng nhóc! Tụi tao là Băng Đảng Xăng Dầu. Khu vực này giờ do bọn tao bảo kê! Nôn 10% doanh thu ra đây coi như 'phí sinh hoạt', không thì cái gara rách nát của mày đừng hòng làm ăn gì được!",
      theme: 'oil_gangster'
    },
    'Ánh Trăng Racing': {
      image: '/eventimg/event-anhtrang.jpg',
      story: "Đêm nay ánh trăng sáng bừng! Có một giải đua ngầm đang được tổ chức tại khu vực ngoại ô. Đường đua nguy hiểm nhưng phần thưởng rất hấp dẫn. Mày có dám tham gia không?",
      theme: 'moon_racing'
    },
    'Đấu Giá Kho Xưởng': {
      image: '/eventimg/event-aution.jpg',
      story: "Ngân hàng đang thanh lý một kho JDM cũ! Họ đang bán đấu giá các bộ phận xe cổ và máy móc phế liệu. Có thể tìm được bảo vật đấy! Cược 700 Gold để tham gia?",
      theme: 'auction'
    },
    'Kẻ Chế Tạo Cuồng Tín': {
      image: '/eventimg/event-tiensi.jpg',
      story: "Một kỹ sư điên gõ cửa gara của bạn. Ông ta cầm theo bản thiết kế cấm kỵ - những công nghệ mà ngành công nghiệp ô tô đã chôn vùi vì quá nguy hiểm. Ông ta muốn chia sẻ bí mật với bạn...",
      theme: 'mad_scientist'
    },
    'Cảnh Sát Đột Kích': {
      image: '/eventimg/event-codongkiemtra.jpg',
      story: "Tiếng còi hú vang lên! Đội cảnh sát cơ động đang bao vây gara của bạn. Họ nhận được tin báo về hoạt động đáng ngờ. Chuẩn bị bị kiểm tra và phạt!",
      theme: 'police_raid'
    },
    'Tay Buôn Lậu Gõ Cửa': {
      image: '/eventimg/event-oilgangster.jpg',
      story: "Một gã mặt sẹo gõ cửa gara. Ông ta thì thầm: 'Tao có hàng xịn, giá rẻ hơn thị trường 40%. Linh kiện hiếm, thẻ 3-4 sao... nhưng mày biết rõ rủi ro đấy. Giao dịch không?'",
      theme: 'smuggler'
    },
    'Độ Channel Bốc Phốt': {
      image: '/eventimg/event-anhdomixi.jpg',
      story: "Một kênh YouTube triệu view muốn live-stream tại gara của bạn! Đây là cơ hội quảng bá cực lớn, nhưng họ đòi 200 Gold phí 'bôi trơn PR'. Uy tín sẽ tăng vọt!",
      theme: 'youtube'
    },
    'Camera Ngoại Bang': {
      image: '/eventimg/event-camerangoaibang.jpg',
      story: "Bạn phát hiện một gã lạ mặt đang lén lút quay phim khu vực quanh gara! Hắn có vẻ là gián điệp ngoại bang. Tố cáo hắn để được Chủ Tịch thưởng nóng?",
      theme: 'spy'
    },
    'Kiểm Tra Ảnh Cán Bộ': {
      image: '/eventimg/event-canhsattrieutien.jpg',
      story: "Đoàn kiểm tra đột xuất từ Bình Nhưỡng đang đến! Họ sẽ kiểm tra xem gara có treo ảnh Chủ Tịch Kim Jong Un không. Đây là vấn đề sống còn!",
      theme: 'inspection'
    },
    'Sát Thủ Gọi Mời': {
      image: '/eventimg/event-tiensi.jpg',
      story: "Một gã đàn ông mặc đồ đen bước vào. Giọng hắn trầm lạnh: 'Tổ chức muốn mời mày một việc lớn. Ám sát Chủ Tịch. Thử thách nguy hiểm nhưng phần thưởng là tự do. Đồng ý không?'",
      theme: 'assassin'
    },
    'Cảnh Sát Triều Tiên': {
      image: '/eventimg/event-canhsattrieutien.jpg',
      story: "Cảnh sát Triều Tiên đến kiểm tra đột xuất! Họ đang soi xét từng ngóc ngách gara. Nếu phát hiện dấu hiệu giao dịch phi pháp từ hôm qua, bạn sẽ gặp rắc rối lớn!",
      theme: 'nk_police'
    }
  };

  const currentConfig = eventConfig[activeEvent?.name || ''] || {
    image: '/eventimg/event-oilgangster.jpg',
    story: activeEvent?.description || 'Có chuyện gì đó đang xảy ra...',
    theme: 'default'
  };

  useEffect(() => {
    registerTask('event-bg', 'Đang tải sự kiện...');
    const img = new Image();
    img.src = currentConfig.image;
    img.onload = () => completeTask('event-bg');
    img.onerror = () => completeTask('event-bg');
  }, [completeTask, registerTask, currentConfig.image]);

  const eventText = currentConfig.story;
  const eventName = activeEvent?.name || 'SỰ KIỆN';
  const eventTheme = currentConfig.theme;
  const isChoiceEvent = activeEvent?.type === 'CHOICE';

  const startTypingSegment = (text: string, speed: number = 35) => {
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
        return startTypingSegment(eventText);
    }, 500);

    return () => {
        clearTimeout(firstTypeCleanup);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, [eventText]);

  const respondEvent = async (accepted: boolean = true) => {
    if (!token || !activeEvent) return;
    try {
      setIsProcessing(true);
      const res = await fetch('/api/events/random', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId: activeEvent.id, accepted })
      });
      const data = await res.json();

      if (res.ok) {
        startTypingSegment(data.message || 'Bọn tao đi đây, liệu hồn đấy!', 25);
      } else {
        startTypingSegment(data.error || 'Lỗi xử lý sự kiện.', 25);
      }

      // Update local gold/health/etc if needed by refetching profile
      fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.user) useGameStore.getState().setUser(d.user);
        });

      setShowResult(true);
      setTimeout(() => {
        transitionScreen(nextScreen);
        useGameStore.getState().setActiveEvent(null);
      }, 3000);

    } catch (err) {
      console.error('Error responding to event:', err);
      transitionScreen(nextScreen);
    }
  };

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden bg-black select-none flex items-center justify-center font-pixel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Image (no blur, no brightness filter) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url("${currentConfig.image}")` }}
      />
      
      {/* Container copied exactly from Lobby */}
      <div className={styles.dialogOverlay}>
        <div className={styles.newDialogContainer}>
          {/* PIXEL CHAT BOX */}
          <div className={styles.pixelChatBox}>
              <div className={styles.chatHeader}>
                 <BossTitle name={eventName.toUpperCase()} theme={eventTheme as any} />
              </div>
              
              <div className={styles.chatBody}>
                 <p className={styles.typewriterText}>{displayedText}</p>
              </div>

              {/* ACTION BUTTONS */}
              {!isProcessing && !showResult && (
                  <div className={`${styles.chatActions} ${!isTyping ? styles.showActions : ''}`}>
                     {isChoiceEvent ? (
                       // CHOICE events: Accept (✓) and Reject (X) buttons
                       <>
                         <div className={styles.actionBtnWrapper}>
                             <button className={`${styles.pixelBtn} ${styles.btnAccept}`} onClick={(e) => { e.preventDefault(); respondEvent(true); }}>
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                     <rect x="4" y="10" width="4" height="4" />
                                     <rect x="8" y="14" width="4" height="4" />
                                     <rect x="12" y="10" width="4" height="4" />
                                     <rect x="16" y="6" width="4" height="4" />
                                 </svg>
                             </button>
                             <span className={styles.tooltipText}>chấp nhận</span>
                         </div>
                         <div className={styles.actionBtnWrapper}>
                             <button className={`${styles.pixelBtn} ${styles.btnReject}`} onClick={(e) => { e.preventDefault(); respondEvent(false); }}>
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
                       </>
                     ) : (
                       // PASSIVE events: Continue (>>>) button
                       <div className={styles.actionBtnWrapper}>
                           <button className={`${styles.pixelBtn} ${styles.btnContinue}`} onClick={(e) => { e.preventDefault(); respondEvent(true); }}>
                               <svg width="32" height="24" viewBox="0 0 32 24" fill="currentColor">
                                   {/* Nút >>> (Next/Continue) dạng pixel */}
                                   <rect x="2" y="6" width="4" height="4" />
                                   <rect x="6" y="10" width="4" height="4" />
                                   <rect x="2" y="14" width="4" height="4" />

                                   <rect x="12" y="6" width="4" height="4" />
                                   <rect x="16" y="10" width="4" height="4" />
                                   <rect x="12" y="14" width="4" height="4" />

                                   <rect x="22" y="6" width="4" height="4" />
                                   <rect x="26" y="10" width="4" height="4" />
                                   <rect x="22" y="14" width="4" height="4" />
                               </svg>
                           </button>
                           <span className={styles.tooltipText}>tiếp tục</span>
                       </div>
                     )}
                  </div>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
