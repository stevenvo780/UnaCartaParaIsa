/**
 * Tipos relacionados con entidades del juego
 */

import type { ActivityType } from './activities';
import type { Position } from './core';

export type EntityStateType = 
  | 'idle' 
  | 'moving' 
  | 'interacting' 
  | 'resting' 
  | 'seeking'
  | 'dead'
  | 'fading';

export type MoodType =
  | '😊'
  | '😢'
  | '😡'
  | '😌'
  | '🤩'
  | '😑'
  | '😔'
  | '😰'
  | '😴';

export interface EntityStats {
  health: number;
  happiness: number;
  energy: number;
  hunger: number;
  boredom: number;
  loneliness: number;
  sleepiness: number;
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
}