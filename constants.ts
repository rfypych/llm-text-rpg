import { GameState, ItemType, EquipmentSlot, WorldState, PlayerState, Quest } from './types';

export const INITIAL_PLAYER_STATE: PlayerState = {
  name: "Orion",
  hp: 100,
  maxHp: 100,
  mp: 30,
  maxMp: 30,
  atk: 12,
  def: 5,
  lvl: 1,
  exp: 0,
  maxExp: 100,
  gold: 50,
  inventory: [
    { id: "rusty_sword", name: "Pedang Berkarat", icon: "⚔️", type: ItemType.EQUIPMENT, equipped: true, slot: EquipmentSlot.WEAPON, stats: { atk: 2 }, durability: 25, maxDurability: 30 },
    { id: "leather_armor", name: "Zirah Kulit", icon: "👕", type: ItemType.EQUIPMENT, equipped: true, slot: EquipmentSlot.ARMOR, stats: { def: 2 }, durability: 40, maxDurability: 40 },
    { id: "health_potion", name: "Potion Penyembuh", icon: "🧪", type: ItemType.CONSUMABLE, count: 3 },
  ],
};

export const INITIAL_WORLD_STATE: WorldState = {
    location: {
        coords: { x: 0, y: 0 },
        type: "village",
        name: "Desa Oakvale"
    },
    timeOfDay: "Siang",
    activeEnemies: [],
};

export const INITIAL_QUESTS: Quest[] = [];


export const INITIAL_GAME_STATE: GameState = {
    player: INITIAL_PLAYER_STATE,
    world: INITIAL_WORLD_STATE,
    history: [],
    quests: INITIAL_QUESTS,
    isLoading: true,
    log: [],
    questOffer: null,
    suggestedActions: [],
}

export const TILE_TYPES: { [key: string]: { name: string, icon: string } } = {
    forest: { name: "Hutan", icon: "🌲" },
    mountains: { name: "Pegunungan", icon: "⛰️" },
    cave: { name: "Gua", icon: "🕸️" },
    plains: { name: "Padang Rumput", icon: "🌾" },
    village: { name: "Desa", icon: "🏡" },
    bridge: { name: "Jembatan", icon: "🌉" },
    river: { name: "Sungai", icon: "💧" },
    swamp: { name: "Rawa", icon: "🐸" },
    ruins: { name: "Reruntuhan", icon: "🏛️" }
};

export const MAX_HISTORY_TURNS = 10; // Keep the last 5 player/GM turn pairs