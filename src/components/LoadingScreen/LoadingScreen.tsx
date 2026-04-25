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
        {/* Ốc vít với hiệu ứng tóe lửa */}
        <div className={styles.gearBox}>
          <svg className={`${styles.bolt} ${exitPhase ? styles.drop : ''}`} viewBox="0 0 32 32" width={80} height={80}>
            <defs>
              <radialGradient id="bg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#d8dee5" />
                <stop offset="70%" stopColor="#7a838f" />
                <stop offset="100%" stopColor="#363c44" />
              </radialGradient>
              <filter id="spark">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
              </filter>
            </defs>
            <polygon points="16,3 28,10 28,22 16,29 4,22 4,10" fill="url(#bg)" stroke="#10151b" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="16,9 23,13 23,19 16,23 9,19 9,13" fill="#1a1f26" stroke="#0a0d11" strokeWidth="0.8" />
            <path d="M12 16 h8 M16 12 v8" stroke="#4a525c" strokeWidth="1.4" strokeLinecap="round" />
            
            {/* Welding sparks */}
            {!exitPhase && (
              <g className={styles.sparks}>
                <circle cx="16" cy="16" r="3" fill="#ff6b00" opacity="0.8">
                  <animate attributeName="r" values="2;5;2" dur="0.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="20" cy="12" r="1.5" fill="#ffcc00" opacity="0.6">
                  <animate attributeName="cx" values="20;18;20" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="12;14;12" dur="0.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="20" r="1" fill="#ff9900" opacity="0.5">
                  <animate attributeName="cx" values="12;14;12" dur="0.25s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="20;18;20" dur="0.25s" repeatCount="indefinite" />
                </circle>
                <circle cx="22" cy="18" r="0.8" fill="#ffff00" opacity="0.4">
                  <animate attributeName="cx" values="22;24;22" dur="0.15s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="18;16;18" dur="0.15s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
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
