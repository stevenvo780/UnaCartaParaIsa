/**
 * Renderizador profesional de tilemaps usando Phaser.Tilemaps
 * Reemplaza el sistema ineficiente de scene.add.image individual
 */

import Phaser from 'phaser';
import { TilesetManager, TileInfo } from './TilesetManager';
import { BiomeType } from './types';
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
    // 1. Generar datos de tilemap desde el mundo
        const mapData: TilemapData = {
      name: 'WorldMap',
      width,
      height,
      tilewidth: 64,
      tileheight: 64,
      layers: [{
        name: 'ground',
        width,
        height,
        data: tileIdArray,
        x: 0,
        y: 0,
        opacity: 1
      }],
      tilesets: [],
      nextObjectId: 1,
      version: '1.0',
      tiledversion: '1.0'
    };
    
    // 2. Crear tilesets dinámicos
    await this.createDynamicTilesets();
    
    // 3. Crear el tilemap en Phaser
    this.tilemap = this.scene.make.tilemap({
      data: tilemapData,
      tileWidth: 32,
      tileHeight: 32
    });

    // 4. Agregar tilesets al tilemap
    this.addTilesetsToTilemap();
    
    // 5. Crear capas en orden de profundidad
    this.createOrderedLayers(world.layers);
    
    // 6. Aplicar autotiles para transiciones naturales
    this.applyAutotiles(world);

    console.log('🗺️ Tilemap profesional creado', {
      layers: this.layers.size,
      worldSize: `${world.config.width}x${world.config.height}`,
      tilesets: this.tilesetManager.getAllTilesets().length
    });
  }

  /**
   * Convierte el mundo generado a formato de datos de tilemap
   */
  private generateTilemapData(world: GeneratedWorld): TilemapData {
    const { width, height, tileSize } = world.config;
    
    // Crear capas de datos de tiles
    const layers: TilemapLayer[] = [];
    
    world.layers.forEach(layer => {
      const layerData = new Array(width * height).fill(0);
      
      layer.tiles.forEach(tile => {
        const x = Math.floor(tile.x / tileSize);
        const y = Math.floor(tile.y / tileSize);
        const index = y * width + x;
        
        if (index >= 0 && index < layerData.length) {
          // Convertir asset a tile ID
          const tileId = this.assetPathToTileId(tile.asset);
          layerData[index] = tileId;
        }
      });

      layers.push({
        name: layer.name,
        width,
        height,
        data: layerData,
        visible: true,
        opacity: layer.name === 'terrain' ? 1 : 0.9,
        type: 'tilelayer'
      });
    });

    return {
      width,
      height,
      tilewidth: tileSize,
      tileheight: tileSize,
      layers,
      tilesets: this.generateTilesetInfos()
    };
  }

  /**
   * Convierte path de asset a ID de tile
   */
  private assetPathToTileId(assetPath: string): number {
    // Buscar tile que coincida con el path
    const allTilesets = this.tilesetManager.getAllTilesets();
    
    for (const tileset of allTilesets) {
      const tile = tileset.tiles.find(t => t.imagePath.includes(assetPath) || t.name === assetPath);
      if (tile) return tile.id;
    }

    // Fallback: tile por defecto
    return 1; // cesped1
  }

  /**
   * Genera información de tilesets para el tilemap
   */
  private generateTilesetInfos(): TilesetInfo[] {
    return this.tilesetManager.getAllTilesets().map((tileset, index) => ({
      firstgid: index * 1000 + 1, // Separar rangos de IDs
      name: tileset.name,
      tilewidth: tileset.tileWidth,
      tileheight: tileset.tileHeight,
      tilecount: tileset.tileCount,
      columns: tileset.columns,
      image: `tileset_${tileset.name}.png`, // Se generará dinámicamente
      imagewidth: tileset.columns * tileset.tileWidth,
      imageheight: Math.ceil(tileset.tileCount / tileset.columns) * tileset.tileHeight
    }));
  }

  /**
   * Crea tilesets dinámicos combinando imágenes
   */
  private async createDynamicTilesets(): Promise<void> {
    const tilesets = this.tilesetManager.getAllTilesets();
    
    for (const tileset of tilesets) {
      await this.createTilesetTexture(tileset);
    }
  }

  /**
   * Crea una textura de tileset combinando múltiples imágenes
   */
  private async createTilesetTexture(tileset: any): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = tileset.columns * tileset.tileWidth;
    canvas.height = Math.ceil(tileset.tileCount / tileset.columns) * tileset.tileHeight;
    
    // Renderizar cada tile en su posición correcta
    for (let i = 0; i < tileset.tiles.length; i++) {
      const tile = tileset.tiles[i];
      const col = i % tileset.columns;
      const row = Math.floor(i / tileset.columns);
      const x = col * tileset.tileWidth;
      const y = row * tileset.tileHeight;
      
      try {
        // Cargar imagen del tile
        const img = await this.loadImage(tile.imagePath);
        ctx.drawImage(img, x, y, tileset.tileWidth, tileset.tileHeight);
      } catch (error) {
        // Fallback: tile de error
        this.drawErrorTile(ctx, x, y, tileset.tileWidth, tileset.tileHeight);
      }
    }
    
    // Convertir canvas a textura de Phaser
    const textureKey = `tileset_${tileset.name}`;
    this.scene.textures.addCanvas(textureKey, canvas);
  }

  /**
   * Carga una imagen de forma asíncrona
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src.startsWith('assets/') ? `/${src}` : src;
    });
  }

  /**
   * Dibuja un tile de error
   */
  private drawErrorTile(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText('?', x + width/2 - 4, y + height/2 + 3);
  }

  /**
   * Agrega tilesets al tilemap de Phaser
   */
  private addTilesetsToTilemap(): void {
    if (!this.tilemap) return;
    
    this.tilesetManager.getAllTilesets().forEach(tileset => {
      const textureKey = `tileset_${tileset.name}`;
      this.tilemap!.addTilesetImage(tileset.name, textureKey, tileset.tileWidth, tileset.tileHeight);
    });
  }

  /**
   * Crea capas ordenadas por profundidad
   */
  private createOrderedLayers(worldLayers: WorldLayer[]): void {
    if (!this.tilemap) return;

    const layerOrder = ['terrain', 'water', 'decals', 'vegetation', 'props', 'structures'];
    
    layerOrder.forEach(layerName => {
      const worldLayer = worldLayers.find(l => l.name === layerName);
      if (!worldLayer) return;

      const tilesetName = this.getTilesetForLayer(layerName);
      const tileset = this.tilemap!.getTileset(tilesetName);
      
      if (tileset) {
        const phaserLayer = this.tilemap!.createLayer(layerName, tileset);
        if (phaserLayer) {
          phaserLayer.setDepth(worldLayer.zIndex);
          this.layers.set(layerName, phaserLayer);
        }
      }
    });
  }

  /**
   * Determina qué tileset usar para una capa
   */
  private getTilesetForLayer(layerName: string): string {
    switch (layerName) {
      case 'terrain': return 'main_terrain';
      case 'water': return 'water';
      case 'decals':
      case 'vegetation':
      case 'props':
      case 'structures':
        return 'main_terrain';
      default: return 'main_terrain';
    }
  }

  /**
   * Aplica autotiles para transiciones naturales
   */
  private applyAutotiles(world: GeneratedWorld): void {
    const terrainLayer = this.layers.get('terrain');
    if (!terrainLayer) return;

    // Analizar transiciones entre biomas
    this.detectAndApplyTransitions(world, terrainLayer);
  }

  /**
   * Detecta y aplica transiciones automáticas entre biomas
   */
  private detectAndApplyTransitions(world: GeneratedWorld, layer: Phaser.Tilemaps.TilemapLayer): void {
    const { width, height } = world.config;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const currentBiome = this.getBiomeAtPosition(world, x, y);
        const neighbors = this.getNeighborBiomes(world, x, y);
        
        // Si hay biomas diferentes en vecinos, aplicar autotile
        if (this.shouldApplyAutotile(currentBiome, neighbors)) {
          const autotileId = this.selectAutotile(currentBiome, neighbors);
          if (autotileId) {
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
    // Implementar lógica para determinar bioma en posición
    // Por ahora retornamos GRASSLAND como default
    return BiomeType.GRASSLAND;
  }

  /**
   * Obtiene los biomas vecinos
   */
  private getNeighborBiomes(world: GeneratedWorld, x: number, y: number): BiomeType[] {
    const neighbors: BiomeType[] = [];
    const directions = [[-1,0], [1,0], [0,-1], [0,1]]; // N, S, E, W
    
    directions.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < world.config.width && ny >= 0 && ny < world.config.height) {
        const biome = this.getBiomeAtPosition(world, nx, ny);
        if (biome) neighbors.push(biome);
      }
    });
    
    return neighbors;
  }

  /**
   * Determina si se debe aplicar un autotile
   */
  private shouldApplyAutotile(current: BiomeType | null, neighbors: BiomeType[]): boolean {
    if (!current) return false;
    return neighbors.some(neighbor => neighbor !== current);
  }

  /**
   * Selecciona el autotile apropiado
   */
  private selectAutotile(current: BiomeType | null, neighbors: BiomeType[]): number | null {
    // Lógica simplificada - retornar ID de autotile grass edge
    return 200; // grass_edge_n del TilesetManager
  }

  /**
   * Limpia recursos del tilemap
   */
  dispose(): void {
    this.layers.clear();
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = undefined;
    }
  }
}

/**
 * Factory function para crear un renderizador de tilemaps
 */
export function createTilemapRenderer(scene: Phaser.Scene): TilemapRenderer {
  return new TilemapRenderer(scene);
}
