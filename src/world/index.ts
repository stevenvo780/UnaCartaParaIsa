/**
 * Exportaciones principales del sistema de biomas y generación de mundo
 */

// Tipos principales
export type {
  BiomeDefinition,
  BiomeTransition,
  GeneratedWorld,
  NoiseOptions,
  TerrainTile,
  WorldGenConfig,
  WorldLayer,
} from "./types";

// Enum principal
export { BiomeType } from "./types";

// Sistema principal
export { BiomeSystem } from "./BiomeSystem";

// Generadores
export { NoiseUtils } from "./NoiseUtils";
export { TerrainGenerator } from "./TerrainGenerator";

// Configuración y definiciones
export {
  BIOME_DEFINITIONS,
  DEFAULT_WORLD_CONFIG,
  calculateBiomeFitness,
  canBiomeSpawn,
  getAllBiomes,
  getBiomeDefinition,
} from "./BiomeDefinitions";

export {
  DENSITY_CONFIGS,
  WORLD_PRESETS,
  applyDensityConfig,
  createCustomWorldConfig,
  getAvailablePresets,
  getWorldPreset,
  validateWorldConfig,
} from "./WorldConfig";
