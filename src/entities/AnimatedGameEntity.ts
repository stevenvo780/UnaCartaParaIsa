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

    // Initialize with base spritesheet instead of static sprite
    const initialSpriteKey =
      entityId === "isa" ? "isa_happy_anim" : "stev_happy_anim";

    // Call parent constructor with a fallback texture
    super(scene, x, y, entityId, services);

    // Override the texture with the animated spritesheet if available
    if (scene.textures.exists(initialSpriteKey)) {
      this.setTexture(initialSpriteKey);

      // Para sprites estáticos (como ent_woman.png), no intentar animaciones
      // Solo cambiar la textura directamente
      const texture = scene.textures.get(initialSpriteKey);
      const isStaticSprite =
        !texture.frames || Object.keys(texture.frames).length <= 1;

      if (isStaticSprite) {
        logAutopoiesis.info(
          `Using static sprite for ${entityId}: ${initialSpriteKey}`,
        );
        // Desactivar el sistema de animación para sprites estáticos
        this.animationManager = undefined;
      }
    } else {
      // Fallback to basic texture if spritesheet not loaded
      const fallbackKey = entityId === "isa" ? "woman" : "man";
      if (scene.textures.exists(fallbackKey)) {
        this.setTexture(fallbackKey);
      }
      logAutopoiesis.warn(
        `Spritesheet ${initialSpriteKey} not found, using fallback`,
      );
    }

    // Type-safe assignment of animation manager
    this.animationManager =
      animManager instanceof AnimationManager ? animManager : undefined;

    if (this.animationManager) {
      // Start with appropriate initial animation
      const initialAnimation = entityId === "isa" ? "isa_happy" : "stev_happy";

      // Validate animation exists before playing
      if (this.animationManager.hasAnimation(initialAnimation)) {
        this.currentAnimationKey = initialAnimation;
        this.animationManager.playAnimation(this, initialAnimation);

        logAutopoiesis.info(
          `AnimatedGameEntity ${entityId} created with animation`,
          {
            initialAnimation,
            spriteKey: initialSpriteKey,
          },
        );
      } else {
        logAutopoiesis.warn(
          `Animation ${initialAnimation} not found for ${entityId}`,
        );
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

    // Priority 1: Death/Critical state
    if (entityData.isDead || stats.health <= 10 || avgStat < 20) {
      return `${entityId}_dying`;
    }

    // Priority 2: Low well-being (sad)
    if (avgStat < 40 || stats.happiness < 30) {
      return `${entityId}_sad`;
    }

    // Priority 3: Normal/Happy state (default)
    return `${entityId}_happy`;
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

    return `${avgStat}-${healthTier}-${mood}-${activity}`;
  }

  /**
   * Detecta si un sprite es estático (no tiene animaciones)
   */
  private isStaticSprite(textureKey: string): boolean {
    const staticSprites = [
      "isa_happy_anim",
      "isa_sad_anim",
      "isa_dying_anim",
      "stev_happy_anim",
      "stev_sad_anim",
      "stev_dying_anim",
    ];
    return staticSprites.includes(textureKey);
  }

  /**
   * Play specific animation with comprehensive validation and fallback handling
   */
  public playAnimation(animationKey: string, force = false): boolean {
    // Para sprites estáticos (personajes humanos), no reproducir animaciones
    const textureKey = this.texture?.key || "";
    if (this.isStaticSprite(textureKey)) {
      return true; // Retornar éxito silenciosamente para sprites estáticos
    }

    // Skip animation for static sprites (no animation manager)
    if (!this.animationManager) {
      return true; // Return true to indicate "success" (no error) for static sprites
    }

    // Validate animation key format
    if (!animationKey || typeof animationKey !== "string") {
      logAutopoiesis.error(`Invalid animation key: ${animationKey}`);
      return false;
    }

    // Check if animation exists
    if (!this.animationManager.hasAnimation(animationKey)) {
      // Para sprites estáticos, no mostrar warnings
      if (this.isStaticSprite(textureKey)) {
        return true;
      }
      logAutopoiesis.warn(
        `Animation not found: ${animationKey}, attempting fallback`,
      );

      // Try fallback animation based on entity type
      const entityId = this.getEntityData().id;
      const fallbackAnimation = `${entityId}_happy`;

      if (this.animationManager.hasAnimation(fallbackAnimation)) {
        logAutopoiesis.info(`Using fallback animation: ${fallbackAnimation}`);
        return this.playAnimation(fallbackAnimation, force);
      }

      return false;
    }

    // Validate sprite has animation component
    if (!this.anims) {
      logAutopoiesis.error(
        `Sprite lacks animation component for ${animationKey}`,
      );
      return false;
    }

    try {
      const success = this.animationManager.playAnimation(
        this,
        animationKey,
        !force,
      );

      if (success) {
        const previousAnimation = this.currentAnimationKey;
        this.currentAnimationKey = animationKey;

        // Solo logear cambios de animación, no repeticiones
        if (previousAnimation !== animationKey || force) {
          logAutopoiesis.debug(`Animation played: ${animationKey}`, {
            entityId: this.getEntityData().id,
            force,
            previousAnimation,
          });
        }
      }

      return success;
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
