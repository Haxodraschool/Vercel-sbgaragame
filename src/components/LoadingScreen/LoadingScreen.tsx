'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import styles from './LoadingScreen.module.css';

const LOADING_TEXTS = [
  'Đang xiết bu-lông...',
  'Đang kiểm tra dầu máy...',
  'Đang siết ốc cuối cùng...',
  'Đang đánh lửa bugi...',
  'Đang căn chỉnh piston...',
  'Kiểm tra áp suất lốp...',
  'Đang lắp ống xả...',
  'Đổ xăng vào bình...',
];

interface LoadingScreenProps {
  isLoading: boolean;
}

/**
 * Synthesize a short "cạch" metallic click using the Web Audio API.
 * Dùng Web Audio để khỏi phụ thuộc file mp3 — tái tạo tiếng ốc vít rơi xuống nền kim loại.
 */
function playMetalClack() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const now = ctx.currentTime;

    // High-frequency "ping" (metallic resonance)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Short noise burst (initial impact)
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.value = 0.35;
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);

    setTimeout(() => ctx.close().catch(() => {}), 350);
  } catch {
    /* ignore — non-fatal if audio is blocked */
  }
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [text, setText] = useState(LOADING_TEXTS[0]);
  // Internal state: when isLoading flips false while the overlay is still visible,
  // we play the "bolt drop" exit animation BEFORE unmounting the overlay.
  const [visible, setVisible] = useState(isLoading);
  const [dropping, setDropping] = useState(false);
  const sfxPlayedRef = useRef(false);

  // ─── Mount overlay the moment isLoading becomes true ───
  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setDropping(false);
      sfxPlayedRef.current = false;
    }
  }, [isLoading]);

  // ─── Cycle random text while loading ───
  useEffect(() => {
    if (!visible || dropping) return;
    // Seed with a random one on mount
    setText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    const interval = setInterval(() => {
      setText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    }, 1600);
    return () => clearInterval(interval);
  }, [visible, dropping]);

  // ─── Load finished → trigger bolt-drop exit animation, then unmount ───
  useEffect(() => {
    if (!isLoading && visible && !dropping) {
      setDropping(true);
      // Delay SFX slightly so it coincides with the bolt reaching the bottom
      const sfxTimer = setTimeout(() => {
        if (!sfxPlayedRef.current) {
          sfxPlayedRef.current = true;
          playMetalClack();
        }
      }, 520);
      const hideTimer = setTimeout(() => setVisible(false), 900);
      return () => {
        clearTimeout(sfxTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isLoading, visible, dropping]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Subtle scanlines background */}
          <div className={styles.scanlines} aria-hidden />

          <div className={styles.container}>
            {/* Wrench + Bolt area */}
            <div className={styles.wrenchArea}>
              {/* Wrench — rotates counterclockwise */}
              <svg
                className={styles.wrench}
                viewBox="0 0 64 64"
                width={140}
                height={140}
                aria-hidden
              >
                <defs>
                  <linearGradient id="wrenchGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b7c3d0" />
                    <stop offset="45%" stopColor="#e3e9ef" />
                    <stop offset="100%" stopColor="#6d7986" />
                  </linearGradient>
                </defs>
                {/* Body */}
                <path
                  d="M42 8 a10 10 0 0 0 -8 17 L10 49 a4 4 0 0 0 0 5 l0 0 a4 4 0 0 0 5 0 L39 30 a10 10 0 0 0 15 -12 l-7 7 -6 -6 7 -7 A10 10 0 0 0 42 8 z"
                  fill="url(#wrenchGrad)"
                  stroke="#222a33"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Highlights */}
                <path
                  d="M12 52 l22 -22"
                  stroke="#ffffff55"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Bolt — sits at wrench jaw, counter-rotating as it "unscrews" */}
              <svg
                className={`${styles.bolt} ${dropping ? styles.boltFall : ''}`}
                viewBox="0 0 32 32"
                width={44}
                height={44}
                aria-hidden
              >
                <defs>
                  <radialGradient id="boltGrad" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#d8dee5" />
                    <stop offset="70%" stopColor="#7a838f" />
                    <stop offset="100%" stopColor="#363c44" />
                  </radialGradient>
                </defs>
                {/* Hex head */}
                <polygon
                  points="16,3 28,10 28,22 16,29 4,22 4,10"
                  fill="url(#boltGrad)"
                  stroke="#10151b"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                {/* Inner socket */}
                <polygon
                  points="16,9 23,13 23,19 16,23 9,19 9,13"
                  fill="#1a1f26"
                  stroke="#0a0d11"
                  strokeWidth="0.8"
                />
                {/* Cross slot */}
                <path
                  d="M12 16 h8 M16 12 v8"
                  stroke="#4a525c"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>

              {/* Spark burst when bolt drops */}
              {dropping && (
                <div className={styles.sparks} aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div className={styles.title}>SB-GARA</div>

            {/* Loading text */}
            <AnimatePresence mode="wait">
              <motion.p
                className={styles.text}
                key={text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                {text}
              </motion.p>
            </AnimatePresence>

            {/* Progress dots */}
            <div className={styles.dots}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={styles.dot}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
