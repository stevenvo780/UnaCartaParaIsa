/**
 * Componente UI para el sistema de comida
 * Muestra inventario, tiendas y acciones de comida
 */

import Phaser from 'phaser';
import type { FoodItem, FoodInventoryItem } from '../types/food';
import { logAutopoiesis } from '../utils/logger';

export class FoodUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private inventoryPanel: Phaser.GameObjects.Container;
  private storePanel: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.inventoryPanel = scene.add.container(50, 50);
    this.storePanel = scene.add.container(400, 50);
    
    this.container.add([this.inventoryPanel, this.storePanel]);
    this.container.setVisible(false);
    
    this.setupPanels();
    this.setupEventListeners();
  }

  /**
   * Configura los paneles base de la UI
   */
  private setupPanels(): void {
    // Panel de inventario
    const inventoryBg = this.scene.add.rectangle(0, 0, 300, 400, 0x2c3e50, 0.9);
    const inventoryTitle = this.scene.add.text(-140, -180, 'Inventario', {
      fontSize: '18px',
      color: '#ffffff'
    });
    
    this.inventoryPanel.add([inventoryBg, inventoryTitle]);

    // Panel de tienda
    const storeBg = this.scene.add.rectangle(0, 0, 350, 450, 0x34495e, 0.9);
    const storeTitle = this.scene.add.text(-165, -210, 'Tienda de Comida', {
      fontSize: '18px',
      color: '#ffffff'
    });
    
    this.storePanel.add([storeBg, storeTitle]);
  }

  /**
   * Configura los event listeners
   */
  private setupEventListeners(): void {
    // Escuchar evento para abrir tienda
    this.scene.events.on('openFoodStore', (storeData: any) => {
      this.showStore(storeData);
    });

    // Tecla para toggle inventario (I)
    this.scene.input.keyboard?.on('keydown-I', () => {
      this.toggleInventory();
    });

    // Tecla para cerrar UI (ESC)
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      this.hide();
    });
  }

  /**
   * Muestra/oculta el inventario
   */
  toggleInventory(): void {
    if (this.isVisible && this.storePanel.visible) {
      // Si la tienda está abierta, solo cerrar la tienda
      this.storePanel.setVisible(false);
    } else {
      // Toggle inventario
      this.isVisible = !this.isVisible;
      this.container.setVisible(this.isVisible);
      this.storePanel.setVisible(false);
      
      if (this.isVisible) {
        this.updateInventoryDisplay();
      }
    }
  }

  /**
   * Muestra la tienda con comida disponible
   */
  showStore(storeData: {
    foods: FoodItem[];
    inventory: FoodInventoryItem[];
    stats: any;
  }): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.storePanel.setVisible(true);
    
    this.updateInventoryDisplay(storeData.inventory);
    this.updateStoreDisplay(storeData.foods);

    logAutopoiesis.info('Tienda de comida abierta', { 
      availableFoods: storeData.foods.length,
      inventoryItems: storeData.inventory.length 
    });
  }

  /**
   * Actualiza la visualización del inventario
   */
  private updateInventoryDisplay(inventory?: FoodInventoryItem[]): void {
    // Limpiar items existentes (excepto fondo y título)
    const itemsToRemove = this.inventoryPanel.list.slice(2);
    itemsToRemove.forEach(item => {
      this.inventoryPanel.remove(item);
      (item as Phaser.GameObjects.GameObject).destroy();
    });

    if (!inventory || inventory.length === 0) {
      const emptyText = this.scene.add.text(0, 0, 'Inventario vacío', {
        fontSize: '14px',
        color: '#bdc3c7',
        align: 'center'
      });
      emptyText.setOrigin(0.5);
      this.inventoryPanel.add(emptyText);
      return;
    }

    // Mostrar items del inventario
    inventory.forEach((item, index) => {
      const y = -120 + (index * 40);
      
      // Crear sprite de comida (si está cargado)
      let foodSprite: Phaser.GameObjects.Image | null = null;
      if (this.scene.textures.exists(item.food.id)) {
        foodSprite = this.scene.add.image(-120, y, item.food.id);
        foodSprite.setScale(0.3);
        this.inventoryPanel.add(foodSprite);
      }

      // Texto con información
      const itemText = this.scene.add.text(-90, y, 
        `${item.food.name} x${item.quantity}`, {
        fontSize: '12px',
        color: '#ecf0f1'
      });
      itemText.setOrigin(0, 0.5);
      
      // Mostrar efectos
      const effectsText = this.scene.add.text(-90, y + 15,
        `+${item.food.hungerRestore} hambre`, {
        fontSize: '10px',
        color: '#2ecc71'
      });
      effectsText.setOrigin(0, 0.5);

      this.inventoryPanel.add([itemText, effectsText]);
    });
  }

  /**
   * Actualiza la visualización de la tienda
   */
  private updateStoreDisplay(foods: FoodItem[]): void {
    // Limpiar items existentes
    const itemsToRemove = this.storePanel.list.slice(2);
    itemsToRemove.forEach(item => {
      this.storePanel.remove(item);
      (item as Phaser.GameObjects.GameObject).destroy();
    });

    // Mostrar comidas disponibles
    foods.forEach((food, index) => {
      const y = -150 + (index * 60);
      
      // Sprite de comida
      let foodSprite: Phaser.GameObjects.Image | null = null;
      if (this.scene.textures.exists(food.id)) {
        foodSprite = this.scene.add.image(-150, y, food.id);
        foodSprite.setScale(0.4);
        this.storePanel.add(foodSprite);
      }

      // Nombre y precio
      const nameText = this.scene.add.text(-110, y - 15, food.name, {
        fontSize: '14px',
        color: '#ecf0f1'
      });
      nameText.setOrigin(0, 0.5);

      const priceText = this.scene.add.text(-110, y + 5, `$${food.price}`, {
        fontSize: '12px',
        color: '#f1c40f'
      });
      priceText.setOrigin(0, 0.5);

      // Efectos
      const effectsText = this.scene.add.text(-110, y + 20,
        `+${food.hungerRestore} hambre, +${food.happinessBonus} felicidad`, {
        fontSize: '10px',
        color: '#95a5a6'
      });
      effectsText.setOrigin(0, 0.5);

      // Botón para comprar
      const buyButton = this.scene.add.rectangle(120, y, 80, 30, 0x27ae60);
      const buyText = this.scene.add.text(120, y, 'Comprar', {
        fontSize: '12px',
        color: '#ffffff'
      });
      buyText.setOrigin(0.5);

      buyButton.setInteractive();
      buyButton.on('pointerdown', () => {
        this.buyFood(food.id);
      });

      buyButton.on('pointerover', () => {
        buyButton.setFillStyle(0x2ecc71);
      });

      buyButton.on('pointerout', () => {
        buyButton.setFillStyle(0x27ae60);
      });

      this.storePanel.add([nameText, priceText, effectsText, buyButton, buyText]);
    });
  }

  /**
   * Maneja la compra de comida
   */
  private buyFood(foodId: string): void {
    // Emitir evento para que MainScene maneje la compra
    this.scene.events.emit('buyFood', { foodId, quantity: 1 });
    
    logAutopoiesis.info('Solicitud de compra de comida', { foodId });
  }

  /**
   * Oculta la UI
   */
  hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  /**
   * Muestra indicador de que se está comiendo
   */
  showEatingIndicator(entityId: string, _foodId: string, duration: number): void {
    const indicator = this.scene.add.text(100, 100, 
      `${entityId} está comiendo...`, {
      fontSize: '16px',
      color: '#2ecc71',
      backgroundColor: '#2c3e50',
      padding: { x: 10, y: 5 }
    });

    // Animar el indicador
    this.scene.tweens.add({
      targets: indicator,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Remover después de la duración
    this.scene.time.delayedCall(duration, () => {
      indicator.destroy();
    });
  }

  /**
   * Limpia la UI
   */
  cleanup(): void {
    this.container.destroy();
  }
}