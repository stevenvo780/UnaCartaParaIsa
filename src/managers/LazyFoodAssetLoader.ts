/**
 * Carga lazy de assets de comida para optimizar rendimiento
 * Solo carga los assets cuando son necesarios
 */

import type Phaser from "phaser";
import { logAutopoiesis } from "../utils/logger";

export class LazyFoodAssetLoader {
    private scene: Phaser.Scene;
    private loadedAssets = new Set<string>();
    private loadingPromises = new Map<string, Promise<void>>();
    private loadQueue: string[] = [];
    private isProcessingQueue = false;

    // Cache de assets que se cargan frecuentemente
    private preloadQueue = [
        "assets/consumable_items/food/05_apple_pie.png",
        "assets/consumable_items/food/88_salmon.png",
        "assets/consumable_items/food/40_eggsalad.png",
        "assets/consumable_items/food/52_burger.png",
        "assets/consumable_items/food/79_pizza.png",
    ];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.preloadEssentialAssets();
    }

    /**
   * Precarga assets esenciales en background
   */
    private async preloadEssentialAssets(): Promise<void> {
        logAutopoiesis.info("🍎 Precargando assets esenciales de comida...");

        for (const assetPath of this.preloadQueue) {
            this.queueAssetLoad(assetPath);
        }

        this.processLoadQueue();
    }

    /**
   * Carga un asset de forma asíncrona
   */
    public async loadFoodAsset(assetPath: string): Promise<boolean> {
        if (this.loadedAssets.has(assetPath)) {
            return true;
        }

        if (this.loadingPromises.has(assetPath)) {
            await this.loadingPromises.get(assetPath);
            return this.loadedAssets.has(assetPath);
        }

        const loadPromise = this.performAssetLoad(assetPath);
        this.loadingPromises.set(assetPath, loadPromise);

        try {
            await loadPromise;
            return true;
        } catch (error) {
            logAutopoiesis.warn(`Failed to load food asset: ${assetPath}`, error);
            return false;
        } finally {
            this.loadingPromises.delete(assetPath);
        }
    }

    /**
   * Añade asset a la cola de carga
   */
    private queueAssetLoad(assetPath: string): void {
        if (
            !this.loadedAssets.has(assetPath) &&
      !this.loadQueue.includes(assetPath)
        ) {
            this.loadQueue.push(assetPath);
        }
    }

    /**
   * Procesa la cola de carga en background
   */
    private async processLoadQueue(): Promise<void> {
        if (this.isProcessingQueue || this.loadQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.loadQueue.length > 0) {
            const assetPath = this.loadQueue.shift()!;

            if (!this.loadedAssets.has(assetPath)) {
                try {
                    await this.performAssetLoad(assetPath);
                    // Pequeña pausa para no bloquear el hilo principal
                    await new Promise((resolve) => setTimeout(resolve, 10));
                } catch (error) {
                    logAutopoiesis.warn(`Background load failed: ${assetPath}`, error);
                }
            }
        }

        this.isProcessingQueue = false;
    }

    /**
   * Realiza la carga real del asset
   */
    private async performAssetLoad(assetPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const assetKey = this.getAssetKeyFromPath(assetPath);

            // Verificar si ya está cargado en Phaser
            if (this.scene.textures.exists(assetKey)) {
                this.loadedAssets.add(assetPath);
                resolve();
                return;
            }

            // Verificar si el archivo existe
            this.checkAssetExists(assetPath).then((exists) => {
                if (!exists) {
                    logAutopoiesis.debug(`Asset not found: ${assetPath}`);
                    reject(new Error(`Asset not found: ${assetPath}`));
                    return;
                }

                // Cargar el asset
                this.scene.load.image(assetKey, assetPath);

                this.scene.load.once("filecomplete-image-" + assetKey, () => {
                    this.loadedAssets.add(assetPath);
                    logAutopoiesis.debug(`✅ Loaded food asset: ${assetKey}`);
                    resolve();
                });

                this.scene.load.once("loaderror", () => {
                    logAutopoiesis.warn(`❌ Failed to load: ${assetPath}`);
                    reject(new Error(`Failed to load: ${assetPath}`));
                });

                if (!this.scene.load.isLoading()) {
                    this.scene.load.start();
                }
            });
        });
    }

    /**
   * Verifica si un asset existe
   */
    private async checkAssetExists(assetPath: string): Promise<boolean> {
        try {
            const response = await fetch(assetPath, { method: "HEAD" });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
   * Convierte la ruta del asset en clave de Phaser
   */
    private getAssetKeyFromPath(assetPath: string): string {
        return assetPath
            .replace("assets/consumable_items/food/", "")
            .replace(".png", "")
            .replace(/[^a-zA-Z0-9_]/g, "_");
    }

    /**
   * Obtiene la clave del asset para uso en Phaser
   */
    public getAssetKey(assetPath: string): string {
        return this.getAssetKeyFromPath(assetPath);
    }

    /**
   * Verifica si un asset está cargado
   */
    public isAssetLoaded(assetPath: string): boolean {
        return this.loadedAssets.has(assetPath);
    }

    /**
   * Precarga una lista de assets de comida
   */
    public preloadFoodAssets(assetPaths: string[]): void {
        assetPaths.forEach((path) => this.queueAssetLoad(path));
        this.processLoadQueue();
    }

    /**
   * Obtiene estadísticas de carga
   */
    public getLoadStats(): {
    loaded: number;
    loading: number;
    queued: number;
    } {
        return {
            loaded: this.loadedAssets.size,
            loading: this.loadingPromises.size,
            queued: this.loadQueue.length,
        };
    }

    /**
   * Limpieza
   */
    public destroy(): void {
        this.loadQueue.length = 0;
        this.loadingPromises.clear();
        this.isProcessingQueue = false;

        logAutopoiesis.info(
            "🧹 LazyFoodAssetLoader destroyed",
            this.getLoadStats(),
        );
    }
}
