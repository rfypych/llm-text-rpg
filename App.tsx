
import React, { useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { NarrativeLog, HighlightedText } from './components/NarrativeLog';
import { CommandInput } from './components/CommandInput';
import { GameState, GeminiResponse, ItemType, QuestStatus, Quest } from './types';
import { INITIAL_GAME_STATE, INITIAL_PLAYER_STATE, INITIAL_WORLD_STATE, INITIAL_QUESTS } from './constants';
import { getGameUpdate } from './services/aiService';
import { CharacterCreation } from './components/CharacterCreation';
import { getTileTypeForCoords } from './services/mapService';
import { Toast } from './components/Toast';
import { ServiceSelection } from './components/ServiceSelection';

type Action =
  | { type: 'START_GAME'; payload: { name: string } }
  | { type: 'START_LOADING' }
  | { type: 'PROCESS_RESPONSE'; payload: { response: GeminiResponse, command: string, set_toast: (toast: ToastInfo) => void } }
  | { type: 'LEVEL_UP' }
  | { type: 'CLEAR_QUEST_OFFER'};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME':
        return {
            ...state,
            player: {
                ...state.player,
                name: action.payload.name,
            },
            isLoading: true, // Start loading for the first command
        }
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'CLEAR_QUEST_OFFER':
      return { ...state, questOffer: null };
    case 'PROCESS_RESPONSE': {
      const { response, command, set_toast } = action.payload;
      let newState = { ...state };

      newState.history = [...state.history, { role: 'player', content: command }, { role: 'GM', content: response.narration }];
      
      const newLogEntries: (string | { type: 'narration', content: string })[] = [];
      newLogEntries.push({ type: 'narration', content: response.narration });
      if (response.logEntries) {
        newLogEntries.push(...response.logEntries);
      }
      newState.log = [...state.log, ...newLogEntries];

      if(response.questOffer) {
          newState.questOffer = response.questOffer;
      }

      if (response.playerUpdates) {
        if (response.playerUpdates.set) {
          Object.keys(response.playerUpdates.set).forEach(key => {
            if (key === 'coords' && response.playerUpdates!.set!.coords) {
                newState.world.location.coords = response.playerUpdates!.set!.coords;
                newState.world.location.type = getTileTypeForCoords(newState.world.location.coords.x, newState.world.location.coords.y);
            } else if (key === 'locationName' && response.playerUpdates!.set!.locationName) {
                newState.world.location.name = response.playerUpdates!.set!.locationName;
            } else {
                (newState.player as any)[key] = response.playerUpdates!.set![key];
            }
          });
        }
        if (response.playerUpdates.increment) {
          Object.keys(response.playerUpdates.increment).forEach(key => {
            (newState.player as any)[key] += response.playerUpdates!.increment![key];
          });
        }
      }

      if (response.inventoryUpdates) {
        let newInventory = [...newState.player.inventory];
        if (response.inventoryUpdates.add) {
            response.inventoryUpdates.add.forEach(itemToAdd => {
                const existingItem = newInventory.find(i => i.id === itemToAdd.id && i.type !== ItemType.EQUIPMENT);
                if (existingItem && existingItem.count) {
                    existingItem.count += (itemToAdd.count || 1);
                } else {
                    newInventory.push({ ...itemToAdd, count: itemToAdd.count || 1 });
                }
            });
        }
        if (response.inventoryUpdates.remove) {
          newInventory = newInventory.filter(item => !response.inventoryUpdates!.remove!.includes(item.id));
        }
        if (response.inventoryUpdates.update) {
            response.inventoryUpdates.update.forEach(update => {
                const item = newInventory.find(i => i.id === update.id);
                if (item) {
                    Object.assign(item, update.changes);
                }
            });
        }
        newState.player.inventory = newInventory;
      }

      if (response.enemyUpdates) {
          let newEnemies = [...newState.world.activeEnemies];
          if (response.enemyUpdates.remove) {
              newEnemies = newEnemies.filter(e => !response.enemyUpdates!.remove!.includes(e.id));
          }
           if (response.enemyUpdates.add) {
              newEnemies.push(...response.enemyUpdates.add);
           }
           if (response.enemyUpdates.update) {
               response.enemyUpdates.update.forEach(update => {
                   const enemy = newEnemies.find(e => e.id === update.id);
                   if (enemy && update.changes.hp !== undefined) {
                       enemy.hp = update.changes.hp;
                   }
               });
           }
           newState.world.activeEnemies = newEnemies;
      }

       if(response.questUpdates) {
          let newQuests = [...newState.quests];
          if(response.questUpdates.add) {
              response.questUpdates.add.forEach(q => {
                  if(!newQuests.find(existing => existing.id === q.id)) {
                    newQuests.push({...q, status: QuestStatus.ACTIVE});
                    set_toast({ message: `Quest Dimulai: ${q.title}`, type: 'info' });
                  }
              });
          }
          if(response.questUpdates.update) {
              response.questUpdates.update.forEach(update => {
                  const quest = newQuests.find(q => q.id === update.id);
                  if(quest && update.changes.status) {
                      quest.status = update.changes.status;
                      if(update.changes.status === QuestStatus.COMPLETED) {
                          set_toast({ message: `Quest Selesai: ${quest.title}`, type: 'success' });
                      } else if (update.changes.status === QuestStatus.FAILED) {
                          set_toast({ message: `Quest Gagal: ${quest.title}`, type: 'error' });
                      }
                  }
              });
          }
          newState.quests = newQuests;
      }

      newState.isLoading = false;
      return newState;
    }
    case 'LEVEL_UP': {
        const newMaxHp = state.player.maxHp + 20;
        const newMaxMp = state.player.maxMp + 10;
        return {
            ...state,
            player: {
                ...state.player,
                lvl: state.player.lvl + 1,
                exp: state.player.exp - state.player.maxExp,
                maxExp: Math.floor(state.player.maxExp * 1.5),
                maxHp: newMaxHp,
                maxMp: newMaxMp,
                hp: newMaxHp,
                mp: newMaxMp,
                atk: state.player.atk + 3,
                def: state.player.def + 2,
            },
            log: [...state.log, `DING! Anda telah mencapai Level ${state.player.lvl + 1}!`, "HP dan MP telah pulih sepenuhnya. Status meningkat!"]
        };
    }
    default:
      return state;
  }
};

interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'error';
}

const QuestOffer: React.FC<{ quest: Omit<Quest, 'status'>, onAccept: () => void, onReject: () => void }> = ({ quest, onAccept, onReject }) => {
    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-gray-800 border-2 border-yellow-500 rounded-lg shadow-2xl p-4 z-10 animate-fade-in-down">
            <h3 className="text-lg font-bold text-yellow-400 text-center">Tawaran Quest</h3>
            <div className="bg-gray-700/50 p-3 rounded-lg my-3">
                <h4 className="font-semibold text-yellow-500">{quest.title}</h4>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">
                    <HighlightedText text={quest.description} />
                </p>
            </div>
            <div className="flex justify-center gap-4 mt-4">
                <button onClick={onAccept} className="bg-green-600 text-white font-bold py-2 px-6 rounded-md transition-transform duration-200 hover:bg-green-500 hover:scale-105">
                    Terima
                </button>
                <button onClick={onReject} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md transition-transform duration-200 hover:bg-red-500 hover:scale-105">
                    Tolak
                </button>
            </div>
        </div>
    )
}

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, {
      ...INITIAL_GAME_STATE,
      player: INITIAL_PLAYER_STATE,
      world: INITIAL_WORLD_STATE,
      quests: INITIAL_QUESTS,
      history: [],
      log: []
  });

  const [toast, setToast] = useState<ToastInfo | null>(null);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  type GamePhase = 'SERVICE_SELECTION' | 'CREATION' | 'PLAYING';
  const [aiService, setAiService] = useState<'gemini' | 'ollama' | null>(() => localStorage.getItem('aiService') as 'gemini' | 'ollama' | null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>(aiService ? 'CREATION' : 'SERVICE_SELECTION');

  const handleServiceSelect = (service: 'gemini' | 'ollama') => {
      localStorage.setItem('aiService', service);
      setAiService(service);
      setGamePhase('CREATION');
  };

  const processCommand = useCallback(async (command: string) => {
    if (!aiService) return; // Should not happen, but for type safety
    dispatch({ type: 'START_LOADING' });
    const response = await getGameUpdate(gameStateRef.current, command, aiService);
    dispatch({ type: 'PROCESS_RESPONSE', payload: { response, command, set_toast: setToast } });
  }, [aiService]);


  const handleGameStart = useCallback((name: string) => {
    dispatch({ type: 'START_GAME', payload: { name }});
    setGamePhase('PLAYING');
  }, []);

  useEffect(() => {
    if (gamePhase === 'PLAYING' && gameState.history.length === 0) {
      processCommand(`Perkenalkan karakterku, ${gameState.player.name}, yang baru saja tiba di dunia ini. Mulai petualangan.`);
    }
  }, [gamePhase, gameState.history.length, gameState.player.name, processCommand]);


  useEffect(() => {
    if (gameState.player.exp >= gameState.player.maxExp) {
      dispatch({ type: 'LEVEL_UP' });
    }
  }, [gameState.player.exp, gameState.player.maxExp]);

  const handleQuestAccept = () => {
      if (!gameState.questOffer) return;
      processCommand(`Terima quest '${gameState.questOffer.id}'`);
      dispatch({ type: 'CLEAR_QUEST_OFFER' });
  }

  const handleQuestReject = () => {
      if (!gameState.questOffer) return;
      processCommand(`Tolak quest '${gameState.questOffer.id}'`);
      dispatch({ type: 'CLEAR_QUEST_OFFER' });
  }

  if (gamePhase === 'SERVICE_SELECTION') {
    return <ServiceSelection onSelectService={handleServiceSelect} />;
  }

  if (gamePhase === 'CREATION') {
      return <CharacterCreation onStart={handleGameStart} />;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row h-screen font-sans">
        <Sidebar player={gameState.player} world={gameState.world} quests={gameState.quests} />
        <main className="flex-grow flex flex-col bg-gray-900 h-full overflow-hidden relative">
          <div className="flex-grow overflow-y-auto">
            <NarrativeLog log={gameState.log} enemies={gameState.world.activeEnemies} />
          </div>
          {gameState.questOffer && <QuestOffer quest={gameState.questOffer} onAccept={handleQuestAccept} onReject={handleQuestReject} />}
          <CommandInput onSubmit={processCommand} isLoading={gameState.isLoading} />
        </main>
      </div>
    </>
  );
};

export default App;
