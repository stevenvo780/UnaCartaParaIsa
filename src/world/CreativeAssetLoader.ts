/**
 * Asset Loader creativo que carga dinámicamente assets para crear mundos diversos
 */

import type Phaser from 'phaser';
import { logAutopoiesis } from '../utils/logger';

export interface AssetInfo {
  key: string;
  path: string;
  type: 'terrain' | 'water' | 'road' | 'autotile' | 'decoration';
  biome?: string;
  variant?: number;
}

/**
 * Cargador creativo de assets que organiza y carga recursos dinámicamente
 */
export class CreativeAssetLoader {
  private scene: Phaser.Scene;
  private loadedAssets = new Map<string, AssetInfo>();
  private assetsByType = new Map<string, AssetInfo[]>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeAssetCategories();
  }

  /**
   * Inicializa las categorías de assets disponibles
   */
  private initializeAssetCategories(): void {
    this.assetsByType.set('terrain', []);
    this.assetsByType.set('water', []);
    this.assetsByType.set('roads', []);
    this.assetsByType.set('autotiles', []);
    this.assetsByType.set('decorations', []);
  }

  /**
   * Carga creativamente todos los assets de terrain organizados
   */
  async loadTerrainAssets(): Promise<AssetInfo[]> {
    const terrainAssets: AssetInfo[] = [];

    // Cargar todas las variaciones de césped (31 disponibles)
    for (let i = 1; i <= 31; i++) {
      const assetInfo: AssetInfo = {
        key: `cesped_${i}`,
        path: `assets/terrain/base/cesped${i}.png`,
        type: 'terrain',
        biome: 'grassland',
        variant: i,
      };
      terrainAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    // Cargar assets base especiales
    const baseAssets = [
      {
        key: 'grass_middle',
        path: 'assets/terrain/base/Grass_Middle.png',
        biome: 'grassland',
      },
      {
        key: 'textured_grass',
        path: 'assets/terrain/base/TexturedGrass.png',
        biome: 'grassland',
      },
    ];

    for (const asset of baseAssets) {
      const assetInfo: AssetInfo = {
        key: asset.key,
        path: asset.path,
        type: 'terrain',
        biome: asset.biome,
      };
      terrainAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set('terrain', terrainAssets);
    return terrainAssets;
  }

  /**
   * Carga creativamente todos los assets de agua organizados
   */
  async loadWaterAssets(): Promise<AssetInfo[]> {
    const waterAssets: AssetInfo[] = [];

    // Cargar tile base de agua
    const waterBase: AssetInfo = {
      key: 'water_middle',
      path: 'assets/water/Water_Middle.png',
      type: 'water',
      biome: 'wetland',
    };
    waterAssets.push(waterBase);
    this.loadedAssets.set(waterBase.key, waterBase);

    // Cargar tiles organizados de agua (patrón tile_XX_YY)
    const waterTilePatterns = [
      '00_02',
      '00_03',
      '00_04',
      '00_05',
      '00_06',
      '00_07',
      '00_08',
      '00_09',
      '00_10',
      '00_11',
      '01_00',
      '01_01',
      '01_02',
      '01_03',
      '01_04',
      '01_05',
      '01_06',
      '01_07',
      '01_08',
      '01_09',
      '01_10',
      '01_11',
      '02_00',
      '02_01',
      '02_02',
      '02_03',
      '02_04',
      '02_05',
      '02_06',
      '02_07',
      '02_08',
      '02_09',
      '02_10',
      '02_11',
      '03_00',
      '03_01',
      '03_02',
      '03_03',
      '03_04',
      '03_05',
      '03_06',
      '03_07',
      '03_08',
      '03_09',
      '03_10',
      '03_11',
      '04_00',
      '04_01',
      '04_02',
      '04_03',
      '04_04',
      '04_05',
      '04_06',
      '04_07',
      '04_08',
      '04_09',
      '04_10',
      '04_11',
      '05_00',
      '05_01',
      '05_02',
      '05_03',
      '05_04',
      '05_05',
      '05_06',
      '05_07',
      '05_08',
      '05_09',
      '05_10',
      '05_11',
      '09_00',
      '09_01',
      '09_02',
      '09_03',
      '09_04',
      '09_05',
      '09_06',
      '09_07',
      '09_08',
      '09_09',
      '09_10',
      '09_11',
    ];

    for (const pattern of waterTilePatterns) {
      const assetInfo: AssetInfo = {
        key: `water_tile_${pattern}`,
        path: `assets/water/tile_${pattern}.png`,
        type: 'water',
        biome: 'wetland',
        variant: parseInt(pattern.replace('_', ''), 10),
      };
      waterAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    // Cargar tiles especiales
    const specialWater = [
      { key: 'water_0198', path: 'assets/water/tile_0198.png' },
      { key: 'water_0230', path: 'assets/water/tile_0230.png' },
    ];

    for (const special of specialWater) {
      const assetInfo: AssetInfo = {
        key: special.key,
        path: special.path,
        type: 'water',
        biome: 'wetland',
      };
      waterAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set('water', waterAssets);
    return waterAssets;
  }

  /**
   * Carga creativamente todos los assets de roads organizados
   */
  async loadRoadAssets(): Promise<AssetInfo[]> {
    const roadAssets: AssetInfo[] = [];

    const roadTypes = [
      {
        key: 'road_cross',
        path: 'assets/roads/road_path_cross.png',
        type: 'intersection',
      },
      {
        key: 'road_curve_ne',
        path: 'assets/roads/road_path_curve_ne.png',
        type: 'curve',
      },
      {
        key: 'road_curve_nw',
        path: 'assets/roads/road_path_curve_nw.png',
        type: 'curve',
      },
      {
        key: 'road_curve_se',
        path: 'assets/roads/road_path_curve_se.png',
        type: 'curve',
      },
      {
        key: 'road_curve_sw',
        path: 'assets/roads/road_path_curve_sw.png',
        type: 'curve',
      },
      {
        key: 'road_end_e',
        path: 'assets/roads/road_path_end_e.png',
        type: 'end',
      },
      {
        key: 'road_end_n',
        path: 'assets/roads/road_path_end_n.png',
        type: 'end',
      },
      {
        key: 'road_end_s',
        path: 'assets/roads/road_path_end_s.png',
        type: 'end',
      },
      {
        key: 'road_end_w',
        path: 'assets/roads/road_path_end_w.png',
        type: 'end',
      },
      {
        key: 'road_straight_h',
        path: 'assets/roads/road_path_straight_h.png',
        type: 'straight',
      },
      {
        key: 'road_straight_v',
        path: 'assets/roads/road_path_straight_v.png',
        type: 'straight',
      },
      {
        key: 'road_t',
        path: 'assets/roads/road_path_t.png',
        type: 't_junction',
      },
      {
        key: 'road_t_e',
        path: 'assets/roads/road_path_t_e.png',
        type: 't_junction',
      },
      {
        key: 'road_t_s',
        path: 'assets/roads/road_path_t_s.png',
        type: 't_junction',
      },
      {
        key: 'road_t_w',
        path: 'assets/roads/road_path_t_w.png',
        type: 't_junction',
      },
    ];

    for (const road of roadTypes) {
      const assetInfo: AssetInfo = {
        key: road.key,
        path: road.path,
        type: 'road',
        biome: 'village',
      };
      roadAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set('roads', roadAssets);
    return roadAssets;
  }

  /**
   * Carga creativamente todos los autotiles para transiciones
   */
  async loadAutotileAssets(): Promise<AssetInfo[]> {
    const autotileAssets: AssetInfo[] = [];

    const autotileTypes = [
      // Grass edges
      {
        key: 'grass_edge_n',
        path: 'assets/terrain/autotiles/grass_edge_n.png',
        from: 'grassland',
        to: 'other',
      },
      {
        key: 'grass_edge_s',
        path: 'assets/terrain/autotiles/grass_edge_s.png',
        from: 'grassland',
        to: 'other',
      },
      {
        key: 'grass_edge_e',
        path: 'assets/terrain/autotiles/grass_edge_e.png',
        from: 'grassland',
        to: 'other',
      },
      {
        key: 'grass_edge_w',
        path: 'assets/terrain/autotiles/grass_edge_w.png',
        from: 'grassland',
        to: 'other',
      },

      // Water edges
      {
        key: 'water_edge_n',
        path: 'assets/terrain/autotiles/water_edge_n.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_edge_s',
        path: 'assets/terrain/autotiles/water_edge_s.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_edge_e',
        path: 'assets/terrain/autotiles/water_edge_e.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_edge_w',
        path: 'assets/terrain/autotiles/water_edge_w.png',
        from: 'wetland',
        to: 'other',
      },

      // Water corners
      {
        key: 'water_corner_ne',
        path: 'assets/terrain/autotiles/water_corner_ne.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_corner_nw',
        path: 'assets/terrain/autotiles/water_corner_nw.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_corner_se',
        path: 'assets/terrain/autotiles/water_corner_se.png',
        from: 'wetland',
        to: 'other',
      },
      {
        key: 'water_corner_sw',
        path: 'assets/terrain/autotiles/water_corner_sw.png',
        from: 'wetland',
        to: 'other',
      },
    ];

    for (const autotile of autotileTypes) {
      const assetInfo: AssetInfo = {
        key: autotile.key,
        path: autotile.path,
        type: 'autotile',
        biome: autotile.from,
      };
      autotileAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set('autotiles', autotileAssets);
    return autotileAssets;
  }

  /**
   * Carga todos los assets de forma asíncrona
   */
  async loadAllAssets(): Promise<void> {
    logAutopoiesis.info('🎨 Cargando assets creativamente...');

    // Cargar en paralelo para mejor performance
    await Promise.all([
      this.loadTerrainAssets(),
      this.loadWaterAssets(),
      this.loadRoadAssets(),
      this.loadAutotileAssets(),
    ]);

    // Cargar en Phaser
    await this.loadAssetsInPhaser();

    logAutopoiesis.info(
      `✅ Cargados ${this.loadedAssets.size} assets únicos organizados en categorías`
    );
  }

  /**
   * Carga los assets en el cache de Phaser
   */
  private async loadAssetsInPhaser(): Promise<void> {
    return new Promise(resolve => {
      let loadedCount = 0;
      const totalAssets = this.loadedAssets.size;

      this.scene.load.on('filecomplete', () => {
        loadedCount++;
        if (loadedCount >= totalAssets) {
          resolve();
        }
      });

      // Cargar todos los assets
      for (const asset of this.loadedAssets.values()) {
        this.scene.load.image(asset.key, asset.path);
      }

      this.scene.load.start();
    });
  }

  /**
   * Obtiene assets por bioma de forma creativa
   */
  getAssetsByBiome(biome: string): AssetInfo[] {
    const assets: AssetInfo[] = [];

    for (const asset of this.loadedAssets.values()) {
      if (asset.biome === biome) {
        assets.push(asset);
      }
    }

    return assets;
  }

  /**
   * Obtiene asset aleatorio de un tipo/bioma específico
   */
  getRandomAsset(type: string, biome?: string): AssetInfo | null {
    const typeAssets = this.assetsByType.get(type) || [];
    const filteredAssets = biome ? typeAssets.filter(a => a.biome === biome) : typeAssets;

    if (filteredAssets.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filteredAssets.length);
    return filteredAssets[randomIndex];
  }

  /**
   * Obtiene variación específica de césped
   */
  getGrassVariant(variant: number): AssetInfo | null {
    return this.loadedAssets.get(`cesped_${variant}`) || null;
  }

  /**
   * Obtiene tile de agua específico
   */
  getWaterTile(row: number, col: number): AssetInfo | null {
    const key = `water_tile_${row.toString().padStart(2, '0')}_${col.toString().padStart(2, '0')}`;
    return this.loadedAssets.get(key) || null;
  }

  /**
   * Obtiene autotile apropiado para transición
   */
  getAutotileForTransition(
    fromBiome: string,
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ): AssetInfo | null {
    const key = `${fromBiome}_${direction.includes('corner') ? 'corner' : 'edge'}_${direction}`;
    return this.loadedAssets.get(key) || null;
  }

  /**
   * Genera tileset diverso y creativo
   */
  generateCreativeTileset(biomes: string[]): AssetInfo[] {
    const tileset: AssetInfo[] = [];

    for (const biome of biomes) {
      const biomeAssets = this.getAssetsByBiome(biome);

      // Añadir variedad seleccionando múltiples assets por bioma
      const selectedAssets = this.selectDiverseAssets(biomeAssets, 5); // 5 variantes por bioma
      tileset.push(...selectedAssets);
    }

    return tileset;
  }

  /**
   * Selecciona assets diversos para crear variación
   */
  private selectDiverseAssets(assets: AssetInfo[], count: number): AssetInfo[] {
    if (assets.length <= count) return assets;

    const selected: AssetInfo[] = [];
    const step = Math.floor(assets.length / count);

    for (let i = 0; i < count; i++) {
      const index = (i * step) % assets.length;
      selected.push(assets[index]);
    }

    return selected;
  }

  /**
   * Obtiene estadísticas de assets cargados
   */
  getAssetStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const [type, assets] of this.assetsByType) {
      stats[type] = assets.length;
    }

    return stats;
  }
}
