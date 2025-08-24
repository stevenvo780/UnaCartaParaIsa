/**
 * Generador principal de terreno usando biomas y ruido procedural
 */

import { logAutopoiesis } from "../utils/logger";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../utils/rateLimiter";
import { secureRandom } from "../utils/secureRandom";
import { validateAndSanitizeWorldConfig } from "../utils/worldValidation";
import {
  calculateBiomeFitness,
  canBiomeSpawn,
  DEFAULT_WORLD_CONFIG,
  getBiomeDefinition,
} from "./BiomeDefinitions";
import { NoiseUtils } from "./NoiseUtils";
import { VoronoiGenerator, type VoronoiRegion } from "./VoronoiGenerator";
import {
  BiomeType,
  type BiomeDefinition,
  type GeneratedWorld,
  type TerrainTile,
  type WorldGenConfig,
  type WorldLayer,
} from "./types";

export class TerrainGenerator {
  private noiseGen: NoiseUtils;
  private voronoiGen: VoronoiGenerator;
  private config: WorldGenConfig;

  constructor(config: WorldGenConfig = DEFAULT_WORLD_CONFIG) {
    // Validar y sanitizar configuración
    const validationResult = validateAndSanitizeWorldConfig(config);

    if (!validationResult.isValid) {
      logAutopoiesis.error("❌ Configuración de mundo inválida", {
        errors: validationResult.errors,
        originalConfig: config,
      });
      throw new Error(
        `Configuración inválida: ${validationResult.errors.join(", ")}`,
      );
    }

    if (validationResult.warnings.length > 0) {
      logAutopoiesis.warn("⚠️ Advertencias en configuración de mundo", {
        warnings: validationResult.warnings,
      });
    }

    this.config = validationResult.sanitizedConfig!;

    // Usar seed seguro si no se proporciona uno específico
    if (!this.config.seed || this.config.seed === DEFAULT_WORLD_CONFIG.seed) {
      const secureSeed = secureRandom.generateSecureSeed();
      this.config.seed = parseInt(secureSeed.slice(0, 8), 16);
      logAutopoiesis.info("🔐 Generado seed seguro para terreno", {
        seedHash: secureSeed.slice(0, 8),
      });
    }

    // Validar que el seed tenga suficiente entropía
    const seedStr = this.config.seed.toString();
    if (!secureRandom.validateSeedEntropy(seedStr)) {
      logAutopoiesis.warn(
        "⚠️ Seed con baja entropía detectado, regenerando...",
      );
      const secureSeed = secureRandom.generateSecureSeed();
      this.config.seed = parseInt(secureSeed.slice(0, 8), 16);
    }

    this.noiseGen = new NoiseUtils(this.config.seed);
    this.voronoiGen = new VoronoiGenerator(
      this.config.width,
      this.config.height,
      this.config.seed,
    );

    logAutopoiesis.info(
      "✅ TerrainGenerator inicializado con configuración validada",
      {
        dimensions: `${this.config.width}x${this.config.height}`,
        totalTiles: this.config.width * this.config.height,
        seed: this.config.seed,
      },
    );
  }

  /**
   * Genera un mundo completo con biomas
   */
  public generateWorld(): GeneratedWorld {
    // Verificar rate limiting para prevenir regeneración abusiva
    if (
      !checkRateLimit("world-generation", RATE_LIMIT_CONFIGS.WORLD_GENERATION)
    ) {
      logAutopoiesis.warn("🚫 Rate limit excedido para generación de mundo");
      throw new Error(
        "Rate limit excedido. Demasiadas regeneraciones recientes.",
      );
    }

    const startTime = performance.now();
    const totalTiles = this.config.width * this.config.height;
    const estimatedMemoryMB = (totalTiles * 0.5) / 1024; // Estimación rough

    logAutopoiesis.info("🌍 Iniciando generación de mundo", {
      size: `${this.config.width}x${this.config.height}`,
      totalTiles,
      estimatedMemoryMB: estimatedMemoryMB.toFixed(1),
      seed: this.config.seed,
      biomes: this.config.biomes.enabled.length,
    });

    try {
      // 1. Generar mapas de ruido base
      const temperatureMap = this.generateNoiseMap(
        this.config.noise.temperature,
      );
      const moistureMap = this.generateNoiseMap(this.config.noise.moisture);
      const elevationMap = this.generateNoiseMap(this.config.noise.elevation);

      // 2. Asignar biomas basado en condiciones
      const biomeMap = this.assignBiomes(
        temperatureMap,
        moistureMap,
        elevationMap,
      );

      // 3. Aplicar spawn forzado de biomas
      this.applyForcedSpawns(biomeMap);

      // 4. Suavizar transiciones entre biomas
      const smoothedBiomeMap = this.smoothBiomeTransitions(biomeMap);

      // 5. Generar tiles de terreno detallado
      const terrain = this.generateDetailedTerrain(
        smoothedBiomeMap,
        temperatureMap,
        moistureMap,
        elevationMap,
      );

      // 6. Generar capas de assets
      const layers = this.generateAssetLayers(terrain);

      // 7. Calcular metadata
      const biomeDistribution =
        this.calculateBiomeDistribution(smoothedBiomeMap);
      const totalAssets = layers.reduce(
        (sum, layer) => sum + layer.tiles.length,
        0,
      );

      const generationTime = performance.now() - startTime;

      const world: GeneratedWorld = {
        config: this.config,
        terrain,
        layers,
        biomeMap: smoothedBiomeMap,
        metadata: {
          generationTime,
          biomeDistribution,
          totalAssets,
          version: "1.0.0",
        },
      };

      logAutopoiesis.info("✅ Mundo generado exitosamente", {
        generationTime: `${generationTime.toFixed(2)}ms`,
        totalAssets,
        biomeDistribution,
      });

      return world;
    } catch (error) {
      const generationTime = performance.now() - startTime;

      logAutopoiesis.error("❌ Error durante generación de mundo", {
        error: error instanceof Error ? error.message : String(error),
        generationTime: `${generationTime.toFixed(2)}ms`,
        worldSize: `${this.config.width}x${this.config.height}`,
        seed: this.config.seed,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-lanzar con contexto adicional
      throw new Error(
        `Fallo en generación de mundo (${this.config.width}x${this.config.height}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Normaliza un mapa 2D de números al rango [0,1] */
  private normalize2D(map: number[][]): number[][] {
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const v = map[y][x];
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    const range = max - min || 1;
    return map.map((row) => row.map((v) => (v - min) / range));
  }

  /**
   * Genera un mapa de ruido 2D
   */
  private generateNoiseMap(noiseConfig: {
    scale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
  }): number[][] {
    const map: number[][] = Array.from({ length: this.config.height }, () =>
      Array<number>(this.config.width).fill(0),
    );

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        // Uso de ruido fractal con parámetros del config

        map[y][x] = this.noiseGen.fractalNoise(
          x,
          y,
          noiseConfig.octaves,
          noiseConfig.persistence,
          noiseConfig.scale,
        );
      }
    }

    return this.normalize2D(map);
  }

  /**
   * Asigna biomas basado en condiciones ambientales
   */
  private assignBiomes(
    temperatureMap: number[][],
    moistureMap: number[][],
    elevationMap: number[][],
  ): BiomeType[][] {
    // Generar regiones orgánicas usando Voronoi
    const numRegions = Math.floor(
      (this.config.width * this.config.height) / 400,
    ); // ~1 región cada 20x20 tiles
    const voronoiRegions = this.voronoiGen.generateRegions(numRegions, 80);

    // Asignar biomas a las regiones Voronoi
    const regionsWithBiomes = this.voronoiGen.assignBiomes(voronoiRegions);

    // Crear mapa de biomas basado en regiones Voronoi
    const biomeMap: BiomeType[][] = Array.from(
      { length: this.config.height },
      () => Array<BiomeType>(this.config.width).fill(BiomeType.GRASSLAND),
    );

    // Asignar biomas usando las regiones Voronoi orgánicas
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const pixelX = x * this.config.tileSize;
        const pixelY = y * this.config.tileSize;

        // Encontrar la región Voronoi más cercana
        let closestRegion = regionsWithBiomes[0];
        let minDistance = Infinity;

        for (const region of regionsWithBiomes) {
          const distance = Math.hypot(
            pixelX - region.center.x,
            pixelY - region.center.y,
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = region;
          }
        }

        // Verificar si el bioma puede existir en estas condiciones
        const temperature = temperatureMap[y][x];
        const moisture = moistureMap[y][x];
        const elevation = elevationMap[y][x];

        if (
          canBiomeSpawn(closestRegion.biome, temperature, moisture, elevation)
        ) {
          biomeMap[y][x] = closestRegion.biome;
        } else {
          // Fallback: usar el sistema original para este tile
          let bestBiome = BiomeType.GRASSLAND;
          let bestFitness = 0;

          for (const biome of this.config.biomes.enabled) {
            if (canBiomeSpawn(biome, temperature, moisture, elevation)) {
              const fitness = calculateBiomeFitness(
                biome,
                temperature,
                moisture,
                elevation,
              );
              if (fitness > bestFitness) {
                bestFitness = fitness;
                bestBiome = biome;
              }
            }
          }
          biomeMap[y][x] = bestBiome;
        }
      }
    }

    logAutopoiesis.info("🔸 Biomas asignados usando Voronoi", {
      regions: regionsWithBiomes.length,
      biomeTypes: [...new Set(regionsWithBiomes.map((r) => r.biome))],
    });

    return biomeMap;
  }

  /**
   * Aplica spawns forzados de biomas en ubicaciones específicas
   */
  private applyForcedSpawns(biomeMap: BiomeType[][]): void {
    if (
      !this.config.biomes.forceSpawn ||
      this.config.biomes.forceSpawn.length === 0
    ) {
      return;
    }

    // Crear mapa de prioridades para manejar spawns superpuestos
    const priorityMap: {
      [key: string]: { biome: BiomeType; priority: number };
    } = {};

    for (let i = 0; i < this.config.biomes.forceSpawn.length; i++) {
      const spawn = this.config.biomes.forceSpawn[i]!;
      const { biome, position, radius } = spawn;

      // Validar spawn
      if (!biome || !position || typeof radius !== "number" || radius <= 0) {
        logAutopoiesis.warn("⚠️ Spawn forzado inválido, saltando", {
          spawn,
          index: i,
        });
        continue;
      }

      // Validar que la posición esté dentro de los límites
      if (
        position.x < 0 ||
        position.x >= this.config.width ||
        position.y < 0 ||
        position.y >= this.config.height
      ) {
        logAutopoiesis.warn("⚠️ Posición de spawn fuera de límites", {
          position,
          mapSize: `${this.config.width}x${this.config.height}`,
        });
        continue;
      }

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = position.x + dx;
          const y = position.y + dy;

          // Verificar límites
          if (
            x >= 0 &&
            x < this.config.width &&
            y >= 0 &&
            y < this.config.height
          ) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
              // Calcular strength y prioridad
              const strength = 1 - distance / radius;
              const priority =
                strength * (this.config.biomes.forceSpawn.length - i); // Spawns posteriores tienen menos prioridad

              const key = `${x},${y}`;

              // Solo aplicar si este spawn tiene mayor prioridad o si es el primero
              if (!priorityMap[key] || priority > priorityMap[key].priority) {
                if (Math.random() < strength) {
                  priorityMap[key] = { biome, priority };
                }
              }
            }
          }
        }
      }
    }

    // Aplicar spawns basado en prioridades
    for (const [key, data] of Object.entries(priorityMap)) {
      const [x, y] = key.split(",").map(Number) as [number, number];
      biomeMap[y!][x!] = data.biome;
    }
  }

  /**
   * Suaviza las transiciones entre biomas
   */
  private smoothBiomeTransitions(biomeMap: BiomeType[][]): BiomeType[][] {
    const smoothed = biomeMap.map((row) => [...row]);

    // Aplicar filtro de mediana para reducir ruido
    for (let y = 1; y < this.config.height - 1; y++) {
      for (let x = 1; x < this.config.width - 1; x++) {
        const neighbors = [
          biomeMap[y - 1][x - 1],
          biomeMap[y - 1][x],
          biomeMap[y - 1][x + 1],
          biomeMap[y][x - 1],
          biomeMap[y][x],
          biomeMap[y][x + 1],
          biomeMap[y + 1][x - 1],
          biomeMap[y + 1][x],
          biomeMap[y + 1][x + 1],
        ];

        // Contar frecuencia de cada bioma
        const counts = new Map<BiomeType, number>();
        for (const biome of neighbors) {
          counts.set(biome, (counts.get(biome) || 0) + 1);
        }

        // Usar el bioma más común si hay suficiente consenso
        let maxCount = 0;
        let dominantBiome = biomeMap[y][x];

        counts.forEach((count, biome) => {
          if (count > maxCount && count >= 5) {
            // Al menos 5 de 9 neighbors
            maxCount = count;
            dominantBiome = biome;
          }
        });

        smoothed[y][x] = dominantBiome;
      }
    }

    return smoothed;
  }

  /**
   * Genera tiles de terreno detallado
   */
  private generateDetailedTerrain(
    biomeMap: BiomeType[][],
    temperatureMap: number[][],
    moistureMap: number[][],
    elevationMap: number[][],
  ): TerrainTile[][] {
    const terrain: TerrainTile[][] = Array.from(
      { length: this.config.height },
      () => new Array<TerrainTile>(this.config.width),
    );

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const biome = biomeMap[y][x];
        const temperature = temperatureMap[y][x];
        const moisture = moistureMap[y][x];
        const elevation = elevationMap[y][x];

        // Calcular strength del bioma (qué tan "puro" es)
        const biomeStrength = this.calculateBiomeStrength(
          x,
          y,
          biome,
          biomeMap,
        );

        // Generar assets para este tile
        const assets = this.generateTileAssets(biome, biomeStrength, x, y);

        terrain[y][x] = {
          x,
          y,
          biome,
          biomeStrength,
          temperature,
          moisture,
          elevation,
          assets,
        } as TerrainTile;
      }
    }

    return terrain;
  }

  /**
   * Calcula qué tan "puro" es un bioma en una ubicación
   */
  private calculateBiomeStrength(
    x: number,
    y: number,
    biome: BiomeType,
    biomeMap: BiomeType[][],
  ): number {
    let sameCount = 0;
    let totalCount = 0;

    // Verificar vecindario 3x3
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < this.config.width &&
          ny >= 0 &&
          ny < this.config.height
        ) {
          totalCount++;
          if (biomeMap[ny][nx] === biome) {
            sameCount++;
          }
        }
      }
    }

    // Prevenir división por cero - si no hay vecinos válidos, asumir pureza mínima
    if (totalCount === 0) {
      logAutopoiesis.warn(
        "⚠️ No hay vecinos válidos para calcular biome strength",
        {
          x,
          y,
          biome,
          mapDimensions: `${this.config.width}x${this.config.height}`,
        },
      );
      return 0.1; // Pureza mínima por defecto
    }

    return sameCount / totalCount;
  }

  /**
   * Genera assets para un tile específico
   */
  private generateTileAssets(
    biome: BiomeType,
    strength: number,
    x: number,
    y: number,
  ): TerrainTile["assets"] {
    const biomeDef = getBiomeDefinition(biome);
    const assets: TerrainTile["assets"] = {
      terrain: "",
      vegetation: [],
      props: [],
      structures: [],
      decals: [],
    };

    // Seleccionar terreno base (soporta pesos por-asset o por-grupo primary/secondary)
    const terrainAsset = this.selectTerrainAsset(
      biomeDef.assets.terrain.primary,
      biomeDef.assets.terrain.secondary,
      biomeDef.assets.terrain.weight,
    );
    assets.terrain = terrainAsset || this.getDefaultTerrainAsset(biome);

    // Generar vegetación basada en densidad y clustering
    if (Math.random() < biomeDef.assets.trees.density * strength) {
      const treeAsset = this.selectTreeAsset(biomeDef, x, y);
      if (treeAsset) {
        assets.vegetation.push(treeAsset);
      }
    }

    // Agregar shrubs
    if (Math.random() < biomeDef.assets.shrubs.density * strength) {
      const shrubAsset = this.selectAsset(biomeDef.assets.shrubs.assets);
      if (shrubAsset) {
        assets.vegetation.push(shrubAsset);
      }
    }

    // Agregar props
    if (Math.random() < biomeDef.assets.props.density * strength) {
      const propAsset = this.selectAsset([
        ...biomeDef.assets.props.common,
        ...(Math.random() < 0.1 ? biomeDef.assets.props.rare : []),
      ]);
      if (propAsset) {
        assets.props.push(propAsset);
      }
    }

    // Agregar estructuras (solo para algunos biomas)
    if (
      biomeDef.assets.structures &&
      Math.random() < biomeDef.assets.structures.density * strength
    ) {
      const structureAsset = this.selectAsset(
        biomeDef.assets.structures.assets,
      );
      if (structureAsset) {
        assets.structures.push(structureAsset);
      }
    }

    // Agregar decals
    if (Math.random() < biomeDef.assets.decals.density) {
      const decalAsset = this.selectAsset(biomeDef.assets.decals.assets);
      if (decalAsset) {
        assets.decals.push(decalAsset);
      }
    }

    return assets;
  }

  /**
   * Selecciona un asset de terreno admitiendo diversos formatos de pesos:
   * - Pesos por asset (weights.length === primary.length)
   * - Pesos por asset combinados (weights.length === primary.length + secondary.length)
   * - Pesos por grupo [primaryWeight, secondaryWeight]
   * Si nada coincide, hace selección uniforme razonable.
   */
  private selectTerrainAsset(
    primary: string[],
    secondary: string[],
    weights?: number[],
  ): string | null {
    const pCount = primary?.length || 0;
    const sCount = secondary?.length || 0;

    // Edge case: no hay assets disponibles
    if (pCount === 0 && sCount === 0) {
      logAutopoiesis.warn("⚠️ No hay assets de terreno disponibles", {
        primaryLength: pCount,
        secondaryLength: sCount,
        weightsLength: weights?.length || 0,
      });
      return "cesped1.png"; // Fallback de emergencia
    }

    // Sin pesos: selección uniforme priorizando primary
    if (!weights || weights.length === 0) {
      if (pCount > 0) return this.selectAsset(primary);
      return this.selectAsset(secondary);
    }

    // Validar que los pesos no contengan valores inválidos
    const validWeights = weights.filter((w) => Number.isFinite(w) && w >= 0);
    if (validWeights.length !== weights.length) {
      logAutopoiesis.warn(
        "⚠️ Pesos inválidos detectados, usando selección uniforme",
        {
          originalWeights: weights,
          validWeights,
        },
      );
      // Fallback a selección uniforme
      if (pCount > 0) return this.selectAsset(primary);
      return this.selectAsset(secondary);
    }

    // Caso 1: pesos por-asset solo para primary
    if (pCount > 0 && weights.length === pCount) {
      return this.selectAsset(primary, weights);
    }

    // Caso 2: pesos por-asset combinados primary+secondary
    if (pCount + sCount > 0 && weights.length === pCount + sCount) {
      const combined = [...primary, ...secondary];
      return this.selectAsset(combined, weights);
    }

    // Caso 3: pesos por-grupo [primaryWeight, secondaryWeight]
    if (weights.length === 2 && (pCount > 0 || sCount > 0)) {
      const [wp, ws] = weights;
      const total = (wp ?? 0) + (ws ?? 0);

      // Edge case: suma de pesos es cero
      if (total <= 0) {
        logAutopoiesis.warn(
          "⚠️ Suma de pesos por grupo es cero, usando selección uniforme",
          {
            primaryWeight: wp,
            secondaryWeight: ws,
          },
        );
        if (pCount > 0) return this.selectAsset(primary);
        return this.selectAsset(secondary);
      }

      const r = Math.random() * total;
      if (r <= (wp ?? 0)) {
        // Elegir de primary
        if (pCount > 0) return this.selectAsset(primary);
        if (sCount > 0) return this.selectAsset(secondary);
      } else {
        // Elegir de secondary
        if (sCount > 0) return this.selectAsset(secondary);
        if (pCount > 0) return this.selectAsset(primary);
      }
    }

    // Edge case: configuración de pesos no reconocida
    logAutopoiesis.warn(
      "⚠️ Configuración de pesos no reconocida, usando fallback",
      {
        primaryCount: pCount,
        secondaryCount: sCount,
        weightsLength: weights.length,
        weights,
      },
    );

    // Fallback robusto: elegir de primary si hay, si no de secondary
    if (pCount > 0) return this.selectAsset(primary);
    return this.selectAsset(secondary);
  }

  /**
   * Selecciona un asset de una lista con pesos opcionales
   */
  private selectAsset(assets: string[], weights?: number[]): string | null {
    // Edge case: array vacío
    if (!assets || assets.length === 0) {
      logAutopoiesis.warn("⚠️ Array de assets vacío en selectAsset");
      return null;
    }

    // Validar que no hay elementos null/undefined en assets
    const validAssets = assets.filter(
      (asset) => asset != null && asset.trim().length > 0,
    );
    if (validAssets.length === 0) {
      logAutopoiesis.warn("⚠️ No hay assets válidos después de filtrado", {
        originalCount: assets.length,
        validCount: validAssets.length,
      });
      return null;
    }

    // Selección uniforme si no hay pesos o no coinciden
    if (!weights || weights.length !== validAssets.length) {
      if (weights && weights.length !== validAssets.length) {
        logAutopoiesis.debug(
          "Longitud de pesos no coincide con assets, usando selección uniforme",
          {
            assetsLength: validAssets.length,
            weightsLength: weights.length,
          },
        );
      }
      return validAssets[Math.floor(Math.random() * validAssets.length)];
    }

    // Validar pesos
    const validWeights = weights.map((w) =>
      Number.isFinite(w) && w >= 0 ? w : 0,
    );
    const totalWeight = validWeights.reduce((sum, w) => sum + w, 0);

    // Edge case: suma de pesos es cero o inválida
    if (totalWeight <= 0) {
      logAutopoiesis.warn(
        "⚠️ Suma de pesos inválida, usando selección uniforme",
        {
          weights: validWeights,
          totalWeight,
        },
      );
      return validAssets[Math.floor(Math.random() * validAssets.length)];
    }

    // Selección por pesos
    let random = Math.random() * totalWeight;

    for (let i = 0; i < validAssets.length; i++) {
      random -= validWeights[i];
      if (random <= 0) {
        return validAssets[i];
      }
    }

    // Fallback final: último elemento válido
    return validAssets[validAssets.length - 1];
  }

  /**
   * Selecciona un árbol considerando clustering
   */
  private selectTreeAsset(
    biomeDef: BiomeDefinition,
    x: number,
    y: number,
  ): string | null {
    const { clustering } = biomeDef.assets.trees;

    // Usar ruido normalizado para determinar si es una zona de clustering
    const clusterNoise = this.noiseGen.normalizedNoise(x * 0.1, y * 0.1);
    const inCluster = clusterNoise > 0.5 - clustering * 0.3;

    let treeAssets = biomeDef.assets.trees.primary || [];

    // En clusters, usar más variety; fuera de clusters, usar árboles raros ocasionalmente
    if (!inCluster && Math.random() < 0.05) {
      const rareAssets = biomeDef.assets.trees.rare || [];
      treeAssets = [...treeAssets, ...rareAssets];
    }

    // Si no hay assets disponibles, usar fallbacks del bioma
    if (treeAssets.length === 0) {
      logAutopoiesis.debug(
        "⚠️ No hay assets de árboles para bioma, usando fallback",
        {
          biome: biomeDef.id,
        },
      );
      treeAssets = this.getDefaultVegetationAssets(biomeDef.id);
    }

    const selectedAsset = this.selectAsset(treeAssets);

    // Fallback final si selectAsset retorna null
    if (!selectedAsset && treeAssets.length > 0) {
      logAutopoiesis.warn(
        "⚠️ selectAsset retornó null, usando primer asset disponible",
        {
          biome: biomeDef.id,
          availableAssets: treeAssets,
        },
      );
      return treeAssets[0];
    }

    return selectedAsset;
  }

  /**
   * Genera capas de renderizado para assets
   */
  private generateAssetLayers(terrain: TerrainTile[][]): WorldLayer[] {
    const layers: WorldLayer[] = [
      { name: "terrain", zIndex: 0, tiles: [] },
      { name: "decals", zIndex: 1, tiles: [] },
      { name: "vegetation", zIndex: 2, tiles: [] },
      { name: "props", zIndex: 3, tiles: [] },
      { name: "structures", zIndex: 4, tiles: [] },
    ];

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const tile = terrain[y][x];
        const pixelX = x * this.config.tileSize;
        const pixelY = y * this.config.tileSize;

        // Terreno base
        if (tile.assets.terrain) {
          layers[0].tiles.push({
            x: pixelX,
            y: pixelY,
            asset: `assets/terrain/base/${tile.assets.terrain}`,
          });
        }

        // Decals
        for (const decal of tile.assets.decals) {
          layers[1].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.5,
            y: pixelY + Math.random() * this.config.tileSize * 0.5,
            asset: `assets/decals/${decal}`,
            alpha: 0.7,
          });
        }

        // Vegetación
        for (const veg of tile.assets.vegetation) {
          layers[2].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.7,
            y: pixelY + Math.random() * this.config.tileSize * 0.7,
            asset: `assets/foliage/trees/${veg}`,
          });
        }

        // Props
        for (const prop of tile.assets.props) {
          layers[3].tiles.push({
            x: pixelX + Math.random() * this.config.tileSize * 0.8,
            y: pixelY + Math.random() * this.config.tileSize * 0.8,
            asset: `assets/animated_entities/${prop}`,
          });
        }

        // Estructuras
        for (const structure of tile.assets.structures) {
          layers[4].tiles.push({
            x: pixelX,
            y: pixelY,
            asset: `assets/structures/estructuras_completas/${structure}`,
          });
        }
      }
    }

    this.addSurfaceWater(layers, terrain);

    return layers;
  }

  /**
   * Obtiene un asset de terreno por defecto para un bioma específico
   */
  private getDefaultTerrainAsset(biome: BiomeType): string {
    const defaultAssets = {
      [BiomeType.GRASSLAND]: "cesped1.png",
      [BiomeType.FOREST]: "cesped11.png",
      [BiomeType.MYSTICAL]: "cesped21.png",
      [BiomeType.WETLAND]: "cesped1.png",
      [BiomeType.MOUNTAINOUS]: "cesped15.png",
      [BiomeType.VILLAGE]: "cesped1.png",
    };

    const defaultAsset = defaultAssets[biome];
    if (!defaultAsset) {
      logAutopoiesis.warn("⚠️ Bioma desconocido, usando fallback universal", {
        biome,
        fallback: "cesped1.png",
      });
      return "cesped1.png";
    }

    return defaultAsset;
  }

  /**
   * Obtiene assets de fallback para vegetación cuando el bioma no tiene assets válidos
   */
  private getDefaultVegetationAssets(biome: BiomeType): string[] {
    const defaultVegetation = {
      [BiomeType.GRASSLAND]: ["oak_tree.png"],
      [BiomeType.FOREST]: ["tree_emerald_1.png", "oak_tree.png"],
      [BiomeType.MYSTICAL]: ["luminous_tree1.png"],
      [BiomeType.WETLAND]: ["willow1.png"],
      [BiomeType.MOUNTAINOUS]: ["mega_tree1.png"],
      [BiomeType.VILLAGE]: ["oak_tree.png"],
    };

    return defaultVegetation[biome] || ["oak_tree.png"];
  }

  /**
   * Inserta una capa de agua (lagos/estanques) usando humedad alta y elevación baja.
   * Esto añade diversidad visible (agua) incluso cuando los biomas asignados son pradera.
   */
  private addSurfaceWater(
    layers: WorldLayer[],
    terrain: TerrainTile[][],
  ): void {
    const waterLayer: WorldLayer = { name: "water", zIndex: 0.5, tiles: [] };

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const t = terrain[y][x];
        // Condición simple: humedad muy alta y elevación baja
        if (t.moisture > 0.8 && t.elevation < 0.3) {
          const pixelX = x * this.config.tileSize;
          const pixelY = y * this.config.tileSize;
          waterLayer.tiles.push({
            x: pixelX,
            y: pixelY,
            asset: "assets/water/Water_Middle.png",
          });
        }
      }
    }

    if (waterLayer.tiles.length > 0) {
      // Insertar agua entre terreno (0) y decals (1)
      layers.splice(1, 0, waterLayer);
    }
  }

  /**
   * Calcula la distribución de biomas en el mapa
   */
  private calculateBiomeDistribution(
    biomeMap: BiomeType[][],
  ): Record<BiomeType, number> {
    const distribution: Record<BiomeType, number> = {} as Record<
      BiomeType,
      number
    >;
    const total = this.config.width * this.config.height;

    // Inicializar contadores
    for (const biome of this.config.biomes.enabled) {
      distribution[biome] = 0;
    }

    // Contar tiles por bioma
    for (const row of biomeMap) {
      for (const biome of row) {
        distribution[biome]++;
      }
    }

    // Convertir a porcentajes
    for (const biome in distribution) {
      distribution[biome as BiomeType] =
        (distribution[biome as BiomeType] / total) * 100;
    }

    return distribution;
  }
}
