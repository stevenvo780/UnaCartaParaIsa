import Phaser from "phaser";
import { QuestUI } from "../components/QuestUI";
import { DialogueCardUI } from "../components/DialogueCardUI";
import { DayNightUI } from "../components/DayNightUI";
import { SystemStatusUI } from "../components/SystemStatusUI";
import { AnimatedGameEntity } from "../entities/AnimatedGameEntity";
import { EntityManager } from "../managers/EntityManager";
import { GameLogicManager } from "../managers/GameLogicManager";
import { InputManager, type ControlledEntity } from "../managers/InputManager";
import { SceneInitializationManager } from "../managers/SceneInitializationManager";
import { UnifiedAssetManager } from "../managers/UnifiedAssetManager";
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
  // 🚀 MEGA-OPTIMIZACIONES de rendimiento para 60 FPS
  private readonly uiUpdateInterval = 500; // ⚡ AUMENTADO: de 200ms a 500ms
  private readonly foodUpdateInterval = 300; // ⚡ AUMENTADO: de 100ms a 300ms
  private lastUIUpdate = 0;
  private lastFoodUpdate = 0;
  private lastWorldUpdate = 0; // NUEVO: Para throttling de WorldRenderer
  private cachedEntityData: Record<string, unknown> | null = null; // Cache para evitar recrear objetos
  private gameState!: GameState;
  private dialogueSystem!: DialogueSystem;
  private questSystem!: QuestSystem;
  private questController!: QuestController;
  private questUI!: QuestUI;
  private dialogueCardUI!: DialogueCardUI;
  private dayNightUI!: DayNightUI;
  private systemStatusUI!: SystemStatusUI;
  private gameLogicManager!: GameLogicManager;
  private worldRenderer!: WorldRenderer;
  private entityManager!: EntityManager;
  private inputManager!: InputManager;
  private unifiedAssetManager!: UnifiedAssetManager;
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

    // Obtener el manager unificado del registry
    this.unifiedAssetManager = this.registry.get("unifiedAssetManager");
    if (!this.unifiedAssetManager) {
      logAutopoiesis.error("UnifiedAssetManager no encontrado en registry");
      return;
    }

    // Initialize managers and systems
    this.entityManager = new EntityManager(this);
    this.inputManager = new InputManager(this);
    this.foodSystem = new FoodSystem(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.questSystem = new QuestSystem(this);
    this.questController = new QuestController(
      this,
      this.questSystem,
      this.dialogueSystem,
    );
    this.questUI = new QuestUI(this);
    this.dialogueCardUI = new DialogueCardUI(this, 50, 50);
    this.dayNightUI = new DayNightUI(this, 20, 20);
    this.systemStatusUI = new SystemStatusUI(this, 20, 160);

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

    // Conectar InputManager con GameLogicManager para control dual
    this.inputManager.setGameLogicManager(this.gameLogicManager);

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

    // Setup dialogue card system controls (M key handled by DialogueCardUI)
    // Day/Night UI controls (T key handled by DayNightUI)
    // System Status UI controls (E key handled by SystemStatusUI)

    // Controles adicionales para el control dual
    this.input.keyboard?.on("keydown-H", () => {
      // Ayuda rápida - mostrar qué entidad está controlada por IA
      const aiControlled = this.inputManager.getAIControlledEntity();
      const playerControlled = this.inputManager.getControlledEntity();

      logAutopoiesis.info("🎮 Estado del Control Dual", {
        jugador: playerControlled,
        ia: aiControlled,
        controles:
          "TAB=cambiar, H=ayuda, C=seguir cámara, T=tiempo, M=cartas, E=emergencia",
      });
    });

    // Seguir con cámara a la entidad controlada
    this.input.keyboard?.on("keydown-C", () => {
      const controlled = this.inputManager.getControlledEntity();
      if (controlled !== "none") {
        const entity = controlled === "isa" ? this.isaEntity : this.stevEntity;
        if (entity) {
          const position = entity.getPosition();
          this.cameras.main.centerOn(position.x, position.y);
          logAutopoiesis.info(`📷 Cámara siguiendo a ${controlled}`);
        }
      }
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
    await this.worldRenderer.renderWorld();

    // Register systems in registry for cross-component access
    this.registry.set("gameLogicManager", this.gameLogicManager);
    this.registry.set("questSystem", this.questSystem);
    this.registry.set("dialogueSystem", this.dialogueSystem);
    this.registry.set(
      "cardDialogueSystem",
      this.gameLogicManager.getCardDialogueSystem(),
    );
    this.registry.set("dialogueCardUI", this.dialogueCardUI);
    this.registry.set(
      "dayNightSystem",
      this.gameLogicManager.getDayNightSystem(),
    );
    this.registry.set("dayNightUI", this.dayNightUI);
    this.registry.set(
      "emergenceSystem",
      this.gameLogicManager.getEmergenceSystem(),
    );
    this.registry.set("systemStatusUI", this.systemStatusUI);

    this.gameLogicManager.on("gameLogicUpdate", (data: GameLogicUpdateData) => {
      this.events.emit("gameLogicUpdate", data);
    });

    // Setup dialogue card event handlers
    this.setupDialogueCardEventHandlers();

    logAutopoiesis.debug("All managers initialized");
  }

  /**
   * Setup dialogue card event handlers
   */
  private setupDialogueCardEventHandlers(): void {
    const cardDialogueSystem = this.gameLogicManager.getCardDialogueSystem();

    // Connect card generation to UI display
    cardDialogueSystem.onCardGenerated = (card) => {
      this.events.emit("showDialogueCard", card);
      logAutopoiesis.info("🃏 Dialogue card generated", {
        cardId: card.id,
        type: card.type,
        priority: card.priority,
        participants: card.participants,
      });
    };

    // Handle card choice selections
    this.events.on("dialogueChoiceSelected", (data: any) => {
      cardDialogueSystem.handleChoice(data.cardId, data.choice);

      // Apply choice effects immediately
      this.applyDialogueChoiceEffects(data.choice);

      logAutopoiesis.info("🎯 Dialogue choice selected", {
        cardId: data.cardId,
        choiceId: data.choice.id,
        outcome: data.choice.outcome,
      });
    });

    // Generate initial greeting cards when entities meet
    this.time.delayedCall(3000, () => {
      cardDialogueSystem.triggerEventCard("first_meeting", ["isa", "stev"]);
    });

    // Generate cards based on critical needs
    this.events.on("gameLogicUpdate", (data: GameLogicUpdateData) => {
      this.checkForCriticalNeedsCards(data);
    });

    // Generate cards when entities are close together
    this.events.on(
      "entitiesMeet",
      (data: { entities: string[]; distance: number }) => {
        if (data.distance < 100 && Math.random() < 0.3) {
          cardDialogueSystem.triggerEventCard(
            "close_interaction",
            data.entities,
          );
        }
      },
    );

    // Generate cards on player interactions
    this.gameLogicManager.on("playerInteraction", (data: any) => {
      if (Math.random() < 0.4) {
        cardDialogueSystem.triggerEventCard("player_action", [data.entityId]);
      }
    });

    logAutopoiesis.info("📋 Dialogue card event handlers configured");
  }

  /**
   * Check for critical needs and generate appropriate cards
   */
  private checkForCriticalNeedsCards(data: GameLogicUpdateData): void {
    const cardDialogueSystem = this.gameLogicManager.getCardDialogueSystem();
    const needsSystem = this.gameLogicManager.getNeedsSystem();

    ["isa", "stev"].forEach((entityId) => {
      const needs = needsSystem.getEntityNeeds(entityId);
      if (!needs) return;

      // Generate urgent cards for critical needs
      if (needs.hunger < 20 && Math.random() < 0.2) {
        cardDialogueSystem.triggerEventCard("hunger_crisis", [entityId]);
      }

      if (needs.thirst < 20 && Math.random() < 0.2) {
        cardDialogueSystem.triggerEventCard("thirst_crisis", [entityId]);
      }

      if (needs.energy < 15 && Math.random() < 0.15) {
        cardDialogueSystem.triggerEventCard("exhaustion", [entityId]);
      }

      if (needs.mentalHealth < 30 && Math.random() < 0.1) {
        cardDialogueSystem.triggerEventCard("mental_health_concern", [
          entityId,
        ]);
      }

      // Generate positive cards for good conditions
      if (needs.hunger > 80 && needs.energy > 70 && Math.random() < 0.05) {
        cardDialogueSystem.triggerEventCard("feeling_great", [entityId]);
      }
    });
  }

  /**
   * Apply effects from dialogue choice to game entities
   */
  private applyDialogueChoiceEffects(choice: any): void {
    if (!choice.effects) return;

    const needsSystem = this.gameLogicManager.getNeedsSystem();

    // Apply needs changes
    if (choice.effects.needs) {
      Object.entries(choice.effects.needs).forEach(([needType, value]) => {
        // Apply to both entities or determine target entity contextually
        ["isa", "stev"].forEach((entityId) => {
          needsSystem.modifyEntityNeed(entityId, needType, value as number);
        });
      });
    }

    // Handle movement effects
    if (choice.effects.moveTo) {
      const controlledEntity = this.inputManager.getControlledEntity();
      if (controlledEntity !== "none") {
        // Find nearest resource or specific location
        this.handleMovementCommand(controlledEntity, choice.effects.moveTo);
      }
    }

    // Handle mission unlocks
    if (choice.effects.unlocksMission) {
      this.questSystem.startQuest(choice.effects.unlocksMission);
    }
  }

  /**
   * Handle movement commands from dialogue choices
   */
  private handleMovementCommand(entityId: string, destination: string): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    switch (destination) {
      case "nearest_resource":
        // Find nearest food store or resource
        const nearestStore = this.findNearestResourceLocation(
          entity.getPosition(),
        );
        if (nearestStore) {
          logAutopoiesis.info(
            `🏃 ${entityId} moving to nearest resource`,
            nearestStore,
          );
          // Move entity toward resource (simplified)
          entity.setVelocity(
            nearestStore.x > entity.getPosition().x ? 50 : -50,
            nearestStore.y > entity.getPosition().y ? 50 : -50,
          );
        }
        break;
      case "safe_place":
        // Move to a safe zone
        logAutopoiesis.info(`🏠 ${entityId} seeking safety`);
        break;
      case "partner_location":
        // Move toward partner
        const partner = entityId === "isa" ? "stev" : "isa";
        const partnerEntity = this.entityManager.getEntity(partner);
        if (partnerEntity) {
          const partnerPos = partnerEntity.getPosition();
          logAutopoiesis.info(
            `💕 ${entityId} moving toward ${partner}`,
            partnerPos,
          );
        }
        break;
    }
  }

  /**
   * Find nearest resource location
   */
  private findNearestResourceLocation(position: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    // Simplified: return position of first food store
    const storePositions = [
      { x: 600, y: 300 },
      { x: 900, y: 500 },
      { x: 300, y: 600 },
    ];

    let nearest = storePositions[0];
    let minDistance = Phaser.Math.Distance.Between(
      position.x,
      position.y,
      nearest.x,
      nearest.y,
    );

    storePositions.forEach((store) => {
      const distance = Phaser.Math.Distance.Between(
        position.x,
        position.y,
        store.x,
        store.y,
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });

    return nearest;
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

    // ULTRA-OPTIMIZACIÓN: Reducir frecuencia dramáticamente para 60 FPS

    // Input handling - SOLO este debe ser cada frame
    this.handleManualControl();

    // WorldRenderer - REDUCIR de cada frame a cada 200ms (era updateVisuals() cada frame)
    if (this.worldRenderer && now - this.lastWorldUpdate > 200) {
      this.worldRenderer.updateVisuals();
      this.lastWorldUpdate = now;
    }

    // Food system - MANTENER throttling (ya optimizado)
    if (now - this.lastFoodUpdate > this.foodUpdateInterval) {
      this.updateFoodSystem();
      this.lastFoodUpdate = now;
    }

    // UI updates - MANTENER throttling (ya optimizado)
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

    if (this.dialogueCardUI) {
      this.dialogueCardUI.destroy();
    }

    if (this.dayNightUI) {
      this.dayNightUI.destroy();
    }

    if (this.systemStatusUI) {
      this.systemStatusUI.destroy();
    }

    logAutopoiesis.info("MainScene destroyed");
  }
}
