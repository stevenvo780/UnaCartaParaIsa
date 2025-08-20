/**
 * World Renderer - Maneja todo el rendering visual del mundo
 */

import type { GameState, Zone } from "../types";
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
   * Populate world with decorations - SISTEMA DUAL: Base + Zonas
   */
  private populateWorldWithDecorations(): void {
    try {
      // 🌍 FASE 1: Poblar TODA la base del mapa con vegetación distribuida
      this.populateBaseWorldLayer();

      // 🏠 FASE 2: Poblar zonas específicas con contenido temático
      this.populateZoneSpecificContent();

      logAutopoiesis.info(
        `🎨 World decorated with ${this.decorationSprites.length} elements (base + zones)`,
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
   * Render a world entity (tree, structure, etc.) - CON DETECCIÓN DE ANIMACIONES
   */
  private renderWorldEntity(entity: any, zoneName?: string): void {
    try {
      // 🎯 NUEVO: Mapeo directo de tipos de entidades a texturas disponibles
      let textureKey = this.getEntityTextureKey(
        entity.type,
        entity.assetKey,
        zoneName,
      );

      if (!textureKey) {
        this.createFallbackEntity(entity);
        return;
      }

      // 🎬 NUEVO: Detectar si debe usar versión animada
      textureKey = this.getAnimatedVersionIfExists(textureKey);

      if (this.scene.textures.exists(textureKey)) {
        // 🎭 Verificar si es una animación
        if (this.isAnimatedTexture(textureKey)) {
          this.createAnimatedEntity(entity, textureKey);
        } else {
          this.createStaticEntity(entity, textureKey);
        }
        return;
      }

      // 🎯 INTENTO: Usar AnimationManager como fallback
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

      // ❌ Fallback final
      this.createFallbackEntity(entity);
    } catch (error) {
      logAutopoiesis.warn(`Failed to render entity ${entity.id}:`, error);
      this.createFallbackEntity(entity);
    }
  }

  /**
   * 🎬 Crear entidad animada (spritesheet con animación)
   */
  private createAnimatedEntity(entity: any, textureKey: string): void {
    const animatedSprite = this.scene.add.sprite(
      entity.x,
      entity.y,
      textureKey,
    );
    animatedSprite.setDepth(2);
    animatedSprite.setOrigin(0.5, 0.5);

    // Configurar escala
    const scale = this.getEntityScale(entity.type);
    animatedSprite.setScale(scale);

    // Intentar reproducir animación si existe
    try {
      // Crear animación básica si no existe
      const animKey = `${textureKey}_play`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(textureKey, {
            start: 0,
            end: -1,
          }),
          frameRate: 8, // 8 FPS para animaciones suaves
          repeat: -1, // Repetir infinitamente
        });
      }

      // Reproducir animación
      animatedSprite.play(animKey);

      logAutopoiesis.debug(
        `🎬 Animated entity ${entity.id} created with ${textureKey}`,
      );
    } catch (animError) {
      logAutopoiesis.warn(
        `Animation failed for ${textureKey}, using static:`,
        animError,
      );
      // Si falla la animación, usar como sprite estático
    }

    animatedSprite.name = `${entity.type}_${entity.id}_animated`;
    this.decorationSprites.push(animatedSprite);
    this.renderedObjects.set(entity.id, animatedSprite);
  }

  /**
   * 🖼️ Crear entidad estática (sprite normal)
   */
  private createStaticEntity(entity: any, textureKey: string): void {
    const staticSprite = this.scene.add.sprite(entity.x, entity.y, textureKey);
    staticSprite.setDepth(2);
    staticSprite.setOrigin(0.5, 0.5);

    // Escalar según el tipo de entidad
    const scale = this.getEntityScale(entity.type);
    staticSprite.setScale(scale);

    staticSprite.name = `${entity.type}_${entity.id}`;
    this.decorationSprites.push(staticSprite);
    this.renderedObjects.set(entity.id, staticSprite);

    logAutopoiesis.debug(
      `✅ Static entity ${entity.id} rendered with texture: ${textureKey}`,
    );
  }

  /**
   * ❌ Crear entidad de fallback
   */
  private createFallbackEntity(entity: any): void {
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
  }

  /**
   * 🎯 Mapea tipos de entidades a texturas disponibles - VERSIÓN CON ZONIFICACIÓN
   */
  private getEntityTextureKey(
    entityType: string,
    assetKey?: string,
    zoneName?: string,
  ): string | null {
    // 🏠 DETECTAR SI ES ZONA INTERIOR O EXTERIOR
    const isInteriorZone = this.isInteriorZone(zoneName || "");

    if (isInteriorZone) {
      return this.getInteriorAssets(entityType);
    } else {
      return this.getExteriorAssets(entityType, assetKey);
    }
  }

  /**
   * 🏠 Determina si una zona es interior basada en su nombre
   */
  private isInteriorZone(zoneName: string): boolean {
    const interiorKeywords = [
      "biblioteca",
      "library",
      "santuario",
      "sanctuary",
      "cocina",
      "kitchen",
      "cuarto",
      "room",
      "bedroom",
      "comedor",
      "dining",
      "sala",
      "living",
      "oficina",
      "office",
      "estudio",
      "study",
    ];

    const lowerZoneName = zoneName.toLowerCase();
    return interiorKeywords.some((keyword) => lowerZoneName.includes(keyword));
  }

  /**
   * 🏠 Assets para zonas INTERIORES (mobiliario, lámparas, etc.)
   */
  private getInteriorAssets(entityType: string): string {
    const interiorTextures: { [key: string]: string } = {
      // Mobiliario y decoración interior
      structure: this.getRandomTexture([
        "chair_interior",
        "chest_treasure",
        "bookshelf",
      ]),
      decoration: this.getRandomTexture([
        "lamp_interior",
        "window_interior",
        "sign_interior",
      ]),
      special: this.getRandomTexture([
        "wooden_floor",
        "wall_brick",
        "wall_stone",
      ]),

      // Elementos de biblioteca específicos
      ruin: "bookshelf", // Libros y estanterías
      tree: "lamp_interior", // Lámparas como "árboles" de luz
      vegetation: "chair_interior", // Sillas como "vegetación" del interior

      // Fallbacks
      campfire: "lamp_interior", // Lámparas en lugar de fogatas
      wildlife: "chest_treasure", // Cofres como "vida" del interior
    };

    return (
      interiorTextures[entityType] ||
      interiorTextures.decoration ||
      "lamp_interior"
    );
  }

  /**
   * 🌳 Assets para zonas EXTERIORES (árboles, casas, etc.)
   */
  private getExteriorAssets(entityType: string, assetKey?: string): string {
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

    const exteriorTextures: { [key: string]: string } = {
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

      // Mapeos específicos
      flower_meadows: this.getRandomTexture(vegetationTextures),
      campfire_sites: "campfire",
      ancient_groves: this.getRandomTexture(treeTextures),
      mystical_circles: this.getRandomTexture(vegetationTextures),
      sacred_springs: "well",
      crystal_formations: "man",
      ruins_ancient: "man",
    };

    // 🎯 LÓGICA ESPECIAL para entidades "special"
    if (entityType === "special" && assetKey) {
      const featureName = assetKey.split("_").slice(0, 2).join("_");
      if (exteriorTextures[featureName]) {
        return exteriorTextures[featureName];
      }
    }

    // Priorizar assetKey si existe
    if (assetKey && exteriorTextures[assetKey]) {
      return exteriorTextures[assetKey];
    }

    return (
      exteriorTextures[entityType] || exteriorTextures.structure || "food_store"
    );
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

  /**
   * 🌍 FASE 1: Poblar toda la base del mapa con vegetación natural distribuida
   */
  private populateBaseWorldLayer(): void {
    try {
      const worldSize = this.gameState.worldSize;
      const baseEntities = this.worldPopulator.populateGlobalTerrain(
        0,
        0,
        worldSize.width,
        worldSize.height,
        BiomeType.GRASSLAND, // bioma base para todo el mapa
      );

      // Renderizar entidades base (sin zona específica)
      baseEntities.forEach((entity) => {
        this.renderWorldEntity(entity); // Sin zoneName = contexto exterior
      });

      logAutopoiesis.info(
        `🌍 Base world layer populated with ${baseEntities.length} natural elements`,
      );
    } catch (error) {
      logAutopoiesis.error("❌ Error populating base world layer:", error);
    }
  }

  /**
   * 🏠 FASE 2: Poblar zonas específicas con contenido temático
   */
  private populateZoneSpecificContent(): void {
    try {
      this.gameState.zones.forEach((zone) => {
        // Determinar si es zona interior o exterior
        const isInterior = this.isInteriorZone(zone.name);

        if (isInterior) {
          this.populateInteriorZone(zone);
        } else {
          this.populateExteriorZone(zone);
        }
      });
    } catch (error) {
      logAutopoiesis.error("❌ Error populating zone content:", error);
    }
  }

  /**
   * 🏠 Poblar zona interior con fondos + muebles organizados
   */
  private populateInteriorZone(zone: Zone): void {
    // Colocar fondos (pisos/paredes) primero
    this.placeInteriorBackground(zone);

    // Luego muebles específicos
    const biome = this.determineBiomeFromZone(zone.name);
    const seed = this.hashStringToNumber(zone.id);

    const furnitureEntities = this.worldPopulator.populateInteriorFurniture(
      zone.bounds.x,
      zone.bounds.y,
      zone.bounds.width,
      zone.bounds.height,
      biome,
      seed,
    );

    furnitureEntities.forEach((entity) => {
      this.renderWorldEntity(entity, zone.name);
    });

    logAutopoiesis.debug(
      `🏠 Interior zone ${zone.name} populated with ${furnitureEntities.length} furniture`,
    );
  }

  /**
   * 🌳 Poblar zona exterior con elementos temáticos específicos (densidad baja)
   */
  private populateExteriorZone(zone: Zone): void {
    const biome = this.determineBiomeFromZone(zone.name);
    const seed = this.hashStringToNumber(zone.id);

    const thematicEntities = this.worldPopulator.populateExteriorThematic(
      zone.bounds.x,
      zone.bounds.y,
      zone.bounds.width,
      zone.bounds.height,
      biome,
      seed,
    );

    thematicEntities.forEach((entity) => {
      this.renderWorldEntity(entity, zone.name);
    });

    logAutopoiesis.debug(
      `🌳 Exterior zone ${zone.name} populated with ${thematicEntities.length} thematic elements`,
    );
  }

  /**
   * 🎨 Colocar fondos interiores (pisos, paredes)
   */
  private placeInteriorBackground(zone: Zone): void {
    // Colocar tiles de piso
    const floorTileSize = 32;
    const tilesX = Math.ceil(zone.bounds.width / floorTileSize);
    const tilesY = Math.ceil(zone.bounds.height / floorTileSize);

    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        const tileX = zone.bounds.x + x * floorTileSize;
        const tileY = zone.bounds.y + y * floorTileSize;

        // Alternar entre diferentes tiles de piso
        const floorTexture = this.getRandomTexture([
          "wooden_floor",
          "wall_brick",
        ]);

        if (this.scene.textures.exists(floorTexture)) {
          const floorTile = this.scene.add.sprite(tileX, tileY, floorTexture);
          floorTile.setDepth(0.5); // Debajo de muebles pero encima de terreno
          floorTile.setOrigin(0, 0);
          floorTile.setScale(floorTileSize / 64); // Escalar al tamaño del tile
        }
      }
    }
  }

  /**
   * 🎬 Detecta y mapea texturas estáticas a sus versiones animadas
   */
  private getAnimatedVersionIfExists(textureKey: string): string {
    // Mapeo de texturas estáticas a sus versiones animadas
    const animationMappings: { [key: string]: string } = {
      campfire: "campfire_anim",
      "checkpoint-flag": "flag_idle_anim",
      checkpoint_flag: "flag_idle_anim",
      fire: "campfire_anim",
      fire1: "campfire_anim",
      "flowers-red": "flowers_red_anim",
      "flowers-white": "flowers_white_anim",
      flowers_red: "flowers_red_anim",
      flowers_white: "flowers_white_anim",
      chicken: "chicken_anim",
      wildlife: "chicken_anim", // Usar pollo animado para wildlife
    };

    // Si existe una versión animada, verificar que esté cargada
    const animatedKey = animationMappings[textureKey];
    if (animatedKey && this.scene.textures.exists(animatedKey)) {
      logAutopoiesis.debug(
        `🎬 Using animated version: ${textureKey} -> ${animatedKey}`,
      );
      return animatedKey;
    }

    // Si no hay versión animada, usar la estática
    return textureKey;
  }

  /**
   * 🎭 Verifica si una textura es una animación (spritesheet)
   */
  private isAnimatedTexture(textureKey: string): boolean {
    // Patrones que indican que es una animación
    const animationPatterns = ["_anim", "_animation", "anim_", "animation_"];

    // Verificar si el nombre contiene patrones de animación
    const hasAnimPattern = animationPatterns.some((pattern) =>
      textureKey.includes(pattern),
    );

    // Verificar si proviene de carpeta animated_entities
    const isFromAnimatedFolder = textureKey.includes("animated");

    // Verificar si la textura existe y tiene frames múltiples
    if (this.scene.textures.exists(textureKey)) {
      const texture = this.scene.textures.get(textureKey);
      const hasMultipleFrames = texture.frameTotal > 1;

      return hasAnimPattern || isFromAnimatedFolder || hasMultipleFrames;
    }

    return hasAnimPattern || isFromAnimatedFolder;
  }
}
