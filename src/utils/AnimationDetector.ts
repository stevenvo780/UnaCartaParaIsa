/**
 * Animation Detector - Detecta y valida assets animados
 */

import { logAutopoiesis } from "./logger";

export interface AnimationInfo {
  isAnimated: boolean;
  animationKey?: string;
  frameCount?: number;
  suggestedFrameRate?: number;
}

export class AnimationDetector {
  private static readonly KNOWN_ANIMATED_ASSETS = new Set([
    "campfire_anim",
    "flowers_red_anim",
    "flowers_white_anim",
    "flag_idle_anim",
    "flag_out_anim",
    "pointer_idle_anim",
    "chicken_anim",
    "pig_anim",
  ]);

  private static readonly ANIMATION_PATTERNS = [
    { pattern: /campfire/, frameCount: 8, frameRate: 8 },
    { pattern: /flower/, frameCount: 4, frameRate: 6 },
    { pattern: /flag/, frameCount: 7, frameRate: 8 },
    { pattern: /pointer/, frameCount: 6, frameRate: 10 },
    { pattern: /chicken/, frameCount: 4, frameRate: 8 },
    { pattern: /pig/, frameCount: 8, frameRate: 6 },
  ];

  /**
   * Detecta si un asset es animado
   */
  public static detectAnimation(assetKey: string): AnimationInfo {
    // Verificar en assets conocidos
    if (this.KNOWN_ANIMATED_ASSETS.has(assetKey)) {
      return {
        isAnimated: true,
        animationKey: assetKey,
        ...this.getAnimationParams(assetKey),
      };
    }

    // Verificar patrones de nombres
    if (assetKey.includes("_anim")) {
      return {
        isAnimated: true,
        animationKey: assetKey,
        ...this.getAnimationParams(assetKey),
      };
    }

    // Buscar por patrones conocidos
    for (const pattern of this.ANIMATION_PATTERNS) {
      if (pattern.pattern.test(assetKey)) {
        const animKey = assetKey.includes("_anim")
          ? assetKey
          : `${assetKey}_anim`;
        return {
          isAnimated: true,
          animationKey: animKey,
          frameCount: pattern.frameCount,
          suggestedFrameRate: pattern.frameRate,
        };
      }
    }

    return { isAnimated: false };
  }

  /**
   * Obtiene parámetros de animación para un asset
   */
  private static getAnimationParams(assetKey: string): Partial<AnimationInfo> {
    const pattern = this.ANIMATION_PATTERNS.find((p) =>
      p.pattern.test(assetKey),
    );
    if (pattern) {
      return {
        frameCount: pattern.frameCount,
        suggestedFrameRate: pattern.frameRate,
      };
    }

    // Valores por defecto
    return {
      frameCount: 4,
      suggestedFrameRate: 8,
    };
  }

  /**
   * Valida que una animación existe en el manager
   */
  public static validateAnimation(
    scene: Phaser.Scene,
    animationKey: string,
  ): boolean {
    if (!scene.anims.exists(animationKey)) {
      logAutopoiesis.warn("Animación no encontrada", { animationKey });
      return false;
    }
    return true;
  }

  /**
   * Sugiere alternativas para assets de animación faltantes
   */
  public static suggestAlternatives(assetKey: string): string[] {
    const alternatives: string[] = [];

    // Quitar sufijo _anim para buscar versión estática
    if (assetKey.includes("_anim")) {
      alternatives.push(assetKey.replace("_anim", ""));
    }

    // Agregar sufijo _anim para buscar versión animada
    if (!assetKey.includes("_anim")) {
      alternatives.push(`${assetKey}_anim`);
    }

    // Alternativas genéricas por categoría
    if (assetKey.includes("flower")) {
      alternatives.push("flower_static", "grass");
    } else if (assetKey.includes("animal")) {
      alternatives.push("decoration_static");
    } else if (assetKey.includes("fire")) {
      alternatives.push("torch", "light");
    }

    return alternatives;
  }

  /**
   * Registro de métricas de uso de animaciones
   */
  public static logAnimationUsage(animations: string[]): void {
    const stats = {
      total: animations.length,
      animated: animations.filter((key) => this.detectAnimation(key).isAnimated)
        .length,
      static: animations.filter((key) => !this.detectAnimation(key).isAnimated)
        .length,
      missing: animations.filter((key) => !this.KNOWN_ANIMATED_ASSETS.has(key))
        .length,
    };

    logAutopoiesis.info("Animation usage statistics", stats);
  }
}
