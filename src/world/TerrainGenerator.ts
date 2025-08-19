/**
 * Generador principal de terreno usando biomas y ruido procedural
 */

import { NoiseGenerator, NoiseProcessor } from './NoiseUtils';
import {
  getBiomeDefinition,
  calculateBiomeFitness,
  canBiomeSpawn,
  DEFAULT_WORLD_CONFIG,
} from './BiomeDefinitions';
import { BiomeType } from './types';
import type {
  WorldGenConfig,
  GeneratedWorld,
  TerrainTile,
  WorldLayer,
  BiomeDefinition,
} from './types';
import { logAutopoiesis } from '../utils/logger';

export class TerrainGenerator {
  private noiseGen: NoiseGenerator;
  private config: WorldGenConfig;

  constructor(config: WorldGenConfig = DEFAULT_WORLD_CONFIG) {
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };
    this.noiseGen = new NoiseGenerator(this.config.seed);
  }

  /**
   * Genera un mundo completo con biomas
   */
  public generateWorld(): GeneratedWorld {
    const startTime = performance.now();

    logAutopoiesis.info('🌍 Iniciando generación de mundo', {
      size: `${this.config.width}x${this.config.height}`,
      seed: this.config.seed,
      biomes: this.config.biomes.enabled.length,
    });

    // 1. Generar mapas de ruido base
    const temperatureMap = this.generateNoiseMap(this.config.noise.temperature);
    const moistureMap = this.generateNoiseMap(this.config.noise.moisture);
    const elevationMap = this.generateNoiseMap(this.config.noise.elevation);

    // 2. Asignar biomas basado en condiciones
    const biomeMap = this.assignBiomes(
      temperatureMap,
      moistureMap,
      elevationMap
    );

    // 3. Aplicar spawn forzado de biomas
    this.applyForcedSpawns(biomeMap);

    // 4. Suavizar transiciones entre biomas
    const smoothedBiomeMap = this.smoothBiomeTransitions(biomeMap);

    // 5. Generar tiles de terreno detallado
    const terrain = this.generateDetailedTerrain(
      smoothedBiomeMap,
      temperatureMap,
      moistureMap,
      elevationMap
    );

    // 6. Generar capas de assets
    const layers = this.generateAssetLayers(terrain);

    // 7. Calcular metadata
    const biomeDistribution = this.calculateBiomeDistribution(smoothedBiomeMap);
    const totalAssets = layers.reduce(
      (sum, layer) => sum + layer.tiles.length,
      0
    );

    const generationTime = performance.now() - startTime;

    const world: GeneratedWorld = {
      config: this.config,
      terrain,
      layers,
      biomeMap: smoothedBiomeMap,
      metadata: {
        generationTime,
        biomeDistribution,
        totalAssets,
        version: '1.0.0',
      },
    };

    logAutopoiesis.info('✅ Mundo generado exitosamente', {
      generationTime: `${generationTime.toFixed(2)}ms`,
      totalAssets,
      biomeDistribution,
    });

    return world;
  }

  /**
   * Genera un mapa de ruido 2D
   */
  private generateNoiseMap(noiseConfig: any): number[][] {
    const map = Array(this.config.height)
      .fill(0)
      .map(() => Array(this.config.width).fill(0));

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        map[y][x] = this.noiseGen.fractalNoise(x, y, {
          ...noiseConfig,
          seed: this.config.seed,
        });
      }
    }

    return NoiseProcessor.normalize(map);
  }

  /**
   * Asigna biomas basado en condiciones ambientales
   */
  private assignBiomes(
    temperatureMap: number[][],
    moistureMap: number[][],
    elevationMap: number[][]
  ): BiomeType[][] {
    const biomeMap: BiomeType[][] = Array(this.config.height)
      .fill(0)
      .map(() => Array(this.config.width).fill(BiomeType.GRASSLAND));

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const temperature = temperatureMap[y][x];
        const moisture = moistureMap[y][x];
        const elevation = elevationMap[y][x];

        let bestBiome = BiomeType.GRASSLAND;
        let bestFitness = 0;

        for (const biome of this.config.biomes.enabled) {
          if (canBiomeSpawn(biome, temperature, moisture, elevation)) {
            const fitness = calculateBiomeFitness(
              biome,
              temperature,
              moisture,
              elevation
            );
            if (fitness > bestFitness) {
              bestFitness = fitness;
              bestBiome = biome;
            }
          }
        }

        biomeMap[y][x] = bestBiome;
      }
    }

    return biomeMap;
  }

  /**
   * Aplica spawns forzados de biomas en ubicaciones específicas
   */
  private applyForcedSpawns(biomeMap: BiomeType[][]): void {
    if (!this.config.biomes.forceSpawn) return;

    for (const spawn of this.config.biomes.forceSpawn) {
      const { biome, position, radius } = spawn;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = position.x + dx;
          const y = position.y + dy;

          if (
            x >= 0 &&
            x < this.config.width &&
            y >= 0 &&
            y < this.config.height
          ) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
              // Aplicar con fading hacia los bordes
              const strength = 1 - distance / radius;
              if (Math.random() < strength) {
                biomeMap[y][x] = biome;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Suaviza las transiciones entre biomas
   */
  private smoothBiomeTransitions(biomeMap: BiomeType[][]): BiomeType[][] {
    const smoothed = biomeMap.map(row => [...row]);

    // Aplicar filtro de mediana para reducir ruido
    for (let y = 1; y < this.config.height - 1; y++) {
      for (let x = 1; x < this.config.width - 1; x++) {
        const neighbors = [
          biomeMap[y - 1][x - 1],
          biomeMap[y - 1][x],
          biomeMap[y - 1][x + 1],
          biomeMap[y][x - 1],
          biomeMap[y][x],
          biomeMap[y][x + 1],
          biomeMap[y + 1][x - 1],
          biomeMap[y + 1][x],
          biomeMap[y + 1][x + 1],
        ];

        // Contar frecuencia de cada bioma
        const counts = new Map<BiomeType, number>();
        for (const biome of neighbors) {
          counts.set(biome, (counts.get(biome) || 0) + 1);
        }

        // Usar el bioma más común si hay suficiente consenso
        let maxCount = 0;
        let dominantBiome = biomeMap[y][x];

        for (const [biome, count] of counts) {
          if (count > maxCount && count >= 5) {
            // Al menos 5 de 9 neighbors
            maxCount = count;
            dominantBiome = biome;
          }
        }

        smoothed[y][x] = dominantBiome;
      }
    }

    return smoothed;
  }

  /**
   * Genera tiles de terreno detallado
   */
  private generateDetailedTerrain(
    biomeMap: BiomeType[][],
    temperatureMap: number[][],
    moistureMap: number[][],
    elevationMap: number[][]
  ): TerrainTile[][] {
    const terrain: TerrainTile[][] = Array(this.config.height)
      .fill(0)
      .map(() => Array(this.config.width).fill(null));

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const biome = biomeMap[y][x];
        const temperature = temperatureMap[y][x];
        const moisture = moistureMap[y][x];
        const elevation = elevationMap[y][x];

        // Calcular strength del bioma (qué tan "puro" es)
        const biomeStrength = this.calculateBiomeStrength(
          x,
          y,
          biome,
          biomeMap
        );

        // Generar assets para este tile
        const assets = this.generateTileAssets(biome, biomeStrength, x, y);

        terrain[y][x] = {
          x,
          y,
          biome,
          biomeStrength,
          temperature,
          moisture,
          elevation,
          assets,
        };
      }
    }

    return terrain;
  }

  /**
   * Calcula qué tan "puro" es un bioma en una ubicación
   */
  private calculateBiomeStrength(
    x: number,
    y: number,
    biome: BiomeType,
    biomeMap: BiomeType[][]
  ): number {
    let sameCount = 0;
    let totalCount = 0;

    // Verificar vecindario 3x3
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < this.config.width &&
          ny >= 0 &&
          ny < this.config.height
        ) {
          totalCount++;
          if (biomeMap[ny][nx] === biome) {
            sameCount++;
          }
        }
      }
    }

    return totalCount > 0 ? sameCount / totalCount : 1;
  }

  /**
   * Genera assets para un tile específico
   */
  private generateTileAssets(
    biome: BiomeType,
    strength: number,
    x: number,
    y: number
  ): TerrainTile['assets'] {
    const biomeDef = getBiomeDefinition(biome);
    const assets: TerrainTile['assets'] = {
      terrain: '',
      vegetation: [],
      props: [],
      structures: [],
      decals: [],
    };

    // Seleccionar terreno base
    const terrainAsset = this.selectAsset(
      biomeDef.assets.terrain.primary,
      biomeDef.assets.terrain.weight
    );
    assets.terrain = terrainAsset || 'cesped1.png'; // fallback

    // Generar vegetación basada en densidad y clustering
    if (Math.random() < biomeDef.assets.trees.density * strength) {
      const treeAsset = this.selectTreeAsset(biomeDef, x, y);
      if (treeAsset) {
        assets.vegetation.push(treeAsset);
      }
    }

    // Agregar shrubs
    if (Math.random() < biomeDef.assets.shrubs.density * strength) {
      const shrubAsset = this.selectAsset(biomeDef.assets.shrubs.assets);
      if (shrubAsset) {
        assets.vegetation.push(shrubAsset);
      }
    }

    // Agregar props
    if (Math.random() < biomeDef.assets.props.density * strength) {
      const propAsset = this.selectAsset([
        ...biomeDef.assets.props.common,
        ...(Math.random() < 0.1 ? biomeDef.assets.props.rare : []),
      ]);
      if (propAsset) {
        assets.props.push(propAsset);
      }
    }

    // Agregar estructuras (solo para algunos biomas)
    if (
      biomeDef.assets.structures &&
      Math.random() < biomeDef.assets.structures.density * strength
    ) {
      const structureAsset = this.selectAsset(
        biomeDef.assets.structures.assets
      );
      if (structureAsset) {
        assets.structures.push(structureAsset);
      }
    }

    // Agregar decals
    if (Math.random() < biomeDef.assets.decals.density) {
      const decalAsset = this.selectAsset(biomeDef.assets.decals.assets);
      if (decalAsset) {
        assets.decals.push(decalAsset);
      }
    }

    return assets;
  }

  /**
   * Selecciona un asset de una lista con pesos opcionales
   */
  private selectAsset(assets: string[], weights?: number[]): string | null {
    if (assets.length === 0) return null;

    if (!weights || weights.length !== assets.length) {
      return assets[Math.floor(Math.random() * assets.length)];
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < assets.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return assets[i];
      }
    }

    return assets[assets.length - 1];
  }

  /**
   * Selecciona un árbol considerando clustering
   */
  private selectTreeAsset(
    biomeDef: BiomeDefinition,
    x: number,
    y: number
  ): string | null {
    const { clustering } = biomeDef.assets.trees;

    // Usar ruido para determinar si es una zona de clustering
    const clusterNoise = this.noiseGen.perlin2D(x * 0.1, y * 0.1);
    const inCluster = clusterNoise > 0.5 - clustering * 0.3;

    let treeAssets = biomeDef.assets.trees.primary;

    // En clusters, usar más variety; fuera de clusters, usar árboles raros ocasionalmente
    if (!inCluster && Math.random() < 0.05) {
      treeAssets = [...treeAssets, ...biomeDef.assets.trees.rare];
    }

    return this.selectAsset(treeAssets);
  }

  /**
   * Genera capas de renderizado para assets
   */
  private generateAssetLayers(terrain: TerrainTile[][]): WorldLayer[] {
    const layers: WorldLayer[] = [
      { name: 'terrain', zIndex: 0, tiles: [] },
      { name: 'decals', zIndex: 1, tiles: [] },
      { name: 'vegetation', zIndex: 2, tiles: [] },
      { name: 'props', zIndex: 3, tiles: [] },
      { name: 'structures', zIndex: 4, tiles: [] },
    ];

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const tile = terrain[y][x];
        const pixelX = x * this.config.tileSize;
        const pixelY = y * this.config.tileSize;

        // Terreno base
        if (tile.assets.terrain) {
          layers[0].tiles.push({
            x: pixelX,
            y: pixelY,
            asset: `assets/terrain/base/${tile.assets.terrain}`,
          });
        }

        // Decals
        for (const decal of tile.assets.decals) {
          layers[1].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.5,
            y: pixelY + Math.random() * this.config.tileSize * 0.5,
            asset: `assets/decals/${decal}`,
            alpha: 0.7,
          });
        }

        // Vegetación
        for (const veg of tile.assets.vegetation) {
          layers[2].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.7,
            y: pixelY + Math.random() * this.config.tileSize * 0.7,
            asset: `assets/foliage/trees/${veg}`,
          });
        }

        // Props
        for (const prop of tile.assets.props) {
          layers[3].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.8,
            y: pixelY + Math.random() * this.config.tileSize * 0.8,
            asset: `assets/animated_entities/${prop}`,
          });
        }

        // Estructuras
        for (const structure of tile.assets.structures) {
          layers[4].tiles.push({
            x: pixelX,
            y: pixelY,
            asset: `assets/structures/estructuras_completas/${structure}`,
          });
        }
      }
    }

    return layers;
  }

  /**
   * Calcula la distribución de biomas en el mapa
   */
  private calculateBiomeDistribution(
    biomeMap: BiomeType[][]
  ): Record<BiomeType, number> {
    const distribution: Record<BiomeType, number> = {} as any;
    const total = this.config.width * this.config.height;

    // Inicializar contadores
    for (const biome of this.config.biomes.enabled) {
      distribution[biome] = 0;
    }

    // Contar tiles por bioma
    for (const row of biomeMap) {
      for (const biome of row) {
        distribution[biome]++;
      }
    }

    // Convertir a porcentajes
    for (const biome in distribution) {
      distribution[biome as BiomeType] =
        (distribution[biome as BiomeType] / total) * 100;
    }

    return distribution;
  }
}
