/**
 * Sistema de inventario de comida
 * Maneja la compra, almacenamiento y deterioro de alimentos
 */

import type { FoodItem, FoodInventoryItem } from "../types/food";
import { FoodCatalog } from "../data/FoodCatalog";
import { logAutopoiesis } from "../utils/logger";
import { GAME_BALANCE } from "../config/gameConfig";

export class FoodInventorySystem {
    private inventory = new Map<string, FoodInventoryItem>();
    private maxCapacity = GAME_BALANCE.FOOD.MAX_INVENTORY_CAPACITY;

    /**
   * Añade comida al inventario
   */
    addFood(foodId: string, quantity = 1): boolean {
        const food = FoodCatalog.getFoodById(foodId);
        if (!food) {
            logAutopoiesis.warn("Intento de añadir comida inexistente", { foodId });
            return false;
        }

        // Verificar capacidad
        const totalItems = Array.from(this.inventory.values()).reduce(
            (sum, item) => sum + item.quantity,
            0,
        );

        if (totalItems + quantity > this.maxCapacity) {
            logAutopoiesis.warn("Inventario lleno", {
                current: totalItems,
                adding: quantity,
                capacity: this.maxCapacity,
            });
            return false;
        }

        const existingItem = this.inventory.get(foodId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.inventory.set(foodId, {
                food,
                quantity,
                acquiredAt: Date.now(),
            });
        }

        logAutopoiesis.info("Comida añadida al inventario", {
            foodId,
            quantity,
            total: this.inventory.get(foodId)?.quantity,
        });

        return true;
    }

    /**
   * Consume una unidad de comida
   */
    consumeFood(foodId: string): FoodItem | null {
        const item = this.inventory.get(foodId);
        if (!item || item.quantity <= 0) {
            return null;
        }

        item.quantity--;
        if (item.quantity === 0) {
            this.inventory.delete(foodId);
        }

        logAutopoiesis.info("Comida consumida", {
            foodId,
            remaining: item.quantity,
        });

        return item.food;
    }

    /**
   * Obtiene el inventario completo
   */
    getInventory(): FoodInventoryItem[] {
        return Array.from(this.inventory.values()).filter(
            (item) => item.quantity > 0,
        );
    }

    /**
   * Verifica si tiene una comida específica
   */
    hasFood(foodId: string): boolean {
        const item = this.inventory.get(foodId);
        return item ? item.quantity > 0 : false;
    }

    /**
   * Obtiene la cantidad de una comida específica
   */
    getFoodQuantity(foodId: string): number {
        const item = this.inventory.get(foodId);
        return item ? item.quantity : 0;
    }

    /**
   * Limpia comida echada a perder
   */
    cleanupSpoiledFood(): number {
        const currentTime = Date.now();
        let cleanedCount = 0;

        for (const [foodId, item] of this.inventory.entries()) {
            if (item.food.spoilTime) {
                const timeElapsed = currentTime - item.acquiredAt;
                if (timeElapsed > item.food.spoilTime) {
                    cleanedCount += item.quantity;
                    this.inventory.delete(foodId);

                    logAutopoiesis.info("Comida echada a perder removida", {
                        foodId,
                        quantity: item.quantity,
                        spoilTime: item.food.spoilTime,
                        timeElapsed,
                    });
                }
            }
        }

        if (cleanedCount > 0) {
            logAutopoiesis.info("Limpieza de comida completada", { cleanedCount });
        }

        return cleanedCount;
    }

    /**
   * Obtiene comidas próximas a echarse a perder
   */
    getFoodsNearExpiry(
        warningThreshold = GAME_BALANCE.FOOD.EXPIRY_WARNING_THRESHOLD,
    ): FoodInventoryItem[] {
        const currentTime = Date.now();
        const nearExpiry: FoodInventoryItem[] = [];

        for (const item of this.inventory.values()) {
            if (item.food.spoilTime) {
                const timeElapsed = currentTime - item.acquiredAt;
                const timeRatio = timeElapsed / item.food.spoilTime;

                if (timeRatio >= warningThreshold && timeRatio < 1) {
                    nearExpiry.push(item);
                }
            }
        }

        return nearExpiry;
    }

    /**
   * Obtiene el espacio libre en el inventario
   */
    getFreeSpace(): number {
        const usedSpace = Array.from(this.inventory.values()).reduce(
            (sum, item) => sum + item.quantity,
            0,
        );
        return this.maxCapacity - usedSpace;
    }

    /**
   * Obtiene estadísticas del inventario
   */
    getInventoryStats() {
        const items = this.getInventory();
        const totalValue = items.reduce(
            (sum, item) => sum + item.food.price * item.quantity,
            0,
        );
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const nearExpiry = this.getFoodsNearExpiry().length;

        return {
            totalItems,
            totalValue,
            freeSpace: this.getFreeSpace(),
            capacity: this.maxCapacity,
            nearExpiry,
            categories: {
                healthy: items.filter((item) => item.food.category === "healthy")
                    .length,
                junk: items.filter((item) => item.food.category === "junk").length,
                dessert: items.filter((item) => item.food.category === "dessert")
                    .length,
                snack: items.filter((item) => item.food.category === "snack").length,
            },
        };
    }

    /**
   * Limpia todo el inventario
   */
    clearInventory(): void {
        this.inventory.clear();
        logAutopoiesis.info("Inventario de comida limpiado");
    }
}
