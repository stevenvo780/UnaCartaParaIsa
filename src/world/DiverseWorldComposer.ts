/**
 * Sistema de Composición de Mundo Diverso
 * Genera múltiples capas con máxima variación visual y distribución orgánica
 */

import { logAutopoiesis } from "../utils/logger";
import { CreativeAssetLoader, type AssetInfo } from "./CreativeAssetLoader";
import { NoiseUtils } from "./NoiseUtils";
import { BiomeType, GeneratedWorld } from "./types";

export interface PlacedAsset {
  asset: AssetInfo;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  tint: number;
  depth: number;
  metadata?: Record<string, unknown>;
}

export interface RenderLayer {
  type:
    | "terrain"
    | "transition"
    | "detail"
    | "vegetation"
    | "structure"
    | "props"
    | "effects";
  name: string;
  assets: PlacedAsset[];
  zIndex: number;
  visible: boolean;
}

export interface ClusterPoint {
  x: number;
  y: number;
  radius: number;
  biome: BiomeType;
  type:
    | "forest_grove"
    | "rock_formation"
    | "flower_meadow"
    | "mushroom_circle"
    | "ruins_site"
    | "water_feature";
  density: number;
}

export interface ComposedWorld {
  layers: RenderLayer[];
  clusters: ClusterPoint[];
  stats: {
    totalAssets: number;
    diversityIndex: number;
    clusterCount: number;
    layerCount: number;
    compositionTime: number;
  };
}

export class DiverseWorldComposer {
  private noise: NoiseUtils;
  private assetLoader: CreativeAssetLoader;
  private assetPool: Map<string, AssetInfo[]> = new Map();
  private world: GeneratedWorld;

  constructor(scene: Phaser.Scene, seed: string) {
    this.noise = new NoiseUtils(seed);
    this.assetLoader = new CreativeAssetLoader(scene);
  }

  /**
   * Compone un mundo con máxima diversidad usando sistema de capas
   */
  async composeWorld(world: GeneratedWorld): Promise<ComposedWorld> {
    this.world = world;

    logAutopoiesis.info("🎨 Iniciando composición de mundo diverso...");
    console.log("🎯 Starting world composition...");
    const startTime = Date.now();

    // Cargar y organizar todos los assets disponibles
    console.log("🎯 About to load and organize assets...");
    await this.loadAndOrganizeAssets();
    console.log("🎯 Assets loaded and organized!");

    const layers: RenderLayer[] = [];

    // 1. Capa base - Terreno con mezcla de texturas
    layers.push(await this.createTerrainLayer());

    // 2. Capa de transición - Suavizado entre biomas
    layers.push(await this.createTransitionLayer());

    // 3. Capa de detalles - Pequeñas decoraciones distribuidas
    layers.push(await this.createDetailLayer());

    // 4. Capa de vegetación - Clusters orgánicos de plantas/árboles
    layers.push(await this.createVegetationLayer());

    // 5. Capa de estructuras - Edificios y ruinas
    layers.push(await this.createStructureLayer());

    // 6. Capa de props - Objetos interactivos
    layers.push(await this.createPropsLayer());

    // 7. Capa de efectos - Detalles atmosféricos
    layers.push(await this.createEffectsLayer());

    const clusters = this.generateClusterPoints(50); // 50 clusters únicos
    const stats = this.calculateDiversityStats(layers);

    const compositionTime = Date.now() - startTime;

    const totalCompositionTime = Date.now() - startTime;

    logAutopoiesis.info("✅ Composición de mundo completada", {
      time: `${totalCompositionTime}ms`,
      layers: layers.length,
      totalAssets: stats.totalAssets,
      diversityIndex: stats.diversityIndex.toFixed(2),
      clusters: clusters.length,
    });

    const finalStats = {
      ...stats,
      compositionTime: totalCompositionTime,
    };

    return { layers, clusters, stats: finalStats };
  }

  /**
   * Carga y organiza todos los assets por tipo y rareza
   */
  private async loadAndOrganizeAssets(): Promise<void> {
    console.log("🎯 Calling assetLoader.loadAllAssets()...");
    await this.assetLoader.loadAllAssets();
    console.log("🎯 assetLoader.loadAllAssets() completed!");

    // Organizar assets por categorías amplias
    const categories = [
      "terrain",
      "water",
      "tree",
      "foliage",
      "rock",
      "mushroom",
      "structure",
      "prop",
      "ruin",
      "decoration",
    ];

    for (const category of categories) {
      const assets = this.assetLoader
        .getAllAssets()
        .filter(
          (asset) => asset.type === category || asset.key.includes(category),
        );

      this.assetPool.set(category, this.shuffleArray(assets));
    }

    logAutopoiesis.info("📦 Assets organizados", {
      totalCategories: this.assetPool.size,
      totalAssets: this.assetLoader.getTotalAssetsCount(),
    });
  }

  /**
   * Crea capa de terreno con variaciones orgánicas
   */
  private async createTerrainLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const terrainAssets = this.assetPool.get("terrain") || [];

    if (terrainAssets.length === 0) {
      logAutopoiesis.warn("No terrain assets available");
      return {
        type: "terrain",
        name: "Terrain",
        assets: [],
        zIndex: 0,
        visible: true,
      };
    }

    // Crear base terrain con cobertura completa - usar índices de tiles directamente
    const tileSize = this.world.config.tileSize || 32;

    for (let tileY = 0; tileY < this.world.config.height; tileY++) {
      for (let tileX = 0; tileX < this.world.config.width; tileX++) {
        if (
          this.world.terrain &&
          this.world.terrain[tileY] &&
          this.world.terrain[tileY][tileX]
        ) {
          const tile = this.world.terrain[tileY][tileX];
          const biome = tile.biome;

          // Posición en píxeles
          const x = tileX * tileSize;
          const y = tileY * tileSize;

          // Seleccionar asset usando ruido orgánico
          const assetIndex = this.getOrganicIndex(x, y, terrainAssets.length);
          const asset = terrainAssets[assetIndex];

          // Añadir variaciones sutiles
          const variation = this.noise.noise2D(x * 0.01, y * 0.01);
          const scale = 1.0 + variation * 0.1; // ±10% variación
          const tint = this.getBiomeTint(biome, variation);

          assets.push({
            asset,
            x,
            y,
            scale,
            rotation: 0,
            tint,
            depth: y,
            metadata: { biome, tileX, tileY },
          });
        }
      }
    }

    return {
      type: "terrain",
      name: "Terrain Base",
      assets,
      zIndex: 0,
      visible: true,
    };
  }

  /**
   * Crea capa de vegetación con clusters naturales
   */
  private async createVegetationLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const clusters = this.generateVegetationClusters(200);

    const treeAssets = this.assetPool.get("tree") || [];
    const foliageAssets = this.assetPool.get("foliage") || [];
    let allVegetation = [...treeAssets, ...foliageAssets];

    // Si no hay assets cargados, usar fallbacks básicos
    if (allVegetation.length === 0) {
      logAutopoiesis.warn("No vegetation assets available, using fallbacks");
      allVegetation = [
        { key: "oak_tree1", path: "", type: "tree" as const },
        { key: "bush_emerald_1", path: "", type: "foliage" as const },
      ];
    }

    for (const cluster of clusters) {
      const clusterAssets = this.getClusterAssets(cluster.type, allVegetation);
      const density = 8 + Math.random() * 15; // 8-23 items por cluster

      for (let i = 0; i < density; i++) {
        // Distribución gaussiana alrededor del centro del cluster
        const angle = Math.random() * Math.PI * 2;
        const distance = this.gaussianRandom() * cluster.radius * 0.8;

        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;

        // Verificar que esté dentro de los límites
        if (
          x < 0 ||
          y < 0 ||
          x > this.world.config.width ||
          y > this.world.config.height
        ) {
          continue;
        }

        // Selección ponderada por rareza
        const asset = this.weightedRandomSelect(clusterAssets);
        if (!asset) continue; // Skip if no assets available
        if (!asset) continue; // Skip if no assets available

        // Variaciones naturales
        const scale = 1.5 + Math.random() * 1.0; // 1.5x - 2.5x
        const rotation = Math.random() * Math.PI * 2;
        const tint = this.getVariationTint(cluster.biome);

        assets.push({
          asset,
          x,
          y,
          scale,
          rotation,
          tint,
          depth: y + Math.random() * 10, // Pequeña variación en depth
          metadata: {
            clusterId: cluster.type,
            clusterCenter: { x: cluster.x, y: cluster.y },
          },
        });
      }
    }

    return {
      type: "vegetation",
      name: "Vegetation Clusters",
      assets,
      zIndex: 2,
      visible: true,
    };
  }

  /**
   * Crea capa de estructuras (ruinas, edificios)
   */
  private async createStructureLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const structureAssets = this.assetPool.get("structure") || [];
    const ruinAssets = this.assetPool.get("ruin") || [];
    let allStructures = [...structureAssets, ...ruinAssets];

    // Si no hay assets cargados, usar fallbacks básicos
    if (allStructures.length === 0) {
      logAutopoiesis.warn("No structure assets available, using fallbacks");
      allStructures = [
        { key: "house", path: "", type: "structure" as const },
        { key: "blue-gray_ruins1", path: "", type: "ruin" as const },
      ];
    }

    // Generar estructuras en ubicaciones estratégicas
    const structureClusters = this.generateStructureClusters(50);

    for (const cluster of structureClusters) {
      const clusterAssets = this.getClusterAssets(cluster.type, allStructures);
      const structureCount = 1 + Math.floor(Math.random() * 3); // 1-3 estructuras por cluster

      for (let i = 0; i < structureCount; i++) {
        const angle = (i / structureCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = Math.random() * cluster.radius * 0.5;

        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;

        if (
          x < 50 ||
          y < 50 ||
          x > this.world.config.width - 50 ||
          y > this.world.config.height - 50
        ) {
          continue;
        }

        const asset = this.weightedRandomSelect(clusterAssets);
        if (!asset) continue; // Skip if no assets available

        assets.push({
          asset,
          x,
          y,
          scale: 2.0 + Math.random() * 1.0,
          rotation: Math.random() * Math.PI * 2,
          tint: this.getStructureTint(cluster.biome),
          depth: y + 100, // Estructuras por encima de vegetación
          metadata: {
            structureType: cluster.type,
            biome: cluster.biome,
          },
        });
      }
    }

    return {
      type: "structure",
      name: "Structures & Ruins",
      assets,
      zIndex: 3,
      visible: true,
    };
  }

  /**
   * Crea capa de detalles pequeños distribuidos
   */
  private async createDetailLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const rockAssets = this.assetPool.get("rock") || [];
    const mushroomAssets = this.assetPool.get("mushroom") || [];
    const decorationAssets = this.assetPool.get("decoration") || [];
    const allDetails = [...rockAssets, ...mushroomAssets, ...decorationAssets];

    if (allDetails.length === 0) {
      logAutopoiesis.warn("No detail assets available, using fallbacks");
      allDetails.push(
        { key: "rock1_1", path: "", type: "rock" as const },
        { key: "beige_green_mushroom1", path: "", type: "mushroom" as const },
        { key: "chest", path: "", type: "decoration" as const },
      );
    }

    // Distribución orgánica de detalles
    const detailDensity = 0.02; // 2% de tiles
    const totalTiles =
      (this.world.config.width / 32) * (this.world.config.height / 32);
    const targetCount = Math.floor(totalTiles * detailDensity);

    for (let i = 0; i < targetCount; i++) {
      // Convertir de tiles a píxeles para coincidir con terreno
      const x = Math.random() * this.world.config.width * 32;
      const y = Math.random() * this.world.config.height * 32;

      // Usar ruido para crear agrupaciones naturales
      const clusterNoise = this.noise.noise2D(x * 0.01, y * 0.01);
      const shouldPlace = clusterNoise > 0.2; // Solo en áreas "positivas" del ruido

      if (shouldPlace) {
        const asset = this.weightedRandomSelect(allDetails);
        if (!asset) continue; // Skip if no assets available

        assets.push({
          asset,
          x,
          y,
          scale: 1.2 + Math.random() * 0.8,
          rotation: Math.random() * Math.PI * 2,
          tint: 0xffffff,
          depth: y - 5, // Ligeramente por debajo de vegetación
          metadata: { type: "scattered_detail" },
        });
      }
    }

    return {
      type: "detail",
      name: "Scattered Details",
      assets,
      zIndex: 1,
      visible: true,
    };
  }

  /**
   * Placeholder para otras capas
   */
  private async createTransitionLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const transitionAssets = this.assetPool.get("foliage") || [];

    if (transitionAssets.length === 0) {
      return {
        type: "transition",
        name: "Biome Transitions",
        assets: [],
        zIndex: 0.5,
        visible: true,
      };
    }

    // Detectar bordes entre biomas para crear transiciones naturales
    const tileSize = this.world.config.tileSize;
    const worldWidth = Math.floor(this.world.config.width / tileSize);
    const worldHeight = Math.floor(this.world.config.height / tileSize);

    for (let y = 1; y < worldHeight - 1; y++) {
      for (let x = 1; x < worldWidth - 1; x++) {
        if (!this.world.terrain?.[y]?.[x]) continue;

        const currentBiome = this.world.terrain[y][x].biome;
        const neighbors = [
          this.world.terrain[y - 1]?.[x]?.biome,
          this.world.terrain[y + 1]?.[x]?.biome,
          this.world.terrain[y]?.[x - 1]?.biome,
          this.world.terrain[y]?.[x + 1]?.biome,
        ].filter(Boolean);

        // Si hay biomas diferentes en vecinos, añadir elementos de transición
        const hasDifferentBiome = neighbors.some(
          (biome) => biome !== currentBiome,
        );

        if (hasDifferentBiome && Math.random() < 0.25) {
          // 25% probabilidad
          const asset = this.weightedRandomSelect(transitionAssets);
          if (!asset) continue; // Skip if no assets available

          if (asset) {
            // Posición con variación orgánica
            const baseX = x * tileSize;
            const baseY = y * tileSize;
            const offsetX = (Math.random() - 0.5) * tileSize * 0.8;
            const offsetY = (Math.random() - 0.5) * tileSize * 0.8;

            assets.push({
              asset,
              x: baseX + offsetX,
              y: baseY + offsetY,
              scale: 1.0 + Math.random() * 0.5,
              rotation: Math.random() * Math.PI * 2,
              tint: this.getTransitionTint(
                currentBiome,
                neighbors[0] || currentBiome,
              ),
              depth: baseY + offsetY,
              metadata: {
                transitionBetween: [currentBiome, neighbors[0]],
                type: "biome_transition",
              },
            });
          }
        }
      }
    }

    return {
      type: "transition",
      name: "Biome Transitions",
      assets,
      zIndex: 0.5,
      visible: true,
    };
  }

  private async createPropsLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const propAssets = this.assetPool.get("prop") || [];

    if (propAssets.length === 0) {
      return {
        type: "props",
        name: "Interactive Props",
        assets: [],
        zIndex: 4,
        visible: true,
      };
    }

    // Props dispersos por el mundo basado en biomas
    const scatteredCount = Math.floor(
      (this.world.config.width * this.world.config.height) / 500,
    );

    for (let i = 0; i < scatteredCount; i++) {
      const x = 100 + Math.random() * (this.world.config.width * 32 - 200);
      const y = 100 + Math.random() * (this.world.config.height * 32 - 200);

      // Solo en áreas apropiadas (no en agua)
      const biome = this.getBiomeAtPosition(x, y);
      if (biome !== BiomeType.WETLAND) {
        const asset = this.weightedRandomSelect(propAssets);
        if (!asset) continue; // Skip if no assets available

        if (asset) {
          assets.push({
            asset,
            x,
            y,
            scale: 1.5 + Math.random() * 1.0,
            rotation: Math.random() * Math.PI * 2,
            tint: this.getBiomeTint(biome, 0),
            depth: y + 25,
            metadata: {
              type: "scattered_prop",
              biome: biome,
              interactive: Math.random() < 0.4, // 40% son interactivos
            },
          });
        }
      }
    }

    return {
      type: "props",
      name: "Interactive Props",
      assets,
      zIndex: 4,
      visible: true,
    };
  }

  private async createEffectsLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];

    // Efectos de agua (ondas, burbujas)
    const waterEffects = this.assetPool.get("decal") || [];

    // Add fallback water effects if none available
    if (waterEffects.length === 0) {
      logAutopoiesis.warn(
        "No water effects available, using fallback water sprite",
      );
      waterEffects.push({
        key: "water_middle",
        path: "",
        type: "water" as const,
      });
    }

    if (waterEffects.length > 0) {
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * this.world.config.width * 32;
        const y = Math.random() * this.world.config.height * 32;

        const biome = this.getBiomeAtPosition(x, y);
        if (biome === BiomeType.WETLAND) {
          const effect = this.weightedRandomSelect(waterEffects);
          if (!effect) continue; // Skip if no effects available
          if (effect) {
            assets.push({
              asset: effect,
              x,
              y,
              scale: 0.3 + Math.random() * 0.4,
              rotation: Math.random() * Math.PI * 2,
              tint: 0x88ddff,
              depth: y - 10,
              metadata: {
                type: "water_effect",
                animated: true,
                duration: 2000 + Math.random() * 3000,
              },
            });
          }
        }
      }
    }

    // Partículas de luz en bosques
    const lightEffects = this.assetPool.get("sprite") || [];

    // Add fallback light effects if none available
    if (lightEffects.length === 0) {
      logAutopoiesis.warn(
        "No light effects available, using fallback bush sprite",
      );
      lightEffects.push({
        key: "bush_emerald_1",
        path: "",
        type: "foliage" as const,
      });
    }

    if (lightEffects.length > 0) {
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * this.world.config.width * 32;
        const y = Math.random() * this.world.config.height * 32;

        const biome = this.getBiomeAtPosition(x, y);
        if (biome === BiomeType.FOREST) {
          const effect = this.weightedRandomSelect(lightEffects);
          if (!effect) continue; // Skip if no effects available
          if (effect) {
            assets.push({
              asset: effect,
              x,
              y,
              scale: 0.1 + Math.random() * 0.2,
              rotation: 0,
              tint: 0xffffaa,
              depth: y + 100,
              metadata: {
                type: "light_particle",
                animated: true,
                float: true,
              },
            });
          }
        }
      }
    }

    return {
      type: "effects",
      name: "Atmospheric Effects",
      assets,
      zIndex: 5,
      visible: true,
    };
  }

  // ==========================================
  // UTILIDADES DE DISTRIBUCIÓN Y SELECCIÓN
  // ==========================================

  /**
   * Selección con ruido Perlin para variación orgánica
   */
  private getOrganicIndex(x: number, y: number, arrayLength: number): number {
    if (arrayLength === 0) return 0;

    // Múltiples octavas de ruido para selección más orgánica
    const noise1 = this.noise.noise2D(x * 0.1, y * 0.1);
    const noise2 = this.noise.noise2D(x * 0.05, y * 0.05) * 0.5;
    const noise3 = this.noise.noise2D(x * 0.2, y * 0.2) * 0.25;

    const combined = (noise1 + noise2 + noise3 + 2) / 3.5; // Normalizar a 0-1
    return Math.floor(combined * arrayLength);
  }

  /**
   * Selección ponderada por rareza
   */
  private weightedRandomSelect(assets: AssetInfo[]): AssetInfo | null {
    if (assets.length === 0) {
      logAutopoiesis.warn("⚠️ No assets available for selection");
      return null;
    }

    if (assets.length === 1) return assets[0];

    const weights = assets.map((asset) => {
      switch (asset.rarity) {
        case "common":
          return 100;
        case "uncommon":
          return 40;
        case "rare":
          return 15;
        case "epic":
          return 5;
        default:
          return 60;
      }
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < assets.length; i++) {
      random -= weights[i];
      if (random <= 0) return assets[i];
    }

    return assets[0];
  }

  /**
   * Distribución gaussiana para clusters naturales
   */
  private gaussianRandom(): number {
    // Box-Muller transform para distribución normal
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(1, (z0 + 3) / 6)); // Normalizar a 0-1
  }

  /**
   * Genera puntos de cluster para vegetación
   */
  private generateVegetationClusters(count: number): ClusterPoint[] {
    const clusters: ClusterPoint[] = [];
    const minDistance =
      Math.sqrt((this.world.config.width * this.world.config.height) / count) *
      0.6;

    for (let attempt = 0; attempt < count * 3; attempt++) {
      const x = 100 + Math.random() * (this.world.config.width * 32 - 200);
      const y = 100 + Math.random() * (this.world.config.height * 32 - 200);

      // Verificar distancia mínima con otros clusters
      const tooClose = clusters.some(
        (cluster) => Math.hypot(cluster.x - x, cluster.y - y) < minDistance,
      );

      if (!tooClose) {
        const biome = this.getBiomeAtPosition(x, y);
        const clusterType = this.selectVegetationClusterType(biome);

        clusters.push({
          x,
          y,
          radius: 80 + Math.random() * 120, // 80-200 radio
          biome,
          type: clusterType,
          density: 0.6 + Math.random() * 0.4,
        });

        if (clusters.length >= count) break;
      }
    }

    return clusters;
  }

  /**
   * Genera clusters para estructuras
   */
  private generateStructureClusters(count: number): ClusterPoint[] {
    const clusters: ClusterPoint[] = [];
    const minDistance =
      Math.sqrt((this.world.config.width * this.world.config.height) / count) *
      1.2;

    for (let attempt = 0; attempt < count * 4; attempt++) {
      const x = 150 + Math.random() * (this.world.config.width * 32 - 300);
      const y = 150 + Math.random() * (this.world.config.height * 32 - 300);

      const tooClose = clusters.some(
        (cluster) => Math.hypot(cluster.x - x, cluster.y - y) < minDistance,
      );

      if (!tooClose) {
        const biome = this.getBiomeAtPosition(x, y);

        clusters.push({
          x,
          y,
          radius: 150 + Math.random() * 100,
          biome,
          type: "ruins_site",
          density: 0.3 + Math.random() * 0.4,
        });

        if (clusters.length >= count) break;
      }
    }

    return clusters;
  }

  /**
   * Genera todos los puntos de cluster
   */
  private generateClusterPoints(count: number): ClusterPoint[] {
    const vegetationClusters = this.generateVegetationClusters(
      Math.floor(count * 0.7),
    );
    const structureClusters = this.generateStructureClusters(
      Math.floor(count * 0.3),
    );

    return [...vegetationClusters, ...structureClusters];
  }

  // ==========================================
  // UTILIDADES DE ASSETS Y TINTS
  // ==========================================

  private getClusterAssets(
    clusterType: string,
    allAssets: AssetInfo[],
  ): AssetInfo[] {
    // Filtrar assets apropiados para el tipo de cluster
    switch (clusterType) {
      case "forest_grove":
        return allAssets.filter(
          (asset) =>
            asset.key.includes("tree") ||
            asset.key.includes("oak") ||
            asset.key.includes("emerald"),
        );
      case "rock_formation":
        return allAssets.filter(
          (asset) => asset.key.includes("rock") || asset.key.includes("stone"),
        );
      case "flower_meadow":
        return allAssets.filter(
          (asset) =>
            asset.key.includes("flower") ||
            asset.key.includes("bush") ||
            asset.key.includes("grass"),
        );
      case "mushroom_circle":
        return allAssets.filter((asset) => asset.key.includes("mushroom"));
      case "ruins_site":
        return allAssets.filter(
          (asset) =>
            asset.key.includes("ruin") ||
            asset.key.includes("house") ||
            asset.key.includes("structure"),
        );
      default:
        return allAssets.slice(0, Math.min(10, allAssets.length));
    }
  }

  private selectVegetationClusterType(biome: BiomeType): ClusterPoint["type"] {
    const random = Math.random();

    switch (biome) {
      case BiomeType.FOREST:
        return random < 0.7 ? "forest_grove" : "mushroom_circle";
      case BiomeType.GRASSLAND:
        return random < 0.6 ? "flower_meadow" : "forest_grove";
      case BiomeType.MOUNTAINOUS:
        return "rock_formation";
      case BiomeType.MYSTICAL:
        return "rock_formation";
      default:
        return "forest_grove";
    }
  }

  private getBiomeAtPosition(x: number, y: number): BiomeType {
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    if (
      this.world.terrain &&
      this.world.terrain[tileY] &&
      this.world.terrain[tileY][tileX]
    ) {
      return this.world.terrain[tileY][tileX].biome;
    }

    return BiomeType.GRASSLAND; // fallback
  }

  private getBiomeTint(biome: BiomeType, variation: number): number {
    const baseTints: Record<BiomeType, number> = {
      [BiomeType.GRASSLAND]: 0x90ee90,
      [BiomeType.FOREST]: 0x228b22,
      [BiomeType.WETLAND]: 0x87ceeb,
      [BiomeType.MOUNTAINOUS]: 0x696969,
      [BiomeType.MYSTICAL]: 0xf4a460,
      [BiomeType.VILLAGE]: 0xdeb887,
    };

    const baseTint = baseTints[biome] || 0xffffff;

    // Aplicar variación sutil
    const r = (baseTint >> 16) & 0xff;
    const g = (baseTint >> 8) & 0xff;
    const b = baseTint & 0xff;

    const factor = 1 + variation * 0.1; // ±10% variación

    const newR = Math.min(255, Math.max(0, Math.floor(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.floor(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.floor(b * factor)));

    return (newR << 16) | (newG << 8) | newB;
  }

  private getVariationTint(biome: BiomeType): number {
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variación
    return this.getBiomeTint(biome, variation);
  }

  private getTransitionTint(fromBiome: BiomeType, toBiome: BiomeType): number {
    // Crear tint de transición mezclando dos biomas
    const fromTint = this.getBiomeTint(fromBiome, 0);
    const toTint = this.getBiomeTint(toBiome, 0);

    // Extraer componentes RGB
    const fromR = (fromTint >> 16) & 0xff;
    const fromG = (fromTint >> 8) & 0xff;
    const fromB = fromTint & 0xff;

    const toR = (toTint >> 16) & 0xff;
    const toG = (toTint >> 8) & 0xff;
    const toB = toTint & 0xff;

    // Mezcla 50/50
    const mixR = Math.floor((fromR + toR) / 2);
    const mixG = Math.floor((fromG + toG) / 2);
    const mixB = Math.floor((fromB + toB) / 2);

    return (mixR << 16) | (mixG << 8) | mixB;
  }

  private getStructureTint(biome: BiomeType): number {
    // Estructuras con tints más neutros pero adaptados al bioma
    const structureTints: Record<BiomeType, number> = {
      [BiomeType.GRASSLAND]: 0xf5f5dc, // Beige
      [BiomeType.FOREST]: 0x8b4513, // SaddleBrown
      [BiomeType.WETLAND]: 0x708090, // SlateGray
      [BiomeType.MOUNTAINOUS]: 0x696969, // DimGray
      [BiomeType.MYSTICAL]: 0xd2b48c, // Tan
      [BiomeType.VILLAGE]: 0xdeb887, // BurlyWood
    };

    return structureTints[biome] || 0xffffff;
  }

  // ==========================================
  // UTILIDADES GENERALES
  // ==========================================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateDiversityStats(layers: RenderLayer[]) {
    const totalAssets = layers.reduce(
      (sum, layer) => sum + layer.assets.length,
      0,
    );
    const uniqueAssets = new Set();

    layers.forEach((layer) => {
      layer.assets.forEach((placedAsset) => {
        uniqueAssets.add(placedAsset.asset.key);
      });
    });

    const diversityIndex = uniqueAssets.size / Math.max(1, totalAssets);

    return {
      totalAssets,
      diversityIndex,
      clusterCount: 0, // Se actualizará externamente
      layerCount: layers.length,
    };
  }
}
