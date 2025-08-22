/**
 * Sistema principal de comida
 * Maneja toda la mecánica de comer, comprar y efectos de la comida
 */

import Phaser from "phaser";
import { FoodCatalog } from "../data/FoodCatalog";
import { GAME_BALANCE } from "../config/gameConfig";
import type { EntityStats } from "../types";
import type { EatingAction, FoodItem } from "../types/food";
import { logAutopoiesis } from "../utils/logger";
import { FoodInventorySystem } from "./FoodInventorySystem";

export class FoodSystem {
  private scene: Phaser.Scene;
  private inventory: FoodInventorySystem;
  private activeEatingActions = new Map<string, EatingAction>();
  private foodStores: Phaser.GameObjects.Group;
  private foodItems: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.inventory = new FoodInventorySystem();
    this.foodStores = scene.add.group();
    this.foodItems = scene.add.group();

    this.setupPeriodicCleanup();
    logAutopoiesis.info("Sistema de comida inicializado");
  }

  /**
   * Inicia el proceso de comer para una entidad
   */
  startEating(
    entityId: string,
    foodId: string,
    position: { x: number; y: number },
  ): boolean {
    // Verificar si ya está comiendo
    if (this.activeEatingActions.has(entityId)) {
      logAutopoiesis.warn("La entidad ya está comiendo", { entityId });
      return false;
    }

    // Verificar si tiene la comida en el inventario
    if (!this.inventory.hasFood(foodId)) {
      logAutopoiesis.warn("No tiene la comida en el inventario", {
        entityId,
        foodId,
      });
      return false;
    }

    const food = this.inventory.consumeFood(foodId);
    if (!food) {
      return false;
    }

    const eatingAction: EatingAction = {
      entityId,
      foodId,
      startTime: Date.now(),
      duration: food.consumeTime,
      position,
    };

    this.activeEatingActions.set(entityId, eatingAction);

    // Crear visual de comida
    this.createFoodVisual(food, position);

    logAutopoiesis.info("Entidad empezó a comer", {
      entityId,
      foodId: food.id,
      duration: food.consumeTime,
    });

    return true;
  }

  /**
   * Verifica y completa acciones de comer
   */
  updateEatingActions(): { entityId: string; food: FoodItem }[] {
    const completedActions: { entityId: string; food: FoodItem }[] = [];
    const currentTime = Date.now();

    for (const [entityId, action] of this.activeEatingActions.entries()) {
      const elapsed = currentTime - action.startTime;

      if (elapsed >= action.duration) {
        const food = FoodCatalog.getFoodById(action.foodId);
        if (food) {
          completedActions.push({ entityId, food });
        }

        this.activeEatingActions.delete(entityId);

        logAutopoiesis.info("Comida completada", {
          entityId,
          foodId: action.foodId,
          duration: elapsed,
        });
      }
    }

    return completedActions;
  }

  /**
   * Aplica los efectos de la comida a las estadísticas de la entidad
   */
  applyFoodEffects(stats: EntityStats, food: FoodItem): EntityStats {
    const newStats = { ...stats };

    // Aplicar efectos de la comida
    newStats.hunger = Math.min(
      100,
      Math.max(0, newStats.hunger + food.hungerRestore),
    );
    newStats.happiness = Math.min(
      100,
      Math.max(0, newStats.happiness + food.happinessBonus),
    );
    newStats.energy = Math.min(
      100,
      Math.max(0, newStats.energy + food.energyEffect),
    );
    newStats.health = Math.min(
      100,
      Math.max(0, newStats.health + food.healthEffect),
    );

    // Efectos secundarios basados en categoría
    switch (food.category) {
      case "junk":
        // La comida chatarra puede aumentar el estrés a largo plazo
        if (newStats.stress !== undefined) {
          newStats.stress = Math.min(100, newStats.stress + 2);
        }
        break;

      case "healthy":
        // La comida saludable reduce el estrés
        if (newStats.stress !== undefined) {
          newStats.stress = Math.max(0, newStats.stress - 3);
        }
        break;

      case "dessert":
        // Los postres dan mucha felicidad pero pueden afectar la salud
        newStats.happiness = Math.min(100, newStats.happiness + 5);
        break;
    }

    logAutopoiesis.info("Efectos de comida aplicados", {
      foodId: food.id,
      category: food.category,
      effects: {
        hunger: `${stats.hunger} → ${newStats.hunger}`,
        happiness: `${stats.happiness} → ${newStats.happiness}`,
        energy: `${stats.energy} → ${newStats.energy}`,
        health: `${stats.health} → ${newStats.health}`,
      },
    });

    return newStats;
  }

  /**
   * Compra comida de una tienda
   */
  buyFood(
    foodId: string,
    quantity = 1,
    playerMoney: number,
  ): { success: boolean; cost: number; newMoney: number } {
    const food = FoodCatalog.getFoodById(foodId);
    if (!food) {
      return { success: false, cost: 0, newMoney: playerMoney };
    }

    const totalCost = food.price * quantity;

    if (playerMoney < totalCost) {
      logAutopoiesis.warn("No tiene suficiente dinero para comprar", {
        foodId,
        quantity,
        cost: totalCost,
        money: playerMoney,
      });
      return { success: false, cost: totalCost, newMoney: playerMoney };
    }

    const success = this.inventory.addFood(foodId, quantity);
    if (!success) {
      return { success: false, cost: totalCost, newMoney: playerMoney };
    }

    const newMoney = playerMoney - totalCost;

    logAutopoiesis.info("Comida comprada exitosamente", {
      foodId: food.id,
      quantity,
      cost: totalCost,
      remainingMoney: newMoney,
    });

    return { success: true, cost: totalCost, newMoney };
  }

  /**
   * Crea una tienda de comida en una posición
   */
  createFoodStore(
    x: number,
    y: number,
    availableFoods: string[] = [],
  ): Phaser.GameObjects.Sprite {
    const store = this.scene.add.sprite(x, y, "food_store");
    store.setScale(0.8);
    store.setInteractive();

    // Si no se especifican comidas, usar algunas por defecto
    if (availableFoods.length === 0) {
      availableFoods = ["bread", "burger", "apple_pie", "icecream", "sandwich"];
    }

    // Guardar las comidas disponibles en el sprite
    (store as any).availableFoods = availableFoods;

    store.on("pointerdown", () => {
      this.openFoodStore(availableFoods);
    });

    this.foodStores.add(store);

    logAutopoiesis.info("Tienda de comida creada", {
      position: { x, y },
      availableFoods,
    });

    return store;
  }

  /**
   * Abre la interfaz de la tienda de comida
   */
  private openFoodStore(availableFoods: string[]): void {
    // Emitir evento para que la UI maneje la tienda
    this.scene.events.emit("openFoodStore", {
      foods: availableFoods
        .map((id) => FoodCatalog.getFoodById(id))
        .filter(Boolean),
      inventory: this.inventory.getInventory(),
      stats: this.inventory.getInventoryStats(),
    });
  }

  /**
   * Crea efectos visuales al comer
   */
  private createFoodVisual(
    food: FoodItem,
    position: { x: number; y: number },
  ): void {
    // Crear sprite temporal de la comida
    const foodSprite = this.scene.add.image(
      position.x,
      position.y - 30,
      food.id,
    );
    foodSprite.setScale(0.5);
    foodSprite.setAlpha(0.8);

    // Animar la comida desapareciendo
    this.scene.tweens.add({
      targets: foodSprite,
      y: position.y - 50,
      alpha: 0,
      scale: 0.2,
      duration: food.consumeTime,
      ease: "Power2",
      onComplete: () => {
        foodSprite.destroy();
      },
    });

    // Crear efecto visual simple de consumo (círculos que se desvanecen)
    const effectColor =
      food.category === "healthy"
        ? 0x00ff00
        : food.category === "dessert"
          ? 0xff69b4
          : 0xffd700;

    // Crear múltiples círculos como efecto visual
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const circle = this.scene.add.circle(
          position.x + Phaser.Math.Between(-10, 10),
          position.y - 20 + Phaser.Math.Between(-10, 10),
          3,
          effectColor,
          0.8,
        );

        // Animar el círculo
        this.scene.tweens.add({
          targets: circle,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          y: circle.y - 20,
          duration: 800,
          ease: "Power2",
          onComplete: () => {
            circle.destroy();
          },
        });
      });
    }
  }

  /**
   * Verifica si una entidad está comiendo
   */
  isEntityEating(entityId: string): boolean {
    return this.activeEatingActions.has(entityId);
  }

  /**
   * Obtiene la acción de comer activa de una entidad
   */
  getEatingAction(entityId: string): EatingAction | null {
    return this.activeEatingActions.get(entityId) || null;
  }

  /**
   * Cancela la acción de comer de una entidad
   */
  cancelEating(entityId: string): boolean {
    if (!this.activeEatingActions.has(entityId)) {
      return false;
    }

    this.activeEatingActions.delete(entityId);
    logAutopoiesis.info("Acción de comer cancelada", { entityId });
    return true;
  }

  /**
   * Obtiene el inventario de comida
   */
  getInventory(): FoodInventorySystem {
    return this.inventory;
  }

  /**
   * Configura limpieza periódica de comida echada a perder
   */
  private setupPeriodicCleanup(): void {
    // Limpiar comida echada a perder cada 30 segundos
    this.scene.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        this.inventory.cleanupSpoiledFood();
      },
    });
  }

  /**
   * Obtiene comida recomendada para una entidad
   */
  getRecommendedFood(stats: EntityStats): FoodItem[] {
    return FoodCatalog.getRecommendedFood(
      stats.hunger || 50,
      stats.happiness || 50,
      stats.money || 0,
    );
  }

  /**
   * Limpia recursos del sistema
   */
  cleanup(): void {
    this.activeEatingActions.clear();
    this.foodStores.clear(true, true);
    this.foodItems.clear(true, true);
    logAutopoiesis.info("Sistema de comida limpiado");
  }
}
