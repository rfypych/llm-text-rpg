import React from 'react';
import { PlayerState, Item } from '../types';

interface PlayerStatsProps {
  player: PlayerState;
}

const StatBar: React.FC<{ value: number; maxValue: number; color: string; label: string; icon: string }> = ({ value, maxValue, color, label, icon }) => (
  <div>
    <div className="flex justify-between items-center mb-1 text-sm">
        <div className="flex items-center gap-1">
            <span className="w-4 h-4 text-center">{icon}</span>
            <span>{label}</span>
        </div>
      <span>{value} / {maxValue}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
    </div>
  </div>
);

export const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const equippedItems = player.inventory.filter((item: Item) => item.equipped);
  const totalAtk = player.atk + equippedItems.reduce((sum, item) => sum + (item.stats?.atk || 0), 0);
  const totalDef = player.def + equippedItems.reduce((sum, item) => sum + (item.stats?.def || 0), 0);

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg space-y-4">
      <h3 className="text-xl font-bold text-yellow-400">{player.name} - LVL {player.lvl}</h3>
      <StatBar value={player.hp} maxValue={player.maxHp} color="bg-red-500" label="HP" icon="❤️" />
      <StatBar value={player.mp} maxValue={player.maxMp} color="bg-blue-500" label="MP" icon="💧" />
      <StatBar value={player.exp} maxValue={player.maxExp} color="bg-green-500" label="EXP" icon="⭐" />
      
      <div className="grid grid-cols-2 gap-4 pt-2 text-center">
        <div className="bg-gray-700/50 p-2 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                <span>⚔️</span> ATK
            </div>
            <p className="text-lg font-semibold">{totalAtk}</p>
        </div>
        <div className="bg-gray-700/50 p-2 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                <span>🛡️</span> DEF
            </div>
            <p className="text-lg font-semibold">{totalDef}</p>
        </div>
      </div>

       <div className="flex items-center justify-center gap-2 pt-2 bg-gray-700/50 p-2 rounded-lg">
            <span className="text-xl">💰</span>
            <p className="text-lg font-semibold">{player.gold}</p>
        </div>
    </div>
  );
};