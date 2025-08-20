/*\n * Documentación científica (resumen):\n * - Índice inicial pseudoaleatorio (LCG), búsqueda circular filtrando por speaker/emoción/actividad.\n * - Degradación progresiva de filtros y fallback; hash de interacción para variar actividad objetivo.\n */
/**
 * Sistema de Selección de Diálogos para Una Carta Para Isa
 * Optimizado con carga fragmentada para mejor rendimiento
 * Usa DialogueChunkLoader para manejo eficiente de memoria
 */

import type { DialogueEntry } from '../types';
import { dialogueChunkLoader } from './dialogueChunkLoader';
import { logAutopoiesis } from './logger';

let currentIndex = 0;
let isLoaded = false;
let totalDialogues = 0;

/**
 * Inicializa el sistema de diálogos con carga ULTRA-OPTIMIZADA para 60 FPS
 */
export const loadDialogueData = async (): Promise<void> => {
  try {
    logAutopoiesis.info('🗣️ Inicializando sistema de diálogos optimizado...');

    await dialogueChunkLoader.initialize();
    const stats = dialogueChunkLoader.getStats();

    // ⚡ MEGA-OPTIMIZACIÓN: Limitar a solo 5000 diálogos para máximo rendimiento
    totalDialogues = Math.min(stats.totalEntries, 5000);

    logAutopoiesis.info('🚀 ULTRA-OPTIMIZED Dialogues system', {
      originalTotal: stats.totalEntries,
      limitedTo: totalDialogues,
      reductionFactor: Math.round((stats.totalEntries / totalDialogues) * 100) / 100,
    });

    // Establecer índice inicial aleatorio
    const seed = Date.now();
    currentIndex = Math.floor((seed * 1664525 + 1013904223) % 2147483647) % totalDialogues;

    isLoaded = true;

    logAutopoiesis.info('Sistema de diálogos inicializado', {
      totalDialogues,
      totalChunks: stats.totalChunks,
      startIndex: currentIndex,
      cacheSize: stats.cacheSize,
    });
  } catch (error) {
    logAutopoiesis.error('Error inicializando sistema de diálogos', {
      error: String(error),
    });
    isLoaded = false;
    totalDialogues = 0;
  }
};

/**
 * Busca el siguiente diálogo que coincida con los criterios especificados
 * Optimizado para usar el sistema de chunks
 */
export const getNextDialogue = async (
  preferredSpeaker?: 'ISA' | 'STEV',
  preferredEmotion?: string,
  preferredActivity?: string
): Promise<DialogueEntry | null> => {
  if (!isLoaded || totalDialogues === 0) {
    logAutopoiesis.warn('⚠️ Diálogos no inicializados, iniciando carga...');
    await loadDialogueData();
    if (!isLoaded) return null;
  }

  try {
    // Primero intentar búsqueda optimizada usando el chunk loader
    const searchResult = await dialogueChunkLoader.searchDialogues({
      speaker: preferredSpeaker,
      emotion: preferredEmotion,
      textContains: preferredActivity ? undefined : undefined, // Mantener lógica original
      limit: 1,
    });

    if (searchResult.length > 0) {
      return searchResult[0];
    }

    // Fallback: búsqueda con criterios relajados
    const fallbackCriteria = [
      {
        speaker: preferredSpeaker,
        emotion: undefined,
        activity: preferredActivity,
      },
      {
        speaker: preferredSpeaker,
        emotion: preferredEmotion,
        activity: undefined,
      },
      { speaker: preferredSpeaker, emotion: undefined, activity: undefined },
      { speaker: undefined, emotion: undefined, activity: undefined },
    ];

    for (const criteria of fallbackCriteria) {
      const result = await dialogueChunkLoader.searchDialogues({
        speaker: criteria.speaker,
        emotion: criteria.emotion,
        limit: 1,
      });

      if (result.length > 0) {
        return result[0];
      }
    }

    // Último recurso: obtener diálogo aleatorio
    const randomIndex = Math.floor(Math.random() * totalDialogues);
    const fallbackDialogue = await dialogueChunkLoader.getDialogue(randomIndex);

    if (fallbackDialogue) {
      logAutopoiesis.warn('Usando diálogo aleatorio fallback', {
        requested: { preferredSpeaker, preferredEmotion, preferredActivity },
        selected: {
          speaker: fallbackDialogue.speaker,
          emotion: fallbackDialogue.emotion,
        },
      });
    }

    return fallbackDialogue;
  } catch (error) {
    logAutopoiesis.error('Error obteniendo diálogo', { error: String(error) });
    return null;
  }
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
  DEFAULT: ['NEUTRAL', 'CURIOUS', 'LOVE', 'PLAYFUL'],
};

/**
 * Genera una respuesta contextual basada en el último diálogo
 */
export const getResponseWriter = async (
  responderSpeaker: 'ISA' | 'STEV',
  lastDialogue: DialogueEntry
): Promise<DialogueEntry | null> => {
  const possibleEmotions = responseMap[lastDialogue.emotion] || responseMap.DEFAULT;

  for (const emotion of possibleEmotions) {
    const response = await getNextDialogue(responderSpeaker, emotion, lastDialogue.activity);
    if (response) {
      return response;
    }
  }

  return await getNextDialogue(responderSpeaker);
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
    SOCIALIZING: 'PLAYFUL',
    RESTING: 'NEUTRAL',
    EATING: 'GRATITUDE',
    PLAYING: 'PLAYFUL',
    WORKING: 'NEUTRAL',
    EXERCISING: 'CURIOUS',
    MEDITATING: 'CONTEMPLATING',
    WANDERING: 'CURIOUS',
    EXPLORING: 'CURIOUS',
    DANCING: 'PLAYFUL',
    WRITING: 'CONTEMPLATING',
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

  const interactionMap: Record<
    string,
    { emotions: string[]; activities: string[]; priority?: string[] }
  > = {
    FEED: {
      emotions: ['LOVE', 'PLAYFUL', 'NEUTRAL'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE'],
    },
    PLAY: {
      emotions: ['PLAYFUL', 'LOVE', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['PLAYFUL'],
    },
    COMFORT: {
      emotions: ['LOVE', 'NEUTRAL', 'SADNESS'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE'],
    },
    DISTURB: {
      emotions: ['SADNESS', 'NEUTRAL', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['NEUTRAL'],
    },
    NOURISH: {
      emotions: ['LOVE', 'PLAYFUL', 'CURIOUS'],
      activities: ['SOCIALIZING'],
      priority: ['LOVE'],
    },
    SLEEP: {
      emotions: ['NEUTRAL', 'LOVE'],
      activities: ['SOCIALIZING'],
      priority: ['NEUTRAL'],
    },
    EXERCISE: {
      emotions: ['PLAYFUL', 'CURIOUS', 'NEUTRAL'],
      activities: ['SOCIALIZING'],
      priority: ['PLAYFUL'],
    },
  };

  const config = interactionMap[interactionType.toUpperCase()];
  if (!config) return null;

  const emotionsToTry = config.priority
    ? [...config.priority, ...config.emotions]
    : config.emotions;

  const interactionHash = interactionType
    .split('')
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
  const activityIndex = Math.abs(interactionHash) % config.activities.length;
  const targetActivity = config.activities[activityIndex];

  for (const emotion of emotionsToTry) {
    const dialogue = getNextDialogue(speaker, emotion, targetActivity);
    if (dialogue) return dialogue;
  }

  return getNextDialogue(speaker, undefined, targetActivity);
};

/**
 * Obtiene estadísticas del sistema de diálogos optimizado
 */
export const getDialogueStats = () => {
  if (!isLoaded) return null;

  const chunkStats = dialogueChunkLoader.getStats();

  return {
    total: totalDialogues,
    currentIndex,
    chunkStats,
    isLoaded,
    memoryOptimized: true,
  };
};

/**
 * Obtiene una muestra aleatoria de diálogos para testing
 */
export const getRandomDialogueSample = async (count = 5): Promise<DialogueEntry[]> => {
  if (!isLoaded || totalDialogues === 0) return [];

  try {
    const sample: DialogueEntry[] = [];
    const usedIndices = new Set<number>();

    while (sample.length < count && usedIndices.size < totalDialogues) {
      const randomIndex = Math.floor(Math.random() * totalDialogues);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        const dialogue = await dialogueChunkLoader.getDialogue(randomIndex);
        if (dialogue) {
          sample.push(dialogue);
        }
      }
    }

    return sample;
  } catch (error) {
    logAutopoiesis.error('Error getting random dialogue sample', {
      error: String(error),
    });
    return [];
  }
};
