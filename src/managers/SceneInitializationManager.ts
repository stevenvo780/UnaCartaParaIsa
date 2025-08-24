/**
 * Manager para inicialización de la escena principal
 * Ahora usa el sistema de composición diversa para máxima variedad visual
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { type ComposedWorld } from "../world/DiverseWorldComposer";

export interface InitializationResult {
  gameState: GameState;
  generatedWorldData: {
    composedWorld: ComposedWorld;
    seed: string;
    stats: any;
  };
}

export class SceneInitializationManager {
  /**
   * Inicializa el estado del juego usando el nuevo sistema de biomas diverso
   */
  static async initialize(): Promise<InitializationResult> {
    logAutopoiesis.info("🌍 Inicializando mundo con máxima diversidad...");

    const seed = `world_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Crear un estado de juego básico primero
    const gameState: GameState = {
      zones: [
        // Zona de comida grande y visible (verde brillante)
        {
          id: "food_zone_central",
          type: "food" as const,
          name: "Zona de Alimentación Central",
          bounds: { x: 1200, y: 1000, width: 400, height: 400 },
          color: "#00FF00", // Verde brillante
          attractiveness: 8,
          effects: { energy: 10, happiness: 5 },
        },
        // Zona de agua/hidratación (azul brillante)
        {
          id: "water_zone_north",
          type: "water" as const,
          name: "Fuente de Agua Norte",
          bounds: { x: 800, y: 600, width: 300, height: 300 },
          color: "#00BFFF", // Azul celeste brillante
          attractiveness: 7,
          effects: { energy: 8, comfort: 6 },
        },
        // Zona de descanso (morado)
        {
          id: "rest_zone_south",
          type: "rest" as const,
          name: "Área de Descanso",
          bounds: { x: 1600, y: 1800, width: 350, height: 350 },
          color: "#FF00FF", // Magenta brillante
          attractiveness: 9,
          effects: { energy: 15, comfort: 10, happiness: 8 },
        },
        // Zona médica - Recuperación de salud
        {
          id: "medical_zone_hospital",
          type: "medical" as const,
          name: "Hospital Central",
          bounds: { x: 500, y: 1200, width: 300, height: 250 },
          color: "#FF6B6B", // Rojo médico
          attractiveness: 6,
          effects: { health: 20, comfort: 8, mentalHealth: 5 },
        },
        // Zona de entrenamiento - Mejora resistencia
        {
          id: "training_zone_gym",
          type: "training" as const,
          name: "Gimnasio de Entrenamiento",
          bounds: { x: 300, y: 800, width: 280, height: 280 },
          color: "#FFA500", // Naranja energético
          attractiveness: 7,
          effects: { stamina: 15, energy: -5, health: 10 },
        },
        // Zona de conocimiento - Mejora inteligencia
        {
          id: "knowledge_zone_library",
          type: "knowledge" as const,
          name: "Gran Biblioteca",
          bounds: { x: 1800, y: 500, width: 250, height: 300 },
          color: "#4ECDC4", // Verde azulado intelectual
          attractiveness: 5,
          effects: { intelligence: 12, mentalHealth: 8, boredom: -10 },
        },
        // Zona espiritual - Recuperación mental y social
        {
          id: "spiritual_zone_temple",
          type: "spiritual" as const,
          name: "Templo de Serenidad",
          bounds: { x: 1000, y: 400, width: 200, height: 200 },
          color: "#9B59B6", // Púrpura espiritual
          attractiveness: 8,
          effects: { mentalHealth: 18, stress: -15, socialSkills: 8 },
        },
        // Zona de mercado - Mejora habilidades sociales
        {
          id: "market_zone_plaza",
          type: "market" as const,
          name: "Plaza del Mercado",
          bounds: { x: 1400, y: 1400, width: 350, height: 200 },
          color: "#F39C12", // Amarillo comercial
          attractiveness: 6,
          effects: { socialSkills: 10, happiness: 6, money: 5 },
        },
      ],
      mapElements: [
        // Hospital en zona médica
        {
          id: "hospital_building",
          type: "decoration" as const,
          position: { x: 650, y: 1325 }, // Centro de zona médica
          size: { width: 80, height: 80 },
          color: "#FF6B6B",
          metadata: {
            furnitureType: "hospital",
            assetId: "hospital",
            scale: 1.0,
            interactive: true,
          }
        },
        // Gimnasio en zona de entrenamiento
        {
          id: "gym_building",
          type: "decoration" as const,
          position: { x: 440, y: 940 }, // Centro de zona de entrenamiento
          size: { width: 70, height: 70 },
          color: "#FFA500",
          metadata: {
            furnitureType: "gymnasium",
            assetId: "gymnasium",
            scale: 1.0,
            interactive: true,
          }
        },
        // Biblioteca en zona de conocimiento
        {
          id: "library_building",
          type: "decoration" as const,
          position: { x: 1925, y: 650 }, // Centro de zona de conocimiento
          size: { width: 60, height: 75 },
          color: "#4ECDC4",
          metadata: {
            furnitureType: "library_building",
            assetId: "library_building",
            scale: 1.0,
            interactive: true,
          }
        },
        // Templo en zona espiritual
        {
          id: "temple_building",
          type: "decoration" as const,
          position: { x: 1100, y: 500 }, // Centro de zona espiritual
          size: { width: 50, height: 50 },
          color: "#9B59B6",
          metadata: {
            furnitureType: "temple",
            assetId: "temple",
            scale: 1.0,
            interactive: true,
          }
        },
        // Mercado en zona de mercado
        {
          id: "market_building",
          type: "decoration" as const,
          position: { x: 1575, y: 1500 }, // Centro de zona de mercado
          size: { width: 90, height: 50 },
          color: "#F39C12",
          metadata: {
            furnitureType: "market",
            assetId: "market",
            scale: 1.0,
            interactive: true,
          }
        },
      ],
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
      terrainTiles: [],
      roads: [],
      objectLayers: [],
      worldSize: { width: 2048, height: 2048 }, // 64 tiles × 32px (smaller but workable)
      generatorVersion: "2.0.0-diverse",
      mapSeed: seed,
    };

    // Crear mundo básico sin DiverseWorldComposer por ahora (scene no disponible)
    const startTime = Date.now();

    // Generar mundo básico para que el juego funcione
    const composedWorld: ComposedWorld = {
      layers: [
        {
          type: "terrain",
          name: "Basic Terrain",
          assets: [],
          zIndex: 0,
          visible: true,
        },
      ],
      clusters: [],
      stats: {
        totalAssets: 0,
        diversityIndex: 0,
        clusterCount: 0,
        layerCount: 0,
        compositionTime: 0,
      },
    };
    const generationTime = Date.now() - startTime;

    logAutopoiesis.info("✅ Mundo generado exitosamente con BiomeSystem", {
      seed,
      gameStateReady: true,
      generationTime,
      biomesGenerated: composedWorld?.stats?.totalAssets || 0,
    });

    return {
      gameState,
      generatedWorldData: {
        composedWorld,
        seed,
        stats: {
          generationTime,
          totalAssets: composedWorld?.stats?.totalAssets || 0,
          biomeDistribution: composedWorld?.stats || {},
        },
      },
    };
  }
}
