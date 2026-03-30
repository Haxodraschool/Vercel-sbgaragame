'use client';

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { LoginScreen, LobbyScreen, DevTool } from "@/components";

export default function Home() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const user = useGameStore((state) => state.user);
  const logout = useGameStore((state) => state.logout);
  const initializeStore = useGameStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {currentScreen === 'login' && <LoginScreen />}
      
      {currentScreen === 'lobby' && <LobbyScreen />}

      {/* Dev / Cheat Tool (renders its own visibility checking) */}
      <DevTool />

      {/* Các màn hình khác sẽ gắn vào đây ở các công đoạn sau */}
    </main>
  );
}
