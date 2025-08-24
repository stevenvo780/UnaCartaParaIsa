import { AnimationManager } from "../managers/AnimationManager";
import { EntityManager } from "../managers/EntityManager";
import { GameLogicManager } from "../managers/GameLogicManager";
import { InputManager } from "../managers/InputManager";
import { PerformanceManager } from "../managers/PerformanceManager";
import { SceneInitializationManager } from "../managers/SceneInitializationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
import { ZoneRenderer } from "../managers/ZoneRenderer";
import { logAutopoiesis } from "../utils/logger";
import { LoadingProgressManager } from "../utils/LoadingProgressManager";
import { WORLD_CONFIG, CAMERA_CONFIG } from "../constants/WorldConfig";
import { DiverseWorldComposer } from "../world/DiverseWorldComposer";
import { LayeredWorldRenderer } from "../world/LayeredWorldRenderer";
import {
  BiomeType,
  GeneratedWorld,
  TerrainTile,
  WorldGenConfig,
} from "../world/types";
import { TerrainGenerator } from "../world/TerrainGenerator";
import { NoiseUtils } from "../world/NoiseUtils";

export default class MainScene extends Phaser.Scene {
  // Propiedades básicas de escena
  public unifiedAssetManager!: UnifiedAssetManager;
  public entities!: Phaser.GameObjects.Group;
  public gameLogicManager!: GameLogicManager;
  public entityManager!: EntityManager;
  public inputManager!: InputManager;
  public animationManager!: AnimationManager;
  public performanceManager!: PerformanceManager;
  public zoneRenderer!: ZoneRenderer;

  // Sistema de mundo diverso
  private worldComposer!: DiverseWorldComposer;
  private worldRenderer!: LayeredWorldRenderer;
  private performanceMode = true;

  // Manager de progreso de carga
  private progressManager?: LoadingProgressManager;

  // Controles de cámara
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private isDraggingCamera = false;
  private dragStart = { x: 0, y: 0 };
  private camStart = { x: 0, y: 0 };

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
    this.cursors = this.input.keyboard?.createCursorKeys();

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
    this.performanceManager = new PerformanceManager(this);
    this.zoneRenderer = new ZoneRenderer(this);
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
      // 5. Generar mundo orgánico mejorado
      this.progressManager?.startPhase(
        "world_generation",
        "Generando terreno orgánico 180x180...",
      );
      const baseWorld = this.generateOrganicWorld();
      this.progressManager?.completePhase(
        "world_generation",
        "Mundo orgánico generado",
      );

      // 6. Inicializar GameState
      const init = await SceneInitializationManager.initialize();
      const gameState = init.gameState;

      // 7. Usar DiverseWorldComposer muy simplificado
      this.progressManager?.startPhase(
        "world_composition",
        "Componiendo biomas y assets...",
      );
      logAutopoiesis.info("🎨 Iniciando composición de mundo diverso...");
      this.worldComposer = new DiverseWorldComposer(this, `seed_${Date.now()}`);

      // Usar DiverseWorldComposer simplificado pero funcional
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

      // 9.5. Renderizar zonas de recuperación de forma visible
      this.progressManager?.startPhase(
        "zone_rendering",
        "Dibujando zonas de recuperación...",
      );
      this.zoneRenderer.renderZones(gameState.zones);
      this.progressManager?.completePhase(
        "zone_rendering",
        "Zonas renderizadas exitosamente",
      );
      logAutopoiesis.info("🎨 Zonas de recuperación renderizadas", {
        count: gameState.zones.length,
      });

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
      this.gameLogicManager.on(
        "needsUpdated",
        (data: {
          entityId: string;
          entityData: import("../systems/NeedsSystem").EntityNeedsData;
        }) => {
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
        },
      );

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

      // 18. Configurar cámara usando constantes centralizadas
      const worldPixelWidth = WORLD_CONFIG.WORLD_WIDTH;
      const worldPixelHeight = WORLD_CONFIG.WORLD_HEIGHT;

      logAutopoiesis.info("🎥 Configurando cámara con constantes centralizadas", {
        worldPixels: `${worldPixelWidth}x${worldPixelHeight}`,
        cameraConfig: CAMERA_CONFIG,
      });

      // Configurar límites de cámara - NECESARIO para evitar ir fuera del mundo
      this.cameras.main.setBounds(0, 0, WORLD_CONFIG.WORLD_WIDTH, WORLD_CONFIG.WORLD_HEIGHT);

      // Configurar zoom inicial
      const gameWidth = this.scale.gameSize.width;
      const gameHeight = this.scale.gameSize.height;

      // Usar zoom por defecto de las constantes
      this.cameras.main.setZoom(CAMERA_CONFIG.DEFAULT_ZOOM);
      
      logAutopoiesis.info("🎥 Zoom configurado", {
        initialZoom: CAMERA_CONFIG.DEFAULT_ZOOM,
        gameSize: `${gameWidth}x${gameHeight}`,
        worldSize: `${worldPixelWidth}x${worldPixelHeight}`,
      });

      // Centrar la cámara en el mundo usando constantes
      const centerX = WORLD_CONFIG.WORLD_CENTER_X;
      const centerY = WORLD_CONFIG.WORLD_CENTER_Y;

      // Centrar correctamente
      this.cameras.main.centerOn(centerX, centerY);

      logAutopoiesis.info("🎥 Cámara posicionada", {
        center: `${centerX}, ${centerY}`,
        currentScroll: `${this.cameras.main.scrollX}, ${this.cameras.main.scrollY}`,
        zoom: CAMERA_CONFIG.DEFAULT_ZOOM,
        worldSize: `${worldPixelWidth}x${worldPixelHeight}`,
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
   * Genera un mundo orgánico usando ruido Perlin para biomas naturales
   */
  private generateOrganicWorld(): GeneratedWorld {
    const tileSize = 32;
    // Calcular dimensiones en tiles basado en WorldConfig
    const worldWidth = Math.floor(WORLD_CONFIG.WORLD_WIDTH / tileSize);
    const worldHeight = Math.floor(WORLD_CONFIG.WORLD_HEIGHT / tileSize);

    const config: WorldGenConfig = {
      width: worldWidth,
      height: worldHeight,
      tileSize: tileSize,
      seed: Date.now(),
      biomes: {
        enabled: [
          BiomeType.GRASSLAND,
          BiomeType.FOREST,
          BiomeType.MYSTICAL,
          BiomeType.WETLAND,
          BiomeType.MOUNTAINOUS,
        ],
      },
      noise: {
        temperature: {
          scale: 0.01,
          octaves: 4,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        moisture: {
          scale: 0.008,
          octaves: 3,
          persistence: 0.6,
          lacunarity: 2.0,
        },
        elevation: {
          scale: 0.006,
          octaves: 5,
          persistence: 0.4,
          lacunarity: 2.5,
        },
      },
      water: { level: 0.3, rivers: true, lakes: true },
    };

    // Usar ruido Perlin simple para crear biomas orgánicos
    const noise = new NoiseUtils(config.seed);
    const terrain: TerrainTile[][] = [];

    logAutopoiesis.info("🌿 Generando mundo con biomas orgánicos", {
      size: `${worldWidth}x${worldHeight} tiles`,
    });

    for (let y = 0; y < config.height; y++) {
      terrain[y] = [];
      for (let x = 0; x < config.width; x++) {
        // Usar múltiples capas de ruido para decidir bioma de forma orgánica
        const biomeNoise1 = noise.noise2D(x * 0.02, y * 0.02); // Ruido principal
        const biomeNoise2 = noise.noise2D(x * 0.05, y * 0.05) * 0.5; // Detalles
        const biomeNoise3 = noise.noise2D(x * 0.008, y * 0.008) * 0.3; // Grandes regiones

        const combinedNoise = (biomeNoise1 + biomeNoise2 + biomeNoise3) / 1.8;

        // Asignar biomas de forma orgánica basado en ruido
        let biome = BiomeType.GRASSLAND;
        if (combinedNoise > 0.6) {
          biome = BiomeType.MYSTICAL;
        } else if (combinedNoise > 0.3) {
          biome = BiomeType.FOREST;
        } else if (combinedNoise > 0.0) {
          biome = BiomeType.GRASSLAND;
        } else if (combinedNoise > -0.3) {
          biome = BiomeType.WETLAND;
        } else {
          biome = BiomeType.MOUNTAINOUS;
        }

        terrain[y][x] = {
          x: x * config.tileSize,
          y: y * config.tileSize,
          biome,
          biomeStrength: 0.7 + Math.random() * 0.3,
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

    // Crear capa básica de terreno para renderizado
    const terrainLayer = {
      name: "terrain",
      type: "terrain",
      zIndex: 0,
      visible: true,
      assets: [],
    };

    // Agregar todos los tiles de terreno a la capa
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const tile = terrain[y][x];
        (terrainLayer as any).assets.push({
          asset: {
            key: tile.assets.terrain,
            path: "", // No necesario para test
            type: "terrain",
          },
          x: tile.x,
          y: tile.y,
          scale: 1,
          rotation: 0,
          tint: 0xffffff,
          depth: 0,
          metadata: {
            biome: tile.biome,
            id: `terrain_${x}_${y}`,
          },
        });
      }
    }

    return {
      config,
      terrain,
      layers: [terrainLayer as any],
      biomeMap,
      metadata: {
        generationTime: 0,
        biomeDistribution: {
          [BiomeType.GRASSLAND]: 40,
          [BiomeType.FOREST]: 25,
          [BiomeType.MYSTICAL]: 15,
          [BiomeType.WETLAND]: 10,
          [BiomeType.MOUNTAINOUS]: 10,
          [BiomeType.VILLAGE]: 0,
        },
        totalAssets: terrainLayer.assets.length,
        version: "2.0.0-organic",
      },
    };
  }

  update(time: number, delta: number) {
    // Actualizar performance manager primero para optimizar el frame
    if (this.performanceManager) {
      this.performanceManager.update(time, delta);
    }

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

    // Actualizar visibilidad de zonas basado en zoom
    if (this.zoneRenderer && this.cameras?.main) {
      this.zoneRenderer.updateVisibility(this.cameras.main.zoom);
    }

    // Pan de cámara con teclas (WASD y Flechas)
    const cam = this.cameras.main;
    const speed = (CAMERA_CONFIG.PAN_SPEED * (delta / 16.67)) / cam.zoom;
    let moveX = 0;
    let moveY = 0;
    const c = this.cursors;
    const w = this.wasd;
    if (c) {
      if (c.left?.isDown) moveX -= speed;
      if (c.right?.isDown) moveX += speed;
      if (c.up?.isDown) moveY -= speed;
      if (c.down?.isDown) moveY += speed;
    }
    if (w) {
      if (w.left?.isDown) moveX -= speed;
      if (w.right?.isDown) moveX += speed;
      if (w.up?.isDown) moveY -= speed;
      if (w.down?.isDown) moveY += speed;
    }
    if (moveX !== 0 || moveY !== 0) {
      cam.setScroll(cam.scrollX + moveX, cam.scrollY + moveY);
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
    // Crear cursores y WASD
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    }) as any;

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

    // Controles de zoom suaves con rueda del mouse
    this.input.on(
      "wheel",
      (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        const camera = this.cameras.main;
        const currentZoom = camera.zoom;

        // Límites desde la configuración centralizada
        const minZoom = CAMERA_CONFIG.MIN_ZOOM;
        const maxZoom = CAMERA_CONFIG.MAX_ZOOM;

        // Zoom suave
        const zoomFactor = deltaY > 0 ? 0.95 : 1.05;
        const newZoom = Phaser.Math.Clamp(
          currentZoom * zoomFactor,
          minZoom,
          maxZoom,
        );

        camera.setZoom(newZoom);
      },
    );

    // Arrastre para mover cámara
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || pointer.leftButtonDown()) {
        this.isDraggingCamera = true;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.camStart.x = this.cameras.main.scrollX;
        this.camStart.y = this.cameras.main.scrollY;
      }
    });

    this.input.on("pointerup", () => {
      this.isDraggingCamera = false;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingCamera || !pointer.isDown) return;
      const cam = this.cameras.main;
      const dx = (pointer.x - this.dragStart.x) / cam.zoom;
      const dy = (pointer.y - this.dragStart.y) / cam.zoom;
      cam.setScroll(this.camStart.x - dx, this.camStart.y - dy);
    });

    // Z para toggle de zonas de recuperación
    this.input.keyboard?.on("keydown-Z", () => {
      const container = this.zoneRenderer.getContainer();
      const newVisibility = !container.visible;
      container.setVisible(newVisibility);

      logAutopoiesis.info(
        `🎨 Zonas de recuperación ${newVisibility ? "mostradas" : "ocultas"}`,
      );
    });
  }
}

// También export con nombre para compatibilidad
export { MainScene };
