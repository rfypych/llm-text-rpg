export enum ItemType {
  EQUIPMENT = "EQUIPMENT",
  CONSUMABLE = "CONSUMABLE",
  MATERIAL = "MATERIAL",
  VALUABLE = "VALUABLE",
  KEY = "KEY",
}

export enum EquipmentSlot {
  WEAPON = "WEAPON",
  ARMOR = "ARMOR",
  HELMET = "HELMET",
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  count?: number;
  equipped?: boolean;
  slot?: EquipmentSlot;
  stats?: {
    atk?: number;
    def?: number;
  };
}

export interface PlayerStats {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  lvl: number;
  exp: number;
  maxExp: number;
  gold: number;
}

export interface PlayerState extends PlayerStats {
  inventory: Item[];
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

export interface WorldState {
  location: {
    coords: { x: number; y: number };
    type: string;
    name: string;
  };
  timeOfDay: "Pagi" | "Siang" | "Sore" | "Malam";
  activeEnemies: Enemy[];
}

export enum QuestStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: QuestStatus;
}


export interface GameState {
  player: PlayerState;
  world: WorldState;
  history: { role: "GM" | "player"; content: string }[];
  quests: Quest[];
  isLoading: boolean;
  log: (string | { type: 'narration', content: string })[];
  questOffer?: Omit<Quest, 'status'> | null;
}

// API Communication Structures

export interface GeminiRequest {
  playerState: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    stats: { atk: number; def: number };
    gold: number;
    inventory: { id: string; name: string; type: ItemType; equipped?: boolean; count?: number }[];
  };
  worldState: {
    location: { coords: { x: number; y: number }; type: string };
    timeOfDay: string;
    activeEnemies: { id: string; name: string; hp: number }[];
    localMap: {
        north: string;
        south: string;
        east: string;
        west: string;
        northEast: string;
        northWest: string;
        southEast: string;
        southWest: string;
    };
  };
  history: { role: "GM" | "player"; content: string }[];
  quests: Quest[];
  activeQuestOffer?: Omit<Quest, 'status'> | null;
  playerCommand: string;
}

export interface GeminiResponse {
  narration: string;
  logEntries?: string[];
  playerUpdates?: {
    set?: { 
        [key: string]: number | any;
        coords?: { x: number, y: number };
        locationName?: string;
    };
    increment?: { [key: string]: number };
  };
  inventoryUpdates?: {
    add?: { id: string; name: string; type: ItemType; count?: number, slot?: EquipmentSlot, stats?: { atk?: number, def?: number } }[];
    remove?: string[]; // array of item ids to remove
    update?: { id: string, changes: Partial<Omit<Item, 'id'>> }[];
  };
  enemyUpdates?: {
    add?: Enemy[];
    remove?: string[]; // array of enemy ids
    update?: { id: string; changes: { hp?: number } }[];
  };
  questUpdates?: {
    add?: Omit<Quest, 'status'>[];
    update?: { id: string; changes: { description?: string, status?: QuestStatus } }[];
  };
  questOffer?: Omit<Quest, 'status'>;
}