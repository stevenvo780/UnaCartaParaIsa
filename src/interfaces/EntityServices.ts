/**
 * Interfaces de servicios para reducir acoplamiento en GameEntity
 * Permite inyección de dependencias y mejor testabilidad
 */

import type { Entity, EntityStats, ActivityType, MoodType } from '../types';

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
 * Interface para servicios de logging
 */
export interface ILogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
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
    timeOfDay: any
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
    // Lazy imports para evitar dependencias circulares
    const { gameConfig } = require('../config/gameConfig');
    const { logAutopoiesis } = require('../utils/logger');
    const activityDynamics = require('../utils/activityDynamics');
    const resonanceCalculations = require('../utils/resonanceCalculations');
    const aiDecisionEngine = require('../utils/aiDecisionEngine');

    return {
      config: gameConfig,
      logger: logAutopoiesis,
      activityCalculator: {
        applyHybridDecay: activityDynamics.applyHybridDecay,
        applySurvivalCosts: activityDynamics.applySurvivalCosts,
        applyActivityEffectsWithTimeModifiers: activityDynamics.applyActivityEffectsWithTimeModifiers
      },
      resonanceCalculator: {
        calculateProximityResonanceChange: resonanceCalculations.calculateProximityResonanceChange,
        calculateResonanceModifiers: resonanceCalculations.calculateResonanceModifiers
      },
      aiDecisionEngine: {
        makeIntelligentDecision: aiDecisionEngine.makeIntelligentDecision
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
    applyActivityEffectsWithTimeModifiers: (activity, stats) => stats
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