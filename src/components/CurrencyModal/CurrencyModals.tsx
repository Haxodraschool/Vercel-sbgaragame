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
          className="relative w-full max-w-md bg-gradient-to-b from-[#111827] to-[#0a0a12] border-2 border-emerald-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)] p-1"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900/60 to-emerald-950/20 border-b border-emerald-500/30 p-5 rounded-t-xl flex justify-between items-center">
            <h2 className="text-emerald-400 font-black tracking-widest flex items-center gap-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
              <span>⚡</span> TRẠM QUY ĐỔI TECHPOINTS
            </h2>
            <button onClick={() => setOpen(false)} className="text-emerald-500/60 hover:text-emerald-300 transition-colors text-xl font-bold hover:scale-110">✕</button>
          </div>

          <div className="p-6 space-y-7 bg-black/20 rounded-b-xl">
            <div className="flex justify-around items-center bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-emerald-950/40 p-5 rounded-xl border border-emerald-500/20 shadow-inner">
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
                className={`w-full py-4 rounded-xl font-bold tracking-[0.2em] transition-all shadow-lg text-lg ${
                  canAfford && !isProcessing
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transform hover:-translate-y-1'
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
  { id: 'pkg_10k',  price: 10000,  gold: 1000,  bonus: 0,    label: 'Gói Khởi Đầu' },
  { id: 'pkg_20k',  price: 20000,  gold: 2200,  bonus: 200,  label: 'Gói Thợ Sửa' },
  { id: 'pkg_50k',  price: 50000,  gold: 6000,  bonus: 1000, label: 'Gói Chuyên Nghiệp' },
  { id: 'pkg_100k', price: 100000, gold: 13000, bonus: 3000, label: 'Gói Đại Gia' },
  { id: 'pkg_200k', price: 200000, gold: 28000, bonus: 8000, label: 'Gói Trùm Garage' },
  { id: 'pkg_500k', price: 500000, gold: 75000, bonus: 25000, label: 'Gói VIP' },
];

export function TopupGoldModal() {
  const isOpen = useGameStore((s) => s.isTopupGoldModalOpen);
  const setOpen = useGameStore((s) => s.setTopupGoldModalOpen);
  const token = useGameStore((s) => s.token);

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkgId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        // Redirect to PayOS checkout page
        window.location.href = data.checkoutUrl;
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi tạo link thanh toán!' });
        setIsProcessing(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối server!' });
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
          className="relative w-full max-w-lg bg-gradient-to-b from-[#18110b] to-[#0a0a12] border-2 border-yellow-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(252,161,0,0.3)] p-1"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-900/60 to-yellow-950/20 border-b border-yellow-500/30 p-5 rounded-t-xl flex justify-between items-center">
            <h2 className="text-yellow-400 font-black tracking-widest flex items-center gap-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
              <span>💎</span> NẠP VÀNG HỆ THỐNG
            </h2>
            <button onClick={() => setOpen(false)} className="text-yellow-500/60 hover:text-yellow-300 transition-colors text-xl font-bold hover:scale-110">✕</button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-black/20 rounded-b-xl">
            <div className="grid grid-cols-1 gap-4">
              {GOLD_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(252,161,0,0.1)' }}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-yellow-950/30 to-transparent border border-yellow-500/30 rounded-xl group cursor-pointer transition-colors shadow-sm"
                  onClick={() => handlePurchase(pkg.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-yellow-500/80 uppercase font-black tracking-widest">{pkg.label}</span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-md">
                      {(pkg.gold + pkg.bonus).toLocaleString()} Vàng
                    </span>
                    {pkg.bonus > 0 && (
                      <span className="text-[11px] text-emerald-400 font-bold italic bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                        + Bonus {pkg.bonus.toLocaleString()} Vàng
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-yellow-950 font-black rounded-lg shadow-[0_0_15px_rgba(252,161,0,0.5)] group-hover:shadow-[0_0_25px_rgba(252,161,0,0.8)] group-hover:scale-105 transition-all">
                      {pkg.price.toLocaleString()}đ
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
              * Thanh toán qua PayOS (VietQR). Các gói lớn nhận thêm bonus.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
