'use client';

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useTutorialStore } from "@/stores/useTutorialStore";
import { LoadingScreen, LoginScreen, LobbyScreen, ShopScreen, WorkshopScreen, DevTool, EventScreen, EndingScreen, StarterPerkSelection, TutorialOverlay } from "@/components";

export default function Home() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const isTransitioning = useGameStore((state) => state.isTransitioning);
  const initializeStore = useGameStore((state) => state.initializeStore);
  const checkTutorialCompletion = useTutorialStore((state) => state.checkCompletion);

  useEffect(() => {
    initializeStore();
    checkTutorialCompletion();
  }, [initializeStore, checkTutorialCompletion]);

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {currentScreen === 'login' && <LoginScreen />}

      {currentScreen === 'perkSelection' && <StarterPerkSelection />}

      {currentScreen === 'lobby' && <LobbyScreen />}

      {currentScreen === 'shop' && <ShopScreen />}

      {currentScreen === 'workshop' && <WorkshopScreen />}

      {currentScreen === 'event' && <EventScreen />}

      {currentScreen === 'ending' && <EndingScreen />}

      {/* Global transition loading overlay — destination screens call markScreenReady()
          when all their resources are fully loaded. Until then, this overlay covers
          the destination entirely. */}
      <LoadingScreen isLoading={isTransitioning} />

      {/* Tutorial overlay — renders nothing when inactive */}
      <TutorialOverlay />

      {/* Dev / Cheat Tool (renders its own visibility checking) */}
      <DevTool />
    </main>
  );
}
