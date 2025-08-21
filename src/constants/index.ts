/** Constantes centrales del juego organizadas por categoría */

export const MATH = {
  PI: Math.PI,
  EULER: Math.E,
  LN_2: Math.LN2,
  SQRT_2: Math.SQRT2,
  SQRT_1_2: Math.SQRT1_2,

  GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
  GOLDEN_RATIO_CONJUGATE: (Math.sqrt(5) - 1) / 2,

  HIGH_PRECISION_EPSILON: Number.EPSILON,
  ULTRA_PRECISION_EPSILON: 1e-15,
  EFFECTIVE_ZERO: 1e-10,
} as const;

export const TIMING = {
  NATURAL_CYCLE_MS: 1000,
  BREATHING_CYCLE_MS: 4000,
  ATTENTION_SPAN_MS: 90000,

  MAIN_GAME_LOGIC: 3000,
  DEGRADATION_UPDATE: 5000,
  MOVEMENT_UPDATE: 32,
  UI_UPDATE: 200,
  BATCH_FLUSH: 200,
  CLEANUP: 120000,

  main: 3000,
  degradation: 5000,
  movement: 32,
  ui: 200,
  entityMovementSpeed: 32,

  SPEED_MULTIPLIERS: {
    PAUSED: 0,
    ULTRA_SLOW: 0.1,
    SLOW: 0.5,
    NORMAL: 1.0,
    FAST: 2.0,
    ULTRA_FAST: 5.0,
    INSTANT: 20.0,
  },
} as const;

export const SURVIVAL = {
  CRITICAL_THRESHOLDS: {
    HEALTH: 10,
    HUNGER: 20,
    ENERGY: 15,
    HAPPINESS: 10,
    SLEEPINESS: 80,
    BOREDOM: 80,
    LONELINESS: 70,
  },

  DEGRADATION_RATES: {
    HUNGER: 0.08,
    ENERGY: 0.05,
    HAPPINESS: 0.03,
    SLEEPINESS: 0.04,
    BOREDOM: 0.06,
    LONELINESS: 0.02,
    HEALTH: 0.01,
  },

  LIVING_COSTS: {
    BASIC: 1.5,
    ACTIVITY: 0.5,
    LUXURY: 2.0,
  },

  ACTIVITY_MULTIPLIERS: {
    RESTING: 0.3,
    SLEEPING: 0.1,
    EATING: 0.8,
    MEDITATING: 0.4,
    READING: 1.0,
    EXERCISING: 1.8,
    SOCIALIZING: 0.9,
    WORKING: 1.3,
    PLAYING: 0.7,
  },

  RECOVERY_RATES: {
    EATING_HUNGER: 8.0,
    SLEEPING_ENERGY: 6.0,
    SOCIALIZING_LONELINESS: 4.0,
    RESTING_ALL: 1.5,
    MEDITATING_HAPPINESS: 3.0,
  },
} as const;

export const PHYSICS = {
  BASE_MOVEMENT_SPEED: 84,
  MAX_SPEED: 120,
  ACCELERATION: 50,
  FRICTION: 0.95,

  ENTITY_RADIUS: 15,
  PERSONAL_SPACE: 40,
  INTERACTION_DISTANCE: 80,
  ZONE_TRANSITION_DISTANCE: 20,

  PATHFINDING: {
    GRID_SIZE: 20,
    MAX_PATH_LENGTH: 50,
    RECALCULATION_THRESHOLD: 30,
    OBSTACLE_AVOIDANCE_DISTANCE: 60,
    WANDER_RADIUS: 100,
  },

  STEERING_WEIGHTS: {
    SEEK: 1.0,
    AVOID: 2.0,
    SEPARATE: 1.5,
    WANDER: 0.5,
  },
} as const;

export const ACTIVITIES = {
  TYPES: [
    "RESTING",
    "MEDITATING",
    "SOCIALIZING",
    "WORKING",
    "EXERCISING",
    "WANDERING",
    "WRITING",
    "EXPLORING",
    "CONTEMPLATING",
    "DANCING",
    "HIDING",
    "SHOPPING",
    "COOKING",
  ] as const,

  OPTIMAL_DURATION: {
    RESTING: 180000,
    MEDITATING: 300000,
    SOCIALIZING: 360000,
    WORKING: 1200000,
    EXERCISING: 240000,
    WANDERING: 120000,
    WRITING: 600000,
    EXPLORING: 300000,
    CONTEMPLATING: 480000,
    DANCING: 180000,
    HIDING: 240000,
    SHOPPING: 120000,
    COOKING: 180000,
  },

  EFFECTS: {
    RESTING: { energy: 2, happiness: 1, sleepiness: -1 },
    MEDITATING: { happiness: 3, loneliness: -1, boredom: -2 },
    SOCIALIZING: { loneliness: -4, happiness: 3, boredom: -2 },
    WORKING: { boredom: 1, energy: -1, happiness: -0.5 },
    EXERCISING: { energy: -2, happiness: 2, health: 2, hunger: 1 },
    WANDERING: { boredom: -1, energy: -0.5, happiness: 1 },
    WRITING: { boredom: -2, happiness: 1, loneliness: 1 },
    EXPLORING: { boredom: -3, energy: -1, happiness: 2 },
    CONTEMPLATING: { happiness: 2, loneliness: -2, boredom: -1 },
    DANCING: { happiness: 4, boredom: -3, energy: -1.5 },
    HIDING: { loneliness: 2, happiness: -1, energy: 0.5 },
    SHOPPING: { happiness: 2, boredom: -1, money: -1 },
    COOKING: { hunger: -4, happiness: 1, boredom: -1 },
  },

  PREFERRED_ZONES: {
    RESTING: "rest",
    MEDITATING: "comfort",
    SOCIALIZING: "social",
    WORKING: "work",
    EXERCISING: "play",
    WANDERING: "play",
    WRITING: "comfort",
    EXPLORING: "play",
    CONTEMPLATING: "comfort",
    DANCING: "social",
    HIDING: "comfort",
    SHOPPING: "work",
    COOKING: "food",
  },
} as const;

export const ACTIVITY_TYPES = ACTIVITIES.TYPES;

export const MOVEMENT_CONFIG = {
  ENTITY_SIZE: 32,
  MIN_DISTANCE_BETWEEN_ENTITIES: 50,
  COMPANION_SEEK_DISTANCE: 200,
  REPULSION_FORCE: 2,
} as const;

export const NEED_TO_ZONE_MAPPING = {
  hunger: "kitchen",
  thirst: "kitchen",
  energy: "bedroom",
  sleepiness: "bedroom",
  social: "living",
  entertainment: "living",
  loneliness: "social",
  happiness: "play",
  boredom: "recreation",
  money: "work",
  health: "bedroom",
} as const;

export const RESONANCE_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
} as const;

export type ZoneType =
  | "kitchen"
  | "bedroom"
  | "living"
  | "bathroom"
  | "outdoor";

export type EntityStateType =
  | "idle"
  | "moving"
  | "interacting"
  | "resting"
  | "seeking";

export const {
  MAIN_GAME_LOGIC,
  DEGRADATION_UPDATE,
  NATURAL_CYCLE_MS,
  BREATHING_CYCLE_MS,
  ATTENTION_SPAN_MS,
} = TIMING;
