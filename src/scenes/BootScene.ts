import Phaser from "phaser";
import { AnimationManager } from "../managers/AnimationManager";
import { AssetLazyLoader } from "../managers/AssetLazyLoader";
import { AssetManager } from "../managers/AssetManager";
import { FoodAssetManager } from "../managers/FoodAssetManager";
import { logAutopoiesis } from "../utils/logger";

/*
 * Documentación científica (resumen):
 * - Carga validada con fallbacks programáticos para estabilidad.
 * - Spritesheets + creación de animaciones tras la fase de carga.
 * - Flujo: validar → preparar spritesheets → cargar → crear animaciones → cambiar de escena.
 */
export class BootScene extends Phaser.Scene {
  private assetManager!: AssetManager;
  private animationManager!: AnimationManager;
  private lazyLoader!: AssetLazyLoader;
  private foodAssetManager!: FoodAssetManager;

  constructor() {
    super({ key: "BootScene" });
  }

  async preload() {
    // Inicializar managers optimizados
    this.lazyLoader = new AssetLazyLoader(this);
    this.assetManager = new AssetManager(this);
    this.animationManager = new AnimationManager(this);
    this.foodAssetManager = new FoodAssetManager(this);

    // Ocultar pantalla de carga inicial
    this.hideLoadingScreen();

    try {
      logAutopoiesis.info("🚀 Iniciando carga optimizada de assets...");

      // FASE 1: Cargar solo assets críticos para iniciar rápido
      await this.lazyLoader.loadCriticalAssets();

      // FASE 2: Cargar todos los assets incluyendo los spritesheets
      const assetResult = await this.assetManager.loadAllAssets();
      if (!assetResult.success) {
        logAutopoiesis.warn("Algunos assets fallaron, usando fallbacks", {
          failed: assetResult.failedAssets.length,
          fallbacks: assetResult.fallbacksUsed.length,
        });
      }

      // FASE 3: Crear animaciones básicas después de que los assets estén cargados
      this.animationManager.createAllAnimations();

      // FASE 4: Cargar assets esenciales de comida
      await this.foodAssetManager.loadEssentialFoodAssets();

      // Guardar managers globalmente
      this.registry.set("animationManager", this.animationManager);
      this.registry.set("lazyLoader", this.lazyLoader);
      this.registry.set("foodAssetManager", this.foodAssetManager);

      // Obtener stats de carga inicial
      const lazyStats = this.lazyLoader.getLoadingStats();

      logAutopoiesis.info("Boot rápido completado", {
        criticalAssets: lazyStats.loadedAssets,
        totalAssets: lazyStats.totalAssets,
        loadProgress: `${lazyStats.loadProgress.toFixed(1)}%`,
        remainingAssets: lazyStats.pendingAssets,
      });

      // Cambiar a escenas principales inmediatamente
      this.scene.start("MainScene");
      this.scene.launch("UIScene");

      // FASE 4: Cargar assets restantes en background
      this.startBackgroundLoading();
    } catch (error: any) {
      logAutopoiesis.error("Error crítico en BootScene optimizado", {
        error: error?.toString?.() || String(error),
      });

      // Fallback: usar sistema tradicional
      await this.fallbackToTraditionalLoading();
    }
  }

  /**
   * Cargar assets restantes en background sin bloquear el juego
   */
  private startBackgroundLoading(): void {
    // Cargar por prioridades en background
    setTimeout(async () => {
      try {
        logAutopoiesis.info("🔄 Iniciando carga en background...");

        // Cargar prioridad media
        await this.lazyLoader.loadAssetsByPriority("medium");

        // Luego prioridad baja
        setTimeout(async () => {
          await this.lazyLoader.loadAssetsByPriority("low");

          const finalStats = this.lazyLoader.getLoadingStats();
          logAutopoiesis.info("✅ Carga completa finalizada", {
            totalLoaded: finalStats.loadedAssets,
            loadProgress: `${finalStats.loadProgress.toFixed(1)}%`,
          });
        }, 2000); // Esperar 2 segundos antes de cargar prioridad baja
      } catch (error) {
        logAutopoiesis.warn("Error en carga background", {
          error: String(error),
        });
      }
    }, 1000); // Empezar carga background después de 1 segundo
  }

  /**
   * Fallback al sistema tradicional si falla el lazy loading
   */
  private async fallbackToTraditionalLoading(): Promise<void> {
    logAutopoiesis.warn("🔄 Usando carga tradicional como fallback...");

    try {
      // Validar assets tradicionales
      const missingAssets = await this.assetManager.validateAssets();
      if (missingAssets.length > 0) {
        logAutopoiesis.warn(
          `Assets faltantes: ${missingAssets.length}, se usarán fallbacks`,
          {
            missingAssets,
          },
        );
      }

      // Cargar con sistema tradicional
      const loadResult = await this.assetManager.loadAllAssets();

      if (!loadResult.success) {
        logAutopoiesis.error("Fallo crítico en carga tradicional", {
          success: loadResult.success,
          failedAssets: loadResult.failedAssets?.length || 0,
          loadedAssets: loadResult.loadedAssets?.length || 0,
        });
        this.showAssetError(loadResult.failedAssets);
        return;
      }

      // Cargar spritesheets para animaciones DESPUÉS de la carga básica
      this.animationManager.loadAllSpriteSheets();

      // Iniciar la carga y esperar completion
      this.load.start();

      // Esperar a que se complete la carga de spritesheets
      if (this.load.isLoading()) {
        await new Promise<void>((resolve) => {
          this.load.once("complete", () => {
            logAutopoiesis.info("Spritesheets loaded successfully");
            resolve();
          });
        });
      }

      // Crear todas las animaciones DESPUÉS de cargar spritesheets
      this.animationManager.createAllAnimations();
      this.registry.set("animationManager", this.animationManager);

      // Iniciar juego
      this.scene.start("MainScene");
      this.scene.launch("UIScene");
    } catch (error) {
      logAutopoiesis.error("Fallo completo en carga de assets", {
        error: String(error),
      });
      this.showCriticalError(error);
    }
  }

  create() {
    // Evento global de boot completo
    this.events.emit("bootComplete");

    if (this.animationManager) {
      // const stats = this.animationManager.getStats();
      // const animations = this.animationManager.getAnimationsByCategory();
      logAutopoiesis.info("Sistema de animaciones listo", {
        // stats,
        categories: {
          entities: 0, // animations.entities.length,
          environment: 0, // animations.environment.length,
          ui: 0, // animations.ui.length,
          animals: 0, // animations.animals.length,
        },
      });
    }
  }

  // Ocultar pantalla de carga con efecto
  private hideLoadingScreen(): void {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.classList.add("fade-out");
      setTimeout(() => {
        loadingElement.style.display = "none";
      }, 500);
    }
  }

  // Mostrar error de carga no crítica
  private showAssetError(failedAssets: string[]): void {
    const lines = [
      "⚠️ Error cargando algunos recursos",
      `Falló la carga de: ${failedAssets.slice(0, 3).join(", ")}`,
      failedAssets.length > 3 ? `y ${failedAssets.length - 3} más...` : "",
      "",
      "Presiona cualquier tecla para continuar con fallbacks",
    ].filter(Boolean);

    const errorText = this.add
      .text(400, 300, lines.join("\n"), {
        fontSize: "16px",
        color: "#e74c3c",
        align: "center",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown", () => {
      errorText.destroy();
      this.scene.start("MainScene");
      this.scene.launch("UIScene");
    });
  }

  // Mostrar error crítico que impide iniciar
  private showCriticalError(error: any): void {
    const message = error?.message || String(error);
    this.add
      .text(
        400,
        300,
        [
          "💀 Error crítico en el juego",
          "No es posible iniciar el juego",
          "",
          `Error: ${message}`,
          "",
          "Recarga la página para intentar de nuevo",
        ].join("\n"),
        {
          fontSize: "14px",
          color: "#c0392b",
          align: "center",
          fontFamily: "Arial",
        },
      )
      .setOrigin(0.5);
  }

  // Estadísticas de boot
  public getBootStats() {
    return {
      assets: this.assetManager?.getLoadingStats() || {
        loaded: 0,
        failed: 0,
        fallbacks: 0,
      },
      animations: {
        loadedSpriteSheets: 0,
        createdAnimations: 0,
        totalConfigs: 0,
        successRate: 0,
      },
    };
  }
}
