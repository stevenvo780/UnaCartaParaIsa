/**
 * Manager para inicialización de la escena principal
 * Extrae la lógica de inicialización del MainScene god object
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { ProceduralWorldGenerator } from "../world/ProceduralWorldGenerator";

export interface InitializationResult {
  gameState: GameState;
  generatedWorldData: any;
}

export class SceneInitializationManager {
  /**
   * Inicializa el estado del juego y genera el mapa
   */
  static initialize(): InitializationResult {
    logAutopoiesis.info("🌍 Inicializando mundo procedural...");

    // Crear generador procedural con seed único
    const worldGenerator = new ProceduralWorldGenerator({
      width: 2400,
      height: 1600,
      seed: `world_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      biomeDensity: 0.6,
      resourceDensity: 0.4,
    });

    // Generar mundo completo
    const gameState = worldGenerator.generateWorld();

    const stats = worldGenerator.getGenerationStats();
    logAutopoiesis.info("✅ Mundo procedural generado", {
      seed: stats.seed,
      zones: gameState.zones.length,
      elements: gameState.mapElements.length,
      biomes: stats.biomeTypes,
      worldSize: `${stats.worldDimensions.width}x${stats.worldDimensions.height}`,
    });

    return {
      gameState,
      generatedWorldData: {
        generator: worldGenerator,
        stats,
        seed: stats.seed,
      },
    };
  }
}
