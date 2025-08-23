import { AnimationManager } from "../managers/AnimationManager";
import { EntityManager } from "../managers/EntityManager";
import { GameLogicManager } from "../managers/GameLogicManager";
import { InputManager } from "../managers/InputManager";
import { SceneInitializationManager } from "../managers/SceneInitializationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { logAutopoiesis } from "../utils/logger";
import { LoadingProgressManager } from "../utils/LoadingProgressManager";
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
  public animationManager!: AnimationManager;

  // Sistema de mundo diverso
  private worldComposer!: DiverseWorldComposer;
  private worldRenderer!: LayeredWorldRenderer;
  private performanceMode = true;

  // Manager de progreso de carga
  private progressManager?: LoadingProgressManager;

  // UI principal (cartas, necesidades, estado) se gestiona en UIScene
  // UI principal (cartas y estado de sistema) se gestiona en UIScene

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
    logAutopoiesis.info("🎯 MainScene.create() iniciado");
    logAutopoiesis.info("🌍 Creating complete game world with entities...");

    // PRIMERO: Mostrar barra de progreso inmediatamente
    const progressManager = this.registry.get(
      "progressManager",
    ) as LoadingProgressManager;
    if (progressManager) {
      setTimeout(() => {
        try {
          progressManager.showProgressBar();
        } catch (error) {
          logAutopoiesis.error("❌ Error mostrando barra de progreso:", error);
        }
      }, 100); // Muy pequeño delay para que Phaser esté listo
    }

    // 1. Verificar asset manager
    const unifiedAssetManager = this.registry.get(
      "unifiedAssetManager",
    ) as UnifiedAssetManager;
    if (!unifiedAssetManager) {
      logAutopoiesis.error("❌ UnifiedAssetManager no encontrado");
      return;
    }
    this.unifiedAssetManager = unifiedAssetManager;

    // 2. Inicializar managers principales
    this.entityManager = new EntityManager(this);
    this.inputManager = new InputManager(this);
    this.animationManager = new AnimationManager(this);
    this.entities = this.add.group();

    // 3. Crear todas las animaciones desde los nuevos sprites
    this.animationManager.createAllAnimations();
    logAutopoiesis.info(
      "🎬 Animaciones activadas - sprites dinámicos disponibles",
    );

    // 4. Registrar AnimationManager en registry para que las entidades lo encuentren
    this.registry.set("animationManager", this.animationManager);

    // Obtener LoadingProgressManager desde registry
    this.progressManager = this.registry.get(
      "progressManager",
    ) as LoadingProgressManager;

    // Si no hay progressManager, crear uno temporal para evitar errores
    if (!this.progressManager) {
      logAutopoiesis.warn(
        "⚠️ No se encontró progressManager, creando uno temporal",
      );
      try {
        this.progressManager = new LoadingProgressManager(this);
        logAutopoiesis.info("✅ LoadingProgressManager creado exitosamente");
      } catch (error) {
        logAutopoiesis.error("❌ Error creando LoadingProgressManager:", error);
        // Crear un mock para evitar bloqueos
        this.progressManager = {
          startPhase: () => {},
          updatePhase: () => {},
          completePhase: () => {},
          isComplete: () => true,
          hideProgressBar: () => {},
          showProgressBar: () => {},
        } as any;
      }
    }

    // La barra de progreso ya se mostró en BootScene, solo asegurar que esté visible
    if (this.progressManager && !this.progressManager.isVisible) {
      try {
        this.progressManager.showProgressBar();
      } catch (error) {
        logAutopoiesis.error("❌ Error mostrando barra de progreso:", error);
      }
    }

    try {
      // 5. Generar mundo base simple primero
      this.progressManager?.startPhase(
        "world_generation",
        "Generando terreno 200x200...",
      );
      const baseWorld = this.generateBasicWorld();
      this.progressManager?.completePhase(
        "world_generation",
        "Mundo base generado",
      );

      // 6. Inicializar GameState
      const init = await SceneInitializationManager.initialize();
      const gameState = init.gameState;

      // 7. Componer y renderizar mundo diverso
      this.progressManager?.startPhase(
        "world_composition",
        "Componiendo biomas y assets...",
      );
      logAutopoiesis.info("🎨 Iniciando composición de mundo diverso...");
      this.worldComposer = new DiverseWorldComposer(this, `seed_${Date.now()}`);

      // Componer el mundo CON assets reales
      const composedWorld = await this.worldComposer.composeWorld(baseWorld);
      this.progressManager?.completePhase(
        "world_composition",
        "Mundo compuesto con assets",
      );

      logAutopoiesis.info("✅ Mundo compuesto", {
        layers: composedWorld.layers.length,
        totalAssets: composedWorld.stats.totalAssets,
        diversityIndex: composedWorld.stats.diversityIndex,
      });

      // 9. Renderizar el mundo compuesto
      this.progressManager?.startPhase(
        "world_rendering",
        "Renderizando 1200+ assets...",
      );
      this.worldRenderer = new LayeredWorldRenderer(this, {
        enablePerformanceMode: false, // Desactivado para mostrar todos los tiles
        maxVisibleAssets: 50000, // Aumentado para mundo de 200x200 = 40k tiles
      });

      await this.worldRenderer.renderComposedWorld(
        composedWorld,
        this.progressManager,
      );
      this.progressManager?.completePhase(
        "world_rendering",
        "Mundo renderizado exitosamente",
      );
      logAutopoiesis.info("🎮 Mundo renderizado exitosamente");

      // Desactivar modo performance para mostrar todos los tiles
      this.worldRenderer.setPerformanceMode(false);
      this.performanceMode = false;

      // 10. Crear entidades y lógica del juego
      this.progressManager?.startPhase(
        "entities",
        "Inicializando entidades y lógica...",
      );
      const { isaEntity, stevEntity } = this.entityManager.createEntities({
        scene: this,
      });

      // Configurar relaciones entre entidades
      isaEntity.setPartnerEntity(stevEntity);
      stevEntity.setPartnerEntity(isaEntity);

      // 10. Inicializar GameLogicManager con entidades
      this.gameLogicManager = new GameLogicManager(this, gameState);
      this.gameLogicManager.initialize();

      // Registrar entidades en el manager
      this.gameLogicManager.registerEntity("isa", isaEntity);
      this.gameLogicManager.registerEntity("stev", stevEntity);

      // 11. Configurar InputManager
      this.inputManager.setGameLogicManager(this.gameLogicManager);
      this.inputManager.setControlledEntity("stev"); // Jugador controla a Stev inicialmente

      // 12. Guardar stats para UI y estado de juego
      this.registry.set("worldStats", composedWorld.stats);
      this.registry.set("gameState", gameState);
      this.registry.set("gameLogicManager", this.gameLogicManager);
      this.registry.set("entityManager", this.entityManager);

      // 13. Reenviar eventos a UIScene
      this.gameLogicManager.on(
        "gameLogicUpdate",
        (data) => this.events.emit("gameLogicUpdate", data),
        this,
      );

      // 14. Configurar controles
      this.setupControls();

      // 15. UI de necesidades gestionada por UIScene

      // 16. Reemitir necesidades para UIScene y mostrar resumen
      this.gameLogicManager.on("needsUpdated", (data: { entityId: string; entityData: import('../systems/NeedsSystem').EntityNeedsData }) => {
        // Reemitir evento a otras escenas (UIScene)
        this.events.emit("needsUpdated", data);

        // Estado resumido a mensajes
        const typedData = data;
        
        if (typedData.entityId === "stev" || typedData.entityId === "isa") {
          const needsData = typedData.entityData?.needs;
          if (needsData) {
            const criticalCount = Object.entries(needsData).filter(
              ([key, value]) => key !== "lastUpdate" && value < 20,
            ).length;
            const warningCount = Object.entries(needsData).filter(
              ([key, value]) =>
                key !== "lastUpdate" && value < 40 && value >= 20,
            ).length;

            const level =
              criticalCount > 0
                ? "critical"
                : warningCount > 0
                  ? "warning"
                  : "ok";
            this.events.emit("systemEvent", {
              type: level === "critical" ? "warning" : "system",
              message:
                level === "ok"
                  ? "Needs: estado normal"
                  : `Needs: ${criticalCount} críticos, ${warningCount} advertencias`,
            });
          }
        }
      });

      // 17. Completar carga de entidades y ocultar barra de progreso
      this.progressManager?.completePhase(
        "entities",
        "Entidades inicializadas",
      );

      // Ocultar barra de progreso cuando todo esté completado
      if (this.progressManager?.isComplete()) {
        this.progressManager.hideProgressBar();
      }

      // 18. Iniciar UI Scene
      logAutopoiesis.debug("🎯 MainScene: About to launch UIScene");
      this.scene.launch("UIScene");
      logAutopoiesis.debug("🎯 MainScene: UIScene launch called");

      // 18. Configurar cámara correctamente
      const worldPixelWidth =
        baseWorld.config.width * baseWorld.config.tileSize;
      const worldPixelHeight =
        baseWorld.config.height * baseWorld.config.tileSize;

      logAutopoiesis.info("🎥 Configurando cámara", {
        worldTiles: `${baseWorld.config.width}x${baseWorld.config.height}`,
        worldPixels: `${worldPixelWidth}x${worldPixelHeight}`,
        tileSize: baseWorld.config.tileSize,
      });

      // Configurar límites de cámara según el mundo generado
      this.cameras.main.setBounds(0, 0, worldPixelWidth, worldPixelHeight);

      // Configurar zoom para ver un área apropiada del mundo
      const gameWidth = this.scale.gameSize.width;
      const gameHeight = this.scale.gameSize.height;

      // Calcular zoom para mostrar aproximadamente el 80% del mundo (más cercano)
      const zoomX = gameWidth / (worldPixelWidth * 0.8);
      const zoomY = gameHeight / (worldPixelHeight * 0.8);
      const optimalZoom = Math.min(zoomX, zoomY, 1.2); // Permitir zoom hasta 1.2

      this.cameras.main.setZoom(optimalZoom);
      logAutopoiesis.info("🎥 Zoom configurado", {
        optimalZoom,
        gameSize: `${gameWidth}x${gameHeight}`,
        zoomX,
        zoomY,
      });

      // Centrar la cámara en el mundo usando scrollTo en lugar de centerOn
      const centerX = worldPixelWidth / 2;
      const centerY = worldPixelHeight / 2;

      // Calcular posición de scroll para centrar correctamente
      const scrollX = centerX - gameWidth / optimalZoom / 2;
      const scrollY = centerY - gameHeight / optimalZoom / 2;

      this.cameras.main.setScroll(scrollX, scrollY);

      logAutopoiesis.info("🎥 Cámara posicionada", {
        centerX,
        centerY,
        scrollX,
        scrollY,
        visibleArea: {
          width: gameWidth / optimalZoom,
          height: gameHeight / optimalZoom,
        },
      });

      // 19. Eventos desde UI
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
   * Genera un mundo básico cuadrado para testing
   */
  private generateBasicWorld(): GeneratedWorld {
    // Configuración para un mundo que cubra bien el área sin exceder límites
    const worldWidth = 200;  // 200 tiles de ancho
    const worldHeight = 200; // 200 tiles de alto = 40,000 tiles total (bajo límite de 50k)
    const tileSize = 32;     // Tamaño normal de tiles (32x32 píxeles)

    const config: WorldGenConfig = {
      width: worldWidth,
      height: worldHeight, // Garantiza que sea cuadrado
      tileSize: tileSize,
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

    logAutopoiesis.info("🗺️ Generando mundo rectangular", {
      size: `${worldWidth}x${worldHeight} tiles`,
      pixelSize: `${worldWidth * tileSize}x${worldHeight * tileSize}px`,
      tileSize: `${tileSize}px`,
    });

    // Crear terreno básico con diferentes biomas en patrón cuadrado
    const terrain: TerrainTile[][] = [];
    const quarterWidth = Math.floor(worldWidth / 4);
    const quarterHeight = Math.floor(worldHeight / 4);

    for (let y = 0; y < config.height; y++) {
      terrain[y] = [];
      for (let x = 0; x < config.width; x++) {
        // Crear biomas en cuadrantes para mejor distribución visual
        let biome = BiomeType.GRASSLAND;

        // Centro: área mística
        if (
          x > quarterWidth &&
          x < worldWidth - quarterWidth &&
          y > quarterHeight &&
          y < worldHeight - quarterHeight
        ) {
          biome = BiomeType.MYSTICAL;
        } else if (x < quarterWidth && y < quarterHeight) {
          // Esquinas: diferentes biomas
          biome = BiomeType.FOREST;
        } else if (x > worldWidth - quarterWidth && y < quarterHeight) {
          biome = BiomeType.MOUNTAINOUS;
        } else if (x < quarterWidth && y > worldHeight - quarterHeight) {
          biome = BiomeType.WETLAND;
        } else if (x > worldWidth - quarterWidth && y > worldHeight - quarterHeight) {
          biome = BiomeType.FOREST;
        } else {
          // Resto: pradera
          biome = BiomeType.GRASSLAND;
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

    // Usar tiempo absoluto para sincronización (ejemplo futuro:
    // sincronizar animaciones globales, efectos de día/noche, etc.)
    // TODO: Implementar efectos basados en tiempo absoluto cuando sea necesario
    this.updateTimeBasedEffects(time);
  }

  private updateTimeBasedEffects(time: number): void {
    // Placeholder para efectos basados en tiempo absoluto
    // Ejemplo: animaciones de ambiente, cambios de iluminación, etc.
    // Por ahora solo registramos el tiempo para uso futuro
    if (time % 10000 < 16) {
      // Cada 10 segundos aprox
      logAutopoiesis.debug("Game time checkpoint", { time });
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

      // Centrar la cámara en entidad controlada
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
