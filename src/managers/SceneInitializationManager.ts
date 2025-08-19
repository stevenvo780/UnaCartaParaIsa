/**
 * Manager para inicialización de la escena principal
 * Extrae la lógica de inicialización del MainScene god object
 */

import type { GameState } from '../types';
import { generateValidatedMap } from '../utils/simpleMapGeneration';
import { logAutopoiesis } from '../utils/logger';

export interface InitializationResult {
  gameState: GameState;
  generatedWorldData: any;
}

export class SceneInitializationManager {
  /**
   * Inicializa el estado del juego y genera el mapa
   */
  static initialize(): InitializationResult {
    logAutopoiesis.info('Initializing game state and world');
    
    const mapData = generateValidatedMap();
    
    const gameState: GameState = {
      entities: [],
      resonance: 0,
      cycles: 0,
      lastSave: Date.now(),
      togetherTime: 0,
      connectionAnimation: {
        active: false,
        startTime: 0,
        type: 'FEED'
      },
      zones: mapData.zones,
      mapElements: mapData.mapElements,
      currentConversation: {
        isActive: false,
        participants: [],
        lastSpeaker: null,
        lastDialogue: null,
        startTime: 0
      },
      terrainTiles: mapData.terrainTiles || [],
      roads: mapData.roads || [],
      objectLayers: mapData.objectLayers || [],
      worldSize: { width: 1200, height: 800 },
      generatorVersion: '1.0'
    };

    return {
      gameState,
      generatedWorldData: mapData.generatedWorld
    };
  }
}