/**
 * Configuración específica del mundo y sus parámetros
 */

import type { WorldGenConfig, BiomeType } from './types';

export interface WorldPreset {
  name: string;
  description: string;
  config: WorldGenConfig;
}

/**
 * Presets predefinidos para diferentes tipos de mundo
 */
export const WORLD_PRESETS: Record<string, WorldPreset> = {
  balanced: {
    name: 'Mundo Equilibrado',
    description: 'Distribución equilibrada de todos los biomas',
    config: {
      width: 64,
      height: 64,
      tileSize: 32,
      seed: 12345,

      noise: {
        temperature: {
          scale: 0.02,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.025,
          octaves: 3,
          persistence: 0.6,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.015,
          octaves: 5,
          persistence: 0.4,
          lacunarity: 2.0,
        },
      },

      biomes: {
        enabled: [
          'grassland' as BiomeType,
          'forest' as BiomeType,
          'mystical' as BiomeType,
          'wetland' as BiomeType,
          'mountainous' as BiomeType,
          'village' as BiomeType,
        ],
        forceSpawn: [
          {
            biome: 'village' as BiomeType,
            position: { x: 32, y: 32 },
            radius: 6,
          },
        ],
      },

      water: {
        level: 0.2,
        rivers: true,
        lakes: true,
      },
    },
  },

  forest_heavy: {
    name: 'Mundo Boscoso',
    description: 'Dominado por bosques y vegetación densa',
    config: {
      width: 64,
      height: 64,
      tileSize: 32,
      seed: 54321,

      noise: {
        temperature: {
          scale: 0.015,
          octaves: 3,
          persistence: 0.6,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.02,
          octaves: 4,
          persistence: 0.7,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.01,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
      },

      biomes: {
        enabled: [
          'grassland' as BiomeType,
          'forest' as BiomeType,
          'mystical' as BiomeType,
          'wetland' as BiomeType,
          'village' as BiomeType,
        ],
        forceSpawn: [
          {
            biome: 'village' as BiomeType,
            position: { x: 32, y: 32 },
            radius: 4,
          },
          {
            biome: 'mystical' as BiomeType,
            position: { x: 16, y: 16 },
            radius: 8,
          },
        ],
      },

      water: {
        level: 0.15,
        rivers: true,
        lakes: false,
      },
    },
  },

  mystical: {
    name: 'Mundo Místico',
    description: 'Rico en elementos mágicos y áreas encantadas',
    config: {
      width: 48,
      height: 48,
      tileSize: 32,
      seed: 99999,

      noise: {
        temperature: {
          scale: 0.03,
          octaves: 5,
          persistence: 0.4,
          lacunarity: 2.5,
        },
        moisture: {
          scale: 0.035,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.025,
          octaves: 6,
          persistence: 0.3,
          lacunarity: 3.0,
        },
      },

      biomes: {
        enabled: [
          'mystical' as BiomeType,
          'forest' as BiomeType,
          'grassland' as BiomeType,
          'village' as BiomeType,
        ],
        forceSpawn: [
          {
            biome: 'mystical' as BiomeType,
            position: { x: 24, y: 24 },
            radius: 12,
          },
          {
            biome: 'village' as BiomeType,
            position: { x: 40, y: 8 },
            radius: 4,
          },
        ],
      },

      water: {
        level: 0.1,
        rivers: false,
        lakes: true,
      },
    },
  },

  mountainous: {
    name: 'Mundo Montañoso',
    description: 'Terreno elevado con montañas y valles',
    config: {
      width: 64,
      height: 64,
      tileSize: 32,
      seed: 11111,

      noise: {
        temperature: {
          scale: 0.01,
          octaves: 3,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.015,
          octaves: 3,
          persistence: 0.4,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.008,
          octaves: 7,
          persistence: 0.6,
          lacunarity: 2.0,
        },
      },

      biomes: {
        enabled: [
          'mountainous' as BiomeType,
          'grassland' as BiomeType,
          'forest' as BiomeType,
          'village' as BiomeType,
        ],
        forceSpawn: [
          {
            biome: 'village' as BiomeType,
            position: { x: 32, y: 48 },
            radius: 6,
          },
        ],
      },

      water: {
        level: 0.25,
        rivers: true,
        lakes: true,
      },
    },
  },

  small_test: {
    name: 'Mundo de Prueba',
    description: 'Mundo pequeño para testing y desarrollo',
    config: {
      width: 32,
      height: 32,
      tileSize: 32,
      seed: 12345,

      noise: {
        temperature: {
          scale: 0.05,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.06,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.04,
          octaves: 3,
          persistence: 0.4,
          lacunarity: 2.0,
        },
      },

      biomes: {
        enabled: ['grassland' as BiomeType, 'forest' as BiomeType, 'village' as BiomeType],
        forceSpawn: [
          {
            biome: 'village' as BiomeType,
            position: { x: 16, y: 16 },
            radius: 4,
          },
        ],
      },

      water: {
        level: 0.2,
        rivers: false,
        lakes: false,
      },
    },
  },
};

/**
 * Configuraciones de densidad para diferentes propósitos
 */
export const DENSITY_CONFIGS = {
  minimal: {
    treeDensity: 0.05,
    shrubDensity: 0.02,
    propDensity: 0.01,
    structureDensity: 0.005,
    decalDensity: 0.1,
    multiplier: 0.5,
  },

  normal: {
    treeDensity: 0.15,
    shrubDensity: 0.1,
    propDensity: 0.05,
    structureDensity: 0.02,
    decalDensity: 0.3,
    multiplier: 1.0,
  },

  dense: {
    treeDensity: 0.3,
    shrubDensity: 0.25,
    propDensity: 0.15,
    structureDensity: 0.05,
    decalDensity: 0.5,
    multiplier: 1.5,
  },

  performance: {
    treeDensity: 0.08,
    shrubDensity: 0.05,
    propDensity: 0.02,
    structureDensity: 0.01,
    decalDensity: 0.15,
    multiplier: 0.7,
  },
};

/**
 * Obtiene un preset por nombre
 */
export function getWorldPreset(name: string): WorldPreset | null {
  return WORLD_PRESETS[name] || null;
}

/**
 * Lista todos los presets disponibles
 */
export function getAvailablePresets(): string[] {
  return Object.keys(WORLD_PRESETS);
}

/**
 * Aplica configuración de densidad a un preset
 */
export function applyDensityConfig(
  preset: WorldPreset,
  densityConfig: keyof typeof DENSITY_CONFIGS
): WorldPreset {
  const density = DENSITY_CONFIGS[densityConfig];

  return {
    ...preset,
    config: {
      ...preset.config,
      // Ajustar parámetros de ruido basados en densidad
      noise: {
        ...preset.config.noise,
        temperature: {
          ...preset.config.noise.temperature,
          scale: preset.config.noise.temperature.scale * density.multiplier,
        },
        moisture: {
          ...preset.config.noise.moisture,
          scale: preset.config.noise.moisture.scale * density.multiplier,
        },
        elevation: {
          ...preset.config.noise.elevation,
          scale: preset.config.noise.elevation.scale * density.multiplier,
        },
      },
    },
  };
}

/**
 * Crea una configuración personalizada basada en parámetros
 */
export function createCustomWorldConfig(params: {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  biomePreference?: 'balanced' | 'forest' | 'mystical' | 'mountain';
  density?: keyof typeof DENSITY_CONFIGS;
  seed?: number;
}): WorldGenConfig {
  const sizeConfigs = {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 },
    xlarge: { width: 128, height: 128 },
  };

  const size = sizeConfigs[params.size || 'medium'];
  const basePreset = params.biomePreference || 'balanced';
  const preset = getWorldPreset(basePreset);

  if (!preset) {
    throw new Error(`Preset no encontrado: ${basePreset}`);
  }

  return {
    ...preset.config,
    ...size,
    seed: params.seed || Math.floor(Math.random() * 100000),
  };
}

/**
 * Valida una configuración de mundo
 */
export function validateWorldConfig(config: WorldGenConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.width < 16 || config.width > 128) {
    errors.push('Width debe estar entre 16 y 128');
  }

  if (config.height < 16 || config.height > 128) {
    errors.push('Height debe estar entre 16 y 128');
  }

  if (config.tileSize < 16 || config.tileSize > 64) {
    errors.push('TileSize debe estar entre 16 y 64');
  }

  if (config.biomes.enabled.length === 0) {
    errors.push('Debe haber al menos un bioma habilitado');
  }

  // Validar configuraciones de ruido
  const noiseValidation = [config.noise.temperature, config.noise.moisture, config.noise.elevation];

  for (const noise of noiseValidation) {
    if (noise.scale <= 0 || noise.scale > 1) {
      errors.push('Noise scale debe estar entre 0 y 1');
    }
    if (noise.octaves < 1 || noise.octaves > 8) {
      errors.push('Noise octaves debe estar entre 1 y 8');
    }
    if (noise.persistence <= 0 || noise.persistence > 1) {
      errors.push('Noise persistence debe estar entre 0 y 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
