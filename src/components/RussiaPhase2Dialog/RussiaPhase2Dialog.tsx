'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

interface RussiaPhase2DialogProps {
  isOpen: boolean;
  onChoice: (choice: 'YES' | 'NO') => void;
}

export default function RussiaPhase2Dialog({ isOpen, onChoice }: RussiaPhase2DialogProps) {
  const activeQuest = useGameStore((state) => state.activeQuest);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-gradient-to-br from-[#1a0a0a] to-[#2d1010] border-2 border-[#ff2d55] rounded-lg p-6 w-[90%] max-w-lg shadow-[0_0_50px_rgba(255,45,85,0.5)]"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ff2d55]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff2d55]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ff2d55]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ff2d55]" />

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                className="text-5xl mb-3"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                🇷🇺
              </motion.div>
              <h2 className="text-3xl font-bold text-[#ff2d55] mb-2" style={{ textShadow: '0 0 15px rgba(255,45,85,0.8)' }}>
                Nga Đại Đế
              </h2>
              <p className="text-gray-300 text-sm italic mt-2">"Xe của bạn chạy tốt... nhưng có Vodka không?"</p>
            </div>

            {/* Boss Image */}
            {activeQuest?.bossConfig?.imageUrl && (
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 border-2 border-[#ff2d55]/50 rounded-lg overflow-hidden bg-red-950/50 flex items-center justify-center">
                  <img
                    src={activeQuest.bossConfig.imageUrl}
                    alt="Nga Đại Đế"
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            )}

            {/* Choice Info */}
            <div className="space-y-4 mb-6">
              <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-emerald-500/30">
                <h3 className="text-emerald-400 font-bold text-sm mb-2 tracking-wider">YES - Có Vodka</h3>
                <div className="space-y-1 text-gray-300 text-sm">
                  <div>• Nga Đại Đế hài lòng</div>
                  <div>• Heat tối đa: 67%</div>
                  <div>• Gold thưởng: Power × 2</div>
                  <div className="text-emerald-300 font-bold">• Buff Hào Quang Moskva: +20% Power ngày mai</div>
                </div>
              </div>

              <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-red-500/30">
                <h3 className="text-red-400 font-bold text-sm mb-2 tracking-wider">NO - Không có</h3>
                <div className="space-y-1 text-gray-300 text-sm">
                  <div>• Nga Đại Đế thất vọng</div>
                  <div>• 3 Gấu tấn công:</div>
                  <div className="pl-4 text-xs">
                    <div>🐻 Gấu nâu: 50% giảm 20% Power/thẻ</div>
                    <div>🐼 Gấu trúc: 30% nuốt mất thẻ/slot</div>
                    <div>🐻‍❄️ Gấu trắng: Đóng băng thẻ cao nhất</div>
                  </div>
                  <div className="text-red-300 font-bold">• Không có thưởng đặc biệt</div>
                </div>
              </div>
            </div>

            {/* Choice Buttons */}
            <div className="flex gap-4">
              <motion.button
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg rounded-lg border-2 border-emerald-400 hover:from-emerald-500 hover:to-emerald-400 transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16,185,129,0.8)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChoice('YES')}
              >
                CÓ VODKA
              </motion.button>
              <motion.button
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg rounded-lg border-2 border-red-400 hover:from-red-500 hover:to-red-400 transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239,68,68,0.8)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChoice('NO')}
              >
                KHÔNG CÓ
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
