/**
 * Componente para manejar las estadísticas de una entidad
 * Separa la lógica de stats del GameEntity para mejor componentización
 */

import type { EntityStats } from '../types';

export class EntityStatsComponent {
  private stats: EntityStats;
  private initialStats: EntityStats;

  constructor(initialStats: Partial<EntityStats>) {
    this.initialStats = {
      hunger: initialStats.hunger || 50,
      sleepiness: initialStats.sleepiness || 50,
      loneliness: initialStats.loneliness || 50,
      happiness: initialStats.happiness || 50,
      energy: initialStats.energy || 50,
      boredom: initialStats.boredom || 50,
      money: initialStats.money || 50,
      health: initialStats.health || 90,
      stress: initialStats.stress || 0,
      comfort: initialStats.comfort || 50,
      creativity: initialStats.creativity || 50,
      resonance: initialStats.resonance || 0,
      courage: initialStats.courage || 50,
    };

    this.stats = { ...this.initialStats };
  }

  /**
   * Obtiene todas las estadísticas
   */
  getStats(): EntityStats {
    return { ...this.stats };
  }

  /**
   * Establece una estadística específica
   */
  setStat(statName: keyof EntityStats, value: number): void {
    this.stats[statName] = Math.max(0, Math.min(100, value));
  }

  /**
   * Modifica una estadística por delta
   */
  modifyStat(statName: keyof EntityStats, delta: number): void {
    this.setStat(statName, this.stats[statName] + delta);
  }

  /**
   * Actualiza múltiples estadísticas
   */
  updateStats(newStats: Partial<EntityStats>): void {
    Object.entries(newStats).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setStat(key as keyof EntityStats, value);
      }
    });
  }

  /**
   * Resetea las estadísticas a sus valores iniciales
   */
  reset(): void {
    this.stats = { ...this.initialStats };
  }

  /**
   * Verifica si alguna estadística está en estado crítico
   */
  hasStatInCriticalState(): boolean {
    return (
      this.stats.health <= 20 ||
      this.stats.energy <= 10 ||
      this.stats.hunger <= 10
    );
  }

  /**
   * Obtiene el estado general de las estadísticas
   */
  getOverallWellbeing(): 'critical' | 'poor' | 'good' | 'excellent' {
    const average =
      (this.stats.happiness +
        this.stats.energy +
        this.stats.health +
        this.stats.comfort) /
      4;

    if (average <= 25) return 'critical';
    if (average <= 50) return 'poor';
    if (average <= 75) return 'good';
    return 'excellent';
  }
}
