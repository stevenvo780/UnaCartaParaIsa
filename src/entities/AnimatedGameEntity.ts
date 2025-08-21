/**
 * Animated Game Entity for "Una Carta Para Isa"
 * Extends GameEntity with comprehensive animation support using Phaser's animation system
 */

import type { IEntityServices } from "../interfaces/EntityServices";
import { AnimationManager } from "../managers/AnimationManager";
import type { ActivityType, EntityStats, MoodType } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { GameEntity } from "./GameEntity";

export class AnimatedGameEntity extends GameEntity {
  private animationManager?: AnimationManager;
  private currentAnimationKey = "";
  private animationQueue: string[] = [];
  private lastStateHash = "";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    entityId: "isa" | "stev",
    services?: IEntityServices,
  ) {
    // Get animation manager from scene registry with proper type checking
    const animManager = scene.registry.get("animationManager");
    if (!animManager || !(animManager instanceof AnimationManager)) {
      logAutopoiesis.error(
        `AnimationManager not found or invalid type for entity ${entityId}`,
      );
    }

    // Initialize with new animated spritesheets
    const initialSpriteKey = entityId === "isa" ? "whomen1" : "man1";

    // Call parent constructor with a fallback texture
    super(scene, x, y, entityId, services);

    // Try to use the new animated spritesheets first
    if (scene.textures.exists(initialSpriteKey)) {
      this.setTexture(initialSpriteKey);
      logAutopoiesis.info(
        `Using new animated sprite for ${entityId}: ${initialSpriteKey}`,
      );
    } else {
      // Fallback to old static sprites
      const fallbackKey = entityId === "isa" ? "isa_happy" : "stev_happy";
      if (scene.textures.exists(fallbackKey)) {
        this.setTexture(fallbackKey);
        logAutopoiesis.warn(
          `New spritesheet ${initialSpriteKey} not found, using fallback: ${fallbackKey}`,
        );
      } else {
        // Final fallback to basic textures
        const basicFallback = entityId === "isa" ? "woman" : "man";
        if (scene.textures.exists(basicFallback)) {
          this.setTexture(basicFallback);
        }
        logAutopoiesis.warn(
          `All spritesheets failed, using basic fallback: ${basicFallback}`,
        );
      }
    }

    // Type-safe assignment of animation manager
    this.animationManager =
      animManager instanceof AnimationManager ? animManager : undefined;

    if (this.animationManager) {
      // Start with appropriate initial animation using new multi-frame sprites
      const initialAnimation =
        entityId === "isa" ? "isa_happy" : "stev_happy";

      // Validate animation exists before playing
      if (this.animationManager.hasAnimation(initialAnimation)) {
        this.currentAnimationKey = initialAnimation;
        this.animationManager.playAnimation(this, initialAnimation);

        logAutopoiesis.info(
          `AnimatedGameEntity ${entityId} created with new multi-frame animation`,
          {
            initialAnimation,
            spriteKey: initialSpriteKey,
          },
        );
      } else {
        // Fallback to basic row animation
        const fallbackAnimation =
          entityId === "isa" ? "whomen1:row0" : "man1:row0";
        if (this.animationManager.hasAnimation(fallbackAnimation)) {
          this.currentAnimationKey = fallbackAnimation;
          this.animationManager.playAnimation(this, fallbackAnimation);
          logAutopoiesis.info(
            `Using fallback row animation for ${entityId}: ${fallbackAnimation}`,
          );
        } else {
          logAutopoiesis.warn(
            `All animations failed for ${entityId}, using static sprite`,
          );
          // Final fallback: make entity visible with static texture
          this.setTexture(initialSpriteKey);
          this.setVisible(true);
        }
      }
    } else {
      logAutopoiesis.warn(
        `AnimationManager not available for ${entityId}, falling back to static sprites`,
      );
    }
  }

  /**
   * Override parent's updateEntity to include animation updates
   */
  public override updateEntity(deltaTime: number): void {
    // Call parent update logic first
    super.updateEntity(deltaTime);

    // Update animations based on current state
    this.updateAnimations();
  }

  /**
   * Update animations based on entity state, mood, and activity
   */
  private updateAnimations(): void {
    if (!this.animationManager) return;

    // Create state hash to detect changes
    const entityData = this.getEntityData();
    const currentStateHash = this.createStateHash(
      entityData.stats,
      entityData.mood,
      entityData.activity,
    );

    // Only update animation if state changed
    if (currentStateHash !== this.lastStateHash) {
      const newAnimationKey = this.determineAnimationFromState();

      if (newAnimationKey && newAnimationKey !== this.currentAnimationKey) {
        this.playAnimation(newAnimationKey);
      }

      this.lastStateHash = currentStateHash;
    }
  }

  /**
   * Determine which animation to play based on entity state
   */
  private determineAnimationFromState(): string | null {
    const entityData = this.getEntityData();
    const { stats } = entityData;
    const entityId = entityData.id;

    // Calculate average well-being
    const avgStat =
      (stats.happiness +
        stats.energy +
        (100 - stats.hunger) +
        (100 - stats.boredom)) /
      4;

    // Check if entity is moving (has velocity)
    const isMoving = this.isEntityMoving();

    // DEBUG: Log animation determination
    console.log(`[${entityId}] Animation debug:`, {
      avgStat,
      isMoving,
      velocity:
        this.body && "velocity" in this.body
          ? this.body.velocity
          : "no velocity",
      currentAnimation: this.currentAnimationKey,
    });

    // Actualizar la textura según el movimiento ANTES de devolver la animación
    this.updateTextureForMovement(entityId, isMoving, avgStat);

    // Priority 1: Death/Critical state
    if (entityData.isDead || stats.health <= 10 || avgStat < 20) {
      const anim = `${entityId}_dying`;
      console.log(`[${entityId}] Using dying animation:`, anim);
      return anim;
    }

    // Priority 2: Low well-being (sad)
    if (avgStat < 40 || stats.happiness < 30) {
      const anim = `${entityId}_sad`;
      console.log(`[${entityId}] Using sad animation:`, anim);
      return anim;
    }

    // Priority 3: Normal/Happy state (default)
    const anim = `${entityId}_happy`;
    console.log(`[${entityId}] Using happy animation:`, anim);
    return anim;
  }

  /**
   * Actualiza la textura del sprite según el movimiento
   */
  private updateTextureForMovement(
    entityId: string,
    isMoving: boolean,
    avgStat: number,
  ): void {
    let animationKey: string;

    // Usar las nuevas animaciones multi-frame
    if (avgStat < 40) {
      // Sad state - usar row1 (fila media) para estado triste
      animationKey = entityId === "isa" ? "whomen1:row1" : "man1:row1";
    } else {
      // Happy state - choose between idle and walking
      if (isMoving) {
        // Usar animaciones de caminar específicas
        animationKey =
          entityId === "isa" ? "isa_happy" : "stev_happy";
      } else {
        // Usar animaciones de idle
        animationKey = entityId === "isa" ? "isa_happy" : "stev_happy";
      }
    }

    // Cambiar animación si es diferente
    if (this.currentAnimationKey !== animationKey) {
      console.log(
        `[${entityId}] Changing animation from ${this.currentAnimationKey} to ${animationKey}`,
      );
      if (this.animationManager?.hasAnimation(animationKey)) {
        this.playAnimation(animationKey);
      } else {
        console.warn(`[${entityId}] Animation ${animationKey} not found!`);
      }
    }
  }

  /**
   * Check if entity is currently moving (has significant velocity)
   */
  private isEntityMoving(): boolean {
    if (!this.body || !("velocity" in this.body)) {
      console.log("No body or velocity available");
      return false;
    }

    const velocity = this.body.velocity as { x: number; y: number };
    const speedThreshold = 1; // Minimum speed to consider "moving" (lowered for easier detection)
    const currentSpeed = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y,
    );

    console.log("Movement check:", {
      velocity,
      currentSpeed,
      threshold: speedThreshold,
      isMoving: currentSpeed > speedThreshold,
    });

    return currentSpeed > speedThreshold;
  }

  /**
   * Create a hash string representing current entity state for change detection
   */
  private createStateHash(
    stats: EntityStats,
    mood: MoodType,
    activity: ActivityType,
  ): string {
    const avgStat = Math.floor(
      (stats.happiness +
        stats.energy +
        (100 - stats.hunger) +
        (100 - stats.boredom)) /
        4 /
        10,
    ); // Reduce precision to avoid too frequent changes

    const healthTier = Math.floor(stats.health / 20);
    const movingState = this.isEntityMoving() ? "moving" : "idle";

    return `${avgStat}-${healthTier}-${mood}-${activity}-${movingState}`;
  }

  /**
   * Detecta si un sprite es estático (no tiene animaciones)
   */
  private isStaticSprite(textureKey: string): boolean {
    const staticSprites = [
      "isa_happy",
      "isa_sad",
      "isa_dying",
      "stev_happy",
      "stev_sad",
      "stev_dying",
    ];
    return staticSprites.includes(textureKey);
  }

  /**
   * Play specific animation with comprehensive validation and fallback handling
   */
  public playAnimation(animationKey: string, force = false): boolean {
    // Para personajes principales (isa/stev), cambiar textura en lugar de animación
    const isMainCharacter =
      animationKey.startsWith("isa_") || animationKey.startsWith("stev_");

    if (isMainCharacter) {
      // Cambiar la textura directamente para personajes principales
      if (this.scene.textures.exists(animationKey)) {
        this.setTexture(animationKey);
        this.currentAnimationKey = animationKey;

        logAutopoiesis.debug(
          `Texture changed for main character: ${animationKey}`,
          {
            entityId: this.getEntityData().id,
          },
        );
        return true;
      } else {
        logAutopoiesis.warn(
          `Texture not found for main character: ${animationKey}`,
        );
        return false;
      }
    }

    // Para sprites estáticos (otros entidades), no reproducir animaciones
    const textureKey = this.texture?.key || "";
    if (this.isStaticSprite(textureKey)) {
      return true; // Retornar éxito silenciosamente para sprites estáticos
    }

    // Skip animation para sprites sin animation manager
    if (!this.animationManager) {
      return true; // Éxito silencioso
    }

    // Validación de clave
    if (!animationKey || typeof animationKey !== "string") {
      logAutopoiesis.error(`Invalid animation key: ${animationKey}`);
      return false;
    }

    // Chequear existencia de animación
    if (!this.animationManager.hasAnimation(animationKey)) {
      if (this.isStaticSprite(textureKey)) {
        return true;
      }
      logAutopoiesis.warn(
        `Animation not found: ${animationKey}, attempting fallback`,
      );

      // Fallback por entidad
      const entityId = this.getEntityData().id;
      const fallbackAnimation = `${entityId}_happy_idle`;

      if (this.animationManager.hasAnimation(fallbackAnimation)) {
        logAutopoiesis.info(`Using fallback animation: ${fallbackAnimation}`);
        return this.playAnimation(fallbackAnimation, force);
      }

      return false;
    }

    // Validar componente de animación
    if (!this.anims) {
      logAutopoiesis.error(
        `Sprite lacks animation component for ${animationKey}`,
      );
      return false;
    }

    try {
      const previousAnimation = this.currentAnimationKey;
      // AnimationManager.playAnimation no retorna valor
      this.animationManager.playAnimation(this, animationKey);

      this.currentAnimationKey = animationKey;

      // Solo logear cambios de animación, no repeticiones
      if (previousAnimation !== animationKey || force) {
        logAutopoiesis.debug(`Animation played: ${animationKey}`, {
          entityId: this.getEntityData().id,
          force,
          previousAnimation,
        });
      }

      return true;
    } catch (error) {
      logAutopoiesis.error(`Failed to play animation ${animationKey}`, {
        error: String(error),
        entityId: this.getEntityData().id,
        hasAnimComponent: !!this.anims,
        hasAnimManager: !!this.animationManager,
      });
      return false;
    }
  }

  /**
   * Stop current animation
   */
  public stopAnimation(): void {
    if (this.animationManager) {
      this.animationManager.stopAnimation(this);
      this.currentAnimationKey = "";
    }
  }

  /**
   * Queue animation to play after current one finishes
   */
  public queueAnimation(animationKey: string): void {
    if (this.animationManager?.hasAnimation(animationKey)) {
      this.animationQueue.push(animationKey);
    } else {
      logAutopoiesis.warn(`Cannot queue animation: ${animationKey} not found`);
    }
  }

  /**
   * Get current animation key
   */
  public getCurrentAnimation(): string {
    return this.currentAnimationKey;
  }

  /**
   * Get animation duration for current animation
   */
  public getCurrentAnimationDuration(): number {
    if (!this.animationManager || !this.currentAnimationKey) return 0;
    return this.animationManager.getAnimationDuration(this.currentAnimationKey);
  }

  /**
   * Check if animation is currently playing
   */
  public isAnimationPlaying(): boolean {
    return this.anims?.isPlaying || false;
  }

  /**
   * Override destroy to cleanup animation resources properly
   */
  public override destroy(): void {
    // Stop current animations
    this.stopAnimation();

    // Clear animation queue
    this.animationQueue = [];

    // If this sprite was created by AnimationManager, ensure it's properly cleaned up
    if (this.animationManager && this.scene) {
      // Stop any active animations on this sprite
      if (this.anims && this.anims.isPlaying) {
        this.anims.stop();
      }

      // Animation cleanup is handled by Phaser's destroy method
    }

    // Clear reference to animation manager
    this.animationManager = undefined;

    logAutopoiesis.debug(
      `AnimatedGameEntity destroyed: ${this.getEntityData().id}`,
    );

    // Call parent destroy which handles Phaser sprite cleanup
    super.destroy();
  }

  /**
   * Get animation system statistics
   */
  public getAnimationStats(): {
    currentAnimation: string;
    queueLength: number;
    isPlaying: boolean;
    hasAnimationManager: boolean;
  } {
    return {
      currentAnimation: this.currentAnimationKey,
      queueLength: this.animationQueue.length,
      isPlaying: this.isAnimationPlaying(),
      hasAnimationManager: !!this.animationManager,
    };
  }
}
