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
}

type Tab = 'stats' | 'inventory' | 'map' | 'quests';

export const Sidebar: React.FC<SidebarProps> = ({ player, world, quests }) => {
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
        return <QuestLog quests={quests} />;
      default:
        return null;
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-gray-800 h-full flex flex-col border-r-2 border-gray-700">
      <div className="flex border-b-2 border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors duration-200
              ${activeTab === tab.id ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </aside>
  );
};