'use client';
import { useEffect, useRef } from 'react';
import LoginScene from './LoginScene';

interface PhaserGameProps {
  step: 'initial' | 'form';
  isOpening: boolean;
  hasError: boolean;
}

export default function PhaserGame({ step, isOpening, hasError }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const prevStep = useRef(step);
  const prevOpening = useRef(isOpening);
  const prevError = useRef(hasError);

  useEffect(() => {
    let isDestroyed = false;

    import('phaser').then((Phaser) => {
      // Nếu hook đã unmount trước lúc load xong lib thì không tạo game
      if (isDestroyed) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'phaser-container',
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#020205',
        pixelArt: true,
        scene: [LoginScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        }
      };
      
      gameRef.current = new Phaser.default.Game(config);
    });

    return () => {
      isDestroyed = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;
    
    // Đợi 100ms đảm bảo scene đã tạo xong (Phaser load async)
    const timer = setTimeout(() => {
        const scene = gameRef.current?.scene.getScene('LoginScene');
        if (!scene) return;
        
        if (step === 'form' && prevStep.current === 'initial') {
            scene.events.emit('door-light-on');
        }
        if (hasError && !prevError.current) {
            scene.events.emit('door-error');
        }
        if (isOpening && !prevOpening.current) {
            scene.events.emit('door-open');
        }

        prevStep.current = step;
        prevOpening.current = isOpening;
        prevError.current = hasError;
    }, 100);

    return () => clearTimeout(timer);
  }, [step, isOpening, hasError]);

  return <div id="phaser-container" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
}
