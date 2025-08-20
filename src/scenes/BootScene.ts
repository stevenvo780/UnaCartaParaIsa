import Phaser from "phaser";
import { AnimationManager } from "../managers/AnimationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { logAutopoiesis } from "../utils/logger";

/*
 * Documentación científica (resumen):
 * - Sistema unificado de assets con lazy loading integrado
 * - Carga validada con fallbacks programáticos para estabilidad
 * - Spritesheets + creación de animaciones tras la fase de carga
 * - Flujo: validar → cargar críticos → cargar todo → crear animaciones → cambiar escena
 */
export class BootScene extends Phaser.Scene {
  private unifiedAssetManager!: UnifiedAssetManager;
  private animationManager!: AnimationManager;

  constructor() {
    super({ key: "BootScene" });
  }

  async preload() {
    // Inicializar manager unificado
    this.unifiedAssetManager = new UnifiedAssetManager(this);
    this.animationManager = new AnimationManager(this);

    // Ocultar pantalla de carga inicial
    this.hideLoadingScreen();

    try {
      logAutopoiesis.info("🚀 Iniciando carga unificada de assets...");

      // FASE 1: Cargar assets críticos para iniciar rápido
      await this.unifiedAssetManager.loadCriticalAssets();

      // FASE 2: Cargar todos los assets base
      const assetResult = await this.unifiedAssetManager.loadAllAssets();
      if (!assetResult.success) {
        logAutopoiesis.warn("Algunos assets fallaron, usando fallbacks", {
          failed: assetResult.failedAssets.length,
          fallbacks: assetResult.fallbacksUsed.length,
        });
      }

      // FASE 3: Crear animaciones básicas
      this.animationManager.createAllAnimations();

      // FASE 4: Cargar assets esenciales de comida
      await this.unifiedAssetManager.loadEssentialFoodAssets();

      // Guardar managers globalmente
      this.registry.set("animationManager", this.animationManager);
      this.registry.set("unifiedAssetManager", this.unifiedAssetManager);

      // Obtener stats de carga inicial
      const stats = this.unifiedAssetManager.getLoadingStats();

      logAutopoiesis.info("Boot unificado completado", {
        loadedAssets: stats.loadedAssets,
        totalAssets: stats.totalAssets,
        loadProgress: `${stats.loadProgress.toFixed(1)}%`,
        pendingAssets: stats.pendingAssets,
      });

      // Cambiar a escenas principales inmediatamente
      this.scene.start("MainScene");
      this.scene.launch("UIScene");

      // FASE 5: Cargar assets adicionales en background
      this.startBackgroundLoading();
    } catch (error: any) {
      logAutopoiesis.error("Error crítico en BootScene unificado", {
        error: error?.toString?.() || String(error),
      });

      this.showCriticalError(error);
    }
  }

  /**
   * Cargar assets adicionales en background sin bloquear el juego
   */
  private startBackgroundLoading(): void {
    // Cargar assets por biomas en background
    setTimeout(async () => {
      try {
        logAutopoiesis.info("🔄 Iniciando carga de biomas en background...");

        // Cargar assets de biomas específicos
        await this.unifiedAssetManager.loadBiomeAssets("forest");
        await this.unifiedAssetManager.loadBiomeAssets("village");

        const finalStats = this.unifiedAssetManager.getLoadingStats();
        logAutopoiesis.info("✅ Carga completa finalizada", {
          totalLoaded: finalStats.loadedAssets,
          loadProgress: `${finalStats.loadProgress.toFixed(1)}%`,
        });
      } catch (error) {
        logAutopoiesis.warn("Error en carga background", {
          error: String(error),
        });
      }
    }, 1000); // Empezar carga background después de 1 segundo
  }

  create() {
    // Evento global de boot completo
    this.events.emit("bootComplete");

    if (this.animationManager) {
      logAutopoiesis.info("Sistema de animaciones listo", {
        categories: {
          entities: 0,
          environment: 0,
          ui: 0,
          animals: 0,
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
  private showCriticalError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
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
      assets: this.unifiedAssetManager?.getLoadingStats() || {
        totalAssets: 0,
        loadedAssets: 0,
        loadingAssets: 0,
        pendingAssets: 0,
        loadProgress: 0,
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
