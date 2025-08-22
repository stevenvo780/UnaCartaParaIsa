/**
 * Renderizador de Mundo por Capas
 * Integra el DiverseWorldComposer con la escena principal de Phaser
 */

import type Phaser from "phaser";
import { logAutopoiesis } from "../utils/logger";
import {
  DiverseWorldComposer,
  type ClusterPoint,
  type ComposedWorld,
  type PlacedAsset,
  type RenderLayer,
} from "./DiverseWorldComposer";
import { GeneratedWorld } from "./types";

export interface LayeredWorldConfig {
  enableLayerToggle?: boolean;
  enableBiomeHighlight?: boolean;
  enablePerformanceMode?: boolean;
  maxVisibleAssets?: number;
}

/**
 * Renderizador que gestiona la visualización del mundo multicapa en Phaser
 */
export class LayeredWorldRenderer {
  private scene: Phaser.Scene;
  private config: LayeredWorldConfig;
  private composer: DiverseWorldComposer;
  private renderGroups: Map<string, Phaser.GameObjects.Group>;
  private composedWorld: ComposedWorld | null = null;
  private isInitialized = false;
  private layerGroups: Map<string, Phaser.GameObjects.Group> = new Map();
  private renderedAssets: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private container: Phaser.GameObjects.Container;
  private totalSprites = 0;

  constructor(scene: Phaser.Scene, config: LayeredWorldConfig = {}) {
    this.scene = scene;
    this.config = {
      enableLayerToggle: true,
      enableBiomeHighlight: false,
      enablePerformanceMode: false,
      maxVisibleAssets: 5000,
      ...config,
    };
    this.renderGroups = new Map();
    this.container = scene.add.container(0, 0);
    this.composer = new DiverseWorldComposer(scene, `seed_${Date.now()}`);

    this.initializeLayerGroups();
  }

  /**
   * Inicializa el renderizador con un mundo generado
   */
  async initialize(world: GeneratedWorld): Promise<void> {
    logAutopoiesis.info("🎨 Inicializando LayeredWorldRenderer...");

    try {
      // Componer el mundo diverso
      this.composedWorld = await this.composer.composeWorld(world);

      // Renderizar todas las capas
      await this.renderAllLayers();

      this.isInitialized = true;

      logAutopoiesis.info("✅ LayeredWorldRenderer inicializado", {
        layers: this.composedWorld.layers.length,
        totalAssets: this.composedWorld.stats.totalAssets,
        diversityIndex: this.composedWorld.stats.diversityIndex,
      });
    } catch (error) {
      logAutopoiesis.error(
        "❌ Error inicializando LayeredWorldRenderer:",
        error,
      );
    }
  }

  /**
   * Configura los grupos de renderizado para cada capa
   */
  private initializeLayerGroups(): void {
    const layerTypes = [
      "terrain",
      "transition",
      "detail",
      "vegetation",
      "structure",
      "props",
      "effects",
    ];

    layerTypes.forEach((layerType, index) => {
      const group = this.scene.add.group();
      group.setDepth(index * 100); // Separar capas por depth
      this.layerGroups.set(layerType, group);
    });

    logAutopoiesis.info("📦 Grupos de capas inicializados", {
      groups: this.layerGroups.size,
    });
  }

  /**
   * Renderiza un mundo compuesto completo
   */
  async renderComposedWorld(composedWorld: ComposedWorld): Promise<void> {
    this.composedWorld = composedWorld;
    await this.renderAllLayers();
    this.renderClusters(composedWorld.clusters);

    logAutopoiesis.info("🌍 Mundo renderizado", {
      layers: composedWorld.layers.length,
      totalSprites: this.totalSprites,
      clusters: composedWorld.clusters.length,
    });
  }

  /**
   * Renderiza todas las capas del mundo
   */
  private async renderAllLayers(): Promise<void> {
    if (!this.composedWorld) return;

    this.clearLayers();

    const sortedLayers = this.composedWorld.layers.sort(
      (a, b) => a.zIndex - b.zIndex,
    );

    for (const layer of sortedLayers) {
      if (layer.visible) {
        await this.renderLayer(layer);

        // Permitir que el navegador respire entre capas
        await this.yieldControl();
      }
    }
  }

  /**
   * Renderiza una capa específica
   */
  private async renderLayer(layer: RenderLayer): Promise<number> {
    let renderedCount = 0;
    const group = this.layerGroups.get(layer.type);

    if (!group) {
      logAutopoiesis.warn(`Grupo no encontrado para capa: ${layer.type}`);
      return 0;
    }

    logAutopoiesis.info(`🎨 Renderizando capa: ${layer.name}`, {
      assets: layer.assets.length,
      type: layer.type,
    });

    // Limitar assets si está en modo performance
    const assetsToRender = this.config.enablePerformanceMode
      ? layer.assets.slice(0, Math.min(1000, layer.assets.length))
      : layer.assets;

    for (const placedAsset of assetsToRender) {
      const sprite = this.createSpriteFromPlacedAsset(placedAsset);

      if (sprite) {
        group.add(sprite);
        this.container.add(sprite);

        const assetId = this.getAssetId(placedAsset);
        this.renderedAssets.set(assetId, sprite);

        renderedCount++;
        this.totalSprites++;

        // Yield cada 50 sprites para performance
        if (renderedCount % 50 === 0) {
          await this.yieldControl();
        }
      }
    }

    logAutopoiesis.info(`✅ Capa renderizada: ${layer.name}`, {
      rendered: renderedCount,
      total: layer.assets.length,
    });

    return renderedCount;
  }

  /**
   * Crea un sprite desde un PlacedAsset
   */
  private createSpriteFromPlacedAsset(
    placedAsset: PlacedAsset,
  ): Phaser.GameObjects.Sprite | null {
    try {
      // Verificar si la textura existe
      if (!this.scene.textures.exists(placedAsset.asset.key)) {
        // Usar fallback asset si no existe
        const fallbackKey = this.getFallbackAsset(placedAsset.asset.type);

        if (!this.scene.textures.exists(fallbackKey)) {
          return null; // No se puede crear el sprite
        }
        placedAsset.asset.key = fallbackKey;
      }

      const sprite = this.scene.add.sprite(
        placedAsset.x,
        placedAsset.y,
        placedAsset.asset.key,
      );

      // Aplicar transformaciones
      sprite.setScale(placedAsset.scale);
      sprite.setRotation(placedAsset.rotation);
      sprite.setTint(placedAsset.tint);
      sprite.setDepth(placedAsset.depth);

      // Configurar origen según el tipo de asset
      this.configureAssetOrigin(sprite, placedAsset.asset.type);

      // Aplicar variaciones visuales
      this.applyVisualVariations(sprite, placedAsset);

      // Configurar interactividad si es necesario
      if (placedAsset.metadata?.interactive) {
        sprite.setInteractive();
        sprite.setData("metadata", placedAsset.metadata);
      }

      return sprite;
    } catch (error) {
      logAutopoiesis.warn(
        `Error creando sprite para asset: ${placedAsset.asset.key}`,
        error,
      );
      return null;
    }
  }

  /**
   * Configura el origen del sprite según el tipo de asset
   */
  private configureAssetOrigin(
    sprite: Phaser.GameObjects.Sprite,
    assetType: string,
  ): void {
    switch (assetType) {
      case "tree":
      case "structure":
        sprite.setOrigin(0.5, 1); // Bottom center para trees y estructuras
        break;
      case "terrain":
        sprite.setOrigin(0, 0); // Top-left para terrain tiles
        sprite.setDisplaySize(32, 32); // Forzar tamaño exacto de 32x32 para eliminar espacios
        break;
      case "water":
        sprite.setOrigin(0.5, 0.5); // Centro para agua
        break;
      default:
        sprite.setOrigin(0.5, 0.5); // Centro por defecto
        break;
    }
  }

  /**
   * Aplica variaciones visuales al sprite
   */
  private applyVisualVariations(
    sprite: Phaser.GameObjects.Sprite,
    placedAsset: PlacedAsset,
  ): void {
    // Variación de alpha sutil
    const alphaVariation = 0.05 + Math.random() * 0.1;
    sprite.setAlpha(1 - alphaVariation);

    // Efectos especiales según metadata
    if (placedAsset.metadata?.animated) {
      this.addAnimationEffect(sprite, placedAsset.metadata);
    }

    // Flip horizontal aleatorio para más variedad
    if (Math.random() < 0.3) {
      sprite.setFlipX(true);
    }
  }

  /**
   * Añade efectos de animación según el tipo
   */
  private addAnimationEffect(
    sprite: Phaser.GameObjects.Sprite,
    metadata: any,
  ): void {
    if (!metadata?.animated) return;

    switch (metadata.effect || metadata.type) {
      case "water_ripple":
      case "water_effect":
        this.scene.tweens.add({
          targets: sprite,
          alpha: { from: 0.3, to: 0.8 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

      case "ambient_light":
      case "light_particle":
        this.scene.tweens.add({
          targets: sprite,
          scale: { from: sprite.scale * 0.9, to: sprite.scale * 1.1 },
          duration: 3000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

      case "wind_particle":
        this.scene.tweens.add({
          targets: sprite,
          x: sprite.x + (Math.random() - 0.5) * 30,
          y: sprite.y + Math.random() * 20,
          rotation: sprite.rotation + Math.PI,
          duration: 5000 + Math.random() * 3000,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

      case "float":
        this.scene.tweens.add({
          targets: sprite,
          y: sprite.y - 5 + Math.sin(Date.now() * 0.001) * 10,
          duration: 4000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;
    }
  }

  /**
   * Renderiza clusters como elementos visuales sutiles
   */
  private renderClusters(clusters: ClusterPoint[]): void {
    clusters.forEach((cluster) => {
      // Visual sutil para identificar clusters
      const circle = this.scene.add.circle(
        cluster.x,
        cluster.y,
        cluster.radius,
        this.getClusterColor(cluster.type),
        0.03, // Muy transparente
      );
      circle.setDepth(-1); // Por debajo de todo
      circle.setStrokeStyle(1, this.getClusterColor(cluster.type), 0.1);
      this.container.add(circle);
    });
  }

  /**
   * Obtiene color para el cluster según su tipo
   */
  private getClusterColor(type: string): number {
    const colors: Record<string, number> = {
      forest_grove: 0x228b22,
      rock_formation: 0x696969,
      flower_meadow: 0xff69b4,
      mushroom_circle: 0x8b4513,
      ruins_site: 0x708090,
      water_feature: 0x4682b4,
    };
    return colors[type] || 0xffffff;
  }

  /**
   * Obtiene asset de fallback si el original no existe
   */
  private getFallbackAsset(assetType: string): string {
    const fallbacks: Record<string, string> = {
      terrain: "terrain-grass",
      tree: "oak_tree1",
      rock: "rock1_1",
      water: "water_middle",
      structure: "house",
      prop: "chest",
      decoration: "bush_emerald_1",
      mushroom: "beige_green_mushroom1",
      ruin: "blue-gray_ruins1",
      foliage: "bush_emerald_1",
    };

    return fallbacks[assetType] || "terrain-grass";
  }

  /**
   * Genera ID único para un asset colocado
   */
  private getAssetId(placedAsset: PlacedAsset): string {
    return `${placedAsset.asset.key}_${Math.floor(placedAsset.x)}_${Math.floor(placedAsset.y)}`;
  }

  /**
   * Permite que el navegador respire durante renderizado pesado
   */
  private async yieldControl(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Limpia todas las capas renderizadas
   */
  private clearLayers(): void {
    this.layerGroups.forEach((group) => group.clear(true, true));
    this.renderedAssets.clear();
    this.container.removeAll(true);
    this.totalSprites = 0;
  }

  /**
   * Alterna la visibilidad de una capa
   */
  toggleLayer(layerType: string, visible?: boolean): boolean {
    const group = this.layerGroups.get(layerType);
    if (!group) return false;

    const newVisible = visible ?? !(group as any).visible;
    group.setVisible(newVisible);

    logAutopoiesis.info(
      `🔄 Capa ${layerType}: ${newVisible ? "visible" : "oculta"}`,
    );
    return newVisible;
  }

  /**
   * Obtiene información de las capas renderizadas
   */
  getLayerInfo(): Array<{
    type: string;
    name: string;
    assets: number;
    visible: boolean;
  }> {
    const info: Array<{
      type: string;
      name: string;
      assets: number;
      visible: boolean;
    }> = [];

    this.layerGroups.forEach((group, type) => {
      const layer = this.composedWorld?.layers.find((l) => l.type === type);
      info.push({
        type,
        name: layer?.name || type,
        assets: group.children.size,
        visible: group.active,
      });
    });

    return info;
  }

  /**
   * Resalta un bioma específico
   */
  highlightBiome(biomeType: string, highlight: boolean = true): void {
    if (!this.config.enableBiomeHighlight) return;

    // Implementar highlight de bioma si es necesario
    logAutopoiesis.info(
      `🎨 Bioma ${biomeType}: ${highlight ? "resaltado" : "normal"}`,
    );
  }

  /**
   * Modo de rendimiento - oculta capas menos importantes
   */
  setPerformanceMode(enabled: boolean): void {
    this.config.enablePerformanceMode = enabled;

    if (enabled) {
      // Ocultar capas de efectos y detalles
      this.toggleLayer("effects", false);
      this.toggleLayer("detail", false);
      this.toggleLayer("transition", false);
    } else {
      // Mostrar todas las capas
      this.layerGroups.forEach((group, type) => {
        this.toggleLayer(type, true);
      });
    }

    logAutopoiesis.info(
      `⚡ Modo performance: ${enabled ? "activado" : "desactivado"}`,
    );
  }

  /**
   * Obtiene estadísticas del renderizador
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      totalSprites: this.totalSprites,
      layerCount: this.layerGroups.size,
      renderedAssets: this.renderedAssets.size,
      performanceMode: this.config.enablePerformanceMode,
      memoryEstimate: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estima el uso de memoria
   */
  private estimateMemoryUsage(): number {
    // Estimación muy aproximada en MB
    return (this.totalSprites * 0.05) / 1024; // ~50KB por sprite
  }

  /**
   * Actualiza culling basado en posición de cámara
   */
  public updateCulling(cameraX: number, cameraY: number): void {
    // TEMPORALMENTE DESACTIVADO: Hacer todos los sprites visibles para debugging
    this.renderedAssets.forEach((sprite) => {
      sprite.setVisible(true);
    });

    // TODO: Implementar culling básico si es necesario para performance
    // const renderDistance = 2400; // Aumentar distancia de renderizado
    // this.renderedAssets.forEach((sprite) => {
    //   const distance = Math.hypot(sprite.x - cameraX, sprite.y - cameraY);
    //   sprite.setVisible(distance < renderDistance);
    // });
  }

  /**
   * Obtiene el container principal
   */
  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Limpia todos los recursos del renderizador
   */
  destroy(): void {
    this.clearLayers();
    this.layerGroups.clear();
    this.container.destroy();

    logAutopoiesis.info("🧹 LayeredWorldRenderer destruido");
  }

  /**
   * Crea un tilemap base para el terreno usando Phaser Tilemap
   */
  private createTerrainTilemap(
    composedWorld: ComposedWorld,
  ): Phaser.Tilemaps.Tilemap | null {
    try {
      const terrainLayers = composedWorld.layers.filter(layer => layer.type === "terrain");
      if (!terrainLayers || terrainLayers.length === 0) return null;

      // Configuración del tilemap
      const tileWidth = 32;
      const tileHeight = 32;
      const mapWidth = Math.ceil(1200 / tileWidth);
      const mapHeight = Math.ceil(800 / tileHeight);

      // Crear tilemap vacío
      const map = this.scene.make.tilemap({
        key: "terrain-map",
        tileWidth,
        tileHeight,
        width: mapWidth,
        height: mapHeight,
      });

      // Añadir tilesets (necesita tilesheet preloaded)
      const terrainTileset = map.addTilesetImage(
        "terrain-tiles",
        "terrain-tilesheet",
      );
      if (!terrainTileset) {
        logAutopoiesis.warn("No se pudo cargar tileset de terreno");
        return null;
      }

      // Crear capa de terreno
      const terrainLayer = map.createLayer("terrain", terrainTileset, 0, 0);
      if (!terrainLayer) {
        logAutopoiesis.warn("No se pudo crear capa de terreno");
        return null;
      }

      // Llenar tilemap con tiles basados en el terrain generado
      terrainLayers.forEach(layer => {
        layer.assets.forEach((placedAsset) => {
        const tileX = Math.floor(placedAsset.x / tileWidth);
        const tileY = Math.floor(placedAsset.y / tileHeight);

        // Mapear tipo de bioma a índice de tile
        const tileIndex = this.getBiomeTileIndex(placedAsset.metadata?.biome as string || "grassland");

        if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
          terrainLayer.putTileAt(tileIndex, tileX, tileY);
        }
        });
      });

      // Configurar culling del tilemap
      terrainLayer.setCullPadding(2, 2);

      // Asignar al layer group correspondiente
      const terrainGroup = this.layerGroups.get("terrain");
      if (terrainGroup) {
        terrainGroup.add(terrainLayer);
      }

      logAutopoiesis.info("🗺️ Tilemap de terreno creado", {
        mapSize: { width: mapWidth, height: mapHeight },
        tileSize: { width: tileWidth, height: tileHeight },
        tilesCount: mapWidth * mapHeight,
      });

      return map;
    } catch (error) {
      logAutopoiesis.error("Error creando tilemap de terreno", error);
      return null;
    }
  }

  /**
   * Mapea tipos de bioma a índices de tiles
   */
  private getBiomeTileIndex(biome?: string): number {
    const biomeToTile: Record<string, number> = {
      GRASSLAND: 1,
      FOREST: 2,
      DESERT: 3,
      MOUNTAINOUS: 4,
      WETLAND: 5,
      COASTAL: 6,
      VILLAGE: 7,
      WASTELAND: 8,
    };

    return biomeToTile[biome || "GRASSLAND"] || 1;
  }
}
