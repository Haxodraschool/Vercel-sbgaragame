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

  useEffect(() => {
    registerTask('event-bg', 'Đang tải sự kiện...');
    const img = new Image();
    img.src = '/eventimg/event-oilgangster.jpg';
    img.onload = () => completeTask('event-bg');
    img.onerror = () => completeTask('event-bg');
  }, [completeTask, registerTask]);

  // Sáng tạo story hội thoại cho event
  const customStory = "Ê thằng nhóc! Tụi tao là Băng Đảng Xăng Dầu. Khu vực này giờ do bọn tao bảo kê! Nôn 10% doanh thu ra đây coi như 'phí sinh hoạt', không thì cái gara rách nát của mày đừng hòng làm ăn gì được!";
  
  const eventText = activeEvent?.name === 'Băng Đảng Xăng Dầu' 
    ? customStory 
    : (activeEvent?.description || 'Có chuyện gì đó đang xảy ra...');
    
  const eventName = activeEvent?.name || 'SỰ KIỆN';

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

  const respondEvent = async () => {
    if (!token || !activeEvent) return;
    try {
      setIsProcessing(true);
      const res = await fetch('/api/events/random', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId: activeEvent.id, accepted: true })
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
        style={{ backgroundImage: 'url("/eventimg/event-oilgangster.jpg")' }}
      />
      
      {/* Container copied exactly from Lobby */}
      <div className={styles.dialogOverlay}>
        <div className={styles.newDialogContainer}>
          {/* PIXEL CHAT BOX */}
          <div className={styles.pixelChatBox}>
              <div className={styles.chatHeader}>
                 <BossTitle name={eventName.toUpperCase()} theme="oil_gangster" />
              </div>
              
              <div className={styles.chatBody}>
                 <p className={styles.typewriterText}>{displayedText}</p>
              </div>

              {/* ACTION BUTTONS */}
              {!isProcessing && !showResult && (
                  <div className={`${styles.chatActions} ${!isTyping ? styles.showActions : ''}`}>
                     <div className={styles.actionBtnWrapper}>
                         <button className={`${styles.pixelBtn} ${styles.btnAccept}`} onClick={respondEvent}>
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
                  </div>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
