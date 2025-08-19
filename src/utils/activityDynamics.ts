/*\n * Documentación científica (resumen):\n * - Eficiencia temporal por actividad: curva en campana por tramos alrededor de una duración óptima.\n * - Prioridad: w(v,α)=1−(v/100)^α (α∈[0.1,10]) para modelar urgencia no lineal.\n * - Decaimiento híbrido lineal estable y costes de supervivencia por minuto.\n * - Modificadores circadianos: multiplicadores nocturnos para descanso/energía.\n */
import type {
  EntityStats,
  EntityActivity,
  ActivityType,
  ZoneType,
} from '../types';
import { gameConfig } from '../config/gameConfig';

interface TimeOfDayModifiers {
  isNight: boolean;
  phase: 'dawn' | 'day' | 'dusk' | 'night';
  hour: number;
}

const ACTIVITY_OPTIMAL_DURATIONS = {
  WANDERING: 120000,
  MEDITATING: 300000,
  WRITING: 600000,
  RESTING: 180000,
  SOCIALIZING: 360000,
  EXPLORING: 300000,
  CONTEMPLATING: 480000,
  DANCING: 180000,
  HIDING: 240000,
  WORKING: 1200000,
  SHOPPING: 120000,
  EXERCISING: 240000,
  COOKING: 180000,
};

const HYBRID_DECAY_RATES = {
  base: {
    hunger: -0.08,
    energy: -0.05,
    happiness: -0.03,
    sleepiness: 0.04,
    boredom: 0.06,
    loneliness: 0.02,
    health: -0.01,
  },
};

const ACTIVITY_DECAY_MULTIPLIERS: Record<ActivityType, number> = {
  RESTING: 0.3,
  MEDITATING: 0.4,
  SOCIALIZING: 0.9,
  WORKING: 1.3,
  EXERCISING: 1.8,
  WANDERING: 0.7,
  WRITING: 1.0,
  EXPLORING: 1.2,
  CONTEMPLATING: 0.5,
  DANCING: 1.4,
  HIDING: 0.6,
  SHOPPING: 1.1,
  COOKING: 0.8,
};

const SURVIVAL_COSTS = {
  LIVING_COST: 1.5,
  CRITICAL_MONEY: 10,
};

const DECAY_CONFIG = {
  GENERAL_MULTIPLIER: 1.0,
};

const EFFICIENCY_FUNCTIONS = {
  WORKING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.WORKING;
    if (timeSpent < optimal * 0.5)
      return 0.5 + (timeSpent / (optimal * 0.5)) * 0.3;
    if (timeSpent <= optimal)
      return 0.8 + ((timeSpent - optimal * 0.5) / (optimal * 0.5)) * 0.2;
    return Math.max(0.2, 1.0 - ((timeSpent - optimal) / optimal) * 0.8);
  },

  RESTING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.RESTING;
    if (timeSpent < optimal * 0.3)
      return 0.4 + (timeSpent / (optimal * 0.3)) * 0.4;
    if (timeSpent <= optimal)
      return 0.8 + ((timeSpent - optimal * 0.3) / (optimal * 0.7)) * 0.2;
    return Math.max(0.3, 1.0 - ((timeSpent - optimal) / optimal) * 0.7);
  },

  SOCIALIZING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.SOCIALIZING;
    if (timeSpent < optimal * 0.2)
      return 0.6 + (timeSpent / (optimal * 0.2)) * 0.3;
    if (timeSpent <= optimal)
      return 0.9 + ((timeSpent - optimal * 0.2) / (optimal * 0.8)) * 0.1;
    return Math.max(0.4, 1.0 - ((timeSpent - optimal) / optimal) * 0.6);
  },

  DANCING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.DANCING;
    if (timeSpent < optimal * 0.4)
      return 0.7 + (timeSpent / (optimal * 0.4)) * 0.2;
    if (timeSpent <= optimal)
      return 0.9 + ((timeSpent - optimal * 0.4) / (optimal * 0.6)) * 0.1;
    return Math.max(0.3, 1.0 - ((timeSpent - optimal) / optimal) * 0.7);
  },

  SHOPPING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.SHOPPING;
    return timeSpent <= optimal
      ? 1.0
      : Math.max(0.2, 1.0 - ((timeSpent - optimal) / optimal) * 0.8);
  },

  COOKING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.COOKING;
    if (timeSpent < optimal * 0.3)
      return 0.5 + (timeSpent / (optimal * 0.3)) * 0.4;
    if (timeSpent <= optimal)
      return 0.9 + ((timeSpent - optimal * 0.3) / (optimal * 0.7)) * 0.1;
    return Math.max(0.4, 1.0 - ((timeSpent - optimal) / optimal) * 0.6);
  },

  EXERCISING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.EXERCISING;
    if (timeSpent < optimal * 0.5)
      return 0.6 + (timeSpent / (optimal * 0.5)) * 0.3;
    if (timeSpent <= optimal)
      return 0.9 + ((timeSpent - optimal * 0.5) / (optimal * 0.5)) * 0.1;
    return Math.max(0.2, 1.0 - ((timeSpent - optimal) / optimal) * 0.8);
  },

  MEDITATING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.MEDITATING;
    if (timeSpent < optimal * 0.6)
      return 0.4 + (timeSpent / (optimal * 0.6)) * 0.4;
    if (timeSpent <= optimal)
      return 0.8 + ((timeSpent - optimal * 0.6) / (optimal * 0.4)) * 0.2;
    return Math.max(0.5, 1.0 - ((timeSpent - optimal) / optimal) * 0.5);
  },

  WRITING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.WRITING;
    if (timeSpent < optimal * 0.4)
      return 0.5 + (timeSpent / (optimal * 0.4)) * 0.3;
    if (timeSpent <= optimal)
      return 0.8 + ((timeSpent - optimal * 0.4) / (optimal * 0.6)) * 0.2;
    return Math.max(0.4, 1.0 - ((timeSpent - optimal) / optimal) * 0.6);
  },

  WANDERING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.WANDERING;
    return timeSpent <= optimal
      ? 1.0
      : Math.max(0.5, 1.0 - ((timeSpent - optimal) / optimal) * 0.5);
  },

  EXPLORING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.EXPLORING;
    if (timeSpent < optimal * 0.3)
      return 0.6 + (timeSpent / (optimal * 0.3)) * 0.3;
    if (timeSpent <= optimal)
      return 0.9 + ((timeSpent - optimal * 0.3) / (optimal * 0.7)) * 0.1;
    return Math.max(0.3, 1.0 - ((timeSpent - optimal) / optimal) * 0.7);
  },

  CONTEMPLATING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.CONTEMPLATING;
    if (timeSpent < optimal * 0.7)
      return 0.3 + (timeSpent / (optimal * 0.7)) * 0.5;
    if (timeSpent <= optimal)
      return 0.8 + ((timeSpent - optimal * 0.7) / (optimal * 0.3)) * 0.2;
    return Math.max(0.4, 1.0 - ((timeSpent - optimal) / optimal) * 0.6);
  },

  HIDING: (timeSpent: number) => {
    const optimal = ACTIVITY_OPTIMAL_DURATIONS.HIDING;
    if (timeSpent < optimal * 0.5) return 0.7;
    if (timeSpent <= optimal)
      return 0.7 + ((timeSpent - optimal * 0.5) / (optimal * 0.5)) * 0.2;
    return Math.max(0.3, 0.9 - ((timeSpent - optimal) / optimal) * 0.6);
  },
};

export const getActivityDynamics = () => ({
  WANDERING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WANDERING },
  MEDITATING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.MEDITATING },
  WRITING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WRITING },
  RESTING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.RESTING },
  SOCIALIZING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.SOCIALIZING },
  EXPLORING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.EXPLORING },
  CONTEMPLATING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.CONTEMPLATING },
  DANCING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.DANCING },
  HIDING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.HIDING },
  WORKING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WORKING },
  SHOPPING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.SHOPPING },
  EXERCISING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.EXERCISING },
  COOKING: { optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.COOKING },
});

export const getTimeOfDayActivityModifiers = (
  timeOfDay: TimeOfDayModifiers
) => {
  const { isNight, phase, hour } = timeOfDay;

  return {
    RESTING: {
      efficiencyMultiplier: isNight ? 1.8 : 1.0,
      energyRecoveryBonus: isNight ? 1.5 : 1.0,
      sleepinessRecoveryBonus: isNight ? 2.0 : 0.8,
      deepSleepBonus: hour >= 1 && hour <= 5 ? 1.3 : 1.0,
    },
    SOCIALIZING: {
      efficiencyMultiplier: isNight ? 1.2 : 1.0,
      moodBonus: isNight ? 1.3 : 1.0,
    },
    MEDITATING: {
      efficiencyMultiplier: phase === 'night' || phase === 'dawn' ? 1.4 : 1.0,
    },
    CONTEMPLATING: {
      efficiencyMultiplier: isNight ? 1.5 : 1.0,
    },
  };
};

export const ACTIVITY_EFFECTS: Record<
  ActivityType,
  {
    immediate: Record<string, number>;
    perMinute: Record<string, number>;
    cost?: Record<string, number>;
    minDuration: number;
    optimalDuration: number;
    efficiencyOverTime: (timeSpent: number) => number;
    resultingMood: string;
  }
> = {
  WORKING: {
    immediate: { money: 10, energy: -0.3 },
    perMinute: { money: 5, energy: -2, boredom: -3, hunger: -1 },
    minDuration: 60000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WORKING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.WORKING,
    resultingMood: 'TIRED',
  },

  RESTING: {
    immediate: { sleepiness: -0.2, energy: 0.15 },
    perMinute: { sleepiness: -15, energy: 8, hunger: -1 },
    minDuration: 45000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.RESTING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.RESTING,
    resultingMood: 'CALM',
  },

  SOCIALIZING: {
    immediate: { loneliness: 0.2, happiness: 0.1 },
    perMinute: { loneliness: 20, happiness: 8, energy: -3, hunger: -2 },
    minDuration: 20000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.SOCIALIZING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.SOCIALIZING,
    resultingMood: 'HAPPY',
  },

  DANCING: {
    immediate: { boredom: 0.2, happiness: 0.15, energy: -0.05 },
    perMinute: { boredom: 25, happiness: 15, energy: -5, hunger: -4 },
    minDuration: 15000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.DANCING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.DANCING,
    resultingMood: 'EXCITED',
  },

  SHOPPING: {
    immediate: { happiness: 0.2 },
    perMinute: { happiness: 10, hunger: 8, boredom: 5 },
    cost: { money: 5 },
    minDuration: 10000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.SHOPPING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.SHOPPING,
    resultingMood: 'CONTENT',
  },

  COOKING: {
    immediate: { boredom: 0.05 },
    perMinute: { hunger: 20, happiness: 5, energy: -3 },
    cost: { money: 3 },
    minDuration: 25000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.COOKING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.COOKING,
    resultingMood: 'CONTENT',
  },

  EXERCISING: {
    immediate: { energy: -0.2, boredom: 0.1 },
    perMinute: { energy: -10, boredom: 8, happiness: 6, hunger: -6 },
    minDuration: 30000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.EXERCISING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.EXERCISING,
    resultingMood: 'EXCITED',
  },

  MEDITATING: {
    immediate: { happiness: 0.05, loneliness: -0.03 },
    perMinute: { happiness: 8, loneliness: -3, sleepiness: -5, boredom: 3 },
    minDuration: 60000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.MEDITATING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.MEDITATING,
    resultingMood: 'CALM',
  },

  WRITING: {
    immediate: { boredom: 0.15, loneliness: -0.05 },
    perMinute: { boredom: 15, happiness: 5, loneliness: -4, energy: -2 },
    minDuration: 45000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WRITING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.WRITING,
    resultingMood: 'CONTENT',
  },

  WANDERING: {
    immediate: { boredom: 0.04, loneliness: -0.02 },
    perMinute: { boredom: 5, energy: -2, happiness: 2 },
    minDuration: 15000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.WANDERING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.WANDERING,
    resultingMood: 'CALM',
  },

  EXPLORING: {
    immediate: { boredom: 0.2, energy: -0.1 },
    perMinute: { boredom: 18, energy: -6, happiness: 8, hunger: -3 },
    minDuration: 30000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.EXPLORING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.EXPLORING,
    resultingMood: 'EXCITED',
  },

  CONTEMPLATING: {
    immediate: { boredom: 0.08, loneliness: -0.05 },
    perMinute: { boredom: 8, happiness: 4, loneliness: -5, energy: 1 },
    minDuration: 90000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.CONTEMPLATING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.CONTEMPLATING,
    resultingMood: 'CALM',
  },

  HIDING: {
    immediate: { loneliness: -0.2 },
    perMinute: { loneliness: -15, happiness: -5, energy: 3 },
    minDuration: 30000,
    optimalDuration: ACTIVITY_OPTIMAL_DURATIONS.HIDING,
    efficiencyOverTime: EFFICIENCY_FUNCTIONS.HIDING,
    resultingMood: 'ANXIOUS',
  },
};

export const mapActivityToPreferredZone = (
  activity: EntityActivity
): ZoneType | null => {
  switch (activity) {
    case 'RESTING':
      return 'rest';
    case 'SOCIALIZING':
    case 'DANCING':
      return 'social';
    case 'EXERCISING':
    case 'WANDERING':
    case 'EXPLORING':
      return 'play';
    case 'WORKING':
      return 'work';
    case 'COOKING':
      return 'food';
    case 'SHOPPING':
      return 'work';
    case 'MEDITATING':
    case 'CONTEMPLATING':
    case 'WRITING':
      return 'comfort';
    case 'HIDING':
      return 'comfort';
    default:
      return null;
  }
};

export const calculateActivityPriority = (
  activity: EntityActivity,
  currentStats: EntityStats,
  timeSpentInActivity = 0
): number => {
  /**
   * Resumen matemático: combina urgencias no lineales por estadística con
   * w(v, α) = 1 − (v/100)^α (α∈[0.1,10]) y una eficiencia temporal tipo “campana”
   * centrada en optimalDuration. Penaliza sobretiempo > 1.5·optimalDuration.
   */
  const effects = ACTIVITY_EFFECTS[activity];
  if (!effects) {
    console.warn(`No effects found for activity: ${activity}`);
    return 0;
  }

  let priority = 0;

  const w = (v: number, alpha = 1.6) => {
    if (!isFinite(v) || !isFinite(alpha)) return 0;
    const clampedV = Math.min(100, Math.max(0, v));
    const clampedAlpha = Math.max(0.1, Math.min(10, alpha));
    const base = clampedV / 100;
    const result = Math.pow(base, clampedAlpha);
    return isFinite(result) ? Math.max(0, Math.min(1, 1 - result)) : 0;
  };

  if (activity === 'WORKING') {
    priority += w(currentStats.money) * 100;
    priority -= w(100 - currentStats.energy) * 30;
  }

  if (activity === 'SHOPPING') {
    const costMoney = effects.cost?.money ?? 0;
    if (currentStats.money > costMoney) {
      const needLevel = (w(currentStats.hunger) + w(currentStats.boredom)) / 2;
      priority += needLevel * 100 * 0.8;
    } else {
      priority = 0;
    }
  }

  if (activity === 'RESTING') {
    priority +=
      Math.max(0, currentStats.sleepiness - 30) * 1.2 +
      w(100 - currentStats.energy) * 80;
  }

  if (activity === 'COOKING') {
    const costMoney = effects.cost?.money ?? 0;
    if (currentStats.money >= costMoney) {
      priority += w(currentStats.hunger) * 100 * 0.9;
    }
  }

  if (activity === 'SOCIALIZING') {
    priority += w(currentStats.loneliness) * 100 * 1.1;
  }

  if (activity === 'DANCING' || activity === 'EXERCISING') {
    priority += w(currentStats.boredom) * 100 * 0.9;
    priority -= w(100 - currentStats.energy) * 50;
  }

  const efficiency = effects.efficiencyOverTime
    ? effects.efficiencyOverTime(timeSpentInActivity)
    : 0.5;
  priority *= efficiency;

  if (
    effects.optimalDuration &&
    isFinite(timeSpentInActivity) &&
    isFinite(effects.optimalDuration) &&
    timeSpentInActivity > effects.optimalDuration * 1.5
  ) {
    priority *= 0.5;
  }

  return isFinite(priority) ? Math.max(0, priority) : 0;
};

export const applyHybridDecay = (
  currentStats: EntityStats,
  activity: EntityActivity,
  deltaTimeMs: number
): EntityStats => {
  const newStats = { ...currentStats };

  if (!isFinite(deltaTimeMs) || deltaTimeMs < 0) {
    return newStats;
  }

  const safeTimeMultiplier =
    Math.min(10, deltaTimeMs / 1000) * gameConfig.gameSpeedMultiplier;
  const decayMultiplier = ACTIVITY_DECAY_MULTIPLIERS[activity] ?? 1.0;

  Object.entries(HYBRID_DECAY_RATES.base).forEach(([statName, baseRate]) => {
    if (statName in newStats) {
      const finalRate = baseRate * decayMultiplier;
      const configuredRate =
        finalRate * DECAY_CONFIG.GENERAL_MULTIPLIER * safeTimeMultiplier;
      const statKey = statName as keyof EntityStats;

      let newValue = newStats[statKey] + configuredRate;

      if (statKey === 'money') {
        newValue = Math.max(0, newValue);
      } else {
        newValue = Math.max(0, Math.min(100, newValue));
      }

      newStats[statKey] = isFinite(newValue) ? newValue : newStats[statKey];
    }
  });

  return newStats;
};

export const applySurvivalCosts = (
  currentStats: EntityStats,
  deltaTimeMs: number
): EntityStats => {
  const newStats = { ...currentStats };
  const minutesElapsed = (deltaTimeMs / 60000) * gameConfig.gameSpeedMultiplier;

  newStats.money = Math.max(
    0,
    newStats.money - SURVIVAL_COSTS.LIVING_COST * minutesElapsed
  );

  if (newStats.money < SURVIVAL_COSTS.CRITICAL_MONEY) {
    const desperation =
      (SURVIVAL_COSTS.CRITICAL_MONEY - newStats.money) /
      SURVIVAL_COSTS.CRITICAL_MONEY;
    newStats.hunger = Math.max(
      0,
      newStats.hunger - desperation * 5 * minutesElapsed
    );
    newStats.happiness = Math.max(
      0,
      newStats.happiness - desperation * 3 * minutesElapsed
    );
  }

  return newStats;
};

export const applyActivityEffectsWithTimeModifiers = (
  activity: EntityActivity,
  currentStats: EntityStats,
  deltaTimeMs: number,
  timeOfDay: TimeOfDayModifiers
): EntityStats => {
  const newStats = { ...currentStats };
  const effects = ACTIVITY_EFFECTS[activity];

  if (effects) {
    const minutesElapsed =
      (deltaTimeMs / 60000) * gameConfig.gameSpeedMultiplier;

    Object.entries(effects.immediate).forEach(([stat, value]) => {
      const statKey = stat as keyof EntityStats;
      if (statKey in newStats) {
        if (statKey === 'money') {
          newStats[statKey] = Math.max(0, newStats[statKey] + value);
        } else {
          newStats[statKey] = Math.max(
            0,
            Math.min(100, newStats[statKey] + value)
          );
        }
      }
    });

    Object.entries(effects.perMinute).forEach(([stat, value]) => {
      const statKey = stat as keyof EntityStats;
      if (statKey in newStats) {
        const change = value * minutesElapsed;
        if (statKey === 'money') {
          newStats[statKey] = Math.max(0, newStats[statKey] + change);
        } else {
          newStats[statKey] = Math.max(
            0,
            Math.min(100, newStats[statKey] + change)
          );
        }
      }
    });
  }

  const modifiers = getTimeOfDayActivityModifiers(timeOfDay);
  const activityModifier = modifiers[activity as keyof typeof modifiers];

  if (activity === 'RESTING' && activityModifier) {
    const minutesElapsed =
      (deltaTimeMs / 60000) * gameConfig.gameSpeedMultiplier;
    const effects = ACTIVITY_EFFECTS.RESTING;

    if ('energyRecoveryBonus' in activityModifier) {
      const energyBonus =
        (effects.perMinute.energy || 0) *
        (activityModifier.energyRecoveryBonus - 1) *
        minutesElapsed;
      newStats.energy = Math.min(
        100,
        Math.max(0, newStats.energy + energyBonus)
      );
    }

    if ('sleepinessRecoveryBonus' in activityModifier) {
      const sleepBonus =
        (effects.perMinute.sleepiness || 0) *
        (activityModifier.sleepinessRecoveryBonus - 1) *
        minutesElapsed;
      newStats.sleepiness = Math.min(
        100,
        Math.max(0, newStats.sleepiness + sleepBonus)
      );
    }

    if ('deepSleepBonus' in activityModifier) {
      const deepSleepHealthBonus =
        activityModifier.deepSleepBonus * 0.5 * minutesElapsed;
      newStats.health = Math.min(
        100,
        Math.max(0, newStats.health + deepSleepHealthBonus)
      );
    }

    if (timeOfDay.isNight) {
      const boredomReduction = 2 * minutesElapsed;
      newStats.boredom = Math.max(0, newStats.boredom - boredomReduction);
    }
  }

  return newStats;
};
