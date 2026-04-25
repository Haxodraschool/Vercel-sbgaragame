'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountInfoModal({ isOpen, onClose }: AccountInfoModalProps) {
  const user = useGameStore((state) => state.user);
  const token = useGameStore((state) => state.token);
  const setUser = useGameStore((state) => state.setUser);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [unlockedCardsCount, setUnlockedCardsCount] = useState(0);

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/user/inventory', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.uniqueCards !== undefined) {
          setUnlockedCardsCount(data.uniqueCards);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
    };
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen, token]);

  const handleEditName = async () => {
    if (!token || !newUsername.trim()) return;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setIsEditing(false);
      } else {
        alert(data.error || 'Lỗi khi đổi tên!');
      }
    } catch (err) {
      console.error('Error updating username:', err);
      alert('Lỗi kết nối!');
    }
  };

  const handleLogout = () => {
    const logout = useGameStore.getState().logout;
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-[#0a0a12]/95 backdrop-blur-xl border-2 border-[#00e5ff]/50 rounded-lg p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,229,255,0.3)]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#00e5ff] tracking-wider">
                THÔNG TIN TÀI KHOẢN
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              {/* Username */}
              <div className="bg-[#12141c] border border-slate-700/50 rounded-lg p-4">
                <div className="text-[10px] text-slate-500 tracking-widest mb-1">TÊN TÀI KHOẢN</div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 bg-[#0a0a12] border border-[#00e5ff]/50 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00e5ff]"
                      maxLength={20}
                    />
                    <button
                      onClick={handleEditName}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm transition-colors"
                    >
                      LƯU
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setNewUsername(user?.username || ''); }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm transition-colors"
                    >
                      HỦY
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">{user?.username}</span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] text-[#00e5ff] hover:text-white transition-colors underline"
                    >
                      Sửa tên
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Gold */}
                <div className="bg-[#12141c] border border-[#fca100]/30 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 tracking-widest mb-1">VÀNG</div>
                  <div className="text-2xl font-bold text-[#fca100]">{user?.gold?.toLocaleString() || 0}</div>
                </div>

                {/* Level */}
                <div className="bg-[#12141c] border border-purple-500/30 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 tracking-widest mb-1">CẤP ĐỘ</div>
                  <div className="text-2xl font-bold text-purple-400">{user?.level || 1}</div>
                </div>

                {/* Reputation */}
                <div className="bg-[#12141c] border border-[#a855f7]/30 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 tracking-widest mb-1">UY TÍN</div>
                  <div className={`text-2xl font-bold ${(user?.garageHealth || 0) >= 75 ? 'text-emerald-400' : (user?.garageHealth || 0) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {user?.garageHealth || 0}
                  </div>
                </div>

                {/* Unlocked Cards */}
                <div className="bg-[#12141c] border border-cyan-500/30 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 tracking-widest mb-1">THẺ ĐÃ MỞ</div>
                  <div className="text-2xl font-bold text-cyan-400">{unlockedCardsCount}</div>
                </div>
              </div>

              {/* Current Day */}
              <div className="bg-[#12141c] border border-slate-700/50 rounded-lg p-4">
                <div className="text-[10px] text-slate-500 tracking-widest mb-1">NGÀY HIỆN TẠI</div>
                <div className="text-xl font-bold text-white">{user?.currentDay || 1} / 50</div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-500/50 hover:border-red-500 text-red-400 rounded-lg font-bold tracking-wider transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  � ĐĂNG XUẤT
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
