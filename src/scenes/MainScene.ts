import Phaser from 'phaser';
import type { GameState, GeneratedWorldData, GameLogicUpdateData } from '../types';
import { AnimatedGameEntity } from '../entities/AnimatedGameEntity';
import { DialogueSystem } from '../systems/DialogueSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { QuestController } from '../systems/QuestController';
import { GameLogicManager } from '../managers/GameLogicManager';
import { WorldRenderer } from '../managers/WorldRenderer';
import { SceneInitializationManager } from '../managers/SceneInitializationManager';
import { EntityManager } from '../managers/EntityManager';
import { InputManager, type ControlledEntity } from '../managers/InputManager';
import { FoodAssetManager } from '../managers/FoodAssetManager';
import { FoodSystem } from '../systems/FoodSystem';
import { QuestUI } from '../components/QuestUI';
import { logAutopoiesis } from '../utils/logger';

export class MainScene extends Phaser.Scene {
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
    super({ key: 'MainScene' });
  }

  init() {
    logAutopoiesis.info('MainScene initialized');

    const initResult = SceneInitializationManager.initialize();
    this.gameState = initResult.gameState;
    this.generatedWorldData = initResult.generatedWorldData;

    this.registry.set('gameState', this.gameState);
  }

  async create() {
    logAutopoiesis.info('Creating main game world');

    // Initialize managers and systems
    this.entityManager = new EntityManager(this);
    this.inputManager = new InputManager(this);
    this.foodAssetManager = new FoodAssetManager(this);
    this.foodSystem = new FoodSystem(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.questSystem = new QuestSystem(this);
    this.questController = new QuestController(this, this.questSystem, this.dialogueSystem);
    this.questUI = new QuestUI(this);

    await this.initializeManagers();

    // Create entities using EntityManager
    const { isaEntity, stevEntity } = this.entityManager.createEntities(this.gameState);

    // Store entity references for game stats
    this.isaEntity = isaEntity;
    this.stevEntity = stevEntity;
    this.entities = this.entityManager.getEntitiesGroup();

    // Setup partner relationships and register with GameLogicManager
    isaEntity.setPartnerEntity(stevEntity);
    stevEntity.setPartnerEntity(isaEntity);
    this.gameLogicManager.registerEntity('isa', isaEntity);
    this.gameLogicManager.registerEntity('stev', stevEntity);

    // Setup spacebar action for current controlled entity
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.handleEntityAction();
    });

    // Setup quest system controls
    this.input.keyboard?.on('keydown-Q', () => {
      this.questUI.toggleQuestPanel();
    });

    // Auto-start first quest when entities meet
    this.time.delayedCall(2000, () => {
      this.questSystem.startQuest('main_awakening');
    });

    this.setupCamera();
    this.setupUIEvents();
    this.setupFoodStores();

    logAutopoiesis.info('MainScene created successfully', {
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
    await this.worldRenderer.renderWorld(this.generatedWorldData);

    // Register systems in registry for cross-component access
    this.registry.set('gameLogicManager', this.gameLogicManager);
    this.registry.set('questSystem', this.questSystem);
    this.registry.set('dialogueSystem', this.dialogueSystem);

    this.gameLogicManager.on('gameLogicUpdate', (data: GameLogicUpdateData) => {
      this.events.emit('gameLogicUpdate', data);
    });

    logAutopoiesis.debug('All managers initialized');
  }

  /**
   * Setup camera bounds and zoom
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(
      0,
      0,
      this.gameState.worldSize.width,
      this.gameState.worldSize.height
    );
    this.cameras.main.setZoom(1);

    logAutopoiesis.debug('Camera configured', {
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

    logAutopoiesis.info('Player interaction handled', {
      entityId,
      interactionType,
    });
  }

  update() {
    if (this.worldRenderer) {
      this.worldRenderer.updateVisuals();
    }

    this.handleManualControl();
    this.updateFoodSystem();
    this.updateUI();
  }

  // Método obsoleto - ahora manejado por InputManager

  private setupUIEvents() {
    this.events.on('changeEntityControl', (entity: ControlledEntity) => {
      this.inputManager.setControlledEntity(entity);
      logAutopoiesis.info(`Manual control switched to: ${entity}`);
    });
  }

  private handleManualControl() {
    const isaEntity = this.entityManager.getEntity('isa');
    const stevEntity = this.entityManager.getEntity('stev');

    if (isaEntity && stevEntity) {
      this.inputManager.processMovementInput(isaEntity, stevEntity);
    }
  }

  private handleEntityAction() {
    const controlledEntity = this.inputManager.getControlledEntity();
    if (controlledEntity !== 'none') {
      const entity = this.entityManager.getEntity(controlledEntity);
      if (entity) {
        // Si está cerca de comida, intentar comer
        const nearbyFood = this.findNearbyFood(entity.getPosition());
        if (nearbyFood) {
          this.tryToEat(controlledEntity, nearbyFood);
        } else {
          this.handlePlayerInteraction(controlledEntity, 'manual_action');
        }
      }
    }
  }

  /**
   * Actualiza el sistema de comida
   */
  private updateFoodSystem(): void {
    const completedActions = this.foodSystem.updateEatingActions();

    // Aplicar efectos de comida completada
    completedActions.forEach(({ entityId, food }) => {
      const entity = this.entityManager.getEntity(entityId as 'isa' | 'stev');
      if (entity) {
        const currentStats = entity.getStats();
        const newStats = this.foodSystem.applyFoodEffects(currentStats, food);

        // Actualizar stats de la entidad (esto debería hacerse a través de un método en la entidad)
        logAutopoiesis.info('Aplicando efectos de comida', {
          entityId,
          foodId: food.id,
          statsChange: newStats,
        });
      }
    });
  }

  /**
   * Busca comida cercana a una posición
   */
  private findNearbyFood(position: { x: number; y: number }): string | null {
    // Por ahora, simplificar y usar comida básica si hay dinero
    const entity = this.entityManager.getEntity('isa'); // Asumiendo que buscamos para Isa
    if (entity && entity.getStats().money >= 5) {
      return 'bread'; // Comida básica disponible
    }
    return null;
  }

  /**
   * Intenta hacer que una entidad coma
   */
  private tryToEat(entityId: string, foodId: string): void {
    const entity = this.entityManager.getEntity(entityId as 'isa' | 'stev');
    if (!entity) return;

    const position = entity.getPosition();
    const stats = entity.getStats();

    // Verificar si puede comprar la comida
    const food = this.foodSystem.getInventory().hasFood(foodId);
    if (!food) {
      const purchaseResult = this.foodSystem.buyFood(foodId, 1, stats.money);
      if (!purchaseResult.success) {
        logAutopoiesis.warn('No se pudo comprar comida', {
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
      // Cambiar actividad a EATING
      const { activityComponent } = entity as any;
      if (activityComponent) {
        activityComponent.setActivity('EATING');
      }

      logAutopoiesis.info('Entidad empezó a comer', { entityId, foodId });
    }
  }

  /**
   * Configura las tiendas de comida en el mundo
   */
  private setupFoodStores(): void {
    // Crear algunas tiendas de comida en posiciones estratégicas
    const storePositions = [
      { x: 600, y: 300, foods: ['bread', 'sandwich', 'apple_pie'] },
      { x: 900, y: 500, foods: ['burger', 'pizza', 'hotdog', 'frenchfries'] },
      {
        x: 300,
        y: 600,
        foods: ['icecream', 'chocolate_cake', 'donut', 'cookies'],
      },
    ];

    storePositions.forEach((store, index) => {
      this.foodSystem.createFoodStore(store.x, store.y, store.foods);
      logAutopoiesis.info('Tienda de comida creada', {
        index,
        position: { x: store.x, y: store.y },
        foods: store.foods,
      });
    });
  }

  private updateUI() {
    const isaEntity = this.entityManager.getEntity('isa');
    const stevEntity = this.entityManager.getEntity('stev');

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

    this.events.emit('gameLogicUpdate', {
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

    logAutopoiesis.info('MainScene destroyed');
  }
}
