/**
 * Definiciones mejoradas de biomas para crear un mundo más vibrante
 * Incluye estructuras, ruinas, y vida animal para cada bioma
 */

import { BIOME_DEFINITIONS } from "./BiomeDefinitions";
import { BiomeType, type BiomeDefinition } from "./types";

export interface EnhancedBiomeFeatures {
  ruins?: {
    types: string[];
    density: number;
    spacing: number;
  };
  structures?: {
    types: string[];
    density: number;
    spacing: number;
  };
  wildlife?: {
    animals: string[];
    density: number;
    spawnProbability: number;
  };
  specialFeatures?: {
    name: string;
    assets: string[];
    density: number;
    conditions?: string[];
  }[];
}

/**
 * Biomas mejorados con estructuras, ruinas y vida animal
 */
export const ENHANCED_BIOME_FEATURES: Record<BiomeType, EnhancedBiomeFeatures> =
  {
    [BiomeType.GRASSLAND]: {
      ruins: {
        types: [
          "sand_ruins1.png",
          "sand_ruins2.png",
          "brown_ruins1.png",
          "brown_ruins2.png",
        ],
        density: 0.05,
        spacing: 8,
      },
      structures: {
        types: ["Well_Hay_1.png", "Fences.png"],
        density: 0.02,
        spacing: 12,
      },
      wildlife: {
        animals: ["chicken", "sheep", "pig"],
        density: 0.1,
        spawnProbability: 0.3,
      },
      specialFeatures: [
        {
          name: "flower_meadows",
          assets: ["flowers_white.png", "flowers_red.png"],
          density: 0.15,
        },
        {
          name: "campfire_sites",
          assets: ["campfire.png"],
          density: 0.02,
        },
      ],
    },

    [BiomeType.FOREST]: {
      ruins: {
        types: ["brown_ruins3.png", "brown_ruins4.png", "brown_ruins5.png"],
        density: 0.08,
        spacing: 6,
      },
      structures: {
        types: ["House.png", "House_Hay_1.png"],
        density: 0.01,
        spacing: 15,
      },
      wildlife: {
        animals: ["boar", "chicken", "horse"],
        density: 0.15,
        spawnProbability: 0.4,
      },
      specialFeatures: [
        {
          name: "ancient_groves",
          assets: ["brown_ruins1.png", "brown_ruins2.png"],
          density: 0.05,
          conditions: ["dense_forest"],
        },
        {
          name: "mushroom_circles",
          assets: [], // Usar assets de mushrooms del directorio
          density: 0.1,
        },
      ],
    },

    [BiomeType.MYSTICAL]: {
      ruins: {
        types: [
          "blue-gray_ruins1.png",
          "blue-gray_ruins2.png",
          "blue-gray_ruins3.png",
          "blue-gray_ruins4.png",
          "blue-gray_ruins5.png",
        ],
        density: 0.12,
        spacing: 4,
      },
      structures: {
        types: ["House_Hay_4_Purple.png"],
        density: 0.005,
        spacing: 20,
      },
      wildlife: {
        animals: ["horse"], // Solo caballos místicos
        density: 0.05,
        spawnProbability: 0.2,
      },
      specialFeatures: [
        {
          name: "mystical_circles",
          assets: ["blue-gray_ruins1.png", "blue-gray_ruins5.png"],
          density: 0.08,
        },
        {
          name: "energy_nodes",
          assets: ["checkpoint_flag_idle1.png"],
          density: 0.03,
        },
      ],
    },

    [BiomeType.WETLAND]: {
      ruins: {
        types: ["water_ruins1.png", "water_ruins2.png", "water_ruins3.png"],
        density: 0.1,
        spacing: 5,
      },
      structures: {
        types: ["Well_Hay_1.png"],
        density: 0.01,
        spacing: 18,
      },
      wildlife: {
        animals: ["pig", "chicken"],
        density: 0.12,
        spawnProbability: 0.35,
      },
      specialFeatures: [
        {
          name: "ancient_docks",
          assets: ["water_ruins4.png", "water_ruins5.png"],
          density: 0.04,
          conditions: ["near_water"],
        },
        {
          name: "swamp_lights",
          assets: ["checkpoint_flag_idle1.png"],
          density: 0.02,
        },
      ],
    },

    [BiomeType.MOUNTAINOUS]: {
      ruins: {
        types: [
          "snow_ruins1.png",
          "snow_ruins2.png",
          "white_ruins1.png",
          "white_ruins2.png",
          "white_ruins3.png",
        ],
        density: 0.15,
        spacing: 3,
      },
      structures: {
        types: ["House_Hay_2.png", "House_Hay_3.png"],
        density: 0.008,
        spacing: 25,
      },
      wildlife: {
        animals: ["horse", "sheep"], // Animales resistentes al frío
        density: 0.08,
        spawnProbability: 0.25,
      },
      specialFeatures: [
        {
          name: "mountain_peaks",
          assets: ["snow_ruins4.png", "snow_ruins5.png"],
          density: 0.06,
          conditions: ["high_elevation"],
        },
        {
          name: "ancient_observatories",
          assets: ["white_ruins4.png", "white_ruins5.png"],
          density: 0.03,
        },
      ],
    },

    [BiomeType.VILLAGE]: {
      ruins: {
        types: ["yellow_ruins1.png", "yellow_ruins2.png"],
        density: 0.03,
        spacing: 10,
      },
      structures: {
        types: [
          "House.png",
          "House_Hay_1.png",
          "House_Hay_2.png",
          "House_Hay_3.png",
          "Well_Hay_1.png",
          "Fences.png",
          "CityWall_Gate_1.png",
        ],
        density: 0.08,
        spacing: 4,
      },
      wildlife: {
        animals: ["chicken", "pig", "sheep"],
        density: 0.2,
        spawnProbability: 0.6,
      },
      specialFeatures: [
        {
          name: "market_squares",
          assets: ["Well_Hay_1.png", "Fences.png"],
          density: 0.02,
        },
        {
          name: "flower_gardens",
          assets: ["flowers_white.png", "flowers_red.png"],
          density: 0.25,
        },
        {
          name: "gathering_places",
          assets: ["campfire.png"],
          density: 0.05,
        },
      ],
    },
  };

/**
 * Obtiene las características mejoradas de un bioma
 */
export function getEnhancedBiomeFeatures(
  biome: BiomeType,
): EnhancedBiomeFeatures {
  return ENHANCED_BIOME_FEATURES[biome] || {};
}

/**
 * Combina la definición base del bioma con las características mejoradas
 */
export function getFullBiomeDefinition(
  biome: BiomeType,
): BiomeDefinition & { enhanced: EnhancedBiomeFeatures } {
  return {
    ...BIOME_DEFINITIONS[biome],
    enhanced: getEnhancedBiomeFeatures(biome),
  };
}

/**
 * Calcula la densidad total de objetos para un bioma (para optimización de rendimiento)
 */
export function calculateBiomeDensity(biome: BiomeType): number {
  const features = getEnhancedBiomeFeatures(biome);

  let totalDensity = 0;

  if (features.ruins) totalDensity += features.ruins.density;
  if (features.structures) totalDensity += features.structures.density;
  if (features.wildlife) totalDensity += features.wildlife.density;
  if (features.specialFeatures) {
    totalDensity += features.specialFeatures.reduce(
      (sum, feature) => sum + feature.density,
      0,
    );
  }

  return totalDensity;
}

/**
 * Lista todos los assets únicos requeridos por los biomas mejorados
 */
export function getAllRequiredAssets(): string[] {
  const assets = new Set<string>();

  Object.values(ENHANCED_BIOME_FEATURES).forEach((features) => {
    features.ruins?.types.forEach((asset) => assets.add(asset));
    features.structures?.types.forEach((asset) => assets.add(asset));
    features.specialFeatures?.forEach((feature) =>
      feature.assets.forEach((asset) => assets.add(asset)),
    );
  });

  return Array.from(assets);
}

/**
 * Obtiene configuración de spawn para vida animal por bioma
 */
export function getWildlifeSpawnConfig(biome: BiomeType): {
  animals: string[];
  totalSpawnChance: number;
} {
  const features = getEnhancedBiomeFeatures(biome);

  if (!features.wildlife) {
    return { animals: [], totalSpawnChance: 0 };
  }

  return {
    animals: features.wildlife.animals,
    totalSpawnChance:
      features.wildlife.density * features.wildlife.spawnProbability,
  };
}
