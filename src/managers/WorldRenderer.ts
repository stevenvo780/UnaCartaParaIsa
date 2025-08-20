/**
 * World Renderer Mejorado - Compatible con generación procedural
 * Renderiza mundos generados proceduralmente con biomas, terreno y decoraciones
 */

import type { GameState, Zone, MapElement } from "../types";
import { logAutopoiesis } from "../utils/logger";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;

  // Capas de renderizado
  private terrainLayer?: Phaser.GameObjects.Group;
  private decorationLayer?: Phaser.GameObjects.Group;
  private zoneLayer?: Phaser.GameObjects.Group;
  private roadLayer?: Phaser.GameObjects.Group;

  // Cache para optimización
  private renderedTiles = new Map<string, Phaser.GameObjects.Sprite>();
  private renderedDecorations = new Map<string, Phaser.GameObjects.Sprite>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];

  // Configuración de renderizado
  private readonly CHUNK_SIZE = 256;
  private readonly RENDER_DISTANCE = 800;
  private lastCameraPosition = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    this.initializeLayers();

    logAutopoiesis.info("🎨 WorldRenderer procedural inicializado", {
      worldSize: gameState.worldSize,
      zones: gameState.zones.length,
      elements: gameState.mapElements.length,
    });
  }

  /**
   * Inicializar capas de renderizado
   */
  private initializeLayers(): void {
    this.terrainLayer = this.scene.add.group({ name: "terrain" });
    this.decorationLayer = this.scene.add.group({ name: "decorations" });
    this.zoneLayer = this.scene.add.group({ name: "zones" });
    this.roadLayer = this.scene.add.group({ name: "roads" });

    // Configurar depth de capas
    this.terrainLayer.children.entries.forEach((child: any) =>
      child.setDepth?.(0),
    );
    this.roadLayer.children.entries.forEach((child: any) =>
      child.setDepth?.(1),
    );
    this.decorationLayer.children.entries.forEach((child: any) =>
      child.setDepth?.(2),
    );
    this.zoneLayer.children.entries.forEach((child: any) =>
      child.setDepth?.(-1),
    );
  }

  /**
   * Renderizar mundo completo
   */
  public async renderWorld(): Promise<void> {
    logAutopoiesis.info("🌍 Iniciando renderizado del mundo procedural...");

    const startTime = Date.now();

    try {
      // FASE 1: Renderizar terreno base
      await this.renderTerrain();

      // FASE 2: Renderizar zonas
      this.renderZones();

      // FASE 3: Renderizar caminos
      this.renderRoads();

      // FASE 4: Renderizar decoraciones y recursos
      await this.renderDecorations();

      const renderTime = Date.now() - startTime;

      logAutopoiesis.info("✅ Mundo renderizado exitosamente", {
        renderTime: `${renderTime}ms`,
        terrainTiles: this.renderedTiles.size,
        decorations: this.renderedDecorations.size,
        zones: this.zoneGraphics.length,
      });
    } catch (error) {
      logAutopoiesis.error("❌ Error renderizando mundo", {
        error: String(error),
      });
    }
  }

  /**
   * Renderizar terreno usando tiles procedurales
   */
  private async renderTerrain(): Promise<void> {
    if (
      !this.gameState.terrainTiles ||
      this.gameState.terrainTiles.length === 0
    ) {
      logAutopoiesis.warn("No hay tiles de terreno para renderizar");
      return;
    }

    let tilesRendered = 0;
    const totalTiles = this.gameState.terrainTiles.length;

    // Renderizar tiles en chunks para no bloquear
    for (let i = 0; i < totalTiles; i += 100) {
      const chunk = this.gameState.terrainTiles.slice(i, i + 100);

      chunk.forEach((tile) => {
        const tileKey = `${tile.x}_${tile.y}`;

        if (!this.renderedTiles.has(tileKey)) {
          const sprite = this.createTerrainTile(tile);
          if (sprite) {
            this.terrainLayer?.add(sprite);
            this.renderedTiles.set(tileKey, sprite);
            tilesRendered++;
          }
        }
      });

      // Yield control para mantener 60 FPS
      if (i % 500 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    logAutopoiesis.info(`🌱 Terreno renderizado: ${tilesRendered} tiles`);
  }

  /**
   * Crear tile de terreno individual
   */
  private createTerrainTile(tile: any): Phaser.GameObjects.Sprite | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager");

    // Verificar si el asset existe
    if (!assetManager?.isAssetLoaded(tile.assetKey)) {
      // Usar fallback basado en bioma
      const fallbackKey = this.getFallbackTerrainAsset(tile.biome);
      if (!assetManager?.isAssetLoaded(fallbackKey)) {
        return this.createFallbackTerrainTile(tile);
      }
      tile.assetKey = fallbackKey;
    }

    const sprite = this.scene.add.sprite(tile.x, tile.y, tile.assetKey);
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(32, 32);
    sprite.setDepth(0);
    sprite.name = `terrain_${tile.x}_${tile.y}`;

    return sprite;
  }

  /**
   * Crear tile de terreno fallback
   */
  private createFallbackTerrainTile(tile: any): Phaser.GameObjects.Rectangle {
    const color = this.getBiomeColor(tile.biome);
    const rect = this.scene.add.rectangle(
      tile.x + 16,
      tile.y + 16,
      32,
      32,
      color,
    );
    rect.setDepth(0);
    rect.name = `terrain_fallback_${tile.x}_${tile.y}`;

    return rect as any;
  }

  /**
   * Renderizar zonas funcionales
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone) => {
      const graphics = this.scene.add.graphics();

      // Color de zona con transparencia
      const color = this.parseColorString(zone.color);
      graphics.fillStyle(color.hex, color.alpha);
      graphics.fillRect(
        zone.bounds.x,
        zone.bounds.y,
        zone.bounds.width,
        zone.bounds.height,
      );

      // Borde de zona
      graphics.lineStyle(2, color.hex, 0.8);
      graphics.strokeRect(
        zone.bounds.x,
        zone.bounds.y,
        zone.bounds.width,
        zone.bounds.height,
      );

      graphics.setDepth(-1);
      graphics.name = `zone_${zone.id}`;

      // Texto de zona
      const centerX = zone.bounds.x + zone.bounds.width / 2;
      const centerY = zone.bounds.y + zone.bounds.height / 2;

      const text = this.scene.add.text(centerX, centerY, zone.name, {
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      });
      text.setOrigin(0.5);
      text.setDepth(3);
      text.name = `zone_text_${zone.id}`;

      this.zoneGraphics.push(graphics);
      this.zoneLayer?.add(graphics);
      this.zoneLayer?.add(text);
    });

    logAutopoiesis.info(
      `🏛️ Zonas renderizadas: ${this.gameState.zones.length}`,
    );
  }

  /**
   * Renderizar caminos
   */
  private renderRoads(): void {
    const roads = this.gameState.roads || [];

    roads.forEach((road) => {
      const roadSprite = this.createRoadTile(road);
      if (roadSprite) {
        this.roadLayer?.add(roadSprite);
      }
    });

    if (roads.length > 0) {
      logAutopoiesis.info(`🛤️ Caminos renderizados: ${roads.length} segmentos`);
    }
  }

  /**
   * Crear tile de camino
   */
  private createRoadTile(road: MapElement): Phaser.GameObjects.Sprite | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager");

    // Usar asset específico o fallback
    const assetKey = road.assetKey || "road_path_straight_h";

    if (!assetManager?.isAssetLoaded(assetKey)) {
      // Crear camino procedural simple
      const rect = this.scene.add.rectangle(
        road.position.x + 16,
        road.position.y + 16,
        road.size.width,
        road.size.height,
        0x8d6e63,
      );
      rect.setDepth(1);
      rect.name = `road_${road.id}`;
      return rect as any;
    }

    const sprite = this.scene.add.sprite(
      road.position.x,
      road.position.y,
      assetKey,
    );
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(road.size.width, road.size.height);
    sprite.setDepth(1);
    sprite.name = `road_${road.id}`;

    return sprite;
  }

  /**
   * Renderizar decoraciones y recursos
   */
  private async renderDecorations(): Promise<void> {
    const decorations = this.gameState.mapElements.filter(
      (e) => e.type === "decoration",
    );
    let decorationsRendered = 0;

    // Renderizar en chunks
    for (let i = 0; i < decorations.length; i += 50) {
      const chunk = decorations.slice(i, i + 50);

      chunk.forEach((decoration) => {
        const sprite = this.createDecorationSprite(decoration);
        if (sprite) {
          this.decorationLayer?.add(sprite);
          this.renderedDecorations.set(decoration.id, sprite);
          decorationsRendered++;
        }
      });

      // Yield control
      if (i % 200 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    logAutopoiesis.info(`🌳 Decoraciones renderizadas: ${decorationsRendered}`);
  }

  /**
   * Crear sprite de decoración
   */
  private createDecorationSprite(
    decoration: MapElement,
  ): Phaser.GameObjects.Sprite | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager");

    let assetKey = decoration.assetKey;

    // Verificar asset o usar fallback
    if (!assetKey || !assetManager?.isAssetLoaded(assetKey)) {
      assetKey = this.getFallbackDecorationAsset(decoration.biome);

      if (!assetManager?.isAssetLoaded(assetKey)) {
        return this.createFallbackDecoration(decoration);
      }
    }

    const sprite = this.scene.add.sprite(
      decoration.position.x,
      decoration.position.y,
      assetKey,
    );

    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(decoration.size.width, decoration.size.height);
    sprite.setDepth(2);
    sprite.name = `decoration_${decoration.id}`;

    // Añadir variación visual
    const variation = Math.random();
    if (variation < 0.1) {
      sprite.setTint(0xcccccc); // Algo más oscuro
    } else if (variation < 0.2) {
      sprite.setAlpha(0.9); // Algo más transparente
    }

    return sprite;
  }

  /**
   * Crear decoración fallback
   */
  private createFallbackDecoration(
    decoration: MapElement,
  ): Phaser.GameObjects.Sprite {
    const color = decoration.color
      ? this.parseColorString(decoration.color).hex
      : 0x9370db;
    const rect = this.scene.add.rectangle(
      decoration.position.x,
      decoration.position.y,
      decoration.size.width,
      decoration.size.height,
      color,
    );
    rect.setDepth(2);
    rect.name = `decoration_fallback_${decoration.id}`;

    return rect as any;
  }

  /**
   * Actualizar renderizado (culling, LOD)
   */
  public updateVisuals(): void {
    const camera = this.scene.cameras.main;
    const currentPos = { x: camera.scrollX, y: camera.scrollY };

    // Solo actualizar si la cámara se movió significativamente
    const distance = Math.hypot(
      currentPos.x - this.lastCameraPosition.x,
      currentPos.y - this.lastCameraPosition.y,
    );

    if (distance > 50) {
      this.performCulling(camera);
      this.lastCameraPosition = currentPos;
    }
  }

  /**
   * Realizar culling de objetos fuera de vista
   */
  private performCulling(camera: Phaser.Cameras.Scene2D.Camera): void {
    const bounds = {
      left: camera.scrollX - this.RENDER_DISTANCE,
      right: camera.scrollX + camera.width + this.RENDER_DISTANCE,
      top: camera.scrollY - this.RENDER_DISTANCE,
      bottom: camera.scrollY + camera.height + this.RENDER_DISTANCE,
    };

    // Culling de decoraciones
    this.renderedDecorations.forEach((sprite, key) => {
      const inBounds =
        sprite.x >= bounds.left &&
        sprite.x <= bounds.right &&
        sprite.y >= bounds.top &&
        sprite.y <= bounds.bottom;

      sprite.setVisible(inBounds);
    });
  }

  // ==========================================
  // UTILIDADES Y HELPERS
  // ==========================================

  /**
   * Obtener asset fallback para terreno
   */
  private getFallbackTerrainAsset(biome: string): string {
    const fallbacks: Record<string, string> = {
      grassland: "grass_middle",
      forest: "grass_1",
      water: "water_middle",
      mountain: "grass_3",
      desert: "grass_2",
      village: "grass_middle",
      wetland: "water_tile_1",
    };

    return fallbacks[biome] || "grass_middle";
  }

  /**
   * Obtener asset fallback para decoración
   */
  private getFallbackDecorationAsset(biome?: string): string {
    const fallbacks: Record<string, string> = {
      forest: "tree_emerald_1",
      grassland: "bush_emerald_1",
      water: "rock1_1",
      mountain: "rock1_1",
      village: "house_hay_1",
    };

    return fallbacks[biome || "grassland"] || "bush_emerald_1";
  }

  /**
   * Obtener color de bioma
   */
  private getBiomeColor(biome: string): number {
    const colors: Record<string, number> = {
      grassland: 0x4caf50,
      forest: 0x388e3c,
      water: 0x2196f3,
      mountain: 0x607d8b,
      desert: 0xff9800,
      village: 0x8d6e63,
      wetland: 0x4e342e,
    };

    return colors[biome] || 0x4caf50;
  }

  /**
   * Parsear string de color
   */
  private parseColorString(colorStr: string): { hex: number; alpha: number } {
    if (colorStr.startsWith("rgba")) {
      const match = colorStr.match(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
      );
      if (match) {
        const [, r, g, b, a] = match;
        const hex = (parseInt(r) << 16) | (parseInt(g) << 8) | parseInt(b);
        return { hex, alpha: parseFloat(a) };
      }
    }

    if (colorStr.startsWith("#")) {
      return { hex: parseInt(colorStr.slice(1), 16), alpha: 1 };
    }

    return { hex: 0x4caf50, alpha: 0.3 };
  }

  /**
   * Limpiar recursos de renderizado
   */
  public cleanup(): void {
    this.renderedTiles.clear();
    this.renderedDecorations.clear();
    this.zoneGraphics.forEach((g) => g.destroy());
    this.zoneGraphics = [];

    this.terrainLayer?.clear(true, true);
    this.decorationLayer?.clear(true, true);
    this.zoneLayer?.clear(true, true);
    this.roadLayer?.clear(true, true);
  }

  /**
   * Obtener estadísticas de renderizado
   */
  public getRenderStats() {
    return {
      terrainTiles: this.renderedTiles.size,
      decorations: this.renderedDecorations.size,
      zones: this.zoneGraphics.length,
      layers: {
        terrain: this.terrainLayer?.children.size || 0,
        decorations: this.decorationLayer?.children.size || 0,
        zones: this.zoneLayer?.children.size || 0,
        roads: this.roadLayer?.children.size || 0,
      },
    };
  }
}
