/**
 * Renderizador profesional de tilemaps usando Phaser.Tilemaps
 * Integra con TilesetManager y CreativeAssetLoader para uso real de assets organizados
 */

import type Phaser from "phaser";
import { CreativeAssetLoader, type AssetInfo } from "./CreativeAssetLoader";
import { BiomeType, type GeneratedWorld } from "./types";
import { logAutopoiesis } from "../utils/logger";

export interface TilemapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TilemapLayer[];
  tilesets: TilesetInfo[];
}

export interface TilemapLayer {
  name: string;
  width: number;
  height: number;
  data: number[];
  visible: boolean;
  opacity: number;
  type: "tilelayer";
}

export interface TilesetInfo {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  image: string;
  imagewidth: number;
  imageheight: number;
}

/**
 * Renderizador profesional que usa Phaser Tilemaps
 */
export class TilemapRenderer {
  private scene: Phaser.Scene;
  private assetLoader: CreativeAssetLoader;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private layers = new Map<string, Phaser.Tilemaps.TilemapLayer>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.assetLoader = new CreativeAssetLoader(scene);
  }

  /**
   * Renderiza un mundo generado usando tilemaps profesionales con assets reales
   */
  async renderWorld(world: GeneratedWorld): Promise<void> {
    logAutopoiesis.info(
      "🎨 Iniciando renderizado creativo con assets reales...",
    );

    // 1. Cargar todos los assets creativamente
    await this.assetLoader.loadAllAssets();

    // 2. Generar array de tiles usando assets reales
    const tileData = await this.generateCreativeTileData(world);
    const width = world.terrain[0].length;
    const height = world.terrain.length;

    // 3. Crear tileset dinámico con assets reales
    const tilesetTexture = await this.createRealAssetTileset(world);

    // 4. Crear el tilemap en Phaser
    const flatTileData = tileData.flat();
    this.tilemap = this.scene.make.tilemap({
      data: [flatTileData],
      tileWidth: 32,
      tileHeight: 32,
      width,
      height,
    });

    // 5. Añadir textura real al cache
    const textureKey = "real_tileset";
    if (!this.scene.textures.exists(textureKey)) {
      this.scene.textures.addCanvas(textureKey, tilesetTexture);
    }

    // 6. Añadir tileset al mapa
    const tileset = this.tilemap.addTilesetImage(textureKey, textureKey);

    // 7. Crear capa del mapa
    if (tileset) {
      const layer = this.tilemap.createLayer(0, tileset, 0, 0);
      if (layer) {
        this.layers.set("ground", layer);

        // 8. Aplicar autotiles reales para transiciones naturales
        await this.applyRealAutotiles(world, layer);
      }
    }

    logAutopoiesis.info(
      "✅ Mundo renderizado con assets reales y diversidad creativa",
    );
  }

  /**
   * Genera array de tiles usando assets reales y variaciones creativas
   */
  private async generateCreativeTileData(
    world: GeneratedWorld,
  ): Promise<number[][]> {
    const tileData: number[][] = [];

    for (let y = 0; y < world.terrain.length; y++) {
      const row: number[] = [];
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const { biome } = tile;

        // Obtener asset creativo basado en bioma, posición y variaciones
        const tileId = this.getCreativeTileId(biome, x, y, tile.biomeStrength);
        row.push(tileId);
      }
      tileData.push(row);
    }

    return tileData;
  }

  /**
   * Obtiene ID de tile creativo basado en múltiples factores
   */
  private getCreativeTileId(
    biome: BiomeType,
    x: number,
    y: number,
    strength: number,
  ): number {
    // Usar posición y strength para crear variación natural
    const seed = (x * 73 + y * 137 + Math.floor(strength * 100)) % 100;

    switch (biome) {
      case BiomeType.GRASSLAND: {
        // Usar diferentes variaciones de césped basadas en posición
        const grassVariant = (seed % 31) + 1; // 31 variaciones disponibles
        return grassVariant;
      }

      case BiomeType.WETLAND: {
        // Usar patrón de tiles de agua organizados
        const waterRow = Math.floor(seed / 12) % 6;
        const waterCol = seed % 12;
        return 100 + waterRow * 12 + waterCol; // Offset 100 para agua
      }

      case BiomeType.VILLAGE: {
        // Usar tiles de road de forma inteligente
        return 200 + (seed % 15); // Offset 200 para roads
      }

      case BiomeType.FOREST: {
        // Grass más denso y variado
        const forestVariant = (Math.floor(seed / 3) % 31) + 1;
        return forestVariant;
      }

      case BiomeType.MOUNTAINOUS: {
        // Variaciones más rocosas
        const mountainVariant = ((15 + (seed % 16)) % 31) + 1;
        return mountainVariant;
      }

      case BiomeType.MYSTICAL: {
        // Combinación especial y variada
        const mysticalVariant =
          seed % 2 === 0 ? (seed % 10) + 20 : (seed % 5) + 1;
        return mysticalVariant;
      }

      default:
        return 1; // Default grass
    }
  }

  /**
   * Crea tileset real usando assets cargados
   */
  private async createRealAssetTileset(
    world: GeneratedWorld,
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calcular biomas únicos en el mundo
    const uniqueBiomes = this.getUniqueBiomesFromWorld(world);
    const totalTiles = this.calculateTotalTilesNeeded(uniqueBiomes);

    // Configurar canvas para acomodar todos los tiles
    const tilesPerRow = Math.ceil(Math.sqrt(totalTiles));
    canvas.width = tilesPerRow * 32;
    canvas.height = Math.ceil(totalTiles / tilesPerRow) * 32;

    logAutopoiesis.info(
      `🎨 Creando tileset real: ${totalTiles} tiles, ${tilesPerRow}x${Math.ceil(totalTiles / tilesPerRow)}`,
    );

    let currentTileIndex = 0;

    // Dibujar tiles reales por bioma
    for (const biome of uniqueBiomes) {
      currentTileIndex = await this.drawBiomeTiles(
        ctx,
        biome,
        currentTileIndex,
        tilesPerRow,
      );
    }

    return canvas;
  }

  /**
   * Obtiene biomas únicos del mundo generado
   */
  private getUniqueBiomesFromWorld(world: GeneratedWorld): BiomeType[] {
    const biomes = new Set<BiomeType>();

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        biomes.add(world.terrain[y][x].biome);
      }
    }

    return Array.from(biomes);
  }

  /**
   * Calcula total de tiles necesarios para todos los biomas
   */
  private calculateTotalTilesNeeded(biomes: BiomeType[]): number {
    let total = 0;

    for (const biome of biomes) {
      switch (biome) {
        case BiomeType.GRASSLAND:
          total += 31; // 31 variaciones de césped
          break;
        case BiomeType.WETLAND:
          total += 72; // 6x12 tiles de agua organizados
          break;
        case BiomeType.VILLAGE:
          total += 15; // 15 tipos de road
          break;
        case BiomeType.FOREST:
        case BiomeType.MOUNTAINOUS:
        case BiomeType.MYSTICAL:
          total += 31; // Variaciones de grass
          break;
      }
    }

    return Math.max(total, 256); // Mínimo 256 para flexibilidad
  }

  /**
   * Dibuja tiles reales de un bioma específico
   */
  private async drawBiomeTiles(
    ctx: CanvasRenderingContext2D,
    biome: BiomeType,
    startIndex: number,
    tilesPerRow: number,
  ): Promise<number> {
    const biomeAssets = this.assetLoader.getAssetsByBiome(
      this.biomeToAssetBiome(biome),
    );
    let currentIndex = startIndex;

    for (const asset of biomeAssets) {
      const x = (currentIndex % tilesPerRow) * 32;
      const y = Math.floor(currentIndex / tilesPerRow) * 32;

      // Cargar imagen real del asset
      try {
        const img = await this.loadImageAsync(asset.path);
        ctx.drawImage(img, x, y, 32, 32);
      } catch (error) {
        // Fallback: dibujar color sólido si no se puede cargar la imagen
        ctx.fillStyle = this.getBiomeColorById(currentIndex);
        ctx.fillRect(x, y, 32, 32);

        // Añadir borde para identificación
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 32, 32);
      }

      currentIndex++;
    }

    return currentIndex;
  }

  /**
   * Carga imagen de forma asíncrona
   */
  private loadImageAsync(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Convierte BiomeType a string para asset loader
   */
  private biomeToAssetBiome(biome: BiomeType): string {
    switch (biome) {
      case BiomeType.GRASSLAND:
        return "grassland";
      case BiomeType.WETLAND:
        return "wetland";
      case BiomeType.VILLAGE:
        return "village";
      case BiomeType.FOREST:
        return "grassland"; // Forest usa variaciones de grass
      case BiomeType.MOUNTAINOUS:
        return "grassland"; // Mountain usa variaciones de grass
      case BiomeType.MYSTICAL:
        return "grassland"; // Mystical usa variaciones de grass
      default:
        return "grassland";
    }
  }

  /**
   * Aplica autotiles reales para transiciones naturales
   */
  private async applyRealAutotiles(
    world: GeneratedWorld,
    layer: Phaser.Tilemaps.TilemapLayer,
  ): Promise<void> {
    const width = world.terrain[0].length;
    const height = world.terrain.length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentBiome = this.getBiomeAtPosition(world, x, y);
        const neighbors = this.getNeighborBiomes(world, x, y);

        // Detectar transiciones y aplicar autotiles reales
        const transitions = this.detectBiomeTransitions(
          currentBiome,
          neighbors,
        );

        if (transitions.length > 0) {
          const autotileAsset = this.selectRealAutotile(
            currentBiome,
            transitions,
          );
          if (autotileAsset) {
            // Usar el asset real de autotile
            const autotileId = this.getAutotileIdInTileset(autotileAsset);
            layer.putTileAt(autotileId, x, y);
          }
        }
      }
    }
  }

  /**
   * Detecta transiciones específicas entre biomas
   */
  private detectBiomeTransitions(
    current: BiomeType | null,
    neighbors: BiomeType[],
  ): string[] {
    if (!current) return [];

    const transitions: string[] = [];
    const neighborSet = new Set(neighbors);

    // Detectar direcciones de transición
    if (neighborSet.has(BiomeType.WETLAND) && current !== BiomeType.WETLAND) {
      transitions.push("water_transition");
    }

    if (
      neighborSet.has(BiomeType.GRASSLAND) &&
      current !== BiomeType.GRASSLAND
    ) {
      transitions.push("grass_transition");
    }

    return transitions;
  }

  /**
   * Selecciona autotile real basado en transiciones
   */
  private selectRealAutotile(
    current: BiomeType | null,
    transitions: string[],
  ): AssetInfo | null {
    if (!current || transitions.length === 0) return null;

    // Priorizar transiciones de agua
    if (transitions.includes("water_transition")) {
      if (current === BiomeType.GRASSLAND) {
        return this.assetLoader.getAutotileForTransition("water", "n");
      }
    }

    // Priorizar transiciones de grass
    if (transitions.includes("grass_transition")) {
      if (current === BiomeType.WETLAND) {
        return this.assetLoader.getAutotileForTransition("grass", "n");
      }
    }

    return null;
  }

  /**
   * Obtiene ID de autotile en el tileset
   */
  private getAutotileIdInTileset(asset: AssetInfo): number {
    // Por ahora retorna un ID fijo, en producción mapearia a posición real
    return 300 + Math.abs(asset.key.length % 50); // Offset 300 para autotiles
  }

  /**
   * Obtiene color representativo para un ID de tile
   */
  private getBiomeColorById(tileId: number): string {
    switch (tileId) {
      case 1:
        return "#4CAF50"; // grassland
      case 2:
        return "#2E7D32"; // forest
      case 3:
        return "#1976D2"; // wetland
      case 4:
        return "#795548"; // mountainous
      case 5:
        return "#9C27B0"; // mystical
      case 6:
        return "#FFC107"; // village
      default:
        return "#4CAF50"; // default grass
    }
  }

  /**
   * Obtiene el bioma en una posición específica
   */
  private getBiomeAtPosition(
    world: GeneratedWorld,
    x: number,
    y: number,
  ): BiomeType | null {
    if (
      y >= 0 &&
      y < world.terrain.length &&
      x >= 0 &&
      x < world.terrain[y].length
    ) {
      return world.terrain[y][x].biome;
    }
    return null;
  }

  /**
   * Obtiene los biomas vecinos de una posición
   */
  private getNeighborBiomes(
    world: GeneratedWorld,
    x: number,
    y: number,
  ): BiomeType[] {
    const neighbors: BiomeType[] = [];
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const biome = this.getBiomeAtPosition(world, nx, ny);
      if (biome !== null) {
        neighbors.push(biome);
      }
    }

    return neighbors;
  }

  /**
   * Limpia recursos del renderer
   */
  public cleanup(): void {
    this.layers.clear();
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = undefined;
    }
  }

  /**
   * Obtiene el tilemap actual
   */
  public getTilemap(): Phaser.Tilemaps.Tilemap | undefined {
    return this.tilemap;
  }

  /**
   * Obtiene una capa por nombre
   */
  public getLayer(name: string): Phaser.Tilemaps.TilemapLayer | undefined {
    return this.layers.get(name);
  }
}
