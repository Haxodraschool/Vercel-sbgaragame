'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';
import { useInterval } from 'react-use';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';
import * as Progress from '@radix-ui/react-progress';
import { ShadowManager, DeckOverlay } from '@/components';
import type { QuestData } from '@/components/ShadowCustomer/ShadowCustomer';

/* ─── Inline SVG Icons ─── */
const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Outer border */}
    <rect x="5" y="1" width="6" height="1" fill="currentColor" />
    <rect x="5" y="14" width="6" height="1" fill="currentColor" />
    <rect x="3" y="2" width="2" height="1" fill="currentColor" />
    <rect x="11" y="2" width="2" height="1" fill="currentColor" />
    <rect x="3" y="13" width="2" height="1" fill="currentColor" />
    <rect x="11" y="13" width="2" height="1" fill="currentColor" />
    <rect x="2" y="3" width="1" height="2" fill="currentColor" />
    <rect x="13" y="3" width="1" height="2" fill="currentColor" />
    <rect x="2" y="11" width="1" height="2" fill="currentColor" />
    <rect x="13" y="11" width="1" height="2" fill="currentColor" />
    <rect x="1" y="5" width="1" height="6" fill="currentColor" />
    <rect x="14" y="5" width="1" height="6" fill="currentColor" />

    {/* Inner background dim */}
    <rect x="5" y="2" width="6" height="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="4" y="3" width="8" height="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="3" y="4" width="10" height="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="2" y="5" width="12" height="6" fill="currentColor" fillOpacity="0.2" />
    <rect x="3" y="11" width="10" height="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="4" y="12" width="8" height="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="5" y="13" width="6" height="1" fill="currentColor" fillOpacity="0.2" />

    {/* Clock Hands */}
    <rect x="7" y="4" width="2" height="5" fill="currentColor" />
    <rect x="7" y="7" width="5" height="2" fill="currentColor" />
  </svg>
);

const CoinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
    {/* Outer border dark #784800 */}
    <rect x="5" y="1" width="6" height="1" fill="#784800" />
    <rect x="5" y="14" width="6" height="1" fill="#784800" />
    <rect x="3" y="2" width="2" height="1" fill="#784800" />
    <rect x="11" y="2" width="2" height="1" fill="#784800" />
    <rect x="3" y="13" width="2" height="1" fill="#784800" />
    <rect x="11" y="13" width="2" height="1" fill="#784800" />
    <rect x="2" y="3" width="1" height="2" fill="#784800" />
    <rect x="13" y="3" width="1" height="2" fill="#784800" />
    <rect x="2" y="11" width="1" height="2" fill="#784800" />
    <rect x="13" y="11" width="1" height="2" fill="#784800" />
    <rect x="1" y="5" width="1" height="6" fill="#784800" />
    <rect x="14" y="5" width="1" height="6" fill="#784800" />

    {/* Bright edge top left #fef08a */}
    <rect x="5" y="2" width="6" height="1" fill="#fef08a" />
    <rect x="3" y="3" width="2" height="1" fill="#fef08a" />
    <rect x="3" y="4" width="1" height="1" fill="#fef08a" />
    <rect x="2" y="5" width="1" height="6" fill="#fef08a" />
    <rect x="4" y="3" width="1" height="1" fill="#fef08a" />

    {/* Shadow edge bottom right #b45309 */}
    <rect x="5" y="13" width="6" height="1" fill="#b45309" />
    <rect x="11" y="12" width="2" height="1" fill="#b45309" />
    <rect x="12" y="11" width="1" height="1" fill="#b45309" />
    <rect x="13" y="5" width="1" height="6" fill="#b45309" />
    <rect x="11" y="13" width="1" height="1" fill="#b45309" />
    
    <rect x="11" y="3" width="2" height="1" fill="#d97706" />
    <rect x="13" y="4" width="1" height="1" fill="#d97706" />

    {/* Gold Base #facc15 & mid #f59e0b */}
    <rect x="4" y="4" width="8" height="8" fill="#facc15" />
    <rect x="5" y="3" width="6" height="1" fill="#facc15" />
    <rect x="5" y="12" width="6" height="1" fill="#f59e0b" />
    <rect x="4" y="12" width="1" height="1" fill="#f59e0b" />
    <rect x="11" y="12" width="1" height="1" fill="#f59e0b" />
    <rect x="3" y="5" width="1" height="6" fill="#facc15" />
    <rect x="12" y="5" width="1" height="6" fill="#f59e0b" />

    {/* Inner detail (the slit/dash) */}
    <rect x="7" y="5" width="2" height="6" fill="#d97706" />
    <rect x="7" y="5" width="1" height="5" fill="#784800" />
  </svg>
);

const CardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const DeckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
    {/* Back card (offset) */}
    <rect x="6" y="8" width="18" height="22" rx="1" fill="#754b29" stroke="#111" strokeWidth="2" />
    {/* Main card */}
    <rect x="4" y="4" width="18" height="22" rx="1" fill="#b07842" stroke="#111" strokeWidth="2" />
    {/* Inner decorative border */}
    <rect x="6" y="6" width="14" height="18" fill="none" stroke="#f6c963" strokeWidth="1.5" />
    {/* Diamond symbol */}
    <path d="M13 10 L17 15 L13 20 L9 15 Z" fill="#f6c963" stroke="#111" strokeWidth="1" strokeLinejoin="miter" />
    {/* Inner small diamond */}
    <path d="M13 12.5 L15 15 L13 17.5 L11 15 Z" fill="#8c5830" />
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

/* ─── Component ─── */
export default function LobbyScreen() {
  const user = useGameStore((state) => state.user);
  const token = useGameStore((state) => state.token);
  const { setTheme } = useTheme();

  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [isDeckOpen, setIsDeckOpen] = useState(false);

  const transitionScreen = useGameStore((s) => s.transitionScreen);
  const setActiveQuest = useGameStore((s) => s.setActiveQuest);
  const markScreenReady = useGameStore((s) => s.markScreenReady);

  // --- Loading readiness tracking (tell global LoadingScreen when we're done) ---
  const [questsLoaded, setQuestsLoaded] = useState(false);
  const [bgImgLoaded, setBgImgLoaded] = useState(false);

  // --- Background Music ref (swapped by currentDay: 1-25 vs 26-50) ---
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmTrackRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // --- Lobby Background Music: day 1-25 → maingamemusic1, day 26-50 → maingamemusic2 ---
  useEffect(() => {
    if (!mounted) return;
    const day = user?.currentDay ?? 1;
    const trackSrc = day >= 26 ? '/gamemusic/maingamemusic2.mp3' : '/gamemusic/maingamemusic1.mp3';

    // Skip if same track is already playing
    if (bgmTrackRef.current === trackSrc && bgmRef.current) return;

    // Stop old track (if any)
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
      bgmRef.current = null;
    }

    const bgm = new Audio(trackSrc);
    bgm.loop = true;
    bgm.volume = 0.4;
    bgmRef.current = bgm;
    bgmTrackRef.current = trackSrc;

    const playMusic = () => {
      bgm.play().catch((e) => console.error('Lobby BGM play blocked:', e));
    };
    playMusic();

    // Fallback: play on first click if autoplay blocked
    const onFirstClick = () => playMusic();
    document.addEventListener('click', onFirstClick, { once: true });

    return () => {
      document.removeEventListener('click', onFirstClick);
      bgm.pause();
      bgm.currentTime = 0;
      if (bgmRef.current === bgm) {
        bgmRef.current = null;
        bgmTrackRef.current = null;
      }
    };
  }, [mounted, user?.currentDay]);

  // Fetch daily quests — get full quest data
  useEffect(() => {
    if (!mounted || !token) return;

    const fetchQuests = async () => {
      try {
        const res = await fetch('/api/quest/daily', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.quests && data.quests.length > 0) {
          setQuests(data.quests);
        } else if (res.ok && data.quests && data.quests.length === 0) {
          // If 0 quests, generate for the day
          const postRes = await fetch('/api/quest/daily', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (postRes.ok) {
            // Re-fetch to get full quest data
            const res2 = await fetch('/api/quest/daily', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data2 = await res2.json();
            if (data2.quests) setQuests(data2.quests);
          }
        }
      } catch (err) {
        console.error('Error fetching quests:', err);
      } finally {
        setQuestsLoaded(true);
      }
    };

    fetchQuests();
  }, [mounted, token, user?.currentDay]);

  // --- Preload background images so the loader stays visible until assets are ready ---
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const urls = ['/bg-lobby.jpg', '/table.png'];
    let remaining = urls.length;
    const done = () => {
      if (cancelled) return;
      remaining -= 1;
      if (remaining <= 0) setBgImgLoaded(true);
    };
    urls.forEach((url) => {
      const img = new window.Image();
      img.onload = done;
      img.onerror = done; // never block the UI on a missing asset
      img.src = url;
    });
    return () => { cancelled = true; };
  }, [mounted]);

  // --- When all lobby resources are ready, dismiss the global loading overlay ---
  useEffect(() => {
    if (questsLoaded && bgImgLoaded) {
      markScreenReady();
    }
  }, [questsLoaded, bgImgLoaded, markScreenReady]);

  // Update clock every second
  useInterval(() => setTime(new Date()), 1000);

  // Sync theme with real time
  useEffect(() => {
    if (!mounted) return;
    const hours = time.getHours();
    setTheme(hours >= 6 && hours < 18 ? 'light' : 'dark');
  }, [time, mounted, setTheme]);

  // Derived values
  const currentLevel = user?.level || 5;
  const currentDay = user?.currentDay || 15;
  const gold = user?.gold || 1250;
  const prestigePoints = user?.garageHealth || 75;
  const maxPrestige = 100;

  const [isBurning, setIsBurning] = useState(false);
  const prevPrestigeRef = useRef(prestigePoints);

  useEffect(() => {
    if (mounted && prestigePoints < prevPrestigeRef.current) {
      setIsBurning(true);
      const timer = setTimeout(() => setIsBurning(false), 2000);
      prevPrestigeRef.current = prestigePoints;
      return () => clearTimeout(timer);
    }
    prevPrestigeRef.current = prestigePoints;
  }, [prestigePoints, mounted]);

  const timeStr = mounted ? format(time, 'hh:mm a') : '00:00 --';

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden bg-black select-none flex items-center justify-center font-pixel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background blur layer — fills letterbox areas on non-16:9 screens */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-105 pointer-events-none"
        style={{ backgroundImage: 'url("/bg-lobby.jpg")' }}
      />

      {/* Game container — locked to 16:9 aspect ratio, always shows full image */}
      <div
        className="relative z-10 w-full h-full max-w-[177.78vh] max-h-[56.25vw] bg-center bg-no-repeat bg-cover shadow-[0_0_40px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden"
        style={{
          backgroundImage: 'url("/bg-lobby.jpg")',
          imageRendering: 'pixelated',
        }}
      >
        {/* Shadow Customer System — ShadowManager handles the full animation flow */}
        {mounted && quests.length > 0 && (
          <ShadowManager
            quests={quests}
            onQuestAccepted={(quest) => {
              setActiveQuest(quest);
              transitionScreen('workshop');
            }}
          />
        )}

        {/* 
          Foreground Table Overlay 
          Chỉ cần chỉnh 'width' (độ to), 'left' (trái/phải) và 'top' (lên/xuống). 
          Chiều cao sẽ tự động tính toán theo tỷ lệ gốc để không bị bóp méo!
        */}
        <div
          className="absolute pointer-events-none z-[20]"
          style={{
            backgroundImage: 'url("/table.png")',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            // Tweak width, left, top here:
            aspectRatio: '1280 / 697', 
            height: 'auto',
            width: '37.8%',     
            left: '33.2%',      
            top: '47.8%',       
          }}
        />

        {/* HUD TOP overlay (z-index 120 — above NPC portrait and chat box) */}
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-start z-[120]">

          {/* ═══ TOP ROW ═══ */}
          <div className="flex justify-between items-start w-full">

            {/* Top-Left: Branding + Day */}
            <div className="flex flex-col gap-3 pointer-events-auto">
              <motion.div 
                className="relative bg-[#080810]/80 backdrop-blur-md rounded-md flex items-center justify-center px-6 py-3 min-w-[240px] overflow-hidden"
                animate={{
                  boxShadow: [
                    "0 0 10px rgba(0,229,255,0.1), inset 0 0 10px rgba(0,229,255,0.1)",
                    "0 0 20px rgba(0,229,255,0.3), inset 0 0 20px rgba(0,229,255,0.2)",
                    "0 0 10px rgba(0,229,255,0.1), inset 0 0 10px rgba(0,229,255,0.1)"
                  ],
                  border: [
                    "1px solid rgba(0,229,255,0.3)",
                    "1px solid rgba(0,229,255,0.7)",
                    "1px solid rgba(0,229,255,0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* ─── Tech UI Details ─── */}
                {/* Cyberpunk scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,229,255,0.4) 3px)' }} />
                
                {/* 4 Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-[2px] border-l-[2px] border-[#ff2d55] bg-transparent" style={{ boxShadow: '-2px -2px 5px rgba(255,45,85,0.5)' }} />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-[2px] border-r-[2px] border-[#ff2d55] bg-transparent" style={{ boxShadow: '2px -2px 5px rgba(255,45,85,0.5)' }} />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[2px] border-l-[2px] border-[#00e5ff] bg-transparent" style={{ boxShadow: '-2px 2px 5px rgba(0,229,255,0.5)' }} />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[2px] border-r-[2px] border-[#00e5ff] bg-transparent" style={{ boxShadow: '2px 2px 5px rgba(0,229,255,0.5)' }} />

                {/* Glitch lines left/right */}
                <motion.div className="absolute left-1 w-[2px] h-1/3 bg-[#00e5ff]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <motion.div className="absolute right-1 w-[2px] h-1/3 bg-[#ff2d55]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />

                <div className="flex items-center justify-center gap-0 text-3xl sm:text-[34px] pb-1 tracking-[0.15em] font-bold z-10 w-full relative">
                  <span
                    className="relative"
                    style={{
                      color: '#ff2d55',
                      textShadow: `
                        0 0 4px rgba(255,45,85,0.9),
                        0 0 10px rgba(255,45,85,0.7),
                        0 0 20px rgba(255,45,85,0.4)
                      `,
                      WebkitTextStroke: '0.5px rgba(255,45,85,0.3)',
                      imageRendering: 'pixelated',
                    }}
                  >
                    SB
                  </span>
                  <span
                    className="relative mx-0"
                    style={{
                      color: '#c026d3',
                      textShadow: `
                        0 0 4px rgba(192,38,211,0.9),
                        0 0 10px rgba(192,38,211,0.7),
                        0 0 20px rgba(192,38,211,0.4)
                      `,
                      imageRendering: 'pixelated',
                    }}
                  >
                    -
                  </span>
                  <span
                    className="relative"
                    style={{
                      color: '#00e5ff',
                      textShadow: `
                        0 0 4px rgba(0,229,255,0.9),
                        0 0 10px rgba(0,229,255,0.6),
                        0 0 20px rgba(0,229,255,0.3)
                      `,
                      WebkitTextStroke: '0px transparent',
                      imageRendering: 'pixelated',
                    }}
                  >
                    GARAGE
                  </span>
                </div>
              </motion.div>
              <div className="text-white text-3xl sm:text-[34px] drop-shadow-[3px_3px_0_#111] font-bold tracking-wider ml-1">
                NGÀY {currentDay}/50
              </div>
            </div>

            {/* Top-Right: Clock / Gold / Prestige */}
            <div className="flex flex-col gap-3 items-end w-[280px] pointer-events-auto">

              {/* Clock */}
              <motion.div 
                className="relative flex items-center justify-between gap-3 bg-[#080810]/80 backdrop-blur-md rounded-md p-[10px] w-full overflow-hidden border border-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.05),inset_0_0_10px_rgba(0,229,255,0.05)] cursor-default group" 
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,229,255,0.3), inset 0 0 15px rgba(0,229,255,0.2)" }}
              >
                {/* Tech Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00e5ff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                
                {/* Animated Edge Line */}
                <motion.div className="absolute top-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent w-full pointer-events-none" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />

                {/* Tech UI Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-[2px] border-l-[2px] border-[#00e5ff] bg-transparent opacity-70 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[2px] border-r-[2px] border-[#00e5ff] bg-transparent opacity-70 pointer-events-none" />

                <div className="flex items-center gap-3 z-10 w-full">
                  <div className="relative bg-[#12141c] border border-[#00e5ff]/50 shadow-[0_0_8px_rgba(0,229,255,0.3)] p-[6px] rounded-sm flex items-center justify-center group-hover:bg-[#00e5ff]/10 transition-colors">
                    <ClockIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#00e5ff]" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                  </div>

                  <div className="flex flex-col items-start leading-none mt-1 justify-center h-full">
                    <span className="text-[#e2e8f0] text-xl sm:text-[24px] drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-widest" style={{ imageRendering: 'pixelated' }}>
                      {timeStr}
                    </span>
                  </div>
                </div>

                {/* Decorative bars */}
                <div className="flex flex-col gap-1 items-end z-10 w-8">
                  <div className="h-[2px] w-full bg-[#00e5ff]/40 rounded-full" />
                  <div className="h-[2px] w-2/3 bg-[#00e5ff]/40 rounded-full" />
                  <div className="h-[2px] w-[90%] bg-[#00e5ff]/80 rounded-full animate-pulse" />
                </div>
              </motion.div>

              {/* Gold */}
              <motion.div 
                className="relative flex items-center justify-between gap-3 bg-[#080810]/80 backdrop-blur-md rounded-md p-[10px] w-full overflow-hidden border border-[#fca100]/30 shadow-[0_0_15px_rgba(252,161,0,0.05),inset_0_0_10px_rgba(252,161,0,0.05)] cursor-default group" 
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(252,161,0,0.3), inset 0 0 15px rgba(252,161,0,0.2)" }}
              >
                {/* Tech Background Pattern */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: 'linear-gradient(45deg, transparent 25%, #fca100 25%, #fca100 50%, transparent 50%, transparent 75%, #fca100 75%, #fca100 100%)', backgroundSize: '8px 8px' }} />

                {/* Animated Edge Line */}
                <motion.div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#fca100] to-transparent w-full pointer-events-none" animate={{ x: ['100%', '-100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />

                {/* Tech UI Corners */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t-[2px] border-r-[2px] border-[#fca100] bg-transparent opacity-70 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[2px] border-l-[2px] border-[#fca100] bg-transparent opacity-70 pointer-events-none" />

                <div className="flex items-center gap-3 z-10 w-full mt-1">
                  <div className="relative bg-[#12141c] border border-[#fca100]/50 shadow-[0_0_8px_rgba(252,161,0,0.3)] p-[6px] rounded-sm flex items-center justify-center group-hover:bg-[#fca100]/10 transition-colors">
                    <CoinIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                    <motion.div className="absolute inset-0 bg-yellow-400/20" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  </div>

                  <div className="flex flex-col items-start leading-none flex-grow justify-center h-full">
                     <span className="text-[#fca100] text-xl sm:text-[24px] drop-shadow-[0_0_8px_rgba(252,161,0,0.6)] tracking-wider" style={{ imageRendering: 'pixelated' }}>
                       {gold.toLocaleString()} G
                     </span>
                  </div>
                </div>
              </motion.div>

              {/* Prestige bar */}
              <motion.div 
                className={`relative bg-[#080810]/80 backdrop-blur-md rounded-md p-3 w-full flex flex-col gap-2 overflow-hidden border cursor-default group ${
                  isBurning
                    ? 'border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.6),inset_0_0_15px_rgba(239,68,68,0.4)]'
                    : 'border-[#a855f7]/30 shadow-[0_0_15px_rgba(168,85,247,0.05),inset_0_0_10px_rgba(168,85,247,0.05)]'
                }`}
                animate={isBurning ? { x: [-3, 3, -3, 3, -2, 2, 0], backgroundColor: ['rgba(8,8,16,0.8)', 'rgba(60,10,10,0.9)', 'rgba(8,8,16,0.8)'] } : {}}
                transition={{ duration: 0.5, repeat: isBurning ? Infinity : 0 }}
                whileHover={{ scale: 1.02, boxShadow: isBurning ? "0 0 30px rgba(239,68,68,0.9), inset 0 0 20px rgba(239,68,68,0.7)" : "0 0 20px rgba(168,85,247,0.3), inset 0 0 15px rgba(168,85,247,0.2)" }}
              >
                {/* Tech Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: isBurning ? 'linear-gradient(#ef4444 1px, transparent 1px), linear-gradient(90deg, #ef4444 1px, transparent 1px)' : 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                {/* Animated Edge Line */}
                <motion.div className="absolute top-0 right-0 w-[1px] h-full pointer-events-none" 
                  style={{ backgroundImage: isBurning ? 'linear-gradient(to bottom, transparent, #ef4444, transparent)' : 'linear-gradient(to bottom, transparent, #a855f7, transparent)' }}
                  animate={{ y: ['-100%', '100%'] }} transition={{ duration: isBurning ? 0.3 : 2, repeat: Infinity, ease: 'linear' }} />

                {/* Tech UI Corners */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-[2px] border-l-[2px] bg-transparent opacity-70 pointer-events-none ${isBurning ? 'border-[#ef4444]' : 'border-[#a855f7]'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-[2px] border-r-[2px] bg-transparent opacity-70 pointer-events-none ${isBurning ? 'border-[#ef4444]' : 'border-[#a855f7]'}`} />

                <div className="flex justify-between items-end w-full z-10 mb-1">
                  <div className="flex flex-col leading-none gap-1 justify-end h-full">
                    <span className={`text-lg lg:text-xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-widest ${isBurning ? 'text-[#fca5a5] animate-pulse' : 'text-[#d8b4fe]'}`} style={{ imageRendering: 'pixelated' }}>UY TÍN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-[2px]">
                       <motion.div className="w-1 h-3 bg-[#a855f7]/40 transform skew-x-[-20deg]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                       <motion.div className="w-1 h-3 bg-[#a855f7]/70 transform skew-x-[-20deg]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                       <motion.div className="w-1 h-3 bg-[#c026d3] transform skew-x-[-20deg]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                    <span className="text-white text-lg lg:text-xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-widest" style={{ imageRendering: 'pixelated' }}>LV <span className="text-[#ff79c6]">{currentLevel}</span></span>
                  </div>
                </div>
                
                <Progress.Root className={`relative w-full h-5 bg-[#0f111a] border rounded-sm overflow-hidden shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] z-10 p-[2px] ${isBurning ? 'border-[#ef4444]/60' : 'border-[#a855f7]/40'}`} value={prestigePoints}>
                  {/* Neon Glow beneath indicator */}
                  <div className={`absolute top-0 left-0 h-full blur-md opacity-60 pointer-events-none ${isBurning ? 'bg-[#ef4444]' : 'bg-[#c026d3]'}`} style={{ width: `${(prestigePoints / maxPrestige) * 100}%` }} />
                  
                  <Progress.Indicator
                    className="relative h-full transition-all duration-500 ease-in-out border-r-[2px] border-white rounded-[1px] overflow-hidden"
                    style={{ 
                      width: `${(prestigePoints / maxPrestige) * 100}%`,
                      background: isBurning 
                        ? 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)'
                        : 'linear-gradient(90deg, rgba(168,85,247,0.8) 0%, rgba(217,70,239,1) 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                    }}
                  >
                     {/* Moving glint on the progress bar */}
                     <motion.div className="absolute top-0 bottom-0 left-0 w-full overflow-hidden">
                        <motion.div className="w-[30px] h-full bg-white/30 transform skew-x-[-30deg]" animate={{ x: ['-200px', '400px'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                     </motion.div>
                  </Progress.Indicator>
                  
                  {/* Scanline overlay for the bar */}
                  <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.4) 4px, rgba(0,0,0,0.4) 8px)' }} />

                  <span className="absolute inset-0 flex items-center justify-center text-white/90 text-[13px] drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-10 pointer-events-none tracking-widest" style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.8)', imageRendering: 'pixelated' }}>
                    {prestigePoints} / {maxPrestige}
                  </span>
                </Progress.Root>
              </motion.div>

            </div>
          </div>
        </div>
        {/* end HUD TOP overlay */}

        {/* HUD BOTTOM overlay (z-index 30 — BELOW NPC portrait at z-101, so buttons hide behind NPC) */}
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-end z-[30]">

          {/* ═══ BOTTOM ROW ═══ */}
          <div className="flex justify-between items-end w-full">

            {/* Bottom-Left: Inventory */}
            <motion.button
              className="pointer-events-auto active:translate-y-1 active:shadow-none transition-all group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDeckOpen(true)}
            >
              <div className="relative flex items-center justify-center w-[200px] sm:w-[240px]">
                <Image 
                  src="/deckbutton.png" 
                  alt="Deck Button" 
                  width={240}
                  height={100}
                  className="w-full h-auto object-contain drop-shadow-[0_6px_0_rgba(0,0,0,0.8)] group-hover:brightness-110 group-hover:-translate-y-1 transition-all duration-300"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute -inset-2 bg-yellow-500/0 group-hover:bg-yellow-500/10 blur-xl rounded-full transition-all duration-300 pointer-events-none" />
              </div>
            </motion.button>

            {/* Bottom-Right: End Day */}
            <motion.button
              className={`bg-[#1e1e21] rounded-[12px] shadow-[0_5px_0_rgba(0,0,0,0.8)] pointer-events-auto transition-all group min-w-[200px] sm:min-w-[240px] ${true ? "active:translate-y-1 active:shadow-none cursor-pointer" : "cursor-not-allowed opacity-80"}`}
              whileHover={true ? { y: -2 } : {}}
              whileTap={true ? { scale: 0.95 } : {}}
              // TODO: Change 'true' to condition determining if all tasks are done (e.g. quests.length === 0)
            >
              <div className="rounded-md w-full h-full transition-colors relative flex items-center justify-center">
                  {/* Using true for placeholder. Replace true with actual boolean state for canEndDay */}
                  <img 
                    src={true ? "/enddaybutton.jpg" : "/endaybuttongrayout.jpg"} 
                    alt="End Day Button" 
                    className="w-[200px] sm:w-[240px] object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all duration-300 rounded-[12px]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {/* Glow effect when active and hovered */}
                  <div className={`absolute -inset-2 bg-yellow-500/0 ${true ? "group-hover:bg-yellow-500/10 blur-xl" : ""} rounded-full transition-all duration-300 pointer-events-none`} />
              </div>
            </motion.button>

          </div>
        </div>
        {/* end HUD BOTTOM overlay */}
      </div>
      {/* end game container */}

      {/* Deck Overlay */}
      <DeckOverlay isOpen={isDeckOpen} onClose={() => setIsDeckOpen(false)} />
    </motion.div>
  );
}
