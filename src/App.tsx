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
import { PlayerStats } from './components/PlayerStats';
import { Inventory } from './components/Inventory';
import { MapView } from './components/MapView';
import { QuestLog } from './components/QuestLog';
import { SuggestedActions } from './components/SuggestedActions';
import { LandingPage } from './components/LandingPage';

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
      return { ...state, isLoading: true, suggestedActions: [] };
    case 'CLEAR_QUEST_OFFER':
      return { ...state, questOffer: null };
    case 'PROCESS_RESPONSE': {
      const { response, command, set_toast } = action.payload;
      let newState = { ...state };
      const wasInCombat = state.world.activeEnemies.length > 0;

      newState.history = [...state.history, { role: 'player', content: command }, { role: 'GM', content: response.narration }];
      
      const newLogEntries: (string | { type: 'narration', content: string } | { type: 'player', content: string } | { type: 'combat', content: string })[] = [];
      newLogEntries.push({ type: 'player', content: command });
      newLogEntries.push({ type: 'narration', content: response.narration });

      if (response.logEntries) {
        newLogEntries.push(...response.logEntries);
      }

      if (response.questOffer && response.questOffer.id && response.questOffer.title && response.questOffer.title.trim() && response.questOffer.description && response.questOffer.description.trim()) {
        newState.questOffer = response.questOffer;
      } else {
        // Clear any existing offer if the new one is invalid or not present.
        newState.questOffer = null;
        if (response.questOffer) {
            // Log the invalid offer for debugging purposes.
            console.warn("Received an invalid quest offer from AI and ignored it:", response.questOffer);
        }
      }

      newState.suggestedActions = response.suggestedActions || [];

      if (response.playerUpdates) {
        if (response.playerUpdates.set) {
          Object.keys(response.playerUpdates.set).forEach(key => {
            // CRITICAL FIX: Prevent AI from overwriting complex objects like inventory directly.
            // Force it to use the proper inventoryUpdates mechanism.
            if (key === 'inventory') {
                console.warn("AI attempted to overwrite inventory via playerUpdates.set. Ignoring.");
                return; 
            }
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
        
        // Handle ADD operations
        if (response.inventoryUpdates.add) {
            const itemsToAdd = Array.isArray(response.inventoryUpdates.add) ? response.inventoryUpdates.add : [response.inventoryUpdates.add];
            itemsToAdd.forEach(itemToAdd => {
                const existingItem = newInventory.find(i => i.id === itemToAdd.id && i.type !== ItemType.EQUIPMENT);
                if (existingItem) {
                    existingItem.count = (existingItem.count || 0) + (itemToAdd.count || 1);
                } else {
                    const newItem = { ...itemToAdd };
                    if (newItem.type !== ItemType.EQUIPMENT && newItem.count === undefined) {
                        newItem.count = 1;
                    }
                    // Safeguard: Clamp durability on newly added items.
                    if (newItem.durability !== undefined && newItem.maxDurability !== undefined) {
                        newItem.durability = Math.max(0, Math.min(newItem.durability, newItem.maxDurability));
                    }
                    newInventory.push(newItem);
                }
            });
        }
        
        // Handle REMOVE operations (now safer for stacks)
        if (response.inventoryUpdates.remove) {
            const idsToRemove = Array.isArray(response.inventoryUpdates.remove) ? response.inventoryUpdates.remove : [response.inventoryUpdates.remove];
            idsToRemove.forEach(idToRemove => {
                const itemIndex = newInventory.findIndex(item => item.id === idToRemove);
                if (itemIndex > -1) {
                    const item = newInventory[itemIndex];
                    if (item.type !== ItemType.EQUIPMENT && item.count && item.count > 1) {
                        item.count -= 1; // Decrement stack
                    } else {
                        newInventory.splice(itemIndex, 1); // Remove item entirely
                    }
                }
            });
        }
        
        // Handle UPDATE operations
        if (response.inventoryUpdates.update) {
            const updatesToApply = Array.isArray(response.inventoryUpdates.update) ? response.inventoryUpdates.update : [response.inventoryUpdates.update];
            updatesToApply.forEach(update => {
                const item = newInventory.find(i => i.id === update.id);
                if (item) {
                    Object.assign(item, update.changes);
                    // Safeguard: Clamp durability to its max value.
                    if (item.durability !== undefined && item.maxDurability !== undefined) {
                        item.durability = Math.max(0, Math.min(item.durability, item.maxDurability));
                    }
                     // If an update reduces count to 0 or less, remove the item
                    if (item.count !== undefined && item.count <= 0) {
                        newInventory = newInventory.filter(i => i.id !== item.id);
                    }
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
              const enemiesToAdd = Array.isArray(response.enemyUpdates.add) ? response.enemyUpdates.add : [response.enemyUpdates.add];
              newEnemies.push(...enemiesToAdd);
           }
           if (response.enemyUpdates.update) {
               const updatesToApply = Array.isArray(response.enemyUpdates.update) ? response.enemyUpdates.update : [response.enemyUpdates.update];
               updatesToApply.forEach(update => {
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
              const questsToAdd = Array.isArray(response.questUpdates.add) ? response.questUpdates.add : [response.questUpdates.add];
              questsToAdd.forEach(q => {
                  if(!newQuests.find(existing => existing.id === q.id)) {
                    newQuests.push({...q, status: QuestStatus.ACTIVE});
                    set_toast({ message: `Quest Dimulai: ${q.title}`, type: 'info' });
                  }
              });
          }
          if(response.questUpdates.update) {
              const updatesToApply = Array.isArray(response.questUpdates.update) ? response.questUpdates.update : [response.questUpdates.update];
              updatesToApply.forEach(update => {
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

      const isNowInCombat = newState.world.activeEnemies.length > 0;

      if (!wasInCombat && isNowInCombat) {
        newLogEntries.push({ type: 'combat', content: 'PERTEMPURAN DIMULAI!' });
      } else if (wasInCombat && !isNowInCombat) {
        newLogEntries.push({ type: 'combat', content: 'Pertempuran Berakhir!' });
      }
      
      newState.log = [...state.log, ...newLogEntries];
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

const QuestOffer: React.FC<{ quest: Omit<Quest, 'status'>, onAccept: () => void, onReject: () => void, playerName: string }> = ({ quest, onAccept, onReject, playerName }) => {
    return (
        <div className="absolute bottom-24 right-4 w-full max-w-md bg-stone-800 border-2 border-amber-500 rounded-lg shadow-2xl p-4 z-10 animate-fade-in-up">
            <h3 className="text-lg font-bold font-serif text-amber-400 text-center tracking-wider">Tawaran Quest</h3>
            <div className="bg-slate-700/50 p-3 rounded-lg my-3">
                <h4 className="font-semibold text-amber-500">{quest.title}</h4>
                <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                    <HighlightedText text={quest.description} playerName={playerName} />
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

type GamePhase = 'LANDING' | 'SERVICE_SELECTION' | 'CREATION' | 'PLAYING';
type AIServiceType = 'gemini' | 'ollama' | 'mistral' | 'groq';

type MobileView = 'narrative' | 'stats' | 'inventory' | 'map' | 'quests';

const MobileBottomNav: React.FC<{
  activeView: MobileView;
  setView: (view: MobileView) => void;
}> = ({ activeView, setView }) => {
  const tabs: { id: MobileView; label: string; icon: string }[] = [
    { id: 'narrative', label: 'Story', icon: '📖' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'inventory', label: 'Inv.', icon: '🎒' },
    { id: 'quests', label: 'Quests', icon: '📜' },
  ];

  return (
    <nav className="flex justify-around bg-slate-800 border-t-2 border-slate-700">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className={`flex-1 p-2 text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors duration-200
            ${activeView === tab.id ? 'text-amber-400' : 'text-slate-400 hover:bg-slate-700/50'}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};


const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, {
      ...INITIAL_GAME_STATE,
      player: INITIAL_PLAYER_STATE,
      world: INITIAL_WORLD_STATE,
      quests: INITIAL_QUESTS,
      history: [],
      log: [],
      suggestedActions: []
  });

  const [toast, setToast] = useState<ToastInfo | null>(null);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [aiService, setAiService] = useState<AIServiceType | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('LANDING');
  const [mobileView, setMobileView] = useState<MobileView>('narrative');
  const [logAnimStartIndex, setLogAnimStartIndex] = useState(0);

  const handleServiceSelect = (service: AIServiceType) => {
      localStorage.setItem('aiService', service);
      setAiService(service);
      setGamePhase('CREATION');
  };

  const handleBackToServiceSelection = () => {
    // Clear all stored service info to ensure a clean start
    localStorage.removeItem('aiService');
    localStorage.removeItem('mistralApiKey');
    localStorage.removeItem('groqApiKey');
    localStorage.removeItem('mistralModel');
    localStorage.removeItem('groqModel');
    setAiService(null);
    setGamePhase('SERVICE_SELECTION');
  };

  const processCommand = useCallback(async (command: string) => {
    const service = localStorage.getItem('aiService') as AIServiceType | null;
    if (!service) {
        setToast({ message: "Layanan AI tidak dikonfigurasi. Mengarahkan kembali...", type: 'error' });
        handleBackToServiceSelection();
        return;
    }
    setLogAnimStartIndex(gameStateRef.current.log.length);
    dispatch({ type: 'START_LOADING' });
    const response = await getGameUpdate(gameStateRef.current, command, service);
    dispatch({ type: 'PROCESS_RESPONSE', payload: { response, command, set_toast: setToast } });
  }, []);


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

  if (gamePhase === 'LANDING') {
    return <LandingPage onStartGame={() => setGamePhase('SERVICE_SELECTION')} />;
  }

  if (gamePhase === 'SERVICE_SELECTION') {
    return <ServiceSelection onSelectService={handleServiceSelect} />;
  }

  if (gamePhase === 'CREATION') {
      return <CharacterCreation onStart={handleGameStart} onBack={handleBackToServiceSelection} />;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-row h-screen font-sans">
        <div className="hidden md:flex flex-shrink-0">
            <Sidebar 
              player={gameState.player} 
              world={gameState.world} 
              quests={gameState.quests} 
              onSwitchService={handleBackToServiceSelection}
              onCommand={processCommand}
              isLoading={gameState.isLoading}
            />
        </div>
        <main className="flex-grow flex flex-col bg-slate-900 h-full overflow-hidden relative">
            <div className="flex-grow overflow-y-auto">
                {/* Mobile View Pane */}
                <div className="md:hidden h-full">
                    {mobileView === 'narrative' && <NarrativeLog log={gameState.log} enemies={gameState.world.activeEnemies} playerName={gameState.player.name} logAnimStartIndex={logAnimStartIndex} />}
                    {mobileView === 'stats' && <PlayerStats player={gameState.player} />}
                    {mobileView === 'inventory' && <Inventory player={gameState.player} onCommand={processCommand} isLoading={gameState.isLoading} />}
                    {mobileView === 'map' && <MapView world={gameState.world} />}
                    {mobileView === 'quests' && <QuestLog quests={gameState.quests} playerName={gameState.player.name} />}
                </div>
                
                {/* Desktop View Pane */}
                <div className="hidden md:block h-full">
                    <NarrativeLog log={gameState.log} enemies={gameState.world.activeEnemies} playerName={gameState.player.name} logAnimStartIndex={logAnimStartIndex} />
                </div>
            </div>

            {gameState.questOffer && <QuestOffer quest={gameState.questOffer} onAccept={handleQuestAccept} onReject={handleQuestReject} playerName={gameState.player.name} />}
            
            <div className={mobileView === 'narrative' ? 'block' : 'hidden md:block'}>
                 <div className="border-t-2 border-slate-700 bg-slate-900/80 backdrop-blur-sm">
                    <SuggestedActions 
                        actions={gameState.suggestedActions} 
                        onSubmit={processCommand} 
                        isLoading={gameState.isLoading} 
                    />
                    <CommandInput onSubmit={processCommand} isLoading={gameState.isLoading} />
                </div>
            </div>
            
            <div className="md:hidden">
                <MobileBottomNav activeView={mobileView} setView={setMobileView} />
            </div>
        </main>
      </div>
    </>
  );
};

export default App;