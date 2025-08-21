/**
 * Main types index - Re-exports from modular type files
 * Organized to prevent circular dependencies
 */

// Import types for use in this file
import type { Position, Size, Rect, Color } from "./core";
import type { ZoneType } from "./zones";
import type { EntityStats, MoodType, Entity } from "./entities";

// Core types (no dependencies)
export type { Position, Size, Rect, Color } from "./core";

// Domain-specific types
export type {
  ActivityType,
  EntityActivity,
  ActivityModifiers,
  ActivityDefinition,
} from "./activities";
export type { ZoneType, Zone as ZoneDefinition } from "./zones";
export type {
  EntityStateType,
  MoodType,
  EntityStats,
  Entity,
} from "./entities";
export type {
  FoodCategory,
  FoodItem,
  FoodInventoryItem,
  EatingAction,
} from "./food";
export type {
  QuestStatus,
  QuestObjectiveType,
  QuestDifficulty,
  QuestCategory,
  RewardType,
  QuestRequirement,
  QuestReward,
  QuestObjective,
  QuestDialogue,
  Quest,
  QuestProgress,
  QuestEvent,
  QuestSystemConfig,
} from "./quests";

// Event system types
export type {
  GameEvents,
  GameLogicUpdateData,
  LoadErrorData,
  FoodStoreData,
  DialogueCriteria,
  GeneratedWorldData,
  NoiseConfig,
  CriticalError,
  PlayerInteractionData,
  TypedEventEmitter,
  IGameLogicManager,
} from "./events";

// Game-specific types that remain centralized
export type InteractionType =
  | "NOURISH"
  | "FEED"
  | "PLAY"
  | "COMFORT"
  | "DISTURB"
  | "WAKE_UP"
  | "LET_SLEEP";

export interface MapElement {
  id: string;
  type:
    | "obstacle"
    | "food_zone"
    | "rest_zone"
    | "play_zone"
    | "social_zone"
    | "work_zone"
    | "comfort_zone"
    | "decoration"
    | "food_vendor";
  position: Position;
  size: Size;
  color: string;
  width?: number; // Opcional para compatibilidad
  height?: number; // Opcional para compatibilidad
  priceMultiplier?: number; // Para food_vendor
  effect?: {
    statType: keyof EntityStats;
    modifier: number;
  };
  metadata?: {
    furnitureType?: string;
    assetId?: string;
    rotation?: number;
    [key: string]: unknown;
  };
}

export interface Zone {
  id: string;
  name: string;
  bounds: Rect;
  type: ZoneType;
  effects?: Partial<Record<keyof EntityStats, number>>;
  color: string;
  attractiveness: number;
  properties?: Record<string, unknown>;
  metadata?: {
    furnitureTypes?: string[];
    priority?: number;
    [key: string]: unknown;
  };
}

export interface DialogueEntry {
  speaker: "ISA" | "STEV";
  text: string;
  emotion: string;
  activity: string;
}

export interface ConversationState {
  isActive: boolean;
  participants: string[];
  lastSpeaker: string | null;
  lastDialogue: DialogueEntry | null;
  startTime: number;
}

export interface InteractionEffect {
  stats: Partial<EntityStats>;
  resonance?: number;
  mood?: MoodType;
  duration?: number;
}

export interface TerrainTile {
  x: number;
  y: number;
  assetId: string;
  type: "grass" | "stone" | "water" | "path";
  variant?: number;
}

export interface RoadPolyline {
  id: string;
  points: Position[];
  width: number;
  type: "main" | "secondary" | "path";
}

export interface ObjectLayer {
  id: string;
  name: string;
  objects: MapElement[];
  zIndex: number;
  visible: boolean;
}

export interface GameState {
  entities: Entity[];
  resonance: number;
  cycles: number;
  lastSave: number;
  togetherTime: number;
  connectionAnimation: {
    active: boolean;
    startTime: number;
    type: InteractionType;
    entityId?: string;
  };
  zones: Zone[];
  mapElements: MapElement[];
  mapSeed?: string;
  currentConversation: ConversationState;
  terrainTiles: TerrainTile[];
  roads: RoadPolyline[];
  objectLayers: ObjectLayer[];
  worldSize: Size;
  generatorVersion: string;
  playerLevel?: number; // Nivel del jugador para desbloquear assets
  exploredBiomes?: string[]; // Biomas descubiertos
  unlockedAssets?: string[]; // Assets desbloqueados
  dayTime?: number;
  weather?: any;
  resources?: any;
  [key: string]: unknown; // Index signature for compatibility
}
