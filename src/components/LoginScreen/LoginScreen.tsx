'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';
import { api } from '@/lib/api';

// ─── Pixel Rain Drop Component ───
function RainDrop({ delay, left, duration }: { delay: number; left: number; duration: number }) {
  return (
    <motion.div
      className="absolute w-[2px] h-[16px] bg-cyan-300/30"
      style={{ left: `${left}%`, top: -20, imageRendering: 'pixelated' }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: '100vh', opacity: [0, 0.4, 0.4, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// ─── Fog Layer Component ───
function FogLayer({ direction, speed, opacity }: { direction: 1 | -1; speed: number; opacity: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
      initial={{ x: direction === 1 ? '-100%' : '100%' }}
      animate={{ x: direction === 1 ? '100%' : '-100%' }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >
      <div
        className="w-full h-full"
        style={{
          opacity,
          background: `repeating-linear-gradient(
            ${direction === 1 ? '90deg' : '270deg'},
            transparent 0px,
            rgba(200,220,255,0.03) 4px,
            transparent 8px,
            rgba(200,220,255,0.05) 16px,
            transparent 24px
          )`,
        }}
      />
    </motion.div>
  );
}

// ─── Pixel Spark (for neon tube) ───
function NeonSpark() {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparks((prev) => [
        ...prev.slice(-3),
        { id: Date.now(), x: Math.random() * 100, y: Math.random() * 20 - 10 },
      ]);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute w-[3px] h-[3px] bg-cyan-300"
          style={{ left: `${s.x}%`, top: `${s.y}px`, imageRendering: 'pixelated' }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0, y: 15 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={() =>
            setSparks((prev) => prev.filter((p) => p.id !== s.id))
          }
        />
      ))}
    </>
  );
}

// ─── Slit Lighting Ray (light streaming through door gap) ───
function SlitLightRay({ index, total }: { index: number; total: number }) {
  const xPos = (index / (total - 1)) * 100;
  // Deterministic width per ray index
  const width = 2 + ((index * 7 + 3) % 5);
  const baseDelay = index * 0.05;
  const rayHeight = 40 + ((index * 13) % 60); // 40-100% height variation

  return (
    <motion.div
      className="absolute bottom-0"
      style={{
        left: `${xPos}%`,
        width: `${width}px`,
        transformOrigin: 'bottom center',
        imageRendering: 'pixelated',
      }}
      initial={{ height: '0%', opacity: 0 }}
      animate={{
        height: ['0%', `${rayHeight * 0.6}%`, `${rayHeight}%`],
        opacity: [0, 0.9, 0],
      }}
      transition={{
        duration: 2.0,
        delay: baseDelay,
        ease: 'easeOut',
      }}
    >
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(to top, rgba(255,220,130,0.95) 0%, rgba(255,200,100,0.6) 30%, rgba(255,180,80,0.2) 70%, transparent 100%)`,
          filter: 'blur(1px)',
        }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// MAIN LOGIN SCREEN
// ═══════════════════════════════════════════

export default function LoginScreen() {
  const [step, setStep] = useState<'initial' | 'knocking' | 'form'>('initial');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [garageFlicker, setGarageFlicker] = useState(true);
  const [mounted, setMounted] = useState(false);

  const setToken = useGameStore((s) => s.setToken);
  const setUser = useGameStore((s) => s.setUser);
  const setScreen = useGameStore((s) => s.setScreen);
  const transitionScreen = useGameStore((s) => s.transitionScreen);
  const doorControls = useAnimation();
  const lightControls = useAnimation();

  // ─── Client-only mount flag (fixes hydration mismatch for rain) ───
  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Random flicker for "GARAGE" text ───
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const flicker = () => {
      setGarageFlicker(false);
      const offTime = 50 + Math.random() * 250;
      timeout = setTimeout(() => {
        setGarageFlicker(true);
        const nextFlicker = 500 + Math.random() * 3000;
        timeout = setTimeout(flicker, nextFlicker);
      }, offTime);
    };
    const initial = 1000 + Math.random() * 2000;
    timeout = setTimeout(flicker, initial);
    return () => clearTimeout(timeout);
  }, []);

  // ─── Rain drops (client-only, generated after mount) ───
  const [rainDrops] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 110 - 5,
      delay: Math.random() * 3,
      duration: 0.8 + Math.random() * 0.6,
    }))
  );

  // ─── Slit light ray count ───
  const slitRays = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  // ─── Handle knock ───
  const handleKnock = useCallback(() => {
    setStep('knocking');
    // Simulate 3 knocks over ~1.2s, then show form
    setTimeout(() => {
      setStep('form');
    }, 1200);
  }, []);

  // ─── Handle submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setHasError(false);

    try {
      let data;
      if (isLoginMode) {
        data = await api.auth.login(username, password);
      } else {
        data = await api.auth.register(username, password);
      }

      setToken(data.token);
      setUser(data.user as any);
      setIsOpening(true);
      setErrorMessage('');

      // Login/register success - no toast

      // Door open + slit lighting run in parallel
      // (isOpening=true already triggers slit lighting via AnimatePresence)
      await doorControls.start({
        y: '-110%',
        transition: { duration: 2.2, ease: [0.45, 0, 0.15, 1] },
      });

      // Light flood after door is fully open
      await lightControls.start({
        opacity: 1,
        transition: { duration: 0.5 },
      });

      setTimeout(() => transitionScreen('lobby'), 200);
    } catch (err: any) {
      setHasError(true);
      const msg = err?.message || (isLoginMode ? 'Sai tài khoản hoặc mật khẩu!' : 'Tạo tài khoản thất bại!');
      setErrorMessage(msg);
      console.error('Auth error:', msg);
      setTimeout(() => setHasError(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-[#020208] select-none" style={{ fontFamily: 'var(--font-primary), "VT323", monospace' }}>
      {/* ─── Background: Dark Alley ─── */}
      <div className="absolute inset-0">
        {/* Ground puddle reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-[20%]"
          style={{
            background: 'linear-gradient(to top, rgba(0,200,255,0.04) 0%, transparent 100%)',
            imageRendering: 'pixelated',
          }}
        />

        {/* Alley walls - pixelated brick texture (CSS pattern) */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 16px),
              repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,0.08) 31px, rgba(255,255,255,0.08) 32px)
            `,
            imageRendering: 'pixelated',
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>

      {/* ─── Rain (client-only to avoid hydration mismatch) ─── */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ transform: 'rotate(8deg) scale(1.1)' }}>
          {rainDrops.map((drop) => (
            <RainDrop key={drop.id} delay={drop.delay} left={drop.left} duration={drop.duration} />
          ))}
        </div>
      )}

      {/* ─── Fog/Smoke ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FogLayer direction={1} speed={25} opacity={0.6} />
        <FogLayer direction={-1} speed={35} opacity={0.4} />
      </div>

      {/* ─── Garage Door (animated) ─── */}
      <motion.div
        className="absolute inset-0 z-[5]"
        animate={doorControls}
      >
        {/* Metal door surface */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                #0a0a0f 0px,
                #0e0e14 2px,
                #080810 4px,
                #0c0c12 24px,
                #050508 26px,
                #0a0a0f 28px
              )
            `,
            imageRendering: 'pixelated',
          }}
        />
        {/* Horizontal ridges (garage door panels) */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              180deg,
              transparent 0px,
              transparent 58px,
              rgba(255,255,255,0.06) 58px,
              rgba(255,255,255,0.03) 60px,
              transparent 62px
            )`,
            imageRendering: 'pixelated',
          }}
        />
        {/* Handle */}
        <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 w-[60px] h-[6px] rounded-[1px] bg-[#1a1a24] border border-[#2a2a3a]" />

        {/* Error shake overlay */}
        <motion.div
          className="absolute inset-0"
          animate={
            hasError
              ? {
                  x: [0, -6, 6, -4, 4, -2, 2, 0],
                  transition: { duration: 0.4 },
                }
              : {}
          }
        />
      </motion.div>

      {/* ─── Light from under door ─── */}
      <AnimatePresence>
        {(step === 'form' || step === 'knocking') && !isOpening && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-[4]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 30, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(to top, rgba(255,200,100,0.4) 0%, rgba(255,200,100,0.1) 60%, transparent 100%)',
                imageRendering: 'pixelated',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Slit Lighting (light rays when door opens) ─── */}
      {isOpening && (
        <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden">
          {/* Horizontal slit glow band — follows bottom edge of rising door */}
          <motion.div
            className="absolute left-0 right-0"
            initial={{ bottom: '0%', height: 4, opacity: 1 }}
            animate={{
              bottom: ['0%', '40%', '80%', '110%'],
              height: [4, 50, 100, 140],
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{ duration: 2.2, ease: [0.45, 0, 0.15, 1] }}
          >
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,220,130,0.7) 20%, rgba(255,240,180,1) 50%, rgba(255,220,130,0.7) 80%, transparent 100%)',
                boxShadow: '0 0 60px rgba(255,200,100,0.6), 0 0 120px rgba(255,180,80,0.3)',
                imageRendering: 'pixelated',
              }}
            />
          </motion.div>

          {/* Vertical light rays shooting upward from the slit */}
          {slitRays.map((i) => (
            <SlitLightRay key={i} index={i} total={slitRays.length} />
          ))}

          {/* Warm ambient light flooding upward */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            initial={{ height: '0%', opacity: 0 }}
            animate={{
              height: ['0%', '40%', '70%', '100%'],
              opacity: [0, 0.5, 0.7, 0.9],
            }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(to top, rgba(255,200,100,0.4) 0%, rgba(255,220,150,0.2) 40%, transparent 100%)',
            }}
          />

          {/* Bright center glow */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            initial={{ width: '20%', height: '0%', opacity: 0 }}
            animate={{
              width: ['20%', '60%', '100%'],
              height: ['0%', '50%', '100%'],
              opacity: [0, 0.6, 0],
            }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(ellipse at bottom center, rgba(255,230,150,0.5) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* ─── White Flash (on door open) ─── */}
      <motion.div
        className="absolute inset-0 z-[15] bg-amber-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={lightControls}
      />

      {/* ─── Neon Sign "SB-GARAGE" ─── */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 z-[8]">
        <div className="relative">
          {/* Neon glow backdrop */}
          <div
            className="absolute -inset-8 rounded-lg opacity-50 blur-lg"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,45,85,0.25) 0%, rgba(0,229,255,0.15) 50%, transparent 80%)',
            }}
          />

          {/* Neon spark particles */}
          <div className="relative">
            <NeonSpark />
          </div>

          {/* "SB-" stable purple neon + "GARAGE" flickering cyan neon */}
          <div className="flex items-center justify-center gap-0 text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.15em]">
            {/* "SB" — red neon, always on */}
            <span
              className="relative"
              style={{
                color: '#ff2d55',
                textShadow: `
                  0 0 8px rgba(255,45,85,0.9),
                  0 0 20px rgba(255,45,85,0.7),
                  0 0 40px rgba(255,45,85,0.4),
                  0 0 80px rgba(255,45,85,0.2)
                `,
                WebkitTextStroke: '1px rgba(255,45,85,0.3)',
                imageRendering: 'pixelated',
              }}
            >
              SB
            </span>
            {/* "-" — vivid purple neon */}
            <span
              className="relative mx-0"
              style={{
                color: '#c026d3',
                textShadow: `
                  0 0 8px rgba(192,38,211,0.9),
                  0 0 20px rgba(192,38,211,0.7),
                  0 0 40px rgba(192,38,211,0.4),
                  0 0 80px rgba(192,38,211,0.2)
                `,
                imageRendering: 'pixelated',
              }}
            >
              -
            </span>
            {/* "GARAGE" — cyan neon with flicker (outline always visible) */}
            <motion.span
              className="relative"
              animate={{
                textShadow: garageFlicker
                  ? `
                    0 0 8px rgba(0,229,255,0.9),
                    0 0 20px rgba(0,229,255,0.6),
                    0 0 40px rgba(0,229,255,0.3),
                    0 0 80px rgba(0,229,255,0.15)
                  `
                  : '0 0 2px rgba(0,229,255,0.05)',
              }}
              transition={{ duration: 0.05 }}
              style={{
                color: garageFlicker ? '#00e5ff' : '#0a2a30',
                WebkitTextStroke: garageFlicker
                  ? '0px transparent'
                  : '1px rgba(0,229,255,0.25)',
                imageRendering: 'pixelated',
              }}
            >
              GARAGE
            </motion.span>
          </div>

          {/* Neon tube bracket decorations */}
          <div className="flex justify-between mt-2 px-2">
            <div className="w-3 h-1 bg-[#1a1a24] rounded-[1px]" />
            <div className="w-3 h-1 bg-[#1a1a24] rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* ─── Knock indicator (3 dots animation) ─── */}
      <AnimatePresence>
        {step === 'knocking' && (
          <motion.div
            className="absolute top-[55%] left-1/2 -translate-x-1/2 z-[20] flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-amber-200/80 rounded-[1px]"
                style={{ imageRendering: 'pixelated' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.6] }}
                transition={{ delay: i * 0.3, duration: 0.3 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UI Layer ─── */}
      <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {/* ─── "GÕ CỬA" Button ─── */}
          {step === 'initial' && !isOpening && (
            <motion.button
              key="knock-btn"
              className="pointer-events-auto relative px-10 py-4 text-2xl tracking-[4px] uppercase
                         border-2 border-[#606075] text-[#a0a0b5] bg-transparent
                         cursor-pointer transition-all duration-300
                         hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]
                         active:scale-95"
              style={{ fontFamily: 'inherit', imageRendering: 'pixelated' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleKnock}
            >
              {/* Pixel border accent */}
              <div className="absolute inset-0 border border-[#606075]/30 translate-x-[2px] translate-y-[2px] pointer-events-none" />
              GÕ CỬA
            </motion.button>
          )}

          {/* ─── Login/Register Form ─── */}
          {step === 'form' && !isOpening && (
            <motion.div
              key="auth-form"
              className="pointer-events-auto relative w-[90%] max-w-[420px]
                         bg-[#12121a]/95 backdrop-blur-sm
                         border-2 border-[#2a2a3a] p-8
                         shadow-[0_20px_60px_rgba(0,0,0,0.8),_0_0_1px_rgba(0,229,255,0.1)]"
              style={{ imageRendering: 'pixelated' }}
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={
                hasError
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      x: [0, -5, 5, -4, 4, -2, 2, 0],
                      transition: { x: { duration: 0.4 } },
                    }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              {/* Pixel corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40" />

              {/* Close button */}
              <button
                className="absolute top-3 right-4 text-[#606075] text-2xl bg-transparent border-none cursor-pointer
                           transition-all duration-150 hover:text-red-400 hover:scale-110"
                style={{ fontFamily: 'inherit' }}
                onClick={() => setStep('initial')}
                aria-label="Đóng form"
              >
                ✕
              </button>

              {/* Title */}
              <motion.h2
                className="text-center text-3xl mb-6 tracking-wider"
                style={{
                  color: '#00e5ff',
                  textShadow: '0 0 10px rgba(0,229,255,0.4)',
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {isLoginMode ? '⛽ ĐĂNG NHẬP' : '🔧 TẠO TÀI KHOẢN'}
              </motion.h2>

              {/* Error Message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    className="mb-4 text-center text-red-500 text-sm tracking-wide"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ textShadow: '0 0 8px rgba(239,68,68,0.4)' }}
                  >
                    ⚠ {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-6" />

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Username */}
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="text-lg text-[#a0a0b5] tracking-wide">
                    {'> '}USERNAME
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên thợ máy..."
                    className="w-full bg-[#0a0a12] border-2 border-[#2a2a3a] text-[#f0f0f5] px-4 py-3
                               text-xl outline-none transition-all duration-200
                               focus:border-cyan-500/60 focus:shadow-[0_0_10px_rgba(0,229,255,0.15)]
                               placeholder:text-[#404050]"
                    style={{ fontFamily: 'inherit', imageRendering: 'pixelated' }}
                  />
                </motion.div>

                {/* Password */}
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="text-lg text-[#a0a0b5] tracking-wide">
                    {'> '}PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full bg-[#0a0a12] border-2 border-[#2a2a3a] text-[#f0f0f5] px-4 py-3
                               text-xl outline-none transition-all duration-200
                               focus:border-cyan-500/60 focus:shadow-[0_0_10px_rgba(0,229,255,0.15)]
                               placeholder:text-[#404050]"
                    style={{ fontFamily: 'inherit', imageRendering: 'pixelated' }}
                  />
                </motion.div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="relative mt-2 w-full py-3 text-xl font-bold tracking-[3px] uppercase
                             bg-cyan-600 text-[#020208] border-none cursor-pointer
                             transition-all duration-200
                             hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]
                             disabled:bg-[#404050] disabled:text-[#808090] disabled:cursor-not-allowed disabled:shadow-none
                             active:scale-[0.98]"
                  style={{ fontFamily: 'inherit', imageRendering: 'pixelated' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  {/* Pixel shadow offset */}
                  <div className="absolute inset-0 bg-cyan-800/50 translate-x-[3px] translate-y-[3px] -z-10" />
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⚙
                      </motion.span>
                      ĐANG XÁC THỰC...
                    </span>
                  ) : isLoginMode ? (
                    '🔑 MỞ CỬA'
                  ) : (
                    '📝 ĐĂNG KÝ'
                  )}
                </motion.button>
              </form>

              {/* Toggle Login/Register */}
              <motion.button
                type="button"
                className="mt-5 w-full text-center text-base text-[#808090] bg-transparent border-none cursor-pointer
                           underline underline-offset-4 transition-colors duration-200
                           hover:text-cyan-300"
                style={{ fontFamily: 'inherit' }}
                onClick={() => setIsLoginMode(!isLoginMode)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                {isLoginMode
                  ? '[ Chưa có chìa khóa? Tạo mới ]'
                  : '[ Đã có chìa khóa? Đăng nhập ]'}
              </motion.button>

              {/* Error neon flicker on form border */}
              <AnimatePresence>
                {hasError && (
                  <motion.div
                    className="absolute inset-0 border-2 border-red-500 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.3, 1, 0.2, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ boxShadow: '0 0 20px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.1)' }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Scanline overlay (CRT / pixel art feel) ─── */}
      <div
        className="absolute inset-0 z-[25] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
          imageRendering: 'pixelated',
        }}
      />

      {/* ─── Bottom ambiance text ─── */}
      {!isOpening && (
        <motion.p
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[20] text-sm text-[#404050] tracking-[2px] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          ▸ SB-GARAGE v0.1 ◂
        </motion.p>
      )}
    </div>
  );
}
