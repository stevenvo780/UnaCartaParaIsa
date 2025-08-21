/**
 * Entity Manager - Maneja el registro y gestión de entidades
 */

import type { Entity } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { AnimatedGameEntity } from "../entities/AnimatedGameEntity";

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
   * Crea las entidades principales (isa y stev) - Método real con AnimatedGameEntity
   */
  public createEntities(gameState: any): { isaEntity: any; stevEntity: any } {
    // Importar AnimatedGameEntity dinámicamente
    const scene = gameState.scene || this.getActiveScene();
    
    if (!scene) {
      logAutopoiesis.error("No scene available to create entities");
      return this.createMockEntities();
    }

    try {
      // Crear entidades reales con AnimatedGameEntity
      const isaEntity = new AnimatedGameEntity(scene, 400, 300, "isa");
      const stevEntity = new AnimatedGameEntity(scene, 450, 300, "stev");

      // Registrar las entidades en el manager
      this.registerEntity("isa", isaEntity);
      this.registerEntity("stev", stevEntity);

      // Añadir a la escena y al grupo
      scene.add.existing(isaEntity);
      scene.add.existing(stevEntity);
      
      // Añadir al grupo de entidades
      this.addToGroup(isaEntity);
      this.addToGroup(stevEntity);

      logAutopoiesis.info("✅ Entidades reales creadas exitosamente", {
        isa: { x: isaEntity.x, y: isaEntity.y },
        stev: { x: stevEntity.x, y: stevEntity.y }
      });

      return { isaEntity, stevEntity };
    } catch (error) {
      logAutopoiesis.error("Error creando entidades reales, usando mock", error);
      return this.createMockEntities();
    }
  }

  /**
   * Crear entidades mock como fallback
   */
  private createMockEntities(): { isaEntity: any; stevEntity: any } {
    logAutopoiesis.warn("Using mock entities as fallback");
    
    const mockEntity = {
      id: "",
      position: { x: 0, y: 0 },
      stats: { happiness: 50, energy: 50, health: 50 },
      setPartnerEntity: () => {},
      updateEntity: () => {},
      getPosition: () => ({ x: 0, y: 0 }),
      getCurrentActivity: () => "idle",
      getMood: () => "neutral",
      getStats: () => ({ happiness: 50, energy: 50, health: 50 }),
      isDead: () => false,
    };

    return {
      isaEntity: { ...mockEntity, id: "isa" },
      stevEntity: { ...mockEntity, id: "stev" },
    };
  }

  /**
   * Obtener la scene activa del registro de Phaser
   */
  private getActiveScene(): Phaser.Scene | null {
    // Intentar obtener la scene del game global si está disponible
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const scenes = game.scene.getScenes(true); // Solo scenes activas
      return scenes.find((s: Phaser.Scene) => s.scene.key === 'MainScene') || scenes[0] || null;
    }
    return null;
  }

  private entitiesGroup?: Phaser.GameObjects.Group;

  /**
   * Obtiene grupo de entidades - Método real con Phaser Group
   */
  public getEntitiesGroup(): Phaser.GameObjects.Group {
    if (!this.entitiesGroup) {
      // Buscar scene activa para crear el grupo
      const scene = this.getActiveScene();
      if (scene) {
        this.entitiesGroup = scene.add.group();
        logAutopoiesis.info("Phaser Group creado para entidades");
      } else {
        logAutopoiesis.warn("No scene available for entities group, using mock");
        // Return a mock Phaser Group-like object to prevent null access errors
        return {
          children: { size: 0 },
          add: () => {},
          remove: () => {},
          setVisible: () => {},
          setDepth: () => {},
        } as any;
      }
    }
    return this.entitiesGroup;
  }

  /**
   * Añadir entidad al grupo
   */
  public addToGroup(entity: any): void {
    const group = this.getEntitiesGroup();
    if (group && typeof group.add === 'function') {
      group.add(entity);
    }
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
