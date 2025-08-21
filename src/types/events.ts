/**
 * Sistema de eventos tipado para el juego
 */

import type { GeneratedWorld } from "../world/types";
import type { ActivityType } from "./activities";
import type { Position } from "./core";
import type { Entity, EntityStats } from "./entities";
import type { FoodItem } from "./food";
import type { GameState } from "./index";
import type { Zone } from "./zones";

export interface MapElement {
  id: string;
  type:
    | "terrain"
    | "decoration"
    | "structure"
    | "vegetation"
    | "food_zone"
    | "rest_zone"
    | "play_zone"
    | "social_zone"
    | "work_zone"
    | "comfort_zone"
    | "obstacle"
    | "food_vendor";
  position: { x: number; y: number };
  assetKey: string;
  biome?: string;
  scale?: number;
  rotation?: number;
  depth?: number;
  width?: number;
  height?: number;
  priceMultiplier?: number;
  properties?: Record<string, any>;
}

/**
 * Datos de actualización de game logic
 */
export interface GameLogicUpdateData {
  entities: Entity[];
  resonance: number;
  cycles: number;
  deltaTime: number;
  togetherTime: number;
  isaStats: EntityStats;
  stevStats: EntityStats;
  gameState?: GameState;
}

/**
 * Datos de error de carga de archivos
 */
export interface LoadErrorData {
  key: string;
  type: string;
  url: string;
  error?: Error;
}

/**
 * Datos de tienda de comida
 */
export interface FoodStoreData {
  foods: FoodItem[];
  playerMoney: number;
  isOpen: boolean;
}

/**
 * Datos de criterios de diálogo
 */
export interface DialogueCriteria {
  speaker?: "ISA" | "STEV";
  emotion?: string;
  textContains?: string;
  limit?: number;
  mood?: string;
  activity?: string;
  timeOfDay?: "dawn" | "day" | "dusk" | "night";
  resonanceLevel?: number;
  statsThreshold?: Partial<EntityStats>;
  tags?: string[];
}

/**
 * Datos de entidad para eventos
 */
export interface EntityEventData {
  id: string;
  stats: EntityStats;
  activity: ActivityType;
  position: Position;
  mood: string;
}

/**
 * Datos de actualización del juego
 */
export interface GameUpdateEventData {
  entities: EntityEventData[];
  resonance: number;
  cycles: number;
  deltaTime: number;
  togetherTime: number;
}

/**
 * Datos de interacción del jugador
 */
export interface PlayerInteractionEventData {
  entityId: string;
  interactionType: string;
  timestamp: number;
}

/**
 * Datos de consumo de comida
 */
export interface FoodConsumedEventData {
  foodId: string;
  consumerId: string;
  nutritionValue: number;
  timestamp: number;
}

/**
 * Datos de compra de comida
 */
export interface FoodPurchasedEventData {
  foodId: string;
  quantity: number;
  totalCost: number;
  timestamp: number;
}

/**
 * Datos de diálogo completado
 */
export interface DialogueCompletedEventData {
  dialogueId: string;
  speaker: string;
  listener: string;
  duration: number;
  timestamp: number;
  cardId?: string; // Opcional para compatibilidad con cartas de diálogo
  choiceId?: string; // Opcional para compatibilidad con elecciones de cartas
}

/**
 * Datos de misión para eventos
 */
export interface QuestEventData {
  id: string;
  dialogues: Array<{
    stage: string;
    speaker: string;
    text: string;
  }>;
  objectives: Array<{
    type: string;
    target?: any;
    completed: boolean;
  }>;
}

/**
 * Datos generados del mundo
 */
export interface GeneratedWorldData {
  zones: Zone[];
  mapElements: MapElement[];
  generatedWorld?: GeneratedWorld;
  terrainTiles: any[];
  roads: any[];
  objectLayers: any[];
  worldSize: { width: number; height: number };
  generatorVersion: string;
}

/**
 * Datos de configuración de ruido para terreno
 */
export interface NoiseConfig {
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
}

/**
 * Datos de error crítico
 */
export interface CriticalError {
  message: string;
  stack?: string;
  timestamp: number;
  scene?: string;
}

/**
 * Datos de interacción del jugador
 */
export interface PlayerInteractionData {
  entityId: string;
  interactionType: string;
  timestamp: number;
}

/**
 * Mapeo de todos los eventos del juego
 */
export interface GameEvents {
  gameLogicUpdate: GameLogicUpdateData;
  loaderror: LoadErrorData;
  openFoodStore: FoodStoreData;
  buyFood: { foodId: string; quantity: number };
  criticalError: CriticalError;
  worldGenerated: GeneratedWorldData;
  entityRegistered: { entityId: string; entity: Entity };
  entityStateChanged: { entityId: string; oldState: string; newState: string };
  playerInteraction: PlayerInteractionData;
  uiUpdate: GameLogicUpdateData;
  wheelScroll: { deltaX: number; deltaY: number };
  needsUpdated: { entityId: string; entityData: any };
}

/**
 * Event emitter tipado
 */
export interface TypedEventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void,
    context?: any,
  ): void;
  off<K extends keyof T>(
    event: K,
    listener?: (data: T[K]) => void,
    context?: any,
  ): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

/**
 * Game logic manager tipado
 */
export interface IGameLogicManager extends TypedEventEmitter<GameEvents> {
  registerEntity(entityId: string, entity: Entity): void;
  getEntity(entityId: string): Entity | undefined;
  getEntities(): Entity[];
  update(deltaTime: number): void;
  destroy(): void;
}
