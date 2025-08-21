/**
 * Renderizador para mundos compuestos con máxima diversidad
 * Renderiza múltiples capas de assets con organización por profundidad
 */

import { logAutopoiesis } from "../utils/logger";
import type {
  ComposedWorld,
  PlacedAsset,
  RenderLayer,
} from "./DiverseWorldComposer";

export class DiverseWorldRenderer {
  private scene: Phaser.Scene;
  private layerGroups = new Map<string, Phaser.GameObjects.Group>();
  private renderedAssets = new Map<string, Phaser.GameObjects.Sprite>();
  private lastCameraPosition = { x: 0, y: 0 };
  private readonly RENDER_DISTANCE = 1200;
  private readonly CULL_CHECK_INTERVAL = 100; // ms
  private lastCullCheck = 0;
  private totalSprites = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeLayerGroups();
  }

  /**
   * Inicializa los grupos de capas con orden Z correcto
   */
  private initializeLayerGroups(): void {
    const layerConfigs = [
      { name: "terrain", depth: 0 },
      { name: "transition", depth: 1 },
      { name: "detail", depth: 2 },
      { name: "vegetation", depth: 3 },
      { name: "structure", depth: 4 },
      { name: "props", depth: 5 },
      { name: "effects", depth: 6 },
    ];

    layerConfigs.forEach((config) => {
      const group = this.scene.add.group({ name: config.name });
      group.setDepth(config.depth);
      this.layerGroups.set(config.name, group);
    });

    logAutopoiesis.info("🎨 Layer groups initialized", {
      totalLayers: this.layerGroups.size,
    });
  }

  /**
   * Renderiza un mundo compuesto completo
   */
  async renderComposedWorld(composedWorld: ComposedWorld): Promise<void> {
    const startTime = Date.now();
    logAutopoiesis.info("🌍 Rendering composed world...", {
      layers: composedWorld.layers.length,
      totalAssets: composedWorld.stats.totalAssets,
    });

    // Renderizar cada capa en orden
    for (const layer of composedWorld.layers) {
      await this.renderLayer(layer);

      // Yield control para evitar freeze
      if (layer.assets.length > 200) {
        await this.yieldControl();
      }
    }

    const renderTime = Date.now() - startTime;

    logAutopoiesis.info("✅ Composed world rendered", {
      renderTime: `${renderTime}ms`,
      renderedSprites: this.renderedAssets.size,
      layers: composedWorld.layers.length,
    });
  }

  /**
   * Renderiza una capa específica
   */
  private async renderLayer(layer: RenderLayer): Promise<void> {
    if (!layer.visible || layer.assets.length === 0) {
      return;
    }

    const layerGroup = this.layerGroups.get(layer.type);
    if (!layerGroup) {
      logAutopoiesis.warn(`Layer group not found: ${layer.type}`);
      return;
    }

    let renderedCount = 0;
    const batchSize = 50;

    // Ordenar assets por profundidad para renderizado correcto
    const sortedAssets = [...layer.assets].sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < sortedAssets.length; i += batchSize) {
      const batch = sortedAssets.slice(i, i + batchSize);

      for (const placedAsset of batch) {
        const sprite = this.createSpriteFromPlacedAsset(placedAsset);
        if (sprite) {
          layerGroup.add(sprite);
          this.renderedAssets.set(this.getAssetId(placedAsset), sprite);
          renderedCount++;
        }
      }

      // Yield cada batch para mantener responsividad
      await this.yieldControl();
    }

    logAutopoiesis.debug(`Layer '${layer.name}' rendered`, {
      totalAssets: layer.assets.length,
      renderedCount,
      layerType: layer.type,
    });
  }

  /**
   * Crea un sprite desde un PlacedAsset
   */
  private createSpriteFromPlacedAsset(
    placedAsset: PlacedAsset,
  ): Phaser.GameObjects.Sprite | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager") as
      | { isAssetLoaded: (k: string) => boolean }
      | undefined;

    let assetKey = placedAsset.asset.key;

    // Verificar si el asset está cargado
    if (!assetManager?.isAssetLoaded(assetKey)) {
      // Intentar con fallback
      assetKey = this.getFallbackAsset(placedAsset.asset.type);
      if (!assetManager?.isAssetLoaded(assetKey)) {
        return null;
      }
    }

    const sprite = this.scene.add.sprite(
      placedAsset.x,
      placedAsset.y,
      assetKey,
    );

    // Aplicar transformaciones
    sprite.setScale(placedAsset.scale);
    sprite.setRotation(placedAsset.rotation);
    sprite.setTint(placedAsset.tint);
    sprite.setDepth(placedAsset.depth);

    // Configurar origen según tipo de asset
    this.configureAssetOrigin(sprite, placedAsset.asset.type);

    // Aplicar variaciones visuales adicionales
    this.applyVisualVariations(sprite, placedAsset);

    // Metadata para debugging y culling
    sprite.setData("placedAsset", placedAsset);
    sprite.setData("assetId", this.getAssetId(placedAsset));

    return sprite;
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
        sprite.setOrigin(0.5, 0.9); // Base del árbol
        break;
      case "structure":
      case "ruin":
        sprite.setOrigin(0.5, 0.8); // Base del edificio
        break;
      case "rock":
        sprite.setOrigin(0.5, 0.7); // Base de la roca
        break;
      case "foliage":
      case "mushroom":
        sprite.setOrigin(0.5, 0.6); // Centro-bajo
        break;
      default:
        sprite.setOrigin(0.5, 0.5); // Centro
    }
  }

  /**
   * Aplica variaciones visuales adicionales
   */
  private applyVisualVariations(
    sprite: Phaser.GameObjects.Sprite,
    placedAsset: PlacedAsset,
  ): void {
    // Variación de alpha para algunos elementos
    const random = Math.random();
    if (random < 0.1) {
      sprite.setAlpha(0.85 + Math.random() * 0.15); // 85%-100%
    }

    // Flip horizontal aleatorio para algunos tipos
    if (
      ["tree", "rock", "foliage"].includes(placedAsset.asset.type) &&
      random < 0.3
    ) {
      sprite.setFlipX(true);
    }

    // Efectos especiales para ciertos tipos
    if (
      placedAsset.asset.type === "water" ||
      placedAsset.asset.key.includes("water")
    ) {
      const waterPipeline = this.scene.registry.get("waterPipelineKey") as
        | string
        | undefined;
      if (waterPipeline) {
        sprite.setPipeline(waterPipeline);
      }
    }

    // Añadir sutiles variaciones de posición para evitar alineación perfecta
    if (placedAsset.asset.type !== "terrain") {
      const offsetX = (Math.random() - 0.5) * 8; // ±4px
      const offsetY = (Math.random() - 0.5) * 8;
      sprite.x += offsetX;
      sprite.y += offsetY;
    }
  }

  /**
   * Sistema de culling inteligente para performance
   */
  update(): void {
    const now = Date.now();
    if (now - this.lastCullCheck < this.CULL_CHECK_INTERVAL) {
      return;
    }

    const camera = this.scene.cameras.main;
    const currentPos = { x: camera.scrollX, y: camera.scrollY };

    // Solo hacer culling si la cámara se movió significativamente
    const distance = Math.hypot(
      currentPos.x - this.lastCameraPosition.x,
      currentPos.y - this.lastCameraPosition.y,
    );

    if (distance > 100) {
      this.performCulling(camera);
      this.lastCameraPosition = currentPos;
    }

    this.lastCullCheck = now;
  }

  /**
   * Culling de sprites fuera de vista
   */
  private performCulling(camera: Phaser.Cameras.Scene2D.Camera): void {
    const bounds = {
      left: camera.scrollX - this.RENDER_DISTANCE,
      right: camera.scrollX + camera.width + this.RENDER_DISTANCE,
      top: camera.scrollY - this.RENDER_DISTANCE,
      bottom: camera.scrollY + camera.height + this.RENDER_DISTANCE,
    };

    let culledCount = 0;
    let visibleCount = 0;

    this.renderedAssets.forEach((sprite) => {
      const inBounds =
        sprite.x >= bounds.left &&
        sprite.x <= bounds.right &&
        sprite.y >= bounds.top &&
        sprite.y <= bounds.bottom;

      const wasVisible = sprite.visible;
      sprite.setVisible(inBounds);

      if (inBounds) {
        visibleCount++;
      } else if (wasVisible) {
        culledCount++;
      }
    });

    if (culledCount > 0) {
      logAutopoiesis.debug("Sprites culled", {
        culled: culledCount,
        visible: visibleCount,
        total: this.renderedAssets.size,
      });
    }
  }

  /**
   * Obtiene asset de fallback según tipo
   */
  private getFallbackAsset(assetType: string): string {
    const fallbacks: Record<string, string> = {
      terrain: "grass_middle",
      tree: "tree_emerald_1",
      rock: "rock1_1",
      foliage: "bush_emerald_1",
      structure: "house_hay_1",
      ruin: "brown_ruins1",
      mushroom: "mushroom_1",
      decoration: "flowers_red",
      water: "water_middle",
      prop: "well_1",
    };

    return fallbacks[assetType] || "grass_middle";
  }

  /**
   * Genera ID único para un PlacedAsset
   */
  private getAssetId(placedAsset: PlacedAsset): string {
    return `${placedAsset.asset.key}_${Math.floor(placedAsset.x)}_${Math.floor(placedAsset.y)}`;
  }

  /**
   * Yield control para evitar freeze en operaciones largas
   */
  private async yieldControl(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(1, resolve);
    });
  }

  /**
   * Limpia todos los assets renderizados
   */
  cleanup(): void {
    this.renderedAssets.forEach((sprite) => sprite.destroy());
    this.renderedAssets.clear();

    this.layerGroups.forEach((group) => group.clear(true, true));

    logAutopoiesis.info("🧹 Diverse world renderer cleaned up");
  }

  /**
   * Estadísticas de renderizado
   */
  getRenderStats() {
    const layerStats = {};
    this.layerGroups.forEach((group, name) => {
      layerStats[name] = group.children.size;
    });

    return {
      totalSprites: this.renderedAssets.size,
      layerStats,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimación del uso de memoria
   */
  public getStats() {
    return {
      totalSprites: this.totalSprites,
      layerCounts: this.layerGroups.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): number {
    // Estimación básica de uso de memoria
    return this.totalSprites * 1024; // 1KB por sprite aproximadamente
  }

  public updateCulling(cameraX: number, cameraY: number): void {
    // Implementar culling basado en la posición de la cámara
    const renderDistance = 1000; // Ajustable según el rendimiento

    this.layerGroups.forEach((group) => {
      group.children.entries.forEach((sprite) => {
        if (sprite instanceof Phaser.GameObjects.Sprite) {
          const distance = Phaser.Math.Distance.Between(
            cameraX,
            cameraY,
            sprite.x,
            sprite.y,
          );
          sprite.setVisible(distance <= renderDistance);
        }
      });
    });
  }

  public destroy(): void {
    this.layerGroups.forEach((group) => {
      group.destroy(true);
    });
    this.layerGroups.clear();
    this.totalSprites = 0;
  }

  /**
   * Alterna visibilidad de una capa
   */
  toggleLayer(layerName: string, visible?: boolean): void {
    const group = this.layerGroups.get(layerName);
    if (group) {
      const newVisibility = visible !== undefined ? visible : !group.visible;
      group.setVisible(newVisibility);

      logAutopoiesis.info(
        `Layer '${layerName}' ${newVisibility ? "shown" : "hidden"}`,
        {
          sprites: group.children.size,
        },
      );
    }
  }

  /**
   * Obtiene información de una capa específica
   */
  getLayerInfo(layerName: string) {
    const group = this.layerGroups.get(layerName);
    if (!group) return null;

    return {
      name: layerName,
      visible: group.visible,
      spriteCount: group.children.size,
      depth: group.depth,
    };
  }
}
