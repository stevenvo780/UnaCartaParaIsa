import Phaser from 'phaser';
import type { GameState } from '../types';
import { gameConfig } from '../config/gameConfig';
import { GAME_BALANCE } from '../constants/gameBalance';
import { AnimatedGameEntity } from '../entities/AnimatedGameEntity';
import { DialogueSystem } from '../systems/DialogueSystem';
import { GameLogicManager } from '../managers/GameLogicManager';
import { WorldRenderer } from '../managers/WorldRenderer';
import { generateValidatedMap } from '../utils/simpleMapGeneration';
import { logAutopoiesis } from '../utils/logger';

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private entities!: Phaser.Physics.Arcade.Group;
  private isaEntity!: AnimatedGameEntity;
  private stevEntity!: AnimatedGameEntity;
  private dialogueSystem!: DialogueSystem;
  private gameLogicManager!: GameLogicManager;
  private worldRenderer!: WorldRenderer;
  private controlledEntity: 'isa' | 'stev' | 'none' = 'none';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private generatedWorldData?: any; // Datos del mundo generado para tilemaps

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    logAutopoiesis.info('MainScene initialized');
    

    const mapData = generateValidatedMap();
    
    // Guardar datos del mundo generado para el renderizador de tilemaps
    this.generatedWorldData = mapData.generatedWorld;
    
    this.gameState = {
      entities: [],
      resonance: 0,
      cycles: 0,
      lastSave: Date.now(),
      togetherTime: 0,
      connectionAnimation: {
        active: false,
        startTime: 0,
        type: 'FEED'
      },
      zones: mapData.zones,
      mapElements: mapData.mapElements,
      currentConversation: {
        isActive: false,
        participants: [],
        lastSpeaker: null,
        lastDialogue: null,
        startTime: 0
      },
      terrainTiles: [],
      roads: [],
      objectLayers: [],
      worldSize: { 
        width: GAME_BALANCE.WORLD.DEFAULT_WIDTH, 
        height: GAME_BALANCE.WORLD.DEFAULT_HEIGHT 
      },
      generatorVersion: '2.0.0'
    };


    this.registry.set('gameState', this.gameState);
  }

  async create() {
    logAutopoiesis.info('Creating main game world');


    this.entities = this.physics.add.group();


    await this.initializeManagers();


    this.dialogueSystem = new DialogueSystem(this);


    this.createInitialEntities();

    this.setupCamera();
    
    this.setupInput();
    
    this.setupUIEvents();

    logAutopoiesis.info('MainScene created successfully', {
      entities: this.entities.children.size,
      zones: this.gameState.zones.length,
      worldSize: this.gameState.worldSize
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
    

    this.gameLogicManager.on('gameLogicUpdate', (data: any) => {
      this.events.emit('gameLogicUpdate', data);
    });
    
    logAutopoiesis.debug('All managers initialized');
  }

  /**
   * Setup camera bounds and zoom
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(
      0, 0, 
      this.gameState.worldSize.width, 
      this.gameState.worldSize.height
    );
    this.cameras.main.setZoom(1);
    
    logAutopoiesis.debug('Camera configured', {
      bounds: this.gameState.worldSize
    });
  }

  private createInitialEntities() {

    this.isaEntity = new AnimatedGameEntity(
      this, 
      gameConfig.entityCircleInitialX, 
      gameConfig.entityCircleInitialY, 
      'isa'
    );
    

    this.stevEntity = new AnimatedGameEntity(
      this, 
      gameConfig.entitySquareInitialX, 
      gameConfig.entitySquareInitialY, 
      'stev'
    );


    this.entities.add(this.isaEntity);
    this.entities.add(this.stevEntity);


    this.isaEntity.setPartnerEntity(this.stevEntity);
    this.stevEntity.setPartnerEntity(this.isaEntity);


    this.gameLogicManager.registerEntity('isa', this.isaEntity);
    this.gameLogicManager.registerEntity('stev', this.stevEntity);

    logAutopoiesis.info('Initial entities created and registered', {
      entities: ['isa', 'stev'],
      hasResonancePartnership: true
    });
  }













  /**
   * Maneja interacciones del jugador
   */
  public handlePlayerInteraction(entityId: string, interactionType: string) {

    this.gameLogicManager.handlePlayerInteraction(entityId, interactionType);
    

    this.dialogueSystem.handlePlayerInteraction(entityId, interactionType);
    
    logAutopoiesis.info('Player interaction handled', {
      entityId,
      interactionType
    });
  }

  update() {
    if (this.worldRenderer) {
      this.worldRenderer.updateVisuals();
    }
    
    this.handleManualControl();
    this.updateUI();
  }
  
  private setupInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as any;
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.controlledEntity !== 'none') {
        this.handleEntityAction();
      }
    });
  }
  
  private setupUIEvents() {
    this.events.on('changeEntityControl', (entity: 'isa' | 'stev' | 'none') => {
      this.controlledEntity = entity;
      logAutopoiesis.info(`Manual control switched to: ${entity}`);
    });
  }
  
  private handleManualControl() {
    if (this.controlledEntity === 'none' || !this.cursors) return;
    
    const entity = this.controlledEntity === 'isa' ? this.isaEntity : this.stevEntity;
    if (!entity || !entity.body) return;
    
    const speed = 150;
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.cursors.left.isDown) velocityX = -speed;
    else if (this.cursors.right.isDown) velocityX = speed;
    
    if (this.cursors.up.isDown) velocityY = -speed;
    else if (this.cursors.down.isDown) velocityY = speed;
    
    entity.setVelocity(velocityX, velocityY);
    
    // Override control mode for manual movement
    const entityData = entity.getEntityData();
    if (velocityX !== 0 || velocityY !== 0) {
      (entityData as any).controlMode = 'manual';
    } else {
      (entityData as any).controlMode = 'autonomous';
    }
  }
  
  private handleEntityAction() {
    // Simple interaction when spacebar is pressed
    if (this.controlledEntity !== 'none') {
      this.handlePlayerInteraction(this.controlledEntity, 'manual_action');
    }
  }
  
  private updateUI() {
    // Send entity data to UI
    const entityData = {
      isa: this.isaEntity ? {
        stats: this.isaEntity.getStats(),
        activity: this.isaEntity.getCurrentActivity(),
        mood: this.isaEntity.getMood(),
        position: this.isaEntity.getPosition()
      } : null,
      stev: this.stevEntity ? {
        stats: this.stevEntity.getStats(),
        activity: this.stevEntity.getCurrentActivity(),
        mood: this.stevEntity.getMood(),
        position: this.stevEntity.getPosition()
      } : null
    };
    
    this.events.emit('gameLogicUpdate', {
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      entities: entityData
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
        isa: this.isaEntity ? {
          activity: this.isaEntity.getCurrentActivity(),
          mood: this.isaEntity.getMood(),
          alive: !this.isaEntity.isDead()
        } : null,
        stev: this.stevEntity ? {
          activity: this.stevEntity.getCurrentActivity(),
          mood: this.stevEntity.getMood(),
          alive: !this.stevEntity.isDead()
        } : null
      }
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
    super.destroy();
  }
}
