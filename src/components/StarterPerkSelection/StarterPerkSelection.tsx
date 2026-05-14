'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

interface Perk {
  id: number;
  code: string;
  name: string;
  description: string;
  isDefault: boolean;
  unlocked: boolean;
}

const PERK_IMAGES: Record<string, string> = {
  'STARTUP_FUND': '/perkimg/perk1.png',
  'OLD_STASH': '/perkimg/perk2.png',
  'HOT_HANDS': '/perkimg/perk3.png',
  'CONNECTIONS': '/perkimg/perk4.png',
  'VIP_CARD': '/perkimg/perk5.png',
  'TECH_GENIUS': '/perkimg/perk6.png',
};

export default function StarterPerkSelection() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const token = useGameStore((state) => state.token);
  const setUser = useGameStore((state) => state.setUser);
  const setScreen = useGameStore((state) => state.setScreen);

  useEffect(() => {
    fetch('/api/game/perks', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setPerks(data.perks);
        // Set initial selection to perk 1 (STARTUP_FUND)
        const perk1Index = data.perks.findIndex((p: Perk) => p.code === 'STARTUP_FUND');
        if (perk1Index !== -1) {
          setSelectedIndex(perk1Index);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading perks:', err);
        setIsLoading(false);
      });
  }, [token]);

  const handleSelect = async () => {
    const perk = perks[selectedIndex];
    if (!perk.unlocked) return;

    try {
      const res = await fetch('/api/game/perks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ perkCode: perk.code }),
      });
      const data = await res.json();
      if (res.ok) {
        const user = useGameStore.getState().user;
        if (user && data.userState) setUser({ ...user, ...data.userState });
        setScreen('lobby');
      } else {
        console.error('Select perk error:', data.error);
        alert(data.error || 'Failed to select perk');
      }
    } catch (err) {
      console.error('Error selecting perk:', err);
      alert('Error selecting perk');
    }
  };

  if (isLoading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;

  const perk = perks[selectedIndex];
  const isLocked = !perk.unlocked;
  const perkImage = PERK_IMAGES[perk.code] || '/perkimg/perk1.png';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute top-20 left-20 w-64 h-64 bg-purple-500 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500 rounded-full blur-3xl"
      />

      <motion.h1 
        initial={{y:-50, opacity:0}} 
        animate={{y:0, opacity:1}} 
        transition={{duration: 0.8}}
        className="absolute top-12 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 drop-shadow-2xl z-10"
      >
        CHỌN ĐẶC QUYỀN
      </motion.h1>
      
      <div className="flex items-center gap-8 z-10">
        <motion.button 
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => setSelectedIndex(i => i > 0 ? i-1 : perks.length-1)} 
          className="text-5xl text-white/80 hover:text-white transition-colors"
        >
          ←
        </motion.button>
        <motion.div 
          key={selectedIndex} 
          initial={{opacity:0, scale: 0.8, rotateY: 90}} 
          animate={{opacity:1, scale: 1, rotateY: 0}}
          exit={{opacity:0, scale: 0.8, rotateY: -90}}
          transition={{duration: 0.5, type: 'spring'}}
          className={`w-80 h-96 flex flex-col items-center justify-center relative ${
            isLocked 
              ? 'opacity-60 grayscale' 
              : ''
          }`}
        >
          <img 
            src={perkImage} 
            alt={perk.name}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
          {isLocked && (
            <div className="absolute top-4 right-4 drop-shadow-lg">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="8" width="4" height="6" fill="#FF4444"/>
                <rect x="5" y="7" width="6" height="1" fill="#FF4444"/>
                <rect x="5" y="13" width="6" height="1" fill="#FF4444"/>
                <rect x="4" y="8" width="1" height="5" fill="#FF4444"/>
                <rect x="11" y="8" width="1" height="5" fill="#FF4444"/>
                <rect x="7" y="4" width="2" height="3" fill="#FF4444"/>
                <rect x="6" y="3" width="4" height="1" fill="#FF4444"/>
                <rect x="6" y="6" width="4" height="1" fill="#FF4444"/>
                <rect x="6" y="4" width="1" height="2" fill="#FF4444"/>
                <rect x="9" y="4" width="1" height="2" fill="#FF4444"/>
              </svg>
            </div>
          )}
          {isLocked && (
            <div className="absolute bottom-4 text-red-400 text-sm font-bold bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm border border-red-500/50">
              Chưa mở khóa
            </div>
          )}
        </motion.div>
        <motion.button 
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => setSelectedIndex(i => i < perks.length-1 ? i+1 : 0)} 
          className="text-5xl text-white/80 hover:text-white transition-colors"
        >
          →
        </motion.button>
      </div>
      <motion.button 
        initial={{opacity:0, y: 20}} 
        animate={{opacity: isLocked ? 0.5 : 1, y: 0}} 
        transition={{delay: 0.5, duration: 0.5}}
        whileHover={{scale: 1.05}}
        whileTap={{scale: 0.95}}
        onClick={handleSelect} 
        disabled={isLocked}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-[300px] px-8 py-4 text-white text-2xl font-bold rounded-xl border-2 transition-all duration-300 z-10 ${
          isLocked 
            ? 'bg-transparent border-white/30 cursor-not-allowed' 
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 border-transparent shadow-lg shadow-amber-500/50'
        }`}
      >
        CHỌN
      </motion.button>
    </div>
  );
}
