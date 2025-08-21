/**
 * Manager para inicialización de la escena principal
 * Ahora usa el sistema de composición diversa para máxima variedad visual
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { BiomeSystem } from "../world/BiomeSystem";
import { type ComposedWorld } from "../world/DiverseWorldComposer";

export interface InitializationResult {
  gameState: GameState;
  generatedWorldData: {
    biomeSystem: BiomeSystem;
    composedWorld: ComposedWorld;
    seed: string;
    stats: any;
  };
}

export class SceneInitializationManager {
  /**
   * Convierte un string seed a número
   */
  private static stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Inicializa el estado del juego usando el nuevo sistema de biomas diverso
   */
  static async initialize(): Promise<InitializationResult> {
    logAutopoiesis.info("🌍 Inicializando mundo con máxima diversidad...");

    const seed = `world_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Crear un estado de juego básico primero
    const gameState: GameState = {
      zones: [],
      mapElements: [],
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
      worldSize: { width: 2400, height: 1600 },
      generatorVersion: "2.0.0-diverse",
      mapSeed: seed,
    };

    logAutopoiesis.info(
      "✅ Inicialización básica completada (BiomeSystem deshabilitado temporalmente)",
      {
        seed,
        gameStateReady: true,
      },
    );

    return {
      gameState,
      generatedWorldData: {
        biomeSystem: null, // Temporalmente deshabilitado
        composedWorld: null, // Se creará después de cargar assets
        seed,
        stats: {
          generationTime: 0,
          totalAssets: 0,
          biomeDistribution: {},
        },
      },
    };
  }
}
