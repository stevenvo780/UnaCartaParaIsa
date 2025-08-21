/**
 * World Renderer con Sistema de Composición Diversa
 * Renderiza mundos con máxima variedad visual usando capas múltiples
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { BiomeSystem } from "../world/BiomeSystem";
import {
  DiverseWorldComposer,
  type ComposedWorld,
} from "../world/DiverseWorldComposer";
import { DiverseWorldRenderer } from "../world/DiverseWorldRenderer";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private diverseRenderer: DiverseWorldRenderer;
  private composer: DiverseWorldComposer;
  private biomeSystem?: BiomeSystem;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.diverseRenderer = new DiverseWorldRenderer(scene);

    const seed = gameState.mapSeed || `fallback_${Date.now()}`;
    this.composer = new DiverseWorldComposer(scene, seed);

    logAutopoiesis.info("🎨 WorldRenderer diverso inicializado", {
      worldSize: gameState.worldSize,
      seed,
    });
  }

  public async renderWorld(): Promise<void> {
    logAutopoiesis.info("🌍 Iniciando renderizado de mundo diverso...");

    const startTime = Date.now();

    try {
      // Obtener sistema de biomas desde los datos generados
      const generatedWorldData = this.scene.registry.get(
        "generatedWorldData",
      ) as {
        biomeSystem?: BiomeSystem;
      } | null;

      if (generatedWorldData?.biomeSystem) {
        this.biomeSystem = generatedWorldData.biomeSystem;
      }

      if (!this.biomeSystem) {
        logAutopoiesis.warn("BiomeSystem no disponible, creando uno nuevo...");
        this.biomeSystem = new BiomeSystem({
          width: this.gameState.worldSize.width,
          height: this.gameState.worldSize.height,
          seed: String(this.gameState.mapSeed) || `fallback_${Date.now()}`,
        });
        // Generar el mundo después de crear el sistema
        this.biomeSystem.generateWorld();
      }

      // Generar o obtener mundo base
      const generatedWorld = this.biomeSystem.getCurrentWorld();

      if (!generatedWorld) {
        logAutopoiesis.warn("No hay mundo generado, creando uno básico...");
        // Renderizado de fallback inmediato si no hay mundo
        await this.renderBasicFallback();
        return;
      }

      // Componer mundo con máxima diversidad
      const composedWorld = await this.composer.composeWorld(generatedWorld);

      // Renderizar el mundo compuesto
      await this.diverseRenderer.renderComposedWorld(composedWorld);

      // Actualizar gameState con datos generados
      this.updateGameStateFromComposition(composedWorld);

      const renderTime = Date.now() - startTime;

      logAutopoiesis.info("✅ Mundo diverso renderizado exitosamente", {
        renderTime: `${renderTime}ms`,
        layers: composedWorld.layers.length,
        totalAssets: composedWorld.stats.totalAssets,
        diversityIndex: composedWorld.stats.diversityIndex.toFixed(3),
        clusters: composedWorld.clusters.length,
      });
    } catch (error) {
      logAutopoiesis.error("❌ Error renderizando mundo diverso", {
        error: String(error),
      });

      // Fallback al renderizado básico
      await this.renderBasicFallback();
    }
  }

  private updateGameStateFromComposition(composedWorld: ComposedWorld): void {
    // Actualizar mapElements con elementos del mundo compuesto
    this.gameState.mapElements = [];

    composedWorld.layers.forEach((layer) => {
      layer.assets.forEach((asset) => {
        this.gameState.mapElements.push({
          id: `${layer.name}_${asset.asset.path || Math.random()}`,
          type: this.getElementTypeFromLayer(layer.name),
          position: { x: asset.x, y: asset.y },
          size: { width: 64, height: 64 },
          metadata: {
            assetPath: asset.asset.path,
            scale: asset.scale,
            rotation: asset.rotation,
            tint: asset.tint,
            depth: asset.depth,
            ...(asset.metadata || {}),
          },
        } as any);
      });
    });

    logAutopoiesis.info("🔄 GameState actualizado con composición diversa", {
      elementos: this.gameState.mapElements.length,
      capas: composedWorld.layers.length,
    });
  }

  private getElementTypeFromLayer(layerName: string): string {
    const layerTypeMap: Record<string, string> = {
      terrain: "terrain",
      transition: "terrain",
      detail: "decoration",
      vegetation: "vegetation",
      structure: "structure",
      props: "decoration",
      effects: "effect",
    };

    return layerTypeMap[layerName] || "decoration";
  }

  private async renderBasicFallback(): Promise<void> {
    logAutopoiesis.warn("🔄 Ejecutando renderizado de fallback básico...");

    try {
      // Renderizado mínimo usando sprites básicos
      const centerX = this.gameState.worldSize.width / 2;
      const centerY = this.gameState.worldSize.height / 2;

      // Crear un sprite de terreno básico en el centro
      const fallbackSprite = this.scene.add.sprite(
        centerX,
        centerY,
        "terrain_grass_001",
      );

      fallbackSprite.setDisplaySize(64, 64);

      logAutopoiesis.info("✅ Renderizado de fallback completado");
    } catch (fallbackError) {
      logAutopoiesis.error("❌ Error en renderizado de fallback", {
        error: String(fallbackError),
      });
    }
  }

  public getRenderedStats() {
    return (
      this.diverseRenderer?.getStats() || {
        totalSprites: 0,
        layerCounts: {},
        memoryUsage: 0,
      }
    );
  }

  public updateCulling(cameraX: number, cameraY: number): void {
    this.diverseRenderer?.updateCulling(cameraX, cameraY);
  }

  public destroy(): void {
    this.diverseRenderer?.destroy();
    this.composer = null as any;
    this.biomeSystem = null as any;
  }
}
