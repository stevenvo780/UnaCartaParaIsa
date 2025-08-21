import Phaser from "phaser";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { WaterRipplePipeline } from "../plugins/WaterRipplePipeline";
import { logAutopoiesis } from "../utils/logger";

export default class BootScene extends Phaser.Scene {
  private unifiedAssetManager!: UnifiedAssetManager;

  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    logAutopoiesis.info("🚀 BootScene iniciando carga completa de assets...");

    // Crear progress bar de carga
    this.createLoadingBar();

    // Registrar pipelines WebGL
    this.registerCustomPipelines();

    // Cargar assets esenciales para el juego de forma sincrónica
    this.loadEssentialAssetsSync();

    this.hideLoadingScreen();
    logAutopoiesis.info("✅ BootScene carga completada");
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo de carga
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 60);

    // Barra de progreso
    const progressBar = this.add.graphics();

    // Texto de carga
    const loadingText = this.add.text(
      width / 2,
      height / 2 - 50,
      "Cargando...",
      {
        fontSize: "20px",
        color: "#ffffff",
      },
    );
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, "0%", {
      fontSize: "18px",
      color: "#ffffff",
    });
    percentText.setOrigin(0.5, 0.5);

    // Eventos de carga
    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x6c5ce7, 1);
      progressBar.fillRect(
        width / 4 + 10,
        height / 2 - 20,
        (width / 2 - 20) * value,
        40,
      );
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadEssentialAssetsSync(): void {
    // Cargar placeholder/basic assets para desarrollo
    this.loadPlaceholderAssets();

    // Crear UnifiedAssetManager (sin await)
    this.unifiedAssetManager = new UnifiedAssetManager(this);
    
    // Los assets críticos se cargarán en create() 
    logAutopoiesis.info("📦 Preparando carga de assets esenciales");
  }

  private loadPlaceholderAssets(): void {
    // Crear texturas básicas procedurales para desarrollo
    this.load.image(
      "placeholder-terrain",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    );
    
    // Crear sprites temporales para entidades
    this.createTemporaryEntitySprites();
    this.load.image(
      "placeholder-ui",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    );

    // Crear sprites básicos en memoria
    this.load.on("complete", () => {
      this.createBasicSprites();
    });
  }

  private createBasicSprites(): void {
    const graphics = this.add.graphics();

    // Crear sprite de terreno básico
    graphics.fillStyle(0x4a7c4a);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("terrain-grass", 32, 32);

    // Crear sprite de personaje básico
    graphics.clear();
    graphics.fillStyle(0xff6b6b);
    graphics.fillCircle(16, 16, 12);
    graphics.generateTexture("character-isa", 32, 32);

    graphics.clear();
    graphics.fillStyle(0x4ecdc4);
    graphics.fillCircle(16, 16, 12);
    graphics.generateTexture("character-stev", 32, 32);

    graphics.destroy();
  }

  /**
   * Registra pipelines personalizados de WebGL
   */
  private registerCustomPipelines(): void {
    try {
      // Registrar WaterRipplePipeline para efectos de agua
      if (this.renderer && this.renderer.type === Phaser.WEBGL) {
        const waterRipplePipeline = new WaterRipplePipeline(this.game);
        (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add(
          "WaterRipple",
          waterRipplePipeline,
        );

        logAutopoiesis.info("🌊 WaterRipplePipeline registrado correctamente");
      } else {
        logAutopoiesis.warn(
          "⚠️ WebGL no disponible, saltando registro de pipelines",
        );
      }
    } catch (error) {
      logAutopoiesis.error(
        "❌ Error registrando pipelines personalizados:",
        error,
      );
    }
  }

  private createTemporaryEntitySprites(): void {
    // Crear sprites temporales de 24x24 para Isa (rosa)
    const isaCanvas = document.createElement('canvas');
    isaCanvas.width = 24;
    isaCanvas.height = 24;
    const isaCtx = isaCanvas.getContext('2d')!;
    isaCtx.fillStyle = '#ff69b4'; // Rosa para Isa
    isaCtx.fillRect(0, 0, 24, 24);
    isaCtx.fillStyle = '#ffffff';
    isaCtx.fillRect(2, 2, 20, 20);
    isaCtx.fillStyle = '#ff69b4';
    isaCtx.fillRect(4, 4, 16, 16);
    
    // Crear sprites temporales de 32x32 para Stev (azul)
    const stevCanvas = document.createElement('canvas');
    stevCanvas.width = 32;
    stevCanvas.height = 32;
    const stevCtx = stevCanvas.getContext('2d')!;
    stevCtx.fillStyle = '#4169e1'; // Azul para Stev
    stevCtx.fillRect(0, 0, 32, 32);
    stevCtx.fillStyle = '#ffffff';
    stevCtx.fillRect(2, 2, 28, 28);
    stevCtx.fillStyle = '#4169e1';
    stevCtx.fillRect(4, 4, 24, 24);
    
    // Cargar como texturas en Phaser
    this.load.image('whomen1', isaCanvas.toDataURL());
    this.load.image('man1', stevCanvas.toDataURL());
    this.load.image('isa_happy', isaCanvas.toDataURL());
    this.load.image('stev_happy', stevCanvas.toDataURL());
    
    logAutopoiesis.info("🎨 Sprites temporales de entidades creados");
  }

  create() {
    console.log("🎯 BootScene.create() STARTED");
    logAutopoiesis.info(
      "🔄 Registrando UnifiedAssetManager y cambiando a MainScene...",
    );

    // Solo registrar el asset manager, no cargar assets críticos aquí
    this.registry.set("unifiedAssetManager", this.unifiedAssetManager);

    // Ir directamente a MainScene y que cargue lo que necesite
    console.log("🎯 BootScene: About to start MainScene");
    this.scene.start("MainScene");
    console.log("🎯 BootScene: MainScene start called");
  }

  private hideLoadingScreen() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}

// Export con nombre para compatibilidad
export { BootScene };
