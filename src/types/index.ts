/**
 * Main types index - Re-exports from modular type files
 * Organized to prevent circular dependencies
 */

// Import types for use in this file
import type { Position, Rect, Size } from "./core";
import type { Entity, EntityStats, MoodType } from "./entities";
import type { ZoneType } from "./zones";

// Core types (no dependencies)
export type { Color, Position, Rect, Size } from "./core";

// Domain-specific types
export type {
  ActivityDefinition,
  ActivityModifiers,
  ActivityType,
  EntityActivity,
} from "./activities";
export type {
  Entity,
  EntityStateType,
  EntityStats,
  MoodType,
} from "./entities";
export type {
  EatingAction,
  FoodCategory,
  FoodInventoryItem,
  FoodItem,
} from "./food";
export type {
  Quest,
  QuestCategory,
  QuestDialogue,
  QuestDifficulty,
  QuestEvent,
  QuestObjective,
  QuestObjectiveType,
  QuestProgress,
  QuestRequirement,
  QuestReward,
  QuestStatus,
  QuestSystemConfig,
  RewardType,
} from "./quests";
export type { ZoneDefinition, ZoneType } from "./zones";

// Event system types
export type {
  CriticalError,
  DialogueCriteria,
  FoodStoreData,
  GameEvents,
  GameLogicUpdateData,
  GeneratedWorldData,
  IGameLogicManager,
  LoadErrorData,
  NoiseConfig,
  PlayerInteractionData,
  TypedEventEmitter,
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
    scale?: number;
    tint?: number;
    interactive?: boolean;
    collider?: boolean;
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
  properties?: {
    comfort?: number;
    privacy?: number;
    lighting?: number;
    temperature?: number;
    noise?: number;
  };
  metadata?: {
    furnitureTypes?: string[];
    priority?: number;
    biome?: string;
    accessibility?: 'public' | 'private' | 'semi-private';
    capacity?: number;
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

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'windy';

export interface WeatherState {
  current: WeatherType;
  temperature: number; // Celsius
  humidity: number; // 0-100
  windSpeed: number; // km/h
  visibility: number; // 0-1 (fog factor)
  lastChange: number; // timestamp
  duration: number; // how long this weather lasts
}

export interface GameResources {
  energy: number;
  materials: {
    wood: number;
    stone: number;
    food: number;
    water: number;
  };
  currency: number;
  experience: number;
  unlockedFeatures: string[];
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
  weather?: WeatherState;
  resources?: GameResources;
}
