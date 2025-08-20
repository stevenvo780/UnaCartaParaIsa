/**
 * Componente UI para el sistema de comida
 * Muestra inventario, tiendas y acciones de comida
 */

import type Phaser from 'phaser';
import type { FoodItem, FoodInventoryItem, FoodStoreData } from '../types';
import { logAutopoiesis } from '../utils/logger';
import { UIDesignSystem as DS } from '../config/uiDesignSystem';

export class FoodUI {
  private _scene: Phaser.Scene;
  private _container: Phaser.GameObjects.Container;
  private _inventoryPanel: Phaser.GameObjects.Container;
  private _storePanel: Phaser.GameObjects.Container;
  private _isVisible = false;

  // Modern UI constants
  private readonly PANEL_WIDTH = 350;
  private readonly PANEL_HEIGHT = 450;
  private readonly ITEM_CARD_SIZE = 80;
  private readonly GRID_COLS = 3;
  private readonly ANIMATION_DURATION = 400;

  // Use centralized design system
  private readonly COLORS = DS.COLORS;

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;

    // Center panels on screen
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    this._container = scene.add.container(centerX, centerY);
    this._inventoryPanel = scene.add.container(-this.PANEL_WIDTH / 2 - 20, 0);
    this._storePanel = scene.add.container(this.PANEL_WIDTH / 2 + 20, 0);

    this._container.add([this._inventoryPanel, this._storePanel]);
    this._container.setVisible(false);
    this._container.setAlpha(0);
    this._container.setDepth(2000);

    this._setupModernPanels();
    this._setupEventListeners();
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
    const inventoryBg = this._scene.add.graphics();
    DS.createGlassmorphismBackground(
      inventoryBg,
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
      DS.COLORS.surface,
      0.95
    );

    // Border primario
    inventoryBg.lineStyle(2, DS.COLORS.primary, 0.6);
    inventoryBg.strokeRoundedRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, DS.RADIUS.xl);

    // Header
    const headerBg = this._scene.add.graphics();
    headerBg.fillStyle(this.COLORS.primary, 0.8);
    headerBg.fillRoundedRect(0, 0, this.PANEL_WIDTH, 60, 16);
    headerBg.fillRect(0, 44, this.PANEL_WIDTH, 16);

    const inventoryIcon = this._scene.add
      .text(25, 30, '🎒', {
        fontSize: '20px',
      })
      .setOrigin(0, 0.5);

    const inventoryTitle = this._scene.add
      .text(55, 30, 'INVENTARIO', DS.getTextStyle('lg', DS.COLORS.text, 'bold'))
      .setOrigin(0, 0.5);

    // Close button
    const inventoryCloseBtn = this._createCloseButton();
    inventoryCloseBtn.setPosition(this.PANEL_WIDTH - 30, 30);
    inventoryCloseBtn.on('pointerdown', () => this.hide());

    this._inventoryPanel.add([inventoryBg, headerBg, inventoryIcon, inventoryTitle, inventoryCloseBtn]);
  }

  /**
   * Crea el panel de tienda moderno
   */
  private _createModernStorePanel(): void {
    // Fondo con glassmorphism usando design system
    const storeBg = this._scene.add.graphics();
    DS.createGlassmorphismBackground(
      storeBg,
      0,
      0,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      DS.RADIUS.xl,
      DS.COLORS.surface,
      0.95
    );

    // Border de éxito
    storeBg.lineStyle(2, DS.COLORS.success, 0.6);
    storeBg.strokeRoundedRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, DS.RADIUS.xl);

    // Header
    const headerBg = this._scene.add.graphics();
    headerBg.fillStyle(this.COLORS.success, 0.8);
    headerBg.fillRoundedRect(0, 0, this.PANEL_WIDTH, 60, 16);
    headerBg.fillRect(0, 44, this.PANEL_WIDTH, 16);

    const storeIcon = this._scene.add
      .text(25, 30, '🏪', {
        fontSize: '20px',
      })
      .setOrigin(0, 0.5);

    const storeTitle = this._scene.add
      .text(55, 30, 'TIENDA DE COMIDA', DS.getTextStyle('lg', DS.COLORS.text, 'bold'))
      .setOrigin(0, 0.5);

    // Money indicator
    const moneyContainer = this._scene.add.container(this.PANEL_WIDTH - 100, 30);
    const moneyBg = this._scene.add.graphics();
    moneyBg.fillStyle(this.COLORS.warning, 0.2);
    moneyBg.fillRoundedRect(0, -12, 90, 24, 12);
    moneyBg.lineStyle(1, this.COLORS.warning, 0.5);
    moneyBg.strokeRoundedRect(0, -12, 90, 24, 12);

    const moneyIcon = this._scene.add
      .text(10, 0, '💰', {
        fontSize: '12px',
      })
      .setOrigin(0, 0.5);

    const moneyText = this._scene.add
      .text(25, 0, '1000', DS.getTextStyle('sm', DS.COLORS.text, 'bold'))
      .setOrigin(0, 0.5);

    moneyContainer.add([moneyBg, moneyIcon, moneyText]);
    moneyContainer.setData('moneyText', moneyText);

    this._storePanel.add([storeBg, headerBg, storeIcon, storeTitle, moneyContainer]);
    this._storePanel.setVisible(false);
  }

  /**
   * Crea el overlay modal semi-transparente
   */
  private _createModalOverlay(): void {
    const overlay = this._scene.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(
      -this._scene.cameras.main.width / 2,
      -this._scene.cameras.main.height / 2,
      this._scene.cameras.main.width,
      this._scene.cameras.main.height
    );
    overlay.setInteractive(
      new (window as any).Phaser.Geom.Rectangle(
        -this._scene.cameras.main.width / 2,
        -this._scene.cameras.main.height / 2,
        this._scene.cameras.main.width,
        this._scene.cameras.main.height
      ),
      (window as any).Phaser.Geom.Rectangle.Contains
    );
    overlay.on('pointerdown', () => this.hide());

    // Add overlay as first element
    this._container.addAt(overlay, 0);
  }

  /**
   * Crea un botón de cierre moderno
   */
  private _createCloseButton(): Phaser.GameObjects.Container {
    const button = this._scene.add.container(0, 0);

    const buttonBg = this._scene.add.graphics();
    buttonBg.fillStyle(0xe17055, 0.9);
    buttonBg.fillCircle(0, 0, 15);
    buttonBg.lineStyle(2, 0xffffff, 0.8);
    buttonBg.strokeCircle(0, 0, 15);

    const closeIcon = this._scene.add.text(0, 0, '×', DS.getTextStyle('xl', DS.COLORS.text, 'bold')).setOrigin(0.5);

    button.add([buttonBg, closeIcon]);
    button.setSize(30, 30);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      this._scene.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      this._scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    return button;
  }

  /**
   * Configura los event listeners
   */
  private _setupEventListeners(): void {
    // Escuchar evento para abrir tienda
    this._scene.events.on('openFoodStore', (storeData: FoodStoreData) => {
      this.showStore(storeData);
    });

    // Tecla para toggle inventario (I)
    this._scene.input.keyboard?.on('keydown-I', () => {
      this.toggleInventory();
    });

    // Tecla para cerrar UI (ESC)
    this._scene.input.keyboard?.on('keydown-ESC', () => {
      this.hide();
    });
  }

  /**
   * Muestra/oculta el inventario con animaciones modernas
   */
  public toggleInventory(): void {
    if (this._isVisible) {
      this.hide();
    } else {
      this.showInventoryOnly();
    }
  }

  /**
   * Muestra solo el inventario
   */
  public showInventoryOnly(): void {
    this._isVisible = true;
    this._container.setVisible(true);
    this._storePanel.setVisible(false);

    // Animación de entrada elegante
    this._scene.tweens.add({
      targets: this._container,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: this.ANIMATION_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._updateInventoryDisplay();
      },
    });

    // Animación de entrada del panel
    this._scene.tweens.add({
      targets: this._inventoryPanel,
      x: { from: -this.PANEL_WIDTH / 2 - 20 - 100, to: -this.PANEL_WIDTH / 2 - 20 },
      duration: this.ANIMATION_DURATION + 100,
      ease: 'Back.easeOut',
      delay: 100,
    });
  }

  /**
   * Muestra la tienda con comida disponible
   */
  public showStore(storeData: FoodStoreData, inventory?: FoodInventoryItem[]): void {
    this._isVisible = true;
    this._container.setVisible(true);
    this._storePanel.setVisible(true);

    // Animación de entrada elegante
    this._scene.tweens.add({
      targets: this._container,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: this.ANIMATION_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._updateInventoryDisplay(inventory);
        this._updateStoreDisplay(storeData);
      },
    });

    // Animación escalonada de los paneles
    this._scene.tweens.add({
      targets: this._inventoryPanel,
      x: { from: -this.PANEL_WIDTH / 2 - 20 - 100, to: -this.PANEL_WIDTH / 2 - 20 },
      duration: this.ANIMATION_DURATION + 100,
      ease: 'Back.easeOut',
      delay: 100,
    });

    this._scene.tweens.add({
      targets: this._storePanel,
      x: { from: this.PANEL_WIDTH / 2 + 20 + 100, to: this.PANEL_WIDTH / 2 + 20 },
      duration: this.ANIMATION_DURATION + 100,
      ease: 'Back.easeOut',
      delay: 200,
    });
  }

  /**
   * Oculta la UI con animación suave
   */
  public hide(): void {
    if (!this._isVisible) return;

    this._isVisible = false;

    // Animación de salida elegante
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: this.ANIMATION_DURATION - 100,
      ease: 'Back.easeIn',
      onComplete: () => {
        this._container.setVisible(false);
      },
    });

    logAutopoiesis.debug('Food UI hidden with animation');
  }

  /**
   * Actualiza la visualización del inventario
   */
  private _updateInventoryDisplay(inventory?: FoodInventoryItem[]): void {
    // Limpiar items existentes (excepto fondo y título)
    const itemsToRemove = this._inventoryPanel.list.slice(2);
    itemsToRemove.forEach(item => {
      this._inventoryPanel.remove(item);
      item.destroy();
    });

    if (!inventory || inventory.length === 0) {
      const emptyText = this._scene.add.text(
        0,
        0,
        'Inventario vacío',
        DS.getTextStyle('base', DS.COLORS.textSecondary)
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
      if (this._scene.textures.exists(item.food.id)) {
        foodSprite = this._scene.add.image(-120, y, item.food.id);
        foodSprite.setScale(0.3);
        this._inventoryPanel.add(foodSprite);
      }

      // Texto con información
      const itemText = this._scene.add.text(
        -90,
        y,
        `${item.food.name} x${item.quantity}`,
        DS.getTextStyle('sm', DS.COLORS.text)
      );
      itemText.setOrigin(0, 0.5);

      // Mostrar efectos
      const effectsText = this._scene.add.text(
        -90,
        y + 15,
        `+${item.food.hungerRestore} hambre`,
        DS.getTextStyle('xs', DS.COLORS.success)
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
    itemsToRemove.forEach(item => {
      this._storePanel.remove(item);
      item.destroy();
    });

    // Mostrar comidas disponibles
    foods.forEach((food, index) => {
      const y = -150 + index * 60;

      // Sprite de comida
      let foodSprite: Phaser.GameObjects.Image | null = null;
      if (this._scene.textures.exists(food.id)) {
        foodSprite = this._scene.add.image(-150, y, food.id);
        foodSprite.setScale(0.4);
        this._storePanel.add(foodSprite);
      }

      // Nombre y precio
      const nameText = this._scene.add.text(-110, y - 15, food.name, DS.getTextStyle('base', DS.COLORS.text));
      nameText.setOrigin(0, 0.5);

      const priceText = this._scene.add.text(-110, y + 5, `$${food.price}`, DS.getTextStyle('sm', DS.COLORS.warning));
      priceText.setOrigin(0, 0.5);

      // Efectos
      const effectsText = this._scene.add.text(
        -110,
        y + 20,
        `+${food.hungerRestore} hambre, +${food.happinessBonus} felicidad`,
        DS.getTextStyle('xs', DS.COLORS.textMuted)
      );
      effectsText.setOrigin(0, 0.5);

      // Botón para comprar
      const buyButton = this._scene.add.rectangle(120, y, 80, 30, 0x27ae60);
      const buyText = this._scene.add.text(120, y, 'Comprar', DS.getTextStyle('sm', DS.COLORS.text));
      buyText.setOrigin(0.5);

      buyButton.setInteractive();
      buyButton.on('pointerdown', () => {
        this._buyFood(food.id);
      });

      buyButton.on('pointerover', () => {
        buyButton.setFillStyle(0x2ecc71);
      });

      buyButton.on('pointerout', () => {
        buyButton.setFillStyle(0x27ae60);
      });

      this._storePanel.add([nameText, priceText, effectsText, buyButton, buyText]);
    });
  }

  /**
   * Maneja la compra de comida
   */
  private _buyFood(foodId: string): void {
    // Emitir evento para que MainScene maneje la compra
    this._scene.events.emit('buyFood', { foodId, quantity: 1 });

    logAutopoiesis.info('Solicitud de compra de comida', { foodId });
  }

  /**
   * Muestra indicador de que se está comiendo
   */
  public showEatingIndicator(entityId: string, _foodId: string, duration: number): void {
    const indicator = this._scene.add.text(100, 100, `${entityId} está comiendo...`, {
      fontSize: '16px',
      color: '#2ecc71',
      backgroundColor: '#2c3e50',
      padding: { x: 10, y: 5 },
    });

    // Animar el indicador
    this._scene.tweens.add({
      targets: indicator,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Remover después de la duración
    this._scene.time.delayedCall(duration, () => {
      indicator.destroy();
    });
  }

  /**
   * Limpia la UI
   */
  public cleanup(): void {
    this._container.destroy();
  }
}
