/**
 * Exportaciones principales del sistema de biomas y generación de mundo
 */

// Tipos principales
export type {
  BiomeDefinition,
  TerrainTile,
  WorldGenConfig,
  GeneratedWorld,
  WorldLayer,
  NoiseOptions,
  BiomeTransition,
} from "./types";

// Enum principal
export { BiomeType } from "./types";

// Sistema principal
export { BiomeSystem } from "./BiomeSystem";

// Generadores
export { TerrainGenerator } from "./TerrainGenerator";
export { NoiseGenerator, NoiseProcessor } from "./NoiseUtils";

// Configuración y definiciones
export {
  BIOME_DEFINITIONS,
  DEFAULT_WORLD_CONFIG,
  getBiomeDefinition,
  getAllBiomes,
  canBiomeSpawn,
  calculateBiomeFitness,
} from "./BiomeDefinitions";

export {
  WORLD_PRESETS,
  DENSITY_CONFIGS,
  getWorldPreset,
  getAvailablePresets,
  applyDensityConfig,
  createCustomWorldConfig,
  validateWorldConfig,
} from "./WorldConfig";
