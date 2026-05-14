'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

// Map ending names to their image paths
const ENDING_IMAGES: Record<string, string> = {
  'Wasted Potential': '/endingimg/ending-wastedpotential.jpg',
  'Bị Tiêu Diệt Bởi Chủ Tịch': '/endingimg/ending-bichutichkimtieudiet.jpg',
  'Bóng Ma Tốc Độ': '/endingimg/ending-bongmatocdo.jpg',
  'Bí Sát Thủ Tiêu Diệt': '/endingimg/ending-bisatthutieudiet.jpg',
  'The Missing Percent': '/endingimg/ending-themissingpercent.jpg',
  'Invictus': '/endingimg/ending-invictus.jpg',
  'Good Ending': '/endingimg/ending-goodending.jpg',
  'Absolute Victory Ending': '/endingimg/ending-absolutevictoryending.jpg',
  'The Absolute Victory': '/endingimg/ending-absolutevictoryending.jpg',
};

// Endings that allow entering Final Round
const FINAL_ROUND_ELIGIBLE_ENDINGS = ['Good Ending', 'The Absolute Victory', 'Absolute Victory Ending'];

export default function EndingScreen() {
  const [currentPhase, setCurrentPhase] = useState<'black' | 'closed' | 'ending'>('black');
  const [endingData, setEndingData] = useState<{ name: string; image: string } | null>(null);
  const [isFinalRoundLoading, setIsFinalRoundLoading] = useState(false);
  const endingUnlocked = useGameStore((state) => state.endingUnlocked);
  const setScreen = useGameStore((state) => state.setScreen);

  // Check if this ending allows Final Round
  const canEnterFinalRound = endingUnlocked ? FINAL_ROUND_ELIGIBLE_ENDINGS.includes(endingUnlocked) : false;

  useEffect(() => {
    // Get ending data from store
    if (endingUnlocked) {
      const imagePath = ENDING_IMAGES[endingUnlocked] || '/endingimg/ending-wastedpotential.jpg';
      setEndingData({
        name: endingUnlocked,
        image: imagePath
      });
    } else {
      // Fallback to Wasted Potential if no ending specified
      setEndingData({
        name: 'Wasted Potential',
        image: '/endingimg/ending-wastedpotential.jpg'
      });
    }

    // Play gunshot sound for specific endings on black screen
    if (endingUnlocked && (endingUnlocked === 'Bị Tiêu Diệt Bởi Chủ Tịch' || endingUnlocked === 'Bóng Ma Tốc Độ')) {
      const gunshot = new Audio('/sfx/gunshot.mp3');
      gunshot.volume = 0.8;
      gunshot.play().catch(err => console.error('Error playing gunshot:', err));
    }

    // Phase 1: Start with black screen
    // Phase 2: After 1.5s, fade in to closed.jpg (like opening eyes)
    const phase2Timer = setTimeout(() => {
      setCurrentPhase('closed');
    }, 1500);

    // Phase 3: After 3s from phase 2, transition to the actual ending image
    const phase3Timer = setTimeout(() => {
      setCurrentPhase('ending');
    }, 4500);

    return () => {
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
    };
  }, [endingUnlocked]);



  const handleRestart = async () => {
    try {
      const token = useGameStore.getState().token;
      
      const response = await fetch('/api/game/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Reset failed:', data.error);
        return;
      }
      
      // Update user state with reset data
      const setUser = useGameStore.getState().setUser;
      setUser({
        id: data.user.id,
        username: data.user.username,
        gold: data.user.gold,
        level: data.user.level,
        exp: 0, // Reset exp to 0 as per request
        currentDay: data.user.currentDay,
        garageHealth: data.user.garageHealth,
        techPoints: data.user.techPoints,
        crewSlots: data.user.crewSlots,
        isFinalRound: data.user.isFinalRound,
        activePerkCode: null,
        isInNorthKorea: false,
        northKoreaDayCount: 0,
      });
      
      // Clear ending unlocked state
      const setEndingUnlocked = useGameStore.getState().setEndingUnlocked;
      setEndingUnlocked(null);
      
      // Go to perk selection for new run
      setScreen('perkSelection');
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  const handleFinalRound = async () => {
    if (isFinalRoundLoading) return;
    setIsFinalRoundLoading(true);

    try {
      const token = useGameStore.getState().token;
      
      const response = await fetch('/api/game/final-round', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Final round failed:', data.error);
        alert(data.error || 'Không thể vào Final Round!');
        setIsFinalRoundLoading(false);
        return;
      }
      
      // Update user state to reflect Final Round
      const setUser = useGameStore.getState().setUser;
      const currentUser = useGameStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          isFinalRound: true,
          currentDay: 51,
        });
      }
      
      // Clear ending unlocked state
      const setEndingUnlocked = useGameStore.getState().setEndingUnlocked;
      setEndingUnlocked(null);
      
      // Transition to lobby for the Final Round
      const transitionScreen = useGameStore.getState().transitionScreen;
      transitionScreen('lobby');
    } catch (error) {
      console.error('Error starting final round:', error);
      alert('Lỗi kết nối khi bắt đầu Final Round!');
      setIsFinalRoundLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Phase 1: Black screen */}
        {currentPhase === 'black' && (
          <motion.div
            key="black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-black"
          />
        )}

        {/* Phase 2: Closed eyes image (fade in like opening eyes) */}
        {currentPhase === 'closed' && (
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="/endingimg/ending-closed.jpg"
              alt="Closed"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Phase 3: Actual ending image */}
        {currentPhase === 'ending' && endingData && (
          <motion.div
            key="ending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <img
              src={endingData.image}
              alt={endingData.name}
              className="w-full h-full object-cover"
            />
            
            {/* Buttons container at bottom center */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
              {/* Final Round button — only for Good Ending / Absolute Victory */}
              {canEnterFinalRound && (
                <motion.button
                  onClick={handleFinalRound}
                  disabled={isFinalRoundLoading}
                  className="relative w-[300px] px-8 py-3 bg-transparent text-white text-2xl font-bold rounded-lg border-2 transition-all duration-300 overflow-hidden group"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.7)',
                    textShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.3)',
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.15)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(239, 68, 68, 0.05)',
                      '0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(239, 68, 68, 0.1)',
                      '0 0 10px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(239, 68, 68, 0.05)',
                    ],
                    borderColor: [
                      'rgba(239, 68, 68, 0.5)',
                      'rgba(239, 68, 68, 0.9)',
                      'rgba(239, 68, 68, 0.5)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Fire/glow background effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-red-900/30 via-transparent to-transparent pointer-events-none"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative z-10">
                    {isFinalRoundLoading ? '⏳ Đang tải...' : '🔥 Chiến Đấu?'}
                  </span>
                </motion.button>
              )}

              {/* Restart button */}
              <motion.button
                onClick={handleRestart}
                className="w-[300px] px-8 py-3 bg-transparent hover:bg-white/10 text-white text-2xl font-bold rounded-lg border-2 border-white/50 transition-all duration-300"
              >
                Chơi lại
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
