/**
 * Componente UI para el sistema de comida
 * Muestra inventario, tiendas y acciones de comida
 */

import type Phaser from 'phaser';
import type { FoodItem, FoodInventoryItem, FoodStoreData } from '../types';
import { logAutopoiesis } from '../utils/logger';

export class FoodUI {
  private _scene: Phaser.Scene;
  private _container: Phaser.GameObjects.Container;
  private _inventoryPanel: Phaser.GameObjects.Container;
  private _storePanel: Phaser.GameObjects.Container;
  private _isVisible = false;

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this._container = scene.add.container(0, 0);
    this._inventoryPanel = scene.add.container(50, 50);
    this._storePanel = scene.add.container(400, 50);

    this._container.add([this._inventoryPanel, this._storePanel]);
    this._container.setVisible(false);

    this._setupPanels();
    this._setupEventListeners();
  }

  /**
   * Configura los paneles base de la UI
   */
  private _setupPanels(): void {
    // Panel de inventario
    const inventoryBg = this._scene.add.rectangle(
      0,
      0,
      300,
      400,
      0x2c3e50,
      0.9
    );
    const inventoryTitle = this._scene.add.text(-140, -180, 'Inventario', {
      fontSize: '18px',
      color: '#ffffff',
    });

    this._inventoryPanel.add([inventoryBg, inventoryTitle]);

    // Panel de tienda
    const storeBg = this._scene.add.rectangle(0, 0, 350, 450, 0x34495e, 0.9);
    const storeTitle = this._scene.add.text(-165, -210, 'Tienda de Comida', {
      fontSize: '18px',
      color: '#ffffff',
    });

    this._storePanel.add([storeBg, storeTitle]);
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
   * Muestra/oculta el inventario
   */
  public toggleInventory(): void {
    if (this._isVisible && this._storePanel.visible) {
      // Si la tienda está abierta, solo cerrar la tienda
      this._storePanel.setVisible(false);
    } else {
      // Toggle inventario
      this._isVisible = !this._isVisible;
      this._container.setVisible(this._isVisible);
      this._storePanel.setVisible(false);

      if (this._isVisible) {
        this._updateInventoryDisplay();
      }
    }
  }

  /**
   * Muestra la tienda con comida disponible
   */
  public showStore(
    storeData: FoodStoreData,
    inventory?: FoodInventoryItem[]
  ): void {
    this._isVisible = true;
    this._container.setVisible(true);
    this._storePanel.setVisible(true);

    this._updateInventoryDisplay(inventory);
    this._updateStoreDisplay(storeData.foods);

    logAutopoiesis.info('Tienda de comida abierta', {
      availableFoods: storeData.foods.length,
      inventoryItems: inventory?.length ?? 0,
    });
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
      const emptyText = this._scene.add.text(0, 0, 'Inventario vacío', {
        fontSize: '14px',
        color: '#bdc3c7',
        align: 'center',
      });
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
        {
          fontSize: '12px',
          color: '#ecf0f1',
        }
      );
      itemText.setOrigin(0, 0.5);

      // Mostrar efectos
      const effectsText = this._scene.add.text(
        -90,
        y + 15,
        `+${item.food.hungerRestore} hambre`,
        {
          fontSize: '10px',
          color: '#2ecc71',
        }
      );
      effectsText.setOrigin(0, 0.5);

      this._inventoryPanel.add([itemText, effectsText]);
    });
  }

  /**
   * Actualiza la visualización de la tienda
   */
  private _updateStoreDisplay(foods: FoodItem[]): void {
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
      const nameText = this._scene.add.text(-110, y - 15, food.name, {
        fontSize: '14px',
        color: '#ecf0f1',
      });
      nameText.setOrigin(0, 0.5);

      const priceText = this._scene.add.text(-110, y + 5, `$${food.price}`, {
        fontSize: '12px',
        color: '#f1c40f',
      });
      priceText.setOrigin(0, 0.5);

      // Efectos
      const effectsText = this._scene.add.text(
        -110,
        y + 20,
        `+${food.hungerRestore} hambre, +${food.happinessBonus} felicidad`,
        {
          fontSize: '10px',
          color: '#95a5a6',
        }
      );
      effectsText.setOrigin(0, 0.5);

      // Botón para comprar
      const buyButton = this._scene.add.rectangle(120, y, 80, 30, 0x27ae60);
      const buyText = this._scene.add.text(120, y, 'Comprar', {
        fontSize: '12px',
        color: '#ffffff',
      });
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

      this._storePanel.add([
        nameText,
        priceText,
        effectsText,
        buyButton,
        buyText,
      ]);
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
   * Oculta la UI
   */
  public hide(): void {
    this._isVisible = false;
    this._container.setVisible(false);
  }

  /**
   * Muestra indicador de que se está comiendo
   */
  public showEatingIndicator(
    entityId: string,
    _foodId: string,
    duration: number
  ): void {
    const indicator = this._scene.add.text(
      100,
      100,
      `${entityId} está comiendo...`,
      {
        fontSize: '16px',
        color: '#2ecc71',
        backgroundColor: '#2c3e50',
        padding: { x: 10, y: 5 },
      }
    );

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
