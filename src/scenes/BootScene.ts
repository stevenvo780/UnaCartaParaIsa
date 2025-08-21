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

  private loadRealGameAssets(): void {
    // Cargar césped (tiles de terreno)
    for (let i = 1; i <= 31; i++) {
      this.load.image(`cesped${i}`, `assets/terrain/base/cesped${i}.png`);
    }
    
    // Cargar assets de agua
    this.load.image("Water_Middle", "assets/water/Water_Middle.png");
    this.load.image("tile_01_00", "assets/water/tile_01_00.png");
    
    // Cargar árboles principales
    this.load.image("oak_tree1", "assets/foliage/trees/oak_tree.png");
    this.load.image("mega_tree1", "assets/foliage/trees/mega_tree1.png");
    this.load.image("willow1", "assets/foliage/trees/willow1.png");
    
    // Cargar rocas
    this.load.image("rock1_1", "assets/rocks/rock1_1.png");
    this.load.image("rock2_1", "assets/rocks/rock2_1.png");
    this.load.image("rock3_1", "assets/rocks/rock3_1.png");
    
    // Cargar props básicos
    this.load.image("Chest", "assets/props/Chest.png");
    this.load.image("Barrel_Small_Empty", "assets/props/Barrel_Small_Empty.png");
    
    // Cargar estructuras
    this.load.image("House", "assets/structures/estructuras_completas/House.png");
    
    // Cargar vegetación adicional
    this.load.image("bush_emerald_1", "assets/foliage/shrubs/bush_emerald_1.png");
    this.load.image("beige_green_mushroom1", "assets/mushrooms/beige_green_mushroom1.png");
    this.load.image("blue-gray_ruins1", "assets/ruins/blue-gray_ruins1.png");
    
    logAutopoiesis.info("🌱 Cargando assets reales: terreno, agua, árboles, rocas, props");
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

    // Crear árboles básicos
    graphics.clear();
    graphics.fillStyle(0x8B4513); // Tronco marrón
    graphics.fillRect(12, 20, 8, 12);
    graphics.fillStyle(0x228B22); // Copa verde
    graphics.fillCircle(16, 16, 12);
    graphics.generateTexture("oak_tree1", 32, 32);

    // Crear roca básica
    graphics.clear();
    graphics.fillStyle(0x696969);
    graphics.fillEllipse(16, 20, 20, 16);
    graphics.generateTexture("rock1_1", 32, 32);

    // Crear agua básica
    graphics.clear();
    graphics.fillStyle(0x4682B4);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("water_middle", 32, 32);

    // Crear casa básica
    graphics.clear();
    graphics.fillStyle(0x8B4513); // Marrón para casa
    graphics.fillRect(4, 12, 24, 16);
    graphics.fillStyle(0xFF0000); // Techo rojo
    graphics.fillTriangle(16, 4, 4, 12, 28, 12);
    graphics.generateTexture("house", 32, 32);

    // Crear cofre básico
    graphics.clear();
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(8, 16, 16, 12);
    graphics.fillStyle(0xFFD700); // Dorado para detalles
    graphics.fillRect(14, 18, 4, 2);
    graphics.generateTexture("chest", 32, 32);

    // Crear arbusto básico
    graphics.clear();
    graphics.fillStyle(0x32CD32);
    graphics.fillCircle(16, 20, 10);
    graphics.generateTexture("bush_emerald_1", 32, 32);

    // Crear hongo básico
    graphics.clear();
    graphics.fillStyle(0xF5DEB3); // Beige para tallo
    graphics.fillRect(14, 20, 4, 8);
    graphics.fillStyle(0x90EE90); // Verde claro para sombrero
    graphics.fillEllipse(16, 18, 12, 8);
    graphics.generateTexture("beige_green_mushroom1", 32, 32);

    // Crear ruina básica
    graphics.clear();
    graphics.fillStyle(0x708090);
    graphics.fillRect(6, 16, 8, 12);
    graphics.fillRect(18, 18, 8, 10);
    graphics.generateTexture("blue-gray_ruins1", 32, 32);

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
