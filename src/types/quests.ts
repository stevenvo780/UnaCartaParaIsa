/**
 * Tipos para el sistema de misiones RPG
 */

import type { EntityStats } from "./entities";

/**
 * Estado de una misión
 */
export type QuestStatus =
  | "not_started"
  | "available"
  | "active"
  | "completed"
  | "failed"
  | "abandoned";

/**
 * Tipo de objetivo de misión
 */
export type QuestObjectiveType =
  | "find_item"
  | "talk_to_npc"
  | "reach_location"
  | "collect_resource"
  | "survive_time"
  | "achieve_stats"
  | "complete_activity"
  | "interact_with_entity"
  | "custom";

/**
 * Dificultad de la misión
 */
export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";

/**
 * Categoría de misión
 */
export type QuestCategory =
  | "main_story"
  | "side_quest"
  | "daily"
  | "exploration"
  | "social"
  | "survival"
  | "romance"
  | "mystery"
  | "tutorial";

/**
 * Tipo de recompensa
 */
export type RewardType =
  | "money"
  | "food"
  | "stats_boost"
  | "unlock_feature"
  | "dialogue_option"
  | "title"
  | "experience";

/**
 * Condición para desbloquear una misión
 */
export interface QuestRequirement {
  type:
    | "quest_completed"
    | "stats_threshold"
    | "time_elapsed"
    | "location_visited"
    | "item_owned";
  questId?: string;
  statsRequired?: Partial<EntityStats>;
  timeRequired?: number;
  locationId?: string;
  itemId?: string;
}

/**
 * Recompensa de misión
 */
export interface QuestReward {
  type: RewardType;
  amount?: number;
  itemId?: string;
  statsBoost?: Partial<EntityStats>;
  unlockId?: string;
  title?: string;
  description: string;
}

/**
 * Objetivo específico de una misión
 */
export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  description: string;
  target?: string;
  targetLocation?: { x: number; y: number; radius?: number };
  requiredAmount?: number;
  currentAmount?: number;
  isCompleted: boolean;
  isOptional: boolean;
  hints?: string[];
  targetEntity?: string;
  requirements?: {
    stats?: { [key: string]: number };
    items?: { [key: string]: number };
    proximity?: { entityId: string; distance: number };
    time?: number;
  };
}

/**
 * Diálogo específico de misión
 */
export interface QuestDialogue {
  stage: "intro" | "progress" | "completion" | "failure";
  speaker: "isa" | "stev" | "narrator" | "system";
  text: string;
  mood?: string;
  conditions?: {
    objectiveCompleted?: string;
    statsThreshold?: Partial<EntityStats>;
  };
}

/**
 * Definición completa de una misión
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  loreText: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;

  // Estado y progreso
  status: QuestStatus;
  objectives: QuestObjective[];

  // Requisitos y disponibilidad
  requirements: QuestRequirement[];
  isRepeatable: boolean;
  timeLimit?: number;

  // Narrativa
  dialogues: QuestDialogue[];
  introText: string;
  progressTexts: string[];
  completionText: string;
  failureText?: string;

  // Recompensas
  rewards: QuestReward[];

  // Metadatos
  estimatedDuration: number;
  tags: string[];
  isHidden: boolean;

  // Timestamps
  startedAt?: number;
  completedAt?: number;
  availableFrom?: number;
  expiresAt?: number;
}

/**
 * Estado del sistema de misiones del jugador
 */
export interface QuestProgress {
  activeQuests: Map<string, Quest>;
  completedQuests: Map<string, Quest>;
  failedQuests: Map<string, Quest>;
  availableQuests: Map<string, Quest>;
  questHistory: {
    questId: string;
    action: "started" | "completed" | "failed" | "abandoned";
    timestamp: number;
  }[];
  totalQuestsCompleted: number;
  totalExperienceGained: number;
  unlockedTitles: string[];
}

/**
 * Evento del sistema de misiones
 */
export interface QuestEvent {
  type:
    | "quest_started"
    | "quest_completed"
    | "quest_failed"
    | "objective_completed"
    | "quest_available";
  questId: string;
  objectiveId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Configuración del sistema de misiones
 */
export interface QuestSystemConfig {
  maxActiveQuests: number;
  enableHints: boolean;
  autoTrackObjectives: boolean;
  showCompletionNotifications: boolean;
  allowQuestAbandoning: boolean;
  saveProgressInterval: number;
}
