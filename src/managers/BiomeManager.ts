/**
 * Biome Manager - Sistema simplificado de gestión de biomas
 * Extraído de WorldRenderer para separar responsabilidades
 */

import { BiomeType } from "../world/types";

export interface BiomeConfig {
  name: string;
  colorTint: number;
  decorationDensity: number;
  wildlifeDensity: number;
  preferredAssets: string[];
  musicTrack: string;
  ambientSound?: string;
}

export class BiomeManager {
  private static readonly BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
    [BiomeType.GRASSLAND]: {
      name: "Praderas",
      colorTint: 0x90ee90,
      decorationDensity: 0.3,
      wildlifeDensity: 0.2,
      preferredAssets: ["tree", "grass", "flower"],
      musicTrack: "grassland_ambient",
    },
    [BiomeType.MYSTICAL]: {
      name: "Místico",
      colorTint: 0x9370db,
      decorationDensity: 0.4,
      wildlifeDensity: 0.25,
      preferredAssets: ["mystical_tree", "crystal", "rune"],
      musicTrack: "mystical_ambient",
    },
    [BiomeType.FOREST]: {
      name: "Bosque",
      colorTint: 0x228b22,
      decorationDensity: 0.5,
      wildlifeDensity: 0.3,
      preferredAssets: ["tree", "shrub", "log"],
      musicTrack: "forest_ambient",
    },
    [BiomeType.WETLAND]: {
      name: "Humedal",
      colorTint: 0x4682b4,
      decorationDensity: 0.25,
      wildlifeDensity: 0.15,
      preferredAssets: ["water", "reed", "lily"],
      musicTrack: "wetland_ambient",
    },
    [BiomeType.MOUNTAINOUS]: {
      name: "Montañoso",
      colorTint: 0x708090,
      decorationDensity: 0.2,
      wildlifeDensity: 0.1,
      preferredAssets: ["rock", "stone", "cliff"],
      musicTrack: "mountain_ambient",
    },
    [BiomeType.VILLAGE]: {
      name: "Aldea",
      colorTint: 0xd2b48c,
      decorationDensity: 0.4,
      wildlifeDensity: 0.05,
      preferredAssets: ["house", "path", "fence"],
      musicTrack: "village_ambient",
    },
  };

  /**
   * Determina el bioma basado en la posición en el mundo
   */
  public static determineBiome(
    x: number,
    y: number,
    worldWidth: number,
    worldHeight: number,
  ): BiomeType {
    // Lógica simple de determinación de bioma basada en posición
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;

    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2),
    );

    const normalizedDistance =
      distanceFromCenter / Math.sqrt(centerX * centerX + centerY * centerY);

    // Determinar bioma basado en la distancia del centro y coordenadas
    if (normalizedDistance < 0.2) {
      return BiomeType.VILLAGE;
    } else if (x < worldWidth * 0.3 && y < worldHeight * 0.3) {
      return BiomeType.WETLAND;
    } else if (x > worldWidth * 0.7 || y > worldHeight * 0.7) {
      return BiomeType.MOUNTAINOUS;
    } else if (normalizedDistance > 0.6) {
      return BiomeType.MYSTICAL;
    } else if (y < worldHeight * 0.5) {
      return BiomeType.GRASSLAND;
    } else {
      return BiomeType.FOREST;
    }
  }

  /**
   * Obtiene la configuración de un bioma
   */
  public static getBiomeConfig(biome: BiomeType): BiomeConfig {
    return BiomeManager.BIOME_CONFIGS[biome];
  }

  /**
   * Obtiene todas las configuraciones de biomas
   */
  public static getAllBiomeConfigs(): Record<BiomeType, BiomeConfig> {
    return { ...BiomeManager.BIOME_CONFIGS };
  }

  /**
   * Obtiene el color tint de un bioma
   */
  public static getBiomeColorTint(biome: BiomeType): number {
    return BiomeManager.BIOME_CONFIGS[biome].colorTint;
  }

  /**
   * Aplica efectos de bioma a una entidad - Legacy method for EntityRenderer compatibility
   */
  public static applyBiomeEffects(
    sprite: Phaser.GameObjects.Sprite,
    biome: BiomeType,
  ): void {
    if (!sprite) return;

    const config = BiomeManager.BIOME_CONFIGS[biome];
    if (config && config.colorTint) {
      sprite.setTint(config.colorTint);
    }
  }
}
