/**
 * Generador Procedural de Mundo 2D para "Una Carta Para Isa"
 * Sistema avanzado de generación con biomas, ruido Perlin y distribución orgánica
 */

import type {
  GameState,
  MapElement,
  ObjectLayer,
  Position,
  RoadPolyline,
  TerrainTile,
  Zone,
} from "../types";
import { logAutopoiesis } from "../utils/logger";
import { NoiseUtils } from "./NoiseUtils";

export interface BiomeDefinition {
  id: string;
  name: string;
  color: string;
  alphaColor: string;
  noiseThreshold: { min: number; max: number };
  resources: string[];
  decorations: string[];
  rarity: "common" | "uncommon" | "rare";
  zoneTypes: Array<"food" | "water" | "shelter" | "social" | "work" | "rest">;
}

export interface WorldGenConfig {
  width: number;
  height: number;
  seed: string;
  biomeDensity: number;
  resourceDensity: number;
  tileSize: number;
  chunkSize: number;
}

export class ProceduralWorldGenerator {
  private config: WorldGenConfig;
  private noiseGen: NoiseUtils;
  private biomes: BiomeDefinition[];

  // Cache para optimización
  private biomeCache = new Map<string, string>();
  private heightCache = new Map<string, number>();

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = {
      width: 2400,
      height: 1600,
      seed: Math.random().toString(36).substr(2, 9),
      biomeDensity: 0.7,
      resourceDensity: 0.4,
      tileSize: 32,
      chunkSize: 16,
      ...config,
    };

    this.noiseGen = new NoiseUtils(this.config.seed);
    this.biomes = this.createBiomeDefinitions();

    logAutopoiesis.info("🌍 ProceduralWorldGenerator inicializado", {
      seed: this.config.seed,
      worldSize: `${this.config.width}x${this.config.height}`,
      biomes: this.biomes.length,
    });
  }

  /**
   * Generar mundo completo
   */
  public generateWorld(): GameState {
    logAutopoiesis.info("🎲 Iniciando generación procedural...");

    const startTime = Date.now();

    // FASE 1: Generar heightmap base
    const heightMap = this.generateHeightMap();

    // FASE 2: Determinar biomas usando múltiples capas de ruido
    const biomeMap = this.generateBiomeMap(heightMap);

    // FASE 3: Generar zonas funcionales basadas en biomas
    const zones = this.generateZones(biomeMap, heightMap);

    // FASE 4: Distribuir recursos y decoraciones (solo decoraciones)
    const mapElements = this.generateMapElements(biomeMap, heightMap);

    // FASE 5: Crear caminos conectando zonas como polilíneas
    const roads = this.generateRoadNetwork(zones);

    const generationTime = Date.now() - startTime;

    logAutopoiesis.info("✅ Mundo generado exitosamente", {
      generationTime: `${generationTime}ms`,
      zones: zones.length,
      elements: mapElements.length,
      roads: roads.length,
      biomes: new Set(Object.values(biomeMap)).size,
    });

    return {
      zones,
      mapElements,
      roads,
      entities: [],
      resonance: 0,
      cycles: 0,
      lastSave: Date.now(),
      togetherTime: 0,
      connectionAnimation: {
        active: false,
        startTime: 0,
        type: "NOURISH",
      },
      currentConversation: {
        isActive: false,
        participants: [],
        lastSpeaker: null,
        lastDialogue: null,
        startTime: 0,
      },
      terrainTiles: this.generateTerrainTiles(biomeMap),
      objectLayers: this.generateObjectLayers(biomeMap, mapElements),
      worldSize: { width: this.config.width, height: this.config.height },
      generatorVersion: "2.0.0",
      mapSeed: this.config.seed,
    } as GameState;
  }

  /**
   * Generar mapa de alturas usando ruido Perlin multicapa
   */
  private generateHeightMap(): number[][] {
    const heightMap: number[][] = [];
    const { width, height, tileSize } = this.config;

    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let y = 0; y < rows; y++) {
      heightMap[y] = [];
      for (let x = 0; x < cols; x++) {
        // Múltiples octavas de ruido para terreno natural
        const baseNoise = this.noiseGen.noise2D(x * 0.02, y * 0.02);
        const detailNoise = this.noiseGen.noise2D(x * 0.08, y * 0.08) * 0.5;
        const fineNoise = this.noiseGen.noise2D(x * 0.15, y * 0.15) * 0.25;

        const height = (baseNoise + detailNoise + fineNoise) / 1.75;
        heightMap[y][x] = Math.max(0, Math.min(1, height));

        // Cache para lookups rápidos
        this.heightCache.set(`${x},${y}`, height);
      }
    }

    return heightMap;
  }

  /**
   * Generar mapa de biomas basado en altura y múltiples capas de ruido
   */
  private generateBiomeMap(heightMap: number[][]): Record<string, string> {
    const biomeMap: Record<string, string> = {};
    const rows = heightMap.length;
    const cols = heightMap[0]?.length || 0;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const height = heightMap[y][x];

        // Ruido adicional para variación de biomas
        const biomeNoise = this.noiseGen.noise2D(x * 0.05, y * 0.05);
        const moistureNoise = this.noiseGen.noise2D(x * 0.07, y * 0.07);
        const temperatureNoise = this.noiseGen.noise2D(x * 0.04, y * 0.04);

        const biome = this.determineBiome(
          height,
          biomeNoise,
          moistureNoise,
          temperatureNoise,
        );
        const key = `${x},${y}`;
        biomeMap[key] = biome;
        this.biomeCache.set(key, biome);
      }
    }

    return biomeMap;
  }

  /**
   * Determinar bioma basado en múltiples factores ambientales
   */
  private determineBiome(
    height: number,
    biomeNoise: number,
    moisture: number,
    temperature: number,
  ): string {
    // Agua en áreas bajas con alta humedad
    if (height < 0.3 && moisture > 0.2) return "water";

    // Montañas en áreas altas
    if (height > 0.7) return "mountain";

    // Bosque en áreas húmedas y templadas
    if (moisture > 0.1 && temperature > -0.1 && temperature < 0.4)
      return "forest";

    // Desierto en áreas secas y calientes
    if (moisture < -0.2 && temperature > 0.3) return "desert";

    // Pueblo en áreas planas y accesibles
    if (height > 0.35 && height < 0.55 && Math.abs(biomeNoise) < 0.3)
      return "village";

    // Pantano en áreas bajas y húmedas
    if (height < 0.5 && moisture > 0.4) return "wetland";

    // Pradera como bioma por defecto
    return "grassland";
  }

  /**
   * Generar zonas funcionales basadas en biomas
   */
  private generateZones(
    biomeMap: Record<string, string>,
    heightMap: number[][],
  ): Zone[] {
    const zones: Zone[] = [];
    const zoneAttempts = 15; // Intentar crear 15 zonas
    const minZoneDistance = 200;
    const existingPositions: Array<{ x: number; y: number }> = [];

    for (let attempt = 0; attempt < zoneAttempts; attempt++) {
      // Seleccionar posición aleatoria
      const x = Math.random() * (this.config.width - 400) + 200;
      const y = Math.random() * (this.config.height - 400) + 200;

      // Verificar distancia mínima con otras zonas
      const tooClose = existingPositions.some(
        (pos) => Math.hypot(pos.x - x, pos.y - y) < minZoneDistance,
      );

      if (tooClose) continue;

      // Obtener bioma en esta posición
      const biome = this.getBiomeAtPosition(x, y);
      const biomeData = this.biomes.find((b) => b.id === biome);

      if (!biomeData) continue;

      // Crear zona apropiada para el bioma
      const zoneType =
        biomeData.zoneTypes[
          Math.floor(Math.random() * biomeData.zoneTypes.length)
        ];
      const zone = this.createZoneForBiome(
        zones.length,
        x,
        y,
        zoneType,
        biomeData,
      );

      zones.push(zone);
      existingPositions.push({ x, y });
    }

    // Asegurar al menos una zona de cada tipo crítico
    this.ensureCriticalZones(zones, existingPositions);

    return zones;
  }

  /**
   * Crear zona específica para un bioma
   */
  private createZoneForBiome(
    index: number,
    x: number,
    y: number,
    zoneType: string,
    biome: BiomeDefinition,
  ): Zone {
    const zoneNames: Record<string, string[]> = {
      food: ["Huerto", "Granja", "Mercado", "Cocina Comunal"],
      water: ["Manantial", "Pozo", "Río", "Laguna"],
      shelter: ["Refugio", "Cabaña", "Templo", "Santuario"],
      social: ["Plaza", "Teatro", "Taberna", "Anfiteatro"],
      work: ["Taller", "Forja", "Laboratorio", "Estudio"],
      rest: ["Jardín Zen", "Spa", "Biblioteca", "Mirador"],
    };

    const names = zoneNames[zoneType] || ["Zona"];
    const name = names[Math.floor(Math.random() * names.length)];

    const width = 250 + Math.random() * 200;
    const height = 200 + Math.random() * 150;

    return {
      id: `${zoneType}_${index}`,
      name: `${name} ${biome.name}`,
      bounds: {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
      },
      type: zoneType as any,
      color: biome.alphaColor,
      attractiveness: 3 + Math.floor(Math.random() * 5),
      metadata: {
        biome: biome.id,
        resources: [...biome.resources],
      },
    } as Zone;
  }

  /**
   * Asegurar zonas críticas para supervivencia
   */
  private ensureCriticalZones(
    zones: Zone[],
    existingPositions: Array<{ x: number; y: number }>,
  ): void {
    const criticalTypes = ["food", "water", "shelter"];

    criticalTypes.forEach((type) => {
      const hasType = zones.some((z) => z.type === type);

      if (!hasType) {
        // Crear zona crítica en posición segura
        let x,
          y,
          attempts = 0;
        do {
          x = 400 + Math.random() * (this.config.width - 800);
          y = 400 + Math.random() * (this.config.height - 800);
          attempts++;
        } while (
          attempts < 10 &&
          existingPositions.some(
            (pos) => Math.hypot(pos.x - x, pos.y - y) < 150,
          )
        );

        const biome =
          this.biomes.find((b) => b.zoneTypes.includes(type as any)) ||
          this.biomes[0];
        const zone = this.createZoneForBiome(zones.length, x, y, type, biome);
        zones.push(zone);
      }
    });
  }

  /**
   * Generar elementos del mapa (decoraciones, recursos)
   */
  private generateMapElements(
    biomeMap: Record<string, string>,
    heightMap: number[][],
  ): MapElement[] {
    const elements: MapElement[] = [];
    const { width, height, tileSize, resourceDensity } = this.config;

    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let y = 0; y < rows; y += 2) {
      // Skip some tiles for performance
      for (let x = 0; x < cols; x += 2) {
        const worldX = x * tileSize + tileSize / 2;
        const worldY = y * tileSize + tileSize / 2;

        const biome = biomeMap[`${x},${y}`] || "grassland";
        const biomeData = this.biomes.find((b) => b.id === biome);

        if (!biomeData) continue;

        // Probabilidad basada en densidad y ruido
        const elementNoise = this.noiseGen.noise2D(x * 0.1, y * 0.1);
        if (Math.random() > resourceDensity || elementNoise < 0.3) continue;

        // Seleccionar decoración apropiada para el bioma
        const decoration =
          biomeData.decorations[
            Math.floor(Math.random() * biomeData.decorations.length)
          ];

        elements.push({
          id: `element_${x}_${y}`,
          position: { x: worldX, y: worldY },
          size: { width: 32, height: 32 },
          type: "decoration",
          color: biomeData.color,
          metadata: { assetId: decoration, biome },
        } as MapElement);
      }
    }

    logAutopoiesis.info("📦 Elementos de mapa generados", {
      totalElements: elements.length,
      averagePerChunk:
        Math.round((elements.length / ((cols / 2) * (rows / 2))) * 100) / 100,
    });

    return elements;
  }

  /**
   * Generar red de caminos conectando zonas importantes
   */
  private generateRoadNetwork(zones: Zone[]): RoadPolyline[] {
    const roads: RoadPolyline[] = [];

    // Encontrar zona central
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    const centralZone = zones.reduce((closest, zone) => {
      const zoneCenter = {
        x: zone.bounds.x + zone.bounds.width / 2,
        y: zone.bounds.y + zone.bounds.height / 2,
      };

      const distance = Math.hypot(
        zoneCenter.x - centerX,
        zoneCenter.y - centerY,
      );
      const closestDistance = Math.hypot(
        closest.bounds.x + closest.bounds.width / 2 - centerX,
        closest.bounds.y + closest.bounds.height / 2 - centerY,
      );

      return distance < closestDistance ? zone : closest;
    });

    // Conectar todas las zonas a la zona central
    zones.forEach((zone) => {
      if (zone.id === centralZone.id) return;

      const path = this.generatePathBetweenZones(centralZone, zone);
      roads.push({
        id: `road_${centralZone.id}_${zone.id}`,
        points: path as Position[],
        width: 8,
        type: "path",
      });
    });

    return roads;
  }

  /**
   * Generar camino entre dos zonas usando A* simplificado
   */
  private generatePathBetweenZones(
    zoneA: Zone,
    zoneB: Zone,
  ): Array<{ x: number; y: number }> {
    const startX = zoneA.bounds.x + zoneA.bounds.width / 2;
    const startY = zoneA.bounds.y + zoneA.bounds.height / 2;
    const endX = zoneB.bounds.x + zoneB.bounds.width / 2;
    const endY = zoneB.bounds.y + zoneB.bounds.height / 2;

    // Camino simple con curvas naturales
    const path: Array<{ x: number; y: number }> = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Interpolación con curva bezier simple
      const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 100;
      const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 100;

      const x =
        (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const y =
        (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

      path.push({ x: Math.round(x), y: Math.round(y) });
    }

    return path;
  }

  /**
   * Generar tiles de terreno para renderizado
   */
  private generateTerrainTiles(
    biomeMap: Record<string, string>,
  ): TerrainTile[] {
    const terrainTiles: TerrainTile[] = [];
    const { width, height, tileSize } = this.config;

    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const biome = biomeMap[`${x},${y}`] || "grassland";
        const assetId = this.getTerrainAssetForBiome(biome);
        const type = this.mapBiomeToTerrainType(biome);

        terrainTiles.push({
          x: x * tileSize,
          y: y * tileSize,
          assetId,
          type,
          variant: 0,
        });
      }
    }

    return terrainTiles;
  }

  /**
   * Generar capas de objetos para renderizado
   */
  private generateObjectLayers(
    biomeMap: Record<string, string>,
    elements: MapElement[],
  ): ObjectLayer[] {
    const layers: ObjectLayer[] = [];

    // Agrupar elementos por tipo (solo decoraciones)
    const decorationElements = elements.filter((e) => e.type === "decoration");

    layers.push(
      { id: "terrain", name: "terrain", objects: [], zIndex: 0, visible: true },
      {
        id: "decorations",
        name: "decorations",
        objects: decorationElements,
        zIndex: 2,
        visible: true,
      },
      {
        id: "entities",
        name: "entities",
        objects: [],
        zIndex: 3,
        visible: true,
      },
    );

    return layers;
  }

  // ==========================================
  // UTILIDADES Y HELPERS
  // ==========================================

  /**
   * Obtener bioma en posición específica
   */
  private getBiomeAtPosition(x: number, y: number): string {
    const tileX = Math.floor(x / this.config.tileSize);
    const tileY = Math.floor(y / this.config.tileSize);
    const key = `${tileX},${tileY}`;

    return this.biomeCache.get(key) || "grassland";
  }

  /**
   * Obtener asset de terreno apropiado para bioma
   */
  private getTerrainAssetForBiome(biome: string): string {
    const assetMap: Record<string, string> = {
      grassland: "grass_middle",
      forest: "grass_1",
      water: "water_middle",
      mountain: "grass_3",
      desert: "grass_2",
      village: "grass_middle",
      wetland: "water_tile_1",
    };

    return assetMap[biome] || "grass_middle";
  }

  private mapBiomeToTerrainType(biome: string): TerrainTile["type"] {
    switch (biome) {
      case "water":
        return "water";
      case "mountain":
      case "desert":
        return "stone";
      default:
        return "grass";
    }
  }

  /**
   * Definiciones de biomas
   */
  private createBiomeDefinitions(): BiomeDefinition[] {
    return [
      {
        id: "grassland",
        name: "Pradera",
        color: "#4CAF50",
        alphaColor: "rgba(76, 175, 80, 0.3)",
        noiseThreshold: { min: -0.3, max: 0.3 },
        resources: ["grass", "flowers", "herbs"],
        // Incluir árboles en pradera para que siempre haya presencia visible
        decorations: [
          "tree_emerald_1",
          "oak_tree",
          "bush_emerald_1",
          "flowers_red_anim",
        ],
        rarity: "common",
        zoneTypes: ["food", "social", "rest"],
      },
      {
        id: "forest",
        name: "Bosque",
        color: "#388E3C",
        alphaColor: "rgba(56, 142, 60, 0.4)",
        noiseThreshold: { min: 0.1, max: 0.6 },
        resources: ["wood", "berries", "mushrooms"],
        // Ampliar variedad de árboles en bosque
        decorations: [
          "tree_emerald_1",
          "tree_emerald_2",
          "tree_emerald_3",
          "tree_emerald_4",
          "oak_tree",
          "willow1",
          "bush_emerald_2",
        ],
        rarity: "common",
        zoneTypes: ["shelter", "work", "rest"],
      },
      {
        id: "water",
        name: "Agua",
        color: "#2196F3",
        alphaColor: "rgba(33, 150, 243, 0.5)",
        noiseThreshold: { min: -1, max: 0.3 },
        resources: ["water", "fish", "reeds"],
        decorations: ["water_tile_1", "rock1_1"],
        rarity: "uncommon",
        zoneTypes: ["water", "rest"],
      },
      {
        id: "mountain",
        name: "Montaña",
        color: "#607D8B",
        alphaColor: "rgba(96, 125, 139, 0.4)",
        noiseThreshold: { min: 0.7, max: 1 },
        resources: ["stone", "minerals", "crystals"],
        // Algunas coníferas/árboles resistentes
        decorations: ["rock1_1", "tree_emerald_3", "oak_tree"],
        rarity: "rare",
        zoneTypes: ["work", "shelter"],
      },
      {
        id: "village",
        name: "Pueblo",
        color: "#8D6E63",
        alphaColor: "rgba(141, 110, 99, 0.3)",
        noiseThreshold: { min: -0.2, max: 0.2 },
        resources: ["tools", "food", "crafts"],
        // Añadir alguna presencia de árboles en el pueblo
        decorations: ["house_hay_1", "well_1", "oak_tree", "tree_emerald_1"],
        rarity: "uncommon",
        zoneTypes: ["social", "work", "food", "shelter"],
      },
      {
        id: "wetland",
        name: "Pantano",
        color: "#4E342E",
        alphaColor: "rgba(78, 52, 46, 0.4)",
        noiseThreshold: { min: -0.1, max: 0.5 },
        resources: ["reeds", "mud", "rare_herbs"],
        // Añadir sauces al humedal
        decorations: [
          "willow1",
          "willow2",
          "willow3",
          "water_tile_1",
          "bush_emerald_3",
        ],
        rarity: "rare",
        zoneTypes: ["water", "rest"],
      },
      {
        id: "desert",
        name: "Desierto",
        color: "#FF9800",
        alphaColor: "rgba(255, 152, 0, 0.3)",
        noiseThreshold: { min: -0.2, max: 0.8 },
        resources: ["sand", "cacti", "gems"],
        decorations: ["rock1_2", "sand_ruins_1"],
        rarity: "rare",
        zoneTypes: ["work", "rest"],
      },
    ];
  }

  /**
   * Obtener configuración actual
   */
  public getConfig(): WorldGenConfig {
    return { ...this.config };
  }

  /**
   * Obtener estadísticas de generación
   */
  public getGenerationStats() {
    return {
      seed: this.config.seed,
      biomeTypes: this.biomes.length,
      cacheSize: {
        biomes: this.biomeCache.size,
        heights: this.heightCache.size,
      },
      worldDimensions: {
        width: this.config.width,
        height: this.config.height,
        tileSize: this.config.tileSize,
      },
    };
  }
}
