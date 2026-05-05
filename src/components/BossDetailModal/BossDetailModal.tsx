'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BossDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bossConfig: any;
  quest?: any; // Full quest object for power/gold data
}

// ── NPC image resolver (sync with WorkshopScreen) ──
const getBossImage = (bossConfig: any): string => {
    if (!bossConfig?.name) return '/gamebossimg/mysteriousmanboss.png';
    const name = bossConfig.name;
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
    return bossConfig.imageUrl || '/gamebossimg/mysteriousmanboss.png';
};

// ── Boss condition data builder ──
const getBossConditions = (config: any): { icon: string; label: string; desc: string; color: string }[] => {
    const conditions: { icon: string; label: string; desc: string; color: string }[] = [];
    if (!config?.specialCondition) return conditions;
    const cond = config.specialCondition.toUpperCase();

    if (cond.includes('DRIFT') || cond.includes('DRIFT_KING')) {
        conditions.push(
            { icon: '🏎️', label: 'Trượt Ly Tâm', desc: 'Slot chẵn: +15% Power, tản nhiệt giảm 30%', color: 'amber' },
            { icon: '🛞', label: 'Cấm SUSPENSION 3★+', desc: 'Chỉ được dùng phuộc 1-2★', color: 'red' },
            { icon: '⚖️', label: 'Stability ≥ 50', desc: 'Xe phải đủ cân bằng để không lật', color: 'cyan' },
        );
    }
    if (cond.includes('NO_COOLING') || cond.includes('F1')) {
        conditions.push(
            { icon: '🚫', label: 'Cấm COOLING', desc: 'Không được lắp thẻ tản nhiệt', color: 'red' },
        );
    }
    if (cond.includes('MIN_RARITY_3') || config.name?.includes('Nhà Sưu Tập')) {
        conditions.push(
            { icon: '💎', label: 'Tối thiểu 3★', desc: 'Phải có ít nhất 3 thẻ ≥ 3★', color: 'purple' },
        );
    }
    if (cond.includes('DAREDEVIL') || cond.includes('DEATH_WISH')) {
        conditions.push(
            { icon: '💀', label: 'Thốc Ga Tử Thần', desc: 'Slot 7: +15 Heat đột biến', color: 'red' },
            { icon: '🔥', label: 'Heat ≥ 75%', desc: 'Nhiệt phải đạt ≥ 75% (nhưng không nổ!)', color: 'amber' },
        );
    }
    if (cond.includes('EP_ISLAND')) {
        conditions.push(
            { icon: '🏝️', label: 'Lựa Chọn Đảo', desc: 'YES: -50 Uy tín, cần ≥1 Combo', color: 'amber' },
            { icon: '🚫', label: 'Nhánh NO', desc: 'Cấm COOLING 5★, cần 1 thẻ 5★ + 1 thẻ 4★', color: 'red' },
            { icon: '🎁', label: 'Thưởng Thắng', desc: '3 Pack + 1 thẻ 4★ + Unlock Trump', color: 'emerald' },
        );
    }
    if (cond.includes('BABY_OIL')) {
        conditions.push(
            { icon: '🛢️', label: 'Nhánh YES', desc: 'Cấm FUEL, Heat ≥ 60%, Power ≤ 400', color: 'amber' },
            { icon: '💰', label: 'Thưởng YES', desc: '+2500 Gold + 2 Pack', color: 'emerald' },
            { icon: '💀', label: 'Nhánh NO / FAIL', desc: '-45% Uy tín, khách hàng bỏ đi hết', color: 'red' },
        );
    }
    if (cond.includes('KIM_JONG')) {
        conditions.push(
            { icon: '🇰🇵', label: 'Gia Nhập Triều Tiên?', desc: 'YES: Vào NK, x2-x3 thu nhập', color: 'amber' },
            { icon: '☠️', label: 'Nhánh NO', desc: 'BAD ENDING — Bị Tiêu Diệt', color: 'red' },
        );
    }
    if (cond.includes('DONALD_TRUMP') || cond.includes('TRUMP')) {
        conditions.push(
            { icon: '🔒', label: 'Khóa Thẻ 5★', desc: 'Tất cả thẻ 5★ bị vô hiệu hoá', color: 'red' },
            { icon: '📊', label: 'Heat > 47%', desc: 'Nhiệt độ phải > 47%, Power 400-470', color: 'amber' },
            { icon: '💵', label: 'Thuế Shop', desc: 'Thắng: -4.7% thuế | Thua: +47% thuế', color: 'cyan' },
        );
    }
    if (cond.includes('RUSSIA_EMPEROR') || cond.includes('NGA')) {
        conditions.push(
            { icon: '🐻', label: 'Phase 1', desc: 'Chạy thử xe bình thường, Heat ≤ 36%', color: 'cyan' },
            { icon: '🍷', label: 'Phase 2: Vodka?', desc: 'YES: Heat max 67%, Gold x2', color: 'amber' },
            { icon: '🐻‍❄️', label: 'Nhánh NO', desc: '3 Gấu tấn công: giảm Power, nuốt thẻ', color: 'red' },
        );
    }
    if (cond.includes('MYSTERIOUS') || config.name?.includes('Bí Ẩn')) {
        conditions.push(
            { icon: '❓', label: 'Pure Power', desc: 'Không có luật đặc biệt — chỉ cần Power 666', color: 'purple' },
            { icon: '💀', label: 'Cẩn Thận', desc: 'Cả thắng lẫn thua đều dẫn đến BAD ENDING', color: 'red' },
        );
    }

    return conditions;
};

const colorClasses: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    red:     { border: 'border-red-500/60',     bg: 'bg-red-950/40',     text: 'text-red-300',     glow: 'shadow-[0_0_6px_rgba(239,68,68,0.3)]' },
    amber:   { border: 'border-amber-500/60',   bg: 'bg-amber-950/40',   text: 'text-amber-300',   glow: 'shadow-[0_0_6px_rgba(251,191,36,0.3)]' },
    cyan:    { border: 'border-cyan-500/60',     bg: 'bg-cyan-950/40',    text: 'text-cyan-300',    glow: 'shadow-[0_0_6px_rgba(34,211,238,0.3)]' },
    emerald: { border: 'border-emerald-500/60',  bg: 'bg-emerald-950/40', text: 'text-emerald-300', glow: 'shadow-[0_0_6px_rgba(52,211,153,0.3)]' },
    purple:  { border: 'border-fuchsia-500/60',  bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-300', glow: 'shadow-[0_0_6px_rgba(217,70,239,0.3)]' },
};

export default function BossDetailModal({ isOpen, onClose, bossConfig, quest }: BossDetailModalProps) {
  if (!bossConfig) return null;

  const bossImage = getBossImage(bossConfig);
  const conditions = getBossConditions(bossConfig);
  const power = quest?.requiredPower || bossConfig.requiredPower || 0;
  const gold = quest?.rewardGold || bossConfig.rewardGold || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop with scan lines */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }} />

          <motion.div
            className="relative w-[95%] max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main card */}
            <div className="bg-gradient-to-b from-slate-950 via-[#0d0a1a] to-slate-950 border-2 border-red-600/60 rounded-lg overflow-hidden shadow-[0_0_60px_rgba(255,45,85,0.25)]">

              {/* ── HEADER BANNER ── */}
              <div className="relative h-36 overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 via-red-950/60 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,45,85,0.15)_0%,transparent_70%)]" />
                
                {/* Boss portrait */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-28 h-28">
                  <img
                    src={bossImage}
                    alt={bossConfig.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,45,85,0.5)]"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/gamebossimg/mysteriousmanboss.png'; }}
                  />
                </div>

                {/* Danger badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-950/80 border border-red-500/50 px-2 py-1 rounded-sm backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_rgba(239,68,68,1)]" />
                  <span className="text-[9px] font-bold text-red-300 tracking-[0.15em]">BOSS QUEST</span>
                </div>

                {/* Close X */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-slate-950/80 border border-slate-600/50 rounded text-slate-400 hover:text-white hover:border-red-500 transition-all text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* ── NAME & QUOTE ── */}
              <div className="px-5 pt-3 pb-4 text-center border-b border-red-900/40">
                <h2
                  className="text-2xl font-black text-red-400 tracking-wide mb-1"
                  style={{ textShadow: '0 0 20px rgba(255,45,85,0.6), 0 2px 8px rgba(0,0,0,0.8)' }}
                >
                  {bossConfig.name}
                </h2>
                {bossConfig.description && (
                  <p className="text-[11px] text-slate-400 italic leading-relaxed mt-1">
                    &ldquo;{bossConfig.description}&rdquo;
                  </p>
                )}
              </div>

              {/* ── STATS ROW ── */}
              <div className="grid grid-cols-3 gap-0 border-b border-red-900/40">
                <div className="flex flex-col items-center py-3 border-r border-red-900/30">
                  <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] mb-1">MÃ LỰC</span>
                  <span className="text-lg font-black text-amber-400" style={{ textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>
                    {power > 0 ? `≥${power}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col items-center py-3 border-r border-red-900/30">
                  <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] mb-1">THƯỞNG</span>
                  <span className="text-lg font-black text-emerald-400" style={{ textShadow: '0 0 10px rgba(52,211,153,0.5)' }}>
                    {gold > 0 ? `${gold.toLocaleString()}G` : 'Đặc biệt'}
                  </span>
                </div>
                <div className="flex flex-col items-center py-3">
                  <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] mb-1">PENALTY</span>
                  <span className="text-lg font-black text-red-400" style={{ textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                    -20
                  </span>
                  <span className="text-[7px] text-red-400/70 font-bold">UY TÍN</span>
                </div>
              </div>

              {/* ── CONDITIONS LIST ── */}
              {conditions.length > 0 && (
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-bold text-red-400 tracking-[0.2em]">ĐIỀU KIỆN ĐẶC BIỆT</span>
                  </div>
                  <div className="space-y-2">
                    {conditions.map((cond, idx) => {
                      const colors = colorClasses[cond.color] || colorClasses.red;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className={`flex items-start gap-3 p-2.5 rounded border ${colors.border} ${colors.bg} ${colors.glow}`}
                        >
                          <span className="text-lg flex-shrink-0 mt-0.5">{cond.icon}</span>
                          <div className="min-w-0">
                            <div className={`text-[10px] font-bold ${colors.text} tracking-wider`}>{cond.label}</div>
                            <div className="text-[9px] text-slate-400 leading-relaxed mt-0.5">{cond.desc}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── CLOSE BUTTON ── */}
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-red-950/60 border-2 border-red-600/50 text-red-300 font-bold text-[11px] tracking-[0.2em] rounded hover:bg-red-900/60 hover:border-red-400 hover:shadow-[0_0_20px_rgba(255,45,85,0.4)] transition-all uppercase"
                >
                  ĐÃ HIỂU — ĐÓNG
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
