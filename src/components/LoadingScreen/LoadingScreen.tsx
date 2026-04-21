'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  isLoading: boolean;
}

const TEXTS = [
  'Đang xiết bu-lông...',
  'Đang kiểm tra dầu máy...',
  'Đang siết ốc cuối cùng...',
  'Đang đánh lửa bugi...',
  'Đang căn chỉnh piston...',
  'Kiểm tra áp suất lốp...',
  'Đang lắp ống xả...',
  'Đổ xăng vào bình...',
];

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [show, setShow] = useState(isLoading);
  const [textIndex, setTextIndex] = useState(0);
  const [exitPhase, setExitPhase] = useState(false);

  const markScreenReady = useGameStore((s) => s.markScreenReady);
  const loadingTotal = useGameStore((s) => s.loadingTotal);
  const loadingPending = useGameStore((s) => s.loadingPending);
  const loadingLabel = useGameStore((s) => s.loadingLabel);

  const completed = Math.max(0, loadingTotal - loadingPending.length);
  const progress = loadingTotal > 0 ? Math.round((completed / loadingTotal) * 100) : 0;

  // Force hide sau 10s dù có gì xảy ra
  const forceHide = useCallback(() => {
    setExitPhase(true);
    setTimeout(() => {
      setShow(false);
      setExitPhase(false);
      markScreenReady();
    }, 800);
  }, [markScreenReady]);

  // Khi isLoading = true -> show
  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setExitPhase(false);
    }
  }, [isLoading]);

  // Khi isLoading = false -> bắt đầu exit animation
  useEffect(() => {
    if (!isLoading && show && !exitPhase) {
      forceHide();
    }
  }, [isLoading, show, exitPhase, forceHide]);

  // Safety timeout: ép tắt sau 10s
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      if (show) {
        forceHide();
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [show, forceHide]);

  // Đổi text mỗi 1.5s
  useEffect(() => {
    if (!show || exitPhase) return;
    const t = setInterval(() => {
      setTextIndex((i) => (i + 1) % TEXTS.length);
    }, 1500);
    return () => clearInterval(t);
  }, [show, exitPhase]);

  if (!show) return null;

  const displayText = loadingLabel || TEXTS[textIndex];

  return (
    <div className={`${styles.overlay} ${exitPhase ? styles.fadeOut : ''}`}>
      <div className={styles.scanlines} />

      <div className={styles.box}>
        {/* Cờ lê + Ốc vít */}
        <div className={styles.gearBox}>
          <svg className={styles.wrench} viewBox="0 0 64 64" width={120} height={120}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b7c3d0" />
                <stop offset="45%" stopColor="#e3e9ef" />
                <stop offset="100%" stopColor="#6d7986" />
              </linearGradient>
            </defs>
            <path
              d="M42 8 a10 10 0 0 0 -8 17 L10 49 a4 4 0 0 0 0 5 l0 0 a4 4 0 0 0 5 0 L39 30 a10 10 0 0 0 15 -12 l-7 7 -6 -6 7 -7 A10 10 0 0 0 42 8 z"
              fill="url(#wg)"
              stroke="#222a33"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M12 52 l22 -22" stroke="#ffffff55" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>

          <svg className={`${styles.bolt} ${exitPhase ? styles.drop : ''}`} viewBox="0 0 32 32" width={40} height={40}>
            <defs>
              <radialGradient id="bg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#d8dee5" />
                <stop offset="70%" stopColor="#7a838f" />
                <stop offset="100%" stopColor="#363c44" />
              </radialGradient>
            </defs>
            <polygon points="16,3 28,10 28,22 16,29 4,22 4,10" fill="url(#bg)" stroke="#10151b" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="16,9 23,13 23,19 16,23 9,19 9,13" fill="#1a1f26" stroke="#0a0d11" strokeWidth="0.8" />
            <path d="M12 16 h8 M16 12 v8" stroke="#4a525c" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        <div className={styles.title}>SB-GARA</div>
        <div className={styles.text}>{displayText}</div>

        {loadingTotal > 0 ? (
          <div className={styles.progressBox}>
            <div className={styles.track}>
              <div className={styles.bar} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.percent}>{progress}%</div>
          </div>
        ) : (
          <div className={styles.dots}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}
