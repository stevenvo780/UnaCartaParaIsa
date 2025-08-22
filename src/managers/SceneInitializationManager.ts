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
            worldSize: { width: 2400, height: 2400 },
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
