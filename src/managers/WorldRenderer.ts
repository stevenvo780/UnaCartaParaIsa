/**
 * World Renderer - Maneja todo el rendering visual del mundo
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { WorldPopulator } from "../world/WorldPopulator";
import { BiomeType } from "../world/types";
import type { AnimationManager } from "./AnimationManager";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects = new Map<string, Phaser.GameObjects.GameObject>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private animationManager?: AnimationManager;
  private decorationSprites: Phaser.GameObjects.Sprite[] = [];
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
        maxEntitiesPerChunk: 15, // Reducido para mejor performance
        chunkSize: 256,
        performanceMode: true,
        wildlifeRespawn: false,
        structurePersistence: true,
      },
    );

    // Get animation manager from scene registry with type safety
    const animManager = scene.registry.get("animationManager");
    if (animManager) {
      this.animationManager = animManager;
      logAutopoiesis.info("AnimationManager available in WorldRenderer");
    } else {
      this.animationManager = undefined;
      logAutopoiesis.warn("AnimationManager not available in WorldRenderer");
    }

    logAutopoiesis.info("WorldRenderer initialized");
  }

  /**
   * Render the complete world
   */
  public renderWorld(): void {
    this.createWorldBackground();
    this.renderZones();
    this.populateWorldWithDecorations();

    logAutopoiesis.info("World rendering completed", {
      zones: this.gameState.zones.length,
      objects: this.renderedObjects.size,
    });
  }

  /**
   * Create world background using optimized system
   */
  private createWorldBackground(): void {
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;
    const tileSize = 64; // Tamaño de cada tile de césped

    // Crear fondo usando texturas de césped variadas
    let tileCount = 0;

    // Usar las texturas de césped que sí están disponibles
    const availableGrassTextures = [
      "grass_1",
      "grass_2",
      "grass_3",
      "grass_middle",
    ];

    for (let x = 0; x < worldWidth; x += tileSize) {
      for (let y = 0; y < worldHeight; y += tileSize) {
        // Seleccionar una textura de césped aleatoria de las disponibles
        const grassKey =
          availableGrassTextures[
            Math.floor(Math.random() * availableGrassTextures.length)
          ];

        // Verificar si la textura existe antes de usarla
        if (this.scene.textures.exists(grassKey)) {
          const grassTile = this.scene.add.image(
            x + tileSize / 2,
            y + tileSize / 2,
            grassKey,
          );
          grassTile.setDisplaySize(tileSize, tileSize);
          grassTile.setDepth(0);
          this.renderedObjects.set(`grass_tile_${tileCount}`, grassTile);
          tileCount++;
        } else {
          // Fallback a rectángulo verde si la textura no existe
          const fallbackTile = this.scene.add.rectangle(
            x + tileSize / 2,
            y + tileSize / 2,
            tileSize,
            tileSize,
            0x90ee90,
          );
          fallbackTile.setDepth(0);
          this.renderedObjects.set(`grass_fallback_${tileCount}`, fallbackTile);
          tileCount++;
        }
      }
    }

    logAutopoiesis.info("World background created with grass textures", {
      worldSize: `${worldWidth}x${worldHeight}`,
      tilesCreated: tileCount,
      availableTextures: availableGrassTextures.length,
    });
  }

  /**
   * Precarga assets de césped reales - Los assets ya están definidos en AssetManager
   */
  private preloadGrassAssets(grassAssets: string[]): void {
    // Los assets ya deberían estar cargados por AssetManager
    // Solo verificamos que existan
    const missingAssets = grassAssets.filter(
      (assetKey) => !this.scene.textures.exists(assetKey),
    );

    if (missingAssets.length > 0) {
      logAutopoiesis.warn("Assets de césped faltantes:", missingAssets);

      // Cargar manualmente los que falten
      missingAssets.forEach((assetKey) => {
        let assetPath = "";

        if (assetKey === "grass_1") {
          assetPath = "assets/terrain/base/cesped1.png";
        } else if (assetKey === "grass_2") {
          assetPath = "assets/terrain/base/cesped2.png";
        } else if (assetKey === "grass_3") {
          assetPath = "assets/terrain/base/cesped3.png";
        } else if (assetKey === "grass_middle") {
          assetPath = "assets/terrain/base/Grass_Middle.png";
        }

        if (assetPath) {
          try {
            this.scene.load.image(assetKey, assetPath);
          } catch (error) {
            logAutopoiesis.warn(`No se pudo cargar ${assetKey}:`, error);
          }
        }
      });

      // Iniciar carga si hay assets pendientes
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    }
  }

  /**
   * Crea texture de fallback para césped
   */
  private createFallbackGrassTexture(key: string): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x90ee90); // Verde césped
    graphics.fillRect(0, 0, 32, 32);

    // Añadir textura simple
    graphics.fillStyle(0x7ccd7c);
    for (let i = 0; i < 8; i++) {
      graphics.fillCircle(Math.random() * 32, Math.random() * 32, 2);
    }

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  /**
   * Render all zones visually - ULTRA SIMPLIFICADO para 60 FPS
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone, _index) => {
      const colorValue: number = 0x4caf50; // Default green

      const zoneRect = this.scene.add.rectangle(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.bounds.width,
        zone.bounds.height,
        colorValue,
        0.3,
      );
      zoneRect.setStrokeStyle(2, colorValue, 0.8);
      zoneRect.setDepth(1);

      const label = this.scene.add.text(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.name,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: "Arial",
          fontStyle: "bold",
          align: "center",
        },
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke("#000000", 3);

      this.renderedObjects.set(`zone_${zone.id}`, zoneRect);
      this.renderedObjects.set(`zone_label_${zone.id}`, label);
    });
  }

  /**
   * Populate world with decorations based on zones
   */
  private populateWorldWithDecorations(): void {
    try {
      this.gameState.zones.forEach((zone) => {
        const biome = this.determineBiomeFromZone(zone.name);
        const seed = this.hashStringToNumber(zone.id);

        // Generate decorations for this zone
        const entities = this.worldPopulator.populateRegion(
          zone.bounds.x,
          zone.bounds.y,
          zone.bounds.width,
          zone.bounds.height,
          biome,
          seed,
        );

        // Render each decoration entity
        entities.forEach((entity) => {
          this.renderWorldEntity(entity);
        });

        logAutopoiesis.debug(
          `Populated zone ${zone.name} with ${entities.length} decorations`,
        );
      });

      logAutopoiesis.info(
        `🎨 World decorated with ${this.decorationSprites.length} elements`,
      );
    } catch (error) {
      logAutopoiesis.error("❌ Error populating world decorations:", error);
    }
  }

  /**
   * Determine biome type from zone name
   */
  private determineBiomeFromZone(zoneName: string): BiomeType {
    const name = zoneName.toLowerCase();

    if (name.includes("biblioteca") || name.includes("library")) {
      return BiomeType.FOREST;
    } else if (name.includes("santuario") || name.includes("sanctuary")) {
      return BiomeType.MYSTICAL;
    } else if (name.includes("cocina") || name.includes("kitchen")) {
      return BiomeType.VILLAGE;
    } else if (
      name.includes("cuarto") ||
      name.includes("room") ||
      name.includes("bedroom")
    ) {
      return BiomeType.GRASSLAND;
    } else if (name.includes("jardín") || name.includes("garden")) {
      return BiomeType.GRASSLAND;
    } else {
      return BiomeType.GRASSLAND; // Default biome
    }
  }

  /**
   * Render a world entity (tree, structure, etc.)
   */
  private renderWorldEntity(entity: any): void {
    try {
      // 🎯 NUEVO: Mapeo directo de tipos de entidades a texturas disponibles
      const textureKey = this.getEntityTextureKey(entity.type, entity.assetKey);

      if (textureKey && this.scene.textures.exists(textureKey)) {
        // ✅ Crear sprite estático con textura real
        const staticSprite = this.scene.add.sprite(
          entity.x,
          entity.y,
          textureKey,
        );
        staticSprite.setDepth(2);
        staticSprite.setOrigin(0.5, 0.5);

        // Escalar según el tipo de entidad
        const scale = this.getEntityScale(entity.type);
        staticSprite.setScale(scale);

        staticSprite.name = `${entity.type}_${entity.id}`;
        this.decorationSprites.push(staticSprite);
        this.renderedObjects.set(entity.id, staticSprite);

        logAutopoiesis.debug(
          `✅ Entity ${entity.id} rendered with texture: ${textureKey}`,
        );
        return;
      }

      // 🎯 INTENTO: Usar AnimationManager solo si existe y funciona
      if (
        this.animationManager &&
        entity.assetKey &&
        this.animationManager.hasAnimation(entity.assetKey)
      ) {
        const animatedSprite = this.animationManager.createAnimatedSprite(
          entity.x,
          entity.y,
          entity.assetKey,
        );
        if (animatedSprite) {
          animatedSprite.setDepth(2);
          animatedSprite.name = `${entity.type}_${entity.id}`;
          this.decorationSprites.push(animatedSprite);
          this.renderedObjects.set(entity.id, animatedSprite);
          return;
        }
      }

      // ❌ Fallback final: cuadro de color
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
      this.decorationSprites.push(fallbackSprite as any);
      this.renderedObjects.set(entity.id, fallbackSprite);

      logAutopoiesis.warn(
        `⚠️ Entity ${entity.id} (${entity.type}) rendered as fallback rectangle`,
      );
    } catch (error) {
      logAutopoiesis.warn(`Failed to render entity ${entity.id}:`, error);

      // Create a simple fallback
      const fallback = this.scene.add.circle(entity.x, entity.y, 12, 0x228b22);
      fallback.setDepth(2);
      fallback.name = `${entity.type}_${entity.id}_error`;
      this.decorationSprites.push(fallback as any);
      this.renderedObjects.set(entity.id, fallback);
    }
  }

  /**
   * 🎯 Mapea tipos de entidades a texturas disponibles - VERSIÓN REALISTA
   */
  private getEntityTextureKey(
    entityType: string,
    assetKey?: string,
  ): string | null {
    // 🏠 MAPEO REALISTA DE ESTRUCTURAS (casas reales)
    const houseTextures = ["house_hay", "house_stone", "house_wood", "well"];

    // 🌳 MAPEO REALISTA DE ÁRBOLES (variedad de árboles)
    const treeTextures = [
      "tree_emerald",
      "tree_swirling",
      "tree_white",
      "tree_willow",
      "tree_mega",
    ];

    // 🌿 MAPEO DE VEGETACIÓN MENOR
    const vegetationTextures = [
      "bush_emerald",
      "living_gazebo",
      "flowers-red",
      "flowers-white",
    ];

    // Mapeo directo basado en texturas disponibles verificadas
    const entityTextureMap: { [key: string]: string } = {
      // Entidades principales (sin cambio)
      campfire: "campfire",
      woman: "woman",
      man: "man",
      store: "food_store",
      food_store: "food_store",

      // 🏠 ESTRUCTURAS -> Usar casas reales de forma aleatoria
      structure: this.getRandomTexture(houseTextures),
      house: this.getRandomTexture(houseTextures),
      building: this.getRandomTexture(houseTextures),

      // 🌳 ÁRBOLES -> Usar árboles reales de forma aleatoria
      tree: this.getRandomTexture(treeTextures),
      oak: this.getRandomTexture(treeTextures),
      pine: this.getRandomTexture(treeTextures),

      // 🌿 VEGETACIÓN -> Usar plantas menores
      vegetation: this.getRandomTexture(vegetationTextures),
      bush: this.getRandomTexture(vegetationTextures),
      shrub: this.getRandomTexture(vegetationTextures),

      // Ruinas y wildlife (sin cambio, menos frecuentes)
      ruin: "man", // Usar 'man' como placeholder para ruins
      wildlife: "woman", // Usar 'woman' como placeholder para animales

      // 🎯 MAPEOS ESPECÍFICOS PARA ENTIDADES SPECIAL
      special: this.getRandomTexture([...treeTextures, ...vegetationTextures]), // Mezcla naturaleza

      // Mapeos por assetKey específicos
      ruin_forest: "man",
      structure_house: this.getRandomTexture(houseTextures),
      wildlife_chicken: "woman",
      tree_oak: this.getRandomTexture(treeTextures),

      // 🎯 MAPEOS REALISTAS para tipos especiales por nombre
      flower_meadows: this.getRandomTexture(vegetationTextures), // Flores variadas
      campfire_sites: "campfire", // Solo estos son fogatas reales
      ancient_groves: this.getRandomTexture(treeTextures), // Árboles ancianos
      mystical_circles: this.getRandomTexture(vegetationTextures), // Vegetación mística
      sacred_springs: "well", // Pozos en manantiales
      crystal_formations: "man", // Cristales -> man
      ruins_ancient: "man", // Ruinas -> man
    };

    // 🎯 LÓGICA ESPECIAL para entidades "special"
    if (entityType === "special" && assetKey) {
      // Extraer el nombre del feature del assetKey
      const featureName = assetKey.split("_").slice(0, 2).join("_");
      if (entityTextureMap[featureName]) {
        return entityTextureMap[featureName];
      }
    }

    // Priorizar assetKey si existe
    if (assetKey && entityTextureMap[assetKey]) {
      return entityTextureMap[assetKey];
    }

    // Usar entityType como fallback
    return entityTextureMap[entityType] || null;
  }

  /**
   * 🎯 Obtiene una textura aleatoria de un array (para variedad)
   */
  private getRandomTexture(textures: string[]): string {
    const index = Math.floor(Math.random() * textures.length);
    return textures[index];
  } /**
   * 🎯 Define escalas apropiadas para diferentes tipos de entidades
   */
  private getEntityScale(entityType: string): number {
    const scaleMap: { [key: string]: number } = {
      campfire: 0.8,
      woman: 1.0,
      man: 1.0,
      food_store: 1.2,
      ruin: 0.9,
      structure: 1.1,
      wildlife: 0.7,
      tree: 1.3,
      vegetation: 1.0,
    };

    return scaleMap[entityType] || 1.0;
  }

  /**
   * Get fallback color based on entity type
   */
  private getFallbackColor(entityType: string): number {
    switch (entityType) {
      case "ruin":
        return 0x8b7355; // Brown for ruins
      case "structure":
        return 0x654321; // Dark brown for structures
      case "wildlife":
        return 0xffb6c1; // Light pink for animals
      case "tree":
      case "vegetation":
        return 0x228b22; // Forest green for trees
      default:
        return 0x696969; // Gray for unknown
    }
  }

  /**
   * Convert string to a consistent number hash
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update visual elements that change over time including culling optimization
   */
  public updateVisuals(): void {
    const now = Date.now();

    // Perform culling optimization at regular intervals
    if (now - this.lastCullingUpdate > this.cullingUpdateInterval) {
      this.performDecorationCulling();
      this.lastCullingUpdate = now;
    }
  }

  /**
   * Optimize decorations by culling off-screen sprites and pausing animations
   */
  private performDecorationCulling(): void {
    if (!this.scene.cameras?.main) {
      return;
    }

    const camera = this.scene.cameras.main;
    const cameraView = camera.worldView;

    // Add margin to prevent popping when sprites are just outside view
    const margin = 100;
    const extendedView = new Phaser.Geom.Rectangle(
      cameraView.x - margin,
      cameraView.y - margin,
      cameraView.width + margin * 2,
      cameraView.height + margin * 2,
    );

    let visibleCount = 0;
    let pausedCount = 0;

    this.decorationSprites.forEach((decoration) => {
      if (!decoration?.scene) {
        return;
      }

      const inView = extendedView.contains(decoration.x, decoration.y);

      if (inView) {
        visibleCount++;
        if (!decoration.visible) {
          decoration.setVisible(true);
        }
        if (decoration.anims?.isPaused) {
          decoration.anims.resume();
        }
      } else {
        if (decoration.visible) {
          decoration.setVisible(false);
        }
        if (decoration.anims?.isPlaying) {
          decoration.anims.pause();
          pausedCount++;
        }
      }
    });

    // Log culling stats occasionally
    if (Math.random() < 0.1) {
      logAutopoiesis.debug("Decoration culling performed", {
        totalDecorations: this.decorationSprites.length,
        visible: visibleCount,
        paused: pausedCount,
      });
    }
  }

  /**
   * Hide/show specific elements
   */
  public setElementVisibility(elementId: string, visible: boolean): void {
    const element = this.renderedObjects.get(elementId);
    if (element && "setVisible" in element) {
      (
        element as Phaser.GameObjects.GameObject & {
          setVisible: (visible: boolean) => void;
        }
      ).setVisible(visible);
    }
  }

  /**
   * Change element tint
   */
  public setElementTint(elementId: string, tint: number): void {
    const element = this.renderedObjects.get(elementId);
    if (element && "setTint" in element) {
      (
        element as Phaser.GameObjects.GameObject & {
          setTint: (tint: number) => void;
        }
      ).setTint(tint);
    }
  }

  /**
   * Cleanup all rendered objects including animated sprites
   */
  public destroy(): void {
    this.renderedObjects.forEach((obj) => {
      if (obj?.destroy) {
        if ("anims" in obj && obj.anims && typeof obj.anims === "object") {
          const animState = obj.anims as {
            isPlaying: boolean;
            stop: () => void;
          };
          if (animState.isPlaying && typeof animState.stop === "function") {
            animState.stop();
          }
        }
        obj.destroy();
      }
    });

    this.zoneGraphics.forEach((graphic) => {
      if (graphic?.destroy) {
        graphic.destroy();
      }
    });

    this.renderedObjects.clear();
    this.zoneGraphics.length = 0;
    this.decorationSprites.length = 0;
    this.animationManager = undefined;

    logAutopoiesis.info("WorldRenderer destroyed");
  }

  /**
   * Get rendering statistics
   */
  public getStats(): {
    renderedObjects: number;
    zones: number;
    elements: number;
  } {
    return {
      renderedObjects: this.renderedObjects.size,
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
    };
  }
}
