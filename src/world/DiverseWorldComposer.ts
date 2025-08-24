/**
 * Sistema de Composición de Mundo Diverso
 * Genera múltiples capas con máxima variación visual y distribución orgánica
 */

import { logAutopoiesis } from "../utils/logger";
import { memoryManager } from "../utils/memoryManager";
import { CreativeAssetLoader, type AssetInfo } from "./CreativeAssetLoader";
import { NoiseUtils } from "./NoiseUtils";
import { BiomeType, GeneratedWorld } from "./types";
import {
  getSelectiveRotation,
  getOrganicOffset,
} from "./SelectiveRotationHelpers";

export interface PlacedAsset {
  asset: AssetInfo;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  tint: number;
  depth: number;
  metadata?: Record<string, unknown>;
  bounds?: { x: number; y: number; width: number; height: number };
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
    | "dense_forest"
    | "tree_line"
    | "rock_formation"
    | "flower_meadow"
    | "mushroom_circle"
    | "ruins_site"
    | "water_feature"
    | "village_settlement"
    | "city_district"
    | "market_square"
    | "residential_area"
    | "commercial_zone"
    | "park_area";
  density: number;
  occupiedPositions?: Array<{ x: number; y: number; radius: number }>;
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
  private vegetationAssets: Map<string, AssetInfo[]> = new Map();
  private buildingAssets: Map<string, AssetInfo[]> = new Map();
  private world: GeneratedWorld;
  private placedAssets: PlacedAsset[] = [];
  private occupiedZones: Array<{ x: number; y: number; radius: number; type: string }> = [];

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
    logAutopoiesis.debug("🎯 Starting world composition...");
    const startTime = Date.now();

    // Cargar y organizar todos los assets disponibles
    logAutopoiesis.debug("🎯 About to load and organize assets...");
    await this.loadAndOrganizeAssets();
    logAutopoiesis.debug("🎯 Assets loaded and organized!");

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

    const clusters = this.generateClusterPoints(Math.floor(50 * 1.7)); // 85 clusters total (+70% densidad)
    const stats = this.calculateDiversityStats(layers);

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
    logAutopoiesis.debug("🎯 Calling assetLoader.loadAllAssets()...");
    await this.assetLoader.loadAllAssets();
    logAutopoiesis.debug("🎯 assetLoader.loadAllAssets() completed!");

    // Separar assets en vegetación y edificaciones
    this.separateVegetationAndBuildings();
    
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

      // Debug simplificado
      if (assets.length > 0)
        logAutopoiesis.info(`📦 ${category}: ${assets.length} assets`);
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

    // Crear base terrain con cobertura completa usando streaming para memoria
    const tileSize = this.world.config.tileSize || 32;
    const totalTiles = this.world.config.height * this.world.config.width;

    // Verificar límites de memoria antes de procesar
    if (totalTiles > 100000) {
      // Más de 100k tiles
      logAutopoiesis.warn("Mundo muy grande, usando streaming para terrain", {
        totalTiles,
        dimensions: `${this.world.config.width}x${this.world.config.height}`,
      });

      return await this.generateTerrainLayerStreaming(terrainAssets, tileSize);
    }

    // Procesamiento normal para mundos pequeños
    for (let tileY = 0; tileY < this.world.config.height; tileY++) {
      for (let tileX = 0; tileX < this.world.config.width; tileX++) {
        if (
          this.world.terrain &&
          this.world.terrain[tileY] &&
          this.world.terrain[tileY][tileX]
        ) {
          const tile = this.world.terrain[tileY][tileX];
          const biome = tile.biome;

          // Posición en píxeles con ligera variación para naturalidad
          const baseX = tileX * tileSize;
          const baseY = tileY * tileSize;

          // Variación sutil para terreno (máximo 4px para mantener cobertura)
          const offsetX =
            (this.noise.noise2D(baseX * 0.01, baseY * 0.01) - 0.5) * 8;
          const offsetY =
            (this.noise.noise2D(baseX * 0.01 + 100, baseY * 0.01 + 100) - 0.5) *
            8;

          const x = baseX + offsetX;
          const y = baseY + offsetY;

          // Seleccionar asset usando ruido orgánico
          const assetIndex = this.getOrganicIndex(x, y, terrainAssets.length);
          const asset = terrainAssets[assetIndex];

          // Añadir variaciones sutiles para naturalidad
          const variation = this.noise.noise2D(x * 0.01, y * 0.01);
          const scale = 1.0 + variation * 0.15; // ±15% variación en tamaño
          const tint = this.getBiomeTint(biome, variation);

          // Sin rotación para tiles de terreno (se ven mal rotados)
          const rotation = 0;

          assets.push({
            asset,
            x,
            y,
            scale,
            rotation,
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
   * Separa assets en vegetación y edificaciones
   */
  private separateVegetationAndBuildings(): void {
    const allAssets = this.assetLoader.getAllAssets();
    
    // Separar vegetación
    const trees = allAssets.filter(asset => 
      asset.type === 'tree' || asset.key.includes('tree') || asset.key.includes('oak'));
    const foliage = allAssets.filter(asset => 
      asset.type === 'foliage' || asset.key.includes('bush') || asset.key.includes('grass'));
    const mushrooms = allAssets.filter(asset => 
      asset.type === 'mushroom' || asset.key.includes('mushroom'));
    
    this.vegetationAssets.set('trees', trees);
    this.vegetationAssets.set('foliage', foliage);
    this.vegetationAssets.set('mushrooms', mushrooms);
    
    // Separar edificaciones
    const structures = allAssets.filter(asset => 
      asset.type === 'structure' || asset.key.includes('house') || asset.key.includes('building'));
    const props = allAssets.filter(asset => 
      asset.type === 'prop' || asset.key.includes('chair') || asset.key.includes('table'));
    const ruins = allAssets.filter(asset => 
      asset.type === 'ruin' || asset.key.includes('ruin'));
    
    this.buildingAssets.set('structures', structures);
    this.buildingAssets.set('props', props);
    this.buildingAssets.set('ruins', ruins);
    
    logAutopoiesis.info('🌿 Assets separados:', {
      vegetation: {
        trees: trees.length,
        foliage: foliage.length, 
        mushrooms: mushrooms.length
      },
      buildings: {
        structures: structures.length,
        props: props.length,
        ruins: ruins.length
      }
    });
  }

  /**
   * Crea capa de vegetación con clusters naturales y zonas verdes densas
   */
  private async createVegetationLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    
    // Generar muchos más clusters con diferentes tipos (+70%)
    const forestClusters = this.generateVegetationClusters(Math.floor(8 * 1.7)); // 14 clusters de bosque
    const greenZones = this.generateGreenZones(Math.floor(5 * 1.7)); // 9 zonas verdes densas
    
    const treeAssets = this.vegetationAssets.get('trees') || [];
    const foliageAssets = this.vegetationAssets.get('foliage') || [];
    let allVegetation = [...treeAssets, ...foliageAssets];

    // Debug mejorado
    logAutopoiesis.info(
      `🌳 Vegetación mejorada: ${treeAssets.length} árboles, ${foliageAssets.length} arbustos`,
    );

    // Si no hay assets cargados, usar fallbacks básicos
    if (allVegetation.length === 0) {
      logAutopoiesis.warn("No vegetation assets available, using fallbacks");
      allVegetation = [
        { key: "oak_tree1", path: "", type: "tree" as const },
        { key: "bush_emerald_1", path: "", type: "foliage" as const },
      ];
    }

    // Procesar clusters de bosque con densidad aumentada
    for (const cluster of forestClusters) {
      const clusterAssets = this.getClusterAssets(cluster.type, allVegetation);
      const density = this.getDensityForCluster(cluster.type); // Densidad variable

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

        // Escalas diferentes para árboles vs arbustos con más variedad
        const scale = asset.key.includes("tree")
          ? 1.8 + Math.random() * 2.0 // 1.8x-3.8x para árboles (más variados)
          : 0.8 + Math.random() * 0.8; // 0.8x-1.6x para arbustos

        // Verificar anti-solapamiento con escala correcta
        if (this.wouldOverlap(x, y, asset, scale)) {
          continue;
        }

        const rotation = getSelectiveRotation("vegetation", asset.key);
        const tint = this.getVariationTint(cluster.biome);

        const placedAsset: PlacedAsset = {
          asset,
          x,
          y,
          scale,
          rotation,
          tint,
          depth: y + 10 + (asset.key.includes("tree") ? 50 : 0),
          bounds: this.calculateAssetBounds(x, y, scale, asset),
          metadata: {
            clusterId: cluster.type,
            clusterCenter: { x: cluster.x, y: cluster.y },
            assetType: 'vegetation'
          },
        };
        
        assets.push(placedAsset);
        this.placedAssets.push(placedAsset);
      }
    }

    // Procesar zonas verdes densas
    for (const greenZone of greenZones) {
      const zoneAssets = this.populateGreenZone(greenZone, treeAssets);
      assets.push(...zoneAssets);
    }

    logAutopoiesis.info(
      `🌳 Vegetación mejorada: ${assets.length} assets en ${forestClusters.length} clusters y ${greenZones.length} zonas verdes`,
    );

    return {
      type: "vegetation",
      name: "Vegetation Clusters",
      assets,
      zIndex: 2,
      visible: true,
    };
  }

  /**
   * Crea capa de estructuras mejorada con mejor separación de assets
   */
  private async createStructureLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    
    // Usar assets separados de edificaciones
    const structureAssets = this.buildingAssets.get('structures') || [];
    const ruinAssets = this.buildingAssets.get('ruins') || [];
    let allStructures = [...structureAssets, ...ruinAssets];

    // Si no hay assets cargados, usar fallbacks básicos
    if (allStructures.length === 0) {
      logAutopoiesis.warn("No structure assets available, using fallbacks");
      allStructures = [
        { key: "house", path: "", type: "structure" as const },
        { key: "blue-gray_ruins1", path: "", type: "ruin" as const },
      ];
    }

    // Generar muchos más clusters de estructuras con mayor densidad (+70%)
    const structureClusters = this.generateStructureClusters(Math.floor(12 * 1.7)); // 20 clusters
    const settlementClusters = this.generateSettlementClusters(Math.floor(8 * 1.7)); // 14 asentamientos

    // Registrar clusters como zonas ocupadas
    for (const cluster of structureClusters) {
      this.occupiedZones.push({
        x: cluster.x,
        y: cluster.y,
        radius: cluster.radius * 1.2, // Un poco más grande para buffer
        type: 'structure_cluster'
      });
    }
    
    for (const settlement of settlementClusters) {
      this.occupiedZones.push({
        x: settlement.x,
        y: settlement.y,
        radius: settlement.radius * 1.3,
        type: 'settlement'
      });
    }

    // Procesar clusters de estructuras tradicionales
    for (const cluster of structureClusters) {
      const clusterAssets = this.getClusterAssets(cluster.type, allStructures);
      const structureCount = this.getStructureCount(cluster.type);

      let placedInCluster = 0;
      let attempts = 0;
      const maxAttempts = structureCount * 3;

      while (placedInCluster < structureCount && attempts < maxAttempts) {
        attempts++;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * cluster.radius * 0.7;

        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;

        if (
          x < 50 ||
          y < 50 ||
          x > this.world.config.width * 32 - 50 ||
          y > this.world.config.height * 32 - 50
        ) {
          continue;
        }

        const asset = this.weightedRandomSelect(clusterAssets);
        if (!asset) continue;

        const scale = 1.2 + Math.random() * 1.0; // 1.2x-2.2x estructuras variadas
        
        // Verificar anti-solapamiento con escala correcta
        if (this.wouldOverlap(x, y, asset, scale)) {
          continue;
        }
        const rotation = getSelectiveRotation("structure", asset.key);
        const tint = this.getStructureTint(cluster.biome);

        const placedAsset: PlacedAsset = {
          asset,
          x,
          y,
          scale,
          rotation,
          tint,
          depth: y + 200,
          bounds: this.calculateAssetBounds(x, y, scale, asset),
          metadata: {
            structureType: cluster.type,
            biome: cluster.biome,
            assetType: 'building'
          },
        };

        assets.push(placedAsset);
        this.placedAssets.push(placedAsset);
        placedInCluster++;
      }
    }

    // Procesar asentamientos
    for (const settlement of settlementClusters) {
      const settlementAssets = this.populateSettlementStructures(settlement, structureAssets);
      assets.push(...settlementAssets);
    }

    logAutopoiesis.info(
      `🏠 Estructuras: ${assets.length} edificios en ${structureClusters.length} clusters y ${settlementClusters.length} asentamientos`,
    );

    return {
      type: "structure",
      name: "Buildings & Settlements",
      assets,
      zIndex: 3,
      visible: true,
    };
  }

  /**
   * Crea capa de detalles con mayor densidad y variedad
   */
  private async createDetailLayer(): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];
    const rockAssets = this.assetPool.get("rock") || [];
    const mushroomAssets = this.vegetationAssets.get('mushrooms') || [];
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

    // Aumentar muy significativamente la densidad de detalles (+70% adicional)
    const detailDensity = 0.25 * 1.7; // 42.5% de tiles (masiva densidad)
    const totalTiles = (this.world.config.width / 32) * (this.world.config.height / 32);
    const targetCount = Math.floor(totalTiles * detailDensity);

    let placedDetails = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 2;

    while (placedDetails < targetCount && attempts < maxAttempts) {
      attempts++;
      
      // Convertir de tiles a píxeles para coincidir con terreno
      const x = Math.random() * this.world.config.width * 32;
      const y = Math.random() * this.world.config.height * 32;

      // Usar ruido más permisivo para crear agrupaciones naturales
      const clusterNoise = this.noise.noise2D(x * 0.008, y * 0.008);
      const shouldPlace = clusterNoise > -0.1; // Más permisivo

      if (shouldPlace) {
        const asset = this.weightedRandomSelect(allDetails);
        if (!asset) continue;

        // Verificar anti-solapamiento con tolerancia para detalles pequeños
        const bounds = this.calculateAssetBounds(x, y, 1.0, asset);
        const tooClose = this.placedAssets.some(placedAsset => {
          if (!placedAsset.bounds) return false;
          const distance = Math.hypot(
            bounds.x - placedAsset.bounds.x,
            bounds.y - placedAsset.bounds.y
          );
          return distance < 20; // Menor distancia para detalles
        });

        if (tooClose) continue;

        const scale = 0.6 + Math.random() * 0.9; // 0.6x-1.5x (más variedad)
        const rotation = getSelectiveRotation("detail", asset.key);
        const tint = this.getDetailTint(asset.type || 'rock');

        const placedAsset: PlacedAsset = {
          asset,
          x,
          y,
          scale,
          rotation,
          tint,
          depth: y - 20,
          bounds: this.calculateAssetBounds(x, y, scale, asset),
          metadata: { 
            type: "scattered_detail",
            assetType: 'detail'
          },
        };

        assets.push(placedAsset);
        this.placedAssets.push(placedAsset);
        placedDetails++;
      }
    }

    logAutopoiesis.info(
      `🌿 Detalles: ${assets.length} elementos decorativos distribuidos`,
    );

    return {
      type: "detail",
      name: "Rich Details",
      assets,
      zIndex: 1,
      visible: true,
    };
  }

  /**
   * Obtiene tint para detalles según su tipo
   */
  private getDetailTint(assetType: string): number {
    switch (assetType) {
      case 'rock':
        return 0xf5f5f5; // Gris claro para rocas
      case 'mushroom':
        return 0xffefd5; // Papaya para hongos
      case 'decoration':
        return 0xffffff; // Blanco para decoraciones
      default:
        return 0xffffff;
    }
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

        if (hasDifferentBiome && Math.random() < 0.6) {
          // 60% probabilidad (más transiciones)
          const asset = this.weightedRandomSelect(transitionAssets);
          if (!asset) continue; // Skip if no assets available

          if (asset) {
            // Posición con variación orgánica
            const baseX = x * tileSize;
            const baseY = y * tileSize;
            const offset = getOrganicOffset(tileSize, "transition", asset.key);
            const offsetX = offset.x;
            const offsetY = offset.y;

            assets.push({
              asset,
              x: baseX + offsetX,
              y: baseY + offsetY,
              scale: 1.8 + Math.random() * 1.2, // 1.8x-3x (transiciones más visibles)
              rotation: getSelectiveRotation("transition", asset.key),
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

    // Separar assets urbanos de naturales
    const urbanAssets = propAssets.filter((asset) =>
      this.isUrbanAsset(asset.key),
    );
    const naturalAssets = propAssets.filter(
      (asset) => !this.isUrbanAsset(asset.key),
    );

    // 1. Generar asentamientos urbanos con mobiliario agrupado (+70%)
    const settlements = this.generateUrbanSettlements(Math.floor(2 * 1.7)); // 3 asentamientos urbanos
    for (const settlement of settlements) {
      const settlementAssets = this.populateSettlement(settlement, urbanAssets);
      assets.push(...settlementAssets);
    }

    // 2. Props naturales dispersos (solo en áreas sin asentamientos) (+70%)
    const naturalCount = Math.floor(
      ((this.world.config.width * this.world.config.height) / 25) * 1.7, // Mucha más densidad natural
    );

    for (let i = 0; i < naturalCount; i++) {
      const x = 100 + Math.random() * (this.world.config.width * 32 - 200);
      const y = 100 + Math.random() * (this.world.config.height * 32 - 200);

      // Solo props naturales fuera de asentamientos
      if (!this.isNearSettlement(x, y, settlements)) {
        const biome = this.getBiomeAtPosition(x, y);
        if (biome !== BiomeType.WETLAND) {
          const asset = this.weightedRandomSelect(naturalAssets);
          if (asset) {
            assets.push({
              asset,
              x,
              y,
              scale: 1.5 + Math.random() * 1.0, // Naturales más pequeños
              rotation: getSelectiveRotation("prop", asset.key),
              tint: this.getBiomeTint(biome, 0),
              depth: y + 25,
              metadata: {
                type: "natural_prop",
                biome: biome,
              },
            });
          }
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
      for (let i = 0; i < Math.floor(20 * 1.7); i++) { // 34 efectos de agua
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
              rotation: getSelectiveRotation("effect", effect.key),
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
      for (let i = 0; i < Math.floor(15 * 1.7); i++) { // 26 efectos de luz
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
   * Calcula la densidad según el tipo de cluster (aumentada 70%)
   */
  private getDensityForCluster(clusterType: string): number {
    const baseCount = (() => {
      switch (clusterType) {
        case 'dense_forest':
          return 12 + Math.floor(Math.random() * 8); // 12-20 árboles por cluster denso
        case 'forest_grove':
          return 6 + Math.floor(Math.random() * 6); // 6-12 árboles por bosquecillo
        case 'tree_line':
          return 8 + Math.floor(Math.random() * 4); // 8-12 árboles en línea
        case 'flower_meadow':
          return 15 + Math.floor(Math.random() * 10); // 15-25 flores/arbustos
        case 'mushroom_circle':
          return 8 + Math.floor(Math.random() * 4); // 8-12 hongos
        default:
          return 4 + Math.floor(Math.random() * 4); // 4-8 por defecto
      }
    })();
    
    // Aumentar 70% la densidad
    return Math.floor(baseCount * 1.7);
  }

  /**
   * Genera zonas verdes densas con muchos árboles
   */
  private generateGreenZones(count: number): ClusterPoint[] {
    const greenZones: ClusterPoint[] = [];
    const minDistance = Math.sqrt((this.world.config.width * this.world.config.height) / count) * 1.2;

    for (let attempt = 0; attempt < count * 4; attempt++) {
      const x = 150 + Math.random() * (this.world.config.width * 32 - 300);
      const y = 150 + Math.random() * (this.world.config.height * 32 - 300);

      const biome = this.getBiomeAtPosition(x, y);
      
      // Solo crear zonas verdes en biomas apropiados
      if (biome !== BiomeType.FOREST && biome !== BiomeType.GRASSLAND) continue;

      const tooClose = greenZones.some(
        (zone) => Math.hypot(zone.x - x, zone.y - y) < minDistance,
      );

      if (!tooClose) {
        greenZones.push({
          x,
          y,
          radius: 200 + Math.random() * 150, // Zonas más grandes: 200-350 radio
          biome,
          type: 'park_area',
          density: 0.9, // Alta densidad para zonas verdes
          occupiedPositions: []
        });

        if (greenZones.length >= count) break;
      }
    }

    return greenZones;
  }

  /**
   * Puebla una zona verde con árboles densos
   */
  private populateGreenZone(greenZone: ClusterPoint, treeAssets: AssetInfo[]): PlacedAsset[] {
    const assets: PlacedAsset[] = [];
    const treeCount = Math.floor((25 + Math.floor(Math.random() * 15)) * 1.7); // 43-68 árboles por zona (+70%)

    for (let i = 0; i < treeCount; i++) {
      // Distribución más densa hacia el centro
      const angle = Math.random() * Math.PI * 2;
      const distance = this.gaussianRandom() * greenZone.radius * 0.95;

      const x = greenZone.x + Math.cos(angle) * distance;
      const y = greenZone.y + Math.sin(angle) * distance;

      if (x < 0 || y < 0 || x > this.world.config.width * 32 || y > this.world.config.height * 32) {
        continue;
      }

      // Solo usar árboles para zonas verdes
      const trees = treeAssets.filter(asset => asset.key.includes('tree') || asset.type === 'tree');
      if (trees.length === 0) continue;

      const asset = this.weightedRandomSelect(trees);
      if (!asset) continue;

      const scale = 1.5 + Math.random() * 1.8; // Árboles grandes para zonas verdes
      
      // Verificar anti-solapamiento con escala correcta
      if (this.wouldOverlap(x, y, asset, scale)) {
        continue;
      }
      const rotation = getSelectiveRotation('vegetation', asset.key);
      const tint = this.getVariationTint(greenZone.biome);

      const placedAsset: PlacedAsset = {
        asset,
        x,
        y,
        scale,
        rotation,
        tint,
        depth: y + 60, // Árboles de zona verde más altos
        bounds: this.calculateAssetBounds(x, y, scale, asset),
        metadata: {
          zoneId: 'green_zone',
          zoneCenter: { x: greenZone.x, y: greenZone.y },
          assetType: 'vegetation'
        },
      };

      assets.push(placedAsset);
      this.placedAssets.push(placedAsset);
    }

    return assets;
  }

  /**
   * Genera puntos de cluster para vegetación mejorados
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
          density: 0.8 + Math.random() * 0.4, // Densidad aumentada en clusters
          occupiedPositions: []
        });

        if (clusters.length >= count) break;
      }
    }

    return clusters;
  }

  /**
   * Generar terrain layer usando streaming para mundos grandes
   */
  private async generateTerrainLayerStreaming(
    terrainAssets: AssetInfo[],
    tileSize: number,
  ): Promise<RenderLayer> {
    const assets: PlacedAsset[] = [];

    // Crear generador para procesar tiles en chunks
    const tileGenerator = function* (this: DiverseWorldComposer) {
      for (let tileY = 0; tileY < this.world.config.height; tileY++) {
        for (let tileX = 0; tileX < this.world.config.width; tileX++) {
          yield { tileX, tileY };
        }
      }
    }.bind(this);

    // Procesar tiles en chunks usando memoria manager
    const chunkProcessor = async (
      chunk: Array<{ tileX: number; tileY: number }>,
    ) => {
      const chunkAssets: PlacedAsset[] = [];

      for (const { tileX, tileY } of chunk) {
        if (
          this.world.terrain &&
          this.world.terrain[tileY] &&
          this.world.terrain[tileY][tileX]
        ) {
          const tile = this.world.terrain[tileY][tileX];
          const biome = tile.biome;

          // Posición en píxeles con ligera variación para naturalidad
          const baseX = tileX * tileSize;
          const baseY = tileY * tileSize;

          // Variación sutil para terreno (máximo 4px para mantener cobertura)
          const offsetX =
            (this.noise.noise2D(baseX * 0.01, baseY * 0.01) - 0.5) * 8;
          const offsetY =
            (this.noise.noise2D(baseX * 0.01 + 100, baseY * 0.01 + 100) - 0.5) *
            8;

          const x = baseX + offsetX;
          const y = baseY + offsetY;

          // Seleccionar asset usando ruido orgánico
          const assetIndex = this.getOrganicIndex(x, y, terrainAssets.length);
          const asset = terrainAssets[assetIndex];

          // Añadir variaciones sutiles para naturalidad
          const variation = this.noise.noise2D(x * 0.01, y * 0.01);
          const scale = 1.0 + variation * 0.15; // ±15% variación en tamaño
          const tint = this.getBiomeTint(biome, variation);

          // Sin rotación para tiles de terreno (se ven mal rotados)
          const rotation = 0;

          chunkAssets.push({
            asset,
            x,
            y,
            scale,
            rotation,
            tint,
            depth: y,
            metadata: { biome, tileX, tileY },
          });
        }
      }

      return chunkAssets;
    };

    // Procesar en chunks de 1000 tiles
    const results = await memoryManager.processArrayInChunks(
      Array.from(tileGenerator()),
      chunkProcessor,
      1000,
    );

    // Aplanar resultados
    assets.push(...results);

    logAutopoiesis.info("Terrain layer generado con streaming", {
      totalAssets: assets.length,
      memoryStats: memoryManager.getMemoryStats(),
    });

    return {
      type: "terrain",
      name: "Terrain Base (Streamed)",
      assets,
      zIndex: 0,
      visible: true,
    };
  }

  /**
   * Obtiene la cantidad de estructuras según el tipo de cluster (aumentada 70%)
   */
  private getStructureCount(clusterType: string): number {
    const baseCount = (() => {
      switch (clusterType) {
        case 'ruins_site':
          return 3 + Math.floor(Math.random() * 4); // 3-6 ruinas
        case 'village_settlement':
          return 5 + Math.floor(Math.random() * 8); // 5-12 edificios
        case 'city_district':
          return 8 + Math.floor(Math.random() * 12); // 8-19 edificios
        default:
          return 2 + Math.floor(Math.random() * 3); // 2-4 por defecto
      }
    })();
    
    // Aumentar 70% la densidad
    return Math.floor(baseCount * 1.7);
  }

  /**
   * Genera clusters para estructuras con mejor evitación de solapamiento
   */
  private generateStructureClusters(count: number): ClusterPoint[] {
    const clusters: ClusterPoint[] = [];
    const minDistance = Math.sqrt((this.world.config.width * this.world.config.height) / count) * 1.2;

    for (let attempt = 0; attempt < count * 5; attempt++) {
      const x = 200 + Math.random() * (this.world.config.width * 32 - 400);
      const y = 200 + Math.random() * (this.world.config.height * 32 - 400);

      const biome = this.getBiomeAtPosition(x, y);
      if (biome === BiomeType.WETLAND) continue; // Evitar pantanos

      // Verificar distancia con otros clusters
      const tooCloseToCluster = clusters.some(
        (cluster) => Math.hypot(cluster.x - x, cluster.y - y) < minDistance,
      );
      
      // Verificar distancia con zonas ocupadas (reducida para mayor densidad)
      const tooCloseToOccupied = this.occupiedZones.some(
        (zone) => Math.hypot(zone.x - x, zone.y - y) < (zone.radius + 70) // Reducido de 100 a 70
      );

      if (!tooCloseToCluster && !tooCloseToOccupied) {
        const radius = 100 + Math.random() * 60; // Radio controlado
        
        clusters.push({
          x,
          y,
          radius,
          biome,
          type: "ruins_site",
          density: 0.7 + Math.random() * 0.3,
          occupiedPositions: []
        });
        
        // Registrar como zona ocupada inmediatamente
        this.occupiedZones.push({
          x, y, radius: radius * 1.3, type: 'ruins_cluster'
        });

        if (clusters.length >= count) break;
      }
    }

    return clusters;
  }

  /**
   * Genera clusters específicos para asentamientos con mejor separación
   */
  private generateSettlementClusters(count: number): ClusterPoint[] {
    const settlements: ClusterPoint[] = [];
    const minDistance = Math.sqrt((this.world.config.width * this.world.config.height) / count) * 2.0; // Aumentar separación

    for (let attempt = 0; attempt < count * 4; attempt++) {
      const x = 300 + Math.random() * (this.world.config.width * 32 - 600); // Más margen
      const y = 300 + Math.random() * (this.world.config.height * 32 - 600);

      const biome = this.getBiomeAtPosition(x, y);
      if (biome === BiomeType.WETLAND) continue;

      // Verificar distancia con otros asentamientos
      const tooCloseToSettlement = settlements.some(
        (settlement) => Math.hypot(settlement.x - x, settlement.y - y) < minDistance,
      );
      
      // Verificar distancia con zonas ya ocupadas (reducida para mayor densidad)
      const tooCloseToOccupied = this.occupiedZones.some(
        (zone) => Math.hypot(zone.x - x, zone.y - y) < (zone.radius + 100) // Reducido de 150 a 100
      );

      if (!tooCloseToSettlement && !tooCloseToOccupied) {
        const settlementType = this.getSettlementType(biome);
        const radius = this.getSettlementRadius(settlementType);
        
        settlements.push({
          x,
          y,
          radius,
          biome,
          type: settlementType,
          density: 0.8 + Math.random() * 0.2,
          occupiedPositions: []
        });
        
        // Registrar inmediatamente como zona ocupada
        this.occupiedZones.push({
          x, y, radius: radius * 1.5, type: 'settlement'
        });

        if (settlements.length >= count) break;
      }
    }

    return settlements;
  }

  /**
   * Puebla un asentamiento con estructuras
   */
  private populateSettlementStructures(
    settlement: ClusterPoint,
    structureAssets: AssetInfo[],
  ): PlacedAsset[] {
    const assets: PlacedAsset[] = [];
    const buildingCount = this.getStructureCount(settlement.type);

    let attempts = 0;
    let placedBuildings = 0;
    const maxAttempts = buildingCount * 4;

    while (placedBuildings < buildingCount && attempts < maxAttempts) {
      attempts++;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * settlement.radius * 0.8;

      const x = settlement.x + Math.cos(angle) * distance;
      const y = settlement.y + Math.sin(angle) * distance;

      const asset = this.weightedRandomSelect(structureAssets);
      if (!asset) continue;

      const scale = 1.0 + Math.random() * 0.8; // 1.0x-1.8x para asentamientos
      
      // Verificar anti-solapamiento con escala correcta
      if (this.wouldOverlap(x, y, asset, scale)) {
        continue;
      }
      const rotation = getSelectiveRotation("structure", asset.key);
      const tint = this.getSettlementTint(settlement.type);

      const placedAsset: PlacedAsset = {
        asset,
        x,
        y,
        scale,
        rotation,
        tint,
        depth: y + 180,
        bounds: this.calculateAssetBounds(x, y, scale, asset),
        metadata: {
          settlementType: settlement.type,
          biome: settlement.biome,
          assetType: 'building'
        },
      };

      assets.push(placedAsset);
      this.placedAssets.push(placedAsset);
      placedBuildings++;
    }

    return assets;
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
      case "dense_forest":
      case "forest_grove":
        return allAssets.filter(
          (asset) =>
            asset.key.includes("tree") ||
            asset.key.includes("oak") ||
            asset.key.includes("emerald") ||
            asset.type === 'tree',
        );
      case "tree_line":
        return allAssets.filter(
          (asset) => asset.key.includes("tree") || asset.type === 'tree'
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
            asset.key.includes("grass") ||
            asset.type === 'foliage',
        );
      case "mushroom_circle":
        return allAssets.filter((asset) => asset.key.includes("mushroom") || asset.type === 'mushroom');
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
        if (random < 0.4) return "dense_forest";
        else if (random < 0.7) return "forest_grove";
        else return "mushroom_circle";
      case BiomeType.GRASSLAND:
        if (random < 0.5) return "flower_meadow";
        else if (random < 0.8) return "tree_line";
        else return "forest_grove";
      case BiomeType.MOUNTAINOUS:
        return "rock_formation";
      case BiomeType.MYSTICAL:
        return random < 0.6 ? "mushroom_circle" : "rock_formation";
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
  // SISTEMA DE ASENTAMIENTOS URBANOS
  // ==========================================

  /**
   * Determina si un asset es urbano (mesas, sillas, ventanas) vs natural (rocas, plantas)
   */
  private isUrbanAsset(assetKey: string): boolean {
    const urbanKeywords = [
      "silla",
      "mesa",
      "ventana",
      "lampara",
      "sombrilla",
      "poste",
      "bench",
      "table",
      "chair",
      "lamp",
      "umbrella",
      "barrel",
      "chest",
      "fireplace",
      "basket",
      "cajas",
      "botellas",
      "ropas_tendidas",
    ];

    return urbanKeywords.some((keyword) =>
      assetKey.toLowerCase().includes(keyword),
    );
  }

  /**
   * Genera poblados mejorados con diferentes tipos de asentamientos
   */
  private generateUrbanSettlements(count: number): ClusterPoint[] {
    const settlements: ClusterPoint[] = [];
    const minDistance =
      Math.sqrt((this.world.config.width * this.world.config.height) / count) *
      0.8;

    for (let attempt = 0; attempt < count * 4; attempt++) {
      const x = 200 + Math.random() * (this.world.config.width * 32 - 400);
      const y = 200 + Math.random() * (this.world.config.height * 32 - 400);

      const biome = this.getBiomeAtPosition(x, y);

      // Asentamientos solo en biomas apropiados
      if (biome === BiomeType.WETLAND) continue;

      // Verificar distancia mínima a otros asentamientos
      const tooClose = settlements.some(
        (existing) => Math.hypot(x - existing.x, y - existing.y) < minDistance,
      );

      if (!tooClose) {
        const settlementType = this.getSettlementType(biome);
        settlements.push({
          x,
          y,
          radius: this.getSettlementRadius(settlementType),
          biome,
          type: settlementType,
          density: 0.9 + Math.random() * 0.1,
          occupiedPositions: []
        });

        if (settlements.length >= count) break;
      }
    }

    return settlements;
  }

  /**
   * Obtiene el radio apropiado según el tipo de asentamiento
   */
  private getSettlementRadius(settlementType: string): number {
    switch (settlementType) {
      case 'city_district':
        return 250 + Math.random() * 150; // 250-400 para ciudades
      case 'village_settlement':
        return 150 + Math.random() * 100; // 150-250 para pueblos
      case 'residential_area':
        return 200 + Math.random() * 100; // 200-300 para residencial
      case 'commercial_zone':
        return 180 + Math.random() * 80; // 180-260 para comercial
      default:
        return 150 + Math.random() * 100;
    }
  }

  /**
   * Determina el tipo de asentamiento según el bioma con más variedad
   */
  private getSettlementType(
    biome: BiomeType,
  ): "village_settlement" | "city_district" | "market_square" | "residential_area" | "commercial_zone" {
    const random = Math.random();
    
    switch (biome) {
      case BiomeType.GRASSLAND:
        return random < 0.6 ? "village_settlement" : "residential_area";
      case BiomeType.FOREST:
        return random < 0.7 ? "village_settlement" : "residential_area";
      case BiomeType.MOUNTAINOUS:
        return random < 0.5 ? "city_district" : "commercial_zone";
      case BiomeType.MYSTICAL:
        return random < 0.6 ? "market_square" : "commercial_zone";
      default:
        return "village_settlement";
    }
  }

  /**
   * Puebla un asentamiento con mobiliario urbano mejorado y anti-solapamiento
   */
  private populateSettlement(
    settlement: ClusterPoint,
    urbanAssets: AssetInfo[],
  ): PlacedAsset[] {
    const assets: PlacedAsset[] = [];
    const itemCount = this.getSettlementItemCount(settlement.type);

    let attempts = 0;
    let placedItems = 0;
    const maxAttempts = itemCount * 5; // Más intentos para encontrar posiciones válidas

    while (placedItems < itemCount && attempts < maxAttempts) {
      attempts++;
      
      // Distribución circular con concentración hacia el centro
      const angle = Math.random() * Math.PI * 2;
      const distance = this.gaussianRandom() * settlement.radius * 0.85;

      const x = settlement.x + Math.cos(angle) * distance;
      const y = settlement.y + Math.sin(angle) * distance;

      const asset = this.weightedRandomSelect(urbanAssets);
      if (!asset) continue;

      const scale = 0.8 + Math.random() * 0.6; // 0.8x-1.4x Assets urbanos más variados
      
      // Verificar anti-solapamiento con escala correcta
      if (this.wouldOverlap(x, y, asset, scale)) {
        continue;
      }
      const rotation = getSelectiveRotation("prop", asset.key);
      const tint = this.getSettlementTint(settlement.type);

      const placedAsset: PlacedAsset = {
        asset,
        x,
        y,
        scale,
        rotation,
        tint,
        depth: y + 150,
        bounds: this.calculateAssetBounds(x, y, scale, asset),
        metadata: {
          type: "urban_prop",
          settlement: settlement.type,
          biome: settlement.biome,
          assetType: 'building'
        },
      };

      assets.push(placedAsset);
      this.placedAssets.push(placedAsset);
      placedItems++;
    }

    return assets;
  }

  /**
   * Obtiene la cantidad de items según el tipo de asentamiento (aumentada 70%)
   */
  private getSettlementItemCount(settlementType: string): number {
    const baseCount = (() => {
      switch (settlementType) {
        case 'city_district':
          return 20 + Math.floor(Math.random() * 15); // 20-35 items para ciudades
        case 'commercial_zone':
          return 15 + Math.floor(Math.random() * 10); // 15-25 items para comercial
        case 'residential_area':
          return 12 + Math.floor(Math.random() * 8); // 12-20 items residencial
        case 'village_settlement':
          return 8 + Math.floor(Math.random() * 6); // 8-14 items para pueblos
        default:
          return 10 + Math.floor(Math.random() * 5);
      }
    })();
    
    // Aumentar 70% la densidad
    return Math.floor(baseCount * 1.7);
  }

  /**
   * Obtiene tint apropiado para diferentes tipos de asentamientos expandidos
   */
  private getSettlementTint(settlementType: string): number {
    switch (settlementType) {
      case "village_settlement":
        return 0xf4e4bc; // Beige cálido
      case "city_district":
        return 0xe0e0e0; // Gris urbano
      case "market_square":
        return 0xffd700; // Dorado mercantil
      case "residential_area":
        return 0xf0f8ff; // Azul claro residencial
      case "commercial_zone":
        return 0xffefd5; // Papaya comercial
      default:
        return 0xffffff;
    }
  }

  /**
   * Verifica si una posición está cerca de algún asentamiento
   */
  private isNearSettlement(
    x: number,
    y: number,
    settlements: ClusterPoint[],
  ): boolean {
    return settlements.some(
      (settlement) =>
        Math.hypot(x - settlement.x, y - settlement.y) <
        settlement.radius * 1.2,
    );
  }

  // ==========================================
  // SISTEMA ANTI-SOLAPAMIENTO
  // ==========================================

  /**
   * Verifica si un asset se solaparía con otros existentes (mejorado)
   */
  private wouldOverlap(x: number, y: number, asset: AssetInfo, scale: number = 1.0): boolean {
    const newBounds = this.calculateAssetBounds(x, y, scale, asset);
    
    return this.placedAssets.some(placedAsset => {
      if (!placedAsset.bounds) return false;
      
      // Calcular distancia mínima según tipos de assets
      const minDistance = this.getMinDistanceBetweenAssets(asset, placedAsset.asset, scale, placedAsset.scale);
      
      // Verificar si las áreas se solapan usando bounds reales
      const overlapX = this.boundsOverlap(
        newBounds.x - newBounds.width/2, newBounds.x + newBounds.width/2,
        placedAsset.bounds.x - placedAsset.bounds.width/2, placedAsset.bounds.x + placedAsset.bounds.width/2
      );
      
      const overlapY = this.boundsOverlap(
        newBounds.y - newBounds.height/2, newBounds.y + newBounds.height/2,
        placedAsset.bounds.y - placedAsset.bounds.height/2, placedAsset.bounds.y + placedAsset.bounds.height/2
      );
      
      // Si hay solapamiento en ambos ejes, hay colisión
      if (overlapX && overlapY) {
        return true;
      }
      
      // Verificar distancia mínima para assets grandes
      const distance = Math.hypot(
        newBounds.x - placedAsset.bounds.x,
        newBounds.y - placedAsset.bounds.y
      );
      
      return distance < minDistance;
    });
  }

  /**
   * Verifica si dos rangos se solapan
   */
  private boundsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Obtiene la distancia mínima entre dos tipos de assets
   */
  private getMinDistanceBetweenAssets(asset1: AssetInfo, asset2: AssetInfo, scale1: number, scale2: number): number {
    // Distancias base según combinaciones de tipos
    // Distancias mínimas optimizadas para mayor densidad (reducidas 30%)
    const getBaseDistance = (type: string): number => {
      switch (type) {
        case 'structure': return 85;  // Estructuras - reducido de 120 a 85
        case 'tree': return 55;       // Árboles - reducido de 80 a 55
        case 'prop': return 30;       // Props - reducido de 40 a 30
        case 'rock': return 22;       // Rocas - reducido de 30 a 22
        case 'mushroom': return 18;   // Hongos - reducido de 25 a 18
        case 'foliage': return 22;    // Follaje - reducido de 30 a 22
        case 'decoration': return 25; // Decoraciones - reducido de 35 a 25
        default: return 35;           // Por defecto - reducido de 50 a 35
      }
    };
    
    const dist1 = getBaseDistance(asset1.type || 'decoration');
    const dist2 = getBaseDistance(asset2.type || 'decoration');
    
    // Usar la distancia mayor y aplicar escalas
    const baseDistance = Math.max(dist1, dist2);
    const scaleMultiplier = Math.max(scale1, scale2);
    
    return baseDistance * scaleMultiplier;
  }

  /**
   * Calcula los límites de un asset con tamaños más precisos
   */
  private calculateAssetBounds(x: number, y: number, scale: number, asset: AssetInfo): { x: number; y: number; width: number; height: number } {
    // Tamaños base más precisos según tipo de asset y key específica
    let baseWidth = 32;
    let baseHeight = 32;

    switch (asset.type) {
      case 'tree':
        // Árboles diferentes tienen tamaños diferentes
        if (asset.key.includes('mega_tree')) {
          baseWidth = 128; baseHeight = 192;
        } else if (asset.key.includes('oak_tree') || asset.key.includes('willow')) {
          baseWidth = 96; baseHeight = 128;
        } else {
          baseWidth = 64; baseHeight = 96;
        }
        break;
      case 'structure':
        // Estructuras tienen tamaños variables
        if (asset.key.includes('house')) {
          baseWidth = 128; baseHeight = 128;
        } else if (asset.key.includes('well')) {
          baseWidth = 64; baseHeight = 64;
        } else {
          baseWidth = 96; baseHeight = 96;
        }
        break;
      case 'prop':
        // Props varían mucho
        if (asset.key.includes('table') || asset.key.includes('bench')) {
          baseWidth = 48; baseHeight = 32;
        } else if (asset.key.includes('lamp') || asset.key.includes('post')) {
          baseWidth = 24; baseHeight = 64;
        } else {
          baseWidth = 32; baseHeight = 32;
        }
        break;
      case 'ruin':
        baseWidth = 80; baseHeight = 80;
        break;
      case 'rock':
        baseWidth = 40; baseHeight = 40;
        break;
      case 'mushroom':
        baseWidth = 24; baseHeight = 32;
        break;
      case 'foliage':
        baseWidth = 40; baseHeight = 40;
        break;
    }

    return {
      x: x,
      y: y,
      width: baseWidth * scale,
      height: baseHeight * scale
    };
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
