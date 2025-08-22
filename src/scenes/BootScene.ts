import Phaser from "phaser";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { WaterRipplePipeline } from "../plugins/WaterRipplePipeline";
import { logAutopoiesis } from "../utils/logger";
import { createCanvasWithContext } from "../utils/canvasHelpers";

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
    // Cargar spritesheets críticos para animaciones
        this.loadCriticalSpritesheets();

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

    private loadCriticalSpritesheets(): void {
    // Only load if not already loaded to avoid duplicates
        if (!this.textures.exists("whomen1")) {
            this.load.spritesheet(
                "whomen1",
                "assets/entities/animated/characters/whomen1.png",
                {
                    frameWidth: 24,
                    frameHeight: 24,
                },
            );
        }

        if (!this.textures.exists("man1")) {
            this.load.spritesheet(
                "man1",
                "assets/entities/animated/characters/man1.png",
                {
                    frameWidth: 32,
                    frameHeight: 32,
                },
            );
        }
    }

    private createBasicSprites(): void {
        const graphics = this.add.graphics();

        // Crear sprite de terreno básico
        graphics.fillStyle(0x4a7c4a);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture("terrain-grass", 32, 32);

        // Crear árboles básicos
        graphics.clear();
        graphics.fillStyle(0x8b4513); // Tronco marrón
        graphics.fillRect(12, 20, 8, 12);
        graphics.fillStyle(0x228b22); // Copa verde
        graphics.fillCircle(16, 16, 12);
        graphics.generateTexture("oak_tree1", 32, 32);

        // Crear roca básica
        graphics.clear();
        graphics.fillStyle(0x696969);
        graphics.fillEllipse(16, 20, 20, 16);
        graphics.generateTexture("rock1_1", 32, 32);

        // Crear agua básica
        graphics.clear();
        graphics.fillStyle(0x4682b4);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture("water_middle", 32, 32);

        // Crear casa básica
        graphics.clear();
        graphics.fillStyle(0x8b4513); // Marrón para casa
        graphics.fillRect(4, 12, 24, 16);
        graphics.fillStyle(0xff0000); // Techo rojo
        graphics.fillTriangle(16, 4, 4, 12, 28, 12);
        graphics.generateTexture("house", 32, 32);

        // Crear cofre básico
        graphics.clear();
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(8, 16, 16, 12);
        graphics.fillStyle(0xffd700); // Dorado para detalles
        graphics.fillRect(14, 18, 4, 2);
        graphics.generateTexture("chest", 32, 32);

        // Crear arbusto básico
        graphics.clear();
        graphics.fillStyle(0x32cd32);
        graphics.fillCircle(16, 20, 10);
        graphics.generateTexture("bush_emerald_1", 32, 32);

        // Crear hongo básico
        graphics.clear();
        graphics.fillStyle(0xf5deb3); // Beige para tallo
        graphics.fillRect(14, 20, 4, 8);
        graphics.fillStyle(0x90ee90); // Verde claro para sombrero
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
            logAutopoiesis.error("❌ Error registrando pipelines personalizados:", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    private createTemporaryEntitySprites(): void {
    // Create enhanced sprites with animations
        const spriteSize = 64; // Increase size for better visibility
        const frameCount = 4; // Animation frames

        // Create Isa's animated spritesheet
        const { canvas: isaCanvas, ctx: isaCtx } = createCanvasWithContext(
            spriteSize * frameCount,
            spriteSize,
        );

        // Create 4 frames for Isa (walking animation)
        for (let frame = 0; frame < frameCount; frame++) {
            const x = frame * spriteSize;

            // Base character (pink/purple for Isa)
            isaCtx.fillStyle = "#ff69b4"; // Hot pink base
            isaCtx.fillRect(x + 20, 10, 24, 32); // Body
            isaCtx.fillRect(x + 24, 4, 16, 16); // Head

            // Add details
            isaCtx.fillStyle = "#ffffff";
            isaCtx.fillRect(x + 26, 6, 4, 4); // Eye
            isaCtx.fillRect(x + 32, 6, 4, 4); // Eye

            // Legs animation (simple walk cycle)
            const legOffset = Math.sin((frame / frameCount) * Math.PI * 2) * 4;
            isaCtx.fillStyle = "#ff1493"; // Darker pink for legs
            isaCtx.fillRect(x + 22, 42 + legOffset, 6, 16); // Left leg
            isaCtx.fillRect(x + 34, 42 - legOffset, 6, 16); // Right leg

            // Arms
            isaCtx.fillRect(x + 16, 16, 6, 20); // Left arm
            isaCtx.fillRect(x + 42, 16, 6, 20); // Right arm
        }

        // Create Stev's animated spritesheet
        const { canvas: stevCanvas, ctx: stevCtx } = createCanvasWithContext(
            spriteSize * frameCount,
            spriteSize,
        );

        // Create 4 frames for Stev (walking animation)
        for (let frame = 0; frame < frameCount; frame++) {
            const x = frame * spriteSize;

            // Base character (blue for Stev)
            stevCtx.fillStyle = "#4169e1"; // Royal blue base
            stevCtx.fillRect(x + 20, 10, 24, 32); // Body
            stevCtx.fillRect(x + 24, 4, 16, 16); // Head

            // Add details
            stevCtx.fillStyle = "#ffffff";
            stevCtx.fillRect(x + 26, 6, 4, 4); // Eye
            stevCtx.fillRect(x + 32, 6, 4, 4); // Eye

            // Legs animation (simple walk cycle)
            const legOffset = Math.sin((frame / frameCount) * Math.PI * 2) * 4;
            stevCtx.fillStyle = "#191970"; // Darker blue for legs
            stevCtx.fillRect(x + 22, 42 + legOffset, 6, 16); // Left leg
            stevCtx.fillRect(x + 34, 42 - legOffset, 6, 16); // Right leg

            // Arms
            stevCtx.fillRect(x + 16, 16, 6, 20); // Left arm
            stevCtx.fillRect(x + 42, 16, 6, 20); // Right arm
        }

        // Load as textures and spritesheets in Phaser
        // this.load.image("whomen1", isaCanvas.toDataURL()); // Skipped to avoid conflict with spritesheet
        // this.load.image("man1", stevCanvas.toDataURL()); // Skipped to avoid conflict with spritesheet

        // Load as spritesheets for animations
        this.load.spritesheet("isa_spritesheet", isaCanvas.toDataURL(), {
            frameWidth: spriteSize,
            frameHeight: spriteSize,
        });

        this.load.spritesheet("stev_spritesheet", stevCanvas.toDataURL(), {
            frameWidth: spriteSize,
            frameHeight: spriteSize,
        });

        logAutopoiesis.info("🎨 Sprites temporales de entidades creados");
    }

    create() {
        logAutopoiesis.info("🎯 BootScene.create() iniciado");
        logAutopoiesis.info(
            "🔄 Registrando UnifiedAssetManager y cambiando a MainScene...",
        );

        // Solo registrar el asset manager, no cargar assets críticos aquí
        this.registry.set("unifiedAssetManager", this.unifiedAssetManager);

        // Ir directamente a MainScene y que cargue lo que necesite
        logAutopoiesis.debug("🎯 BootScene: About to start MainScene");
        this.scene.start("MainScene");
        logAutopoiesis.debug("🎯 BootScene: MainScene start called");
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
