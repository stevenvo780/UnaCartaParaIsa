/**
 * Game Logic Manager - Maneja la lógica del juego separada del rendering
 * Centraliza actualizaciones, timers y estado del juego
 */

import type { GameState } from '../types';
import { gameConfig } from '../config/gameConfig';
import { GAME_BALANCE } from '../constants/gameBalance';
import { logAutopoiesis } from '../utils/logger';

export interface GameUpdateData {
  cycles: number;
  resonance: number;
  isaStats: any;
  stevStats: any;
}

export class GameLogicManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private gameLoopTimer?: Phaser.Time.TimerEvent;
  private entities: Map<string, any> = new Map();
  private eventEmitter: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene, initialGameState: GameState) {
    this.scene = scene;
    this.gameState = initialGameState;
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * Initialize the game logic system
   */
  public initialize(): void {
    this.setupGameLoop();
    logAutopoiesis.info('GameLogicManager initialized', {
      entities: this.gameState.entities.length,
      zones: this.gameState.zones.length
    });
  }

  /**
   * Setup main game logic timer
   */
  private setupGameLoop(): void {
    this.gameLoopTimer = this.scene.time.addEvent({
      delay: gameConfig.timing.mainGameLogic,
      callback: this.updateGameLogic,
      callbackScope: this,
      loop: true
    });

    logAutopoiesis.debug(`Game logic loop started`, {
      interval: gameConfig.timing.mainGameLogic
    });
  }

  /**
   * Main game logic update - separated from rendering
   */
  private updateGameLogic(): void {

    this.gameState.cycles++;
    

    this.entities.forEach((entity) => {
      if (entity.updateEntity && typeof entity.updateEntity === 'function') {
        entity.updateEntity(gameConfig.timing.mainGameLogic);
      }
    });


    this.updateResonance();
    

    const updateData: GameUpdateData = {
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      isaStats: this.entities.get('isa')?.getStats() || {},
      stevStats: this.entities.get('stev')?.getStats() || {}
    };
    
    this.eventEmitter.emit('gameLogicUpdate', updateData);


    if (this.gameState.cycles % GAME_BALANCE.CYCLE_LOG_FREQUENCY === 0) {
      this.logGameStatus();
    }
  }

  /**
   * Update resonance calculations between entities
   */
  private updateResonance(): void {
    const isaEntity = this.entities.get('isa');
    const stevEntity = this.entities.get('stev');

    if (isaEntity && stevEntity) {

      const isaResonance = isaEntity.getResonance?.() || 0;
      const stevResonance = stevEntity.getResonance?.() || 0;
      

      this.gameState.resonance = (isaResonance + stevResonance) / 2;
      

      const isaPos = isaEntity.getPosition?.() || { x: 0, y: 0 };
      const stevPos = stevEntity.getPosition?.() || { x: 0, y: 0 };
      const distance = Math.sqrt(
        Math.pow(isaPos.x - stevPos.x, 2) + Math.pow(isaPos.y - stevPos.y, 2)
      );
      
      if (distance < 100) {
        this.gameState.togetherTime += gameConfig.timing.mainGameLogic;
      }
    }
  }

  /**
   * Register an entity for game logic updates
   */
  public registerEntity(entityId: string, entity: any): void {
    this.entities.set(entityId, entity);
    logAutopoiesis.debug(`Entity registered: ${entityId}`);
  }

  /**
   * Unregister an entity
   */
  public unregisterEntity(entityId: string): void {
    if (this.entities.has(entityId)) {
      this.entities.delete(entityId);
      logAutopoiesis.debug(`Entity unregistered: ${entityId}`);
    }
  }

  /**
   * Handle player interactions with entities
   */
  public handlePlayerInteraction(entityId: string, interactionType: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      logAutopoiesis.warn(`Player interaction failed - entity not found: ${entityId}`);
      return;
    }


    this.gameState.connectionAnimation = {
      active: true,
      startTime: Date.now(),
      type: interactionType as any,
      entityId
    };


    this.eventEmitter.emit('playerInteraction', {
      entityId,
      interactionType,
      timestamp: Date.now()
    });

    logAutopoiesis.info('Player interaction processed', {
      entityId,
      interactionType,
      resonance: this.gameState.resonance
    });
  }

  /**
   * Get current game state (read-only copy)
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get specific entity by ID
   */
  public getEntity(entityId: string): any {
    return this.entities.get(entityId);
  }

  /**
   * Get all registered entities
   */
  public getAllEntities(): Map<string, any> {
    return new Map(this.entities);
  }

  /**
   * Subscribe to game logic events
   */
  public on(event: string, listener: Function, context?: any): void {
    this.eventEmitter.on(event, listener, context);
  }

  /**
   * Unsubscribe from game logic events
   */
  public off(event: string, listener?: Function, context?: any): void {
    this.eventEmitter.off(event, listener, context);
  }

  /**
   * Pause game logic updates
   */
  public pause(): void {
    if (this.gameLoopTimer) {
      this.gameLoopTimer.paused = true;
      logAutopoiesis.info('Game logic paused');
    }
  }

  /**
   * Resume game logic updates
   */
  public resume(): void {
    if (this.gameLoopTimer) {
      this.gameLoopTimer.paused = false;
      logAutopoiesis.info('Game logic resumed');
    }
  }

  /**
   * Change game speed multiplier
   */
  public setGameSpeed(multiplier: number): void {
    if (this.gameLoopTimer) {
      this.gameLoopTimer.destroy();
      const newDelay = gameConfig.timing.mainGameLogic / multiplier;
      this.gameLoopTimer = this.scene.time.addEvent({
        delay: newDelay,
        callback: () => this.updateGameLogic(),
        loop: true
      });
      logAutopoiesis.info(`Game speed set to ${multiplier}x`, {
        newDelay: newDelay
      });
    }
  }

  /**
   * Log current game status for debugging
   */
  private logGameStatus(): void {
    const entityStates = Array.from(this.entities.entries()).map(([id, entity]) => ({
      id,
      activity: entity.getCurrentActivity?.() || 'unknown',
      mood: entity.getMood?.() || 'unknown',
      alive: !entity.isDead?.()
    }));

    logAutopoiesis.info(`Game cycle ${this.gameState.cycles}`, {
      resonance: this.gameState.resonance.toFixed(2),
      togetherTime: Math.floor(this.gameState.togetherTime / 1000),
      entities: entityStates
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
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      entities: this.entities.size,
      togetherTime: this.gameState.togetherTime,
      uptime: Date.now() - this.gameState.lastSave
    };
  }

  /**
   * Cleanup when destroying the manager
   */
  public destroy(): void {
    if (this.gameLoopTimer) {
      this.gameLoopTimer.destroy();
    }
    
    this.entities.clear();
    this.eventEmitter.removeAllListeners();
    
    logAutopoiesis.info('GameLogicManager destroyed');
  }
}