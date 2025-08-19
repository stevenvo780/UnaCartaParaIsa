/**
 * Definiciones de biomas optimizadas para uso con TilesetManager
 * Cada bioma especifica rangos de IDs de tiles en lugar de nombres de archivos
 */

import { BiomeType } from './types';
import type { BiomeDefinition } from './types';

export const BIOME_DEFINITIONS: Record<BiomeType, BiomeDefinition> = {
  [BiomeType.GRASSLAND]: {
    id: BiomeType.GRASSLAND,
    name: 'Pradera Verde',
    description: 'Extensas praderas con césped y árboles dispersos',
    color: '#7CB342',
    
    conditions: {
      temperatureRange: [0.4, 0.7],
      moistureRange: [0.3, 0.6],
      elevationRange: [0.3, 0.7]
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped1.png', 'cesped2.png', 'cesped3.png', 'cesped4.png', 'cesped5.png',
          'cesped6.png', 'cesped7.png', 'cesped8.png', 'cesped9.png', 'cesped10.png'
        ],
        secondary: ['Grass_Middle.png', 'TexturedGrass.png'],
        weight: [0.7, 0.15, 0.1, 0.05]
      },
      
      // IDs de tiles del TilesetManager para mayor eficiencia
      tileIds: {
        terrain: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // cesped1-10
        autotiles: [200, 201, 202, 203], // grass edges
        decorations: [33, 34] // grass_middle, textured_grass
      },
      
      trees: {
        primary: ['oak_tree.png'],
        rare: ['tree_emerald_1.png', 'tree_emerald_2.png'],
        density: 0.15,
        clustering: 0.3
      },
      shrubs: {
        assets: [],
        density: 0.1
      },
      props: {
        common: ['flowers_white.png', 'flowers_red.png'],
        rare: [],
        density: 0.2
      },
      decals: {
        assets: ['grass_patch_01.png'],
        density: 0.3
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 3,
      minClusterSize: 5,
      spawnProbabilities: {
        treeGroups: 0.15,
        flowerPatches: 0.25,
        clearings: 0.1
      }
    }
  },
  
  [BiomeType.FOREST]: {
    id: BiomeType.FOREST,
    name: 'Bosque Frondoso',
    description: 'Denso bosque con gran variedad de árboles y vegetación',
    color: '#2E7D32',
    
    conditions: {
      temperatureRange: [0.3, 0.6],
      moistureRange: [0.6, 0.9],
      elevationRange: [0.2, 0.8]
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped11.png', 'cesped12.png', 'cesped13.png', 'cesped14.png', 'cesped15.png',
          'cesped16.png', 'cesped17.png', 'cesped18.png', 'cesped19.png', 'cesped20.png'
        ],
        secondary: ['TexturedGrass.png'],
        weight: [0.8, 0.2]
      },
      
      tileIds: {
        terrain: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // cesped11-20
        autotiles: [200, 201, 202, 203],
        decorations: [34] // textured_grass
      },
      
      trees: {
        primary: [
          'tree_emerald_1.png', 'tree_emerald_2.png', 'tree_emerald_3.png', 'tree_emerald_4.png',
          'curved_tree1.png', 'curved_tree2.png', 'curved_tree3.png',
          'oak_tree.png'
        ],
        rare: ['mega_tree1.png', 'mega_tree2.png'],
        density: 0.45,
        clustering: 0.7
      },
      shrubs: {
        assets: [],
        density: 0.3
      },
      props: {
        common: ['mushrooms'],
        rare: [],
        density: 0.15
      },
      decals: {
        assets: ['shadow_soft_01.png', 'dirt_patch_01.png'],
        density: 0.4
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 4,
      minClusterSize: 8,
      spawnProbabilities: {
        denseGroves: 0.3,
        forestPaths: 0.1,
        clearings: 0.05,
        mushroomCircles: 0.15
      }
    }
  },
  
  [BiomeType.MYSTICAL]: {
    id: BiomeType.MYSTICAL,
    name: 'Bosque Místico',
    description: 'Bosque encantado con árboles luminosos y elementos mágicos',
    color: '#7B1FA2',
    
    conditions: {
      temperatureRange: [0.2, 0.4],
      moistureRange: [0.4, 0.7],
      elevationRange: [0.1, 0.5]
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped21.png', 'cesped22.png', 'cesped23.png', 'cesped24.png', 'cesped25.png',
          'cesped26.png', 'cesped27.png', 'cesped28.png', 'cesped29.png', 'cesped30.png', 'cesped31.png'
        ],
        secondary: [],
        weight: [1.0]
      },
      
      tileIds: {
        terrain: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // cesped21-31
        autotiles: [200, 201, 202, 203],
        decorations: []
      },
      
      trees: {
        primary: [
          'luminous_tree1.png', 'luminous_tree2.png', 'luminous_tree3.png', 'luminous_tree4.png',
          'swirling_tree1.png', 'swirling_tree2.png', 'swirling_tree3.png',
          'blue-green_balls_tree1.png', 'blue-green_balls_tree2.png', 'blue-green_balls_tree3.png'
        ],
        rare: [
          'tree_idol_deer.png', 'tree_idol_dragon.png', 'tree_idol_human.png', 'tree_idol_wolf.png'
        ],
        density: 0.25,
        clustering: 0.4
      },
      shrubs: {
        assets: [],
        density: 0.2
      },
      props: {
        common: ['light_balls_tree1.png', 'light_balls_tree2.png', 'light_balls_tree3.png'],
        rare: [],
        density: 0.1
      },
      decals: {
        assets: ['shadow_soft_01.png'],
        density: 0.2
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 5,
      minClusterSize: 4,
      spawnProbabilities: {
        sacredGroves: 0.2,
        totemCircles: 0.1,
        mysticalClearings: 0.15,
        glowingPatches: 0.3
      }
    }
  },
  
  [BiomeType.WETLAND]: {
    id: BiomeType.WETLAND,
    name: 'Humedal',
    description: 'Zona húmeda con sauces, agua y hongos',
    color: '#00695C',
    
    conditions: {
      temperatureRange: [0.4, 0.7],
      moistureRange: [0.8, 1.0],
      elevationRange: [0.0, 0.3],
      distanceFromWater: 5
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped1.png', 'cesped2.png', 'cesped3.png',
          'Water_Middle.png'
        ],
        secondary: [],
        weight: [0.6, 0.4]
      },
      
      tileIds: {
        terrain: [0, 1, 2], // césped húmedo
        water: [100, 101, 102, 103, 104], // water tiles
        autotiles: [204, 205, 206, 207, 208, 209, 210, 211], // water edges and corners
        decorations: []
      },
      
      trees: {
        primary: [
          'willow1.png', 'willow2.png', 'willow3.png',
          'white_tree1.png', 'white_tree2.png'
        ],
        rare: ['tree_emerald_1.png'],
        density: 0.2,
        clustering: 0.5
      },
      shrubs: {
        assets: [],
        density: 0.4
      },
      props: {
        common: ['mushrooms'],
        rare: [],
        density: 0.3
      },
      decals: {
        assets: ['dirt_patch_01.png'],
        density: 0.5
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 6,
      minClusterSize: 6,
      spawnProbabilities: {
        pondClusters: 0.4,
        reedPatches: 0.3,
        mushroomGroups: 0.25,
        muddyAreas: 0.2
      }
    }
  },
  
  [BiomeType.MOUNTAINOUS]: {
    id: BiomeType.MOUNTAINOUS,
    name: 'Zona Montañosa',
    description: 'Terreno elevado con acantilados, rocas y árboles resistentes',
    color: '#5D4037',
    
    conditions: {
      temperatureRange: [0.1, 0.4],
      moistureRange: [0.1, 0.4],
      elevationRange: [0.7, 1.0]
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped15.png', 'cesped16.png', 'cesped17.png', 'cesped18.png'
        ],
        secondary: ['dirt_patch_01.png'],
        weight: [0.7, 0.3]
      },
      
      tileIds: {
        terrain: [14, 15, 16, 17], // césped árido
        autotiles: [200, 201, 202, 203],
        decorations: []
      },
      
      trees: {
        primary: ['mega_tree1.png', 'mega_tree2.png', 'oak_tree.png'],
        rare: ['curved_tree1.png', 'curved_tree2.png'],
        density: 0.1,
        clustering: 0.2
      },
      shrubs: {
        assets: [],
        density: 0.05
      },
      props: {
        common: [],
        rare: [],
        density: 0.4
      },
      structures: {
        assets: [
          'cliff_face_n.png', 'cliff_face_s.png', 'cliff_face_e.png', 'cliff_face_w.png'
        ],
        density: 0.3,
        spacing: 2
      },
      decals: {
        assets: ['dirt_patch_01.png', 'shadow_soft_01.png'],
        density: 0.6
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 4,
      minClusterSize: 4,
      spawnProbabilities: {
        cliffFormations: 0.4,
        rockOutcrops: 0.5,
        windsweptAreas: 0.3,
        alpineMeadows: 0.1
      }
    }
  },
  
  [BiomeType.VILLAGE]: {
    id: BiomeType.VILLAGE,
    name: 'Zona de Pueblo',
    description: 'Área civilizada con estructuras, caminos y jardines cuidados',
    color: '#8D6E63',
    
    conditions: {
      temperatureRange: [0.4, 0.7],
      moistureRange: [0.4, 0.7],
      elevationRange: [0.3, 0.6]
    },
    
    assets: {
      terrain: {
        primary: [
          'cesped1.png', 'cesped2.png', 'cesped3.png', 'cesped4.png', 'cesped5.png'
        ],
        secondary: [],
        weight: [1.0]
      },
      
      tileIds: {
        terrain: [0, 1, 2, 3, 4], // césped cuidado
        autotiles: [200, 201, 202, 203],
        decorations: [33, 34] // grass_middle, textured_grass
      },
      
      trees: {
        primary: ['oak_tree.png', 'tree_emerald_1.png'],
        rare: [],
        density: 0.1,
        clustering: 0.1
      },
      shrubs: {
        assets: [],
        density: 0.15
      },
      props: {
        common: ['flowers_white.png', 'flowers_red.png'],
        rare: [],
        density: 0.2
      },
      structures: {
        assets: [
          'House.png', 'House_Hay_1.png', 'House_Hay_2.png', 'House_Hay_3.png', 'House_Hay_4_Purple.png',
          'Well_Hay_1.png', 'Fences.png'
        ],
        density: 0.05,
        spacing: 4
      },
      decals: {
        assets: ['grass_patch_01.png'],
        density: 0.1
      }
    },
    
    generation: {
      tileSize: 32,
      transitionWidth: 3,
      minClusterSize: 6,
      spawnProbabilities: {
        buildingClusters: 0.3,
        gardenAreas: 0.4,
        pathways: 0.2,
        publicSpaces: 0.1
      }
    }
  }
};

/**
 * Configuración por defecto para la generación de mundo
 */
export const DEFAULT_WORLD_CONFIG = {
  width: 64,
  height: 64,
  tileSize: 32,
  seed: 12345,
  
  noise: {
    temperature: {
      scale: 0.02,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0
    },
    moisture: {
      scale: 0.025,
      octaves: 3,
      persistence: 0.6,
      lacunarity: 2.0
    },
    elevation: {
      scale: 0.015,
      octaves: 5,
      persistence: 0.4,
      lacunarity: 2.0
    }
  },
  
  biomes: {
    enabled: [
      BiomeType.GRASSLAND,
      BiomeType.FOREST,
      BiomeType.MYSTICAL,
      BiomeType.WETLAND,
      BiomeType.MOUNTAINOUS,
      BiomeType.VILLAGE
    ],
    forceSpawn: [
      {
        biome: BiomeType.VILLAGE,
        position: { x: 32, y: 32 }, // Centro del mapa
        radius: 8
      }
    ]
  },
  
  water: {
    level: 0.2,
    rivers: true,
    lakes: true
  }
};

/**
 * Obtiene la definición de un bioma
 */
export function getBiomeDefinition(biome: BiomeType): BiomeDefinition {
  return BIOME_DEFINITIONS[biome];
}

/**
 * Obtiene todos los biomas disponibles
 */
export function getAllBiomes(): BiomeType[] {
  return Object.values(BiomeType);
}

/**
 * Verifica si un bioma puede aparecer en las condiciones dadas
 */
export function canBiomeSpawn(
  biome: BiomeType, 
  temperature: number, 
  moisture: number, 
  elevation: number
): boolean {
  const def = getBiomeDefinition(biome);
  
  return (
    temperature >= def.conditions.temperatureRange[0] &&
    temperature <= def.conditions.temperatureRange[1] &&
    moisture >= def.conditions.moistureRange[0] &&
    moisture <= def.conditions.moistureRange[1] &&
    elevation >= def.conditions.elevationRange[0] &&
    elevation <= def.conditions.elevationRange[1]
  );
}

/**
 * Calcula la aptitud de un bioma para las condiciones dadas
 */
export function calculateBiomeFitness(
  biome: BiomeType,
  temperature: number,
  moisture: number,
  elevation: number
): number {
  const def = getBiomeDefinition(biome);
  
  // Calcular distancia normalizada a los rangos óptimos
  const tempCenter = (def.conditions.temperatureRange[0] + def.conditions.temperatureRange[1]) / 2;
  const moistCenter = (def.conditions.moistureRange[0] + def.conditions.moistureRange[1]) / 2;
  const elevCenter = (def.conditions.elevationRange[0] + def.conditions.elevationRange[1]) / 2;
  
  const tempDist = Math.abs(temperature - tempCenter);
  const moistDist = Math.abs(moisture - moistCenter);
  const elevDist = Math.abs(elevation - elevCenter);
  
  // Fitness inverso a la distancia (0-1, donde 1 es perfecto)
  const fitness = 1 - Math.sqrt(tempDist * tempDist + moistDist * moistDist + elevDist * elevDist) / Math.sqrt(3);
  
  return Math.max(0, fitness);
}
