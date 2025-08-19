/**
 * Sistema de Generación de Mapas para Una Carta Para Isa
 * Adaptado al motor Phaser - Preserva la lógica de zonas y elementos
 */

import type { Zone, MapElement, EntityStats } from '../types';
import { logAutopoiesis } from './logger';

export const createDefaultZones = (): Zone[] => {
  return [
    {
      id: 'nourishment_garden',
      name: 'Jardín de Nutrición',
      bounds: { x: 80, y: 60, width: 280, height: 140 },
      type: 'food',
      color: 'rgba(46, 204, 113, 0.3)',
      attractiveness: 1.2,
      effects: {
        hunger: 35,
        happiness: 15,
        energy: 8,
        health: 5
      },
      metadata: {
        priority: 1,
        furnitureTypes: ['flowers', 'fruits', 'water_fountain']
      }
    },

    {
      id: 'quantum_rest_chamber',
      name: 'Cámara de Descanso Cuántico',
      bounds: { x: 420, y: 70, width: 220, height: 130 },
      type: 'rest',
      color: 'rgba(52, 152, 219, 0.3)',
      attractiveness: 1.1,
      effects: {
        sleepiness: 40,
        energy: 35,
        happiness: 18,
        health: 10
      },
      metadata: {
        priority: 2,
        furnitureTypes: ['bed', 'cushions', 'ambient_lights']
      }
    },

    {
      id: 'cosmic_playground',
      name: 'Patio de Juegos Cósmico',
      bounds: { x: 380, y: 240, width: 280, height: 200 },
      type: 'play',
      color: 'rgba(241, 196, 15, 0.35)',
      attractiveness: 1.3,
      effects: {
        boredom: 50,
        happiness: 30,
        loneliness: 25,
        energy: -8
      },
      metadata: {
        priority: 1,
        furnitureTypes: ['swings', 'slides', 'interactive_objects']
      }
    },

    {
      id: 'resonance_social_plaza',
      name: 'Plaza de Resonancia Social',
      bounds: { x: 60, y: 350, width: 250, height: 160 },
      type: 'social',
      color: 'rgba(155, 89, 182, 0.3)',
      attractiveness: 1.15,
      effects: {
        loneliness: 45,
        happiness: 25,
        boredom: 20,
        energy: 5
      },
      metadata: {
        priority: 2,
        furnitureTypes: ['benches', 'meeting_table', 'campfire']
      }
    },

    {
      id: 'meditation_sanctuary',
      name: 'Santuario de Meditación',
      bounds: { x: 320, y: 480, width: 200, height: 120 },
      type: 'comfort',
      color: 'rgba(102, 51, 153, 0.25)',
      attractiveness: 0.9,
      effects: {
        happiness: 22,
        boredom: 25,
        loneliness: 18,
        sleepiness: 12,
        energy: 15,
        health: 8
      },
      metadata: {
        priority: 3,
        furnitureTypes: ['meditation_cushions', 'incense', 'zen_garden']
      }
    },

    {
      id: 'productivity_workshop',
      name: 'Taller de Productividad',
      bounds: { x: 700, y: 80, width: 180, height: 140 },
      type: 'work',
      color: 'rgba(189, 195, 199, 0.25)',
      attractiveness: 0.7,
      effects: {
        money: 90,
        boredom: -15,
        energy: -20,
        happiness: -5
      },
      metadata: {
        priority: 4,
        furnitureTypes: ['desk', 'computer', 'tools']
      }
    },

    {
      id: 'energy_nexus',
      name: 'Nexo Energético',
      bounds: { x: 720, y: 280, width: 160, height: 140 },
      type: 'energy',
      color: 'rgba(230, 126, 34, 0.3)',
      attractiveness: 1.0,
      effects: {
        energy: 55,
        sleepiness: 30,
        happiness: 12,
        money: -15,
        health: 5
      },
      metadata: {
        priority: 2,
        furnitureTypes: ['energy_crystal', 'charging_pod', 'power_core']
      }
    }
  ];
};

export const createDefaultMapElements = (): MapElement[] => {
  return [
    // Obstáculos naturales
    {
      id: 'central_wisdom_stone',
      type: 'obstacle',
      position: { x: 500, y: 320 },
      size: { width: 50, height: 45 },
      color: '#7f8c8d',
      metadata: { assetId: 'wisdom_stone', interactive: false }
    },
    {
      id: 'ancient_tree_north',
      type: 'obstacle',
      position: { x: 220, y: 45 },
      size: { width: 30, height: 70 },
      color: '#27ae60',
      metadata: { assetId: 'ancient_tree', interactive: false }
    },
    {
      id: 'harmony_tree_south',
      type: 'obstacle',
      position: { x: 280, y: 440 },
      size: { width: 30, height: 70 },
      color: '#27ae60',
      metadata: { assetId: 'harmony_tree', interactive: false }
    },

    // Elementos de zona de comida/nutrición
    {
      id: 'crystal_flower_1',
      type: 'food_zone',
      position: { x: 100, y: 90 },
      size: { width: 12, height: 12 },
      color: '#e91e63',
      metadata: { assetId: 'crystal_flower_pink', nutrition: 8 }
    },
    {
      id: 'golden_fruit_bush',
      type: 'food_zone',
      position: { x: 150, y: 120 },
      size: { width: 15, height: 15 },
      color: '#f39c12',
      metadata: { assetId: 'golden_fruit', nutrition: 12 }
    },
    {
      id: 'azure_bloom_patch',
      type: 'food_zone',
      position: { x: 200, y: 140 },
      size: { width: 10, height: 10 },
      color: '#3498db',
      metadata: { assetId: 'azure_bloom', nutrition: 6 }
    },

    // Elementos de zona de descanso
    {
      id: 'quantum_bed_primary',
      type: 'rest_zone',
      position: { x: 450, y: 100 },
      size: { width: 30, height: 15 },
      color: '#8e44ad',
      metadata: { assetId: 'quantum_bed', comfort: 25 }
    },
    {
      id: 'levitating_cushion',
      type: 'rest_zone',
      position: { x: 520, y: 140 },
      size: { width: 20, height: 20 },
      color: '#9b59b6',
      metadata: { assetId: 'levitating_cushion', comfort: 15 }
    },

    // Elementos de zona social
    {
      id: 'resonance_fountain',
      type: 'social_zone',
      position: { x: 150, y: 400 },
      size: { width: 40, height: 40 },
      color: '#16a085',
      metadata: { assetId: 'resonance_fountain', social_boost: 20 }
    },
    {
      id: 'connection_bench_1',
      type: 'social_zone',
      position: { x: 100, y: 450 },
      size: { width: 30, height: 15 },
      color: '#1abc9c',
      metadata: { assetId: 'connection_bench', social_boost: 10 }
    },
    {
      id: 'connection_bench_2',
      type: 'social_zone',
      position: { x: 220, y: 470 },
      size: { width: 30, height: 15 },
      color: '#1abc9c',
      metadata: { assetId: 'connection_bench', social_boost: 10 }
    },

    // Elementos de zona de juego
    {
      id: 'cosmic_light_pole_1',
      type: 'play_zone',
      position: { x: 400, y: 280 },
      size: { width: 18, height: 30 },
      color: '#f1c40f',
      metadata: { assetId: 'cosmic_light', fun_factor: 8 }
    },
    {
      id: 'cosmic_light_pole_2',
      type: 'play_zone',
      position: { x: 580, y: 300 },
      size: { width: 18, height: 30 },
      color: '#f1c40f',
      metadata: { assetId: 'cosmic_light', fun_factor: 8 }
    },
    {
      id: 'dimensional_swing',
      type: 'play_zone',
      position: { x: 480, y: 350 },
      size: { width: 25, height: 35 },
      color: '#e67e22',
      metadata: { assetId: 'dimensional_swing', fun_factor: 15 }
    },

    // Elementos de zona de trabajo
    {
      id: 'productivity_beacon',
      type: 'work_zone',
      position: { x: 760, y: 110 },
      size: { width: 18, height: 30 },
      color: '#34495e',
      metadata: { assetId: 'productivity_beacon', efficiency: 12 }
    },

    // Elementos de meditación
    {
      id: 'serenity_flower_1',
      type: 'comfort_zone',
      position: { x: 340, y: 500 },
      size: { width: 10, height: 10 },
      color: '#9b59b6',
      metadata: { assetId: 'serenity_flower', tranquility: 8 }
    },
    {
      id: 'harmony_flower_2',
      type: 'comfort_zone',
      position: { x: 420, y: 520 },
      size: { width: 10, height: 10 },
      color: '#3498db',
      metadata: { assetId: 'harmony_flower', tranquility: 6 }
    },
    {
      id: 'wisdom_bloom_3',
      type: 'comfort_zone',
      position: { x: 480, y: 550 },
      size: { width: 10, height: 10 },
      color: '#e91e63',
      metadata: { assetId: 'wisdom_bloom', tranquility: 10 }
    }
  ];
};

/**
 * Verifica colisiones con obstáculos para navegación de entidades
 */
export const checkCollisionWithObstacles = (
  position: { x: number; y: number },
  entitySize: number,
  mapElements: MapElement[]
): boolean => {
  const obstacles = mapElements.filter(element => element.type === 'obstacle');

  for (const obstacle of obstacles) {
    const obstacleCenter = {
      x: obstacle.position.x + obstacle.size.width / 2,
      y: obstacle.position.y + obstacle.size.height / 2
    };

    const distance = Math.sqrt(
      Math.pow(position.x - obstacleCenter.x, 2) +
      Math.pow(position.y - obstacleCenter.y, 2)
    );

    const minDistance = entitySize / 2 + Math.min(obstacle.size.width, obstacle.size.height) / 2;
    
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
  zones: Zone[]
): Zone | null => {
  for (const zone of zones) {
    const withinX = entityPosition.x >= zone.bounds.x && 
                   entityPosition.x <= zone.bounds.x + zone.bounds.width;
    const withinY = entityPosition.y >= zone.bounds.y && 
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
  entityMood?: string
): { x: number; y: number; zone: Zone } | null => {
  let bestZone: Zone | null = null;
  let bestScore = -Infinity;

  for (const zone of zones) {
    let score = zone.attractiveness * 10; // Base attractiveness

    // Calcular urgencia basada en stats
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

    // Bonus por mood compatible
    if (entityMood) {
      const moodZoneBonus = getMoodZoneCompatibility(entityMood, zone.type);
      score += moodZoneBonus;
    }

    // Penalización por distancia (menor peso)
    const zoneCenter = {
      x: zone.bounds.x + zone.bounds.width / 2,
      y: zone.bounds.y + zone.bounds.height / 2
    };
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - zoneCenter.x, 2) +
      Math.pow(currentPosition.y - zoneCenter.y, 2)
    );
    score -= distance / 500; // Reducir impacto de distancia

    // Bonus por prioridad de zona
    if (zone.metadata?.priority) {
      score += (5 - zone.metadata.priority) * 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  if (bestZone) {
    // Añadir algo de variabilidad al target dentro de la zona
    const variationX = (Math.random() - 0.5) * bestZone.bounds.width * 0.3;
    const variationY = (Math.random() - 0.5) * bestZone.bounds.height * 0.3;
    
    return {
      x: bestZone.bounds.x + bestZone.bounds.width / 2 + variationX,
      y: bestZone.bounds.y + bestZone.bounds.height / 2 + variationY,
      zone: bestZone
    };
  }

  return null;
};

/**
 * Calcula compatibilidad entre mood y tipo de zona
 */
const getMoodZoneCompatibility = (mood: string, zoneType: string): number => {
  const compatibilityMap: Record<string, Record<string, number>> = {
    '😊': { play: 15, social: 12, food: 8 }, // HAPPY
    '😢': { comfort: 20, rest: 15, social: 10 }, // SAD
    '😌': { comfort: 18, rest: 12, play: 8 }, // CALM
    '🤩': { play: 20, social: 15, energy: 10 }, // EXCITED
    '😑': { play: 15, energy: 12, work: 8 }, // BORED
    '😔': { social: 18, comfort: 15, play: 10 }, // LONELY
    '😴': { rest: 25, comfort: 15, energy: 8 }, // TIRED
    '😰': { comfort: 20, rest: 12, social: 8 } // ANXIOUS
  };

  return compatibilityMap[mood]?.[zoneType] || 0;
};

/**
 * Genera un mapa usando la configuración por defecto
 */
export const generateSimpleMap = (): { zones: Zone[]; mapElements: MapElement[] } => {
  const zones = createDefaultZones();
  const mapElements = createDefaultMapElements();

  logAutopoiesis.info('Mapa simple generado', {
    zonesCount: zones.length,
    elementsCount: mapElements.length,
    totalZoneArea: zones.reduce((sum, zone) => sum + (zone.bounds.width * zone.bounds.height), 0)
  });

  return { zones, mapElements };
};

/**
 * Valida que el mapa generado tenga elementos esenciales
 */
export const validateMapIntegrity = (zones: Zone[], mapElements: MapElement[]): boolean => {
  // Verificar que existan zonas esenciales
  const essentialZoneTypes = ['food', 'rest', 'social'];
  const hasEssentialZones = essentialZoneTypes.every(type =>
    zones.some(zone => zone.type === type)
  );

  // Verificar que las zonas no se superpongan excesivamente
  const hasValidBounds = zones.every(zone => 
    zone.bounds.width > 0 && 
    zone.bounds.height > 0 &&
    zone.bounds.x >= 0 && 
    zone.bounds.y >= 0
  );

  // Verificar que haya elementos interactivos
  const hasInteractiveElements = mapElements.length > 5;

  const isValid = hasEssentialZones && hasValidBounds && hasInteractiveElements;

  if (!isValid) {
    logAutopoiesis.warn('Validación de mapa falló', {
      hasEssentialZones,
      hasValidBounds,
      hasInteractiveElements,
      zonesCount: zones.length,
      elementsCount: mapElements.length
    });
  }

  return isValid;
};

/**
 * Función principal para generar mapas con validación
 */
export const generateValidatedMap = (): { zones: Zone[]; mapElements: MapElement[] } => {
  const mapData = generateSimpleMap();
  
  if (!validateMapIntegrity(mapData.zones, mapData.mapElements)) {
    logAutopoiesis.error('Mapa generado no pasó validación, usando fallback');
    // En caso de fallo, retornar configuración mínima viable
    return {
      zones: createDefaultZones().slice(0, 4), // Solo zonas esenciales
      mapElements: createDefaultMapElements().slice(0, 8) // Elementos básicos
    };
  }

  return mapData;
};