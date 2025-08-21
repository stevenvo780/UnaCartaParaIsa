import Phaser from "phaser";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { logAutopoiesis } from "../utils/logger";

export default class BootScene extends Phaser.Scene {
  private unifiedAssetManager!: UnifiedAssetManager;

  constructor() {
    super({ key: "BootScene" });
  }

  async preload() {
    logAutopoiesis.info("🚀 BootScene iniciando carga completa de assets...");

    // Crear progress bar de carga
    this.createLoadingBar();

    // Cargar assets esenciales para el juego
    await this.loadEssentialAssets();

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
    const loadingText = this.add.text(width / 2, height / 2 - 50, "Cargando...", {
      fontSize: "20px",
      color: "#ffffff",
    });
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
      progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 40);
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private async loadEssentialAssets(): Promise<void> {
    // Cargar placeholder/basic assets para desarrollo
    this.loadPlaceholderAssets();
    
    // Crear y inicializar UnifiedAssetManager
    this.unifiedAssetManager = new UnifiedAssetManager(this);
    await this.unifiedAssetManager.initialize();
    
    logAutopoiesis.info("📦 Assets esenciales cargados", {
      assetsCount: this.unifiedAssetManager.getLoadedAssetsCount(),
    });
  }

  private loadPlaceholderAssets(): void {
    // Crear texturas básicas procedurales para desarrollo
    this.load.image("placeholder-terrain", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
    this.load.image("placeholder-character", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
    this.load.image("placeholder-ui", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
    
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

  create() {
    logAutopoiesis.info(
      "🔄 Registrando UnifiedAssetManager y cambiando a MainScene...",
    );

    // Registrar el asset manager cargado
    this.registry.set("unifiedAssetManager", this.unifiedAssetManager);

    this.scene.start("MainScene");
  }

  private hideLoadingScreen() {
    const loadingElement = document.getElementById("loading-screen");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}

// Export con nombre para compatibilidad
export { BootScene };
