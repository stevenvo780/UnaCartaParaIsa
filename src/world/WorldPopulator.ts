/** Población del mundo con estructuras, ruinas, vegetación y fauna según bioma */

import { logAutopoiesis } from "../utils/logger";
import { getFullBiomeDefinition } from "./EnhancedBiomeDefinitions";
import { BiomeType } from "./types";

export interface WorldEntity {
  id: string;
  type:
    | "structure"
    | "ruin"
    | "wildlife"
    | "decoration"
    | "special"
    | "tree"
    | "vegetation";
  assetKey: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  animation?: string;
  biome: BiomeType;
  metadata?: Record<string, any>;
}

export interface PopulationConfig {
  maxEntitiesPerChunk: number;
  chunkSize: number;
  performanceMode: boolean;
  wildlifeRespawn: boolean;
  structurePersistence: boolean;
}

export class WorldPopulator {
  private scene: Phaser.Scene;
  private entities: Map<string, WorldEntity> = new Map();
  private chunks: Map<string, WorldEntity[]> = new Map();
  private config: PopulationConfig;
  private worldWidth: number;
  private worldHeight: number;

  constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    worldHeight: number,
    config: Partial<PopulationConfig> = {},
  ) {
    this.scene = scene;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.config = {
      maxEntitiesPerChunk: 8,
      chunkSize: 512,
      performanceMode: true,
      wildlifeRespawn: true,
      structurePersistence: true,
      ...config,
    };

    logAutopoiesis.info("WorldPopulator initialized", {
      worldSize: `${worldWidth}x${worldHeight}`,
      config: this.config,
    });
  }

  /** Puebla una región del mundo basada en el bioma */
  public populateRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: BiomeType,
    seed?: number,
  ): WorldEntity[] {
    const biomeDef = getFullBiomeDefinition(biome);
    const entities: WorldEntity[] = [];

    // Configurar generador de números aleatorios con semilla
    const rng = this.createSeededRNG(seed || 12345 + x + y);

    // Poblar con ruinas
    if (biomeDef.enhanced.ruins) {
      const ruins = this.generateRuins(
        x,
        y,
        width,
        height,
        biomeDef.enhanced.ruins,
        biome,
        rng,
      );
      entities.push(...ruins);
    }

    // Poblar con estructuras
    if (biomeDef.enhanced.structures) {
      const structures = this.generateStructures(
        x,
        y,
        width,
        height,
        biomeDef.enhanced.structures,
        biome,
        rng,
      );
      entities.push(...structures);
    }

    // Poblar con vida animal
    if (biomeDef.enhanced.wildlife) {
      const wildlife = this.generateWildlife(
        x,
        y,
        width,
        height,
        biomeDef.enhanced.wildlife,
        biome,
        rng,
      );
      entities.push(...wildlife);
    }

    // Poblar con características especiales
    if (biomeDef.enhanced.specialFeatures) {
      for (const feature of biomeDef.enhanced.specialFeatures) {
        const specials = this.generateSpecialFeatures(
          x,
          y,
          width,
          height,
          feature,
          biome,
          rng,
        );
        entities.push(...specials);
      }
    }

    // Poblar con vegetación natural adicional (árboles y arbustos)
    const naturalVegetation = this.generateNaturalVegetation(
      x,
      y,
      width,
      height,
      biome,
      rng,
    );
    entities.push(...naturalVegetation);

    // Registrar entidades y organizarlas en chunks
    entities.forEach((entity) => {
      this.entities.set(entity.id, entity);
      this.addToChunk(entity);
    });

    logAutopoiesis.info(`Populated region with ${entities.length} entities`, {
      biome,
      region: `${x},${y} -> ${x + width},${y + height}`,
      breakdown: this.getEntityBreakdown(entities),
    });

    return entities;
  }

  /** Genera ruinas en una región (baja densidad) */
  private generateRuins(
    x: number,
    y: number,
    width: number,
    height: number,
    ruinConfig: any,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const area = width * height;
    const targetCount = Math.floor(area * ruinConfig.density * 0.005);

    for (let i = 0; i < targetCount; i++) {
      // Verificar espaciado mínimo
      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      if (!this.isSpacingValid(entityX, entityY, ruinConfig.spacing * 2)) {
        // Mayor espaciado
        continue;
      }

      const assetKey =
        ruinConfig.types[Math.floor(rng() * ruinConfig.types.length)];

      entities.push({
        id: `ruin_${biome}_${Date.now()}_${i}`,
        type: "ruin",
        assetKey,
        x: entityX,
        y: entityY,
        scale: 0.8 + rng() * 0.4,
        rotation: rng() * Math.PI * 2,
        biome,
        metadata: {
          ageLevel: Math.floor(rng() * 5) + 1,
          discovered: false,
        },
      });
    }

    return entities;
  }

  /** Genera estructuras en una región (densidad moderada) */
  private generateStructures(
    x: number,
    y: number,
    width: number,
    height: number,
    structureConfig: any,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const area = width * height;
    const targetCount = Math.floor(area * structureConfig.density * 0.008);

    for (let i = 0; i < targetCount; i++) {
      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      if (
        !this.isSpacingValid(entityX, entityY, structureConfig.spacing * 1.5)
      ) {
        continue;
      }

      const assetKey =
        structureConfig.types[Math.floor(rng() * structureConfig.types.length)];

      entities.push({
        id: `structure_${biome}_${Date.now()}_${i}`,
        type: "structure",
        assetKey,
        x: entityX,
        y: entityY,
        scale: 1.0,
        rotation: 0,
        biome,
        metadata: {
          functional: true,
          condition: "good",
        },
      });
    }

    return entities;
  }

  /** Genera vida animal en una región (baja densidad) */
  private generateWildlife(
    x: number,
    y: number,
    width: number,
    height: number,
    wildlifeConfig: any,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const area = width * height;
    const targetCount = Math.floor(area * wildlifeConfig.density * 0.003);

    for (let i = 0; i < targetCount; i++) {
      if (rng() > wildlifeConfig.spawnProbability * 0.3) {
        continue;
      }

      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      const animalType =
        wildlifeConfig.animals[
          Math.floor(rng() * wildlifeConfig.animals.length)
        ];

      entities.push({
        id: `wildlife_${animalType}_${biome}_${Date.now()}_${i}`,
        type: "wildlife",
        assetKey: `${animalType}_anim`,
        x: entityX,
        y: entityY,
        scale: 0.8 + rng() * 0.4,
        rotation: rng() * Math.PI * 2,
        animation: `${animalType}_idle`,
        biome,
        metadata: {
          species: animalType,
          health: 100,
          behavior: "wandering",
          lastSeen: Date.now(),
        },
      });
    }

    return entities;
  }

  /** Genera características especiales en una región */
  private generateSpecialFeatures(
    x: number,
    y: number,
    width: number,
    height: number,
    featureConfig: any,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const area = width * height;
    const targetCount = Math.floor(area * featureConfig.density * 0.003);

    for (let i = 0; i < targetCount; i++) {
      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      if (featureConfig.assets.length === 0) {
        continue; // Skip if no assets defined
      }

      const assetKey =
        featureConfig.assets[Math.floor(rng() * featureConfig.assets.length)];

      entities.push({
        id: `special_${featureConfig.name}_${biome}_${Date.now()}_${i}`,
        type: "special",
        assetKey,
        x: entityX,
        y: entityY,
        scale: 1.0,
        rotation: 0,
        biome,
        metadata: {
          featureName: featureConfig.name,
          interactive: true,
        },
      });
    }

    return entities;
  }

  /** Genera vegetación natural (árboles y arbustos) */
  private generateNaturalVegetation(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const area = width * height;

    const treeCount = Math.floor(area * 0.008);

    const bushCount = Math.floor(area * 0.004);

    // Generar árboles
    for (let i = 0; i < treeCount; i++) {
      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      // Verificar espaciado mínimo (árboles)
      if (!this.isSpacingValid(entityX, entityY, 64)) {
        continue;
      }

      entities.push({
        id: `tree_natural_${biome}_${Date.now()}_${i}`,
        type: "tree",
        assetKey: "tree_natural", // Se mapeará a un árbol aleatorio
        x: entityX,
        y: entityY,
        scale: 0.8 + rng() * 0.6,
        rotation: rng() * Math.PI * 2,
        biome,
        metadata: {
          naturalFeature: true,
          treeType: "deciduous",
        },
      });
    }

    // Generar arbustos con probabilidad reducida
    for (let i = 0; i < bushCount; i++) {
      if (rng() > 0.7) {
        continue;
      }

      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      if (!this.isSpacingValid(entityX, entityY, 48)) {
        continue;
      }

      entities.push({
        id: `vegetation_natural_${biome}_${Date.now()}_${i}`,
        type: "vegetation",
        assetKey: "vegetation_natural", // Se mapeará a vegetación variada
        x: entityX,
        y: entityY,
        scale: 0.6 + rng() * 0.4,
        rotation: rng() * Math.PI * 2,
        biome,
        metadata: {
          naturalFeature: true,
          vegetationType: "shrub",
        },
      });
    }

    return entities;
  }

  /** Poblar base del mapa con distribución natural reducida */
  public populateGlobalTerrain(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: BiomeType,
    seed?: number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const rng = this.createSeededRNG(seed || 12345);

    // Densidades reducidas
    const globalDensity = {
      trees: 0.15,
      houses: 0.08,
      vegetation: 0.25,
      campfires: 0.02,
    };

    const tileSize = 64;
    const tilesX = Math.floor(width / tileSize);
    const tilesY = Math.floor(height / tileSize);

    // Distribuir elementos por todo el mapa con baja densidad
    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        const tileX = x + tx * tileSize + tileSize / 2;
        const tileY = y + ty * tileSize + tileSize / 2;

        // 🌳 Árboles distribuidos
        if (rng() < globalDensity.trees) {
          entities.push(this.createTreeEntity(tileX, tileY, biome, rng));
        }

        // 🏠 Casas distribuidas
        if (rng() < globalDensity.houses) {
          entities.push(this.createHouseEntity(tileX, tileY, biome, rng));
        }

        // 🌿 Vegetación menor
        if (rng() < globalDensity.vegetation) {
          entities.push(this.createVegetationEntity(tileX, tileY, biome, rng));
        }

        // 🔥 Fogatas ocasionales
        if (rng() < globalDensity.campfires) {
          entities.push(this.createCampfireEntity(tileX, tileY, biome, rng));
        }
      }
    }

    logAutopoiesis.info(
      `🌍 Global terrain populated: ${entities.length} base elements across ${width}x${height}px`,
    );
    return entities;
  }

  /**
   * 🏠 Poblar zona interior con muebles organizados
   */
  public populateInteriorFurniture(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: BiomeType,
    seed?: number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const rng = this.createSeededRNG(seed || 67890);

    // Determinar tipo de interior por bioma/zona
    const furnitureTypes = this.getInteriorFurnitureTypes(biome);
    const furnitureCount = Math.min(12, Math.floor((width * height) / 2000)); // Max 12 muebles

    // Distribuir muebles de forma organizada (no aleatoria)
    const margin = 20;
    const gridX = Math.max(2, Math.floor(width / 80));
    const gridY = Math.max(2, Math.floor(height / 80));

    for (let i = 0; i < furnitureCount; i++) {
      const gx = i % gridX;
      const gy = Math.floor(i / gridX);

      const furnitureX = x + margin + (gx * (width - margin * 2)) / gridX;
      const furnitureY = y + margin + (gy * (height - margin * 2)) / gridY;

      const furnitureType = furnitureTypes[i % furnitureTypes.length];

      entities.push({
        id: `furniture_${x}_${y}_${i}`,
        type: "decoration",
        assetKey: furnitureType,
        x: furnitureX,
        y: furnitureY,
        biome,
      scale: 0.8 + rng() * 0.4,
      });
    }

    return entities;
  }

  /** Poblar zona exterior con elementos temáticos específicos (baja densidad) */
  public populateExteriorThematic(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: BiomeType,
    seed?: number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];
    const rng = this.createSeededRNG(seed || 54321);

    // Solo 2-4 elementos temáticos por zona exterior
    const thematicCount = 2 + Math.floor(rng() * 3);
    const thematicTypes = this.getExteriorThematicTypes(biome);

    for (let i = 0; i < thematicCount; i++) {
      const thematicX = x + rng() * width;
      const thematicY = y + rng() * height;
      const thematicType =
        thematicTypes[Math.floor(rng() * thematicTypes.length)];

      entities.push({
        id: `thematic_${x}_${y}_${i}`,
        type: "special",
        assetKey: thematicType,
        x: thematicX,
        y: thematicY,
        biome,
        scale: 1.0 + rng() * 0.5,
      });
    }

    return entities;
  }

  /** Crear entidad de árbol para distribución global */
  private createTreeEntity(
    x: number,
    y: number,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity {
    const treeTypes = [
      "tree_emerald",
      "tree_swirling",
      "tree_white",
      "tree_willow",
      "tree_mega",
    ];
    const selectedTree = treeTypes[Math.floor(rng() * treeTypes.length)];

    return {
      id: `tree_${x}_${y}_${Math.floor(rng() * 1000)}`,
      type: "tree",
      assetKey: selectedTree,
      x: x + (rng() - 0.5) * 30,
      y: y + (rng() - 0.5) * 30,
      biome,
      scale: 0.8 + rng() * 0.6,
    };
  }

  /** Crear entidad de casa para distribución global */
  private createHouseEntity(
    x: number,
    y: number,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity {
    const houseTypes = ["house_hay", "house_stone", "house_wood", "well"];
    const selectedHouse = houseTypes[Math.floor(rng() * houseTypes.length)];

    return {
      id: `house_${x}_${y}_${Math.floor(rng() * 1000)}`,
      type: "structure",
      assetKey: selectedHouse,
      x: x + (rng() - 0.5) * 20,
      y: y + (rng() - 0.5) * 20,
      biome,
      scale: 0.9 + rng() * 0.3,
    };
  }

  /** Crear entidad de vegetación para distribución global */
  private createVegetationEntity(
    x: number,
    y: number,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity {
    const vegTypes = [
      "bush_emerald",
      "living_gazebo",
      "flowers-red",
      "flowers-white",
    ];
    const selectedVeg = vegTypes[Math.floor(rng() * vegTypes.length)];

    return {
      id: `veg_${x}_${y}_${Math.floor(rng() * 1000)}`,
      type: "vegetation",
      assetKey: selectedVeg,
      x: x + (rng() - 0.5) * 25,
      y: y + (rng() - 0.5) * 25,
      biome,
      scale: 0.7 + rng() * 0.4,
    };
  }

  /** Crear entidad de fogata para distribución global */
  private createCampfireEntity(
    x: number,
    y: number,
    biome: BiomeType,
    rng: () => number,
  ): WorldEntity {
    return {
      id: `campfire_${x}_${y}_${Math.floor(rng() * 1000)}`,
      type: "decoration",
      assetKey: "campfire",
      x: x + (rng() - 0.5) * 15,
      y: y + (rng() - 0.5) * 15,
      biome,
      scale: 1.0 + rng() * 0.2,
    };
  }

  /** Obtener tipos de muebles para interiores según bioma */
  private getInteriorFurnitureTypes(biome: BiomeType): string[] {
    const baseFurniture = [
      "chair_interior",
      "lamp_interior",
      "chest_treasure",
      "bookshelf",
    ];

    switch (biome) {
      case BiomeType.MYSTICAL:
        return [...baseFurniture, "wall_stone", "wooden_floor"];
      case BiomeType.VILLAGE:
        return [...baseFurniture, "wall_brick", "window_interior"];
      default:
        return [...baseFurniture, "sign_interior"];
    }
  }

  /** Obtener tipos temáticos para zonas exteriores */
  private getExteriorThematicTypes(biome: BiomeType): string[] {
    switch (biome) {
      case BiomeType.MYSTICAL:
        return [
          "mystical_circles",
          "crystal_formations",
          "sacred_springs",
          "woman",
          "man",
        ];
      case BiomeType.VILLAGE:
        return ["flower_meadows", "ancient_groves", "woman", "man"];
      case BiomeType.FOREST:
        return ["ancient_groves", "sacred_springs", "woman", "man"];
      default:
        return ["flower_meadows", "campfire_sites", "woman", "man"];
    }
  }

  /**
   * Verifica si el espaciado es válido para una nueva entidad
   */
  private isSpacingValid(x: number, y: number, minSpacing: number): boolean {
    // Optimización: Solo verificar entidades cercanas
    const chunkKey = this.getChunkKey(x, y);
    const nearbyChunks = this.getNearbyChunks(chunkKey);

    for (const chunk of nearbyChunks) {
      const entities = this.chunks.get(chunk) || [];
      for (const entity of entities) {
        const distance = Math.sqrt((entity.x - x) ** 2 + (entity.y - y) ** 2);
        if (distance < minSpacing * 32) {
          // Convertir a píxeles
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Crea un generador de números aleatorios con semilla
   */
  private createSeededRNG(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };
  }

  /**
   * Obtiene la clave del chunk para una posición
   */
  private getChunkKey(x: number, y: number): string {
    const chunkX = Math.floor(x / this.config.chunkSize);
    const chunkY = Math.floor(y / this.config.chunkSize);
    return `${chunkX},${chunkY}`;
  }

  /**
   * Agrega una entidad a su chunk correspondiente
   */
  private addToChunk(entity: WorldEntity): void {
    const chunkKey = this.getChunkKey(entity.x, entity.y);

    if (!this.chunks.has(chunkKey)) {
      this.chunks.set(chunkKey, []);
    }

    const chunk = this.chunks.get(chunkKey);
    if (chunk.length < this.config.maxEntitiesPerChunk) {
      chunk.push(entity);
    }
  }

  /**
   * Obtiene chunks cercanos para verificación de espaciado
   */
  private getNearbyChunks(chunkKey: string): string[] {
    const [chunkX, chunkY] = chunkKey.split(",").map(Number);
    const nearby: string[] = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        nearby.push(`${chunkX + dx},${chunkY + dy}`);
      }
    }

    return nearby;
  }

  /**
   * Obtiene un desglose de tipos de entidades
   */
  private getEntityBreakdown(entities: WorldEntity[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    entities.forEach((entity) => {
      breakdown[entity.type] = (breakdown[entity.type] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Obtiene todas las entidades en un área
   */
  public getEntitiesInArea(
    x: number,
    y: number,
    width: number,
    height: number,
  ): WorldEntity[] {
    const entities: WorldEntity[] = [];

    // Determinar chunks que intersectan con el área
    const startChunkX = Math.floor(x / this.config.chunkSize);
    const endChunkX = Math.floor((x + width) / this.config.chunkSize);
    const startChunkY = Math.floor(y / this.config.chunkSize);
    const endChunkY = Math.floor((y + height) / this.config.chunkSize);

    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
      for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY++) {
        const chunkKey = `${chunkX},${chunkY}`;
        const chunkEntities = this.chunks.get(chunkKey) || [];

        // Filtrar entidades que están realmente en el área
        entities.push(
          ...chunkEntities.filter(
            (entity) =>
              entity.x >= x &&
              entity.x <= x + width &&
              entity.y >= y &&
              entity.y <= y + height,
          ),
        );
      }
    }

    return entities;
  }

  /**
   * Limpia entidades fuera del área de visión para optimizar rendimiento
   */
  public cullDistantEntities(
    centerX: number,
    centerY: number,
    maxDistance: number,
  ): number {
    let culledCount = 0;

    this.entities.forEach((entity, id) => {
      const distance = Math.sqrt(
        (entity.x - centerX) ** 2 + (entity.y - centerY) ** 2,
      );

      if (distance > maxDistance) {
        // Solo remover vida animal si está configurado para respawn
        if (entity.type === "wildlife" && this.config.wildlifeRespawn) {
          this.entities.delete(id);
          this.removeFromChunk(entity);
          culledCount++;
        }
        // Mantener estructuras y ruinas si la persistencia está habilitada
        else if (entity.type !== "structure" && entity.type !== "ruin") {
          this.entities.delete(id);
          this.removeFromChunk(entity);
          culledCount++;
        }
      }
    });

    return culledCount;
  }

  /**
   * Remueve una entidad de su chunk
   */
  private removeFromChunk(entity: WorldEntity): void {
    const chunkKey = this.getChunkKey(entity.x, entity.y);
    const chunk = this.chunks.get(chunkKey);

    if (chunk) {
      const index = chunk.findIndex((e) => e.id === entity.id);
      if (index !== -1) {
        chunk.splice(index, 1);
      }
    }
  }

  /**
   * Obtiene estadísticas del populador
   */
  public getStats(): {
    totalEntities: number;
    activeChunks: number;
    entitiesByType: Record<string, number>;
    entitiesByBiome: Record<string, number>;
  } {
    const entitiesByType: Record<string, number> = {};
    const entitiesByBiome: Record<string, number> = {};

    this.entities.forEach((entity) => {
      entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
      entitiesByBiome[entity.biome] = (entitiesByBiome[entity.biome] || 0) + 1;
    });

    return {
      totalEntities: this.entities.size,
      activeChunks: this.chunks.size,
      entitiesByType,
      entitiesByBiome,
    };
  }
}
