import { EntityManager } from "../managers/EntityManager";
import { GameLogicManager } from "../managers/GameLogicManager";
import { InputManager } from "../managers/InputManager";
import { SceneInitializationManager } from "../managers/SceneInitializationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { logAutopoiesis } from "../utils/logger";
import { DiverseWorldComposer } from "../world/DiverseWorldComposer";
import { LayeredWorldRenderer } from "../world/LayeredWorldRenderer";
import {
  BiomeType,
  GeneratedWorld,
  TerrainTile,
  WorldGenConfig,
} from "../world/types";

export default class MainScene extends Phaser.Scene {
  // Propiedades básicas de escena
  public unifiedAssetManager!: UnifiedAssetManager;
  public entities!: Phaser.GameObjects.Group;
  public gameLogicManager!: GameLogicManager;
  public entityManager!: EntityManager;
  public inputManager!: InputManager;

  // Sistema de mundo diverso
  private worldComposer!: DiverseWorldComposer;
  private worldRenderer!: LayeredWorldRenderer;
  private performanceMode = true;

  constructor() {
    super({ key: "MainScene" });
    logAutopoiesis.info("🎮 MainScene initialized");
  }

  async init() {
    logAutopoiesis.info("🔧 MainScene initializing...");

    // Configuración muy básica
    this.scale.on("resize", this.resize, this);
    this.input.keyboard?.createCursorKeys();

    logAutopoiesis.info("✅ MainScene init complete");
  }

  async create() {
    logAutopoiesis.info("🌍 Creating complete game world with entities...");

    // 1. Verificar asset manager
    this.unifiedAssetManager = this.registry.get("unifiedAssetManager");
    if (!this.unifiedAssetManager) {
      logAutopoiesis.error("❌ UnifiedAssetManager no encontrado");
      return;
    }

    // 2. Inicializar managers principales
    this.entityManager = new EntityManager(this);
    this.inputManager = new InputManager(this);
    this.entities = this.add.group();

    try {
      // 3. Generar mundo base
      const baseWorld = this.generateBasicWorld();

      // 4. Inicializar GameState completo
      const init = await SceneInitializationManager.initialize();
      const gameState = init.gameState;

      // 5. Crear entidades Isa y Stev
      // 4. Crear entidades
    const { isaEntity, stevEntity } = this.entityManager.createEntities({
      scene: this,
    });

      // Configurar relaciones entre entidades
      isaEntity.setPartnerEntity(stevEntity);
      stevEntity.setPartnerEntity(isaEntity);

      // 6. Inicializar GameLogicManager con entidades
      this.gameLogicManager = new GameLogicManager(this, gameState);
      this.gameLogicManager.initialize();
      
      // Registrar entidades en el manager
      this.gameLogicManager.registerEntity("isa", isaEntity);
      this.gameLogicManager.registerEntity("stev", stevEntity);

      // 7. Configurar InputManager
      this.inputManager.setGameLogicManager(this.gameLogicManager);
      this.inputManager.setControlledEntity("none"); // IA controla inicialmente

      // 8. Componer mundo diverso
      this.worldComposer = new DiverseWorldComposer(this, `seed_${Date.now()}`);
      const composedWorld = await this.worldComposer.composeWorld(baseWorld);

      // 9. Renderizar mundo en capas
      this.worldRenderer = new LayeredWorldRenderer(this);
      await this.worldRenderer.renderComposedWorld(composedWorld);
      // Activar modo performance por defecto (oculta efectos/detalles)
      this.worldRenderer.setPerformanceMode(true);
      this.performanceMode = true;

      // 10. Guardar stats para UI y estado de juego
      this.registry.set("worldStats", composedWorld.stats);
      this.registry.set("gameState", gameState);
      this.registry.set("gameLogicManager", this.gameLogicManager);
      this.registry.set("entityManager", this.entityManager);

      // 11. Reenviar eventos a UIScene
      this.gameLogicManager.on(
        "gameLogicUpdate",
        (data) => this.events.emit("gameLogicUpdate", data),
        this,
      );

      // 12. Configurar controles
      this.setupControls();

      // 13. Iniciar UI Scene
      this.scene.launch("UIScene");

      // 6. Configurar cámara
      this.cameras.main.setBounds(
        0,
        0,
        baseWorld.config.width * 32,
        baseWorld.config.height * 32,
      );
      this.cameras.main.setZoom(1);
      // Centrar la cámara en el centro del mundo
      const centerX = (baseWorld.config.width * baseWorld.config.tileSize) / 2;
      const centerY = (baseWorld.config.height * baseWorld.config.tileSize) / 2;
      this.cameras.main.centerOn(centerX, centerY);

      // 7. Eventos desde UI
      this.events.on("togglePerformanceMode", () => {
        const current = this.worldRenderer?.getStats().performanceMode ?? true;
        this.worldRenderer?.setPerformanceMode(!current);
        this.performanceMode = !current;
      });
      this.events.on("changeEntityControl", (mode: "none" | "isa" | "stev") => {
        // Control manual: activar/desactivar IA
        if (!this.gameLogicManager) return;
        this.gameLogicManager.setEntityPlayerControl("isa", mode === "isa");
        this.gameLogicManager.setEntityPlayerControl("stev", mode === "stev");
      });

      logAutopoiesis.info("✅ MainScene creada con mundo diverso", {
        layers: composedWorld.layers.length,
        totalAssets: composedWorld.stats.totalAssets,
        diversityIndex: composedWorld.stats.diversityIndex,
      });
    } catch (error) {
      logAutopoiesis.error("❌ Error creando mundo:", { error: String(error) });

      // Fallback a texto simple
      this.add
        .text(400, 300, "🎮 MainScene Activa\n(Error en generación de mundo)", {
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);
    }
  }

  /**
   * Genera un mundo básico para testing
   */
  private generateBasicWorld(): GeneratedWorld {
    const config: WorldGenConfig = {
      width: 100, // 100 tiles = 3200 pixels
      height: 100, // 100 tiles = 3200 pixels
      tileSize: 32,
      seed: Date.now(),
      noise: {
        temperature: {
          scale: 0.01,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.01,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.005,
          octaves: 6,
          persistence: 0.6,
          lacunarity: 2.0,
        },
      },
      biomes: {
        enabled: [
          BiomeType.GRASSLAND,
          BiomeType.FOREST,
          BiomeType.MYSTICAL,
          BiomeType.WETLAND,
          BiomeType.MOUNTAINOUS,
        ],
      },
      water: {
        level: 0.3,
        rivers: true,
        lakes: true,
      },
    };

    // Crear terreno básico con diferentes biomas
    const terrain: TerrainTile[][] = [];
    for (let y = 0; y < config.height; y++) {
      terrain[y] = [];
      for (let x = 0; x < config.width; x++) {
        // Simular diferentes biomas según posición
        let biome = BiomeType.GRASSLAND;

        if (x < 20 || x > 80 || y < 20 || y > 80) {
          biome = BiomeType.FOREST;
        } else if (x > 40 && x < 60 && y > 40 && y < 60) {
          biome = BiomeType.MYSTICAL;
        } else if (x < 30 && y > 70) {
          biome = BiomeType.WETLAND;
        } else if (x > 70 && y < 30) {
          biome = BiomeType.MOUNTAINOUS;
        }

        terrain[y][x] = {
          x: x * config.tileSize,
          y: y * config.tileSize,
          biome,
          biomeStrength: 0.8 + Math.random() * 0.2,
          temperature: Math.random(),
          moisture: Math.random(),
          elevation: Math.random(),
          assets: {
            terrain: `${biome}_terrain_01`,
            vegetation: [],
            props: [],
            structures: [],
            decals: [],
          },
        };
      }
    }

    // Crear mapa de biomas
    const biomeMap: BiomeType[][] = [];
    for (let y = 0; y < config.height; y++) {
      biomeMap[y] = [];
      for (let x = 0; x < config.width; x++) {
        biomeMap[y][x] = terrain[y][x].biome;
      }
    }

    return {
      config,
      terrain,
      layers: [], // Será llenado por DiverseWorldComposer
      biomeMap,
      metadata: {
        generationTime: 0,
        biomeDistribution: {
          [BiomeType.GRASSLAND]: 50,
          [BiomeType.FOREST]: 30,
          [BiomeType.MYSTICAL]: 10,
          [BiomeType.WETLAND]: 5,
          [BiomeType.MOUNTAINOUS]: 5,
          [BiomeType.VILLAGE]: 0,
        },
        totalAssets: 0,
        version: "1.0.0",
      },
    };
  }

  update(time: number, delta: number) {
    // Update loop real - ejecutar lógica de juego
    if (this.gameLogicManager) {
      this.gameLogicManager.update(delta / 1000); // Convertir a segundos
    }

    // Actualizar culling del renderer si existe
    if (this.worldRenderer) {
      const camera = this.cameras.main;
      this.worldRenderer.updateCulling(
        camera.scrollX + camera.width / 2,
        camera.scrollY + camera.height / 2,
      );
    }
  }

  private resize(gameSize: Phaser.Structs.Size) {
    // Resize handler básico
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.resize(width, height);
  }

  /**
   * Obtiene estadísticas del mundo renderizado
   */
  public getWorldStats() {
    if (this.worldRenderer) {
      return this.worldRenderer.getStats();
    }
    return null;
  }

  /**
   * Controla la visibilidad de capas
   */
  public toggleWorldLayer(layerType: string, visible?: boolean): boolean {
    if (this.worldRenderer) {
      return this.worldRenderer.toggleLayer(layerType, visible);
    }
    return false;
  }

  /**
   * Activa/desactiva modo performance
   */
  public setPerformanceMode(enabled: boolean): void {
    if (this.worldRenderer) {
      this.worldRenderer.setPerformanceMode(enabled);
    }
  }

  /**
   * Configura los controles del juego
   */
  private setupControls(): void {
    // TAB para cambiar control entre entidades
    this.input.keyboard?.on("keydown-TAB", () => {
      const current = this.inputManager.getControlledEntity();
      const next = 
        current === "none" ? "isa" : current === "isa" ? "stev" : "none";
      this.inputManager.setControlledEntity(next);
      
      logAutopoiesis.info(`🎮 Control cambiado a: ${next}`);
      
      // Centrar cámara en entidad controlada
      if (next !== "none") {
        const entity = this.entityManager.getEntity(next);
        if (entity) {
          const pos = entity.getPosition();
          this.cameras.main.centerOn(pos.x, pos.y);
        }
      }
    });

    // SPACE para acción manual
    this.input.keyboard?.on("keydown-SPACE", () => {
      const controlled = this.inputManager.getControlledEntity();
      if (controlled !== "none") {
        logAutopoiesis.info(`🎯 Acción manual de ${controlled}`);
        this.gameLogicManager.handlePlayerInteraction(
          controlled,
          "manual_action",
        );
      }
    });

    // H para ayuda
    this.input.keyboard?.on("keydown-H", () => {
      logAutopoiesis.info("🎮 Controles:", {
        TAB: "Cambiar control (IA/Isa/Stev)",
        SPACE: "Acción manual",
        "Flechas/WASD": "Movimiento",
        H: "Esta ayuda",
        C: "Centrar cámara",
      });
    });

    // C para centrar cámara
    this.input.keyboard?.on("keydown-C", () => {
      const controlled = this.inputManager.getControlledEntity();
      if (controlled !== "none") {
        const entity = this.entityManager.getEntity(controlled);
        if (entity) {
          const pos = entity.getPosition();
          this.cameras.main.centerOn(pos.x, pos.y);
          logAutopoiesis.info(`📷 Cámara centrada en ${controlled}`);
        }
      }
    });
  }
}

// También export con nombre para compatibilidad
export { MainScene };
