/**
 * Animation Manager para "Una Carta Para Isa"
 * Sistema completo de animaciones para spritesheets de Phaser
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
      key: "whomen1",
      path: "assets/entities/animated/characters/whomen1.png",
      frameWidth: 24,
      frameHeight: 24,
      totalFrames: 24, // 8 frames × 3 filas (192×72 = grid 8×3)
    },
    {
      key: "man1",
      path: "assets/entities/animated/characters/man1.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 12, // 4 frames × 3 filas (128×96 = grid 4×3)
    },

    // Personajes principales
    {
      key: "isa_happy",
      path: "assets/entities/new_woman_idle.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },
    {
      key: "isa_sad",
      path: "assets/entities/new_woman_idle.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },
    {
      key: "stev_happy",
      path: "assets/entities/new_man_idle.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },
    {
      key: "stev_sad",
      path: "assets/entities/new_man_idle.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },

    // Sprites de caminata
    {
      key: "isa_walking",
      path: "assets/entities/new_woman_walk.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },
    {
      key: "stev_walking",
      path: "assets/entities/new_man_walk.png",
      frameWidth: 18,
      frameHeight: 18,
      totalFrames: 1,
    },

    // Animaciones de ambiente
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
      totalFrames: 1,
    },
    {
      key: "flag_idle_anim",
      path: "assets/animated_entities/checkpoint_flag_idle1.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 1,
    },
    {
      key: "flag_out_anim",
      path: "assets/animated_entities/checkpoint_flag_out1.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 1,
    },
    {
      key: "pointer_idle_anim",
      path: "assets/animated_entities/pointer_idle.png",
      frameWidth: 24,
      frameHeight: 24,
      totalFrames: 1,
    },
    {
      key: "chicken_anim",
      path: "assets/animated_entities/chicken.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 1,
    },
    {
      key: "pig_anim",
      path: "assets/animated_entities/pig.png",
      frameWidth: 32,
      frameHeight: 32,
      totalFrames: 1,
    },
  ];

  private static readonly ANIMATION_CONFIGS: AnimationConfig[] = [
    // Animaciones multi-frame - WHOMEN1 (8 frames × 3 filas)
    {
      key: "whomen1:row0",
      spriteSheetKey: "whomen1",
      frames: [0, 1, 2, 3, 4, 5, 6, 7], // Fila 0: frames 0-7
      frameRate: 10,
      repeat: -1,
    },
    {
      key: "whomen1:row1",
      spriteSheetKey: "whomen1",
      frames: [8, 9, 10, 11, 12, 13, 14, 15], // Fila 1: frames 8-15
      frameRate: 10,
      repeat: -1,
    },
    {
      key: "whomen1:row2",
      spriteSheetKey: "whomen1",
      frames: [16, 17, 18, 19, 20, 21, 22, 23], // Fila 2: frames 16-23
      frameRate: 10,
      repeat: -1,
    },

    // Animaciones multi-frame - MAN1 (4 frames × 3 filas)
    {
      key: "man1:row0",
      spriteSheetKey: "man1",
      frames: [0, 1, 2, 3], // Fila 0: frames 0-3
      frameRate: 10,
      repeat: -1,
    },
    {
      key: "man1:row1",
      spriteSheetKey: "man1",
      frames: [4, 5, 6, 7], // Fila 1: frames 4-7
      frameRate: 10,
      repeat: -1,
    },
    {
      key: "man1:row2",
      spriteSheetKey: "man1",
      frames: [8, 9, 10, 11], // Fila 2: frames 8-11
      frameRate: 10,
      repeat: -1,
    },

    // Aliases para compatibilidad con el sistema actual
    {
      key: "isa_walking_new",
      spriteSheetKey: "whomen1",
      frames: [16, 17, 18, 19, 20, 21, 22, 23], // row2 para caminar
      frameRate: 8,
      repeat: -1,
    },
    {
      key: "stev_walking_new",
      spriteSheetKey: "man1",
      frames: [8, 9, 10, 11], // row2 para caminar
      frameRate: 8,
      repeat: -1,
    },
    {
      key: "isa_happy_new",
      spriteSheetKey: "whomen1",
      frames: [0, 1, 2, 3, 4, 5, 6, 7], // row0 para idle
      frameRate: 6,
      repeat: -1,
    },
    {
      key: "stev_happy_new",
      spriteSheetKey: "man1",
      frames: [0, 1, 2, 3], // row0 para idle
      frameRate: 6,
      repeat: -1,
    },

    // Personajes - ISA (sprites estáticos)
    {
      key: "isa_happy_idle",
      spriteSheetKey: "isa_happy",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "isa_happy_walk",
      spriteSheetKey: "isa_walking",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "isa_sad_idle",
      spriteSheetKey: "isa_sad",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "isa_sad_walk",
      spriteSheetKey: "isa_walking",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },

    // Personajes - STEV (sprites estáticos)
    {
      key: "stev_happy_idle",
      spriteSheetKey: "stev_happy",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "stev_happy_walk",
      spriteSheetKey: "stev_walking",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "stev_sad_idle",
      spriteSheetKey: "stev_sad",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "stev_sad_walk",
      spriteSheetKey: "stev_walking",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },

    // Animaciones de ambiente
    {
      key: "campfire_anim",
      spriteSheetKey: "campfire_anim",
      frames: Array.from({ length: 8 }, (_, i) => i),
      frameRate: 8,
      repeat: -1,
    },
    {
      key: "flowers_red_anim",
      spriteSheetKey: "flowers_red_anim",
      frames: Array.from({ length: 4 }, (_, i) => i),
      frameRate: 6,
      repeat: -1,
    },
    {
      key: "flowers_white_anim",
      spriteSheetKey: "flowers_white_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "flag_idle_anim",
      spriteSheetKey: "flag_idle_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "flag_out_anim",
      spriteSheetKey: "flag_out_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "pointer_idle_anim",
      spriteSheetKey: "pointer_idle_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "chicken_anim",
      spriteSheetKey: "chicken_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
    {
      key: "pig_anim",
      spriteSheetKey: "pig_anim",
      frames: [0],
      frameRate: 1,
      repeat: 0,
    },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Cargar todos los spritesheets de animación
   */
  public loadAllSpriteSheets(): void {
    for (const config of AnimationManager.SPRITE_SHEET_CONFIGS) {
      this.loadSpriteSheet(config);
    }
  }

  /**
   * Cargar un spritesheet específico
   */
  public loadSpriteSheet(config: SpriteSheetConfig): void {
    if (this.loadedSpriteSheets.has(config.key)) {
      return;
    }

    this.scene.load.spritesheet(config.key, config.path, {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
    });

    this.loadedSpriteSheets.add(config.key);
    logAutopoiesis.debug("Spritesheet cargado", { key: config.key });
  }

  /**
   * Crear todas las animaciones
   */
  public createAllAnimations(): void {
    for (const config of AnimationManager.ANIMATION_CONFIGS) {
      this.createAnimation(config);
    }
  }

  /**
   * Crear una animación específica
   */
  public createAnimation(config: AnimationConfig): void {
    if (this.createdAnimations.has(config.key)) {
      return;
    }

    // Evitar warnings: solo crear la animación si el spritesheet existe
    const textureManager = this.scene.textures;
    if (!textureManager.exists(config.spriteSheetKey)) {
      logAutopoiesis.warn("SpriteSheet no cargado, omitiendo animación", {
        key: config.key,
        spriteSheetKey: config.spriteSheetKey,
      });
      return;
    }

    if (!this.scene.anims.exists(config.key)) {
      this.scene.anims.create({
        key: config.key,
        frames: this.scene.anims.generateFrameNumbers(config.spriteSheetKey, {
          frames: config.frames,
        }),
        frameRate: config.frameRate,
        repeat: config.repeat,
        yoyo: config.yoyo || false,
      });

      this.createdAnimations.add(config.key);
      logAutopoiesis.debug("Animación creada", { key: config.key });
    }
  }

  /**
   * Crear sprite animado
   */
  public createAnimatedSprite(
    x: number,
    y: number,
    animationKey: string,
  ): Phaser.GameObjects.Sprite | null {
    const config = AnimationManager.ANIMATION_CONFIGS.find(
      (c) => c.key === animationKey,
    );
    if (!config) {
      logAutopoiesis.warn("Configuración de animación no encontrada", {
        animationKey,
      });
      return null;
    }

    const sprite = this.scene.add.sprite(x, y, config.spriteSheetKey);
    sprite.play(animationKey);
    this.createdSprites.add(sprite);

    return sprite;
  }

  /**
   * Verificar si una animación existe
   */
  public hasAnimation(key: string): boolean {
    return this.createdAnimations.has(key);
  }

  /**
   * Obtener configuraciones disponibles
   */
  public getAvailableAnimations(): string[] {
    return AnimationManager.ANIMATION_CONFIGS.map((config) => config.key);
  }

  /**
   * Play animation on a sprite - Legacy method for AnimatedGameEntity compatibility
   */
  public playAnimation(
    sprite: Phaser.GameObjects.Sprite,
    animationKey: string,
  ): void {
    if (sprite && sprite.active && this.hasAnimation(animationKey)) {
      sprite.play(animationKey);
      logAutopoiesis.debug("Animation started", { animationKey });
    } else {
      logAutopoiesis.warn("Failed to play animation", {
        animationKey,
        spriteActive: sprite?.active,
      });
    }
  }

  /**
   * Stop animation on a sprite - Legacy method for AnimatedGameEntity compatibility
   */
  public stopAnimation(sprite: Phaser.GameObjects.Sprite): void {
    if (sprite && sprite.active) {
      sprite.stop();
      logAutopoiesis.debug("Animation stopped");
    }
  }

  /**
   * Get animation duration - Legacy method for AnimatedGameEntity compatibility
   */
  public getAnimationDuration(animationKey: string): number {
    const animation = this.scene.anims.get(animationKey);
    if (animation) {
      return animation.duration;
    }
    logAutopoiesis.warn("Animation duration not found", { animationKey });
    return 1000; // Default 1 second
  }

  /**
   * Limpiar recursos
   */
  public cleanup(): void {
    this.createdSprites.forEach((sprite) => {
      if (sprite && sprite.active) {
        sprite.destroy();
      }
    });
    this.createdSprites.clear();
    logAutopoiesis.info("AnimationManager resources cleaned up");
  }

  /**
   * Obtener estadísticas del manager
   */
  public getStats() {
    return {
      loadedSpriteSheets: this.loadedSpriteSheets.size,
      createdAnimations: this.createdAnimations.size,
      activeSprites: this.createdSprites.size,
      availableConfigs: AnimationManager.SPRITE_SHEET_CONFIGS.length,
    };
  }
}
