/**
 * Helper utilities for common animation patterns
 * Reduces duplication in animation code
 */

import type Phaser from "phaser";

export interface RepeatAnimationConfig {
  targets: any;
  duration: number;
  yoyo?: boolean;
  ease?: string;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
  x?: number;
  y?: number;
}

export interface PulseAnimationConfig {
  targets: any;
  scale?: number;
  alpha?: number;
  duration?: number;
  ease?: string;
}

export class AnimationHelpers {
  /**
   * Crea una animación infinita con patrón repetitivo común
   */
  static createInfiniteAnimation(
    scene: Phaser.Scene,
    config: RepeatAnimationConfig
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: config.targets,
      duration: config.duration,
      yoyo: config.yoyo ?? true,
      repeat: -1,
      ease: config.ease ?? "Sine.easeInOut",
      ...Object.fromEntries(
        ["scaleX", "scaleY", "alpha", "x", "y"]
          .filter(key => config[key as keyof RepeatAnimationConfig] !== undefined)
          .map(key => [key, config[key as keyof RepeatAnimationConfig]])
      )
    });
  }

  /**
   * Crea una animación de pulso estándar
   */
  static createPulseAnimation(
    scene: Phaser.Scene,
    config: PulseAnimationConfig
  ): Phaser.Tweens.Tween {
    return AnimationHelpers.createInfiniteAnimation(scene, {
      targets: config.targets,
      duration: config.duration ?? 2000,
      yoyo: true,
      ease: config.ease ?? "Sine.easeInOut",
      scaleX: config.scale ?? 1.1,
      scaleY: config.scale ?? 1.1,
      alpha: config.alpha,
    });
  }

  /**
   * Crea una animación de brillo/glow
   */
  static createGlowAnimation(
    scene: Phaser.Scene,
    targets: any,
    duration = 1500
  ): Phaser.Tweens.Tween {
    return AnimationHelpers.createInfiniteAnimation(scene, {
      targets,
      duration,
      yoyo: true,
      ease: "Sine.easeInOut",
      alpha: 0.7,
    });
  }

  /**
   * Crea una animación de flotación
   */
  static createFloatAnimation(
    scene: Phaser.Scene,
    targets: any,
    amplitude = 10,
    duration = 3000
  ): Phaser.Tweens.Tween {
    const originalY = targets.y || 0;
    return AnimationHelpers.createInfiniteAnimation(scene, {
      targets,
      duration,
      yoyo: true,
      ease: "Sine.easeInOut",
      y: originalY + amplitude,
    });
  }

  /**
   * Para todas las animaciones en un objeto
   */
  static stopAllAnimations(scene: Phaser.Scene, targets: any): void {
    scene.tweens.killTweensOf(targets);
  }
}