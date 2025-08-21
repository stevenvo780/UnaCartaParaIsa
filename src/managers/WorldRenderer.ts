/**
 * World Renderer Mejorado - Compatible con generación procedural
 * Renderiza mundos generados proceduralmente con biomas, terreno y decoraciones
 */

import type {
  GameState,
  MapElement,
  RoadPolyline,
  TerrainTile,
} from "../types";
import { logAutopoiesis } from "../utils/logger";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private terrainLayer?: Phaser.GameObjects.Group;
  private decorationLayer?: Phaser.GameObjects.Group;
  private zoneLayer?: Phaser.GameObjects.Group;
  private roadLayer?: Phaser.GameObjects.Group;
  private renderedTiles = new Map<string, Phaser.GameObjects.GameObject>();
  private renderedDecorations = new Map<
    string,
    Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle
  >();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
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

  private initializeLayers(): void {
    this.terrainLayer = this.scene.add.group({ name: "terrain" });
    this.decorationLayer = this.scene.add.group({ name: "decorations" });
    this.zoneLayer = this.scene.add.group({ name: "zones" });
    this.roadLayer = this.scene.add.group({ name: "roads" });
  }

  public async renderWorld(): Promise<void> {
    logAutopoiesis.info("🌍 Iniciando renderizado del mundo procedural...");

    const startTime = Date.now();

    try {
      await this.renderTerrain();
      this.renderZones();
      this.renderRoads();
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

      if (i % 500 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    logAutopoiesis.info(`🌱 Terreno renderizado: ${tilesRendered} tiles`);
  }

  private createTerrainTile(
    tile: TerrainTile,
  ): Phaser.GameObjects.GameObject | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager") as
      | { isAssetLoaded: (k: string) => boolean }
      | undefined;

    let key: string | undefined = tile.assetId;

    if (!key || !assetManager?.isAssetLoaded(key)) {
      const fallbackKey = this.getFallbackTerrainAssetByType(
        tile.type as string,
      );
      if (assetManager?.isAssetLoaded(fallbackKey)) {
        key = fallbackKey;
      } else {
        return this.createFallbackTerrainTile(tile);
      }
    }

    const sprite = this.scene.add.sprite(tile.x, tile.y, key);
    sprite.setOrigin(0, 0);
    sprite.setDisplaySize(32, 32);
    sprite.setDepth(0);
    sprite.name = `terrain_${tile.x}_${tile.y}`;

    if (tile.type === "water") {
      const pipelineKey = this.scene.registry.get("waterPipelineKey") as
        | string
        | undefined;
      if (pipelineKey) {
        (sprite as Phaser.GameObjects.Sprite).setPipeline(pipelineKey);
      }
    }

    return sprite;
  }

  private getFallbackTerrainAssetByType(type: string): string {
    const fallbacks: Record<string, string> = {
      grass: "grass_middle",
      water: "water_middle",
      stone: "grass_3",
      path: "grass_middle",
    };
    return fallbacks[type] || "grass_middle";
  }

  private createFallbackTerrainTile(
    tile: TerrainTile,
  ): Phaser.GameObjects.Rectangle {
    const color = this.getBiomeColor(tile.type || "grassland");
    const rect = this.scene.add.rectangle(
      tile.x + 16,
      tile.y + 16,
      32,
      32,
      color,
    );
    rect.setDepth(0);
    rect.name = `terrain_fallback_${tile.x}_${tile.y}`;

    return rect;
  }

  private renderZones(): void {
    this.gameState.zones.forEach((zone) => {
      const graphics = this.scene.add.graphics();

      const color = this.parseColorString(zone.color);
      graphics.fillStyle(color.hex, color.alpha);
      graphics.fillRect(
        zone.bounds.x,
        zone.bounds.y,
        zone.bounds.width,
        zone.bounds.height,
      );

      graphics.lineStyle(2, color.hex, 0.8);
      graphics.strokeRect(
        zone.bounds.x,
        zone.bounds.y,
        zone.bounds.width,
        zone.bounds.height,
      );

      graphics.setDepth(-1);
      graphics.name = `zone_${zone.id}`;

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

  private createRoadTile(
    road: RoadPolyline,
  ): Phaser.GameObjects.GameObject | null {
    if (!road.points || road.points.length === 0) return null;

    const gfx = this.scene.add.graphics();
    gfx.lineStyle(road.width || 8, 0x8d6e63, 1);

    gfx.beginPath();
    gfx.moveTo(road.points[0].x, road.points[0].y);
    for (let i = 1; i < road.points.length; i++) {
      gfx.lineTo(road.points[i].x, road.points[i].y);
    }
    gfx.strokePath();

    gfx.setDepth(1);
    gfx.name = `road_${road.id}`;
    return gfx;
  }

  private async renderDecorations(): Promise<void> {
    const decorations = this.gameState.mapElements.filter(
      (e) => e.type === "decoration",
    );
    let decorationsRendered = 0;

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

      if (i % 200 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    logAutopoiesis.info(`🌳 Decoraciones renderizadas: ${decorationsRendered}`);
  }

  private createDecorationSprite(
    decoration: MapElement & { assetKey?: string; biome?: string },
  ): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle | null {
    const assetManager = this.scene.registry.get("unifiedAssetManager") as
      | { isAssetLoaded: (k: string) => boolean }
      | undefined;

    let assetKey = decoration.assetKey as string | undefined;
    const meta = decoration.metadata || {};
    if (!assetKey && (meta as { assetId?: string }).assetId) {
      assetKey = (meta as { assetId?: string }).assetId;
    }

    const biomeHint = decoration.biome || (meta as { biome?: string }).biome;

    if (!assetKey || !assetManager?.isAssetLoaded(assetKey)) {
      assetKey = this.getFallbackDecorationAsset(biomeHint);

      if (!assetManager?.isAssetLoaded(assetKey)) {
        return this.createFallbackDecoration(decoration);
      }
    }

    const sprite = this.scene.add.sprite(
      decoration.position.x,
      decoration.position.y,
      assetKey,
    );

    let width = decoration.size.width;
    let height = decoration.size.height;
    if (assetKey.includes("tree")) {
      width = 64;
      height = 96;
      sprite.setOrigin(0.5, 0.85);
    } else if (assetKey.includes("bush")) {
      width = 48;
      height = 36;
      sprite.setOrigin(0.5, 0.6);
    } else {
      sprite.setOrigin(0.5, 0.5);
    }

    sprite.setDisplaySize(width, height);

    sprite.setDepth(2 + sprite.y * 0.001);
    sprite.name = `decoration_${decoration.id}`;
    const variation = Math.random();
    if (variation < 0.08) sprite.setTint(0xdddddd);
    else if (variation < 0.16) sprite.setAlpha(0.92);
    if (assetKey.includes("water")) {
      const pipelineKey = this.scene.registry.get("waterPipelineKey") as
        | string
        | undefined;
      if (pipelineKey) {
        sprite.setPipeline(pipelineKey);
      }
    }

    return sprite;
  }

  private createFallbackDecoration(
    decoration: MapElement,
  ): Phaser.GameObjects.Rectangle {
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

    return rect;
  }

  public updateVisuals(): void {
    const camera = this.scene.cameras.main;
    const currentPos = { x: camera.scrollX, y: camera.scrollY };

    const distance = Math.hypot(
      currentPos.x - this.lastCameraPosition.x,
      currentPos.y - this.lastCameraPosition.y,
    );

    if (distance > 50) {
      this.performCulling(camera);
      this.lastCameraPosition = currentPos;
    }
  }

  private performCulling(camera: Phaser.Cameras.Scene2D.Camera): void {
    const bounds = {
      left: camera.scrollX - this.RENDER_DISTANCE,
      right: camera.scrollX + camera.width + this.RENDER_DISTANCE,
      top: camera.scrollY - this.RENDER_DISTANCE,
      bottom: camera.scrollY + camera.height + this.RENDER_DISTANCE,
    };

    this.renderedDecorations.forEach((sprite) => {
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
