/**
 * Tipos relacionados con entidades del juego
 */

import type { ActivityType } from "./activities";
import type { Position } from "./core";

export type EntityStateType =
  | "idle"
  | "moving"
  | "interacting"
  | "resting"
  | "seeking"
  | "dead"
  | "fading";

export type MoodType =
  | "😊"
  | "😢"
  | "😡"
  | "😌"
  | "🤩"
  | "😑"
  | "😔"
  | "😰"
  | "😴";

export interface EntityStats {
  health: number;
  energy: number;
  hunger: number;
  thirst: number; // Necesidad crítica
  mentalHealth: number; // Salud mental unificada
  boredom: number;
  loneliness: number;
  sleepiness: number;
  money: number;
  comfort: number;
  creativity: number;
  resonance: number;
  courage: number;
  happiness: number;
  stress: number;
}

export interface Entity {
  id: string;
  position: Position;
  stats: EntityStats;
  mood: MoodType;
  activity: ActivityType;
  state: EntityStateType;
  isDead: boolean;
  lastActivityChange?: number;
  resonance: number;
  pulsePhase?: number;
  timeOfDeath?: number;
}
