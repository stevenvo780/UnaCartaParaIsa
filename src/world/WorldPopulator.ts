/**
 * World Populator para "Una Carta Para Isa"
 * Sistema para poblar el mundo con estructuras, ruinas y vida animal basado en biomas
 */

import { logAutopoiesis } from "../utils/logger";
import { getFullBiomeDefinition } from "./EnhancedBiomeDefinitions";
import type { BiomeType } from "./types";

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
      maxEntitiesPerChunk: 8, // 🎯 REDUCIDO: de 25 a 8 para menos densidad
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

  /**
   * Puebla una región del mundo basada en el bioma
   */
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

    // 🌳 NUEVO: Poblar con vegetación natural adicional (más árboles)
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

  /**
   * Genera ruinas en una región - DENSIDAD BAJA
   */
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
    // 🎯 RUINAS: Muy pocas, solo 0.005% del área
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

  /**
   * Genera estructuras en una región - DENSIDAD MODERADA (casas)
   */
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
    // 🎯 CASAS: Moderada densidad, 0.008% del área
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

  /**
   * Genera vida animal en una región - DENSIDAD BAJA
   */
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
    // 🎯 WILDLIFE: Muy poca densidad, 0.003% del área
    const targetCount = Math.floor(area * wildlifeConfig.density * 0.003);

    for (let i = 0; i < targetCount; i++) {
      if (rng() > wildlifeConfig.spawnProbability * 0.3) {
        // 70% menos animales
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

  /**
   * Genera características especiales en una región
   */
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
    // 🎯 REDUCIR DENSIDAD: De 0.01 a 0.003 (70% menos especiales)
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

  /**
   * 🌳 NUEVO: Genera vegetación natural (principalmente árboles) - DENSIDAD EQUILIBRADA
   */
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

    // 🌳 ÁRBOLES: Densidad moderada, 0.008% del área (reducido de 0.02%)
    const treeCount = Math.floor(area * 0.008);

    // 🌿 ARBUSTOS: Baja densidad, 0.004% del área (reducido de 0.01%)
    const bushCount = Math.floor(area * 0.004);

    // Generar árboles
    for (let i = 0; i < treeCount; i++) {
      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      // Verificar espaciado mínimo (más espaciado para árboles)
      if (!this.isSpacingValid(entityX, entityY, 64)) {
        // Aumentado de 32 a 64
        continue;
      }

      entities.push({
        id: `tree_natural_${biome}_${Date.now()}_${i}`,
        type: "tree",
        assetKey: "tree_natural", // Se mapeará a un árbol aleatorio
        x: entityX,
        y: entityY,
        scale: 0.8 + rng() * 0.6, // Variación de tamaño
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
        // Solo 30% de los arbustos se generan
        continue;
      }

      const entityX = x + rng() * width;
      const entityY = y + rng() * height;

      if (!this.isSpacingValid(entityX, entityY, 48)) {
        // Aumentado de 24 a 48
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
