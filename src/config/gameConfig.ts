/**
 * 🎮 CONFIGURACIÓN ÚNICA DEL JUEGO - CONSOLIDADA
 *
 * Fuente única de verdad que reemplaza:
 * ❌ balancedGameplay.ts
 * ❌ unifiedGameConfig.ts (parcialmente)
 * ❌ Múltiples archivos de constantes duplicados
 *
 * Organizada por categorías lógicas para máximo mantenimiento
 */

import { TIMING, SURVIVAL, PHYSICS } from "../constants";
import { logAutopoiesis } from "../utils/logger";

export interface GameConfig {
  gameSpeedMultiplier: number;
  debugMode: boolean;
  targetFPS: number;

  timing: {
    mainGameLogic: number;
    degradation: number;
    batchFlush: number;
    cleanup: number;
    gameSpeedMultiplier: number;
  };

  survival: {
    degradationRates: {
      hunger: number;
      energy: number;
      happiness: number;
      sleepiness: number;
      boredom: number;
      loneliness: number;
    };
    criticalThresholds: {
      hunger: number;
      energy: number;
      health: number;
    };
    livingCosts: {
      basic: number;
      activity: number;
      luxury: number;
    };
    recovery: {
      restingBonus: number;
      eatingEfficiency: number;
      socialBonus: number;
    };
  };

  movement: {
    baseSpeed: number;
    maxSpeed: number;
    acceleration: number;
    friction: number;
    avoidanceDistance: number;
    wanderRadius: number;
  };

  resonance: {
    maxDistance: number;
    decayRate: number;
    harmonyBonus: number;
    activitySyncBonus: number;
    proximityWeight: number;
  };

  ai: {
    personalityInfluence: number;
    activityInertiaBonus: number;
    moodInfluenceStrength: number;
    softmaxTau: number;
    decisionChangeThreshold: number;
  };

  zones: {
    effectivenessMultiplier: number;
    transitionSmoothness: number;
    bonusDecayRate: number;
  };

  ui: {
    dialogueDuration: number;
    animationSpeed: number;
    maxLogEntries: number;
    statUpdateFrequency: number;
    dialogueInitiationChance: number;
    dialogueConversationTimeout: number;
    dialogueResponseDelay: number;
  };

  performance: {
    maxEntities: number;
    cullingDistance: number;
    batchSize: number;
    throttleThreshold: number;
  };

  entityCircleInitialX: number;
  entityCircleInitialY: number;
  entitySquareInitialX: number;
  entitySquareInitialY: number;
  entityInitialStats: number;
  entityInitialMoney: number;
  entityInitialHealth: number;
  initialResonance: number;

  thresholdLow: number;
  thresholdComfortable: number;
  thresholdWarning: number;

  zoneEffectivenessMultiplier: number;

  activityInertiaBonus: number;
  aiPersonalityInfluence: number;
  moodInfluenceStrength: number;
  aiSoftmaxTau: number;
}

const baseConfig: GameConfig = {
  gameSpeedMultiplier: 1.0,
  debugMode: false,
  targetFPS: 60,

  timing: {
    mainGameLogic: TIMING.MAIN_GAME_LOGIC,
    degradation: TIMING.DEGRADATION_UPDATE,
    batchFlush: 100,
    cleanup: 60000,
    gameSpeedMultiplier: 1.0,
  },

  survival: {
    degradationRates: {
      hunger: SURVIVAL.DEGRADATION_RATES.HUNGER,
      energy: SURVIVAL.DEGRADATION_RATES.ENERGY,
      happiness: SURVIVAL.DEGRADATION_RATES.HAPPINESS,
      sleepiness: SURVIVAL.DEGRADATION_RATES.SLEEPINESS,
      boredom: SURVIVAL.DEGRADATION_RATES.BOREDOM,
      loneliness: SURVIVAL.DEGRADATION_RATES.LONELINESS,
    },
    criticalThresholds: {
      hunger: SURVIVAL.CRITICAL_THRESHOLDS.HUNGER,
      energy: SURVIVAL.CRITICAL_THRESHOLDS.ENERGY,
      health: SURVIVAL.CRITICAL_THRESHOLDS.HEALTH,
    },
    livingCosts: {
      basic: SURVIVAL.LIVING_COSTS.BASIC,
      activity: SURVIVAL.LIVING_COSTS.ACTIVITY,
      luxury: SURVIVAL.LIVING_COSTS.LUXURY,
    },
    recovery: {
      restingBonus: 1.8,
      eatingEfficiency: 2.5,
      socialBonus: 1.6,
    },
  },

  movement: {
    baseSpeed: PHYSICS.BASE_MOVEMENT_SPEED,
    maxSpeed: PHYSICS.MAX_SPEED,
    acceleration: PHYSICS.ACCELERATION,
    friction: PHYSICS.FRICTION,
    avoidanceDistance: 60,
    wanderRadius: 100,
  },

  resonance: {
    maxDistance: 400,
    decayRate: 0.02,
    harmonyBonus: 1.2,
    activitySyncBonus: 1.15,
    proximityWeight: 0.6,
  },

  ai: {
    personalityInfluence: 0.3,
    activityInertiaBonus: 1.2,
    moodInfluenceStrength: 0.8,
    softmaxTau: 0.5,
    decisionChangeThreshold: 0.15,
  },

  zones: {
    effectivenessMultiplier: 1.5,
    transitionSmoothness: 0.1,
    bonusDecayRate: 0.05,
  },

  ui: {
    dialogueDuration: 3000,
    animationSpeed: 1.0,
    maxLogEntries: 100,
    statUpdateFrequency: 500,
    dialogueInitiationChance: 0.1,
    dialogueConversationTimeout: 20000,
    dialogueResponseDelay: 3000,
  },

  performance: {
    maxEntities: 10,
    cullingDistance: 1000,
    batchSize: 20,
    throttleThreshold: 16.67,
  },

  entityCircleInitialX: 200,
  entityCircleInitialY: 200,
  entitySquareInitialX: 600,
  entitySquareInitialY: 300,
  entityInitialStats: 50,
  entityInitialMoney: 50,
  entityInitialHealth: 90,
  initialResonance: 0,

  thresholdLow: 30,
  thresholdComfortable: 70,
  thresholdWarning: 25,

  zoneEffectivenessMultiplier: 1.5,

  activityInertiaBonus: 1.2,
  aiPersonalityInfluence: 0.3,
  moodInfluenceStrength: 0.8,
  aiSoftmaxTau: 0.5,
};

export const gamePresets = {
  development: {
    ...baseConfig,
    debugMode: true,
    gameSpeedMultiplier: 2.0,
    timing: {
      ...baseConfig.timing,
      gameSpeedMultiplier: 2.0,
      mainGameLogic: 400,
    },
    ui: {
      ...baseConfig.ui,
      dialogueDuration: 1000,
    },
  },

  production: {
    ...baseConfig,
    debugMode: false,
    gameSpeedMultiplier: 1.0,
    performance: {
      ...baseConfig.performance,
      maxEntities: 4,
      batchSize: 15,
    },
  },

  testing: {
    ...baseConfig,
    debugMode: true,
    gameSpeedMultiplier: 10.0,
    timing: {
      ...baseConfig.timing,
      gameSpeedMultiplier: 10.0,
      mainGameLogic: 100,
      degradation: 200,
    },
    survival: {
      ...baseConfig.survival,
      degradationRates: {
        ...baseConfig.survival.degradationRates,
        hunger: 0.8,
        energy: 0.5,
        happiness: 0.3,
        sleepiness: 0.4,
        boredom: 0.6,
        loneliness: 0.2,
      },
    },
  },
} as const;

let activeConfig: GameConfig = gamePresets.development;

export const getGameConfig = (): GameConfig => ({
  ...activeConfig,
});

export const setGameConfig = (config: Partial<GameConfig>): void => {
  activeConfig = { ...activeConfig, ...config };
  logAutopoiesis.info("🎮 Game Config Updated", config);
};

export const loadPreset = (presetName: keyof typeof gamePresets): void => {
  activeConfig = { ...gamePresets[presetName] };
  logAutopoiesis.info(`🎮 Loaded preset: ${presetName}`);
};

export const getGameIntervals = () => ({
  main: activeConfig.timing.mainGameLogic,
  degradation: activeConfig.timing.degradation,
  movement: Math.floor(1000 / activeConfig.targetFPS),
  ui: activeConfig.ui.statUpdateFrequency,
  entityMovementSpeed: 2.0,
  zoneEffectsInterval: 1000,
});

export const gameConfig = getGameConfig();
