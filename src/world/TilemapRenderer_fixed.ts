/**
 * Renderizador profesional de tilemaps usando Phaser.Tilemaps
 * Integra con TilesetManager para uso eficiente de assets organizados
 */

import Phaser from 'phaser';
import { TilesetManager, TileInfo } from './TilesetManager';
import type { BiomeType } from './BiomeDefinitions';
import type { GeneratedWorld, WorldLayer } from './types';

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
  type: 'tilelayer';
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
  private tilesetManager: TilesetManager;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tilesetManager = TilesetManager.getInstance();
  }

  /**
   * Renderiza un mundo generado usando tilemaps profesionales
   */
  async renderWorld(world: GeneratedWorld): Promise<void> {
    // 1. Generar array de IDs de tiles desde el mundo
    const tileData = this.generateTileDataFromWorld(world);
    const width = world.terrain[0].length;
    const height = world.terrain.length;
    
    // 2. Crear tilesets dinámicos
    await this.createDynamicTilesets();
    
    // 3. Crear el tilemap en Phaser
    this.tilemap = this.scene.make.tilemap({
      data: [tileData],
      tileWidth: 32,
      tileHeight: 32,
      width,
      height
    });

    // 4. Crear canvas y textura para tiles
    const tilesetTexture = await this.createTilesetTexture();
    
    // 5. Añadir imagen al cache de Phaser
    this.scene.textures.addImage('tileset_texture', tilesetTexture);
    
    // 6. Añadir tileset al mapa
    const tileset = this.tilemap.addTilesetImage('tileset_texture', 'tileset_texture');
    
    // 7. Crear capa del mapa
    const layer = this.tilemap.createLayer(0, tileset, 0, 0);
    if (layer) {
      this.layers.set('ground', layer);
    }

    // 8. Aplicar autotiles para transiciones naturales
    this.applyAutotiles(world);
  }

  /**
   * Genera array de IDs de tiles desde el mundo generado
   */
  private generateTileDataFromWorld(world: GeneratedWorld): number[][] {
    const tileData: number[][] = [];
    
    for (let y = 0; y < world.terrain.length; y++) {
      const row: number[] = [];
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const biome = tile.biome;
        
        // Obtener ID de tile basado en bioma
        const tileId = this.getTileIdForBiome(biome);
        row.push(tileId);
      }
      tileData.push(row);
    }
    
    return tileData;
  }

  /**
   * Obtiene un ID de tile apropiado para un bioma
   */
  private getTileIdForBiome(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.GRASSLAND:
        return 1; // Grass tile
      case BiomeType.FOREST:
        return 2; // Forest tile  
      case BiomeType.WETLAND:
        return 3; // Water tile
      case BiomeType.MOUNTAINOUS:
        return 4; // Stone tile
      case BiomeType.MYSTICAL:
        return 5; // Special tile
      case BiomeType.VILLAGE:
        return 6; // Path tile
      default:
        return 1; // Default grass
    }
  }

  /**
   * Convierte path de asset a ID de tile
   */
  private assetPathToTileId(assetPath: string): number {
    // Buscar en el TilesetManager
    const tile = this.tilesetManager.getTileByAssetPath(assetPath);
    return tile ? tile.id : 1; // Default a grass si no se encuentra
  }

  /**
   * Crea tilesets dinámicos en el cache
   */
  private async createDynamicTilesets(): Promise<void> {
    const tilesets = this.tilesetManager.getAllTilesets();
    
    for (const tileset of tilesets) {
      // Crear canvas para este tileset
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Configurar tamaño del canvas
      const cols = Math.ceil(Math.sqrt(tileset.tiles.length));
      canvas.width = cols * 32;
      canvas.height = Math.ceil(tileset.tiles.length / cols) * 32;
      
      // Dibujar tiles en el canvas
      for (let i = 0; i < tileset.tiles.length; i++) {
        const tile = tileset.tiles[i];
        const x = (i % cols) * 32;
        const y = Math.floor(i / cols) * 32;
        
        // Aquí necesitaríamos cargar la imagen real del asset
        // Por ahora, crear un color sólido basado en el bioma
        ctx.fillStyle = this.getBiomeColor(tile.assetPath);
        ctx.fillRect(x, y, 32, 32);
      }
      
      // Añadir al cache de texturas
      this.scene.textures.addImage(tileset.name, canvas);
    }
  }

  /**
   * Crea textura de tileset unificada
   */
  private async createTilesetTexture(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Por simplicidad, crear un tileset básico con colores de biomas
    canvas.width = 8 * 32; // 8 tiles por fila
    canvas.height = 2 * 32; // 2 filas
    
    const biomeColors = [
      '#000000', // 0 - vacío
      '#4CAF50', // 1 - grassland
      '#2E7D32', // 2 - forest
      '#1976D2', // 3 - wetland
      '#795548', // 4 - mountainous
      '#9C27B0', // 5 - mystical
      '#FFC107'  // 6 - village
    ];
    
    for (let i = 0; i < biomeColors.length; i++) {
      const x = (i % 8) * 32;
      const y = Math.floor(i / 8) * 32;
      
      ctx.fillStyle = biomeColors[i];
      ctx.fillRect(x, y, 32, 32);
      
      // Añadir borde para claridad
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 32, 32);
    }
    
    return canvas;
  }

  /**
   * Obtiene color representativo para un asset/bioma
   */
  private getBiomeColor(assetPath: string): string {
    if (assetPath.includes('grass') || assetPath.includes('cesped')) {
      return '#4CAF50';
    } else if (assetPath.includes('water') || assetPath.includes('agua')) {
      return '#1976D2';
    } else if (assetPath.includes('stone') || assetPath.includes('rock')) {
      return '#795548';
    } else if (assetPath.includes('tree') || assetPath.includes('forest')) {
      return '#2E7D32';
    } else {
      return '#4CAF50'; // Default grass
    }
  }

  /**
   * Aplica autotiles para transiciones naturales entre biomas
   */
  private applyAutotiles(world: GeneratedWorld): void {
    const groundLayer = this.layers.get('ground');
    if (!groundLayer) return;

    this.detectAndApplyTransitions(world, groundLayer);
  }

  /**
   * Detecta y aplica transiciones automáticas
   */
  private detectAndApplyTransitions(world: GeneratedWorld, layer: Phaser.Tilemaps.TilemapLayer): void {
    const width = world.terrain[0].length;
    const height = world.terrain.length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentBiome = this.getBiomeAtPosition(world, x, y);
        const neighbors = this.getNeighborBiomes(world, x, y);
        
        // Si hay vecinos de diferente bioma, aplicar autotile
        const hasDifferentNeighbors = neighbors.some(n => n !== currentBiome);
        if (hasDifferentNeighbors) {
          const autotileId = this.selectAutotile(currentBiome, neighbors);
          if (autotileId !== null) {
            layer.putTileAt(autotileId, x, y);
          }
        }
      }
    }
  }

  /**
   * Obtiene el bioma en una posición específica
   */
  private getBiomeAtPosition(world: GeneratedWorld, x: number, y: number): BiomeType | null {
    if (y >= 0 && y < world.terrain.length && x >= 0 && x < world.terrain[y].length) {
      return world.terrain[y][x].biome;
    }
    return null;
  }

  /**
   * Obtiene los biomas vecinos de una posición
   */
  private getNeighborBiomes(world: GeneratedWorld, x: number, y: number): BiomeType[] {
    const neighbors: BiomeType[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
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
   * Selecciona el autotile apropiado basado en vecinos
   */
  private selectAutotile(current: BiomeType | null, neighbors: BiomeType[]): number | null {
    // Implementación básica - en producción usaría reglas más complejas
    // Por ahora retorna el tile base
    return this.getTileIdForBiome(current || BiomeType.GRASSLAND);
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
