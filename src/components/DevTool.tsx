import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { apiCall } from '@/lib/api';

const DevTool = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [goldInput, setGoldInput] = useState('');
  const [dayInput, setDayInput] = useState('');
  const [prestigeInput, setPrestigeInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [guestInput, setGuestInput] = useState('');
  const [loading, setLoading] = useState(false);

  const user = useGameStore((state) => state.user);
  const setUser = useGameStore((state) => state.setUser);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const setScreen = useGameStore((state) => state.setScreen);

  // Keyboard shortcut (Ctrl + Shift + D) to toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if admin
  if (!user || typeof user.username !== 'string') return null;
  if (!user.username.toLowerCase().startsWith('admin')) return null;

  const handleAction = async (action: string, value: any) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await apiCall<{ user?: any }>('/dev/cheat', { 
        method: 'POST', 
        body: JSON.stringify({ action, value }) 
      });
      if (response && response.user) {
        setUser(response.user);
        alert(`Cheat applied: ${action}`);
      }
    } catch (err: any) {
      alert(`Error applying cheat: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full cursor-pointer z-50 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs shadow-lg border border-red-800"
        title="Open Dev Tools"
        style={{ width: '40px', height: '40px', zIndex: 9999 }}
      >
        DEV
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border-2 border-red-500 rounded p-4 text-white z-50 shadow-2xl w-80 font-mono text-sm" style={{ zIndex: 9999 }}>
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
        <h3 className="font-bold text-red-400">DEV / CHEAT TOOL</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {loading && <div className="text-yellow-400 mb-2 truncate text-xs">Processing...</div>}

      {/* Gold Section */}
      <div className="mb-4">
        <label className="block text-xs mb-1 text-gray-400">Add/Subtract Gold</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={goldInput} 
            onChange={(e) => setGoldInput(e.target.value)} 
            placeholder="e.g. 1000 or -500" 
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full outline-none focus:border-red-500"
          />
          <button 
            onClick={() => handleAction('ADD_GOLD', Number(goldInput))} 
            className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
          >
            Apply
          </button>
        </div>
        <div className="flex gap-2 mt-2">
            <button onClick={() => handleAction('ADD_GOLD', 1000)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">+1k</button>
            <button onClick={() => handleAction('ADD_GOLD', 10000)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">+10k</button>
        </div>
      </div>

      {/* Prestige Section */}
      <div className="mb-4">
        <label className="block text-xs mb-1 text-gray-400">Add/Subtract Prestige (Garage Health)</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={prestigeInput} 
            onChange={(e) => setPrestigeInput(e.target.value)} 
            placeholder="e.g. 10 or -10" 
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full outline-none focus:border-red-500"
          />
          <button 
            onClick={() => handleAction('ADD_PRESTIGE', Number(prestigeInput))} 
            className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
          >
            Apply
          </button>
        </div>
        <div className="flex gap-2 mt-2">
            <button onClick={() => handleAction('ADD_PRESTIGE', 10)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">+10</button>
            <button onClick={() => handleAction('ADD_PRESTIGE', 100)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">Max(100)</button>
        </div>
      </div>

      {/* Level Section */}
      <div className="mb-4">
        <label className="block text-xs mb-1 text-gray-400">Add/Subtract Level</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={levelInput} 
            onChange={(e) => setLevelInput(e.target.value)} 
            placeholder="e.g. 1 or -1" 
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full outline-none focus:border-red-500"
          />
          <button 
            onClick={() => handleAction('ADD_LEVEL', Number(levelInput))} 
            className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
          >
            Apply
          </button>
        </div>
        <div className="flex gap-2 mt-2">
            <button onClick={() => handleAction('ADD_LEVEL', 1)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">+1 Level</button>
            <button onClick={() => handleAction('ADD_LEVEL', 5)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">+5 Levels</button>
        </div>
      </div>

      {/* Day Section */}
      <div className="mb-4">
        <label className="block text-xs mb-1 text-gray-400">Set Current Day (Clears quests)</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={dayInput} 
            onChange={(e) => setDayInput(e.target.value)} 
            placeholder="Day #" 
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full outline-none focus:border-red-500"
          />
          <button 
            onClick={() => handleAction('SET_DAY', Number(dayInput))} 
            className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
          >
            Set
          </button>
        </div>
      </div>

      {/* Guests Section */}
      <div className="mb-2">
        <label className="block text-xs mb-1 text-gray-400">Quest/Guests Actions</label>
        <div className="flex gap-2 mb-2">
          <input 
            type="number" 
            value={guestInput} 
            onChange={(e) => setGuestInput(e.target.value)} 
            placeholder="Number of Guests" 
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full outline-none focus:border-red-500"
          />
          <button 
            onClick={() => handleAction('GENERATE_QUESTS', Number(guestInput))} 
            className="bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded whitespace-nowrap"
          >
            Add Guests
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => handleAction('SUMMON_BOSS', null)} 
            className="bg-purple-800 hover:bg-purple-700 px-2 py-1 rounded text-xs w-full font-bold"
          >
            🎯 SUMMON RANDOM BOSS
          </button>
          <button 
            onClick={() => handleAction('CLEAR_QUESTS', null)} 
            className="bg-orange-800 hover:bg-orange-700 px-2 py-1 rounded text-xs w-full"
          >
            Clear All Custom/Pending Quests
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">If quests look bugged, reload page after clearing.</p>
      </div>

      {/* Screen Switcher */}
      <div className="mb-2 border-t border-gray-700 pt-3 mt-3">
        <label className="block text-xs mb-2 text-gray-400">Switch Screen <span className="text-yellow-400">[{currentScreen}]</span></label>
        <div className="grid grid-cols-3 gap-1">
          {(['login', 'lobby', 'shop', 'workshop', 'testrun', 'event', 'endday', 'ending'] as const).map((screen) => (
            <button
              key={screen}
              onClick={() => setScreen(screen)}
              className={`text-[10px] px-1 py-1 rounded font-bold uppercase ${
                currentScreen === screen
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {screen}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DevTool;
