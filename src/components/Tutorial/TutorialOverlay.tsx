'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { useGameStore } from '@/stores/useGameStore';
import { getStepConfig } from './tutorialSteps';
import styles from './TutorialOverlay.module.css';

// ─── Pixel-style arrow using "↑" character ───
function ArrowIcon({ direction }: { direction: 'top' | 'bottom' | 'left' | 'right' }) {
  const rotation = { top: 180, bottom: 0, left: 90, right: -90 }[direction];
  return (
    <span
      style={{
        fontFamily: "'VT323', monospace",
        fontSize: '40px',
        color: '#22d3ee',
        display: 'block',
        lineHeight: 1,
        transform: `rotate(${rotation}deg)`,
        textShadow: '0 0 8px rgba(34,211,238,0.6), 0 0 20px rgba(34,211,238,0.3)',
        imageRendering: 'pixelated' as any,
      }}
    >
      ↑
    </span>
  );
}

export default function TutorialOverlay() {
  const { isActive, currentStep, nextStep, skip, isCompleted } = useTutorialStore();
  const isTransitioning = useGameStore((s) => s.isTransitioning);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find target element and track its position
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    // Wait for screen transitions to finish
    if (isTransitioning) {
      setTargetRect(null);
      return;
    }

    const config = getStepConfig(currentStep);

    const setupTracking = (el: Element) => {
      const updateRect = () => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      };
      updateRect();
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
      const observer = new ResizeObserver(updateRect);
      observer.observe(el);
      return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
        observer.disconnect();
      };
    };

    let cleanup: (() => void) | null = null;
    let retries = 0;
    const maxRetries = 50; // 5 seconds max

    const tryFind = () => {
      const el = document.querySelector(config.targetSelector);
      if (el) {
        cleanup = setupTracking(el);
      } else if (retries < maxRetries) {
        retries++;
        retryRef.current = setTimeout(tryFind, 100);
      }
    };

    tryFind();

    return () => {
      if (cleanup) cleanup();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [isActive, currentStep, isTransitioning]);

  if (!isActive || isCompleted || !currentStep || !targetRect) return null;

  const config = getStepConfig(currentStep);
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  const r = config.spotlightRadius;

  // Arrow position (relative to spotlight center)
  const arrowGap = 12;
  let arrowX = cx;
  let arrowY = cy;
  let arrowBounceX = '0px';
  let arrowBounceY = '6px';

  switch (config.arrowPosition) {
    case 'top':
      arrowX = cx;
      arrowY = cy - r - arrowGap - 44;
      arrowBounceY = '-6px';
      break;
    case 'bottom':
      arrowX = cx;
      arrowY = cy + r + arrowGap;
      arrowBounceY = '6px';
      break;
    case 'left':
      arrowX = cx - r - arrowGap - 32;
      arrowY = cy;
      arrowBounceX = '-6px';
      arrowBounceY = '0px';
      break;
    case 'right':
      arrowX = cx + r + arrowGap;
      arrowY = cy;
      arrowBounceX = '6px';
      arrowBounceY = '0px';
      break;
  }

  // Tooltip position (relative to arrow)
  const tipGap = 10;
  let tipX = cx;
  let tipY = cy;
  let tipTransform = 'translate(-50%, 0)';

  switch (config.arrowPosition) {
    case 'top':
      tipX = cx;
      tipY = arrowY - tipGap;
      tipTransform = 'translate(-50%, -100%)';
      break;
    case 'bottom':
      tipX = cx;
      tipY = arrowY + 44 + tipGap;
      tipTransform = 'translate(-50%, 0)';
      break;
    case 'left':
      tipX = arrowX - tipGap;
      tipY = cy;
      tipTransform = 'translate(-100%, -50%)';
      break;
    case 'right':
      tipX = arrowX + 32 + tipGap;
      tipY = cy;
      tipTransform = 'translate(0, -50%)';
      break;
  }

  return (
    <div className={styles.overlay}>
      {/* ── Blur + dim overlay with transparent spotlight hole ── */}
      <div
        className={styles.blurOverlay}
        style={{
          maskImage: `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 100%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 100%, black 100%)`,
        }}
      />

      {/* ── Click blocker for workshop info steps ── */}
      {/* Blocks all clicks outside spotlight; clickAdvanceOverlay handles the click */}
      {!config.clickToAdvance && (
        <div className={styles.clickBlocker} />
      )}

      {/* ── Spotlight glow ring (visual) ── */}
      <div
        className={styles.spotlightGlow}
        style={{
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
        }}
      />

      {/* ── Click-anywhere-to-advance (workshop steps only) ── */}
      {!config.clickToAdvance && (
        <div
          className={styles.clickAdvanceOverlay}
          onClick={(e) => {
            e.stopPropagation();
            nextStep();
          }}
        />
      )}

      {/* ── Arrow ── */}
      <div
        className={styles.arrowContainer}
        style={{
          left: arrowX,
          top: arrowY,
          '--arrow-bounce-x': arrowBounceX,
          '--arrow-bounce-y': arrowBounceY,
        } as React.CSSProperties}
      >
        <ArrowIcon direction={config.arrowPosition} />
      </div>

      {/* ── Tooltip text ── */}
      {config.text && (
        <div
          className={styles.tooltip}
          style={{
            left: tipX,
            top: tipY,
            transform: tipTransform,
          }}
        >
          {config.text}
        </div>
      )}

      {/* ── Skip button (always on top) ── */}
      <button
        className={styles.skipBtn}
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        BỎ QUA ▶
      </button>
    </div>
  );
}
