'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelUpModal({ isOpen, onClose }: LevelUpModalProps) {
  const levelUpData = useGameStore((state) => state.levelUpData);

  if (!levelUpData) return null;

  const { newLevel, goldReward, garageHealthGain, cardRewards, bossRewards } = levelUpData;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#00e5ff] rounded-lg p-6 w-[90%] max-w-md shadow-[0_0_40px_rgba(0,229,255,0.5)]"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ff2d55]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff2d55]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00e5ff]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00e5ff]" />

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                className="text-4xl mb-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {bossRewards && bossRewards.length > 0 ? '🏆' : '🎉'}
              </motion.div>
              <h2 className="text-3xl font-bold text-[#00e5ff] mb-2" style={{ textShadow: '0 0 10px rgba(0,229,255,0.8)' }}>
                {bossRewards && bossRewards.length > 0 ? 'BOSS REWARD!' : 'LEVEL UP!'}
              </h2>
              {newLevel && (
                <div className="text-5xl font-bold text-[#ff2d55] mb-1" style={{ textShadow: '0 0 15px rgba(255,45,85,0.8)' }}>
                  Level {newLevel}
                </div>
              )}
            </div>

            {/* Rewards */}
            <div className="space-y-4 mb-6">
              {/* Gold Reward */}
              <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-[#00e5ff]/30">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-lg">Gold Reward</span>
                  <span className="text-2xl font-bold text-yellow-400" style={{ textShadow: '0 0 10px rgba(250,204,21,0.6)' }}>
                    +{goldReward.toLocaleString()} G
                  </span>
                </div>
              </div>

              {/* Garage Health Gain */}
              {garageHealthGain > 0 && (
                <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-[#00e5ff]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-lg">Garage Health</span>
                    <span className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(74,222,128,0.6)' }}>
                      +{garageHealthGain}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Rewards */}
              {cardRewards && cardRewards.length > 0 && (
                <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-[#00e5ff]/30">
                  <div className="text-gray-300 text-lg mb-3">{bossRewards && bossRewards.length > 0 ? 'Level Card Rewards' : 'Card Rewards'}</div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {cardRewards.map((card: any, index: number) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between bg-[#1a1a2e] rounded p-2"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-white text-sm">{card.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">
                            {'★'.repeat(card.rarity)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boss Card Rewards */}
              {bossRewards && bossRewards.length > 0 && (
                <div className="bg-[#0a0a15]/50 rounded-lg p-4 border border-[#ff2d55]/30">
                  <div className="text-gray-300 text-lg mb-3">Boss Card Rewards</div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {bossRewards.map((card: any, index: number) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between bg-[#1a1a2e] rounded p-2"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-white text-sm">{card.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">
                            {'★'.repeat(card.rarity)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Claim Button */}
            <motion.button
              className="w-full py-3 bg-gradient-to-r from-[#00e5ff] to-[#0099ff] text-black font-bold text-xl rounded-lg border-2 border-[#00e5ff] hover:from-[#00ffff] hover:to-[#00aaff] transition-all"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,229,255,0.8)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
            >
              CLAIM REWARDS
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
