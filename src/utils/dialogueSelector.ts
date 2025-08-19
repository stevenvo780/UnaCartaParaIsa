/**
 * Sistema de Selección de Diálogos para Una Carta Para Isa
 * Carga y selecciona diálogos reales de conversaciones entre Isa y Stev
 * Migrado del proyecto original - preserva toda la lógica de selección contextual
 */

import type { DialogueEntry } from '../types';
import { logAutopoiesis } from './logger';

let dialogueData: DialogueEntry[] = [];
let currentIndex = 0;
let isLoaded = false;

/**
 * Carga el archivo JSON con las conversaciones reales
 */
export const loadDialogueData = async (): Promise<void> => {
  try {
    console.log('🗣️ Cargando diálogos reales de conversaciones...');
    const response = await fetch('/dialogs/dialogos_chat_isa.lite.censored_plus.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    dialogueData = await response.json();
    
    // Índice inicial aleatorio basado en timestamp
    const seed = Date.now();
    currentIndex = Math.floor((seed * 1664525 + 1013904223) % 2147483647) % dialogueData.length;
    
    isLoaded = true;
    
    logAutopoiesis.info('Diálogos cargados exitosamente', {
      totalDialogues: dialogueData.length,
      startIndex: currentIndex,
      memoryUsage: `${(JSON.stringify(dialogueData).length / 1024 / 1024).toFixed(2)}MB`
    });
    
    console.log(`✅ ${dialogueData.length} diálogos reales cargados`);
  } catch (error) {
    console.warn('❌ No se pudo cargar el archivo de diálogos:', error);
    logAutopoiesis.error('Error cargando diálogos', { error: error?.toString() });
    dialogueData = [];
    isLoaded = false;
  }
};

/**
 * Busca el siguiente diálogo que coincida con los criterios especificados
 */
export const getNextDialogue = (
  preferredSpeaker?: 'ISA' | 'STEV',
  preferredEmotion?: string,
  preferredActivity?: string
): DialogueEntry | null => {
  if (!isLoaded || dialogueData.length === 0) {
    console.warn('⚠️ Diálogos no cargados, iniciando carga...');
    loadDialogueData();
    return null;
  }

  const findDialogue = (
    speaker?: 'ISA' | 'STEV',
    emotion?: string,
    activity?: string
  ): DialogueEntry | null => {
    let attempts = 0;
    const maxAttempts = dialogueData.length;
    let localIndex = currentIndex;

    while (attempts < maxAttempts) {
      const dialogue = dialogueData[localIndex];
      localIndex = (localIndex + 1) % dialogueData.length;
      attempts++;

      const speakerMatch = !speaker || dialogue.speaker === speaker;
      const emotionMatch = !emotion || dialogue.emotion === emotion;
      const activityMatch = !activity || dialogue.activity === activity;

      if (speakerMatch && emotionMatch && activityMatch) {
        currentIndex = localIndex; // Actualizar índice principal
        return dialogue;
      }
    }
    return null;
  };

  // Estrategia de búsqueda en orden de prioridad:

  // 1. Coincidencia perfecta (speaker + emotion + activity)
  let dialogue = findDialogue(preferredSpeaker, preferredEmotion, preferredActivity);
  if (dialogue) return dialogue;

  // 2. Speaker + activity (ignora emotion)
  dialogue = findDialogue(preferredSpeaker, undefined, preferredActivity);
  if (dialogue) return dialogue;

  // 3. Speaker + emotion (ignora activity)
  dialogue = findDialogue(preferredSpeaker, preferredEmotion, undefined);
  if (dialogue) return dialogue;

  // 4. Solo speaker
  dialogue = findDialogue(preferredSpeaker, undefined, undefined);
  if (dialogue) return dialogue;

  // 5. Fallback: cualquier diálogo aleatorio
  const fallbackIndex = (Date.now() * 1664525 + 1013904223) % 2147483647;
  const selectedDialogue = dialogueData[Math.floor(fallbackIndex) % dialogueData.length];

  logAutopoiesis.warn('Usando diálogo fallback', {
    requested: { preferredSpeaker, preferredEmotion, preferredActivity },
    selected: { speaker: selectedDialogue.speaker, emotion: selectedDialogue.emotion }
  });

  return selectedDialogue;
};

/**
 * Mapeo de emociones para respuestas contextuales
 */
const responseMap: Record<string, string[]> = {
  NEUTRAL: ['CURIOUS', 'NEUTRAL', 'PLAYFUL'],
  LOVE: ['LOVE', 'PLAYFUL', 'GRATITUDE'],
  SADNESS: ['LOVE', 'CURIOUS', 'NEUTRAL'],
  ANGER: ['CURIOUS', 'NEUTRAL'],
  ANXIETY: ['LOVE', 'NEUTRAL'],
  PLAYFUL: ['PLAYFUL', 'LOVE', 'CURIOUS'],
  CURIOUS: ['NEUTRAL', 'PLAYFUL'],
  GRATITUDE: ['LOVE', 'NEUTRAL'],
  PRIDE: ['GRATITUDE', 'LOVE'],
  APOLOGY: ['NEUTRAL', 'LOVE'],
  STRESS: ['LOVE', 'NEUTRAL'],
  SICKNESS: ['LOVE', 'CARING'],
  PAIN: ['LOVE', 'CARING'],
  CARING: ['GRATITUDE', 'LOVE'],
  CONTEMPLATING: ['CURIOUS', 'NEUTRAL'],
  DEFAULT: ['NEUTRAL', 'CURIOUS', 'LOVE', 'PLAYFUL']
};

/**
 * Genera una respuesta contextual basada en el último diálogo
 */
export const getResponseWriter = (
  responderSpeaker: 'ISA' | 'STEV',
  lastDialogue: DialogueEntry
): DialogueEntry | null => {
  const possibleEmotions = responseMap[lastDialogue.emotion] || responseMap.DEFAULT;

  // Intentar con cada emoción posible
  for (const emotion of possibleEmotions) {
    const response = getNextDialogue(responderSpeaker, emotion, lastDialogue.activity);
    if (response) {
      return response;
    }
  }

  // Fallback: cualquier diálogo del responder
  return getNextDialogue(responderSpeaker);
};

/**
 * Convierte ID de entidad a speaker del sistema de diálogos
 */
export const getSpeakerForEntity = (entityId: string): 'ISA' | 'STEV' => {
  return entityId.toLowerCase().includes('isa') ? 'ISA' : 'STEV';
};

/**
 * Obtiene una emoción apropiada basada en la actividad
 */
export const getEmotionForActivity = (activity: string): string => {
  const activityEmotionMap: Record<string, string> = {
    'SOCIALIZING': 'PLAYFUL',
    'RESTING': 'NEUTRAL',
    'EATING': 'GRATITUDE',
    'PLAYING': 'PLAYFUL',
    'WORKING': 'NEUTRAL',
    'EXERCISING': 'CURIOUS',
    'MEDITATING': 'CONTEMPLATING',
    'WANDERING': 'CURIOUS',
    'EXPLORING': 'CURIOUS',
    'DANCING': 'PLAYFUL',
    'WRITING': 'CONTEMPLATING'
  };

  return activityEmotionMap[activity] || 'NEUTRAL';
};

/**
 * Selecciona un diálogo basado en el tipo de interacción del jugador
 */
export const getDialogueForInteraction = (
  interactionType: string,
  entityId: string
): DialogueEntry | null => {
  const speaker = getSpeakerForEntity(entityId);

  // Mapeo de interacciones a emociones y contextos
  const interactionMap: Record<
    string,
    { emotions: string[]; activities: string[]; priority?: string[] }
  > = {
    FEED: {
      emotions: ['LOVE', 'PLAYFUL', 'NEUTRAL'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE']
    },
    PLAY: {
      emotions: ['PLAYFUL', 'LOVE', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['PLAYFUL']
    },
    COMFORT: {
      emotions: ['LOVE', 'NEUTRAL', 'SADNESS'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE']
    },
    DISTURB: {
      emotions: ['SADNESS', 'NEUTRAL', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['NEUTRAL']
    },
    NOURISH: {
      emotions: ['LOVE', 'PLAYFUL', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE']
    },
    SLEEP: {
      emotions: ['NEUTRAL', 'LOVE'],
      activities: ['SOCIALIZING'],
      priority: ['NEUTRAL']
    },
    EXERCISE: {
      emotions: ['PLAYFUL', 'CURIOUS', 'NEUTRAL'],
      activities: ['SOCIALIZING'],
      priority: ['PLAYFUL']
    }
  };

  const config = interactionMap[interactionType.toUpperCase()];
  if (!config) return null;

  // Priorizar emociones específicas si están definidas
  const emotionsToTry = config.priority
    ? [...config.priority, ...config.emotions]
    : config.emotions;

  const interactionHash = interactionType
    .split('')
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
  const activityIndex = Math.abs(interactionHash) % config.activities.length;
  const targetActivity = config.activities[activityIndex];

  // Intentar con emociones prioritarias primero
  for (const emotion of emotionsToTry) {
    const dialogue = getNextDialogue(speaker, emotion, targetActivity);
    if (dialogue) return dialogue;
  }

  // Si no encontramos nada específico, buscar con cualquier emoción válida
  return getNextDialogue(speaker, undefined, targetActivity);
};

/**
 * Obtiene estadísticas del sistema de diálogos
 */
export const getDialogueStats = () => {
  if (!isLoaded) return null;

  const speakerCount = dialogueData.reduce((acc, dialogue) => {
    acc[dialogue.speaker] = (acc[dialogue.speaker] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const emotionCount = dialogueData.reduce((acc, dialogue) => {
    acc[dialogue.emotion] = (acc[dialogue.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: dialogueData.length,
    currentIndex,
    speakers: speakerCount,
    emotions: emotionCount,
    isLoaded
  };
};

/**
 * Obtiene una muestra aleatoria de diálogos para testing
 */
export const getRandomDialogueSample = (count: number = 5): DialogueEntry[] => {
  if (!isLoaded || dialogueData.length === 0) return [];

  const sample: DialogueEntry[] = [];
  const usedIndices = new Set<number>();

  while (sample.length < count && usedIndices.size < dialogueData.length) {
    const randomIndex = Math.floor(Math.random() * dialogueData.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      sample.push(dialogueData[randomIndex]);
    }
  }

  return sample;
};
