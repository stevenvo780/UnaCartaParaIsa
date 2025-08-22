/**
 * Interfaces de servicios para reducir acoplamiento en GameEntity
 * Permite inyección de dependencias y mejor testabilidad
 */

import type { Entity, EntityStats, ActivityType } from "../types";
import { logAutopoiesis } from "../utils/logger";

/**
 * Tipo para datos de tiempo del día
 */
export interface TimeOfDayData {
  hour: number;
  isDay: boolean;
  isNight: boolean;
  phase: "dawn" | "day" | "dusk" | "night";
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
export type LogData =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null;

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
    deltaTime: number,
  ): EntityStats;

  applySurvivalCosts(stats: EntityStats, deltaTime: number): EntityStats;

  applyActivityEffectsWithTimeModifiers(
    activity: ActivityType,
    stats: EntityStats,
    deltaTime: number,
    timeOfDay: TimeOfDayData,
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
    deltaTime: number,
  ): {
    resonanceChange: number;
    closeness: number;
    effect: string;
  };

  calculateResonanceModifiers(
    resonance: number,
    closeness: number,
  ): {
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
    currentTime: number,
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
  id?: string;
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
                timing: { mainGameLogic: 800 },
            },
            logger: {
                info: (message: string, data?: LogData) => {
                    try {
                        logAutopoiesis.info(message, data);
                    } catch {
                        // Fallback silencioso si logger no está disponible
                    }
                },
                warn: (message: string, data?: LogData) => {
                    try {
                        logAutopoiesis.warn(message, data);
                    } catch {
                        // Fallback silencioso si logger no está disponible
                    }
                },
                error: (message: string, data?: LogData) => {
                    try {
                        logAutopoiesis.error(message, data);
                    } catch {
                        // Fallback silencioso si logger no está disponible
                    }
                },
                debug: (message: string, data?: LogData) => {
                    try {
                        logAutopoiesis.debug(message, data);
                    } catch {
                        // Fallback silencioso si logger no está disponible
                    }
                },
            },
            activityCalculator: {
                applyHybridDecay: (
                    stats: EntityStats,
                    _activity: ActivityType,
                    deltaTime: number,
                ) => {
                    // Basic degradation over time
                    const secondsElapsed = deltaTime / 1000;
                    const degradationRate = 0.1; // Degradation per second

                    return {
                        ...stats,
                        hunger: Math.min(
                            100,
                            stats.hunger + degradationRate * secondsElapsed * 0.8,
                        ),
                        energy: Math.max(
                            0,
                            stats.energy - degradationRate * secondsElapsed * 0.6,
                        ),
                        happiness: Math.max(
                            0,
                            stats.happiness - degradationRate * secondsElapsed * 0.3,
                        ),
                        sleepiness: Math.min(
                            100,
                            stats.sleepiness + degradationRate * secondsElapsed * 0.5,
                        ),
                        boredom: Math.min(
                            100,
                            stats.boredom + degradationRate * secondsElapsed * 0.7,
                        ),
                        loneliness: Math.min(
                            100,
                            stats.loneliness + degradationRate * secondsElapsed * 0.4,
                        ),
                    };
                },
                applySurvivalCosts: (stats: EntityStats, deltaTime: number) => {
                    // Additional survival costs
                    const secondsElapsed = deltaTime / 1000;
                    const baseCost = 0.05; // Base survival cost per second

                    return {
                        ...stats,
                        health: Math.max(0, stats.health - baseCost * secondsElapsed * 0.2),
                        stress: Math.min(
                            100,
                            stats.stress + baseCost * secondsElapsed * 0.3,
                        ),
                    };
                },
                applyActivityEffectsWithTimeModifiers: (
                    activity: ActivityType,
                    stats: EntityStats,
                    deltaTime: number,
                    _timeOfDay: TimeOfDayData,
                ) => {
                    // Apply positive effects based on activity
                    const secondsElapsed = deltaTime / 1000;
                    const effectStrength = 0.2; // Effect strength per second

                    const modifiedStats = { ...stats };

                    switch (activity) {
                    case "RESTING":
                        modifiedStats.energy = Math.min(
                            100,
                            stats.energy + effectStrength * secondsElapsed * 2,
                        );
                        modifiedStats.sleepiness = Math.max(
                            0,
                            stats.sleepiness - effectStrength * secondsElapsed * 1.5,
                        );
                        break;
                    case "SOCIALIZING":
                        modifiedStats.loneliness = Math.max(
                            0,
                            stats.loneliness - effectStrength * secondsElapsed * 2,
                        );
                        modifiedStats.happiness = Math.min(
                            100,
                            stats.happiness + effectStrength * secondsElapsed,
                        );
                        break;
                    case "EATING":
                        modifiedStats.hunger = Math.max(
                            0,
                            stats.hunger - effectStrength * secondsElapsed * 3,
                        );
                        modifiedStats.energy = Math.min(
                            100,
                            stats.energy + effectStrength * secondsElapsed * 0.5,
                        );
                        break;
                    case "PLAYING":
                        modifiedStats.boredom = Math.max(
                            0,
                            stats.boredom - effectStrength * secondsElapsed * 2,
                        );
                        modifiedStats.happiness = Math.min(
                            100,
                            stats.happiness + effectStrength * secondsElapsed * 1.5,
                        );
                        break;
                    case "WORKING":
                        modifiedStats.money = Math.min(
                            100,
                            stats.money + effectStrength * secondsElapsed * 1.5,
                        );
                        modifiedStats.stress = Math.min(
                            100,
                            stats.stress + effectStrength * secondsElapsed * 0.8,
                        );
                        break;
                    case "EXERCISING":
                        modifiedStats.health = Math.min(
                            100,
                            stats.health + effectStrength * secondsElapsed,
                        );
                        modifiedStats.energy = Math.max(
                            0,
                            stats.energy - effectStrength * secondsElapsed * 0.5,
                        );
                        break;
                    default:
                        // WANDERING or other activities
                        modifiedStats.boredom = Math.max(
                            0,
                            stats.boredom - effectStrength * secondsElapsed * 0.5,
                        );
                        break;
                    }

                    return modifiedStats;
                },
            },
            resonanceCalculator: {
                calculateProximityResonanceChange: (
                    _myPosition: { x: number; y: number },
                    _partnerPosition: { x: number; y: number },
                    _myStats: EntityStats,
                    _partnerStats: EntityStats,
                    _currentResonance: number,
                    _deltaTime: number,
                ) => ({
                    resonanceChange: 0,
                    closeness: 0,
                    effect: "none",
                }),
                calculateResonanceModifiers: (
                    _resonance: number,
                    _closeness: number,
                ) => ({
                    happinessMultiplier: 1,
                    energyMultiplier: 1,
                    healthMultiplier: 1,
                    lonelinessPenalty: 0,
                }),
            },
            aiDecisionEngine: {
                makeIntelligentDecision: () => "rest" as ActivityType,
            },
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
        timing: { mainGameLogic: 800 },
    };

    logger: ILogger = {
        info: () => {
            // No-op logger for production
        },
        warn: () => {
            // No-op logger for production
        },
        error: () => {
            // No-op logger for production
        },
        debug: () => {
            // No-op logger for production
        },
    };

    activityCalculator: IActivityCalculator = {
        applyHybridDecay: (stats) => stats,
        applySurvivalCosts: (stats) => stats,
        applyActivityEffectsWithTimeModifiers: (_activity, stats) => stats,
    };

    resonanceCalculator: IResonanceCalculator = {
        calculateProximityResonanceChange: () => ({
            resonanceChange: 0,
            closeness: 0,
            effect: "neutral",
        }),
        calculateResonanceModifiers: () => ({
            happinessMultiplier: 1,
            energyMultiplier: 1,
            healthMultiplier: 1,
            lonelinessPenalty: 1,
        }),
    };

    aiDecisionEngine: IAIDecisionEngine = {
        makeIntelligentDecision: (entity) => entity.activity,
    };
}
