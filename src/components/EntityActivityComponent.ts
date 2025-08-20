/**
 * Componente para manejar las actividades de una entidad
 * Separa la lógica de actividades del GameEntity
 */

import type { ActivityType, MoodType } from "../types";

export class EntityActivityComponent {
  private _currentActivity: ActivityType;
  private _activityStartTime: number;
  private _lastActivityChange: number;
  private _mood: MoodType;

  public constructor(
    initialActivity: ActivityType = "WANDERING",
    initialMood: MoodType = "😊",
  ) {
    this._currentActivity = initialActivity;
    this._mood = initialMood;
    this._activityStartTime = Date.now();
    this._lastActivityChange = Date.now();
  }

  /**
   * Obtiene la actividad actual
   */
  public getCurrentActivity(): ActivityType {
    return this._currentActivity;
  }

  /**
   * Cambia la actividad actual
   */
  public setActivity(newActivity: ActivityType): void {
    if (this._currentActivity !== newActivity) {
      this._currentActivity = newActivity;
      this._activityStartTime = Date.now();
      this._lastActivityChange = Date.now();
    }
  }

  /**
   * Obtiene el mood actual
   */
  public getMood(): MoodType {
    return this._mood;
  }

  /**
   * Cambia el mood
   */
  public setMood(newMood: MoodType): void {
    this._mood = newMood;
  }

  /**
   * Obtiene cuánto tiempo ha durado la actividad actual
   */
  public getActivityDuration(): number {
    return Date.now() - this._activityStartTime;
  }

  /**
   * Verifica si es hora de cambiar de actividad
   */
  public shouldChangeActivity(minDuration = 5000): boolean {
    return this.getActivityDuration() > minDuration;
  }

  /**
   * Obtiene el tiempo desde el último cambio de actividad
   */
  public getTimeSinceLastChange(): number {
    return Date.now() - this._lastActivityChange;
  }

  /**
   * Mapea actividades a sprites apropiados
   */
  public getActivitySprite(): string {
    switch (this._currentActivity) {
      case "RESTING":
      case "SLEEPING":
        return "entity_sleeping";
      case "EXERCISING":
      case "DANCING":
        return "entity_active";
      case "SOCIALIZING":
        return "entity_social";
      case "WORKING":
      case "WRITING":
        return "entity_working";
      case "EATING":
        return "entity_eating";
      case "COOKING":
        return "entity_cooking";
      case "SHOPPING":
        return "entity_shopping";
      case "WANDERING":
      case "EXPLORING":
      default:
        return "entity_idle";
    }
  }

  /**
   * Mapea mood a actividades preferidas
   */
  public getPreferredActivitiesForMood(): ActivityType[] {
    switch (this._mood) {
      case "😊": // Happy
        return ["SOCIALIZING", "DANCING", "PLAYING"];
      case "😢": // Sad
        return ["RESTING", "WRITING", "CONTEMPLATING"];
      case "😡": // Angry
        return ["EXERCISING", "WORKING", "WANDERING"];
      case "😌": // Content
        return ["MEDITATING", "RESTING", "WRITING"];
      case "🤩": // Excited
        return ["DANCING", "SOCIALIZING", "EXPLORING"];
      case "😑": // Neutral
        return ["WANDERING", "WORKING", "RESTING"];
      case "😔": // Disappointed
        return ["HIDING", "RESTING", "CONTEMPLATING"];
      case "😰": // Anxious
        return ["MEDITATING", "HIDING", "RESTING"];
      case "😴": // Sleepy
        return ["RESTING", "SLEEPING", "MEDITATING"];
      default:
        return ["WANDERING", "RESTING"];
    }
  }

  /**
   * Obtiene datos de la actividad para serialización
   */
  public getActivityData(): {
    activity: ActivityType;
    mood: MoodType;
    activityStartTime: number;
    lastActivityChange: number;
    duration: number;
  } {
    return {
      activity: this._currentActivity,
      mood: this._mood,
      activityStartTime: this._activityStartTime,
      lastActivityChange: this._lastActivityChange,
      duration: this.getActivityDuration(),
    };
  }
}
