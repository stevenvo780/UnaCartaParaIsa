/**
 * Sistema de Diseño Moderno para Una Carta Para Isa
 * Proporciona consistencia visual y responsividad
 */

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ColorPalette {
  primary: number;
  primaryLight: number;
  primaryDark: number;
  secondary: number;
  secondaryLight: number;
  success: number;
  warning: number;
  danger: number;
  info: number;
  surface: number;
  surfaceLight: number;
  surfaceDark: number;
  background: number;
  backgroundLight: number;
  text: number;
  textSecondary: number;
  textMuted: number;
  accent: number;
  accentLight: number;
  border: number;
  shadow: number;
}

export interface TypographyScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface RadiusScale {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ShadowConfig {
  sm: { color: number; alpha: number; blur: number; offset: { x: number; y: number } };
  md: { color: number; alpha: number; blur: number; offset: { x: number; y: number } };
  lg: { color: number; alpha: number; blur: number; offset: { x: number; y: number } };
  xl: { color: number; alpha: number; blur: number; offset: { x: number; y: number } };
}

export interface AnimationConfig {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    easeOut: string;
    easeIn: string;
    easeInOut: string;
    backOut: string;
    backIn: string;
    bounce: string;
  };
}

export interface AccessibilityConfig {
  focusOutlineWidth: number;
  focusOutlineColor: number;
  minimumTouchSize: number;
  highContrast: {
    background: number;
    text: number;
    primary: number;
    secondary: number;
  };
  reducedMotion: boolean;
}

export class UIDesignSystem {
  // Breakpoints para responsividad
  public static readonly BREAKPOINTS: BreakpointConfig = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  };

  // Paleta de colores moderna y consistente
  public static readonly COLORS: ColorPalette = {
    // Colores primarios (púrpura/azul)
    primary: 0x6c5ce7,
    primaryLight: 0x8b7ed8,
    primaryDark: 0x5a4fcf,

    // Colores secundarios (azul claro)
    secondary: 0x74b9ff,
    secondaryLight: 0x94ccff,

    // Estados
    success: 0x00cec9,
    warning: 0xfdcb6e,
    danger: 0xe17055,
    info: 0x6c5ce7,

    // Superficies
    surface: 0x37474f,
    surfaceLight: 0x455a64,
    surfaceDark: 0x263238,

    // Fondos
    background: 0x1a1a2e,
    backgroundLight: 0x2d3436,

    // Texto
    text: 0xffffff,
    textSecondary: 0xb2bec3,
    textMuted: 0x636e72,

    // Acentos
    accent: 0x00cec9,
    accentLight: 0x55efc4,

    // Elementos de UI
    border: 0x636e72,
    shadow: 0x000000,
  };

  // Escala tipográfica responsiva
  public static readonly TYPOGRAPHY: TypographyScale = {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  };

  // Sistema de espaciado consistente
  public static readonly SPACING: SpacingScale = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  };

  // Radios de borde
  public static readonly RADIUS: RadiusScale = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  };

  // Configuración de sombras
  public static readonly SHADOWS: ShadowConfig = {
    sm: { color: 0x000000, alpha: 0.1, blur: 4, offset: { x: 0, y: 1 } },
    md: { color: 0x000000, alpha: 0.15, blur: 8, offset: { x: 0, y: 2 } },
    lg: { color: 0x000000, alpha: 0.2, blur: 16, offset: { x: 0, y: 4 } },
    xl: { color: 0x000000, alpha: 0.25, blur: 24, offset: { x: 0, y: 8 } },
  };

  // Configuración de animaciones
  public static readonly ANIMATIONS: AnimationConfig = {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeOut: 'Power2.easeOut',
      easeIn: 'Power2.easeIn',
      easeInOut: 'Power2.easeInOut',
      backOut: 'Back.easeOut',
      backIn: 'Back.easeIn',
      bounce: 'Bounce.easeOut',
    },
  };

  // Z-indexes para capas de UI
  public static readonly Z_INDEX = {
    background: 0,
    content: 100,
    overlay: 500,
    dropdown: 800,
    tooltip: 900,
    modal: 1000,
    notification: 1100,
    debug: 9999,
  };

  // Configuración de accesibilidad
  public static readonly ACCESSIBILITY: AccessibilityConfig = {
    focusOutlineWidth: 2,
    focusOutlineColor: 0x74b9ff,
    minimumTouchSize: 44, // 44px mínimo recomendado por WCAG
    highContrast: {
      background: 0x000000,
      text: 0xffffff,
      primary: 0x00ffff,
      secondary: 0xffff00,
    },
    reducedMotion: false,
  };

  /**
   * Determina el breakpoint actual basado en el ancho de pantalla
   */
  public static getCurrentBreakpoint(width: number): keyof BreakpointConfig {
    if (width >= this.BREAKPOINTS.wide) return 'wide';
    if (width >= this.BREAKPOINTS.desktop) return 'desktop';
    if (width >= this.BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  }

  /**
   * Calcula dimensiones responsivas basadas en el breakpoint
   */
  public static getResponsiveDimensions(
    width: number,
    dimensions: Partial<Record<keyof BreakpointConfig, number>>
  ): number {
    const breakpoint = this.getCurrentBreakpoint(width);
    return dimensions[breakpoint] ?? dimensions.desktop ?? dimensions.tablet ?? dimensions.mobile ?? 0;
  }

  /**
   * Genera un objeto de estilo de texto consistente
   */
  public static getTextStyle(
    size: keyof TypographyScale = 'base',
    color: number = this.COLORS.text,
    weight: 'normal' | 'bold' = 'normal'
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontSize: this.TYPOGRAPHY[size],
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: weight === 'bold' ? 'bold' : 'normal',
    };
  }

  /**
   * Crea un fondo con glassmorphism effect
   */
  public static createGlassmorphismBackground(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = this.RADIUS.lg,
    color: number = this.COLORS.surface,
    alpha: number = 0.9
  ): void {
    // Shadow
    graphics.fillStyle(this.COLORS.shadow, 0.3);
    graphics.fillRoundedRect(x + 4, y + 4, width, height, radius);

    // Main background
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(x, y, width, height, radius);

    // Subtle border
    graphics.lineStyle(1, this.COLORS.border, 0.3);
    graphics.strokeRoundedRect(x, y, width, height, radius);

    // Inner highlight
    graphics.fillStyle(this.COLORS.accent, 0.1);
    graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, radius - 2);
  }

  /**
   * Aplica efectos hover estándar a un elemento
   */
  public static addHoverEffects(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject,
    scaleAmount: number = 1.05,
    duration: number = this.ANIMATIONS.duration.fast
  ): void {
    if (!element.setInteractive) return;

    const interactiveElement = element as any;

    interactiveElement.on('pointerover', () => {
      this.createAccessibleAnimation(scene, {
        targets: element,
        scaleX: scaleAmount,
        scaleY: scaleAmount,
        duration,
        ease: this.ANIMATIONS.easing.backOut,
      });
    });

    interactiveElement.on('pointerout', () => {
      this.createAccessibleAnimation(scene, {
        targets: element,
        scaleX: 1,
        scaleY: 1,
        duration,
        ease: this.ANIMATIONS.easing.backOut,
      });
    });
  }

  /**
   * Crea una animación de entrada estándar
   */
  public static createEntranceAnimation(
    scene: Phaser.Scene,
    targets: any[],
    delay: number = 0,
    stagger: number = 100
  ): void {
    targets.forEach((target, index) => {
      // Configuración inicial
      target.setAlpha(0);
      target.setScale(0.8);

      this.createAccessibleAnimation(scene, {
        targets: target,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 0.8, to: 1 },
        duration: this.ANIMATIONS.duration.normal,
        delay: delay + index * stagger,
        ease: this.ANIMATIONS.easing.backOut,
      });
    });
  }

  /**
   * Crea una animación de pulso para elementos importantes
   */
  public static createPulseAnimation(
    scene: Phaser.Scene,
    target: any,
    intensity: number = 0.1,
    duration: number = 2000
  ): void {
    // Respetar preferencias de movimiento reducido
    if (this.ACCESSIBILITY.reducedMotion) {
      return;
    }

    scene.tweens.add({
      targets: target,
      alpha: { from: 1 - intensity, to: 1 + intensity },
      scaleX: { from: 1 - intensity * 0.5, to: 1 + intensity * 0.5 },
      scaleY: { from: 1 - intensity * 0.5, to: 1 + intensity * 0.5 },
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Añade indicador de foco accesible a un elemento
   */
  public static addFocusIndicator(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject,
    width: number,
    height: number
  ): Phaser.GameObjects.Graphics {
    const focusIndicator = scene.add.graphics();
    focusIndicator.lineStyle(this.ACCESSIBILITY.focusOutlineWidth, this.ACCESSIBILITY.focusOutlineColor, 1);
    focusIndicator.strokeRoundedRect(
      -width / 2 - this.ACCESSIBILITY.focusOutlineWidth,
      -height / 2 - this.ACCESSIBILITY.focusOutlineWidth,
      width + this.ACCESSIBILITY.focusOutlineWidth * 2,
      height + this.ACCESSIBILITY.focusOutlineWidth * 2,
      this.RADIUS.sm
    );
    focusIndicator.setVisible(false);

    return focusIndicator;
  }

  /**
   * Verifica si un elemento cumple con el tamaño mínimo táctil
   */
  public static ensureMinimumTouchSize(width: number, height: number): { width: number; height: number } {
    return {
      width: Math.max(width, this.ACCESSIBILITY.minimumTouchSize),
      height: Math.max(height, this.ACCESSIBILITY.minimumTouchSize),
    };
  }

  /**
   * Obtiene colores con alto contraste si está habilitado
   */
  public static getAccessibleColors(): ColorPalette {
    if (this.ACCESSIBILITY.reducedMotion) {
      return {
        ...this.COLORS,
        background: this.ACCESSIBILITY.highContrast.background,
        text: this.ACCESSIBILITY.highContrast.text,
        primary: this.ACCESSIBILITY.highContrast.primary,
        secondary: this.ACCESSIBILITY.highContrast.secondary,
      };
    }
    return this.COLORS;
  }

  /**
   * Crea animaciones respetando las preferencias de accesibilidad
   */
  public static createAccessibleAnimation(scene: Phaser.Scene, config: any): Phaser.Tweens.Tween | null {
    if (this.ACCESSIBILITY.reducedMotion) {
      // Para movimiento reducido, aplicar cambios instantáneamente
      const targets = Array.isArray(config.targets) ? config.targets : [config.targets];
      targets.forEach((target: any) => {
        Object.keys(config).forEach(key => {
          if (key !== 'targets' && key !== 'duration' && key !== 'ease' && target[key] !== undefined) {
            const value = config[key];
            if (typeof value === 'object' && value.to !== undefined) {
              target[key] = value.to;
            } else if (typeof value !== 'object') {
              target[key] = value;
            }
          }
        });
      });
      return null;
    }

    return scene.tweens.add(config);
  }

  /**
   * Configura las preferencias de accesibilidad
   */
  public static setAccessibilityPreferences(options: Partial<AccessibilityConfig>): void {
    Object.assign(this.ACCESSIBILITY, options);
  }
}

// Exportar para uso directo
export const DS = UIDesignSystem;
