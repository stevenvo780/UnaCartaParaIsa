import Phaser from 'phaser';
import type { GameState } from '../types';
import { gameConfig } from '../config/gameConfig';
import { GAME_BALANCE } from '../constants/gameBalance';
import { GameEntity } from '../entities/GameEntity';
import { DialogueSystem } from '../systems/DialogueSystem';
import { GameLogicManager } from '../managers/GameLogicManager';
import { WorldRenderer } from '../managers/WorldRenderer';
import { generateValidatedMap } from '../utils/simpleMapGeneration';
import { logAutopoiesis } from '../utils/logger';

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private entities!: Phaser.Physics.Arcade.Group;
  private isaEntity!: GameEntity;
  private stevEntity!: GameEntity;
  private dialogueSystem!: DialogueSystem;
  private gameLogicManager!: GameLogicManager;
  private worldRenderer!: WorldRenderer;

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    logAutopoiesis.info('MainScene initialized');
    
    // Initialize game state with generated map
    const mapData = generateValidatedMap();
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

    // Store in registry for access from other scenes
    this.registry.set('gameState', this.gameState);
  }

  create() {
    logAutopoiesis.info('Creating main game world');

    // Setup physics groups
    this.entities = this.physics.add.group();

    // Initialize managers
    this.initializeManagers();

    // Initialize dialogue system
    this.dialogueSystem = new DialogueSystem(this);

    // Create initial entities (Isa and Stev)
    this.createInitialEntities();

    // Setup camera
    this.setupCamera();

    logAutopoiesis.info('MainScene created successfully', {
      entities: this.entities.children.size,
      zones: this.gameState.zones.length,
      worldSize: this.gameState.worldSize
    });
  }

  /**
   * Initialize all managers
   */
  private initializeManagers(): void {
    // Initialize game logic manager
    this.gameLogicManager = new GameLogicManager(this, this.gameState);
    this.gameLogicManager.initialize();

    // Initialize world renderer
    this.worldRenderer = new WorldRenderer(this, this.gameState);
    this.worldRenderer.renderWorld();
    
    // Connect game logic events to UI scene
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
    // Create Isa (circle entity)
    this.isaEntity = new GameEntity(
      this, 
      gameConfig.entityCircleInitialX, 
      gameConfig.entityCircleInitialY, 
      'isa'
    );
    
    // Create Stev (square entity) 
    this.stevEntity = new GameEntity(
      this, 
      gameConfig.entitySquareInitialX, 
      gameConfig.entitySquareInitialY, 
      'stev'
    );

    // Add to physics group
    this.entities.add(this.isaEntity);
    this.entities.add(this.stevEntity);

    // Setup resonance partnership
    this.isaEntity.setPartnerEntity(this.stevEntity);
    this.stevEntity.setPartnerEntity(this.isaEntity);

    // Register entities with game logic manager
    this.gameLogicManager.registerEntity('isa', this.isaEntity);
    this.gameLogicManager.registerEntity('stev', this.stevEntity);

    logAutopoiesis.info('Initial entities created and registered', {
      entities: ['isa', 'stev'],
      hasResonancePartnership: true
    });
  }

  // Game loop is now handled by GameLogicManager

  // Game logic updates are now handled by GameLogicManager

  private createTestWorld() {
    // Create a natural grass background using tiles
    const tileSize = 64;
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;

    // Create grass background tiles
    for (let x = 0; x < worldWidth; x += tileSize) {
      for (let y = 0; y < worldHeight; y += tileSize) {
        // Randomly choose between different grass tiles for variety
        const grassTypes = ['grass-1', 'grass-2', 'grass-3', 'grass-base'];
        const randomGrass = grassTypes[Math.floor(Math.random() * grassTypes.length)];
        
        const grassTile = this.add.image(x + tileSize/2, y + tileSize/2, randomGrass);
        grassTile.setDisplaySize(tileSize, tileSize);
        grassTile.setDepth(0); // Background layer
      }
    }

    // Add some decorative elements
    this.createEnvironmentalDecorations();

    // Create activity zones with better visuals
    this.createActivityZones();
    
    console.log('🗺️ Beautiful world created with grass tiles and decorations');
  }

  private createEnvironmentalDecorations() {
    // Add flowers and campfires scattered around
    const decorations = [
      { x: 150, y: 120, sprite: 'flowers-red' },
      { x: 300, y: 180, sprite: 'flowers-white' },
      { x: 500, y: 250, sprite: 'campfire' },
      { x: 650, y: 150, sprite: 'flowers-red' },
      { x: 800, y: 300, sprite: 'flowers-white' },
      { x: 900, y: 400, sprite: 'campfire' }
    ];

    decorations.forEach(deco => {
      const decoration = this.add.image(deco.x, deco.y, deco.sprite);
      decoration.setScale(1.2);
      decoration.setDepth(1); // Above grass, below entities
    });
  }

  private createActivityZones() {
    // Create more visually appealing zones
    const zones = [
      { x: 100, y: 100, width: 200, height: 150, color: 0x27ae60, name: 'Rest Zone', alpha: 0.2 },
      { x: 400, y: 200, width: 180, height: 120, color: 0xe74c3c, name: 'Food Zone', alpha: 0.2 },
      { x: 700, y: 300, width: 200, height: 160, color: 0x3498db, name: 'Social Zone', alpha: 0.2 }
    ];

    zones.forEach(zone => {
      // Create zone background with rounded corners effect
      const zoneRect = this.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.color,
        zone.alpha
      );
      zoneRect.setStrokeStyle(3, zone.color, 0.6);
      zoneRect.setDepth(2);
      
      // Add zone label
      const label = this.add.text(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.name,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      
      // Add subtle shadow to text
      label.setStroke('#000000', 2);
    });
  }

  /**
   * Crea la visualización de las zonas generadas por el sistema de mapas
   */
  private createZonesVisualization() {
    console.log(`🗺️ Creating ${this.gameState.zones.length} zones and ${this.gameState.mapElements.length} map elements`);

    // Renderizar zonas
    this.gameState.zones.forEach(zone => {
      // Parse color string to hex number
      let colorValue = 0x3498db; // Default blue
      if (zone.color.startsWith('rgba(')) {
        const rgbaMatch = zone.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch.map(Number);
          colorValue = (r << 16) | (g << 8) | b;
        }
      }

      // Crear rectángulo de zona
      const zoneRect = this.add.rectangle(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.bounds.width,
        zone.bounds.height,
        colorValue,
        0.25
      );
      zoneRect.setStrokeStyle(2, colorValue, 0.8);
      zoneRect.setDepth(1);

      // Etiqueta de zona
      const label = this.add.text(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2,
        zone.name,
        {
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          align: 'center'
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke('#000000', 3);
    });

    // Renderizar elementos del mapa
    this.gameState.mapElements.forEach(element => {
      const colorValue = typeof element.color === 'string' ? 
        parseInt(element.color.replace('#', ''), 16) : element.color;

      const elementRect = this.add.rectangle(
        element.position.x + element.size.width / 2,
        element.position.y + element.size.height / 2,
        element.size.width,
        element.size.height,
        colorValue,
        0.8
      );
      elementRect.setStrokeStyle(1, 0xffffff, 0.6);
      elementRect.setDepth(2);
    });

    console.log('✅ Zones visualization completed');
  }

  /**
   * Maneja interacciones del jugador que pueden generar diálogos
   */
  public handlePlayerInteraction(entityId: string, interactionType: string) {
    this.dialogueSystem.handlePlayerInteraction(entityId, interactionType);
  }

  update() {
    // Update entity positions and states
    // This will be expanded with full autopoiesis system
  }
}
