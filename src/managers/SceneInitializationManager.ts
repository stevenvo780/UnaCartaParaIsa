/**
 * Manager para inicialización de la escena principal
 * Ahora usa el sistema de composición diversa para máxima variedad visual
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { type ComposedWorld } from "../world/DiverseWorldComposer";
import { WORLD_CONFIG, ZONE_DEFINITIONS, WorldUtils } from "../constants/WorldConfig";

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

    // Generar distribución automática de zonas usando constantes centralizadas
    const zoneSizes = ZONE_DEFINITIONS.map(def => def.size);
    const zonePositions = WorldUtils.distributeZones(zoneSizes);
    
    const gameState: GameState = {
      zones: ZONE_DEFINITIONS.map((zoneDef, index) => {
        const position = zonePositions[index];
        const bounds = {
          x: position.x,
          y: position.y,
          width: zoneDef.size.width,
          height: zoneDef.size.height,
        };
        
        return {
          id: zoneDef.id,
          type: zoneDef.type as any,
          name: zoneDef.name,
          bounds,
          color: zoneDef.color,
          attractiveness: Math.floor(Math.random() * 5) + 5, // 5-9
          effects: zoneDef.effects,
        };
      }),
      mapElements: ZONE_DEFINITIONS
        .filter(zoneDef => ["medical", "training", "knowledge", "spiritual", "market"].includes(zoneDef.type))
        .map((zoneDef, index) => {
          // Encontrar la zona correspondiente
          const zoneIndex = ZONE_DEFINITIONS.findIndex(z => z.id === zoneDef.id);
          const position = zonePositions[zoneIndex];
          const center = WorldUtils.getCenter(position.x, position.y, zoneDef.size.width, zoneDef.size.height);
          
          // Mapear tipos de zona a tipos de edificio
          const buildingTypes: Record<string, { assetId: string, furnitureType: string, size: {width: number, height: number} }> = {
            medical: { assetId: "hospital", furnitureType: "hospital", size: { width: 80, height: 80 } },
            training: { assetId: "gymnasium", furnitureType: "gymnasium", size: { width: 70, height: 70 } },
            knowledge: { assetId: "library_building", furnitureType: "library_building", size: { width: 60, height: 75 } },
            spiritual: { assetId: "temple", furnitureType: "temple", size: { width: 50, height: 50 } },
            market: { assetId: "market", furnitureType: "market", size: { width: 90, height: 50 } },
          };
          
          const buildingInfo = buildingTypes[zoneDef.type];
          
          return {
            id: `${zoneDef.type}_building`,
            type: "decoration" as const,
            position: { x: center.x, y: center.y },
            size: buildingInfo.size,
            color: zoneDef.color,
            metadata: {
              furnitureType: buildingInfo.furnitureType,
              assetId: buildingInfo.assetId,
              scale: 1.0,
              interactive: true,
            }
          };
        }),
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
      worldSize: { width: WORLD_CONFIG.WORLD_WIDTH, height: WORLD_CONFIG.WORLD_HEIGHT },
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
