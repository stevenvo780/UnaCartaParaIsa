/**
 * Gestor de tilesets que organiza todos los assets en un sistema unificado
 * Compatible con Phaser.Tilemaps y autotiles
 */

export interface TileInfo {
  id: number;
  name: string;
  category: 'terrain' | 'water' | 'autotile' | 'decoration' | 'structure';
  biomes: string[];
  imagePath: string;
  autotileRule?: string; // 'grass_edge_n', 'water_corner_ne', etc.
}

export interface TilesetConfig {
  name: string;
  tileWidth: number;
  tileHeight: number;
  tileCount: number;
  columns: number;
  margin: 0;
  spacing: 0;
  tiles: TileInfo[];
}

/**
 * Administrador central de tilesets
 */
export class TilesetManager {
  private static instance: TilesetManager;
  private tilesets = new Map<string, TilesetConfig>();
  private tileInfoById = new Map<number, TileInfo>();

  private constructor() {
    // Singleton pattern - constructor intentionally empty
  }

  static getInstance(): TilesetManager {
    if (!TilesetManager.instance) {
      TilesetManager.instance = new TilesetManager();
    }
    return TilesetManager.instance;
  }

  /**
   * Inicializa los tilesets basados en los assets disponibles
   */
  initializeTilesets(): void {
    this.createMainTileset();
    this.createWaterTileset();
    this.createAutotileset();
  }

  /**
   * Crea el tileset principal con terrenos base
   */
  private createMainTileset(): void {
    const tiles: TileInfo[] = [];
    let id = 0;

    // Césped base - IDs 0-32
    for (let i = 1; i <= 31; i++) {
      tiles.push({
        id: id++,
        name: `cesped${i}`,
        category: 'terrain',
        biomes: this.determineBiomeFromCespedId(i),
        imagePath: `assets/terrain/base/cesped${i}.png`,
      });
    }

    // Terrenos especiales - IDs 33-35
    tiles.push({
      id: id++,
      name: 'grass_middle',
      category: 'terrain',
      biomes: ['GRASSLAND', 'FOREST'],
      imagePath: 'assets/terrain/base/Grass_Middle.png',
    });

    tiles.push({
      id: id++,
      name: 'textured_grass',
      category: 'terrain',
      biomes: ['GRASSLAND', 'VILLAGE'],
      imagePath: 'assets/terrain/base/TexturedGrass.png',
    });

    this.tilesets.set('main_terrain', {
      name: 'main_terrain',
      tileWidth: 32,
      tileHeight: 32,
      tileCount: tiles.length,
      columns: 8, // 8 columnas para organizar bien
      margin: 0,
      spacing: 0,
      tiles,
    });

    // Registrar tiles por ID
    tiles.forEach(tile => this.tileInfoById.set(tile.id, tile));
  }

  /**
   * Crea el tileset de agua
   */
  private createWaterTileset(): void {
    const tiles: TileInfo[] = [];
    let id = 100; // Empezar en 100 para agua

    // Agua base
    tiles.push({
      id: id++,
      name: 'water_middle',
      category: 'water',
      biomes: ['WETLAND'],
      imagePath: 'assets/water/Water_Middle.png',
    });

    // Tiles organizados de agua (tile_XX_YY)
    const waterTilePattern = /tile_(\d{2})_(\d{2})\.png/;
    const waterTiles = [
      'tile_00_02.png',
      'tile_00_03.png',
      'tile_00_04.png',
      'tile_00_05.png',
      'tile_01_00.png',
      'tile_01_01.png',
      'tile_01_02.png',
      'tile_01_03.png',
      'tile_02_00.png',
      'tile_02_01.png',
      'tile_02_02.png',
      'tile_02_03.png',
      'tile_03_00.png',
      'tile_03_01.png',
      'tile_03_02.png',
      'tile_03_03.png',
      'tile_04_00.png',
      'tile_04_01.png',
      'tile_04_02.png',
      'tile_04_03.png',
      'tile_05_00.png',
      'tile_05_01.png',
      'tile_05_02.png',
      'tile_05_03.png',
    ];

    waterTiles.forEach(tileName => {
      const match = waterTilePattern.exec(tileName);
      if (match) {
        tiles.push({
          id: id++,
          name: tileName.replace('.png', ''),
          category: 'water',
          biomes: ['WETLAND'],
          imagePath: `assets/water/${tileName}`,
        });
      }
    });

    this.tilesets.set('water', {
      name: 'water',
      tileWidth: 32,
      tileHeight: 32,
      tileCount: tiles.length,
      columns: 6,
      margin: 0,
      spacing: 0,
      tiles,
    });

    tiles.forEach(tile => this.tileInfoById.set(tile.id, tile));
  }

  /**
   * Crea el tileset de autotiles para transiciones
   */
  private createAutotileset(): void {
    const tiles: TileInfo[] = [];
    let id = 200; // Empezar en 200 para autotiles

    const autotiles = [
      { name: 'grass_edge_n', rule: 'edge_north' },
      { name: 'grass_edge_s', rule: 'edge_south' },
      { name: 'grass_edge_e', rule: 'edge_east' },
      { name: 'grass_edge_w', rule: 'edge_west' },
      { name: 'water_edge_n', rule: 'water_edge_north' },
      { name: 'water_edge_s', rule: 'water_edge_south' },
      { name: 'water_edge_e', rule: 'water_edge_east' },
      { name: 'water_edge_w', rule: 'water_edge_west' },
      { name: 'water_corner_ne', rule: 'water_corner_northeast' },
      { name: 'water_corner_nw', rule: 'water_corner_northwest' },
      { name: 'water_corner_se', rule: 'water_corner_southeast' },
      { name: 'water_corner_sw', rule: 'water_corner_southwest' },
    ];

    autotiles.forEach(autotile => {
      tiles.push({
        id: id++,
        name: autotile.name,
        category: 'autotile',
        biomes: ['GRASSLAND', 'WETLAND'],
        imagePath: `assets/terrain/autotiles/${autotile.name}.png`,
        autotileRule: autotile.rule,
      });
    });

    this.tilesets.set('autotiles', {
      name: 'autotiles',
      tileWidth: 32,
      tileHeight: 32,
      tileCount: tiles.length,
      columns: 4,
      margin: 0,
      spacing: 0,
      tiles,
    });

    tiles.forEach(tile => this.tileInfoById.set(tile.id, tile));
  }

  /**
   * Determina qué biomas pueden usar un césped específico
   */
  private determineBiomeFromCespedId(id: number): string[] {
    if (id <= 10) return ['GRASSLAND', 'VILLAGE'];
    if (id <= 20) return ['FOREST'];
    if (id <= 31) return ['MYSTICAL'];
    return ['GRASSLAND'];
  }

  /**
   * Obtiene información de un tile por ID
   */
  getTileInfo(id: number): TileInfo | undefined {
    return this.tileInfoById.get(id);
  }

  /**
   * Obtiene configuración de un tileset
   */
  getTileset(name: string): TilesetConfig | undefined {
    return this.tilesets.get(name);
  }

  /**
   * Obtiene todos los tilesets
   */
  getAllTilesets(): TilesetConfig[] {
    return Array.from(this.tilesets.values());
  }

  /**
   * Busca tiles compatibles con un bioma
   */
  getTilesByBiome(biome: string, category?: string): TileInfo[] {
    const allTiles = Array.from(this.tileInfoById.values());
    return allTiles.filter(tile => tile.biomes.includes(biome) && (!category || tile.category === category));
  }

  /**
   * Obtiene un tile aleatorio para un bioma
   */
  getRandomTileForBiome(biome: string, category = 'terrain'): TileInfo | null {
    const compatibleTiles = this.getTilesByBiome(biome, category);
    if (compatibleTiles.length === 0) return null;

    return compatibleTiles[Math.floor(Math.random() * compatibleTiles.length)];
  }

  /**
   * Obtiene el tile de autotile apropiado para una transición
   */
  getAutotileForTransition(_fromBiome: string, _toBiome: string, direction: string): TileInfo | null {
    // Lógica para determinar qué autotile usar
    const autotiles = this.getTilesByBiome('GRASSLAND', 'autotile');

    // Buscar por regla de dirección
    const matching = autotiles.find(tile => tile.autotileRule?.includes(direction.toLowerCase()));

    return matching || null;
  }
}

/**
 * Función utilitaria para inicializar el sistema de tilesets
 */
export function initializeTilesets(): TilesetManager {
  const manager = TilesetManager.getInstance();
  manager.initializeTilesets();
  return manager;
}
