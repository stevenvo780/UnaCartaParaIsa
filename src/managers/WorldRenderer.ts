/**
 * World Renderer - Maneja todo el rendering visual del mundo
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import type { AnimationManager } from "./AnimationManager";

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects = new Map<string, Phaser.GameObjects.GameObject>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private animationManager?: AnimationManager;
  private decorationSprites: Phaser.GameObjects.Sprite[] = [];
  private lastCullingUpdate = 0;
  private readonly cullingUpdateInterval = 100;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Get animation manager from scene registry with type safety
    const animManager = scene.registry.get("animationManager");
    if (animManager) {
      this.animationManager = animManager;
      logAutopoiesis.info("AnimationManager available in WorldRenderer");
    } else {
      this.animationManager = undefined;
      logAutopoiesis.warn("AnimationManager not available in WorldRenderer");
    }

    logAutopoiesis.info("WorldRenderer initialized");
  }

  /**
   * Render the complete world
   */
  public renderWorld(): void {
    this.createWorldBackground();
    this.renderZones();

    logAutopoiesis.info("World rendering completed", {
      zones: this.gameState.zones.length,
      objects: this.renderedObjects.size,
    });
  }

  /**
   * Create world background using optimized system
   */
  private createWorldBackground(): void {
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;

    // Crear un background simple y eficiente
    const background = this.scene.add.rectangle(
      worldWidth / 2,
      worldHeight / 2,
      worldWidth,
      worldHeight,
      0x90ee90, // Verde césped
    );
    background.setDepth(0);

    // Añadir textura sutil con graphics para simular césped
    const grassPattern = this.scene.add.graphics();
    grassPattern.fillStyle(0x7ccd7c, 0.3);

    // Crear patrón de césped ligero
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * worldWidth;
      const y = Math.random() * worldHeight;
      grassPattern.fillCircle(x, y, 8);
    }

    grassPattern.setDepth(0.1);

    this.renderedObjects.set("world_background", background);
    this.renderedObjects.set("grass_pattern", grassPattern);

    logAutopoiesis.info("World background created", {
      worldSize: `${worldWidth}x${worldHeight}`,
      elementsCreated: 2,
    });
  }

  /**
   * Precarga assets de césped reales - Los assets ya están definidos en AssetManager
   */
  private preloadGrassAssets(grassAssets: string[]): void {
    // Los assets ya deberían estar cargados por AssetManager
    // Solo verificamos que existan
    const missingAssets = grassAssets.filter(
      (assetKey) => !this.scene.textures.exists(assetKey),
    );

    if (missingAssets.length > 0) {
      logAutopoiesis.warn("Assets de césped faltantes:", missingAssets);

      // Cargar manualmente los que falten
      missingAssets.forEach((assetKey) => {
        let assetPath = "";

        if (assetKey === "grass_1") {
          assetPath = "assets/terrain/base/cesped1.png";
        } else if (assetKey === "grass_2") {
          assetPath = "assets/terrain/base/cesped2.png";
        } else if (assetKey === "grass_3") {
          assetPath = "assets/terrain/base/cesped3.png";
        } else if (assetKey === "grass_middle") {
          assetPath = "assets/terrain/base/Grass_Middle.png";
        }

        if (assetPath) {
          try {
            this.scene.load.image(assetKey, assetPath);
          } catch (error) {
            logAutopoiesis.warn(`No se pudo cargar ${assetKey}:`, error);
          }
        }
      });

      // Iniciar carga si hay assets pendientes
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    }
  }

  /**
   * Crea texture de fallback para césped
   */
  private createFallbackGrassTexture(key: string): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x90ee90); // Verde césped
    graphics.fillRect(0, 0, 32, 32);

    // Añadir textura simple
    graphics.fillStyle(0x7ccd7c);
    for (let i = 0; i < 8; i++) {
      graphics.fillCircle(Math.random() * 32, Math.random() * 32, 2);
    }

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  /**
   * Render all zones visually - ULTRA SIMPLIFICADO para 60 FPS
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone, _index) => {
      const colorValue: number = 0x4caf50; // Default green

      const zoneRect = this.scene.add.rectangle(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.bounds.width,
        zone.bounds.height,
        colorValue,
        0.3,
      );
      zoneRect.setStrokeStyle(2, colorValue, 0.8);
      zoneRect.setDepth(1);

      const label = this.scene.add.text(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.name,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: "Arial",
          fontStyle: "bold",
          align: "center",
        },
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke("#000000", 3);

      this.renderedObjects.set(`zone_${zone.id}`, zoneRect);
      this.renderedObjects.set(`zone_label_${zone.id}`, label);
    });
  }

  /**
   * Update visual elements that change over time including culling optimization
   */
  public updateVisuals(): void {
    const now = Date.now();

    // Perform culling optimization at regular intervals
    if (now - this.lastCullingUpdate > this.cullingUpdateInterval) {
      this.performDecorationCulling();
      this.lastCullingUpdate = now;
    }
  }

  /**
   * Optimize decorations by culling off-screen sprites and pausing animations
   */
  private performDecorationCulling(): void {
    if (!this.scene.cameras?.main) {
      return;
    }

    const camera = this.scene.cameras.main;
    const cameraView = camera.worldView;

    // Add margin to prevent popping when sprites are just outside view
    const margin = 100;
    const extendedView = new Phaser.Geom.Rectangle(
      cameraView.x - margin,
      cameraView.y - margin,
      cameraView.width + margin * 2,
      cameraView.height + margin * 2,
    );

    let visibleCount = 0;
    let pausedCount = 0;

    this.decorationSprites.forEach((decoration) => {
      if (!decoration?.scene) {
        return;
      }

      const inView = extendedView.contains(decoration.x, decoration.y);

      if (inView) {
        visibleCount++;
        if (!decoration.visible) {
          decoration.setVisible(true);
        }
        if (decoration.anims?.isPaused) {
          decoration.anims.resume();
        }
      } else {
        if (decoration.visible) {
          decoration.setVisible(false);
        }
        if (decoration.anims?.isPlaying) {
          decoration.anims.pause();
          pausedCount++;
        }
      }
    });

    // Log culling stats occasionally
    if (Math.random() < 0.1) {
      logAutopoiesis.debug("Decoration culling performed", {
        totalDecorations: this.decorationSprites.length,
        visible: visibleCount,
        paused: pausedCount,
      });
    }
  }

  /**
   * Hide/show specific elements
   */
  public setElementVisibility(elementId: string, visible: boolean): void {
    const element = this.renderedObjects.get(elementId);
    if (element && "setVisible" in element) {
      (
        element as Phaser.GameObjects.GameObject & {
          setVisible: (visible: boolean) => void;
        }
      ).setVisible(visible);
    }
  }

  /**
   * Change element tint
   */
  public setElementTint(elementId: string, tint: number): void {
    const element = this.renderedObjects.get(elementId);
    if (element && "setTint" in element) {
      (
        element as Phaser.GameObjects.GameObject & {
          setTint: (tint: number) => void;
        }
      ).setTint(tint);
    }
  }

  /**
   * Cleanup all rendered objects including animated sprites
   */
  public destroy(): void {
    this.renderedObjects.forEach((obj) => {
      if (obj?.destroy) {
        if ("anims" in obj && obj.anims && typeof obj.anims === "object") {
          const animState = obj.anims as {
            isPlaying: boolean;
            stop: () => void;
          };
          if (animState.isPlaying && typeof animState.stop === "function") {
            animState.stop();
          }
        }
        obj.destroy();
      }
    });

    this.zoneGraphics.forEach((graphic) => {
      if (graphic?.destroy) {
        graphic.destroy();
      }
    });

    this.renderedObjects.clear();
    this.zoneGraphics.length = 0;
    this.decorationSprites.length = 0;
    this.animationManager = undefined;

    logAutopoiesis.info("WorldRenderer destroyed");
  }

  /**
   * Get rendering statistics
   */
  public getStats(): {
    renderedObjects: number;
    zones: number;
    elements: number;
  } {
    return {
      renderedObjects: this.renderedObjects.size,
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
    };
  }
}
