/**
 * Componente para manejar las actividades de una entidad
 * Separa la lógica de actividades del GameEntity
 */

import type { ActivityType, MoodType } from '../types';

export class EntityActivityComponent {
  private currentActivity: ActivityType;
  private activityStartTime: number;
  private lastActivityChange: number;
  private mood: MoodType;

  constructor(initialActivity: ActivityType = 'WANDERING', initialMood: MoodType = '😊') {
    this.currentActivity = initialActivity;
    this.mood = initialMood;
    this.activityStartTime = Date.now();
    this.lastActivityChange = Date.now();
  }

  /**
   * Obtiene la actividad actual
   */
  getCurrentActivity(): ActivityType {
    return this.currentActivity;
  }

  /**
   * Cambia la actividad actual
   */
  setActivity(newActivity: ActivityType): void {
    if (this.currentActivity !== newActivity) {
      this.currentActivity = newActivity;
      this.activityStartTime = Date.now();
      this.lastActivityChange = Date.now();
    }
  }

  /**
   * Obtiene el mood actual
   */
  getMood(): MoodType {
    return this.mood;
  }

  /**
   * Cambia el mood
   */
  setMood(newMood: MoodType): void {
    this.mood = newMood;
  }

  /**
   * Obtiene cuánto tiempo ha durado la actividad actual
   */
  getActivityDuration(): number {
    return Date.now() - this.activityStartTime;
  }

  /**
   * Verifica si es hora de cambiar de actividad
   */
  shouldChangeActivity(minDuration: number = 5000): boolean {
    return this.getActivityDuration() > minDuration;
  }

  /**
   * Obtiene el tiempo desde el último cambio de actividad
   */
  getTimeSinceLastChange(): number {
    return Date.now() - this.lastActivityChange;
  }

  /**
   * Mapea actividades a sprites apropiados
   */
  getActivitySprite(): string {
    switch (this.currentActivity) {
      case 'RESTING':
      case 'SLEEPING':
        return 'entity_sleeping';
      case 'EXERCISING':
      case 'DANCING':
        return 'entity_active';
      case 'SOCIALIZING':
        return 'entity_social';
      case 'WORKING':
      case 'WRITING':
        return 'entity_working';
      case 'EATING':
        return 'entity_eating';
      case 'COOKING':
        return 'entity_cooking';
      case 'SHOPPING':
        return 'entity_shopping';
      case 'WANDERING':
      case 'EXPLORING':
      default:
        return 'entity_idle';
    }
  }

  /**
   * Mapea mood a actividades preferidas
   */
  getPreferredActivitiesForMood(): ActivityType[] {
    switch (this.mood) {
      case '😊': // Happy
        return ['SOCIALIZING', 'DANCING', 'PLAYING'];
      case '😢': // Sad
        return ['RESTING', 'WRITING', 'CONTEMPLATING'];
      case '😡': // Angry
        return ['EXERCISING', 'WORKING', 'WANDERING'];
      case '😌': // Content
        return ['MEDITATING', 'RESTING', 'WRITING'];
      case '🤩': // Excited
        return ['DANCING', 'SOCIALIZING', 'EXPLORING'];
      case '😑': // Neutral
        return ['WANDERING', 'WORKING', 'RESTING'];
      case '😔': // Disappointed
        return ['HIDING', 'RESTING', 'CONTEMPLATING'];
      case '😰': // Anxious
        return ['MEDITATING', 'HIDING', 'RESTING'];
      case '😴': // Sleepy
        return ['RESTING', 'SLEEPING', 'MEDITATING'];
      default:
        return ['WANDERING', 'RESTING'];
    }
  }

  /**
   * Obtiene datos de la actividad para serialización
   */
  getActivityData() {
    return {
      activity: this.currentActivity,
      mood: this.mood,
      activityStartTime: this.activityStartTime,
      lastActivityChange: this.lastActivityChange,
      duration: this.getActivityDuration()
    };
  }
}