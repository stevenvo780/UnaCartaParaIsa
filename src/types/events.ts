/**
 * Sistema de eventos tipado para el juego
 */

import type { Entity, EntityStats } from "./entities";
import type { FoodItem } from "./food";
import type { Zone } from "./zones";
import type { GeneratedWorld } from "../world/types";

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
  mood?: string;
  activity?: string;
  timeOfDay?: "dawn" | "day" | "dusk" | "night";
  resonanceLevel?: number;
  statsThreshold?: Partial<EntityStats>;
  tags?: string[];
}

/**
 * Datos generados del mundo
 */
export interface GeneratedWorldData {
  zones: Zone[];
  mapElements: any[]; // TODO: Tipar mejor cuando se defina MapElement
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
