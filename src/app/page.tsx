'use client';

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { LoadingScreen, LoginScreen, LobbyScreen, ShopScreen, WorkshopScreen, DevTool, EventScreen } from "@/components";

export default function Home() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const isTransitioning = useGameStore((state) => state.isTransitioning);
  const initializeStore = useGameStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {currentScreen === 'login' && <LoginScreen />}

      {currentScreen === 'lobby' && <LobbyScreen />}

      {currentScreen === 'shop' && <ShopScreen />}

      {currentScreen === 'workshop' && <WorkshopScreen />}

      {currentScreen === 'event' && <EventScreen />}

      {/* Global transition loading overlay — destination screens call markScreenReady()
          when all their resources are fully loaded. Until then, this overlay covers
          the destination entirely. */}
      <LoadingScreen isLoading={isTransitioning} />

      {/* Dev / Cheat Tool (renders its own visibility checking) */}
      <DevTool />
    </main>
  );
}
