import React, { useEffect, useRef } from 'react';
import { Enemy } from '../types';

interface NarrativeLogProps {
  log: (string | { type: 'narration', content: string })[];
  enemies: Enemy[];
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
export const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
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
                return part;
            })}
        </>
    );
};

export const NarrativeLog: React.FC<NarrativeLogProps> = ({ log, enemies }) => {
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
          if (typeof entry === 'string') {
            return (
              <p key={index} className="text-sm italic text-yellow-300 pl-4 border-l-2 border-yellow-500/50">
                {entry}
              </p>
            );
          }
          if (entry.type === 'narration') {
            return (
              <p key={index} className="text-base leading-relaxed whitespace-pre-wrap">
                <HighlightedText text={entry.content} />
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