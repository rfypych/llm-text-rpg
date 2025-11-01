import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, Item } from '../types';

interface PlayerStatsProps {
  player: PlayerState;
}

const StatBar: React.FC<{ value: number; maxValue: number; color: string; label: string; icon: string; highlight: boolean }> = ({ value, maxValue, color, label, icon, highlight }) => (
  <div className={highlight ? 'animate-stat-flash rounded-lg' : ''}>
    <div className="flex justify-between items-center mb-1 text-sm text-slate-300">
        <div className="flex items-center gap-2">
            <span className="w-4 h-4 text-center">{icon}</span>
            <span>{label}</span>
        </div>
      <span className="font-mono">{value} / {maxValue}</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
    </div>
  </div>
);

export const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const equippedItems = player.inventory.filter((item: Item) => item.equipped);
  const totalAtk = player.atk + equippedItems.reduce((sum, item) => sum + (item.stats?.atk || 0), 0);
  const totalDef = player.def + equippedItems.reduce((sum, item) => sum + (item.stats?.def || 0), 0);
  
  const [highlightedStats, setHighlightedStats] = useState<Set<string>>(new Set());
  const prevPlayerRef = useRef<PlayerState>(player);

  useEffect(() => {
    const highlights = new Set<string>();
    const prev = prevPlayerRef.current;
    
    if (player.hp !== prev.hp) highlights.add('hp');
    if (player.mp !== prev.mp) highlights.add('mp');
    if (player.exp !== prev.exp) highlights.add('exp');
    if (player.gold !== prev.gold) highlights.add('gold');
    if (player.lvl !== prev.lvl) highlights.add('lvl');

    if (highlights.size > 0) {
        setHighlightedStats(highlights);
        const timer = setTimeout(() => {
            setHighlightedStats(new Set());
        }, 900); // Animation duration
        return () => clearTimeout(timer);
    }
    
    // Deep copy to prevent issues with mutable objects
    prevPlayerRef.current = JSON.parse(JSON.stringify(player));
  }, [player]);


  return (
    <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
      <h3 className={`text-xl font-bold font-serif text-amber-400 transition-colors duration-300 tracking-wider ${highlightedStats.has('lvl') ? 'animate-stat-flash rounded-lg' : ''}`}>{player.name} - LVL {player.lvl}</h3>
      <StatBar value={player.hp} maxValue={player.maxHp} color="bg-red-500" label="HP" icon="❤️" highlight={highlightedStats.has('hp')} />
      <StatBar value={player.mp} maxValue={player.maxMp} color="bg-blue-500" label="MP" icon="💧" highlight={highlightedStats.has('mp')} />
      <StatBar value={player.exp} maxValue={player.maxExp} color="bg-green-500" label="EXP" icon="⭐" highlight={highlightedStats.has('exp')} />
      
      <div className="grid grid-cols-2 gap-4 pt-2 text-center">
        <div className="bg-slate-700/50 p-2 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-sm font-bold">
                <span>⚔️</span> ATK
            </div>
            <p className="text-lg font-semibold font-mono">{totalAtk}</p>
        </div>
        <div className="bg-slate-700/50 p-2 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-sm font-bold">
                <span>🛡️</span> DEF
            </div>
            <p className="text-lg font-semibold font-mono">{totalDef}</p>
        </div>
      </div>

       <div className={`flex items-center justify-center gap-2 pt-2 bg-slate-700/50 p-2 rounded-lg ${highlightedStats.has('gold') ? 'animate-stat-flash' : ''}`}>
            <span className="text-xl">💰</span>
            <p className="text-lg font-semibold font-mono">{player.gold}</p>
        </div>
    </div>
  );
};