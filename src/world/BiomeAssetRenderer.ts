/**
 * BiomeAssetRenderer - Sistema creativo simplificado que carga assets reales
 */

import Phaser from 'phaser';
import { BiomeType } from './types';
import type { GeneratedWorld } from './types';

interface BiomeAssetConfig {
  grassVariants: string[];
  waterTiles: string[];
  roadTiles: string[];
  autotiles: string[];
}

/**
 * Renderizador que usa assets reales de forma creativa
 */
export class BiomeAssetRenderer {
  private scene: Phaser.Scene;
  private assetConfig: BiomeAssetConfig;
  private loadedAssets: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.assetConfig = this.createAssetConfig();
  }

  /**
   * Crea configuración de assets organizados
   */
  private createAssetConfig(): BiomeAssetConfig {
    // Assets de césped (31 variaciones)
    const grassVariants: string[] = [];
    for (let i = 1; i <= 31; i++) {
      grassVariants.push(`assets/terrain/base/cesped${i}.png`);
    }

    // Assets de agua organizados
    const waterTiles = [
      'assets/water/Water_Middle.png',
      'assets/water/tile_01_01.png',
      'assets/water/tile_02_02.png',
      'assets/water/tile_03_03.png',
      'assets/water/tile_04_04.png',
      'assets/water/tile_05_05.png'
    ];

    // Assets de roads
    const roadTiles = [
      'assets/roads/road_path_straight_h.png',
      'assets/roads/road_path_straight_v.png',
      'assets/roads/road_path_curve_ne.png',
      'assets/roads/road_path_curve_nw.png',
      'assets/roads/road_path_cross.png'
    ];

    // Autotiles para transiciones
    const autotiles = [
      'assets/terrain/autotiles/grass_edge_n.png',
      'assets/terrain/autotiles/grass_edge_s.png',
      'assets/terrain/autotiles/water_edge_n.png',
      'assets/terrain/autotiles/water_corner_ne.png'
    ];

    return {
      grassVariants,
      waterTiles,
      roadTiles,
      autotiles
    };
  }

  /**
   * Carga todos los assets de forma inteligente
   */
  async loadAssets(): Promise<void> {
    console.log('🎨 Cargando assets creativamente...');
    
    const allAssets = [
      ...this.assetConfig.grassVariants,
      ...this.assetConfig.waterTiles,
      ...this.assetConfig.roadTiles,
      ...this.assetConfig.autotiles
    ];

    // Cargar assets únicos
    const uniqueAssets = [...new Set(allAssets)];
    
    for (let i = 0; i < uniqueAssets.length; i++) {
      const assetPath = uniqueAssets[i];
      const key = this.pathToKey(assetPath);
      
      if (!this.scene.textures.exists(key)) {
        this.scene.load.image(key, assetPath);
      }
    }

    return new Promise((resolve) => {
      this.scene.load.on('complete', () => {
        console.log(`✅ Cargados ${uniqueAssets.length} assets únicos`);
        resolve();
      });

      this.scene.load.start();
    });
  }

  /**
   * Convierte path a key único
   */
  private pathToKey(path: string): string {
    return path.replace(/[\/\.]/g, '_').replace('assets_', '');
  }

  /**
   * Renderiza mundo usando assets reales
   */
  async renderWorldWithRealAssets(world: GeneratedWorld): Promise<void> {
    console.log('🌍 Renderizando mundo con assets reales...');

    // 1. Cargar assets
    await this.loadAssets();

    // 2. Crear sprites usando assets reales
    this.createDiverseSprites(world);

    console.log('✨ Mundo renderizado con diversidad creativa');
  }

  /**
   * Crea sprites diversos usando assets reales
   */
  private createDiverseSprites(world: GeneratedWorld): void {
    const tileSize = 32;
    const spriteContainer = this.scene.add.container(0, 0);

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const biome = tile.biome;
        
        // Seleccionar asset creativo
        const assetKey = this.selectCreativeAsset(biome, x, y, tile.biomeStrength);
        
        if (assetKey && this.scene.textures.exists(assetKey)) {
          const sprite = this.scene.add.image(
            x * tileSize + tileSize / 2,
            y * tileSize + tileSize / 2,
            assetKey
          );
          
          sprite.setDisplaySize(tileSize, tileSize);
          
          // Aplicar variaciones creativas
          this.applyCreativeVariations(sprite, biome, tile.biomeStrength);
          
          spriteContainer.add(sprite);
        }
      }
    }

    // Aplicar autotiles para transiciones
    this.applyCreativeAutotiles(world, spriteContainer);
  }

  /**
   * Selecciona asset de forma creativa
   */
  private selectCreativeAsset(biome: BiomeType, x: number, y: number, strength: number): string {
    // Usar posición y strength para crear variación natural
    const seed = (x * 73 + y * 137 + Math.floor(strength * 100)) % 100;

    switch (biome) {
      case BiomeType.GRASSLAND:
        // Usar diferentes variaciones de césped
        const grassIndex = seed % this.assetConfig.grassVariants.length;
        return this.pathToKey(this.assetConfig.grassVariants[grassIndex]);

      case BiomeType.WETLAND:
        // Usar tiles de agua variados
        const waterIndex = seed % this.assetConfig.waterTiles.length;
        return this.pathToKey(this.assetConfig.waterTiles[waterIndex]);

      case BiomeType.VILLAGE:
        // Usar roads de forma inteligente
        const roadIndex = seed % this.assetConfig.roadTiles.length;
        return this.pathToKey(this.assetConfig.roadTiles[roadIndex]);

      case BiomeType.FOREST:
        // Césped más denso para bosques
        const forestIndex = Math.floor(seed / 2) % this.assetConfig.grassVariants.length;
        return this.pathToKey(this.assetConfig.grassVariants[forestIndex]);

      case BiomeType.MOUNTAINOUS:
        // Variaciones más rocosas
        const mountainIndex = (15 + (seed % 16)) % this.assetConfig.grassVariants.length;
        return this.pathToKey(this.assetConfig.grassVariants[mountainIndex]);

      case BiomeType.MYSTICAL:
        // Combinación especial
        const mysticalIndex = (seed % 2 === 0) 
          ? (seed % 10) % this.assetConfig.grassVariants.length
          : (seed % 5) % this.assetConfig.grassVariants.length;
        return this.pathToKey(this.assetConfig.grassVariants[mysticalIndex]);

      default:
        return this.pathToKey(this.assetConfig.grassVariants[0]);
    }
  }

  /**
   * Aplica variaciones creativas a sprites
   */
  private applyCreativeVariations(sprite: Phaser.GameObjects.Image, biome: BiomeType, strength: number): void {
    // Variaciones de tinte basadas en bioma
    switch (biome) {
      case BiomeType.GRASSLAND:
        sprite.setTint(0x90EE90); // Verde claro
        break;

      case BiomeType.FOREST:
        sprite.setTint(0x228B22); // Verde bosque
        break;

      case BiomeType.WETLAND:
        sprite.setTint(0x4682B4); // Azul acero
        break;

      case BiomeType.MOUNTAINOUS:
        sprite.setTint(0x8B7355); // Marrón montaña
        break;

      case BiomeType.MYSTICAL:
        sprite.setTint(0xDDA0DD); // Púrpura místico
        break;

      case BiomeType.VILLAGE:
        sprite.setTint(0xD2B48C); // Tan (arena)
        break;
    }

    // Variaciones de escala basadas en strength
    const scaleVariation = 0.85 + (strength * 0.3); // 0.85 a 1.15
    sprite.setScale(scaleVariation);

    // Rotación sutil para variedad
    const rotation = (strength - 0.5) * 0.2; // -0.1 a 0.1 radianes
    sprite.setRotation(rotation);
  }

  /**
   * Aplica autotiles creativos para transiciones
   */
  private applyCreativeAutotiles(world: GeneratedWorld, container: Phaser.GameObjects.Container): void {
    const tileSize = 32;

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const currentBiome = world.terrain[y][x].biome;
        
        // Detectar transiciones en vecinos
        const hasTransition = this.detectTransitions(world, x, y, currentBiome);
        
        if (hasTransition) {
          // Aplicar autotile de transición
          const autotileKey = this.selectAutotile(currentBiome);
          
          if (autotileKey && this.scene.textures.exists(autotileKey)) {
            const autotileSprite = this.scene.add.image(
              x * tileSize + tileSize / 2,
              y * tileSize + tileSize / 2,
              autotileKey
            );
            
            autotileSprite.setDisplaySize(tileSize, tileSize);
            autotileSprite.setAlpha(0.7); // Semi-transparente para mezcla
            
            container.add(autotileSprite);
          }
        }
      }
    }
  }

  /**
   * Detecta transiciones entre biomas
   */
  private detectTransitions(world: GeneratedWorld, x: number, y: number, currentBiome: BiomeType): boolean {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // N, S, E, W
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (ny >= 0 && ny < world.terrain.length && nx >= 0 && nx < world.terrain[ny].length) {
        const neighborBiome = world.terrain[ny][nx].biome;
        if (neighborBiome !== currentBiome) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Selecciona autotile apropiado para transición
   */
  private selectAutotile(biome: BiomeType): string {
    switch (biome) {
      case BiomeType.GRASSLAND:
        return this.pathToKey(this.assetConfig.autotiles[0]); // grass_edge_n
      case BiomeType.WETLAND:
        return this.pathToKey(this.assetConfig.autotiles[2]); // water_edge_n
      default:
        return this.pathToKey(this.assetConfig.autotiles[0]);
    }
  }

  /**
   * Limpia recursos
   */
  cleanup(): void {
    this.loadedAssets.clear();
  }
}
