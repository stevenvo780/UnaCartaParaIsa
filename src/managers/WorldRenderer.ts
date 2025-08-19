/**
 * World Renderer - Maneja todo el rendering visual del mundo
 * Ahora usa sistema profesional de tilemaps de Phaser
 */

import type { Zone, MapElement, GameState } from '../types';
import { GAME_BALANCE } from '../constants/gameBalance';
import { logAutopoiesis } from '../utils/logger';
import { AnimationManager } from './AnimationManager';
import { BiomeAssetRenderer } from '../world/BiomeAssetRenderer';
import type { GeneratedWorld } from '../world/types';

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects = new Map<string, Phaser.GameObjects.GameObject>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private animationManager?: AnimationManager;
  private decorationSprites: Phaser.GameObjects.Sprite[] = [];
  private lastCullingUpdate = 0;
  private readonly CULLING_UPDATE_INTERVAL = 100; // Update every 100ms

  // Sistema simplificado de assets creativos
  private biomeAssetRenderer?: BiomeAssetRenderer;
  private useCreativeAssets = true;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Crear renderizador de assets creativos
    this.biomeAssetRenderer = new BiomeAssetRenderer(scene);

    // Get animation manager from scene registry with type safety
    const animManager = scene.registry.get('animationManager');
    if (animManager && animManager instanceof AnimationManager) {
      this.animationManager = animManager;
      logAutopoiesis.info(
        'AnimationManager available in WorldRenderer, using animated decorations'
      );
    } else {
      this.animationManager = undefined;
      logAutopoiesis.warn(
        'AnimationManager not available in WorldRenderer, using static decorations'
      );
    }

    logAutopoiesis.info('WorldRenderer inicializado con sistema de assets creativos');
  }

  /**
   * Render the complete world - ahora con sistema de assets creativos
   */
  public async renderWorld(generatedWorld?: GeneratedWorld): Promise<void> {
    if (this.useCreativeAssets && generatedWorld && this.biomeAssetRenderer) {
      // Usar sistema de assets creativos
      await this.renderWorldWithCreativeAssets(generatedWorld);
    } else {
      // Fallback al sistema anterior
      this.renderWorldLegacy();
    }
  }

  /**
   * Renderiza el mundo usando assets creativos reales
   */
  private async renderWorldWithCreativeAssets(world: GeneratedWorld): Promise<void> {
    logAutopoiesis.info('🎨 Renderizando mundo con assets creativos reales');

    try {
      // Renderizar usando BiomeAssetRenderer
      await this.biomeAssetRenderer.renderWorldWithRealAssets(world);

      // Renderizar zonas encima de los assets
      this.renderZones();

      // Renderizar elementos interactivos
      this.renderMapElements();

      // Renderizar decoraciones animadas
      this.renderDecorations();

      logAutopoiesis.info('✅ Mundo renderizado exitosamente con assets creativos');
    } catch (error) {
      logAutopoiesis.error(
        '❌ Error renderizando con assets creativos, fallback a sistema anterior',
        error
      );
      this.renderWorldLegacy();
    }
  }

  /**
   * Renderiza el mundo usando el sistema anterior (fallback)
   */
  private renderWorldLegacy(): void {
    this.createWorldBackground();
    this.renderZones();
    this.renderMapElements();
    this.renderDecorations();

    logAutopoiesis.info('World rendering completed', {
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
      objects: this.renderedObjects.size,
    });
  }

  /**
   * Create world background using grass tiles
   */
  private createWorldBackground(): void {
    const tileSize = GAME_BALANCE.VISUALS.TILE_SIZE;
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;

    for (let x = 0; x < worldWidth; x += tileSize) {
      for (let y = 0; y < worldHeight; y += tileSize) {
        const grassTypes = ['grass-1', 'grass-2', 'grass-3', 'grass-base'];
        const randomGrass = grassTypes[Math.floor(Math.random() * grassTypes.length)];

        const grassTile = this.scene.add.image(x + tileSize / 2, y + tileSize / 2, randomGrass);
        grassTile.setDisplaySize(tileSize, tileSize);
        grassTile.setDepth(0);

        this.renderedObjects.set(`grass_${x}_${y}`, grassTile);
      }
    }

    logAutopoiesis.debug('World background created', {
      tileCount: Math.ceil(worldWidth / tileSize) * Math.ceil(worldHeight / tileSize),
    });
  }

  /**
   * Render all zones visually
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone, index) => {
      this.renderSingleZone(zone, index);
    });
  }

  /**
   * Render a single zone
   */
  private renderSingleZone(zone: Zone, _index: number): void {
    let colorValue: number = GAME_BALANCE.ZONES.SOCIAL_COLOR;
    if (zone.color.startsWith('rgba(')) {
      const rgbaMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(zone.color);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch.map(Number);
        colorValue = (r << 16) | (g << 8) | b;
      }
    }

    const zoneRect = this.scene.add.rectangle(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.bounds.width,
      zone.bounds.height,
      colorValue,
      GAME_BALANCE.ZONES.DEFAULT_ALPHA
    );
    zoneRect.setStrokeStyle(
      GAME_BALANCE.ZONES.STROKE_WIDTH,
      colorValue,
      GAME_BALANCE.ZONES.STROKE_ALPHA
    );
    zoneRect.setDepth(GAME_BALANCE.ZONES.DEPTH);

    const label = this.scene.add.text(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.name,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
      }
    );
    label.setOrigin(0.5);
    label.setDepth(3);
    label.setStroke('#000000', 3);

    this.renderedObjects.set(`zone_${zone.id}`, zoneRect);
    this.renderedObjects.set(`zone_label_${zone.id}`, label);
  }

  /**
   * Render map elements
   */
  private renderMapElements(): void {
    this.gameState.mapElements.forEach((element, index) => {
      this.renderSingleMapElement(element, index);
    });
  }

  /**
   * Render a single map element
   */
  private renderSingleMapElement(element: MapElement, _index: number): void {
    const colorValue =
      typeof element.color === 'string'
        ? parseInt(element.color.replace('#', ''), 16)
        : element.color;

    const elementRect = this.scene.add.rectangle(
      element.position.x + element.size.width / 2,
      element.position.y + element.size.height / 2,
      element.size.width,
      element.size.height,
      colorValue,
      0.8
    );
    elementRect.setStrokeStyle(1, 0xffffff, 0.6);
    elementRect.setDepth(2);

    this.renderedObjects.set(`element_${element.id}`, elementRect);
  }

  /**
   * Create decorative elements
   */
  private renderDecorations(): void {
    const animatedDecorations = [
      {
        x: 150,
        y: 120,
        animation: 'flowers_red_sway',
        fallbackSprite: 'flowers-red',
      },
      {
        x: 300,
        y: 180,
        animation: 'flowers_white_sway',
        fallbackSprite: 'flowers-white',
      },
      {
        x: 500,
        y: 250,
        animation: 'campfire_burning',
        fallbackSprite: 'campfire',
      },
      {
        x: 650,
        y: 150,
        animation: 'flowers_red_sway',
        fallbackSprite: 'flowers-red',
      },
      {
        x: 800,
        y: 300,
        animation: 'flowers_white_sway',
        fallbackSprite: 'flowers-white',
      },
      {
        x: 200,
        y: 400,
        animation: 'campfire_burning',
        fallbackSprite: 'campfire',
      },
      {
        x: 750,
        y: 450,
        animation: 'flag_wave',
        fallbackSprite: 'checkpoint-flag',
      },
      {
        x: 600,
        y: 500,
        animation: 'flag_wave',
        fallbackSprite: 'checkpoint-flag',
      },
    ];

    animatedDecorations.forEach((deco, index) => {
      let decoration: Phaser.GameObjects.Sprite;

      // Try to create animated decoration with validation
      if (this.animationManager?.hasAnimation(deco.animation)) {
        const animatedSprite = this.animationManager.createAnimatedSprite(
          deco.x,
          deco.y,
          deco.animation,
          true
        );

        if (animatedSprite) {
          decoration = animatedSprite;
          logAutopoiesis.debug(`Created animated decoration: ${deco.animation}`, {
            x: deco.x,
            y: deco.y,
          });
        } else {
          // Fallback to static sprite if animation creation failed
          decoration = this.createFallbackDecoration(deco);
        }
      } else {
        // No animation manager or animation not found, use static sprite
        decoration = this.createFallbackDecoration(deco);
      }

      // Set common properties
      decoration.setScale(GAME_BALANCE.DECORATIONS.CAMPFIRE_SCALE);
      decoration.setDepth(GAME_BALANCE.DECORATIONS.DECORATION_DEPTH);

      // Add random slight variations
      decoration.setRotation((Math.random() - 0.5) * 0.2);
      const scaleVariation = 0.8 + Math.random() * 0.4;
      decoration.setScale(GAME_BALANCE.DECORATIONS.CAMPFIRE_SCALE * scaleVariation);

      // Store decoration in both maps for tracking
      this.renderedObjects.set(`decoration_${index}`, decoration);
      this.decorationSprites.push(decoration);
    });

    logAutopoiesis.info('Animated decorations rendered', {
      count: animatedDecorations.length,
      animated: !!this.animationManager,
    });
  }

  /**
   * Create fallback decoration with validation
   */
  private createFallbackDecoration(deco: {
    x: number;
    y: number;
    fallbackSprite: string;
    animation: string;
  }): Phaser.GameObjects.Sprite {
    // Check if fallback sprite exists
    if (this.scene.textures.exists(deco.fallbackSprite)) {
      const decoration = this.scene.add.sprite(deco.x, deco.y, deco.fallbackSprite);
      logAutopoiesis.debug(`Created fallback decoration: ${deco.fallbackSprite}`, {
        x: deco.x,
        y: deco.y,
        originalAnimation: deco.animation,
      });
      return decoration;
    } else {
      // Ultimate fallback - create a simple colored rectangle
      logAutopoiesis.warn(`Fallback sprite ${deco.fallbackSprite} not found, creating placeholder`);
      const placeholder = this.scene.add.sprite(deco.x, deco.y, '__DEFAULT');

      // Create a default texture if it doesn't exist
      if (!this.scene.textures.exists('__DEFAULT')) {
        this.scene.add
          .graphics()
          .fillStyle(0x8bc34a)
          .fillRect(0, 0, 16, 16)
          .generateTexture('__DEFAULT', 16, 16);
      }

      placeholder.setTexture('__DEFAULT');
      return placeholder;
    }
  }

  /**
   * Create activity zones with improved visuals
   */
  public createActivityZones(): void {
    const activityZones = [
      {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: GAME_BALANCE.ZONES.FOOD_COLOR,
        name: 'Rest Zone',
      },
      {
        x: 400,
        y: 200,
        width: 180,
        height: 120,
        color: GAME_BALANCE.ZONES.REST_COLOR,
        name: 'Food Zone',
      },
      {
        x: 700,
        y: 300,
        width: 200,
        height: 160,
        color: GAME_BALANCE.ZONES.SOCIAL_COLOR,
        name: 'Social Zone',
      },
    ];

    activityZones.forEach((zone, index) => {
      const zoneRect = this.scene.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.color,
        GAME_BALANCE.ZONES.DEFAULT_ALPHA
      );
      zoneRect.setStrokeStyle(3, zone.color, 0.6);
      zoneRect.setDepth(2);

      const label = this.scene.add.text(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.name,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke('#000000', 2);

      this.renderedObjects.set(`activity_zone_${index}`, zoneRect);
      this.renderedObjects.set(`activity_label_${index}`, label);
    });
  }

  /**
   * Update visual elements that change over time including culling optimization
   */
  public updateVisuals(): void {
    const now = Date.now();

    // Perform culling optimization at regular intervals
    if (now - this.lastCullingUpdate > this.CULLING_UPDATE_INTERVAL) {
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
      cameraView.height + margin * 2
    );

    let visibleCount = 0;
    let pausedCount = 0;

    this.decorationSprites.forEach(decoration => {
      if (!decoration?.scene) {
        return; // Skip destroyed sprites
      }

      const inView = extendedView.contains(decoration.x, decoration.y);

      if (inView) {
        // Sprite is visible
        visibleCount++;

        if (!decoration.visible) {
          decoration.setVisible(true);
        }

        // Resume animation if it was paused
        if (decoration.anims && decoration.anims.isPaused) {
          decoration.anims.resume();
        }
      } else {
        // Sprite is off-screen
        if (decoration.visible) {
          decoration.setVisible(false);
        }

        // Pause animation to save performance
        if (decoration.anims && decoration.anims.isPlaying) {
          decoration.anims.pause();
          pausedCount++;
        }
      }
    });

    // Log culling stats occasionally
    if (Math.random() < 0.1) {
      // 10% chance to log
      logAutopoiesis.debug('Decoration culling performed', {
        totalDecorations: this.decorationSprites.length,
        visible: visibleCount,
        paused: pausedCount,
        cullingEfficiency: `${(
          ((this.decorationSprites.length - visibleCount) / this.decorationSprites.length) *
          100
        ).toFixed(1)}%`,
      });
    }
  }

  /**
   * Hide/show specific elements
   */
  public setElementVisibility(elementId: string, visible: boolean): void {
    const element = this.renderedObjects.get(elementId);
    if (element && 'setVisible' in element) {
      (element as any).setVisible(visible);
    }
  }

  /**
   * Change element tint
   */
  public setElementTint(elementId: string, tint: number): void {
    const element = this.renderedObjects.get(elementId);
    if (element && 'setTint' in element) {
      (element as any).setTint(tint);
    }
  }

  /**
   * Cleanup all rendered objects including animated sprites
   */
  public destroy(): void {
    this.renderedObjects.forEach(obj => {
      if (obj && obj.destroy) {
        // For animated sprites, stop animations first
        if ('anims' in obj && obj.anims && typeof obj.anims === 'object') {
          const animState = obj.anims as any;
          if (animState.isPlaying && typeof animState.stop === 'function') {
            animState.stop();
          }
        }
        obj.destroy();
      }
    });

    this.zoneGraphics.forEach(graphic => {
      if (graphic && graphic.destroy) {
        graphic.destroy();
      }
    });

    this.renderedObjects.clear();
    this.zoneGraphics.length = 0;

    // Clear decoration tracking
    this.decorationSprites.length = 0;

    // Clear reference to animation manager
    this.animationManager = undefined;

    logAutopoiesis.info('WorldRenderer destroyed', {
      decorationsCleared: this.decorationSprites.length,
    });
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
