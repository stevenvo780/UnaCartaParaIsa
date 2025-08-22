/**
 * BaseUIComponent - Componente base para reducir duplicación en UI
 * Proporciona funcionalidad común para ExplorationUI, FoodUI y otros componentes
 */

import Phaser from "phaser";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";
import { FocusTrap } from "./ui/FocusTrap";

export interface UIComponentConfig {
  width: number;
  height: number;
  title: string;
  icon?: string;
  position?: { x: number; y: number };
  closable?: boolean;
  modal?: boolean;
}

export abstract class BaseUIComponent {
    protected scene: Phaser.Scene;
    protected container: Phaser.GameObjects.Container;
    protected config: UIComponentConfig;
    protected isVisible = false;
    protected background: Phaser.GameObjects.Graphics;
    protected header: Phaser.GameObjects.Container;
    private focusTrap?: FocusTrap;

    constructor(scene: Phaser.Scene, config: UIComponentConfig) {
        this.scene = scene;
        this.config = config;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(DS.Z_INDEX.modal);
        this.createBaseUI();
        this.setupEventListeners();
    }

    /**
   * Crea la UI base común
   */
    private createBaseUI(): void {
        this.createBackground();
        this.createHeader();

        if (this.config.modal) {
            this.createModalOverlay();
            this.focusTrap = new FocusTrap(this.scene, this.container);
        }

        this.updatePosition();
        this.container.setVisible(false);
        this.container.setAlpha(0);
    }

    /**
   * Crea el fondo con glassmorphism
   */
    private createBackground(): void {
        this.background = this.scene.add.graphics();
        DS.createGlassmorphismBackground(
            this.background,
            0,
            0,
            this.config.width,
            this.config.height,
            DS.RADIUS.xl,
            DS.COLORS.surface,
            0.95,
        );

        this.background.lineStyle(2, DS.COLORS.primary, 0.6);
        this.background.strokeRoundedRect(
            0,
            0,
            this.config.width,
            this.config.height,
            DS.RADIUS.xl,
        );

        this.container.add(this.background);
    }

    /**
   * Crea el header común
   */
    private createHeader(): void {
        this.header = this.scene.add.container(0, 0);

        const headerBg = this.scene.add.graphics();
        headerBg.fillStyle(DS.COLORS.primary, 0.8);
        headerBg.fillRoundedRect(0, 0, this.config.width, 60, 16);
        headerBg.fillRect(0, 44, this.config.width, 16);

        const titleIcon = this.scene.add
            .text(25, 30, this.config.icon || "📋", {
                fontSize: "20px",
            })
            .setOrigin(0, 0.5);

        const titleText = this.scene.add
            .text(
                55,
                30,
                this.config.title,
                DS.getTextStyle("lg", DS.COLORS.text, "bold"),
            )
            .setOrigin(0, 0.5);

        this.header.add([headerBg, titleIcon, titleText]);

        if (this.config.closable) {
            const closeButton = this.createCloseButton();
            closeButton.setPosition(this.config.width - 30, 30);
            closeButton.on("pointerdown", () => this.hide());
            this.header.add(closeButton);
        }

        this.container.add(this.header);
    }

    /**
   * Crea un botón de cierre estándar
   */
    protected createCloseButton(): Phaser.GameObjects.Container {
        const button = this.scene.add.container(0, 0);

        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(DS.COLORS.danger, 0.9);
        buttonBg.fillCircle(0, 0, 15);
        buttonBg.lineStyle(2, DS.COLORS.text, 0.8);
        buttonBg.strokeCircle(0, 0, 15);

        const closeIcon = this.scene.add
            .text(0, 0, "×", DS.getTextStyle("xl", DS.COLORS.text, "bold"))
            .setOrigin(0.5);

        button.add([buttonBg, closeIcon]);
        button.setSize(30, 30);
        button.setInteractive();

        DS.addHoverEffects(this.scene, button, 1.1, DS.ANIMATIONS.duration.fast);

        return button;
    }

    /**
   * Crea overlay modal
   */
    private createModalOverlay(): void {
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(
            -this.scene.cameras.main.width / 2,
            -this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
        );
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(
                -this.scene.cameras.main.width / 2,
                -this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
            ),
            Phaser.Geom.Rectangle.Contains,
        );
        overlay.on("pointerdown", () => this.hide());

        this.container.addAt(overlay, 0);
    }

    /**
   * Configurar event listeners comunes
   */
    protected setupEventListeners(): void {
        this.scene.input.keyboard?.on("keydown-ESC", () => {
            if (this.isVisible) this.hide();
        });
    }

    /**
   * Muestra la UI con animación estándar
   */
    public show(): void {
        this.isVisible = true;
        this.container.setVisible(true);
        this.focusTrap?.activate();

        DS.createAccessibleAnimation(this.scene, {
            targets: this.container,
            alpha: { from: 0, to: 1 },
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            duration: DS.ANIMATIONS.duration.normal,
            ease: DS.ANIMATIONS.easing.backOut,
            onComplete: () => this.onShow(),
        });
    }

    /**
   * Oculta la UI con animación estándar
   */
    public hide(): void {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.focusTrap?.deactivate();

        DS.createAccessibleAnimation(this.scene, {
            targets: this.container,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: DS.ANIMATIONS.duration.fast,
            ease: DS.ANIMATIONS.easing.backIn,
            onComplete: () => {
                this.container.setVisible(false);
                this.onHide();
            },
        });
    }

    /**
   * Alterna visibilidad
   */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
   * Actualiza posición según configuración y tamaño de pantalla
   */
    public updatePosition(): void {
        const x = this.config.position?.x ?? this.scene.cameras.main.width / 2;
        const y = this.config.position?.y ?? this.scene.cameras.main.height / 2;
        this.container.setPosition(x, y);
    }

    /**
   * Limpia recursos
   */
    public cleanup(): void {
        this.container.destroy();
    }

  /**
   * Métodos abstractos que deben implementar las subclases
   */
  protected abstract onShow(): void;
  protected abstract onHide(): void;
  public abstract updateContent(data?: any): void;
}
