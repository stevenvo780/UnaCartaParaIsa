/*\n * Documentación científica (resumen):\n * - Sigmoide: s(x,k)=1/(1+e^{-k·x}) para mapear armonía a [0,1].\n * - Decaimiento exponencial: e^{-λ·x} para atenuar distancia/tiempo.\n * - Normalización log: log(1 + d/D)/log(2) evita saturación a largas distancias.\n * - Cercanía logística centrada en d0 con escala s: 1/(1+e^{(dist-d0)/s}).\n * - ΔResonancia = (ganancia − separación − estrés)·(Δt/1000), acotada con clamp y redondeo preciso.\n */
/**
 * Sistema de cálculos de resonancia matemática entre entidades
 * Migrado de Dúo Eterno - preserva exactitud científica
 */

import { logAutopoiesis } from "./logger";

export const PRECISION_CONSTANTS = {
  HIGH_PRECISION_EPSILON: 1e-12,
  EFFECTIVE_ZERO: 1e-10,
  GOLDEN_RATIO_CONJUGATE: 0.6180339887498948,
  PI_HALF: Math.PI / 2,
  E_INVERSE: 1 / Math.E,
} as const;

/**
 * Redondeo de alta precisión SIN sesgo epsilon
 */
export const preciseRound = (value: number, decimals = 6): number => {
  if (!isFinite(value)) return value;

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Comparación de números con tolerancia mejorada
 */
export const areEqual = (
  a: number,
  b: number,
  epsilon: number = PRECISION_CONSTANTS.HIGH_PRECISION_EPSILON,
): boolean => {
  if (a === b) return true;

  const diff = Math.abs(a - b);

  if (
    Math.abs(a) < PRECISION_CONSTANTS.EFFECTIVE_ZERO &&
    Math.abs(b) < PRECISION_CONSTANTS.EFFECTIVE_ZERO
  ) {
    return diff <= epsilon;
  }

  const maxValue = Math.max(Math.abs(a), Math.abs(b));
  return diff <= epsilon * maxValue;
};

/**
 * Clamp seguro con mejor manejo de edge cases
 */
export const safeClamp = (value: number, min: number, max: number): number => {
  if (!isFinite(min) || !isFinite(max)) {
    logAutopoiesis.warn("safeClamp: límites no finitos", { min, max });
    return isFinite(value) ? value : 0;
  }

  if (min > max) {
    [min, max] = [max, min];
  }

  if (!isFinite(value)) {
    return (min + max) / 2;
  }

  return Math.max(min, Math.min(max, value));
};

/**
 * Validador robusto de números
 */
export const validateNumber = (
  value: number,
  paramName: string,
  options: {
    allowNegative?: boolean;
    maxAbsValue?: number;
    minValue?: number;
    maxValue?: number;
  } = {},
): boolean => {
  if (!isFinite(value)) {
    logAutopoiesis.warn("Valor no finito", { paramName, value });
    return false;
  }

  if (!options.allowNegative && value < 0) {
    logAutopoiesis.warn("Valor negativo no permitido", { paramName, value });
    return false;
  }

  if (options.maxAbsValue && Math.abs(value) > options.maxAbsValue) {
    logAutopoiesis.warn("Valor absoluto excede límite", {
      paramName,
      value,
      maxAbsValue: options.maxAbsValue,
    });
    return false;
  }

  if (options.minValue !== undefined && value < options.minValue) {
    logAutopoiesis.warn("Valor menor al mínimo", {
      paramName,
      value,
      minValue: options.minValue,
    });
    return false;
  }

  if (options.maxValue !== undefined && value > options.maxValue) {
    logAutopoiesis.warn("Valor mayor al máximo", {
      paramName,
      value,
      maxValue: options.maxValue,
    });
    return false;
  }

  return true;
};

/**
 * Funciones de interpolación y suavizado
 */
export const easingFunctions = {
  sigmoid: (x: number, steepness = 1): number => {
    return 1 / (1 + Math.exp(-steepness * x));
  },

  exponentialDecay: (x: number, rate = 1): number => {
    return Math.exp(-rate * x);
  },

  logarithmicGrowth: (x: number, base: number = Math.E): number => {
    return Math.log(1 + x) / Math.log(base);
  },
};

/**
 * Calcula la resonancia entre dos entidades basada en distancia y armonía
 * @param entityDistance Distancia euclidiana entre entidades
 * @param harmonyLevel Nivel de armonía (0-100)
 * @param timeBonus Bonus temporal opcional
 * @param baseResonance Resonancia base (default: 50)
 * @returns Valor de resonancia (0-100)
 */
export const calculateResonance = (
  entityDistance: number,
  harmonyLevel: number,
  timeBonus = 0,
  baseResonance = 50,
): number => {
  if (
    !validateNumber(entityDistance, "entityDistance", { allowNegative: false })
  ) {
    return 0;
  }

  if (
    !validateNumber(harmonyLevel, "harmonyLevel", {
      allowNegative: false,
      maxAbsValue: 100,
    })
  ) {
    harmonyLevel = safeClamp(harmonyLevel, 0, 100);
  }

  if (
    !validateNumber(baseResonance, "baseResonance", {
      allowNegative: false,
      maxAbsValue: 100,
    })
  ) {
    baseResonance = 50;
  }

  const maxDistance = 500;
  const normalizedDistance =
    Math.log(1 + entityDistance / maxDistance) / Math.log(2);

  const proximityFactor = Math.exp(-normalizedDistance * 2);

  const harmonyFactor = easingFunctions.sigmoid(harmonyLevel / 100, 6);

  const timeFactor = timeBonus > 0 ? Math.exp(-timeBonus / 5000) * 15 : 0;

  const resonanceRaw =
    baseResonance +
    proximityFactor * 25 * PRECISION_CONSTANTS.GOLDEN_RATIO_CONJUGATE +
    harmonyFactor * 20 +
    timeFactor;

  return preciseRound(safeClamp(resonanceRaw, 0, 100), 3);
};

/**
 * Calcula la fuerza de unión (bonding) entre entidades
 * @param distance Distancia entre entidades
 * @param bondDistance Distancia óptima de unión
 * @param distanceScale Escala de influencia de la distancia
 * @returns Factor de cercanía (0-1)
 */
export const calculateCloseness = (
  distance: number,
  bondDistance = 150,
  distanceScale = 50,
): number => {
  if (!validateNumber(distance, "distance", { allowNegative: false })) {
    return 0;
  }

  return 1 / (1 + Math.exp((distance - bondDistance) / distanceScale));
};

/**
 * Calcula modificadores de resonancia basados en proximidad
 * @param isaEntity Entidad Isa
 * @param stevEntity Entidad Stev
 * @param currentResonance Resonancia actual
 * @returns Cambio en resonancia por segundo
 */
export const calculateProximityResonanceChange = (
  isaPosition: { x: number; y: number },
  stevPosition: { x: number; y: number },
  isaStats: { happiness: number; energy: number; health: number },
  stevStats: { happiness: number; energy: number; health: number },
  currentResonance: number,
  deltaTime: number,
): {
  resonanceChange: number;
  effect: "BONDING" | "SEPARATION" | "NEUTRAL";
  closeness: number;
} => {
  const distance = Math.sqrt(
    Math.pow(isaPosition.x - stevPosition.x, 2) +
      Math.pow(isaPosition.y - stevPosition.y, 2),
  );

  const closeness = calculateCloseness(distance);

  const isaMood = (isaStats.happiness + isaStats.energy + isaStats.health) / 3;
  const stevMood =
    (stevStats.happiness + stevStats.energy + stevStats.health) / 3;
  const moodBonus = (isaMood + stevMood) / 200;

  const statDifference = Math.abs(isaMood - stevMood);
  const synergy = Math.max(0, 1 - statDifference / 100);

  const BOND_GAIN_PER_SEC = 2.5;
  const SEPARATION_DECAY = 1.8;
  const STRESS_DECAY = 0.7;

  const gain =
    BOND_GAIN_PER_SEC *
    closeness *
    moodBonus *
    synergy *
    (1 - currentResonance / 100);

  const separation =
    SEPARATION_DECAY * (1 - closeness) * (currentResonance / 100);

  const criticalStatsCount = [isaStats, stevStats].reduce((count, stats) => {
    return count + Object.values(stats).filter((stat) => stat < 20).length;
  }, 0);
  const stress = STRESS_DECAY * criticalStatsCount * (currentResonance / 100);

  const resonanceChange = (gain - separation - stress) * (deltaTime / 1000);

  let effect: "BONDING" | "SEPARATION" | "NEUTRAL";
  if (resonanceChange > 0.1) {
    effect = "BONDING";
  } else if (resonanceChange < -0.1) {
    effect = "SEPARATION";
  } else {
    effect = "NEUTRAL";
  }

  return {
    resonanceChange: preciseRound(resonanceChange, 4),
    effect,
    closeness: preciseRound(closeness, 3),
  };
};

/**
 * Calcula modificadores de estadísticas basados en resonancia
 * @param resonance Nivel de resonancia actual (0-100)
 * @param proximity Factor de proximidad (0-1)
 * @returns Multiplicadores para diferentes estadísticas
 */
export const calculateResonanceModifiers = (
  resonance: number,
  proximity: number,
): {
  happinessMultiplier: number;
  energyMultiplier: number;
  healthMultiplier: number;
  lonelinessPenalty: number;
} => {
  const resonanceNormalized = safeClamp(resonance, 0, 100) / 100;
  const proximityNormalized = safeClamp(proximity, 0, 1);

  const effectStrength = resonanceNormalized * proximityNormalized;

  return {
    happinessMultiplier: 1 + effectStrength * 0.3,
    energyMultiplier: 1 + effectStrength * 0.2,
    healthMultiplier: 1 + effectStrength * 0.15,
    lonelinessPenalty: 1 - effectStrength * 0.5,
  };
};

export const resonanceUtils = {
  preciseRound,
  areEqual,
  safeClamp,
  validateNumber,
  calculateResonance,
  calculateCloseness,
  calculateProximityResonanceChange,
  calculateResonanceModifiers,
  easingFunctions,
};
