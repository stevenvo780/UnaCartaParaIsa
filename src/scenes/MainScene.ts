import Phaser from "phaser";
import { QuestUI } from "../components/QuestUI";
import { AnimatedGameEntity } from "../entities/AnimatedGameEntity";
import { EntityManager } from "../managers/EntityManager";
import { FoodAssetManager } from "../managers/FoodAssetManager";
import { GameLogicManager } from "../managers/GameLogicManager";
import { InputManager, type ControlledEntity } from "../managers/InputManager";
import { SceneInitializationManager } from "../managers/SceneInitializationManager";
import { WorldRenderer } from "../managers/WorldRenderer";
import { DialogueSystem } from "../systems/DialogueSystem";
import { FoodSystem } from "../systems/FoodSystem";
import { QuestController } from "../systems/QuestController";
import { QuestSystem } from "../systems/QuestSystem";
import type {
  GameLogicUpdateData,
  GameState,
  GeneratedWorldData,
} from "../types";
import { logAutopoiesis } from "../utils/logger";

export class MainScene extends Phaser.Scene {
  // Optimizaciones de rendimiento
  private readonly uiUpdateInterval = 200; // Actualizar UI cada 200ms en lugar de cada frame
  private readonly foodUpdateInterval = 100; // Actualizar food system cada 100ms
  private lastUIUpdate = 0;
  private lastFoodUpdate = 0;
  private cachedEntityData: Record<string, unknown> | null = null; // Cache para evitar recrear objetos
  private gameState!: GameState;
  private dialogueSystem!: DialogueSystem;
  private questSystem!: QuestSystem;
  private questController!: QuestController;
  private questUI!: QuestUI;
  private gameLogicManager!: GameLogicManager;
  private worldRenderer!: WorldRenderer;
  private entityManager!: EntityManager;
  private inputManager!: InputManager;
  private foodAssetManager!: FoodAssetManager;
  private foodSystem!: FoodSystem;
  private generatedWorldData?: GeneratedWorldData;

  // Entity references for game stats
  private entities!: Phaser.GameObjects.Group;
  private isaEntity?: AnimatedGameEntity;
  private stevEntity?: AnimatedGameEntity;

  constructor() {
    super({ key: "MainScene" });
  }

  init() {
    logAutopoiesis.info("MainScene initialized");

    const initResult = SceneInitializationManager.initialize();
    this.gameState = initResult.gameState;
    this.generatedWorldData = initResult.generatedWorldData;

    this.registry.set("gameState", this.gameState);
  }

  async create() {
    logAutopoiesis.info("Creating main game world");

    // Initialize managers and systems
    this.entityManager = new EntityManager(this);
    this.inputManager = new InputManager(this);
    this.foodAssetManager = new FoodAssetManager(this);
    this.foodSystem = new FoodSystem(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.questSystem = new QuestSystem(this);
    this.questController = new QuestController(
      this,
      this.questSystem,
      this.dialogueSystem,
    );
    this.questUI = new QuestUI(this);

    await this.initializeManagers();

    // Create entities using EntityManager
    const { isaEntity, stevEntity } = this.entityManager.createEntities(
      this.gameState,
    );

    // Store entity references for game stats
    this.isaEntity = isaEntity;
    this.stevEntity = stevEntity;
    this.entities = this.entityManager.getEntitiesGroup();

    // Setup partner relationships and register with GameLogicManager
    isaEntity.setPartnerEntity(stevEntity);
    stevEntity.setPartnerEntity(isaEntity);
    // Register the entity instances directly - they have updateEntity methods
    this.gameLogicManager.registerEntity("isa", isaEntity);
    this.gameLogicManager.registerEntity("stev", stevEntity);

    // Set default controlled entity to Isa for eating system
    this.inputManager.setControlledEntity("isa");

    // Setup spacebar action for current controlled entity
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.handleEntityAction();
    });

    // Setup quest system controls
    this.input.keyboard?.on("keydown-Q", () => {
      this.questUI.toggleQuestPanel();
    });

    // Auto-start first quest when entities meet
    this.time.delayedCall(2000, () => {
      this.questSystem.startQuest("main_awakening");
    });

    this.setupCamera();
    this.setupUIEvents();
    this.setupFoodStores();

    logAutopoiesis.info("MainScene created successfully", {
      entities: this.entityManager.getEntitiesGroup().children.size,
      zones: this.gameState.zones.length,
      worldSize: this.gameState.worldSize,
    });
  }

  /**
   * Initialize all managers
   */
  private async initializeManagers(): Promise<void> {
    this.gameLogicManager = new GameLogicManager(this, this.gameState);
    this.gameLogicManager.initialize();

    this.worldRenderer = new WorldRenderer(this, this.gameState);
    await this.worldRenderer.renderWorld(
      this.generatedWorldData?.generatedWorld,
    );

    // Register systems in registry for cross-component access
    this.registry.set("gameLogicManager", this.gameLogicManager);
    this.registry.set("questSystem", this.questSystem);
    this.registry.set("dialogueSystem", this.dialogueSystem);

    this.gameLogicManager.on("gameLogicUpdate", (data: GameLogicUpdateData) => {
      this.events.emit("gameLogicUpdate", data);
    });

    logAutopoiesis.debug("All managers initialized");
  }

  /**
   * Setup camera bounds and zoom
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(
      0,
      0,
      this.gameState.worldSize.width,
      this.gameState.worldSize.height,
    );
    this.cameras.main.setZoom(1);

    logAutopoiesis.debug("Camera configured", {
      bounds: this.gameState.worldSize,
    });
  }

  // Método obsoleto - ahora manejado por EntityManager

  /**
   * Maneja interacciones del jugador
   */
  public handlePlayerInteraction(entityId: string, interactionType: string) {
    this.gameLogicManager.handlePlayerInteraction(entityId, interactionType);

    this.dialogueSystem.handlePlayerInteraction(entityId, interactionType);

    logAutopoiesis.info("Player interaction handled", {
      entityId,
      interactionType,
    });
  }

  update() {
    const now = Date.now();

    // WorldRenderer ya está optimizado con su propio intervalo
    if (this.worldRenderer) {
      this.worldRenderer.updateVisuals();
    }

    // Input handling - debe ser cada frame para respuesta inmediata
    this.handleManualControl();

    // Throttle food system updates
    if (now - this.lastFoodUpdate > this.foodUpdateInterval) {
      this.updateFoodSystem();
      this.lastFoodUpdate = now;
    }

    // Throttle UI updates significativamente
    if (now - this.lastUIUpdate > this.uiUpdateInterval) {
      this.updateUI();
      this.lastUIUpdate = now;
    }
  }

  // Método obsoleto - ahora manejado por InputManager

  private setupUIEvents() {
    this.events.on("changeEntityControl", (entity: ControlledEntity) => {
      this.inputManager.setControlledEntity(entity);
      logAutopoiesis.info(`Manual control switched to: ${entity}`);
    });
  }

  private handleManualControl() {
    const isaEntity = this.entityManager.getEntity("isa");
    const stevEntity = this.entityManager.getEntity("stev");

    if (isaEntity && stevEntity) {
      this.inputManager.processMovementInput(isaEntity, stevEntity);
    }
  }

  private handleEntityAction() {
    const controlledEntity = this.inputManager.getControlledEntity();
    logAutopoiesis.info("🎮 Acción de entidad solicitada", {
      controlledEntity,
    });

    if (controlledEntity !== "none") {
      const entity = this.entityManager.getEntity(controlledEntity);
      if (entity) {
        // Si está cerca de comida, intentar comer
        const nearbyFood = this.findNearbyFood(entity.getPosition());
        logAutopoiesis.info("🔍 Buscando comida cercana", {
          entityId: controlledEntity,
          nearbyFood,
          entityMoney: entity.getStats().money,
        });

        if (nearbyFood) {
          logAutopoiesis.info("🍽️ Intentando comer", {
            entityId: controlledEntity,
            foodId: nearbyFood,
          });
          this.tryToEat(controlledEntity, nearbyFood);
        } else {
          logAutopoiesis.info("🎯 Acción manual (sin comida cercana)", {
            entityId: controlledEntity,
          });
          this.handlePlayerInteraction(controlledEntity, "manual_action");
        }
      }
    }
  }

  /**
   * Actualiza el sistema de comida (optimizado)
   */
  private updateFoodSystem(): void {
    const completedActions = this.foodSystem.updateEatingActions();

    // Solo procesar si hay acciones completadas para evitar trabajo innecesario
    if (completedActions.length === 0) {
      return;
    }

    // Aplicar efectos de comida completada
    completedActions.forEach(({ entityId, food }) => {
      const entity = this.entityManager.getEntity(entityId as "isa" | "stev");
      if (entity) {
        const currentStats = entity.getStats();
        const newStats = this.foodSystem.applyFoodEffects(currentStats, food);

        // ✅ APLICAR LOS NUEVOS STATS A LA ENTIDAD
        entity.setStats(newStats);

        logAutopoiesis.info("Aplicando efectos de comida", {
          entityId,
          foodId: food.id,
          statsChange: {
            hunger: `${currentStats.hunger} → ${newStats.hunger}`,
            happiness: `${currentStats.happiness} → ${newStats.happiness}`,
            energy: `${currentStats.energy} → ${newStats.energy}`,
            health: `${currentStats.health} → ${newStats.health}`,
          },
        });
      }
    });
  }

  /**
   * Busca comida cercana a una posición
   */
  private findNearbyFood(_position: { x: number; y: number }): string | null {
    // Por ahora, simplificar y usar comida básica si hay dinero
    // Buscar para la entidad controlada actualmente
    const controlledEntity = this.inputManager.getControlledEntity();
    if (controlledEntity === "none") return null;

    const entity = this.entityManager.getEntity(controlledEntity);
    if (entity && entity.getStats().money >= 5) {
      return "bread"; // Comida básica disponible
    }
    return null;
  }

  /**
   * Intenta hacer que una entidad coma
   */
  private tryToEat(entityId: string, foodId: string): void {
    const entity = this.entityManager.getEntity(entityId as "isa" | "stev");
    if (!entity) return;

    const position = entity.getPosition();
    const stats = entity.getStats();

    // Verificar si puede comprar la comida
    const food = this.foodSystem.getInventory().hasFood(foodId);
    if (!food) {
      const purchaseResult = this.foodSystem.buyFood(foodId, 1, stats.money);
      if (!purchaseResult.success) {
        logAutopoiesis.warn("No se pudo comprar comida", {
          entityId,
          foodId,
          money: stats.money,
        });
        return;
      }
    }

    // Iniciar acción de comer
    const success = this.foodSystem.startEating(entityId, foodId, position);
    if (success) {
      // La actividad será cambiada automáticamente por el sistema de actividades
      logAutopoiesis.info("Entidad empezó a comer", { entityId, foodId });
    }
  }

  /**
   * Configura las tiendas de comida en el mundo
   */
  private setupFoodStores(): void {
    // Crear algunas tiendas de comida en posiciones estratégicas
    const storePositions = [
      { x: 600, y: 300, foods: ["bread", "sandwich", "apple_pie"] },
      { x: 900, y: 500, foods: ["burger", "pizza", "hotdog", "frenchfries"] },
      {
        x: 300,
        y: 600,
        foods: ["icecream", "chocolate_cake", "donut", "cookies"],
      },
    ];

    storePositions.forEach((store, index) => {
      this.foodSystem.createFoodStore(store.x, store.y, store.foods);
      logAutopoiesis.info("Tienda de comida creada", {
        index,
        position: { x: store.x, y: store.y },
        foods: store.foods,
      });
    });
  }

  private updateUI() {
    const isaEntity = this.entityManager.getEntity("isa");
    const stevEntity = this.entityManager.getEntity("stev");

    // Crear hash simple para detectar cambios y evitar actualizaciones innecesarias
    const currentStateHash = JSON.stringify({
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      isa: isaEntity
        ? {
            activity: isaEntity.getCurrentActivity(),
            mood: isaEntity.getMood(),
            health: isaEntity.getStats().health,
            energy: isaEntity.getStats().energy,
          }
        : null,
      stev: stevEntity
        ? {
            activity: stevEntity.getCurrentActivity(),
            mood: stevEntity.getMood(),
            health: stevEntity.getStats().health,
            energy: stevEntity.getStats().energy,
          }
        : null,
    });

    // Solo actualizar si hay cambios reales
    if (
      this.cachedEntityData &&
      this.cachedEntityData.hash === currentStateHash
    ) {
      return; // No hay cambios, evitar actualización
    }

    // Construir datos completos solo cuando hay cambios
    const entityData = {
      isa: isaEntity
        ? {
            stats: isaEntity.getStats(),
            activity: isaEntity.getCurrentActivity(),
            mood: isaEntity.getMood(),
            position: isaEntity.getPosition(),
          }
        : null,
      stev: stevEntity
        ? {
            stats: stevEntity.getStats(),
            activity: stevEntity.getCurrentActivity(),
            mood: stevEntity.getMood(),
            position: stevEntity.getPosition(),
          }
        : null,
    };

    // Cache para próxima comparación
    this.cachedEntityData = {
      hash: currentStateHash,
      data: entityData,
    };

    // Solo emitir evento cuando hay cambios reales
    this.events.emit("gameLogicUpdate", {
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      entities: entityData,
    });
  }

  /**
   * Get game statistics for debugging
   */
  public getGameStats() {
    return {
      logic: this.gameLogicManager?.getStats(),
      renderer: this.worldRenderer?.getStats(),
      entities: {
        total: this.entities.children.size,
        isa: this.isaEntity
          ? {
              activity: this.isaEntity.getCurrentActivity(),
              mood: this.isaEntity.getMood(),
              alive: !this.isaEntity.isDead(),
            }
          : null,
        stev: this.stevEntity
          ? {
              activity: this.stevEntity.getCurrentActivity(),
              mood: this.stevEntity.getMood(),
              alive: !this.stevEntity.isDead(),
            }
          : null,
      },
    };
  }

  /**
   * Cleanup when scene is destroyed
   */
  destroy(): void {
    if (this.gameLogicManager) {
      this.gameLogicManager.destroy();
    }

    if (this.worldRenderer) {
      this.worldRenderer.destroy();
    }

    if (this.dialogueSystem) {
      this.dialogueSystem.destroy();
    }

    logAutopoiesis.info("MainScene destroyed");
  }
}
