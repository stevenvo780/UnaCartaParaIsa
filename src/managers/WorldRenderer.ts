/**
 * World Renderer Simplificado - Delegación a clases especializadas
 */

import type { GameState, Zone } from "../types";
import type { WorldEntity } from "../types/worldEntities";
import { logAutopoiesis } from "../utils/logger";
import { WorldPopulator } from "../world/WorldPopulator";
import { BiomeManager } from "./BiomeManager";
import { EntityRenderer } from "./EntityRenderer";
import type { AnimationManager } from "./AnimationManager";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects = new Map<string, Phaser.GameObjects.GameObject>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private entityRenderer: EntityRenderer;
  private decorationSprites: Phaser.GameObjects.GameObject[] = [];
  private lastCullingUpdate = 0;
  private readonly cullingUpdateInterval = 100;
  private worldPopulator: WorldPopulator;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Initialize WorldPopulator
    this.worldPopulator = new WorldPopulator(
      scene,
      gameState.worldSize.width,
      gameState.worldSize.height,
      {
        maxEntitiesPerChunk: 15,
        chunkSize: 256,
        performanceMode: true,
        wildlifeRespawn: false,
        structurePersistence: true,
      },
    );

    // Get animation manager and initialize EntityRenderer
    const animManager = scene.registry.get(
      "animationManager",
    ) as AnimationManager;
    this.entityRenderer = new EntityRenderer(scene, animManager);

    logAutopoiesis.info(
      "WorldRenderer initialized with specialized components",
    );
  }

  /**
   * Render the complete world
   */
  public renderWorld(): void {
    this.clearPreviousRender();
    this.renderZones();
    this.renderMapElements();
    this.renderEntities();
    this.populateWorldWithDynamicEntities();

    logAutopoiesis.info("World rendered completely", {
      zones: this.gameState.zones.length,
      mapElements: this.gameState.mapElements.length,
      entities: this.gameState.entities.length,
    });
  }

  /**
   * Clear previous render
   */
  private clearPreviousRender(): void {
    this.renderedObjects.clear();
    this.zoneGraphics.forEach((graphic) => graphic.destroy());
    this.zoneGraphics = [];
    this.decorationSprites.forEach((sprite) => sprite.destroy());
    this.decorationSprites = [];
  }

  /**
   * Render zones
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone) => {
      this.renderZone(zone);
    });
  }

  /**
   * Render map elements
   */
  private renderMapElements(): void {
    this.gameState.mapElements.forEach((element) => {
      this.renderMapElement(element);
    });
  }

  /**
   * Render entities using EntityRenderer
   */
  private renderEntities(): void {
    // Convert Entity to WorldEntity format for rendering
    this.gameState.entities.forEach((entity) => {
      const worldEntity: WorldEntity = {
        id: entity.id,
        type: "decoration" as any, // Map to appropriate EntityType
        x: entity.position.x,
        y: entity.position.y,
        assetKey: entity.id, // Use entity id as asset key
        scale: 1,
        metadata: {},
      };
      this.renderWorldEntity(worldEntity);
    });
  }

  /**
   * Render a world entity using EntityRenderer
   */
  private renderWorldEntity(entity: WorldEntity): void {
    const renderedEntity = this.entityRenderer.renderWorldEntity(
      entity,
      this.gameState.worldSize.width,
      this.gameState.worldSize.height,
    );

    if (renderedEntity) {
      this.renderedObjects.set(entity.id, renderedEntity);
      this.decorationSprites.push(renderedEntity);
    } else {
      this.createFallbackEntity(entity);
    }
  }

  /**
   * Create fallback entity
   */
  private createFallbackEntity(entity: WorldEntity): void {
    const fallbackColor = this.getFallbackColor(entity.type);
    const fallbackSprite = this.scene.add.rectangle(
      entity.x,
      entity.y,
      24,
      24,
      fallbackColor,
    );
    fallbackSprite.setDepth(2);
    fallbackSprite.name = `${entity.type}_${entity.id}_fallback`;
    this.decorationSprites.push(fallbackSprite);
    this.renderedObjects.set(entity.id, fallbackSprite);

    logAutopoiesis.warn("Entity rendered as fallback rectangle", {
      entityId: entity.id,
      type: entity.type,
    });
  }

  /**
   * Get fallback color based on entity type
   */
  private getFallbackColor(entityType: string): number {
    const colorMap: Record<string, number> = {
      tree: 0x228b22,
      grass: 0x90ee90,
      rock: 0x708090,
      water: 0x4169e1,
      flower: 0xff69b4,
      food: 0xffa500,
      building: 0x8b4513,
      decoration: 0x9370db,
    };

    return colorMap[entityType] || 0x808080;
  }

  /**
   * Render a zone
   */
  private renderZone(zone: Zone): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.parseColor(zone.color), 1);
    graphics.fillRect(
      zone.bounds.x,
      zone.bounds.y,
      zone.bounds.width,
      zone.bounds.height,
    );
    graphics.setDepth(0);
    this.zoneGraphics.push(graphics);
  }

  /**
   * Render a map element
   */
  private renderMapElement(element: any): void {
    const color =
      typeof element.color === "string"
        ? this.parseColor(element.color)
        : element.color;

    const rect = this.scene.add.rectangle(
      element.position.x,
      element.position.y,
      element.size?.width || 20,
      element.size?.height || 20,
      color,
    );
    rect.setDepth(1);
    this.renderedObjects.set(element.id, rect);
  }

  /**
   * Parse color string to number
   */
  private parseColor(colorString: string): number {
    if (colorString.startsWith("#")) {
      return parseInt(colorString.substring(1), 16);
    }
    if (colorString.startsWith("rgba")) {
      // Extract hex from rgba - simple extraction
      return 0x888888; // Default gray for rgba
    }
    return 0x888888;
  }

  /**
   * Populate world with dynamic entities
   */
  private populateWorldWithDynamicEntities(): void {
    try {
      // Populate different regions with appropriate content
      this.worldPopulator.populateGlobalTerrain(
        0,
        0,
        this.gameState.worldSize.width,
        this.gameState.worldSize.height,
        BiomeManager.determineBiome(
          this.gameState.worldSize.width / 2,
          this.gameState.worldSize.height / 2,
          this.gameState.worldSize.width,
          this.gameState.worldSize.height,
        ),
      );
      this.worldPopulator.populateExteriorThematic(
        0,
        0,
        this.gameState.worldSize.width,
        this.gameState.worldSize.height,
        BiomeManager.determineBiome(
          this.gameState.worldSize.width / 2,
          this.gameState.worldSize.height / 2,
          this.gameState.worldSize.width,
          this.gameState.worldSize.height,
        ),
      );
      logAutopoiesis.info("World populated with dynamic entities");
    } catch (error) {
      logAutopoiesis.error("Error populating world", {
        error: String(error),
      });
    }
  }

  /**
   * Update world rendering (for dynamic changes)
   */
  public updateWorld(): void {
    // Performance optimization - only update if necessary
    const currentTime = Date.now();
    if (currentTime - this.lastCullingUpdate < this.cullingUpdateInterval) {
      return;
    }

    this.lastCullingUpdate = currentTime;
    // Implement culling logic here if needed
  }

  /**
   * Legacy method for MainScene compatibility - updateVisuals alias
   */
  public updateVisuals(): void {
    this.updateWorld();
  }

  /**
   * Get rendered object by ID
   */
  public getRenderedObject(
    id: string,
  ): Phaser.GameObjects.GameObject | undefined {
    return this.renderedObjects.get(id);
  }

  /**
   * Cleanup all rendered objects
   */
  public cleanup(): void {
    this.renderedObjects.forEach((obj) => obj.destroy());
    this.renderedObjects.clear();
    this.zoneGraphics.forEach((graphic) => graphic.destroy());
    this.zoneGraphics = [];
    this.decorationSprites.forEach((sprite) => sprite.destroy());
    this.decorationSprites = [];
    this.entityRenderer.cleanup();

    logAutopoiesis.info("WorldRenderer cleanup completed");
  }

  /**
   * Get rendering statistics
   */
  public getStats() {
    return {
      renderedObjects: this.renderedObjects.size,
      zoneGraphics: this.zoneGraphics.length,
      decorationSprites: this.decorationSprites.length,
      entityRenderer: this.entityRenderer.getStats(),
    };
  }

  /**
   * Destroy the WorldRenderer - Legacy method for MainScene compatibility
   */
  public destroy(): void {
    this.cleanup();
  }
}
