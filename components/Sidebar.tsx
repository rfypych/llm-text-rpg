import React, { useState } from 'react';
import { PlayerState, WorldState, Quest } from '../types';
import { PlayerStats } from './PlayerStats';
import { Inventory } from './Inventory';
import { MapView } from './MapView';
import { QuestLog } from './QuestLog';

interface SidebarProps {
  player: PlayerState;
  world: WorldState;
  quests: Quest[];
  onSwitchService: () => void;
}

type Tab = 'stats' | 'inventory' | 'map' | 'quests';

export const Sidebar: React.FC<SidebarProps> = ({ player, world, quests, onSwitchService }) => {
  const [activeTab, setActiveTab] = useState<Tab>('map');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'quests', label: 'Quests', icon: '📜' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <PlayerStats player={player} />;
      case 'inventory':
        return <Inventory player={player} />;
      case 'map':
        return <MapView world={world} />;
      case 'quests':
        return <QuestLog quests={quests} playerName={player.name} />;
      default:
        return null;
    }
  };

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-slate-800 h-full flex flex-col border-r-2 border-slate-700">
      <div className="flex border-b-2 border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors duration-200 relative
              ${activeTab === tab.id ? 'text-amber-400' : 'text-slate-400 hover:bg-slate-700/50'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400"></div>}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
       <div className="p-4 border-t-2 border-slate-700">
        <button
          onClick={onSwitchService}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-md transition-colors duration-200 hover:bg-slate-600 hover:text-amber-400"
        >
          <span>⚙️</span>
          <span>Ganti Layanan AI</span>
        </button>
      </div>
    </aside>
  );
};