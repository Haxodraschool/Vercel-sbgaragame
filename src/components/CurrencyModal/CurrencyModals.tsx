'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';

// ═══════════════════════════════════════════════════════════
// 1. BUY TECHPOINTS MODAL (Gold -> TP)
// ═══════════════════════════════════════════════════════════
export function BuyTpModal() {
  const isOpen = useGameStore((s) => s.isBuyTpModalOpen);
  const setOpen = useGameStore((s) => s.setBuyTpModalOpen);
  const user = useGameStore((s) => s.user);
  const token = useGameStore((s) => s.token);
  const updateGold = useGameStore((s) => s.updateGold);
  const updateTechPoints = useGameStore((s) => s.updateTechPoints);
  
  const [amount, setAmount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const goldCost = amount * 500;
  const canAfford = (user?.gold ?? 0) >= goldCost;

  const handleExchange = async () => {
    if (!canAfford || isProcessing) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/buy-tp', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ tpAmount: amount }),
      });
      const data = await res.json();

      if (res.ok) {
        updateGold(data.gold);
        updateTechPoints(data.techPoints);
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
            setMessage(null);
            setOpen(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi quy đổi!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối server!' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !isProcessing && setOpen(false)}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0a12] border-2 border-emerald-500/40 rounded-sm overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]"
        >
          {/* Header */}
          <div className="bg-emerald-900/20 border-b border-emerald-500/30 p-6 flex justify-between items-center">
            <h2 className="text-xl text-emerald-400 font-bold tracking-widest flex items-center gap-2">
              <span>🔧</span> TRẠM QUY ĐỔI TECHPOINTS
            </h2>
            <button onClick={() => setOpen(false)} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">✕</button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-around items-center bg-emerald-950/20 p-4 rounded-lg border border-emerald-500/10">
              <div className="text-center">
                <div className="text-[10px] text-emerald-500/60 uppercase tracking-tighter mb-1">Hiện có</div>
                <div className="text-xl font-bold text-yellow-500">{user?.gold?.toLocaleString() ?? 0} G</div>
              </div>
              <div className="text-2xl text-emerald-500/30">➜</div>
              <div className="text-center">
                <div className="text-[10px] text-emerald-500/60 uppercase tracking-tighter mb-1">Tỷ giá</div>
                <div className="text-sm font-medium text-emerald-400">500 G = 1 TP</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold">Số lượng TP muốn đổi</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-black/40 border border-emerald-500/30 rounded p-3 text-emerald-100 focus:outline-none focus:border-emerald-400 transition-all text-center text-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[1, 5, 10, 50, 100].map(val => (
                  <button 
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`px-3 py-1 rounded border text-[10px] font-bold transition-all ${amount === val ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-emerald-950/40 text-emerald-500 border-emerald-500/30 hover:bg-emerald-900/40'}`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-500/10 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Tổng chi phí:</span>
                <span className={`font-bold ${canAfford ? 'text-yellow-500' : 'text-red-500'}`}>
                  {goldCost.toLocaleString()} G
                </span>
              </div>

              <button
                disabled={!canAfford || isProcessing}
                onClick={handleExchange}
                className={`w-full py-4 rounded-lg font-bold tracking-[0.2em] transition-all shadow-lg ${
                  canAfford && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                {isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐỔI'}
              </button>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className={`text-center text-xs font-bold p-2 rounded ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                >
                  {message.text}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. TOPUP GOLD MODAL (Real $ -> Gold)
// ═══════════════════════════════════════════════════════════
const GOLD_PACKAGES = [
  { id: 'pkg_1',  price: 1,  gold: 2000,   bonus: 0,    label: 'Gói Khởi Đầu' },
  { id: 'pkg_5',  price: 5,  gold: 10000,  bonus: 500,  label: 'Gói Thợ Sửa' },
  { id: 'pkg_10', price: 10, gold: 20000,  bonus: 2000, label: 'Gói Chuyên Nghiệp' },
  { id: 'pkg_20', price: 20, gold: 40000,  bonus: 5000, label: 'Gói Đại Gia' },
  { id: 'pkg_50', price: 50, gold: 100000, bonus: 20000, label: 'Gói Trùm Garage' },
];

export function TopupGoldModal() {
  const isOpen = useGameStore((s) => s.isTopupGoldModalOpen);
  const setOpen = useGameStore((s) => s.setTopupGoldModalOpen);
  const token = useGameStore((s) => s.token);
  const updateGold = useGameStore((s) => s.updateGold);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkgId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/topup-gold', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();

      if (res.ok) {
        updateGold(data.gold);
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
            setMessage(null);
            setOpen(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi giao dịch!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối server!' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !isProcessing && setOpen(false)}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0a12] border-2 border-yellow-500/40 rounded-sm overflow-hidden shadow-[0_0_50px_rgba(252,161,0,0.2)]"
        >
          {/* Header */}
          <div className="bg-yellow-900/20 border-b border-yellow-500/30 p-6 flex justify-between items-center">
            <h2 className="text-xl text-yellow-400 font-bold tracking-widest flex items-center gap-2">
              <span>💰</span> NẠP VÀNG HỆ THỐNG
            </h2>
            <button onClick={() => setOpen(false)} className="text-yellow-500/50 hover:text-yellow-400 transition-colors">✕</button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {GOLD_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(252,161,0,0.05)' }}
                  className="flex items-center justify-between p-4 bg-slate-900/40 border border-yellow-500/20 rounded-lg group cursor-pointer"
                  onClick={() => handlePurchase(pkg.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-yellow-500/60 uppercase font-bold tracking-wider">{pkg.label}</span>
                    <span className="text-xl font-black text-yellow-400">
                      {(pkg.gold + pkg.bonus).toLocaleString()} Vàng
                    </span>
                    {pkg.bonus > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold italic">+ Khuyến mãi {pkg.bonus.toLocaleString()} Vàng</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-4 py-2 bg-yellow-500 text-black font-black rounded shadow-[0_0_10px_rgba(252,161,0,0.4)] group-hover:scale-110 transition-transform">
                      {pkg.price}$
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`text-center text-sm font-bold p-3 rounded ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {message.text}
              </motion.div>
            )}

            <p className="text-[9px] text-slate-500 text-center italic mt-4 uppercase tracking-widest">
              * Tỷ giá mô phỏng: 1 USD = 2,000 Vàng. Các gói lớn nhận thêm bonus.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
