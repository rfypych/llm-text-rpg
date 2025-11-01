import React from 'react';
import { Quest, QuestStatus } from '../types';
import { HighlightedText } from './NarrativeLog';

interface QuestLogProps {
  quests: Quest[];
  playerName: string;
}

export const QuestLog: React.FC<QuestLogProps> = ({ quests, playerName }) => {
  const activeQuests = quests.filter(q => q.status === QuestStatus.ACTIVE);
  const completedQuests = quests.filter(q => q.status === QuestStatus.COMPLETED);
  const failedQuests = quests.filter(q => q.status === QuestStatus.FAILED);

  return (
    <div className="p-4">
      <h3 className="font-bold font-serif text-lg text-amber-400 mb-4 tracking-wider">Quest Aktif</h3>
      {activeQuests.length > 0 ? (
        <ul className="space-y-4">
          {activeQuests.map(quest => (
            <li key={quest.id} className="bg-slate-700/50 p-3 rounded-lg">
              <h4 className="font-semibold text-amber-500">{quest.title}</h4>
              <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                <HighlightedText text={quest.description} playerName={playerName} />
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400 italic">Tidak ada quest aktif.</p>
      )}

      {completedQuests.length > 0 && (
        <>
            <h3 className="font-bold font-serif text-lg text-amber-400 mt-6 mb-4 tracking-wider">Quest Selesai</h3>
             <ul className="space-y-2">
                {completedQuests.map(quest => (
                    <li key={quest.id} className="text-slate-500 line-through">
                        {quest.title}
                    </li>
                ))}
             </ul>
        </>
      )}

      {failedQuests.length > 0 && (
        <>
            <h3 className="font-bold font-serif text-lg text-red-400 mt-6 mb-4 tracking-wider">Quest Gagal</h3>
             <ul className="space-y-2">
                {failedQuests.map(quest => (
                    <li key={quest.id} className="text-red-500/70 line-through">
                        {quest.title}
                    </li>
                ))}
             </ul>
        </>
      )}
    </div>
  );
};