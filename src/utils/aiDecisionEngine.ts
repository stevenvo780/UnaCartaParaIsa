/**
 * Motor de decisiones de IA mejorado para Una Carta Para Isa
 * Migrado de Dúo Eterno - preserva lógica científica de personalidades y decisiones
 */

import type { Entity, ActivityType, MoodType } from '../types';
import { ACTIVITY_TYPES } from '../constants';
import { calculateActivityPriority } from './activityDynamics';
import { gameConfig } from '../config/gameConfig';
import { logAutopoiesis } from './logger';

interface PersonalityProfile {
  socialPreference: number; // 0-1: preferencia por actividades sociales
  activityPersistence: number; // 0-1: resistencia a cambiar de actividad
  riskTolerance: number; // 0-1: tolerancia a actividades arriesgadas
  energyEfficiency: number; // 0-1: preferencia por actividades que conservan energía
}

// Perfiles de personalidad diferenciados para Isa y Stev
const ENTITY_PERSONALITIES: Record<'isa' | 'stev', PersonalityProfile> = {
  isa: {
    socialPreference: 0.7, // Isa es más social
    activityPersistence: 0.6, // Moderadamente persistente
    riskTolerance: 0.4, // Más conservadora
    energyEfficiency: 0.5 // Balance energético
  },
  stev: {
    socialPreference: 0.5, // Menos social que Isa
    activityPersistence: 0.8, // Muy persistente
    riskTolerance: 0.6, // Más aventurero
    energyEfficiency: 0.7 // Muy eficiente con la energía
  }
};

// Modificadores de comportamiento basados en estado de ánimo
const MOOD_MODIFIERS: Record<
  MoodType,
  {
    activityChange: number; // Tendencia a cambiar de actividad
    socialSeek: number; // Búsqueda de compañía
    riskTaking: number; // Tolerancia al riesgo
    energyConservation: number; // Conservación de energía
  }
> = {
  '😊': { activityChange: 0.3, socialSeek: 0.7, riskTaking: 0.6, energyConservation: 0.3 }, // HAPPY
  '🤩': { activityChange: 0.8, socialSeek: 0.8, riskTaking: 0.8, energyConservation: 0.2 }, // EXCITED
  '😌': { activityChange: 0.1, socialSeek: 0.4, riskTaking: 0.3, energyConservation: 0.6 }, // CALM
  '😢': { activityChange: 0.4, socialSeek: 0.9, riskTaking: 0.2, energyConservation: 0.7 }, // SAD
  '😰': { activityChange: 0.7, socialSeek: 0.6, riskTaking: 0.1, energyConservation: 0.8 }, // ANXIOUS
  '😡': { activityChange: 0.6, socialSeek: 0.3, riskTaking: 0.7, energyConservation: 0.4 }, // ANGRY
  '😑': { activityChange: 0.8, socialSeek: 0.4, riskTaking: 0.5, energyConservation: 0.3 }, // BORED
  '😔': { activityChange: 0.5, socialSeek: 0.9, riskTaking: 0.3, energyConservation: 0.6 }, // LONELY
  '😴': { activityChange: 0.1, socialSeek: 0.2, riskTaking: 0.1, energyConservation: 0.9 }  // TIRED
};

// Sesiones de actividad para seguimiento de persistencia
interface ActivitySession {
  activity: ActivityType;
  startTime: number;
  plannedDuration: number;
  effectiveness: number;
  satisfactionLevel: number;
  interruptions: number;
}

// Estado de sesiones por entidad
const activitySessions = new Map<string, ActivitySession>();

// Bias de hábitos para actividades favoritas
const habitBias = new Map<string, Map<ActivityType, number>>();

/**
 * Obtiene el perfil de personalidad para una entidad
 */
const getPersonalityProfile = (entityId: string): PersonalityProfile => {
  if (entityId === 'stev') {
    return ENTITY_PERSONALITIES.stev;
  }
  return ENTITY_PERSONALITIES.isa;
};

/**
 * Aplica modificadores de mood a la puntuación de una actividad
 */
const applyMoodModifiers = (
  baseScore: number,
  activity: ActivityType,
  mood: MoodType
): number => {
  const modifiers = MOOD_MODIFIERS[mood];
  let score = baseScore;

  // Actividades sociales se benefician si el mood busca compañía
  if (activity === 'SOCIALIZING') {
    score += modifiers.socialSeek * 15;
  }

  // Actividades de descanso se benefician si el mood busca conservar energía
  if (activity === 'RESTING' || activity === 'MEDITATING') {
    score += modifiers.energyConservation * 10;
  }

  // Actividades aventureras se benefician del riesgo
  if (activity === 'WANDERING' || activity === 'EXPLORING' || activity === 'DANCING') {
    score += modifiers.riskTaking * 8;
  }

  return score;
};

/**
 * Calcula inercia de actividad - resistencia a cambiar
 */
const calculateActivityInertia = (
  entity: Entity,
  currentTime: number
): number => {
  const personality = getPersonalityProfile(entity.id);
  const session = activitySessions.get(entity.id);

  if (!session) return 0;

  const elapsedTime = currentTime - session.startTime;
  const progress = Math.min(1, elapsedTime / session.plannedDuration);

  // Inercia base por personalidad
  let inertia = personality.activityPersistence;

  // Aumenta inercia si la actividad es efectiva
  if (session.effectiveness > 0.7) {
    inertia += 0.2;
  }

  // Reduce inercia si hay muchas interrupciones
  if (session.interruptions > 2) {
    inertia -= 0.3;
  }

  // Bonus por inercia configurado
  const bonus = gameConfig.ai.activityInertiaBonus || 0.1;
  inertia *= (1 + bonus);

  return Math.max(0, Math.min(1, inertia * progress));
};

/**
 * Obtiene bias de hábito para una actividad específica
 */
const getHabitBias = (entityId: string, activity: ActivityType): number => {
  const entityHabits = habitBias.get(entityId);
  if (!entityHabits) return 0;
  
  return entityHabits.get(activity) || 0;
};

/**
 * Actualiza el bias de hábito cuando se completa una actividad
 */
const updateHabitBias = (
  entityId: string,
  activity: ActivityType,
  satisfaction: number
): void => {
  if (!habitBias.has(entityId)) {
    habitBias.set(entityId, new Map());
  }

  const entityHabits = habitBias.get(entityId)!;
  const currentBias = entityHabits.get(activity) || 0;
  
  // Incrementa bias si la actividad fue satisfactoria
  const change = satisfaction > 0.7 ? 0.5 : -0.2;
  const newBias = Math.max(-5, Math.min(5, currentBias + change));
  
  entityHabits.set(activity, newBias);
};

/**
 * Determina si se debe cambiar de actividad basado en urgencia y thresholds
 */
const shouldChangeActivity = (
  entity: Entity,
  currentTime: number,
  urgencyScore: number
): boolean => {
  const inertia = calculateActivityInertia(entity, currentTime);
  const threshold = gameConfig.ai.decisionChangeThreshold || 5;
  
  // Si hay mucha inercia, requiere mayor urgencia para cambiar
  const adjustedThreshold = threshold + (inertia * 10);
  
  return urgencyScore > adjustedThreshold;
};

/**
 * Selección softmax: convierte scores en distribución de probabilidad
 * Controlada por temperatura (tau)
 */
const softmaxPick = (
  scores: Array<{ activity: ActivityType; score: number }>,
  temperature: number = 0.7
): ActivityType => {
  const tau = Math.max(0.1, temperature);
  const maxScore = Math.max(...scores.map(s => s.score));
  
  // Normalizar para evitar overflow
  const exps = scores.map(s => Math.exp((s.score - maxScore) / tau));
  const sum = exps.reduce((a, b) => a + b, 0);

  // Generar número aleatorio determinístico pero variable
  const seed = (Date.now() * 1664525 + 1013904223) % 2147483647;
  let random = (seed / 2147483647) * sum;

  // Seleccionar actividad basada en probabilidad
  for (let i = 0; i < scores.length; i++) {
    random -= exps[i];
    if (random <= 0) {
      return scores[i].activity;
    }
  }
  
  return scores[0].activity;
};

/**
 * Inicia una nueva sesión de actividad
 */
const startActivitySession = (
  entityId: string,
  activity: ActivityType,
  currentTime: number
): void => {
  const personality = getPersonalityProfile(entityId);
  
  // Duración base según personalidad
  const baseDuration = 30000; // 30 segundos base
  const persistenceMultiplier = 1 + personality.activityPersistence;
  
  activitySessions.set(entityId, {
    activity,
    startTime: currentTime,
    plannedDuration: baseDuration * persistenceMultiplier,
    effectiveness: 0.5, // Se actualiza durante la sesión
    satisfactionLevel: 0.5,
    interruptions: 0
  });
};

/**
 * Motor principal de decisión de IA
 * Combina prioridades, personalidad, mood y softmax para decisión inteligente
 */
export const makeIntelligentDecision = (
  entity: Entity,
  companion: Entity | null,
  currentTime: number
): ActivityType => {
  const personality = getPersonalityProfile(entity.id);
  
  // Calcular scores para todas las actividades posibles
  const activityScores: Array<{ activity: ActivityType; score: number }> = [];

  for (const activity of ACTIVITY_TYPES) {
    // Score base de autopoiesis
    const baseScore = calculateActivityPriority(
      activity,
      entity.stats,
      currentTime - (entity.lastActivityChange || 0)
    );

    // Aplicar modificadores de mood
    const moodModifiedScore = applyMoodModifiers(baseScore, activity, entity.mood);

    let personalityModifiedScore = moodModifiedScore;

    // Modificadores específicos por personalidad
    if (activity === 'SOCIALIZING' && companion && !companion.isDead) {
      const personalityInfluence = gameConfig.ai.personalityInfluence || 0.5;
      personalityModifiedScore +=
        personality.socialPreference * 15 * personalityInfluence;
    }

    if (activity === 'MEDITATING' || activity === 'RESTING') {
      const personalityInfluence = gameConfig.ai.personalityInfluence || 0.5;
      personalityModifiedScore +=
        personality.energyEfficiency * 10 * personalityInfluence;
    }

    if (activity === 'WANDERING' || activity === 'EXERCISING' || activity === 'EXPLORING') {
      const personalityInfluence = gameConfig.ai.personalityInfluence || 0.5;
      personalityModifiedScore +=
        personality.riskTolerance * 8 * personalityInfluence;
    }

    activityScores.push({ activity, score: personalityModifiedScore });
  }

  // Aplicar bias de hábitos
  const biasedScores = activityScores.map(s => ({
    activity: s.activity,
    score: s.score + getHabitBias(entity.id, s.activity)
  }));

  // Ordenar por score para logging
  biasedScores.sort((a, b) => b.score - a.score);

  // Selección con softmax
  const tau = gameConfig.ai.softmaxTau || 0.7;
  const chosen = softmaxPick(biasedScores, tau);
  const chosenScore = biasedScores.find(a => a.activity === chosen)?.score ?? 0;

  // Log decision para análisis científico
  if (Math.random() < 0.1) { // Log 10% de decisiones para evitar spam
    logAutopoiesis.info(`${entity.id} AI decision`, {
      topChoices: biasedScores.slice(0, 3),
      chosen,
      chosenScore: chosenScore.toFixed(2),
      mood: entity.mood,
      personalityType: entity.id
    });
  }

  // Verificar si debe cambiar de actividad
  if (chosen !== entity.activity) {
    if (shouldChangeActivity(entity, currentTime, chosenScore)) {
      // Completar sesión anterior si existe
      const oldSession = activitySessions.get(entity.id);
      if (oldSession) {
        const satisfaction = oldSession.effectiveness * 0.7 + Math.random() * 0.3;
        updateHabitBias(entity.id, oldSession.activity, satisfaction);
      }

      // Iniciar nueva sesión
      startActivitySession(entity.id, chosen, currentTime);
      
      logAutopoiesis.info(`${entity.id} activity change`, {
        from: entity.activity,
        to: chosen,
        urgency: chosenScore.toFixed(1),
        reason: 'AI decision'
      });

      return chosen;
    } else {
      // Mantener actividad actual por inercia
      return entity.activity;
    }
  }

  return chosen;
};

/**
 * Actualiza la efectividad de la sesión actual
 */
export const updateSessionEffectiveness = (
  entityId: string,
  effectiveness: number
): void => {
  const session = activitySessions.get(entityId);
  if (session) {
    session.effectiveness = Math.max(0, Math.min(1, effectiveness));
  }
};

/**
 * Registra una interrupción en la sesión actual
 */
export const recordSessionInterruption = (entityId: string): void => {
  const session = activitySessions.get(entityId);
  if (session) {
    session.interruptions++;
  }
};

export const aiDecisionEngine = {
  makeIntelligentDecision,
  updateSessionEffectiveness,
  recordSessionInterruption,
  getPersonalityProfile
};
