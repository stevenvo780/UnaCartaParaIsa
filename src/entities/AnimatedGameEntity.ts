/**
 * Animated Game Entity for "Una Carta Para Isa"
 * Extends GameEntity with comprehensive animation support using Phaser's animation system
 */

import { GameEntity } from './GameEntity';
import { AnimationManager } from '../managers/AnimationManager';
import { logAutopoiesis } from '../utils/logger';
import type { ActivityType, MoodType } from '../types';
import type { IEntityServices } from '../interfaces/EntityServices';

export class AnimatedGameEntity extends GameEntity {
  private animationManager?: AnimationManager;
  private currentAnimationKey: string = '';
  private animationQueue: string[] = [];
  private lastStateHash: string = '';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    entityId: 'isa' | 'stev',
    services?: IEntityServices
  ) {
    // Get animation manager from scene registry
    const animManager = scene.registry.get('animationManager') as AnimationManager;
    
    // Initialize with base spritesheet instead of static sprite
    const initialSpriteKey = entityId === 'isa' ? 'isa_happy_anim' : 'stev_happy_anim';
    
    // Call parent constructor but override texture creation
    super(scene, x, y, entityId, services);
    
    // Override the texture with the animated spritesheet
    this.setTexture(initialSpriteKey);
    
    this.animationManager = animManager;
    
    if (this.animationManager) {
      // Start with appropriate initial animation
      const initialAnimation = entityId === 'isa' ? 'isa_happy' : 'stev_happy';
      this.currentAnimationKey = initialAnimation;
      this.animationManager.playAnimation(this, initialAnimation);
      
      logAutopoiesis.info(`AnimatedGameEntity ${entityId} created with animation`, {
        initialAnimation,
        spriteKey: initialSpriteKey
      });
    } else {
      logAutopoiesis.warn(`AnimationManager not available for ${entityId}, falling back to static sprites`);
    }
  }

  /**
   * Override parent's updateEntity to include animation updates
   */
  public updateEntity(deltaTime: number): void {
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
    const currentStateHash = this.createStateHash(entityData.stats, entityData.mood, entityData.activity);
    
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
    const stats = entityData.stats;
    const entityId = entityData.id;
    
    // Calculate average well-being
    const avgStat = (
      stats.happiness + 
      stats.energy + 
      (100 - stats.hunger) +
      (100 - stats.boredom)
    ) / 4;

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
  private createStateHash(stats: any, mood: MoodType, activity: ActivityType): string {
    const avgStat = Math.floor((
      stats.happiness + 
      stats.energy + 
      (100 - stats.hunger) +
      (100 - stats.boredom)
    ) / 4 / 10); // Reduce precision to avoid too frequent changes
    
    const healthTier = Math.floor(stats.health / 20);
    
    return `${avgStat}-${healthTier}-${mood}-${activity}`;
  }

  /**
   * Play specific animation with fallback handling
   */
  public playAnimation(animationKey: string, force: boolean = false): boolean {
    if (!this.animationManager) {
      logAutopoiesis.warn(`Cannot play animation ${animationKey}: AnimationManager not available`);
      return false;
    }

    // Check if animation exists
    if (!this.animationManager.hasAnimation(animationKey)) {
      logAutopoiesis.warn(`Animation not found: ${animationKey}`);
      return false;
    }

    try {
      const success = this.animationManager.playAnimation(this, animationKey, !force);
      
      if (success) {
        this.currentAnimationKey = animationKey;
        
        logAutopoiesis.debug(`Animation played: ${animationKey}`, {
          entityId: this.getEntityData().id,
          force
        });
      }
      
      return success;
    } catch (error) {
      logAutopoiesis.error(`Failed to play animation ${animationKey}`, {
        error: error.toString(),
        entityId: this.getEntityData().id
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
      this.currentAnimationKey = '';
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
   * Handle animation complete events
   */
  private onAnimationComplete(): void {
    // Play next queued animation if available
    if (this.animationQueue.length > 0) {
      const nextAnimation = this.animationQueue.shift();
      if (nextAnimation) {
        this.playAnimation(nextAnimation);
      }
    }
  }

  /**
   * Override destroy to cleanup animation resources
   */
  public destroy(): void {
    this.stopAnimation();
    this.animationQueue = [];
    this.animationManager = undefined;
    
    logAutopoiesis.debug(`AnimatedGameEntity destroyed: ${this.getEntityData().id}`);
    
    // Call parent destroy
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
      hasAnimationManager: !!this.animationManager
    };
  }
}