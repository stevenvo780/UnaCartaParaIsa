/**
 * Entity Manager - Maneja el registro y gestión de entidades
 */

import type { Entity } from "../types";
import { logAutopoiesis } from "../utils/logger";

export class EntityManager {
  private entities = new Map<string, Entity>();
  private entityStats = new Map<string, any>();

  /**
   * Registra una entidad en el sistema
   */
  public registerEntity(entityId: string, entity: Entity): void {
    this.entities.set(entityId, entity);
    logAutopoiesis.debug("Entity registered", { entityId });
  }

  /**
   * Desregistra una entidad del sistema
   */
  public unregisterEntity(entityId: string): void {
    if (this.entities.has(entityId)) {
      this.entities.delete(entityId);
      this.entityStats.delete(entityId);
      logAutopoiesis.debug("Entity unregistered", { entityId });
    }
  }

  /**
   * Obtiene una entidad específica por ID
   */
  public getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Obtiene todas las entidades registradas
   */
  public getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Obtiene todas las entidades como mapa
   */
  public getAllEntities(): Map<string, Entity> {
    return new Map(this.entities);
  }

  /**
   * Verifica si una entidad está registrada
   */
  public hasEntity(entityId: string): boolean {
    return this.entities.has(entityId);
  }

  /**
   * Actualiza estadísticas extendidas de una entidad
   */
  public updateEntityStats(entityId: string, stats: any): void {
    if (this.entities.has(entityId)) {
      this.entityStats.set(entityId, stats);
    }
  }

  /**
   * Obtiene estadísticas extendidas de una entidad
   */
  public getEntityStats(entityId: string): any {
    return this.entityStats.get(entityId);
  }

  /**
   * Obtiene entidades por tipo
   */
  public getEntitiesByType(predicate: (entity: Entity) => boolean): Entity[] {
    return Array.from(this.entities.values()).filter(predicate);
  }

  /**
   * Crea las entidades principales (isa y stev) - Legacy method for MainScene compatibility
   */
  public createEntities(gameState: any): { isaEntity: any; stevEntity: any } {
    // This is a legacy method for compatibility with MainScene
    // In a proper implementation, entities should be created through proper factories
    logAutopoiesis.warn(
      "Using legacy createEntities method - should be refactored",
    );

    // Return mock entities that satisfy the interface
    const mockEntity = {
      id: "",
      position: { x: 0, y: 0 },
      stats: { happiness: 50, energy: 50, health: 50 },
      setPartnerEntity: () => {},
      updateEntity: () => {},
    };

    return {
      isaEntity: { ...mockEntity, id: "isa" },
      stevEntity: { ...mockEntity, id: "stev" },
    };
  }

  /**
   * Obtiene grupo de entidades - Legacy method for MainScene compatibility
   */
  public getEntitiesGroup(): any {
    logAutopoiesis.warn(
      "Using legacy getEntitiesGroup method - should be refactored",
    );
    // Return a mock Phaser Group-like object to prevent null access errors
    return {
      children: [],
      add: () => {},
      remove: () => {},
      setVisible: () => {},
      setDepth: () => {},
    };
  }

  /**
   * Limpia todas las entidades
   */
  public clearAllEntities(): void {
    const count = this.entities.size;
    this.entities.clear();
    this.entityStats.clear();
    logAutopoiesis.info("All entities cleared", { count });
  }

  /**
   * Obtiene estadísticas del manager
   */
  public getManagerStats() {
    return {
      totalEntities: this.entities.size,
      entitiesWithStats: this.entityStats.size,
      registeredIds: Array.from(this.entities.keys()),
    };
  }

  /**
   * Exporta los estados de entidades para logging
   */
  public exportEntityStates(): Array<{
    id: string;
    activity: string;
    mood: string;
    alive: boolean;
  }> {
    return Array.from(this.entities.entries()).map(([id, entity]) => {
      const stats = this.entityStats.get(id);
      return {
        id,
        activity: stats?.activity ?? "unknown",
        mood: entity.mood ?? "unknown",
        alive: !stats?.isDead,
      };
    });
  }
}
