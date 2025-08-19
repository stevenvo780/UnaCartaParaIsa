/**
 * Interfaces de servicios para reducir acoplamiento en GameEntity
 * Permite inyección de dependencias y mejor testabilidad
 */

import type { Entity, EntityStats, ActivityType } from '../types';

/**
 * Tipo para datos de tiempo del día
 */
export interface TimeOfDayData {
  hour: number;
  isDay: boolean;
  isNight: boolean;
  lightLevel: number;
  modifier: number;
}

/**
 * Interface para servicios de configuración
 */
export interface IGameConfig {
  readonly entityInitialStats: number;
  readonly entityInitialMoney: number;
  readonly entityInitialHealth: number;
  readonly initialResonance: number;
  readonly movement: {
    baseSpeed: number;
    friction: number;
  };
  readonly timing: {
    mainGameLogic: number;
  };
}

/**
 * Tipo para datos de logging
 */
export type LogData = Record<string, unknown> | string | number | boolean | null;

/**
 * Interface para servicios de logging
 */
export interface ILogger {
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
}

/**
 * Interface para cálculos de actividad
 */
export interface IActivityCalculator {
  applyHybridDecay(
    stats: EntityStats,
    activity: ActivityType,
    deltaTime: number
  ): EntityStats;
  
  applySurvivalCosts(stats: EntityStats, deltaTime: number): EntityStats;
  
  applyActivityEffectsWithTimeModifiers(
    activity: ActivityType,
    stats: EntityStats,
    deltaTime: number,
    timeOfDay: TimeOfDayData
  ): EntityStats;
}

/**
 * Interface para cálculos de resonancia
 */
export interface IResonanceCalculator {
  calculateProximityResonanceChange(
    myPosition: { x: number; y: number },
    partnerPosition: { x: number; y: number },
    myStats: EntityStats,
    partnerStats: EntityStats,
    currentResonance: number,
    deltaTime: number
  ): {
    resonanceChange: number;
    closeness: number;
    effect: string;
  };
  
  calculateResonanceModifiers(resonance: number, closeness: number): {
    happinessMultiplier: number;
    energyMultiplier: number;
    healthMultiplier: number;
    lonelinessPenalty: number;
  };
}

/**
 * Interface para motor de decisiones AI
 */
export interface IAIDecisionEngine {
  makeIntelligentDecision(
    entity: Entity,
    companion: Entity | null,
    currentTime: number
  ): ActivityType;
}

/**
 * Interface para el partner de resonancia
 */
export interface IResonancePartner {
  getPosition(): { x: number; y: number };
  getStats(): EntityStats;
  getResonance(): number;
}

/**
 * Contenedor de servicios para GameEntity
 */
export interface IEntityServices {
  config: IGameConfig;
  logger: ILogger;
  activityCalculator: IActivityCalculator;
  resonanceCalculator: IResonanceCalculator;
  aiDecisionEngine: IAIDecisionEngine;
}

/**
 * Factory para crear servicios por defecto
 */
export class EntityServicesFactory {
  static create(): IEntityServices {
    // Servicios por defecto síncronos para evitar problemas de async en constructores
    return {
      config: {
        entityInitialStats: 50,
        entityInitialMoney: 50,
        entityInitialHealth: 90,
        initialResonance: 0,
        movement: { baseSpeed: 84, friction: 0.85 },
        timing: { mainGameLogic: 800 }
      },
      logger: {
        info: (message: string, data?: LogData) => console.log(`[INFO] ${message}`, data || ''),
        warn: (message: string, data?: LogData) => console.warn(`[WARN] ${message}`, data || ''),
        error: (message: string, data?: LogData) => console.error(`[ERROR] ${message}`, data || ''),
        debug: (message: string, data?: LogData) => console.debug(`[DEBUG] ${message}`, data || '')
      },
      activityCalculator: {
        applyHybridDecay: (stats: EntityStats, _activity: ActivityType, _deltaTime: number) => stats,
        applySurvivalCosts: (stats: EntityStats, _deltaTime: number) => stats,
        applyActivityEffectsWithTimeModifiers: (_activity: ActivityType, stats: EntityStats, _deltaTime: number, _timeOfDay: TimeOfDayData) => stats
      },
      resonanceCalculator: {
        calculateProximityResonanceChange: (
          _myPosition: { x: number; y: number },
          _partnerPosition: { x: number; y: number },
          _myStats: EntityStats,
          _partnerStats: EntityStats,
          _currentResonance: number,
          _deltaTime: number
        ) => ({
          resonanceChange: 0,
          closeness: 0,
          effect: 'none'
        }),
        calculateResonanceModifiers: (_resonance: number, _closeness: number) => ({
          happinessMultiplier: 1,
          energyMultiplier: 1,
          healthMultiplier: 1,
          lonelinessPenalty: 0
        })
      },
      aiDecisionEngine: {
        makeIntelligentDecision: () => 'rest' as ActivityType
      }
    };
  }
}

/**
 * Mock services para testing
 */
export class MockEntityServices implements IEntityServices {
  config: IGameConfig = {
    entityInitialStats: 50,
    entityInitialMoney: 50,
    entityInitialHealth: 90,
    initialResonance: 0,
    movement: { baseSpeed: 84, friction: 0.85 },
    timing: { mainGameLogic: 800 }
  };

  logger: ILogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {}
  };

  activityCalculator: IActivityCalculator = {
    applyHybridDecay: (stats) => stats,
    applySurvivalCosts: (stats) => stats,
    applyActivityEffectsWithTimeModifiers: (_activity, stats) => stats
  };

  resonanceCalculator: IResonanceCalculator = {
    calculateProximityResonanceChange: () => ({
      resonanceChange: 0,
      closeness: 0,
      effect: 'neutral'
    }),
    calculateResonanceModifiers: () => ({
      happinessMultiplier: 1,
      energyMultiplier: 1,
      healthMultiplier: 1,
      lonelinessPenalty: 1
    })
  };

  aiDecisionEngine: IAIDecisionEngine = {
    makeIntelligentDecision: (entity) => entity.activity
  };
}