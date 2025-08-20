/*\n * Documentación científica (resumen):\n * - Atracción de zonas: score = 10·atractividad + necesidades ponderadas − distancia/500 + compatibilidad de ánimo.\n * - Distancia euclidiana para proximidad; colisión por aproximación de radios mínimos con obstáculos rectangulares.\n */
/**
 * Sistema de Generación de Mapas para Una Carta Para Isa
 * Adaptado al motor Phaser - Preserva la lógica de zonas y elementos
 * ACTUALIZADO: Integra el nuevo sistema de biomas procedurales
 */

import type { EntityStats, MapElement, Zone } from "../types";
import { BiomeSystem, createCustomWorldConfig, getWorldPreset } from "../world";
import type { GeneratedWorld, WorldGenConfig } from "../world/types";
import { logAutopoiesis } from "./logger";

const createNorthZones = (): Zone[] => {
  return [
    // ZONA NOROESTE - Nutrición y Alimentación
    {
      id: "nourishment_garden",
      name: "Jardín de Nutrición",
      bounds: { x: 160, y: 120, width: 320, height: 200 },
      type: "food",
      color: "rgba(46, 204, 113, 0.3)",
      attractiveness: 1.2,
      effects: {
        hunger: 40,
        happiness: 18,
        energy: 10,
        health: 8,
      },
      metadata: {
        priority: 1,
        furnitureTypes: ["flowers", "fruits", "water_fountain"],
      },
    },

    // ZONA NORTE CENTRAL - Biblioteca y Conocimiento
    {
      id: "wisdom_library",
      name: "Biblioteca de Sabiduría",
      bounds: { x: 600, y: 80, width: 280, height: 180 },
      type: "comfort",
      color: "rgba(78, 52, 46, 0.3)",
      attractiveness: 1.0,
      effects: {
        boredom: 35,
        happiness: 25,
        loneliness: 15,
        energy: 5,
      },
      metadata: {
        priority: 2,
        furnitureTypes: ["books", "reading_chair", "study_desk"],
      },
    },

    // ZONA NORESTE - Hospital y Salud
    {
      id: "healing_sanctuary",
      name: "Santuario de Sanación",
      bounds: { x: 1000, y: 100, width: 300, height: 200 },
      type: "rest",
      color: "rgba(231, 76, 60, 0.25)",
      attractiveness: 1.1,
      effects: {
        health: 50,
        sleepiness: 25,
        happiness: 15,
        energy: 20,
      },
      metadata: {
        priority: 1,
        furnitureTypes: ["medical_bed", "healing_crystals", "herbs"],
      },
    },

    // ZONA NORESTE FAR - Taller de Productividad
    {
      id: "productivity_workshop",
      name: "Taller de Productividad",
      bounds: { x: 1400, y: 120, width: 280, height: 180 },
      type: "work",
      color: "rgba(189, 195, 199, 0.25)",
      attractiveness: 0.7,
      effects: {
        money: 100,
        boredom: -10,
        energy: -25,
        happiness: -8,
      },
      metadata: {
        priority: 4,
        furnitureTypes: ["desk", "computer", "tools"],
      },
    },
  ];
};

const createCentralZones = (): Zone[] => {
  return [
    // ZONA OESTE - Spa y Relajación
    {
      id: "tranquil_spa",
      name: "Spa de Tranquilidad",
      bounds: { x: 120, y: 400, width: 280, height: 220 },
      type: "comfort",
      color: "rgba(142, 68, 173, 0.25)",
      attractiveness: 1.0,
      effects: {
        happiness: 30,
        sleepiness: 20,
        loneliness: 10,
        health: 15,
        energy: 25,
      },
      metadata: {
        priority: 2,
        furnitureTypes: ["hot_springs", "massage_table", "aromatherapy"],
      },
    },

    // ZONA CENTRO - Cámara de Descanso Principal
    {
      id: "quantum_rest_chamber",
      name: "Cámara de Descanso Cuántico",
      bounds: { x: 800, y: 450, width: 320, height: 200 },
      type: "rest",
      color: "rgba(52, 152, 219, 0.3)",
      attractiveness: 1.3,
      effects: {
        sleepiness: 50,
        energy: 40,
        happiness: 22,
        health: 12,
      },
      metadata: {
        priority: 1,
        furnitureTypes: ["quantum_bed", "sleep_pods", "dream_crystals"],
      },
    },

    // ZONA CENTRO-SUR - Plaza Social Principal
    {
      id: "resonance_social_plaza",
      name: "Plaza de Resonancia Social",
      bounds: { x: 600, y: 800, width: 400, height: 250 },
      type: "social",
      color: "rgba(155, 89, 182, 0.3)",
      attractiveness: 1.4,
      effects: {
        loneliness: 55,
        happiness: 30,
        boredom: 25,
        energy: 8,
      },
      metadata: {
        priority: 1,
        furnitureTypes: ["amphitheater", "social_benches", "gathering_circle"],
      },
    },

    // ZONA ESTE - Centro Creativo
    {
      id: "creative_atelier",
      name: "Atelier Creativo",
      bounds: { x: 1500, y: 600, width: 300, height: 200 },
      type: "play",
      color: "rgba(243, 156, 18, 0.35)",
      attractiveness: 1.2,
      effects: {
        happiness: 40,
        boredom: 45,
        loneliness: 20,
        energy: -5,
      },
      metadata: {
        priority: 2,
        furnitureTypes: ["art_supplies", "musical_instruments", "craft_table"],
      },
    },
  ];
};

const createSouthZones = (): Zone[] => {
  return [
    // ZONA SURESTE - Patio de Juegos
    {
      id: "cosmic_playground",
      name: "Patio de Juegos Cósmico",
      bounds: { x: 1400, y: 1000, width: 380, height: 280 },
      type: "play",
      color: "rgba(241, 196, 15, 0.35)",
      attractiveness: 1.3,
      effects: {
        boredom: 60,
        happiness: 35,
        loneliness: 30,
        energy: -10,
      },
      metadata: {
        priority: 1,
        furnitureTypes: ["cosmic_swings", "stellar_slides", "quantum_sandbox"],
      },
    },

    // ZONA SUR - Mercado y Comercio
    {
      id: "prosperity_market",
      name: "Mercado de Prosperidad",
      bounds: { x: 400, y: 1200, width: 350, height: 200 },
      type: "work",
      color: "rgba(211, 84, 0, 0.3)",
      attractiveness: 0.8,
      effects: {
        money: 80,
        loneliness: 15,
        boredom: -5,
        energy: -15,
      },
      metadata: {
        priority: 3,
        furnitureTypes: ["trading_stalls", "coin_fountain", "merchant_booth"],
      },
    },

    // ZONA SUROESTE - Gimnasio Energético
    {
      id: "vitality_gymnasium",
      name: "Gimnasio de Vitalidad",
      bounds: { x: 160, y: 1000, width: 300, height: 250 },
      type: "energy",
      color: "rgba(230, 126, 34, 0.3)",
      attractiveness: 1.0,
      effects: {
        energy: 65,
        health: 25,
        sleepiness: 35,
        happiness: 15,
        money: -20,
      },
      metadata: {
        priority: 2,
        furnitureTypes: [
          "exercise_equipment",
          "energy_crystals",
          "vitality_pool",
        ],
      },
    },

    // ZONA OESTE FAR - Santuario de Meditación
    {
      id: "meditation_sanctuary",
      name: "Santuario de Meditación Profunda",
      bounds: { x: 120, y: 700, width: 280, height: 200 },
      type: "comfort",
      color: "rgba(102, 51, 153, 0.25)",
      attractiveness: 0.9,
      effects: {
        happiness: 28,
        boredom: 30,
        loneliness: 22,
        sleepiness: 15,
        energy: 18,
        health: 12,
      },
      metadata: {
        priority: 3,
        furnitureTypes: [
          "meditation_circle",
          "zen_garden",
          "tranquil_fountain",
        ],
      },
    },
  ];
};

export const createDefaultZones = (): Zone[] => {
  return [
    ...createNorthZones(),
    ...createCentralZones(),
    ...createSouthZones(),
  ];
};

export const createDefaultMapElements = (): MapElement[] => {
  return [
    {
      id: "central_wisdom_stone",
      type: "obstacle",
      position: { x: 500, y: 320 },
      size: { width: 50, height: 45 },
      color: "#7f8c8d",
      metadata: { assetId: "wisdom_stone", interactive: false },
    },
    {
      id: "ancient_tree_north",
      type: "obstacle",
      position: { x: 220, y: 45 },
      size: { width: 30, height: 70 },
      color: "#27ae60",
      metadata: { assetId: "ancient_tree", interactive: false },
    },
    {
      id: "harmony_tree_south",
      type: "obstacle",
      position: { x: 280, y: 440 },
      size: { width: 30, height: 70 },
      color: "#27ae60",
      metadata: { assetId: "harmony_tree", interactive: false },
    },

    {
      id: "crystal_flower_1",
      type: "food_zone",
      position: { x: 100, y: 90 },
      size: { width: 12, height: 12 },
      color: "#e91e63",
      metadata: { assetId: "crystal_flower_pink", nutrition: 8 },
    },
    {
      id: "golden_fruit_bush",
      type: "food_zone",
      position: { x: 150, y: 120 },
      size: { width: 15, height: 15 },
      color: "#f39c12",
      metadata: { assetId: "golden_fruit", nutrition: 12 },
    },
    {
      id: "azure_bloom_patch",
      type: "food_zone",
      position: { x: 200, y: 140 },
      size: { width: 10, height: 10 },
      color: "#3498db",
      metadata: { assetId: "azure_bloom", nutrition: 6 },
    },

    {
      id: "quantum_bed_primary",
      type: "rest_zone",
      position: { x: 450, y: 100 },
      size: { width: 30, height: 15 },
      color: "#8e44ad",
      metadata: { assetId: "quantum_bed", comfort: 25 },
    },
    {
      id: "levitating_cushion",
      type: "rest_zone",
      position: { x: 520, y: 140 },
      size: { width: 20, height: 20 },
      color: "#9b59b6",
      metadata: { assetId: "levitating_cushion", comfort: 15 },
    },

    {
      id: "resonance_fountain",
      type: "social_zone",
      position: { x: 150, y: 400 },
      size: { width: 40, height: 40 },
      color: "#16a085",
      metadata: { assetId: "resonance_fountain", social_boost: 20 },
    },
    {
      id: "connection_bench_1",
      type: "social_zone",
      position: { x: 100, y: 450 },
      size: { width: 30, height: 15 },
      color: "#1abc9c",
      metadata: { assetId: "connection_bench", social_boost: 10 },
    },
    {
      id: "connection_bench_2",
      type: "social_zone",
      position: { x: 220, y: 470 },
      size: { width: 30, height: 15 },
      color: "#1abc9c",
      metadata: { assetId: "connection_bench", social_boost: 10 },
    },

    {
      id: "cosmic_light_pole_1",
      type: "play_zone",
      position: { x: 400, y: 280 },
      size: { width: 18, height: 30 },
      color: "#f1c40f",
      metadata: { assetId: "cosmic_light", fun_factor: 8 },
    },
    {
      id: "cosmic_light_pole_2",
      type: "play_zone",
      position: { x: 580, y: 300 },
      size: { width: 18, height: 30 },
      color: "#f1c40f",
      metadata: { assetId: "cosmic_light", fun_factor: 8 },
    },
    {
      id: "dimensional_swing",
      type: "play_zone",
      position: { x: 480, y: 350 },
      size: { width: 25, height: 35 },
      color: "#e67e22",
      metadata: { assetId: "dimensional_swing", fun_factor: 15 },
    },

    {
      id: "productivity_beacon",
      type: "work_zone",
      position: { x: 760, y: 110 },
      size: { width: 18, height: 30 },
      color: "#34495e",
      metadata: { assetId: "productivity_beacon", efficiency: 12 },
    },

    {
      id: "serenity_flower_1",
      type: "comfort_zone",
      position: { x: 340, y: 500 },
      size: { width: 10, height: 10 },
      color: "#9b59b6",
      metadata: { assetId: "serenity_flower", tranquility: 8 },
    },
    {
      id: "harmony_flower_2",
      type: "comfort_zone",
      position: { x: 420, y: 520 },
      size: { width: 10, height: 10 },
      color: "#3498db",
      metadata: { assetId: "harmony_flower", tranquility: 6 },
    },
    {
      id: "wisdom_bloom_3",
      type: "comfort_zone",
      position: { x: 480, y: 550 },
      size: { width: 10, height: 10 },
      color: "#e91e63",
      metadata: { assetId: "wisdom_bloom", tranquility: 10 },
    },
  ];
};

/**
 * Verifica colisiones con obstáculos para navegación de entidades
 */
export const checkCollisionWithObstacles = (
  position: { x: number; y: number },
  entitySize: number,
  mapElements: MapElement[],
): boolean => {
  const obstacles = mapElements.filter(
    (element) => element.type === "obstacle",
  );

  for (const obstacle of obstacles) {
    const obstacleCenter = {
      x: obstacle.position.x + obstacle.size.width / 2,
      y: obstacle.position.y + obstacle.size.height / 2,
    };

    const distance = Math.sqrt(
      Math.pow(position.x - obstacleCenter.x, 2) +
        Math.pow(position.y - obstacleCenter.y, 2),
    );

    const minDistance =
      entitySize / 2 + Math.min(obstacle.size.width, obstacle.size.height) / 2;

    if (distance < minDistance) {
      return true;
    }
  }

  return false;
};

/**
 * Determina en qué zona se encuentra una entidad
 */
export const getEntityZone = (
  entityPosition: { x: number; y: number },
  zones: Zone[],
): Zone | null => {
  for (const zone of zones) {
    const withinX =
      entityPosition.x >= zone.bounds.x &&
      entityPosition.x <= zone.bounds.x + zone.bounds.width;
    const withinY =
      entityPosition.y >= zone.bounds.y &&
      entityPosition.y <= zone.bounds.y + zone.bounds.height;

    if (withinX && withinY) {
      return zone;
    }
  }
  return null;
};

/**
 * Calcula el target de atracción más adecuado para una entidad
 */
export const getAttractionTarget = (
  entityStats: EntityStats,
  zones: Zone[],
  currentPosition: { x: number; y: number },
  entityMood?: string,
): { x: number; y: number; zone: Zone } | null => {
  let bestZone: Zone | null = null;
  let bestScore = -Infinity;

  for (const zone of zones) {
    let score = zone.attractiveness * 10;

    if (zone.effects?.hunger && entityStats.hunger < 35) {
      score += (35 - entityStats.hunger) * 0.8;
    }
    if (zone.effects?.sleepiness && entityStats.sleepiness < 30) {
      score += (30 - entityStats.sleepiness) * 0.9;
    }
    if (zone.effects?.loneliness && entityStats.loneliness < 35) {
      score += (35 - entityStats.loneliness) * 0.7;
    }
    if (zone.effects?.boredom && entityStats.boredom < 40) {
      score += (40 - entityStats.boredom) * 0.6;
    }
    if (zone.effects?.energy && entityStats.energy < 25) {
      score += (25 - entityStats.energy) * 0.8;
    }
    if (zone.effects?.money && entityStats.money < 30) {
      score += (30 - entityStats.money) * 0.5;
    }

    if (entityMood) {
      const moodZoneBonus = getMoodZoneCompatibility(entityMood, zone.type);
      score += moodZoneBonus;
    }

    const zoneCenter = {
      x: zone.bounds.x + zone.bounds.width / 2,
      y: zone.bounds.y + zone.bounds.height / 2,
    };
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - zoneCenter.x, 2) +
        Math.pow(currentPosition.y - zoneCenter.y, 2),
    );
    score -= distance / 500;

    if (zone.metadata?.priority) {
      score += (5 - zone.metadata.priority) * 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  if (bestZone) {
    const variationX = (Math.random() - 0.5) * bestZone.bounds.width * 0.3;
    const variationY = (Math.random() - 0.5) * bestZone.bounds.height * 0.3;

    return {
      x: bestZone.bounds.x + bestZone.bounds.width / 2 + variationX,
      y: bestZone.bounds.y + bestZone.bounds.height / 2 + variationY,
      zone: bestZone,
    };
  }

  return null;
};

/**
 * Calcula compatibilidad entre mood y tipo de zona
 */
const getMoodZoneCompatibility = (mood: string, zoneType: string): number => {
  const compatibilityMap: Record<string, Record<string, number>> = {
    "😊": { play: 15, social: 12, food: 8 },
    "😢": { comfort: 20, rest: 15, social: 10 },
    "😌": { comfort: 18, rest: 12, play: 8 },
    "🤩": { play: 20, social: 15, energy: 10 },
    "😑": { play: 15, energy: 12, work: 8 },
    "😔": { social: 18, comfort: 15, play: 10 },
    "😴": { rest: 25, comfort: 15, energy: 8 },
    "😰": { comfort: 20, rest: 12, social: 8 },
  };

  return compatibilityMap[mood]?.[zoneType] || 0;
};

/**
 * ULTRA-OPTIMIZADO: Desactiva BiomeSystem para máximo rendimiento
 * Genera un mapa usando solo el sistema legacy optimizado
 */
export const generateSimpleMap = (
  _useNewBiomeSystem = false, // ⚡ FORZADO A FALSE para 60 FPS
  _worldConfig?: Partial<WorldGenConfig>,
): {
  zones: Zone[];
  mapElements: MapElement[];
  generatedWorld?: GeneratedWorld;
} => {
  // ⚡ SIEMPRE usar sistema legacy optimizado
  const legacyData = generateLegacyMap();
  logAutopoiesis.info(
    "🚀 ULTRA-OPTIMIZED: Using legacy map system for maximum FPS",
    {
      zones: legacyData.zones.length,
      mapElements: legacyData.mapElements.length,
      biomeSystemDisabled: true,
    },
  );

  return {
    zones: legacyData.zones,
    mapElements: legacyData.mapElements,
    generatedWorld: undefined,
  };
};

/**
 * Genera un mapa usando el nuevo sistema de biomas
 */
const generateBiomeBasedMap = (
  worldConfig?: Partial<WorldGenConfig>,
): {
  zones: Zone[];
  mapElements: MapElement[];
  generatedWorld: GeneratedWorld;
} => {
  logAutopoiesis.info("🌍 Generando mapa con sistema de biomas avanzado");

  // Configuración por defecto o personalizada
  const config = worldConfig
    ? { ...createCustomWorldConfig({ size: "xlarge" }), ...worldConfig }
    : getWorldPreset("balanced")?.config ||
      createCustomWorldConfig({ size: "xlarge" });

  // Crear sistema de biomas
  const biomeSystem = new BiomeSystem(config);

  // Generar mundo con biomas
  const generatedWorld = biomeSystem.generateWorld();

  // Crear zonas funcionales básicas (adaptadas)
  const baseZones = createDefaultZones();
  const biomeDrivenZones = biomeSystem.integrateGameplayZones(baseZones);

  // Generar elementos de mapa desde biomas
  const biomeElements = biomeSystem.generateBiomeAwareMapElements();

  // Combinar con elementos legacy importantes
  const legacyElements = createEssentialLegacyElements();
  const allElements = [...biomeElements, ...legacyElements];

  logAutopoiesis.info("✅ Mapa con biomas generado", {
    zonesCount: biomeDrivenZones.length,
    biomeElementsCount: biomeElements.length,
    legacyElementsCount: legacyElements.length,
    totalElements: allElements.length,
    worldStats: biomeSystem.getWorldStats(),
  });

  return {
    zones: biomeDrivenZones,
    mapElements: allElements,
    generatedWorld,
  };
};

/**
 * Genera un mapa usando el sistema legacy (para compatibilidad)
 */
const generateLegacyMap = (): { zones: Zone[]; mapElements: MapElement[] } => {
  const zones = createDefaultZones();
  // ⚡ AMPLIADO: 18 elementos para el mapa expandido manteniendo optimización FPS
  const mapElements = createExpandedMapElements();

  logAutopoiesis.info("🚀 ULTRA-OPTIMIZED Legacy map system", {
    zonesCount: zones.length,
    elementsCount: mapElements.length,
    optimizationLevel: "MAXIMUM_FPS",
    biomeSystemDisabled: true,
  });

  return { zones, mapElements };
};

/**
 * Elementos ampliados para el mapa expandido (12 zonas + elementos)
 */
const createExpandedMapElements = (): MapElement[] => {
  return [
    // Elementos centrales de referencia
    {
      id: "central_wisdom_stone",
      type: "obstacle",
      position: { x: 1200, y: 800 },
      size: { width: 50, height: 45 },
      color: "#7f8c8d",
      metadata: { assetId: "wisdom_stone", interactive: false },
    },

    // Árboles antiguos distribuidos
    {
      id: "ancient_tree_north",
      type: "obstacle",
      position: { x: 800, y: 300 },
      size: { width: 40, height: 60 },
      color: "#27ae60",
      metadata: { assetId: "ancient_tree", interactive: false },
    },

    {
      id: "harmony_tree_south",
      type: "obstacle",
      position: { x: 1000, y: 1200 },
      size: { width: 40, height: 60 },
      color: "#27ae60",
      metadata: { assetId: "harmony_tree", interactive: false },
    },

    // Elementos de comida distribuidos por el mapa
    {
      id: "golden_fruit_bush_west",
      type: "food_zone",
      position: { x: 300, y: 250 },
      size: { width: 15, height: 15 },
      color: "#f39c12",
      metadata: { assetId: "golden_fruit", nutrition: 12 },
    },

    {
      id: "azure_bloom_patch_east",
      type: "food_zone",
      position: { x: 1600, y: 800 },
      size: { width: 10, height: 10 },
      color: "#3498db",
      metadata: { assetId: "azure_bloom", nutrition: 6 },
    },

    {
      id: "mystical_berries_center",
      type: "food_zone",
      position: { x: 1200, y: 600 },
      size: { width: 12, height: 12 },
      color: "#9b59b6",
      metadata: { assetId: "mystical_berries", nutrition: 8 },
    },

    // Elementos de descanso
    {
      id: "quantum_bed_primary",
      type: "rest_zone",
      position: { x: 950, y: 500 },
      size: { width: 30, height: 15 },
      color: "#8e44ad",
      metadata: { assetId: "quantum_bed", comfort: 25 },
    },

    {
      id: "levitating_cushion_spa",
      type: "rest_zone",
      position: { x: 250, y: 500 },
      size: { width: 20, height: 20 },
      color: "#9b59b6",
      metadata: { assetId: "levitating_cushion", comfort: 15 },
    },

    // Elementos sociales
    {
      id: "resonance_fountain",
      type: "social_zone",
      position: { x: 750, y: 900 },
      size: { width: 40, height: 40 },
      color: "#16a085",
      metadata: { assetId: "resonance_fountain", social_boost: 20 },
    },

    {
      id: "connection_bench_plaza",
      type: "social_zone",
      position: { x: 650, y: 950 },
      size: { width: 30, height: 15 },
      color: "#1abc9c",
      metadata: { assetId: "connection_bench", social_boost: 10 },
    },

    // Elementos de juego
    {
      id: "cosmic_light_pole_creative",
      type: "play_zone",
      position: { x: 1550, y: 700 },
      size: { width: 18, height: 30 },
      color: "#f1c40f",
      metadata: { assetId: "cosmic_light", fun_factor: 8 },
    },

    {
      id: "dimensional_swing",
      type: "play_zone",
      position: { x: 1500, y: 1100 },
      size: { width: 25, height: 35 },
      color: "#e67e22",
      metadata: { assetId: "dimensional_swing", fun_factor: 15 },
    },

    // Elementos de trabajo
    {
      id: "productivity_beacon",
      type: "work_zone",
      position: { x: 1500, y: 200 },
      size: { width: 18, height: 30 },
      color: "#34495e",
      metadata: { assetId: "productivity_beacon", efficiency: 12 },
    },

    {
      id: "trade_crystal",
      type: "work_zone",
      position: { x: 550, y: 1300 },
      size: { width: 20, height: 25 },
      color: "#d35400",
      metadata: { assetId: "trade_crystal", commerce: 10 },
    },

    // Elementos de comodidad
    {
      id: "serenity_flower_spa",
      type: "comfort_zone",
      position: { x: 200, y: 550 },
      size: { width: 10, height: 10 },
      color: "#9b59b6",
      metadata: { assetId: "serenity_flower", tranquility: 8 },
    },

    {
      id: "harmony_crystal_meditation",
      type: "comfort_zone",
      position: { x: 250, y: 800 },
      size: { width: 15, height: 20 },
      color: "#663399",
      metadata: { assetId: "harmony_crystal", peace: 12 },
    },

    // Puntos de spawn para entidades
    {
      id: "spawn_point_circle",
      type: "decoration",
      position: { x: 400, y: 600 },
      size: { width: 20, height: 20 },
      color: "#3498db",
      metadata: { entityType: "circle", spawnable: true },
    },

    {
      id: "spawn_point_square",
      type: "decoration",
      position: { x: 1800, y: 1000 },
      size: { width: 20, height: 20 },
      color: "#e74c3c",
      metadata: { entityType: "square", spawnable: true },
    },
  ];
};

/**
 * ⚡ ULTRA-MINIMAL: Solo 3 elementos para máximo rendimiento
 */
const createUltraMinimalElements = (): MapElement[] => {
  return [
    // Solo 1 elemento central para orientación
    {
      id: "central_reference",
      type: "decoration",
      position: { x: 600, y: 400 },
      size: { width: 32, height: 32 },
      color: "#e74c3c",
      metadata: {
        assetId: "Chest", // Verified existing asset
        interactive: false,
        essential: true,
      },
    },
    // Solo 1 elemento de comida esencial
    {
      id: "minimal_food",
      type: "food_zone",
      position: { x: 300, y: 200 },
      size: { width: 24, height: 24 },
      color: "#27ae60",
      metadata: {
        assetId: "campfire", // Verified existing asset
        nutrition: 10,
        essential: true,
      },
    },
    // Solo 1 punto de referencia
    {
      id: "minimal_landmark",
      type: "obstacle",
      position: { x: 900, y: 300 },
      size: { width: 32, height: 32 },
      color: "#3498db",
      metadata: {
        assetId: "Bench_1", // Verified existing asset
        interactive: false,
        essential: true,
      },
    },
  ];
};

/**
 * Crea elementos legacy esenciales que se mantienen en el nuevo sistema
 */
const createEssentialLegacyElements = (): MapElement[] => {
  return [
    // Mantener algunos obstáculos clave para navegación
    {
      id: "central_landmark",
      type: "obstacle",
      position: { x: 500, y: 320 },
      size: { width: 50, height: 45 },
      color: "#7f8c8d",
      metadata: {
        assetId: "wisdom_stone",
        interactive: false,
        essential: true,
      },
    },

    // Punto de spawn central
    {
      id: "spawn_point_circle",
      type: "decoration",
      position: { x: 200, y: 200 },
      size: { width: 20, height: 20 },
      color: "#3498db",
      metadata: { entityType: "circle", spawnable: true },
    },

    {
      id: "spawn_point_square",
      type: "decoration",
      position: { x: 600, y: 300 },
      size: { width: 20, height: 20 },
      color: "#e74c3c",
      metadata: { entityType: "square", spawnable: true },
    },
  ];
};

/**
 * Valida que el mapa generado tenga elementos esenciales
 */
export const validateMapIntegrity = (
  zones: Zone[],
  mapElements: MapElement[],
): boolean => {
  const essentialZoneTypes = ["food", "rest", "social"];
  const hasEssentialZones = essentialZoneTypes.every((type) =>
    zones.some((zone) => zone.type === type),
  );

  const hasValidBounds = zones.every(
    (zone) =>
      zone.bounds.width > 0 &&
      zone.bounds.height > 0 &&
      zone.bounds.x >= 0 &&
      zone.bounds.y >= 0,
  );

  const hasInteractiveElements = mapElements.length > 5;

  const isValid = hasEssentialZones && hasValidBounds && hasInteractiveElements;

  if (!isValid) {
    logAutopoiesis.warn("Validación de mapa falló", {
      hasEssentialZones,
      hasValidBounds,
      hasInteractiveElements,
      zonesCount: zones.length,
      elementsCount: mapElements.length,
    });
  }

  return isValid;
};

/**
 * Función principal para generar mapas con validación
 * Ahora también retorna datos del mundo generado para tilemaps
 */
export const generateValidatedMap = (): {
  zones: Zone[];
  mapElements: MapElement[];
  generatedWorld?: GeneratedWorld;
} => {
  const mapData = generateSimpleMap();

  if (!validateMapIntegrity(mapData.zones, mapData.mapElements)) {
    logAutopoiesis.error("Mapa generado no pasó validación, usando fallback");

    return {
      zones: createDefaultZones().slice(0, 4),
      mapElements: createDefaultMapElements().slice(0, 8),
      generatedWorld: undefined,
    };
  }

  return {
    zones: mapData.zones,
    mapElements: mapData.mapElements,
    generatedWorld: mapData.generatedWorld,
  };
};

/**
 * Genera un mapa de prueba usando el nuevo sistema de biomas
 */
export const generateTestBiomeMap = (): {
  zones: Zone[];
  mapElements: MapElement[];
} => {
  logAutopoiesis.info("🧪 Generando mapa de prueba con biomas");

  const testConfig = createCustomWorldConfig({
    size: "small",
    biomePreference: "balanced",
    density: "normal",
    seed: 42,
  });

  return generateSimpleMap(true, testConfig);
};

/**
 * Genera diferentes tipos de mapa para demostración
 */
export const generateDemoMaps = (): Record<
  string,
  { zones: Zone[]; mapElements: MapElement[] }
> => {
  const demos: Record<string, { zones: Zone[]; mapElements: MapElement[] }> =
    {};

  // Mapa Legacy
  demos.legacy = generateSimpleMap(false);

  // Mapa Equilibrado
  demos.balanced = generateSimpleMap(
    true,
    createCustomWorldConfig({
      size: "medium",
      biomePreference: "balanced",
    }),
  );

  // Mapa Boscoso
  demos.forest = generateSimpleMap(
    true,
    createCustomWorldConfig({
      size: "medium",
      biomePreference: "forest",
    }),
  );

  // Mapa Místico
  demos.mystical = generateSimpleMap(
    true,
    createCustomWorldConfig({
      size: "small",
      biomePreference: "mystical",
    }),
  );

  logAutopoiesis.info("🎨 Mapas de demostración generados", {
    totalDemos: Object.keys(demos).length,
    types: Object.keys(demos),
  });

  return demos;
};
