import Phaser from 'phaser';
import type { GameState } from '../types';
import { gameConfig } from '../config/gameConfig';
import { GameEntity } from '../entities/GameEntity';

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private entities!: Phaser.Physics.Arcade.Group;
  private isaEntity!: GameEntity;
  private stevEntity!: GameEntity;

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    console.log('🎮 MainScene initialized');
    
    // Initialize game state
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
      zones: [],
      mapElements: [],
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
      worldSize: { width: 1200, height: 800 },
      generatorVersion: '2.0.0'
    };

    // Store in registry for access from other scenes
    this.registry.set('gameState', this.gameState);
  }

  create() {
    console.log('🌍 Creating main game world');

    // Setup physics groups
    this.entities = this.physics.add.group();

    // Create initial entities (Isa and Stev)
    this.createInitialEntities();

    // Setup camera
    this.cameras.main.setBounds(0, 0, this.gameState.worldSize.width, this.gameState.worldSize.height);
    this.cameras.main.setZoom(1);

    // Setup main game loop
    this.setupGameLoop();

    // Create temporary visual elements for testing
    this.createTestWorld();

    console.log('✅ MainScene created successfully');
  }

  private createInitialEntities() {
    // Create Isa (circle entity)
    this.isaEntity = new GameEntity(this, gameConfig.entityCircleInitialX, gameConfig.entityCircleInitialY, 'isa');
    
    // Create Stev (square entity) 
    this.stevEntity = new GameEntity(this, gameConfig.entitySquareInitialX, gameConfig.entitySquareInitialY, 'stev');

    // Add to physics group
    this.entities.add(this.isaEntity);
    this.entities.add(this.stevEntity);

    // Setup resonance partnership
    this.isaEntity.setPartnerEntity(this.stevEntity);
    this.stevEntity.setPartnerEntity(this.isaEntity);

    console.log('👥 Initial entities created: Isa and Stev with autopoiesis and resonance systems');
  }

  private setupGameLoop() {
    // Main game logic timer
    this.time.addEvent({
      delay: gameConfig.timing.mainGameLogic,
      callback: this.updateGameLogic,
      callbackScope: this,
      loop: true
    });

    console.log(`⏰ Game loop started with ${gameConfig.timing.mainGameLogic}ms interval`);
  }

  private updateGameLogic() {
    // Update game cycles
    this.gameState.cycles++;
    
    // Update entities with autopoiesis
    this.isaEntity.updateEntity(gameConfig.timing.mainGameLogic);
    this.stevEntity.updateEntity(gameConfig.timing.mainGameLogic);
    
    // Emit update event for UI
    this.events.emit('gameLogicUpdate', {
      cycles: this.gameState.cycles,
      resonance: this.gameState.resonance,
      isaStats: this.isaEntity.getStats(),
      stevStats: this.stevEntity.getStats()
    });

    if (this.gameState.cycles % 10 === 0) {
      console.log(`🔄 Game cycle ${this.gameState.cycles} - Isa: ${this.isaEntity.getCurrentActivity()}, Stev: ${this.stevEntity.getCurrentActivity()}`);
    }
  }

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

  update() {
    // Update entity positions and states
    // This will be expanded with full autopoiesis system
  }
}
