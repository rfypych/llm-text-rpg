import React, { useEffect, useRef } from 'react';
import { Enemy } from '../types';

interface NarrativeLogProps {
  log: (string | { type: 'narration', content: string } | { type: 'player', content: string } | { type: 'combat', content: string })[];
  enemies: Enemy[];
  playerName: string;
  logAnimStartIndex: number;
}

const EnemyStatus: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
    const hpPercentage = (enemy.hp / enemy.maxHp) * 100;

    return (
        <div className="bg-red-900/50 border border-red-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-red-400">{enemy.name}</h4>
                <span className="text-sm text-gray-300">{enemy.hp} / {enemy.maxHp} HP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${hpPercentage}%` }}></div>
            </div>
        </div>
    )
}

// Component to parse and render highlighted text
export const HighlightedText: React.FC<{ text: string; playerName?: string }> = ({ text, playerName }) => {
    if (typeof text !== 'string' || !text) {
        return null;
    }
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]|_.*?_)/g);
    
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={index} className="highlight-location">{part.slice(2, -2)}</span>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <span key={index} className="highlight-character">{part.slice(1, -1)}</span>;
                }
                if (part.startsWith('[') && part.endsWith(']')) {
                    return <span key={index} className="highlight-item">{part.slice(1, -1)}</span>;
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                    return <span key={index} className="highlight-action">{part.slice(1, -1)}</span>;
                }
                
                // If it's a plain text part, check for the player's name
                if (playerName && playerName.trim().length > 0 && part.toLowerCase().includes(playerName.toLowerCase())) {
                    const escapedPlayerName = playerName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const nameRegex = new RegExp(`(\\b${escapedPlayerName}\\b)`, 'gi');
                    
                    if (nameRegex.test(part)) {
                        const subParts = part.split(nameRegex);
                        return (
                            <React.Fragment key={index}>
                                {subParts.map((subPart, subIndex) => 
                                    subPart.toLowerCase() === playerName.toLowerCase()
                                        ? <span key={subIndex} className="highlight-character">{subPart}</span>
                                        : subPart
                                )}
                            </React.Fragment>
                        );
                    }
                }

                return part;
            })}
        </>
    );
};

export const NarrativeLog: React.FC<NarrativeLogProps> = ({ log, enemies, playerName, logAnimStartIndex }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="p-4 space-y-4 h-full">
        {enemies.length > 0 && (
            <div className="p-4 border-2 border-red-600 bg-gray-800/50 rounded-lg">
                <h3 className="text-xl font-bold text-red-500 mb-3 text-center animate-pulse">!!! PERTEMPURAN !!!</h3>
                <div className="space-y-3">
                    {enemies.map(enemy => <EnemyStatus key={enemy.id} enemy={enemy} />)}
                </div>
            </div>
        )}
      <div className="space-y-4 text-gray-300">
        {log.map((entry, index) => {
          const animationClass = index >= logAnimStartIndex ? 'animate-fade-in-entry' : '';

          if (typeof entry === 'string') {
            return (
              <p key={index} className={`text-sm italic text-yellow-300 pl-4 border-l-2 border-yellow-500/50 ${animationClass}`}>
                {entry}
              </p>
            );
          }
          if (entry.type === 'player') {
            return (
              <div key={index} className={`flex justify-end ${animationClass}`}>
                <p className="bg-blue-800/70 text-gray-200 rounded-lg rounded-br-none py-2 px-4 max-w-lg italic shadow">
                    &gt; {entry.content}
                </p>
              </div>
            );
          }
          if (entry.type === 'narration') {
            return (
              <p key={index} className={`text-base leading-relaxed whitespace-pre-wrap ${animationClass}`}>
                <HighlightedText text={entry.content} playerName={playerName} />
              </p>
            );
          }
          if (entry.type === 'combat') {
            return (
              <p key={index} className={`text-center font-bold text-red-400 py-2 my-2 border-y-2 border-red-700/50 bg-red-900/20 ${animationClass}`}>
                ⚔️ {entry.content} ⚔️
              </p>
            );
          }
          return null;
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};