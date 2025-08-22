/**
 * Componente UI para el sistema de comida
 * Muestra inventario, tiendas y acciones de comida
 */

import Phaser from "phaser";
import type { FoodItem, FoodInventoryItem, FoodStoreData } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";
import { BaseUIComponent, UIComponentConfig } from "./BaseUIComponent";
import { createUIButton } from "./ui/UIButton";

export class FoodUI extends BaseUIComponent {
  private _inventoryPanel: Phaser.GameObjects.Container;
  private _storePanel: Phaser.GameObjects.Container;

  // Modern UI constants
  private readonly PANEL_WIDTH = 350;
  private readonly PANEL_HEIGHT = 450;
  private readonly ITEM_CARD_SIZE = 80;
  private readonly GRID_COLS = 3;
  private readonly ANIMATION_DURATION = 400;

  // Use centralized design system
  private readonly COLORS = DS.COLORS;

  public constructor(scene: Phaser.Scene) {
    const config: UIComponentConfig = {
      width: 700,
      height: 450,
      title: "Gestión de Comida",
      icon: "🍽️",
      closable: true,
      modal: true,
    };

    super(scene, config);

    this._inventoryPanel = scene.add.container(-this.PANEL_WIDTH / 2 - 20, 0);
    this._storePanel = scene.add.container(this.PANEL_WIDTH / 2 + 20, 0);

    this.container.add([this._inventoryPanel, this._storePanel]);

    this._setupModernPanels();
  }

  /**
   * Configura los paneles modernos de la UI
   */
  private _setupModernPanels(): void {
    this._createModernInventoryPanel();
    this._createModernStorePanel();
    this._createModalOverlay();
  }

  /**
   * Crea el panel de inventario moderno
   */
  private _createModernInventoryPanel(): void {
    // Fondo con glassmorphism usando design system
    const inventoryBg = this.scene.add.graphics();
    DS.createGlassmorphismBackground(
      inventoryBg,
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
      DS.COLORS.surface,
      0.95,
    );

    // Border primario
    inventoryBg.lineStyle(2, DS.COLORS.primary, 0.6);
    inventoryBg.strokeRoundedRect(
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
    );

    // Header
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(this.COLORS.primary, 0.8);
    headerBg.fillRoundedRect(0, 0, this.PANEL_WIDTH, 60, 16);
    headerBg.fillRect(0, 44, this.PANEL_WIDTH, 16);

    const inventoryIcon = this.scene.add
      .text(25, 30, "🎒", {
        fontSize: "20px",
      })
      .setOrigin(0, 0.5);

    const inventoryTitle = this.scene.add
      .text(55, 30, "INVENTARIO", DS.getTextStyle("lg", DS.COLORS.text, "bold"))
      .setOrigin(0, 0.5);

    // Close button
    const inventoryCloseBtn = this.createCloseButton();
    inventoryCloseBtn.setPosition(this.PANEL_WIDTH - 30, 30);
    inventoryCloseBtn.on("pointerdown", () => this.hide());

    this._inventoryPanel.add([
      inventoryBg,
      headerBg,
      inventoryIcon,
      inventoryTitle,
      inventoryCloseBtn,
    ]);
  }

  /**
   * Crea el panel de tienda moderno
   */
  private _createModernStorePanel(): void {
    // Fondo con glassmorphism usando design system
    const storeBg = this.scene.add.graphics();
    DS.createGlassmorphismBackground(
      storeBg,
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
      DS.COLORS.surface,
      0.95,
    );

    // Border de éxito
    storeBg.lineStyle(2, DS.COLORS.success, 0.6);
    storeBg.strokeRoundedRect(
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
    );

    // Header
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(this.COLORS.success, 0.8);
    headerBg.fillRoundedRect(0, 0, this.PANEL_WIDTH, 60, 16);
    headerBg.fillRect(0, 44, this.PANEL_WIDTH, 16);

    const storeIcon = this.scene.add
      .text(25, 30, "🏪", {
        fontSize: "20px",
      })
      .setOrigin(0, 0.5);

    const storeTitle = this.scene.add
      .text(
        55,
        30,
        "TIENDA DE COMIDA",
        DS.getTextStyle("lg", DS.COLORS.text, "bold"),
      )
      .setOrigin(0, 0.5);

    // Money indicator
    const moneyContainer = this.scene.add.container(this.PANEL_WIDTH - 100, 30);
    const moneyBg = this.scene.add.graphics();
    moneyBg.fillStyle(this.COLORS.warning, 0.2);
    moneyBg.fillRoundedRect(0, -12, 90, 24, 12);
    moneyBg.lineStyle(1, this.COLORS.warning, 0.5);
    moneyBg.strokeRoundedRect(0, -12, 90, 24, 12);

    const moneyIcon = this.scene.add
      .text(10, 0, "💰", {
        fontSize: "12px",
      })
      .setOrigin(0, 0.5);

    const moneyText = this.scene.add
      .text(25, 0, "1000", DS.getTextStyle("sm", DS.COLORS.text, "bold"))
      .setOrigin(0, 0.5);

    moneyContainer.add([moneyBg, moneyIcon, moneyText]);
    moneyContainer.setData("moneyText", moneyText);

    this._storePanel.add([
      storeBg,
      headerBg,
      storeIcon,
      storeTitle,
      moneyContainer,
    ]);
    this._storePanel.setVisible(false);
  }

  /**
   * Crea el overlay modal semi-transparente
   */
  private _createModalOverlay(): void {
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

    // Add overlay as first element
    this.container.addAt(overlay, 0);
  }

  // Botón de cierre heredado desde BaseUIComponent

  /**
   * Configura los event listeners
   */
  private _setupEventListeners(): void {
    // Escuchar evento para abrir tienda
    this.scene.events.on("openFoodStore", (storeData: FoodStoreData) => {
      this.showStore(storeData);
    });

    // Tecla para toggle inventario (I)
    this.scene.input.keyboard?.on("keydown-I", () => {
      this.toggleInventory();
    });

    // Tecla para cerrar UI (ESC)
    this.scene.input.keyboard?.on("keydown-ESC", () => {
      this.hide();
    });
  }

  /**
   * Muestra/oculta el inventario con animaciones modernas
   */
  public toggleInventory(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.showInventoryOnly();
    }
  }

  /**
   * Muestra solo el inventario
   */
  public showInventoryOnly(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this._storePanel.setVisible(false);

    // Animación de entrada elegante
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: this.ANIMATION_DURATION,
      ease: "Back.easeOut",
      onComplete: () => {
        this._updateInventoryDisplay();
      },
    });

    // Animación de entrada del panel
    this.scene.tweens.add({
      targets: this._inventoryPanel,
      x: {
        from: -this.PANEL_WIDTH / 2 - 20 - 100,
        to: -this.PANEL_WIDTH / 2 - 20,
      },
      duration: this.ANIMATION_DURATION + 100,
      ease: "Back.easeOut",
      delay: 100,
    });
  }

  /**
   * Muestra la tienda con comida disponible
   */
  public showStore(
    storeData: FoodStoreData,
    inventory?: FoodInventoryItem[],
  ): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this._storePanel.setVisible(true);

    // Animación de entrada elegante
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: this.ANIMATION_DURATION,
      ease: "Back.easeOut",
      onComplete: () => {
        this._updateInventoryDisplay(inventory);
        this._updateStoreDisplay(storeData);
      },
    });

    // Animación escalonada de los paneles
    this.scene.tweens.add({
      targets: this._inventoryPanel,
      x: {
        from: -this.PANEL_WIDTH / 2 - 20 - 100,
        to: -this.PANEL_WIDTH / 2 - 20,
      },
      duration: this.ANIMATION_DURATION + 100,
      ease: "Back.easeOut",
      delay: 100,
    });

    this.scene.tweens.add({
      targets: this._storePanel,
      x: {
        from: this.PANEL_WIDTH / 2 + 20 + 100,
        to: this.PANEL_WIDTH / 2 + 20,
      },
      duration: this.ANIMATION_DURATION + 100,
      ease: "Back.easeOut",
      delay: 200,
    });
  }

  /**
   * Oculta la UI con animación suave
   */
  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Animación de salida elegante
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: this.ANIMATION_DURATION - 100,
      ease: "Back.easeIn",
      onComplete: () => {
        this.container.setVisible(false);
      },
    });

    logAutopoiesis.debug("Food UI hidden with animation");
  }

  /**
   * Actualiza la visualización del inventario
   */
  private _updateInventoryDisplay(inventory?: FoodInventoryItem[]): void {
    // Limpiar items existentes (excepto fondo y título)
    const itemsToRemove = this._inventoryPanel.list.slice(2);
    itemsToRemove.forEach((item) => {
      this._inventoryPanel.remove(item);
      item.destroy();
    });

    if (!inventory || inventory.length === 0) {
      const emptyText = this.scene.add.text(
        0,
        0,
        "Inventario vacío",
        DS.getTextStyle("base", DS.COLORS.textSecondary),
      );
      emptyText.setOrigin(0.5);
      this._inventoryPanel.add(emptyText);
      return;
    }

    // Mostrar items del inventario
    inventory.forEach((item, index) => {
      const y = -120 + index * 40;

      // Crear sprite de comida (si está cargado)
      let foodSprite: Phaser.GameObjects.Image | null = null;
      if (this.scene.textures.exists(item.food.id)) {
        foodSprite = this.scene.add.image(-120, y, item.food.id);
        foodSprite.setScale(0.3);
        this._inventoryPanel.add(foodSprite);
      }

      // Texto con información
      const itemText = this.scene.add.text(
        -90,
        y,
        `${item.food.name} x${item.quantity}`,
        DS.getTextStyle("sm", DS.COLORS.text),
      );
      itemText.setOrigin(0, 0.5);

      // Mostrar efectos
      const effectsText = this.scene.add.text(
        -90,
        y + 15,
        `+${item.food.hungerRestore} hambre`,
        DS.getTextStyle("xs", DS.COLORS.success),
      );
      effectsText.setOrigin(0, 0.5);

      this._inventoryPanel.add([itemText, effectsText]);
    });
  }

  /**
   * Actualiza la visualización de la tienda
   */
  private _updateStoreDisplay(storeData: FoodStoreData | FoodItem[]): void {
    // Si recibimos FoodStoreData, extraer los foods
    const foods = Array.isArray(storeData) ? storeData : storeData.foods || [];
    // Limpiar items existentes
    const itemsToRemove = this._storePanel.list.slice(2);
    itemsToRemove.forEach((item) => {
      this._storePanel.remove(item);
      item.destroy();
    });

    // Mostrar comidas disponibles
    foods.forEach((food, index) => {
      const y = -150 + index * 60;

      // Sprite de comida
      let foodSprite: Phaser.GameObjects.Image | null = null;
      if (this.scene.textures.exists(food.id)) {
        foodSprite = this.scene.add.image(-150, y, food.id);
        foodSprite.setScale(0.4);
        this._storePanel.add(foodSprite);
      }

      // Nombre y precio
      const nameText = this.scene.add.text(
        -110,
        y - 15,
        food.name,
        DS.getTextStyle("base", DS.COLORS.text),
      );
      nameText.setOrigin(0, 0.5);

      const priceText = this.scene.add.text(
        -110,
        y + 5,
        `$${food.price}`,
        DS.getTextStyle("sm", DS.COLORS.warning),
      );
      priceText.setOrigin(0, 0.5);

      // Efectos
      const effectsText = this.scene.add.text(
        -110,
        y + 20,
        `+${food.hungerRestore} hambre, +${food.happinessBonus} felicidad`,
        DS.getTextStyle("xs", DS.COLORS.textMuted),
      );
      effectsText.setOrigin(0, 0.5);

      // Botón para comprar
      const buyBtn = createUIButton(
        this.scene,
        80,
        y - 15,
        "Comprar",
        () => this._buyFood(food.id),
        {
          width: 80,
          height: 30,
          color: 0x27ae60,
        },
      );

      this._storePanel.add([nameText, priceText, effectsText, buyBtn]);
    });
  }

  /**
   * Maneja la compra de comida
   */
  private _buyFood(foodId: string): void {
    // Emitir evento para que MainScene maneje la compra
    this.scene.events.emit("buyFood", { foodId, quantity: 1 });

    logAutopoiesis.info("Solicitud de compra de comida", { foodId });
  }

  /**
   * Muestra indicador de que se está comiendo
   */
  public showEatingIndicator(
    entityId: string,
    _foodId: string,
    duration: number,
  ): void {
    const indicator = this.scene.add.text(
      100,
      100,
      `${entityId} está comiendo...`,
      {
        fontSize: "16px",
        color: "#2ecc71",
        backgroundColor: "#2c3e50",
        padding: { x: 10, y: 5 },
      },
    );

    // Animar el indicador
    this.scene.tweens.add({
      targets: indicator,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Remover después de la duración
    this.scene.time.delayedCall(duration, () => {
      indicator.destroy();
    });
  }

  /**
   * Implementación requerida por BaseUIComponent
   */
  protected onShow(): void {
    // Lógica específica al mostrar la UI de comida
  }

  protected onHide(): void {
    // Lógica específica al ocultar la UI de comida
  }

  public updateContent(): void {
    // Actualizar contenido según sea necesario
  }
}
