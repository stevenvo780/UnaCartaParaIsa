/**
 * Main types index - Re-exports from modular type files
 * Organized to prevent circular dependencies
 */

// Core types (no dependencies)
export type { Position, Size, Rect, Color } from './core';

// Domain-specific types
export type { ActivityType, EntityActivity, ActivityModifiers, ActivityDefinition } from './activities';
export type { ZoneType } from './zones';
export type { EntityStateType, MoodType, EntityStats, Entity } from './entities';
export type { FoodCategory, FoodItem, FoodInventoryItem, EatingAction } from './food';

// Game-specific types that remain centralized
export type InteractionType =
  | 'NOURISH'
  | 'FEED'
  | 'PLAY'
  | 'COMFORT'
  | 'DISTURB'
  | 'WAKE_UP'
  | 'LET_SLEEP';

export interface MapElement {
  id: string;
  type:
    | 'obstacle'
    | 'food_zone'
    | 'rest_zone'
    | 'play_zone'
    | 'social_zone'
    | 'work_zone'
    | 'comfort_zone'
    | 'decoration';
  position: Position;
  size: Size;
  color: string;
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
  metadata?: {
    furnitureTypes?: string[];
    priority?: number;
    [key: string]: unknown;
  };
}

export interface DialogueEntry {
  speaker: 'ISA' | 'STEV';
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
  type: 'grass' | 'stone' | 'water' | 'path';
  variant?: number;
}

export interface RoadPolyline {
  id: string;
  points: Position[];
  width: number;
  type: 'main' | 'secondary' | 'path';
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
}