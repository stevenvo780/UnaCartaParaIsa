/**
 * Manager para cargar assets de comida
 * Maneja la carga lazy de sprites de comida según se necesiten
 */

import type Phaser from "phaser";
import { FoodCatalog } from "../data/FoodCatalog";
import { logAutopoiesis } from "../utils/logger";

export class FoodAssetManager {
  private scene: Phaser.Scene;
  private loadedAssets = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Carga assets básicos de comida (los más comunes)
   */
  async loadEssentialFoodAssets(): Promise<void> {
    const essentialFoods = [
      "bread",
      "burger",
      "apple_pie",
      "icecream",
      "sandwich",
      "pizza",
    ];

    logAutopoiesis.info("Cargando assets esenciales de comida", {
      count: essentialFoods.length,
    });

    const loadPromises = essentialFoods.map((foodId) =>
      this.loadFoodAsset(foodId),
    );
    await Promise.all(loadPromises);

    // Cargar assets adicionales para el sistema de comida
    await this.loadFoodSystemAssets();

    logAutopoiesis.info("Assets esenciales de comida cargados");
  }

  /**
   * Carga un asset específico de comida
   */
  async loadFoodAsset(foodId: string): Promise<void> {
    // Si ya está cargado, no hacer nada
    if (this.loadedAssets.has(foodId)) {
      return;
    }

    // Si ya se está cargando, esperar a que termine
    if (this.loadingPromises.has(foodId)) {
      return this.loadingPromises.get(foodId);
    }

    const food = FoodCatalog.getFoodById(foodId);
    if (!food) {
      logAutopoiesis.warn("Intento de cargar comida inexistente", { foodId });
      return;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      // Usar el scene's load para cargar la imagen
      this.scene.load.image(foodId, food.sprite);

      this.scene.load.once(`filecomplete-image-${foodId}`, () => {
        this.loadedAssets.add(foodId);
        this.loadingPromises.delete(foodId);
        logAutopoiesis.debug("Asset de comida cargado", {
          foodId,
          sprite: food.sprite,
        });
        resolve();
      });

      this.scene.load.once("loaderror", (file: any) => {
        if (file.key === foodId) {
          logAutopoiesis.error("Error cargando asset de comida", {
            foodId,
            sprite: food.sprite,
            error: file.error,
          });
          this.loadingPromises.delete(foodId);
          reject(new Error(`Failed to load food asset: ${foodId}`));
        }
      });

      this.scene.load.start();
    });

    this.loadingPromises.set(foodId, loadPromise);
    return loadPromise;
  }

  /**
   * Carga múltiples assets de comida
   */
  async loadFoodAssets(foodIds: string[]): Promise<void> {
    const loadPromises = foodIds.map((foodId) => this.loadFoodAsset(foodId));
    await Promise.all(loadPromises);
  }

  /**
   * Carga todos los assets de una categoría
   */
  async loadFoodCategory(category: string): Promise<void> {
    const categoryFoods = FoodCatalog.getFoodsByCategory(category as any);
    const foodIds = categoryFoods.map((food) => food.id);

    logAutopoiesis.info("Cargando categoría de comida", {
      category,
      count: foodIds.length,
    });
    await this.loadFoodAssets(foodIds);
  }

  /**
   * Carga assets adicionales del sistema de comida
   */
  private async loadFoodSystemAssets(): Promise<void> {
    return new Promise<void>((resolve, _reject) => {
      // Cargar sprites del sistema de comida
      const systemAssets = [
        { key: "food_store", path: "assets/props/Crate_Medium_Closed.png" },
      ];

      let assetsLoaded = 0;
      const totalAssets = systemAssets.length;

      if (totalAssets === 0) {
        resolve();
        return;
      }

      systemAssets.forEach((asset) => {
        // Solo cargar si no existe ya
        if (!this.scene.textures.exists(asset.key)) {
          this.scene.load.image(asset.key, asset.path);
        } else {
          assetsLoaded++;
          if (assetsLoaded === totalAssets) {
            resolve();
          }
        }
      });

      this.scene.load.on("filecomplete", (key: string) => {
        if (systemAssets.some((asset) => asset.key === key)) {
          assetsLoaded++;
          if (assetsLoaded === totalAssets) {
            resolve();
          }
        }
      });

      this.scene.load.start();
    });
  }

  /**
   * Verifica si un asset de comida está cargado
   */
  isFoodAssetLoaded(foodId: string): boolean {
    return this.loadedAssets.has(foodId) && this.scene.textures.exists(foodId);
  }

  /**
   * Obtiene estadísticas de assets cargados
   */
  getLoadedAssetsStats(): {
    total: number;
    loaded: number;
    percentage: number;
    loadedAssets: string[];
  } {
    const allFoods = FoodCatalog.getAllFoods();
    const totalAssets = allFoods.length;
    const loadedCount = this.loadedAssets.size;

    return {
      total: totalAssets,
      loaded: loadedCount,
      percentage: totalAssets > 0 ? (loadedCount / totalAssets) * 100 : 0,
      loadedAssets: Array.from(this.loadedAssets),
    };
  }

  /**
   * Precarga assets de comida basado en patrones de uso
   */
  async preloadFrequentFoods(): Promise<void> {
    // Comidas que se usan frecuentemente
    const frequentFoods = [
      "bread",
      "burger",
      "pizza",
      "sandwich",
      "icecream",
      "apple_pie",
      "cookies",
      "hotdog",
      "salmon",
    ];

    logAutopoiesis.info("Precargando comidas frecuentes", {
      count: frequentFoods.length,
    });
    await this.loadFoodAssets(frequentFoods);
  }

  /**
   * Limpia assets no utilizados (para optimización de memoria)
   */
  cleanupUnusedAssets(keepEssentials = true): number {
    let cleanedCount = 0;
    const essentialFoods = ["bread", "burger", "apple_pie"];

    this.loadedAssets.forEach((foodId) => {
      if (keepEssentials && essentialFoods.includes(foodId)) {
        return; // No limpiar assets esenciales
      }

      if (this.scene.textures.exists(foodId)) {
        this.scene.textures.remove(foodId);
        this.loadedAssets.delete(foodId);
        cleanedCount++;
      }
    });

    logAutopoiesis.info("Assets de comida limpiados", {
      cleaned: cleanedCount,
      remaining: this.loadedAssets.size,
    });

    return cleanedCount;
  }

  /**
   * Obtiene el progreso de carga de assets
   */
  getLoadingProgress(): {
    isLoading: boolean;
    activeLoads: number;
    totalProgress: number;
  } {
    const activeLoads = this.loadingPromises.size;
    const loadProgress = this.scene.load.progress;

    return {
      isLoading: activeLoads > 0 || this.scene.load.isLoading(),
      activeLoads,
      totalProgress: loadProgress * 100,
    };
  }
}
