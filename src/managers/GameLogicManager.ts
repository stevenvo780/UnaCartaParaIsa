/**
 * Game Logic Manager - Maneja la lógica del juego separada del rendering
 * Centraliza actualizaciones, timers y estado del juego
 */

import { gameConfig } from "../config/gameConfig";
import { GAME_BALANCE } from "../config/gameConfig";
import type {
  Entity,
  EntityStats,
  GameEvents,
  GameLogicUpdateData,
  GameState,
  IGameLogicManager,
} from "../types";
import { EntityManager } from "./EntityManager";
import { logAutopoiesis } from "../utils/logger";

export class GameLogicManager implements IGameLogicManager {
  private _scene: Phaser.Scene;
  private _gameState: GameState;
  private _gameLoopTimer?: Phaser.Time.TimerEvent;
  private _entityManager: EntityManager;
  private _eventEmitter: Phaser.Events.EventEmitter;

  public constructor(scene: Phaser.Scene, initialGameState: GameState) {
    this._scene = scene;
    this._gameState = initialGameState;
    this._entityManager = new EntityManager();
    this._eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * Initialize the game logic system
   */
  public initialize(): void {
    this._setupGameLoop();
    logAutopoiesis.info("GameLogicManager initialized", {
      entities: this._gameState.entities.length,
      zones: this._gameState.zones.length,
    });
  }

  /**
   * Update method required by IGameLogicManager
   */
  public update(_deltaTime: number): void {
    // The actual update logic is handled by the timer-based game loop
    // This method exists to satisfy the interface requirement
  }

  /**
   * Setup main game logic timer
   */
  private _setupGameLoop(): void {
    this._gameLoopTimer = this._scene.time.addEvent({
      delay: gameConfig.timing.mainGameLogic,
      callback: this._updateGameLogic,
      callbackScope: this,
      loop: true,
    });

    logAutopoiesis.debug("Game logic loop started", {
      interval: gameConfig.timing.mainGameLogic,
    });
  }

  /**
   * Main game logic update - separated from rendering
   */
  private _updateGameLogic(): void {
    this._gameState.cycles++;

    this._entityManager.getAllEntities().forEach((entity) => {
      // Check if entity has updateEntity method (AnimatedGameEntity)
      if (
        entity &&
        typeof entity === "object" &&
        "updateEntity" in entity &&
        typeof entity.updateEntity === "function"
      ) {
        entity.updateEntity(gameConfig.timing.mainGameLogic);
      }
    });

    this._updateResonance();

    const isaEntity = this._entityManager.getEntity("isa");
    const stevEntity = this._entityManager.getEntity("stev");

    // Get entity data safely
    const getEntityData = (entity: unknown): Entity | null => {
      if (!entity) return null;
      if (
        typeof entity === "object" &&
        "getEntityData" in entity &&
        typeof entity.getEntityData === "function"
      ) {
        return entity.getEntityData();
      }
      // Assume it's already Entity data
      return entity as Entity;
    };

    const isaData = getEntityData(isaEntity);
    const stevData = getEntityData(stevEntity);

    const entityArray = Array.from(
      this._entityManager.getAllEntities().values(),
    )
      .map((entity) => getEntityData(entity))
      .filter(Boolean);

    const updateData: GameLogicUpdateData = {
      entities: entityArray,
      cycles: this._gameState.cycles,
      resonance: this._gameState.resonance,
      deltaTime: gameConfig.timing.mainGameLogic,
      togetherTime: this._gameState.togetherTime,
      isaStats: isaData?.stats ?? ({} as EntityStats),
      stevStats: stevData?.stats ?? ({} as EntityStats),
    };

    this.emit("gameLogicUpdate", updateData);

    if (this._gameState.cycles % GAME_BALANCE.CYCLE_LOG_FREQUENCY === 0) {
      this._logGameStatus();
    }
  }

  /**
   * Update resonance calculations between entities
   */
  private _updateResonance(): void {
    const isaEntity = this._entityManager.getEntity("isa");
    const stevEntity = this._entityManager.getEntity("stev");

    if (isaEntity && stevEntity) {
      // Get entity data safely
      const getEntityData = (entity: unknown): Entity | null => {
        if (!entity) return null;
        if (
          typeof entity === "object" &&
          "getEntityData" in entity &&
          typeof entity.getEntityData === "function"
        ) {
          return entity.getEntityData();
        }
        return entity as Entity;
      };

      const isaData = getEntityData(isaEntity);
      const stevData = getEntityData(stevEntity);

      if (isaData && stevData) {
        const isaResonance = isaData.resonance ?? 0;
        const stevResonance = stevData.resonance ?? 0;

        this._gameState.resonance = (isaResonance + stevResonance) / 2;

        const isaPos = isaData.position ?? { x: 0, y: 0 };
        const stevPos = stevData.position ?? { x: 0, y: 0 };
        const distance = Math.sqrt(
          Math.pow(isaPos.x - stevPos.x, 2) + Math.pow(isaPos.y - stevPos.y, 2),
        );

        if (distance < 100) {
          this._gameState.togetherTime += gameConfig.timing.mainGameLogic;
        }
      }
    }
  }

  /**
   * Register an entity for game logic updates
   */
  public registerEntity(entityId: string, entity: any): void {
    this._entityManager.registerEntity(entityId, entity);
    logAutopoiesis.debug(`Entity registered: ${entityId}`);
  }

  /**
   * Unregister an entity
   */
  public unregisterEntity(entityId: string): void {
    if (this._entityManager.hasEntity(entityId)) {
      this._entityManager.unregisterEntity(entityId);
      logAutopoiesis.debug(`Entity unregistered: ${entityId}`);
    }
  }

  /**
   * Handle player interactions with entities
   */
  public handlePlayerInteraction(
    entityId: string,
    interactionType: string,
  ): void {
    const entity = this._entityManager.getEntity(entityId);
    if (!entity) {
      logAutopoiesis.warn(
        `Player interaction failed - entity not found: ${entityId}`,
      );
      return;
    }

    this._gameState.connectionAnimation = {
      active: true,
      startTime: Date.now(),
      type: interactionType as any,
      entityId,
    };

    this.emit("playerInteraction", {
      entityId,
      interactionType,
      timestamp: Date.now(),
    });

    logAutopoiesis.info("Player interaction processed", {
      entityId,
      interactionType,
      resonance: this._gameState.resonance,
    });
  }

  /**
   * Get current game state (read-only copy)
   */
  public getGameState(): GameState {
    return { ...this._gameState };
  }

  /**
   * Get specific entity by ID
   */
  public getEntity(entityId: string): Entity | undefined {
    return this._entityManager.getEntity(entityId);
  }

  /**
   * Get all registered entities
   */
  public getEntities(): Entity[] {
    return this._entityManager.getEntities();
  }

  public getAllEntities(): Map<string, Entity> {
    return this._entityManager.getAllEntities();
  }

  /**
   * Subscribe to game logic events
   */
  public on<K extends keyof GameEvents>(
    event: K,
    listener: (data: GameEvents[K]) => void,
    context?: any,
  ): void {
    this._eventEmitter.on(event, listener, context);
  }

  /**
   * Unsubscribe from game logic events
   */
  public off<K extends keyof GameEvents>(
    event: K,
    listener?: (data: GameEvents[K]) => void,
    context?: any,
  ): void {
    this._eventEmitter.off(event, listener, context);
  }

  /**
   * Emit typed event
   */
  public emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this._eventEmitter.emit(event, data);
  }

  /**
   * Pause game logic updates
   */
  public pause(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.paused = true;
      logAutopoiesis.info("Game logic paused");
    }
  }

  /**
   * Resume game logic updates
   */
  public resume(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.paused = false;
      logAutopoiesis.info("Game logic resumed");
    }
  }

  /**
   * Change game speed multiplier
   */
  public setGameSpeed(multiplier: number): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.destroy();
      const newDelay = gameConfig.timing.mainGameLogic / multiplier;
      this._gameLoopTimer = this._scene.time.addEvent({
        delay: newDelay,
        callback: () => {
          this._updateGameLogic();
        },
        loop: true,
      });
      logAutopoiesis.info(`Game speed set to ${multiplier}x`, {
        newDelay,
      });
    }
  }

  /**
   * Log current game status for debugging
   */
  private _logGameStatus(): void {
    const entityStates = this._entityManager.exportEntityStates();

    logAutopoiesis.info(`Game cycle ${this._gameState.cycles}`, {
      resonance: this._gameState.resonance.toFixed(2),
      togetherTime: Math.floor(this._gameState.togetherTime / 1000),
      entities: entityStates,
    });
  }

  /**
   * Get performance statistics
   */
  public getStats(): {
    cycles: number;
    resonance: number;
    entities: number;
    togetherTime: number;
    uptime: number;
  } {
    return {
      cycles: this._gameState.cycles,
      resonance: this._gameState.resonance,
      entities: this._entityManager.getAllEntities().size,
      togetherTime: this._gameState.togetherTime,
      uptime: Date.now() - this._gameState.lastSave,
    };
  }

  /**
   * Cleanup when destroying the manager
   */
  public destroy(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.destroy();
    }

    this._entityManager.clearAllEntities();
    this._eventEmitter.removeAllListeners();

    logAutopoiesis.info("GameLogicManager destroyed");
  }
}
