/**
 * Entity Manager - Maneja el registro y gestión de entidades
 */

import { AnimatedGameEntity } from "../entities/AnimatedGameEntity";
import { logAutopoiesis } from "../utils/logger";

type ExtendedEntityStats = Record<string, unknown>;

export class EntityManager {
  private entities = new Map<string, AnimatedGameEntity>();
  private entityStats = new Map<string, ExtendedEntityStats>();
  private entitiesGroup?: Phaser.GameObjects.Group;

  constructor(private scene?: Phaser.Scene) {}

  /**
   * Registra una entidad en el sistema
   */
  public registerEntity(entityId: string, entity: AnimatedGameEntity): void {
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
  public getEntity(entityId: string): AnimatedGameEntity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Obtiene todas las entidades registradas
   */
  public getEntities(): AnimatedGameEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Obtiene todas las entidades como mapa
   */
  public getAllEntities(): Map<string, AnimatedGameEntity> {
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
  public updateEntityStats(entityId: string, stats: ExtendedEntityStats): void {
    if (this.entities.has(entityId)) {
      this.entityStats.set(entityId, stats);
    }
  }

  /**
   * Obtiene estadísticas extendidas de una entidad
   */
  public getEntityStats(entityId: string): ExtendedEntityStats | undefined {
    return this.entityStats.get(entityId);
  }

  /**
   * Obtiene entidades por predicado
   */
  public getEntitiesByType(
    predicate: (entity: AnimatedGameEntity) => boolean,
  ): AnimatedGameEntity[] {
    return Array.from(this.entities.values()).filter(predicate);
  }

  /**
   * Crea las entidades principales (isa y stev) - Método real con AnimatedGameEntity
   */
  public createEntities(gameState: { scene?: Phaser.Scene }): {
    isaEntity: AnimatedGameEntity;
    stevEntity: AnimatedGameEntity;
  } {
    const scene = this.scene || gameState.scene || this.getActiveScene();

    if (!scene) {
      logAutopoiesis.error("No scene available to create entities");
      // Fallback: retornar entidades no añadidas (evitar any)
      const dummyScene = new Phaser.Scene("Dummy");
      const isaEntity = new AnimatedGameEntity(dummyScene, 0, 0, "isa");
      const stevEntity = new AnimatedGameEntity(dummyScene, 0, 0, "stev");
      return { isaEntity, stevEntity };
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
        stev: { x: stevEntity.x, y: stevEntity.y },
      });

      return { isaEntity, stevEntity };
    } catch (error) {
      logAutopoiesis.error("Error creando entidades reales", error);
      const isaEntity = new AnimatedGameEntity(scene, 0, 0, "isa");
      const stevEntity = new AnimatedGameEntity(scene, 0, 0, "stev");
      return { isaEntity, stevEntity };
    }
  }

  /**
   * Obtener la scene activa del juego si no se proporcionó
   */
  private getActiveScene(): Phaser.Scene | null {
    if (this.scene) return this.scene;
    if (typeof window !== "undefined" && (window as any).game) {
      const game = (window as any).game;
      const scenes = game.scene.getScenes(true);
      return (
        scenes.find((s: Phaser.Scene) => s.scene.key === "MainScene") ||
        scenes[0] ||
        null
      );
    }
    return null;
  }

  /**
   * Obtiene grupo de entidades - Método real con Phaser Group
   */
  public getEntitiesGroup(): Phaser.GameObjects.Group {
    if (!this.entitiesGroup) {
      const scene = this.getActiveScene();
      if (scene) {
        this.entitiesGroup = scene.add.group();
        logAutopoiesis.info("Phaser Group creado para entidades");
      } else {
        logAutopoiesis.warn(
          "No scene available for entities group, using mock",
        );
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
  public addToGroup(entity: AnimatedGameEntity): void {
    const group = this.getEntitiesGroup();
    if (group && typeof group.add === "function") {
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
        activity: (stats as any)?.activity ?? "unknown",
        mood: (entity as any).mood ?? "unknown",
        alive: !(stats as any)?.isDead,
      };
    });
  }
}
