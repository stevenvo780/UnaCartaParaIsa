/**
 * Manager para inicialización de la escena principal
 * Extrae la lógica de inicialización del MainScene god object
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { createWorldMapData } from "../utils/simpleMapGeneration";

export interface InitializationResult {
  gameState: GameState;
  generatedWorldData: any;
}

export class SceneInitializationManager {
  /**
   * Inicializa el estado del juego y genera el mapa
   */
  static initialize(): InitializationResult {
    logAutopoiesis.info("Initializing game state and world");

    const mapData = createWorldMapData();

    // Crear el estado completo del juego
    const gameState: GameState = {
      ...mapData,
      // Añadir entidades específicas al estado inicial
      entities: [], // Serán creadas después por EntityManager
    };

    return {
      gameState,
      generatedWorldData: null, // No tenemos world data específico en el nuevo sistema
    };
  }
}
