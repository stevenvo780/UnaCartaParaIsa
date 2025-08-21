import Phaser from "phaser";
import { AnimationManager } from "../managers/AnimationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { WaterRipplePipeline } from "../plugins/WaterRipplePipeline";
import { logAutopoiesis } from "../utils/logger";
export class BootScene extends Phaser.Scene {
  private unifiedAssetManager!: UnifiedAssetManager;
  private animationManager!: AnimationManager;

  constructor() {
    super({ key: "BootScene" });
  }

  async preload() {
    this.unifiedAssetManager = new UnifiedAssetManager(this);
    this.animationManager = new AnimationManager(this);

    try {
      const renderer = this.game
        .renderer as Phaser.Renderer.WebGL.WebGLRenderer;
      const pm = renderer.pipelines;
      if (!pm.has("WaterRipple")) {
        pm.add("WaterRipple", new WaterRipplePipeline(this.game));
      }
      this.registry.set("waterPipelineKey", "WaterRipple");
    } catch (e: unknown) {
      logAutopoiesis.warn("No se pudo registrar WaterRipplePipeline", {
        error: String(e),
      });
    }

    this.hideLoadingScreen();

    try {
      logAutopoiesis.info("🚀 BootScene básico para debug - sin carga de assets");
      
      // Comentar toda la carga de assets para debug
      /*
      await this.unifiedAssetManager.loadCriticalAssets();
      
      logAutopoiesis.info("⚠️ Animaciones y assets complejos temporalmente deshabilitados para debug");
      const assetResult = await this.unifiedAssetManager.loadAllAssets();
      if (!assetResult.success) {
        logAutopoiesis.warn("Algunos assets fallaron, usando fallbacks", {
          failed: assetResult.failedAssets.length,
          fallbacks: assetResult.fallbacksUsed.length,
        });
      }
      this.animationManager.createAllAnimations();
      await this.unifiedAssetManager.loadEssentialFoodAssets();
      */

      this.registry.set("animationManager", this.animationManager);
      this.registry.set("unifiedAssetManager", this.unifiedAssetManager);

      const stats = this.unifiedAssetManager.getLoadingStats();

      logAutopoiesis.info("Boot unificado completado", {
        loadedAssets: stats.loadedAssets,
        totalAssets: stats.totalAssets,
        loadProgress: `${stats.loadProgress.toFixed(1)}%`,
        pendingAssets: stats.pendingAssets,
      });

      this.scene.start("MainScene");
      this.scene.launch("UIScene");
      this.startBackgroundLoading();
    } catch (error: unknown) {
      logAutopoiesis.error("Error crítico en BootScene unificado", {
        error: String(error),
      });

      this.showCriticalError(error);
    }
  }

  private startBackgroundLoading(): void {
    setTimeout(async () => {
      try {
        logAutopoiesis.info("🔄 Iniciando carga de biomas en background...");
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
    }, 1000);
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

  private hideLoadingScreen(): void {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.classList.add("fade-out");
      setTimeout(() => {
        (loadingElement as HTMLElement).style.display = "none";
      }, 500);
    }
  }

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
