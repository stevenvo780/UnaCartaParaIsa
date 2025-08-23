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

export const GAME_BALANCE = {
  CYCLE_LOG_FREQUENCY: 50,
  UI_UPDATE_INTERVAL: 200,
  DIALOGUE_CHECK_INTERVAL: 12000,
  DIALOGUE_VARIATION: 10000,

  WORLD: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
  },

  VISUALS: {
    ENTITY_SCALE: 2.0, // Cambiado de 1.5 a 2.0 para evitar desalineación de píxeles
    TILE_SIZE: 64,
    ENTITY_DEPTH: 10,
    ZONE_DEPTH: 2,
    UI_DEPTH: 1000,
    BASE_PULSE_SCALE: 2.0, // Ajustado para mantener coherencia
    PULSE_AMPLITUDE: 0.1,
    PULSE_SPEED: 0.1,
  },

  RESONANCE: {
    BAR_SCALE: 2,
    BAR_WIDTH: 200,
    BAR_HEIGHT: 20,
    THRESHOLD_HIGH: 50,
    THRESHOLD_MEDIUM: 25,
    COLOR_HIGH: 0x27ae60,
    COLOR_MEDIUM: 0xf39c12,
    COLOR_LOW: 0xe74c3c,
  },

  SPRITES: {
    ENTITY_SIZE: 32,
    ANIMATION_DURATION: 300,
    FADE_DURATION: 500,
    TWEEN_EASE: "Back.easeOut",
    TWEEN_EASE_IN: "Back.easeIn",
  },

  MOVEMENT: {
    DIRECTION_CHANGE_PROBABILITY: 0.15,
    ENTITY_COLLISION_RADIUS: 15,
    SQUARE_ENTITY_SIZE: 30,
  },

  EFFECTS: {
    MIN_ALPHA: 0.5,
    MAX_ALPHA: 1.0,
    HEALTH_ALPHA_FACTOR: 0.5,
    DYING_THRESHOLD: 20,
    SAD_THRESHOLD: 50,
    LOW_HEALTH_THRESHOLD: 15,
  },

  ZONES: {
    DEFAULT_ALPHA: 0.25,
    STROKE_ALPHA: 0.8,
    STROKE_WIDTH: 2,
    CORNER_RADIUS: 10,
    DEPTH: 2,
    FOOD_COLOR: 0x27ae60,
    REST_COLOR: 0x2980b9,
    PLAY_COLOR: 0xe74c3c,
    SOCIAL_COLOR: 0x3498db,
  },

  UI: {
    BACKGROUND_ALPHA: 0.7,
    PANEL_WIDTH: 300,
    PANEL_HEIGHT: 120,
    TEXT_MARGIN: 10,
    DEBUG_BUTTON_WIDTH: 40,
    DEBUG_BUTTON_SPACING: 40,
    DEBUG_SPEEDS: [0.5, 1.0, 2.0, 5.0, 10.0],
  },

  DIALOGUE: {
    BUBBLE_WIDTH: 240,
    BUBBLE_HEIGHT: 60,
    BUBBLE_OFFSET_Y: -60,
    BUBBLE_RADIUS: 10,
    BUBBLE_ALPHA: 0.9,
    TAIL_SIZE: 8,
    DEFAULT_DURATION: 4000,
    INTERACTION_DURATION: 3500,
    ANIMATION_DURATION: 300,
    ISA_COLOR: 0x8e44ad,
    STEV_COLOR: 0x2980b9,
    TEXT_STROKE: 2,
    MAX_TEXT_LENGTH: 80,
    WRAP_WIDTH: 220,
  },

  DECORATIONS: {
    CAMPFIRE_SCALE: 1.2,
    FLOWERS_SCALE: 1.2,
    DECORATION_DEPTH: 1,
  },

  MAP_GENERATION: {
    MIN_ZONES: 4,
    MIN_ELEMENTS: 8,
    ZONE_VARIATION_FACTOR: 0.3,
    MIN_ZONE_SIZE: 100,
    MIN_ELEMENTS_COUNT: 5,
  },

  PERFORMANCE: {
    LOG_SAMPLING_RATE: 0.1,
    CLEANUP_INTERVAL: 60000,
    BATCH_SIZE: 20,
    THROTTLE_THRESHOLD: 16.67,
  },

  FOOD: {
    MAX_INVENTORY_CAPACITY: 20,
    EXPIRY_WARNING_THRESHOLD: 0.8,
    STORE_SCALE: 0.8,
    FOOD_SPRITE_SCALE: 0.5,
    FOOD_SPRITE_ALPHA: 0.8,
    FOOD_EFFECT_DURATION: 800,
    ANIMATION_DELAY_STEP: 200,
    POSITION_VARIATION: 10,
    STRESS_INCREASE: 2,
    HAPPINESS_BONUS: 5,
    MAX_STAT_VALUE: 100,
  },

  MAGIC_NUMBERS: {
    ANIMATION_SCALE_SMALL: 0.2,
    POSITION_OFFSET_SMALL: 10,
    POSITION_OFFSET_MEDIUM: 20,
    POSITION_OFFSET_LARGE: 30,
    POSITION_OFFSET_XL: 50,
    DURATION_SHORT: 200,
    DURATION_MEDIUM: 800,
    VARIATION_RANGE: 10,
  },
} as const;

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
