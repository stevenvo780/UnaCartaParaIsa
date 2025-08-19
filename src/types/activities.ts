/**
 * Tipos relacionados con actividades de entidades
 */

export type ActivityType = 
  | 'RESTING'
  | 'MEDITATING'
  | 'SOCIALIZING'
  | 'WORKING'
  | 'EXERCISING'
  | 'WANDERING'
  | 'WRITING'
  | 'EXPLORING'
  | 'CONTEMPLATING'
  | 'DANCING'
  | 'HIDING'
  | 'SHOPPING'
  | 'COOKING'
  | 'EATING';

export interface EntityActivity {
  type: ActivityType;
  startTime: number;
  duration: number;
  effectiveness: number;
  satisfactionLevel: number;
  interrupted: boolean;
}

export interface ActivityModifiers {
  energyCost: number;
  happinessGain: number;
  boredomReduction: number;
  socialNeed: number;
}

export interface ActivityDefinition {
  type: ActivityType;
  name: string;
  description: string;
  modifiers: ActivityModifiers;
  requirements?: {
    energy?: number;
    happiness?: number;
    zone?: string;
  };
}