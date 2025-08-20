/**
 * Animation Manager para "Una Carta Para Isa"
 * Sistema completo de animaciones usando spritesheets de Phaser
 */

import { logAutopoiesis } from "../utils/logger";

export interface SpriteSheetConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
}

export interface AnimationConfig {
  key: string;
  spriteSheetKey: string;
  frames: number[];
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
}

export class AnimationManager {
  private scene: Phaser.Scene;
  private loadedSpriteSheets = new Set<string>();
  private createdAnimations = new Set<string>();
  private createdSprites = new Set<Phaser.GameObjects.Sprite>();

  private static readonly SPRITE_SHEET_CONFIGS: SpriteSheetConfig[] = [
    {
      key: "isa_happy_anim",
      path: "assets/animated_entities/entidad_circulo_happy_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },
    {
      key: "isa_sad_anim",
      path: "assets/animated_entities/entidad_circulo_sad_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },
    {
      key: "isa_dying_anim",
      path: "assets/animated_entities/entidad_circulo_dying_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },
    {
      key: "stev_happy_anim",
      path: "assets/animated_entities/entidad_square_happy_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },
    {
      key: "stev_sad_anim",
      path: "assets/animated_entities/entidad_square_sad_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },
    {
      key: "stev_dying_anim",
      path: "assets/animated_entities/entidad_square_dying_anim.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12,
    },

    {
      key: "campfire_anim",
      path: "assets/animated_entities/campfire.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 8,
    },
    {
      key: "flowers_red_anim",
      path: "assets/animated_entities/flowers_red.png",
      frameWidth: 16,
      frameHeight: 16,
      totalFrames: 4,
    },
    {
      key: "flowers_white_anim",
      path: "assets/animated_entities/flowers_white.png",
      frameWidth: 16,
      frameHeight: 16,
      totalFrames: 4,
    },

    {
      key: "flag_idle_anim",
      path: "assets/animated_entities/checkpoint_flag_idle1.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 7,
    },
    {
      key: "flag_out_anim",
      path: "assets/animated_entities/checkpoint_flag_out1.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 7,
    },

    {
      key: "pointer_idle_anim",
      path: "assets/animated_entities/pointer_idle.png",
      frameWidth: 24,
      frameHeight: 24,
      totalFrames: 6,
    },

    {
      key: "chicken_anim",
      path: "assets/animated_entities/chicken.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 8,
    },
    {
      key: "pig_anim",
      path: "assets/animated_entities/pig.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 6,
    },
  ];

  // 🚀 ULTRA-OPTIMIZED: Solo animaciones ESENCIALES que EXISTEN para máximo FPS
  private static readonly ANIMATION_CONFIGS: AnimationConfig[] = [
    {
      key: "isa_happy",
      spriteSheetKey: "isa_happy_anim",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      frameRate: 8,
      repeat: -1,
    },
    {
      key: "isa_idle",
      spriteSheetKey: "isa_happy_anim", // Reutiliza el mismo spritesheet
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      frameRate: 6,
      repeat: -1,
    },
    {
      key: "stev_happy",
      spriteSheetKey: "stev_happy_anim",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      frameRate: 8,
      repeat: -1,
    },
    {
      key: "stev_idle",
      spriteSheetKey: "stev_happy_anim", // Reutiliza el mismo spritesheet
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      frameRate: 6,
      repeat: -1,
    },
    // ⚡ RESTO DE ANIMACIONES ELIMINADAS para máximo FPS
    // Esto elimina ~10 warnings de "Spritesheet not found" que consumen CPU
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Load all sprite sheets for animations
   */
  public loadAllSpriteSheets(): void {
    AnimationManager.SPRITE_SHEET_CONFIGS.forEach((config) => {
      try {
        this.scene.load.spritesheet(config.key, config.path, {
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
          endFrame: config.totalFrames - 1,
        });

        this.loadedSpriteSheets.add(config.key);
        logAutopoiesis.debug(`Spritesheet queued: ${config.key}`, {
          frames: config.totalFrames,
          frameSize: `${config.frameWidth}x${config.frameHeight}`,
        });
      } catch (error) {
        logAutopoiesis.error(`Failed to load spritesheet: ${config.key}`, {
          error: String(error),
          path: config.path,
        });
      }
    });

    logAutopoiesis.info("All spritesheets queued for loading", {
      total: AnimationManager.SPRITE_SHEET_CONFIGS.length,
    });
  }

  /**
   * Create all animations after spritesheets are loaded
   */
  public createAllAnimations(): void {
    if (!this.scene.anims) {
      logAutopoiesis.error("Animation manager not available in scene");
      return;
    }

    AnimationManager.ANIMATION_CONFIGS.forEach((config) => {
      try {
        if (!this.scene.textures.exists(config.spriteSheetKey)) {
          logAutopoiesis.warn(
            `Spritesheet not found: ${config.spriteSheetKey}`,
            {
              animationKey: config.key,
            },
          );
          return;
        }

        const animConfig: Phaser.Types.Animations.Animation = {
          key: config.key,
          frames: this.scene.anims.generateFrameNumbers(config.spriteSheetKey, {
            frames: config.frames,
          }),
          frameRate: config.frameRate,
          repeat: config.repeat,
        };

        if (config.yoyo !== undefined) {
          animConfig.yoyo = config.yoyo;
        }

        this.scene.anims.create(animConfig);
        this.createdAnimations.add(config.key);

        logAutopoiesis.debug(`Animation created: ${config.key}`, {
          spriteSheet: config.spriteSheetKey,
          frames: config.frames.length,
          frameRate: config.frameRate,
          repeat: config.repeat,
        });
      } catch (error) {
        logAutopoiesis.error(`Failed to create animation: ${config.key}`, {
          error: String(error),
          spriteSheet: config.spriteSheetKey,
        });
      }
    });

    logAutopoiesis.info("Animation creation completed", {
      created: this.createdAnimations.size,
      total: AnimationManager.ANIMATION_CONFIGS.length,
    });
  }

  /**
   * Play animation on a sprite
   */
  public playAnimation(
    sprite: Phaser.GameObjects.Sprite,
    animationKey: string,
    ignoreIfPlaying = true,
  ): boolean {
    if (!this.createdAnimations.has(animationKey)) {
      logAutopoiesis.warn(`Animation not found: ${animationKey}`);
      return false;
    }

    try {
      sprite.play(animationKey, ignoreIfPlaying);
      return true;
    } catch (error) {
      logAutopoiesis.error(`Failed to play animation: ${animationKey}`, {
        error: String(error),
      });
      return false;
    }
  }

  /**
   * Stop animation on a sprite
   */
  public stopAnimation(sprite: Phaser.GameObjects.Sprite): void {
    if (sprite.anims) {
      sprite.anims.stop();
    }
  }

  /**
   * Create animated sprite with automatic animation
   */
  public createAnimatedSprite(
    x: number,
    y: number,
    animationKey: string,
    autoPlay = true,
  ): Phaser.GameObjects.Sprite | null {
    const config = AnimationManager.ANIMATION_CONFIGS.find(
      (c) => c.key === animationKey,
    );
    if (!config) {
      logAutopoiesis.warn(`Animation config not found: ${animationKey}`);
      return null;
    }

    try {
      const sprite = this.scene.add.sprite(x, y, config.spriteSheetKey);

      // Track created sprite for proper cleanup
      this.createdSprites.add(sprite);

      // Add cleanup handler when sprite is destroyed
      sprite.once("destroy", () => {
        this.createdSprites.delete(sprite);
      });

      if (autoPlay) {
        this.playAnimation(sprite, animationKey);
      }

      return sprite;
    } catch (error) {
      logAutopoiesis.error(
        `Failed to create animated sprite: ${animationKey}`,
        {
          error: String(error),
        },
      );
      return null;
    }
  }

  /**
   * Get animation duration in milliseconds
   */
  public getAnimationDuration(animationKey: string): number {
    const config = AnimationManager.ANIMATION_CONFIGS.find(
      (c) => c.key === animationKey,
    );
    if (!config) return 0;

    return (config.frames.length / config.frameRate) * 1000;
  }

  /**
   * Check if animation exists
   */
  public hasAnimation(animationKey: string): boolean {
    return this.createdAnimations.has(animationKey);
  }

  /**
   * Get available animations by category
   */
  public getAnimationsByCategory(): {
    entities: string[];
    environment: string[];
    ui: string[];
    animals: string[];
  } {
    const entities = Array.from(this.createdAnimations).filter(
      (key) => key.includes("isa_") || key.includes("stev_"),
    );

    const environment = Array.from(this.createdAnimations).filter(
      (key) =>
        key.includes("campfire") ||
        key.includes("flowers") ||
        key.includes("flag"),
    );

    const ui = Array.from(this.createdAnimations).filter((key) =>
      key.includes("pointer"),
    );

    const animals = Array.from(this.createdAnimations).filter(
      (key) => key.includes("chicken") || key.includes("pig"),
    );

    return { entities, environment, ui, animals };
  }

  /**
   * Get loading and creation statistics
   */
  public getStats(): {
    loadedSpriteSheets: number;
    createdAnimations: number;
    totalConfigs: number;
    successRate: number;
  } {
    return {
      loadedSpriteSheets: this.loadedSpriteSheets.size,
      createdAnimations: this.createdAnimations.size,
      totalConfigs: AnimationManager.ANIMATION_CONFIGS.length,
      successRate:
        this.createdAnimations.size / AnimationManager.ANIMATION_CONFIGS.length,
    };
  }

  /**
   * Cleanup animations and all created sprites
   */
  public destroy(): void {
    // Destroy all sprites created by this manager
    this.createdSprites.forEach((sprite) => {
      if (sprite && sprite.scene) {
        // Stop animations before destroying
        if (sprite.anims && sprite.anims.isPlaying) {
          sprite.anims.stop();
        }
        // Animation cleanup is handled by Phaser's sprite.destroy()
        sprite.destroy();
      }
    });

    this.createdSprites.clear();
    this.loadedSpriteSheets.clear();
    this.createdAnimations.clear();

    logAutopoiesis.info("AnimationManager destroyed", {
      spritesDestroyed: this.createdSprites.size,
      animationsCleared: this.createdAnimations.size,
    });
  }
}
