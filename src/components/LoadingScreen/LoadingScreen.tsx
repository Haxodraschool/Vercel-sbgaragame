'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
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

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [text, setText] = useState(LOADING_TEXTS[0]);
  const [boltFallen, setBoltFallen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setBoltFallen(false);
      return;
    }

    const interval = setInterval(() => {
      setText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Khi loading xong → ốc rớt ra
  useEffect(() => {
    if (!isLoading) {
      setBoltFallen(true);
      const timeout = setTimeout(() => setBoltFallen(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.container}>
            {/* Cờ lê + Ốc vít */}
            <div className={styles.wrenchArea}>
              <div className={styles.wrench}>🔧</div>
              <div className={`${styles.bolt} ${boltFallen ? styles.boltFall : ''}`}>
                ⚙️
              </div>
            </div>

            {/* Loading text */}
            <motion.p
              className={styles.text}
              key={text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {text}
            </motion.p>

            {/* Progress dots */}
            <div className={styles.dots}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={styles.dot}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.3,
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
