/**
 * Sistema principal de biomas que coordina la generación,
 * integración con zonas funcionales y renderizado
 */

import { TerrainGenerator } from './TerrainGenerator';
import { getBiomeDefinition, DEFAULT_WORLD_CONFIG } from './BiomeDefinitions';
import { BiomeType, type GeneratedWorld, type WorldGenConfig, type WorldLayer } from './types';
import type { Zone, MapElement } from '../types';
import { logAutopoiesis } from '../utils/logger';

export class BiomeSystem {
  private generator: TerrainGenerator;
  private currentWorld: GeneratedWorld | null = null;
  private config: WorldGenConfig;

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };
    this.generator = new TerrainGenerator(this.config);

    logAutopoiesis.info('🌍 BiomeSystem inicializado', {
      worldSize: `${this.config.width}x${this.config.height}`,
      enabledBiomes: this.config.biomes.enabled.length,
      seed: this.config.seed,
    });
  }

  /**
   * Genera un nuevo mundo con biomas
   */
  public generateWorld(): GeneratedWorld {
    logAutopoiesis.info('🚀 Generando nuevo mundo con biomas');

    this.currentWorld = this.generator.generateWorld();

    logAutopoiesis.info('✅ Mundo generado', {
      generationTime: `${this.currentWorld.metadata.generationTime.toFixed(2)}ms`,
      totalAssets: this.currentWorld.metadata.totalAssets,
      biomes: Object.keys(this.currentWorld.metadata.biomeDistribution).length,
    });

    return this.currentWorld;
  }

  /**
   * Obtiene el mundo actual (genera uno nuevo si no existe)
   */
  public getCurrentWorld(): GeneratedWorld {
    if (!this.currentWorld) {
      this.currentWorld = this.generateWorld();
    }
    return this.currentWorld;
  }

  /**
   * Integra las zonas funcionales del juego con el sistema de biomas
   * Adapta las zonas existentes al contexto del bioma donde se encuentran
   */
  public integrateGameplayZones(zones: Zone[]): Zone[] {
    const world = this.getCurrentWorld();
    const adaptedZones: Zone[] = [];

    for (const zone of zones) {
      const adaptedZone = this.adaptZoneToBiome(zone, world);
      adaptedZones.push(adaptedZone);
    }

    logAutopoiesis.info('🎯 Zonas funcionales integradas con biomas', {
      originalZones: zones.length,
      adaptedZones: adaptedZones.length,
    });

    return adaptedZones;
  }

  /**
   * Adapta una zona funcional al bioma donde se encuentra
   */
  private adaptZoneToBiome(zone: Zone, world: GeneratedWorld): Zone {
    // Convertir coordenadas pixel a tile
    const centerTileX = Math.floor((zone.bounds.x + zone.bounds.width / 2) / this.config.tileSize);
    const centerTileY = Math.floor((zone.bounds.y + zone.bounds.height / 2) / this.config.tileSize);

    // Obtener bioma dominante en la zona
    const dominantBiome = this.getDominantBiomeInArea(
      centerTileX,
      centerTileY,
      Math.ceil(zone.bounds.width / this.config.tileSize),
      Math.ceil(zone.bounds.height / this.config.tileSize),
      world.biomeMap
    );

    const biomeDef = getBiomeDefinition(dominantBiome);

    // Adaptar metadata de la zona según el bioma
    const adaptedZone: Zone = {
      ...zone,
      metadata: {
        ...zone.metadata,
        biome: dominantBiome,
        biomeColor: biomeDef.color,
        biomeName: biomeDef.name,
        environmentalEffects: this.calculateEnvironmentalEffects(zone.type, dominantBiome),
      },
    };

    // Ajustar color de la zona para que armonice con el bioma
    adaptedZone.color = this.blendZoneColorWithBiome(zone.color, biomeDef.color);

    return adaptedZone;
  }

  /**
   * Obtiene el bioma dominante en un área rectangular
   */
  private getDominantBiomeInArea(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    biomeMap: BiomeType[][]
  ): BiomeType {
    const biomeCounts = new Map<BiomeType, number>();

    const startX = Math.max(0, centerX - Math.floor(width / 2));
    const endX = Math.min(biomeMap[0].length - 1, centerX + Math.floor(width / 2));
    const startY = Math.max(0, centerY - Math.floor(height / 2));
    const endY = Math.min(biomeMap.length - 1, centerY + Math.floor(height / 2));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const biome = biomeMap[y][x];
        biomeCounts.set(biome, (biomeCounts.get(biome) || 0) + 1);
      }
    }

    // Encontrar el bioma más común
    let dominantBiome = BiomeType.GRASSLAND;
    let maxCount = 0;

    for (const [biome, count] of biomeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantBiome = biome;
      }
    }

    return dominantBiome;
  }

  /**
   * Calcula efectos ambientales basados en el tipo de zona y bioma
   */
  private calculateEnvironmentalEffects(
    zoneType: string,
    biome: BiomeType
  ): Record<string, number> {
    const baseEffects: Record<string, number> = {};

    // Efectos según bioma
    switch (biome) {
      case BiomeType.FOREST:
        baseEffects.tranquility = 15;
        baseEffects.humidity = 10;
        break;
      case BiomeType.MYSTICAL:
        baseEffects.energy = 20;
        baseEffects.mystery = 25;
        break;
      case BiomeType.WETLAND:
        baseEffects.humidity = 25;
        baseEffects.cool = 10;
        break;
      case BiomeType.MOUNTAINOUS:
        baseEffects.energy = 15;
        baseEffects.inspiration = 20;
        break;
      case BiomeType.VILLAGE:
        baseEffects.safety = 20;
        baseEffects.comfort = 15;
        break;
    }

    // Modificadores según tipo de zona
    const zoneMultipliers: Record<string, number> = {
      food: 1.2,
      rest: 1.5,
      play: 1.1,
      social: 1.3,
      work: 0.8,
      comfort: 1.4,
    };

    const multiplier = zoneMultipliers[zoneType] || 1.0;

    // Aplicar multiplicador
    for (const effect in baseEffects) {
      baseEffects[effect] *= multiplier;
    }

    return baseEffects;
  }

  /**
   * Mezcla el color de una zona con el color del bioma
   */
  private blendZoneColorWithBiome(zoneColor: string, biomeColor: string): string {
    // Extraer valores RGBA
    const zoneRgba = this.parseRgbaColor(zoneColor);
    const biomeRgb = this.parseHexColor(biomeColor);

    if (!zoneRgba || !biomeRgb) return zoneColor;

    // Mezclar colores (70% zona original, 30% bioma)
    const blendedR = Math.round(zoneRgba.r * 0.7 + biomeRgb.r * 0.3);
    const blendedG = Math.round(zoneRgba.g * 0.7 + biomeRgb.g * 0.3);
    const blendedB = Math.round(zoneRgba.b * 0.7 + biomeRgb.b * 0.3);

    return `rgba(${blendedR}, ${blendedG}, ${blendedB}, ${zoneRgba.a})`;
  }

  /**
   * Parsea un color RGBA string
   */
  private parseRgbaColor(color: string): { r: number; g: number; b: number; a: number } | null {
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(color);
    if (!match) return null;

    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  }

  /**
   * Parsea un color hex
   */
  private parseHexColor(hex: string): { r: number; g: number; b: number } | null {
    const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return null;

    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16),
    };
  }

  /**
   * Genera elementos de mapa adaptados a los biomas
   */
  public generateBiomeAwareMapElements(): MapElement[] {
    const world = this.getCurrentWorld();
    const elements: MapElement[] = [];

    // Recorrer las capas de assets y convertir algunos a MapElements interactivos
    for (const layer of world.layers) {
      if (layer.name === 'props' || layer.name === 'structures') {
        for (const tile of layer.tiles) {
          // Convertir algunos assets en elementos interactivos
          if (this.shouldBeInteractive(tile.asset)) {
            const element: MapElement = {
              id: `biome_${layer.name}_${elements.length}`,
              type: this.getElementTypeFromAsset(tile.asset),
              position: { x: tile.x, y: tile.y },
              size: {
                width: this.config.tileSize,
                height: this.config.tileSize,
              },
              color: '#ffffff',
              metadata: {
                assetId: tile.asset,
                interactive: true,
                biomeGenerated: true,
              },
            };

            elements.push(element);
          }
        }
      }
    }

    logAutopoiesis.info('🎮 Elementos interactivos generados desde biomas', {
      totalElements: elements.length,
    });

    return elements;
  }

  /**
   * Determina si un asset debería ser un elemento interactivo
   */
  private shouldBeInteractive(asset: string): boolean {
    const interactiveAssets = [
      'flowers_white.png',
      'flowers_red.png',
      'Well_Hay_1.png',
      'House.png',
      'tree_idol_',
    ];

    return interactiveAssets.some(pattern => asset.includes(pattern));
  }

  /**
   * Obtiene el tipo de elemento basado en el asset
   */
  private getElementTypeFromAsset(
    asset: string
  ): 'food_zone' | 'social_zone' | 'comfort_zone' | 'decoration' {
    if (asset.includes('flower')) return 'food_zone';
    if (asset.includes('Well') || asset.includes('House')) return 'social_zone';
    if (asset.includes('tree_idol')) return 'comfort_zone';
    return 'decoration';
  }

  /**
   * Obtiene información de bioma en una posición específica
   */
  public getBiomeAtPosition(x: number, y: number): BiomeType | null {
    if (!this.currentWorld) return null;

    const tileX = Math.floor(x / this.config.tileSize);
    const tileY = Math.floor(y / this.config.tileSize);

    if (tileX < 0 || tileX >= this.config.width || tileY < 0 || tileY >= this.config.height) {
      return null;
    }

    return this.currentWorld.biomeMap[tileY][tileX];
  }

  /**
   * Obtiene las capas de renderizado para Phaser
   */
  public getRenderLayers(): WorldLayer[] {
    const world = this.getCurrentWorld();
    return world.layers;
  }

  /**
   * Obtiene estadísticas del mundo actual
   */
  public getWorldStats(): {
    biomeDistribution: Record<BiomeType, number>;
    totalAssets: number;
    generationTime: number;
    worldSize: string;
  } {
    const world = this.getCurrentWorld();

    return {
      biomeDistribution: world.metadata.biomeDistribution,
      totalAssets: world.metadata.totalAssets,
      generationTime: world.metadata.generationTime,
      worldSize: `${this.config.width}x${this.config.height}`,
    };
  }

  /**
   * Regenera el mundo con nueva configuración
   */
  public regenerateWorld(newConfig: Partial<WorldGenConfig> = {}): GeneratedWorld {
    this.config = { ...this.config, ...newConfig };
    this.generator = new TerrainGenerator(this.config);

    logAutopoiesis.info('🔄 Regenerando mundo con nueva configuración', newConfig);

    return this.generateWorld();
  }

  /**
   * Exporta el mundo actual para debugging o serialización
   */
  public exportWorld(): GeneratedWorld | null {
    return this.currentWorld;
  }
}
