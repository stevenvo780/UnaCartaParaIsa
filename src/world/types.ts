/**
 * Tipos y interfaces para el sistema de biomas y generación de mundo
 */

export enum BiomeType {
  GRASSLAND = 'grassland',
  FOREST = 'forest', 
  MYSTICAL = 'mystical',
  WETLAND = 'wetland',
  MOUNTAINOUS = 'mountainous',
  VILLAGE = 'village'
}

export interface BiomeDefinition {
  id: BiomeType;
  name: string;
  description: string;
  color: string; // Color representativo para debugging
  
  // Condiciones de spawn
  conditions: {
    temperatureRange: [number, number]; // 0-1
    moistureRange: [number, number]; // 0-1
    elevationRange: [number, number]; // 0-1
    distanceFromWater?: number; // tiles
  };
  
  // Assets por categoría
  assets: {
    terrain: {
      primary: string[]; // Assets principales de terreno
      secondary: string[]; // Assets secundarios para variación
      weight: number[]; // Pesos para cada asset
    };
    trees: {
      primary: string[];
      rare: string[]; // Árboles especiales/raros
      density: number; // 0-1, densidad de árboles
      clustering: number; // 0-1, tendencia a agruparse
    };
    shrubs: {
      assets: string[];
      density: number;
    };
    props: {
      common: string[];
      rare: string[];
      density: number;
    };
    structures?: {
      assets: string[];
      density: number;
      spacing: number; // distancia mínima entre estructuras
    };
    decals: {
      assets: string[];
      density: number;
    };
  };
  
  // Configuración de generación
  generation: {
    tileSize: number;
    transitionWidth: number; // ancho de zona de transición
    minClusterSize: number; // tamaño mínimo de cluster de bioma
    spawnProbabilities: Record<string, number>; // probabilidades específicas
  };
}

export interface TerrainTile {
  x: number;
  y: number;
  biome: BiomeType;
  biomeStrength: number; // 0-1, qué tan "puro" es el bioma
  temperature: number; // 0-1
  moisture: number; // 0-1
  elevation: number; // 0-1
  assets: {
    terrain: string;
    vegetation: string[];
    props: string[];
    structures: string[];
    decals: string[];
  };
}

export interface WorldGenConfig {
  width: number; // ancho en tiles
  height: number; // alto en tiles
  tileSize: number; // tamaño de cada tile en pixels
  seed: number;
  
  // Parámetros de ruido
  noise: {
    temperature: {
      scale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
    };
    moisture: {
      scale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
    };
    elevation: {
      scale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
    };
  };
  
  // Configuración de biomas
  biomes: {
    enabled: BiomeType[];
    forceSpawn?: Array<{
      biome: BiomeType;
      position: { x: number; y: number };
      radius: number;
    }>;
  };
  
  // Generación de agua
  water: {
    level: number; // 0-1, nivel de agua basado en elevación
    rivers: boolean; // generar ríos
    lakes: boolean; // generar lagos
  };
}

export interface WorldLayer {
  name: string;
  zIndex: number;
  tiles: Array<{
    x: number;
    y: number;
    asset: string;
    rotation?: number;
    scale?: number;
    alpha?: number;
  }>;
}

export interface GeneratedWorld {
  config: WorldGenConfig;
  terrain: TerrainTile[][];
  layers: WorldLayer[];
  biomeMap: BiomeType[][];
  metadata: {
    generationTime: number;
    biomeDistribution: Record<BiomeType, number>;
    totalAssets: number;
    version: string;
  };
}

export interface NoiseOptions {
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
}

export interface BiomeTransition {
  fromBiome: BiomeType;
  toBiome: BiomeType;
  strength: number; // 0-1
  assets: {
    terrain: string[];
    vegetation: string[];
  };
}
