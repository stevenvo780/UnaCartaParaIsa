import Phaser from 'phaser';
import { UIElementPool, ResonanceLabel } from '../managers/UIElementPool';
import { GAME_BALANCE } from '../constants/gameBalance';
import { logAutopoiesis } from '../utils/logger';

export class UIScene extends Phaser.Scene {
  private resonanceLabelPool!: UIElementPool<ResonanceLabel>;
  private currentResonanceLabel?: ResonanceLabel;
  
  // Modern UI system
  private topBar!: Phaser.GameObjects.Container;
  private bottomBar!: Phaser.GameObjects.Container;
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private minimapContainer!: Phaser.GameObjects.Container;
  
  // Navigation and control
  private isDraggingCamera: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private currentControlMode: 'auto' | 'isa' | 'stev' = 'auto';
  
  // UI state
  private leftPanelExpanded: boolean = true;
  private rightPanelExpanded: boolean = true;
  private showMinimap: boolean = true;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    console.log('🎨 Creating Modern Game UI');
    
    this.initializePools();
    
    // Create modern modular UI
    this.createTopBar();
    this.createBottomBar();
    this.createLeftPanel();
    this.createRightPanel();
    this.createMinimap();
    
    // Setup modern navigation
    this.setupModernNavigation();
    
    // Connect to game logic
    const mainScene = this.scene.get('MainScene');
    mainScene.events.on('gameLogicUpdate', this.updateUI, this);
    
    this.events.on('shutdown', this.destroy, this);
    
    console.log('✅ Modern UI Scene created');
  }

  /**
   * Inicializar pools de elementos UI
   */
  private initializePools(): void {
    this.resonanceLabelPool = new UIElementPool<ResonanceLabel>(
      () => new ResonanceLabel(this),
      'ResonanceLabel',
      3
    );
    
    logAutopoiesis.debug('UI element pools initialized');
  }

  /**
   * Actualizar label de resonancia usando pool
   */
  private updateResonanceLabel(x: number, y: number, resonance: number): void {

    if (this.currentResonanceLabel) {
      this.resonanceLabelPool.release(this.currentResonanceLabel);
    }
    

    this.currentResonanceLabel = this.resonanceLabelPool.acquire();
    this.currentResonanceLabel.setup(x, y, `${resonance.toFixed(1)}%`);
    this.currentResonanceLabel.gameObject.setOrigin(0, 0.5);
  }

  private updateUI(data: any) {
    this.updateTopBarInfo(data);
    this.updateBottomBarInfo(data);
    
    if (data.entities) {
      this.updateCharacterPanels(data.entities);
    }
    
    this.updateMinimap(data);
  }

  // =================== MODERN UI CREATION METHODS ===================
  
  private createTopBar() {
    this.topBar = this.add.container(0, 0);
    this.topBar.setScrollFactor(0);
    
    // Top bar background with gradient effect
    const topBg = this.add.graphics();
    topBg.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1, 1, 0.9, 0.9);
    topBg.fillRect(0, 0, this.cameras.main.width, 60);
    topBg.lineStyle(2, 0x1abc9c, 0.8);
    topBg.lineBetween(0, 58, this.cameras.main.width, 58);
    this.topBar.add(topBg);
    
    // Game title
    const title = this.add.text(20, 15, '🌟 Una Carta Para Isa', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.topBar.add(title);
    
    // Game status indicators
    this.createTopBarIndicators();
  }
  
  private createTopBarIndicators() {
    const startX = this.cameras.main.width - 400;
    
    // Resonance indicator
    const resonanceContainer = this.add.container(startX, 15);
    const resonanceBg = this.add.graphics();
    resonanceBg.fillStyle(0x34495e, 0.8);
    resonanceBg.fillRoundedRect(0, 0, 120, 30, 5);
    resonanceContainer.add(resonanceBg);
    
    const resonanceIcon = this.add.text(10, 15, '💫', { fontSize: '16px' }).setOrigin(0, 0.5);
    resonanceContainer.add(resonanceIcon);
    
    const resonanceText = this.add.text(35, 15, 'Resonancia: 0%', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    resonanceContainer.add(resonanceText);
    resonanceContainer.setData('resonanceText', resonanceText);
    
    this.topBar.add(resonanceContainer);
    
    // Cycles indicator
    const cyclesContainer = this.add.container(startX + 140, 15);
    const cyclesBg = this.add.graphics();
    cyclesBg.fillStyle(0x34495e, 0.8);
    cyclesBg.fillRoundedRect(0, 0, 100, 30, 5);
    cyclesContainer.add(cyclesBg);
    
    const cyclesIcon = this.add.text(10, 15, '⚡', { fontSize: '16px' }).setOrigin(0, 0.5);
    cyclesContainer.add(cyclesIcon);
    
    const cyclesText = this.add.text(35, 15, 'Ciclos: 0', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    cyclesContainer.add(cyclesText);
    cyclesContainer.setData('cyclesText', cyclesText);
    
    this.topBar.add(cyclesContainer);
    
    // Menu button
    this.createMenuButton();
  }
  
  private createMenuButton() {
    const menuBtn = this.add.container(this.cameras.main.width - 80, 15);
    
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x3498db, 0.8);
    menuBg.fillRoundedRect(0, 0, 60, 30, 5);
    menuBtn.add(menuBg);
    
    const menuText = this.add.text(30, 15, '☰ MENU', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    menuBtn.add(menuText);
    
    menuBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 30), Phaser.Geom.Rectangle.Contains);
    menuBtn.on('pointerover', () => menuBg.setAlpha(1));
    menuBtn.on('pointerout', () => menuBg.setAlpha(0.8));
    menuBtn.on('pointerdown', () => this.toggleGameMenu());
    
    this.topBar.add(menuBtn);
  }

  private createBottomBar() {
    const barHeight = 80;
    this.bottomBar = this.add.container(0, this.cameras.main.height - barHeight);
    this.bottomBar.setScrollFactor(0);
    
    // Bottom bar background
    const bottomBg = this.add.graphics();
    bottomBg.fillGradientStyle(0x34495e, 0x34495e, 0x2c3e50, 0x2c3e50, 0.9, 0.9, 1, 1);
    bottomBg.fillRect(0, 0, this.cameras.main.width, barHeight);
    bottomBg.lineStyle(2, 0x1abc9c, 0.8);
    bottomBg.lineBetween(0, 2, this.cameras.main.width, 2);
    this.bottomBar.add(bottomBg);
    
    // Control buttons
    this.createControlButtons();
    
    // Action buttons
    this.createActionButtons();
    
    // Speed controls
    this.createSpeedControls();
  }
  
  private createControlButtons() {
    const startX = 20;
    const buttonWidth = 80;
    const buttonHeight = 35;
    const spacing = 90;
    
    // Auto control button
    const autoBtn = this.createModernButton(startX, 20, buttonWidth, buttonHeight, '🤖 AUTO', '#95a5a6', () => {
      this.setControlMode('auto');
    });
    this.bottomBar.add(autoBtn);
    
    // Isa control button  
    const isaBtn = this.createModernButton(startX + spacing, 20, buttonWidth, buttonHeight, '👩 ISA', '#e91e63', () => {
      this.setControlMode('isa');
    });
    this.bottomBar.add(isaBtn);
    
    // Stev control button
    const stevBtn = this.createModernButton(startX + spacing * 2, 20, buttonWidth, buttonHeight, '👨 STEV', '#3498db', () => {
      this.setControlMode('stev');
    });
    this.bottomBar.add(stevBtn);
  }
  
  private createActionButtons() {
    const centerX = this.cameras.main.width / 2;
    const buttonWidth = 60;
    const buttonHeight = 35;
    const spacing = 70;
    
    // Pause/Play button
    const pauseBtn = this.createModernButton(centerX - spacing, 20, buttonWidth, buttonHeight, '⏸️', '#f39c12', () => {
      this.togglePause();
    });
    this.bottomBar.add(pauseBtn);
    
    // Settings button
    const settingsBtn = this.createModernButton(centerX, 20, buttonWidth, buttonHeight, '⚙️', '#9b59b6', () => {
      this.openSettings();
    });
    this.bottomBar.add(settingsBtn);
    
    // Screenshot button
    const screenshotBtn = this.createModernButton(centerX + spacing, 20, buttonWidth, buttonHeight, '📷', '#1abc9c', () => {
      this.takeScreenshot();
    });
    this.bottomBar.add(screenshotBtn);
  }

  private createControlPanel() {
    this.controlPanel = this.add.container(10, 270);
    this.controlPanel.setScrollFactor(0);

    const background = this.add.graphics();
    background.fillStyle(0x34495e, 0.9);
    background.fillRoundedRect(0, 0, 370, 80, 5);
    this.controlPanel.add(background);

    const title = this.add.text(10, 5, 'CONTROL', {
      fontSize: '14px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.controlPanel.add(title);

    // Control buttons
    const autoBtn = this.createControlButton(10, 25, 'AUTO', '#95a5a6', () => {
      this.setEntityControl('none');
    });
    this.controlPanel.add(autoBtn);

    const isaBtn = this.createControlButton(80, 25, 'ISA', '#e91e63', () => {
      this.setEntityControl('isa');
    });
    this.controlPanel.add(isaBtn);

    const stevBtn = this.createControlButton(150, 25, 'STEV', '#3498db', () => {
      this.setEntityControl('stev');
    });
    this.controlPanel.add(stevBtn);

    const cameraTip = this.add.text(220, 30, 'WASD: Mover Cámara\nClick: Arrastrar', {
      fontSize: '10px',
      color: '#bdc3c7',
      fontFamily: 'Arial'
    });
    this.controlPanel.add(cameraTip);
  }

  private createControlButton(x: number, y: number, text: string, color: string, callback: () => void) {
    const button = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    bg.fillRoundedRect(0, 0, 60, 30, 5);
    button.add(bg);

    const label = this.add.text(30, 15, text, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add(label);

    button.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 30), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', callback);
    button.on('pointerover', () => bg.setAlpha(1));
    button.on('pointerout', () => bg.setAlpha(0.8));

    return button;
  }

  private setupCameraControls() {
    // WASD camera movement
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as any;
    
    // Mouse drag camera
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > 400) { // Only if clicking outside UI panel
        this.isDragging = true;
        this.cameraDragStartX = pointer.x;
        this.cameraDragStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const mainScene = this.scene.get('MainScene') as Phaser.Scene;
        const camera = mainScene.cameras.main;
        
        const deltaX = this.cameraDragStartX - pointer.x;
        const deltaY = this.cameraDragStartY - pointer.y;
        
        camera.scrollX += deltaX;
        camera.scrollY += deltaY;
        
        this.cameraDragStartX = pointer.x;
        this.cameraDragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Keyboard camera movement in update loop
    this.scene.get('MainScene').events.on('update', () => {
      const mainScene = this.scene.get('MainScene') as Phaser.Scene;
      const camera = mainScene.cameras.main;
      
      if (wasd.W.isDown || cursors?.up.isDown) camera.scrollY -= 5;
      if (wasd.S.isDown || cursors?.down.isDown) camera.scrollY += 5;
      if (wasd.A.isDown || cursors?.left.isDown) camera.scrollX -= 5;
      if (wasd.D.isDown || cursors?.right.isDown) camera.scrollX += 5;
    });
  }

  private setEntityControl(entity: 'isa' | 'stev' | 'none') {
    // Store current controlled entity for visual feedback
    const currentControlled = entity;
    
    // Emit event to MainScene to change control mode
    const mainScene = this.scene.get('MainScene');
    mainScene.events.emit('changeEntityControl', entity);
    
    logAutopoiesis.info(`Entity control changed to: ${entity}`);
  }

  private createSpeedControls() {
    const rightX = this.cameras.main.width - 150;
    
    // Speed control container
    const speedContainer = this.add.container(rightX, 20);
    
    // Speed background
    const speedBg = this.add.graphics();
    speedBg.fillStyle(0x34495e, 0.8);
    speedBg.fillRoundedRect(0, 0, 130, 40, 5);
    speedContainer.add(speedBg);
    
    // Speed label
    const speedLabel = this.add.text(10, 8, '⚡ Velocidad:', {
      fontSize: '10px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    });
    speedContainer.add(speedLabel);
    
    // Speed buttons
    const slowBtn = this.createModernButton(10, 20, 25, 15, '0.5x', '#e74c3c', () => {
      this.setGameSpeed(0.5);
    });
    speedContainer.add(slowBtn);
    
    const normalBtn = this.createModernButton(40, 20, 25, 15, '1x', '#95a5a6', () => {
      this.setGameSpeed(1);
    });
    speedContainer.add(normalBtn);
    
    const fastBtn = this.createModernButton(70, 20, 25, 15, '2x', '#f39c12', () => {
      this.setGameSpeed(2);
    });
    speedContainer.add(fastBtn);
    
    const turboBtn = this.createModernButton(100, 20, 25, 15, '5x', '#e67e22', () => {
      this.setGameSpeed(5);
    });
    speedContainer.add(turboBtn);
    
    this.bottomBar.add(speedContainer);
  }
  
  private createLeftPanel() {
    const panelWidth = 300;
    const panelHeight = this.cameras.main.height - 140;
    
    this.leftPanel = this.add.container(10, 70);
    this.leftPanel.setScrollFactor(0);
    
    // Enhanced panel background with shadow effect
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(3, 3, panelWidth, panelHeight, 8);
    this.leftPanel.add(shadow);
    
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x34495e, 0x2c3e50, 0x34495e, 0x2c3e50, 0.96, 0.96, 0.96, 0.96);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(3, 0x1abc9c, 0.8);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
    // Add inner glow effect
    panelBg.lineStyle(1, 0x1abc9c, 0.3);
    panelBg.strokeRoundedRect(2, 2, panelWidth - 4, panelHeight - 4, 6);
    this.leftPanel.add(panelBg);
    
    // Enhanced panel header
    const headerBg = this.add.graphics();
    headerBg.fillGradientStyle(0x1abc9c, 0x16a085, 0x1abc9c, 0x16a085, 0.2, 0.2, 0.1, 0.1);
    headerBg.fillRoundedRect(0, 0, panelWidth, 35, 8);
    this.leftPanel.add(headerBg);
    
    // Panel title with better styling
    const title = this.add.text(panelWidth / 2, 18, '📊 ESTADÍSTICAS DE PERSONAJES', {
      fontSize: '14px',
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.leftPanel.add(title);
    
    // Character panels with improved spacing
    this.createCharacterPanel('isa', 15, 50, '#e91e63', '👩 ISA');
    this.createCharacterPanel('stev', 15, 235, '#3498db', '👨 STEV');
    
    // Enhanced toggle button
    const toggleBtn = this.createModernButton(panelWidth - 35, 8, 30, 20, '◀', '#95a5a6', () => {
      this.toggleLeftPanel();
    });
    this.leftPanel.add(toggleBtn);
  }
  
  private createRightPanel() {
    const panelWidth = 220;
    const panelHeight = this.cameras.main.height - 140;
    const panelX = this.cameras.main.width - panelWidth - 10;
    
    this.rightPanel = this.add.container(panelX, 70);
    this.rightPanel.setScrollFactor(0);
    
    // Enhanced panel background with shadow effect
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-3, 3, panelWidth, panelHeight, 8);
    this.rightPanel.add(shadow);
    
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x34495e, 0x2c3e50, 0x34495e, 0x2c3e50, 0.96, 0.96, 0.96, 0.96);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(3, 0x9b59b6, 0.8);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
    // Add inner glow effect
    panelBg.lineStyle(1, 0x9b59b6, 0.3);
    panelBg.strokeRoundedRect(2, 2, panelWidth - 4, panelHeight - 4, 6);
    this.rightPanel.add(panelBg);
    
    // Enhanced panel header
    const headerBg = this.add.graphics();
    headerBg.fillGradientStyle(0x9b59b6, 0x8e44ad, 0x9b59b6, 0x8e44ad, 0.2, 0.2, 0.1, 0.1);
    headerBg.fillRoundedRect(0, 0, panelWidth, 35, 8);
    this.rightPanel.add(headerBg);
    
    // Panel title with better styling
    const title = this.add.text(panelWidth / 2, 18, '🎯 INFORMACIÓN DEL MUNDO', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.rightPanel.add(title);
    
    // Zone info section with better layout
    const zoneSection = this.add.container(0, 45);
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x2c3e50, 0.6);
    zoneBg.fillRoundedRect(10, 0, panelWidth - 20, 80, 5);
    zoneSection.add(zoneBg);
    
    const zoneTitle = this.add.text(15, 10, '🗺️ ZONA ACTUAL', {
      fontSize: '11px',
      color: '#9b59b6',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    zoneSection.add(zoneTitle);
    
    const zoneInfo = this.add.text(15, 25, 'Zona: Ninguna\nTipo: ---\nBeneficio: ---\nDistancia: ---', {
      fontSize: '10px',
      color: '#bdc3c7',
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 2
    });
    zoneSection.add(zoneInfo);
    this.rightPanel.add(zoneSection);
    
    // Activities section with better layout
    const activitiesSection = this.add.container(0, 140);
    const activitiesBg = this.add.graphics();
    activitiesBg.fillStyle(0x2c3e50, 0.6);
    activitiesBg.fillRoundedRect(10, 0, panelWidth - 20, 90, 5);
    activitiesSection.add(activitiesBg);
    
    const activitiesTitle = this.add.text(15, 10, '📋 ACTIVIDADES', {
      fontSize: '11px',
      color: '#f39c12',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    activitiesSection.add(activitiesTitle);
    
    const activitiesText = this.add.text(15, 25, '👩 Isa: IDLE\n👨 Stev: IDLE\n\n⏱️ Tiempo: 00:00', {
      fontSize: '10px',
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 3
    });
    activitiesSection.add(activitiesText);
    this.rightPanel.add(activitiesSection);
    
    // Enhanced toggle button
    const toggleBtn = this.createModernButton(8, 8, 30, 20, '▶', '#95a5a6', () => {
      this.toggleRightPanel();
    });
    this.rightPanel.add(toggleBtn);
  }
  
  private createMinimap() {
    const minimapSize = 140;
    // Position minimap in bottom-right corner but inside the right panel area
    const minimapX = this.cameras.main.width - minimapSize - 15;
    const minimapY = this.cameras.main.height - minimapSize - 90; // Above the bottom bar
    
    this.minimapContainer = this.add.container(minimapX, minimapY);
    this.minimapContainer.setScrollFactor(0);
    
    // Minimap background with improved styling
    const minimapBg = this.add.graphics();
    minimapBg.fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 0.95, 0.95, 0.95, 0.95);
    minimapBg.fillRoundedRect(0, 0, minimapSize, minimapSize, 8);
    minimapBg.lineStyle(2, 0x3498db, 0.7);
    minimapBg.strokeRoundedRect(0, 0, minimapSize, minimapSize, 8);
    this.minimapContainer.add(minimapBg);
    
    // Minimap title with better positioning
    const title = this.add.text(minimapSize / 2, 12, '🗺️ MAPA', {
      fontSize: '11px',
      color: '#3498db',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.minimapContainer.add(title);
    
    // Improved minimap content representation
    const mapContent = this.add.graphics();
    
    // Base terrain
    mapContent.fillStyle(0x27ae60, 0.4);
    mapContent.fillRoundedRect(8, 28, minimapSize - 16, minimapSize - 40, 4);
    
    // Different zones with better visual distinction
    mapContent.fillStyle(0xe74c3c, 0.8); // Red zone
    mapContent.fillRoundedRect(15, 35, 25, 18, 2);
    
    mapContent.fillStyle(0xf39c12, 0.8); // Orange zone  
    mapContent.fillRoundedRect(50, 40, 20, 20, 2);
    
    mapContent.fillStyle(0x9b59b6, 0.8); // Purple zone
    mapContent.fillRoundedRect(80, 35, 30, 25, 2);
    
    mapContent.fillStyle(0x1abc9c, 0.8); // Teal zone
    mapContent.fillRoundedRect(20, 70, 35, 20, 2);
    
    mapContent.fillStyle(0x3498db, 0.8); // Blue zone
    mapContent.fillRoundedRect(65, 75, 25, 15, 2);
    
    // Player positions (will be updated dynamically)
    mapContent.fillStyle(0xff1744, 1); // Isa position
    mapContent.fillCircle(30, 50, 3);
    
    mapContent.fillStyle(0x00bcd4, 1); // Stev position  
    mapContent.fillCircle(85, 55, 3);
    
    this.minimapContainer.add(mapContent);
    
    // Improved toggle button
    const toggleBtn = this.createModernButton(minimapSize - 20, 2, 16, 16, '×', '#e74c3c', () => {
      this.toggleMinimap();
    });
    this.minimapContainer.add(toggleBtn);
  }
  
  private setupModernNavigation() {
    // Mouse drag navigation - improved bounds detection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Calculate accurate UI bounds to avoid navigation conflicts
      const topBarHeight = 60;
      const bottomBarHeight = 80;
      const leftPanelWidth = this.leftPanelExpanded ? 300 : 50;
      const rightPanelWidth = this.rightPanelExpanded ? 220 : 50;
      
      // Check if clicking within navigable area (not on UI elements)
      const isInNavigableArea = (
        pointer.x > leftPanelWidth && 
        pointer.x < (this.cameras.main.width - rightPanelWidth) &&
        pointer.y > topBarHeight && 
        pointer.y < (this.cameras.main.height - bottomBarHeight)
      );
      
      if (isInNavigableArea) {
        this.isDraggingCamera = true;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
        
        // Visual feedback for dragging
        this.cameras.main.setTint(0xf0f0f0);
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingCamera) {
        const mainScene = this.scene.get('MainScene');
        if (mainScene && mainScene.cameras && mainScene.cameras.main) {
          const camera = mainScene.cameras.main;
          
          // Calculate smooth camera movement
          const deltaX = (this.lastPointerX - pointer.x) * 1.2;
          const deltaY = (this.lastPointerY - pointer.y) * 1.2;
          
          // Apply camera movement with bounds checking
          const newScrollX = camera.scrollX + deltaX;
          const newScrollY = camera.scrollY + deltaY;
          
          // Set reasonable world bounds (adjust these based on your world size)
          const maxScrollX = 2000;
          const maxScrollY = 2000;
          
          camera.scrollX = Phaser.Math.Clamp(newScrollX, -500, maxScrollX);
          camera.scrollY = Phaser.Math.Clamp(newScrollY, -500, maxScrollY);
          
          this.lastPointerX = pointer.x;
          this.lastPointerY = pointer.y;
        }
      }
    });
    
    this.input.on('pointerup', () => {
      if (this.isDraggingCamera) {
        this.isDraggingCamera = false;
        // Remove visual feedback
        this.cameras.main.clearTint();
      }
    });
    
    // Enhanced keyboard camera controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D,SHIFT') as any;
    
    // Use UIScene's update loop for camera controls to avoid conflicts
    this.events.on('update', () => {
      const mainScene = this.scene.get('MainScene');
      if (mainScene && mainScene.cameras && mainScene.cameras.main && !this.isDraggingCamera) {
        const camera = mainScene.cameras.main;
        const baseSpeed = wasd?.SHIFT?.isDown ? 12 : 6; // Faster with shift
        
        // Keyboard navigation
        if (cursors?.up.isDown || wasd?.W?.isDown) {
          camera.scrollY = Phaser.Math.Clamp(camera.scrollY - baseSpeed, -500, 2000);
        }
        if (cursors?.down.isDown || wasd?.S?.isDown) {
          camera.scrollY = Phaser.Math.Clamp(camera.scrollY + baseSpeed, -500, 2000);
        }
        if (cursors?.left.isDown || wasd?.A?.isDown) {
          camera.scrollX = Phaser.Math.Clamp(camera.scrollX - baseSpeed, -500, 2000);
        }
        if (cursors?.right.isDown || wasd?.D?.isDown) {
          camera.scrollX = Phaser.Math.Clamp(camera.scrollX + baseSpeed, -500, 2000);
        }
      }
    });
    
    // Mouse wheel zoom (optional enhancement)
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      const mainScene = this.scene.get('MainScene');
      if (mainScene && mainScene.cameras && mainScene.cameras.main) {
        const camera = mainScene.cameras.main;
        const zoomSpeed = 0.1;
        const newZoom = deltaY < 0 ? camera.zoom + zoomSpeed : camera.zoom - zoomSpeed;
        camera.setZoom(Phaser.Math.Clamp(newZoom, 0.5, 2.0));
      }
    });
  }
  
  private updateCharacterStats(entities: any) {
    // Update character panels
    this.updateCharacterPanels(entities);
  }

  private updateEntityStatsDisplay(panel: Phaser.GameObjects.Container, entityData: any, color: string) {
    // Clear previous dynamic stats (but keep fixed elements like background, title, portrait)
    const existingStats = panel.list.filter((child: any) => 
      (child.type === 'Text' || child.type === 'Graphics') && child.y > 75
    );
    existingStats.forEach((stat: any) => stat.destroy());

    if (!entityData.stats) return;

    const stats = entityData.stats;
    
    // Update activity text if it exists
    const activityText = panel.getData('activityText');
    if (activityText && entityData.activity) {
      activityText.setText(entityData.activity || 'IDLE');
    }

    // Create stats in two columns for better space usage
    const statsColumn1 = [
      { icon: '❤️', label: 'Salud', value: Math.round(stats.health || 0), color: '#e74c3c' },
      { icon: '😊', label: 'Felicidad', value: Math.round(stats.happiness || 0), color: '#f39c12' },
      { icon: '⚡', label: 'Energía', value: Math.round(stats.energy || 0), color: '#3498db' }
    ];
    
    const statsColumn2 = [
      { icon: '🍎', label: 'Hambre', value: Math.round(stats.hunger || 0), color: '#27ae60' },
      { icon: '😴', label: 'Sueño', value: Math.round(stats.sleepiness || 0), color: '#9b59b6' },
      { icon: '💰', label: 'Dinero', value: Math.round(stats.money || 0), color: '#f1c40f' }
    ];

    // First column
    statsColumn1.forEach((stat, index) => {
      const value = stat.value;
      const barColor = value > 70 ? '#27ae60' : value > 30 ? '#f39c12' : '#e74c3c';
      
      // Stat label
      const statText = this.add.text(10, 80 + (index * 25), `${stat.icon} ${stat.label}`, {
        fontSize: '10px',
        color: stat.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      });
      panel.add(statText);
      
      // Stat value
      const valueText = this.add.text(10, 92 + (index * 25), `${value}`, {
        fontSize: '9px',
        color: '#ecf0f1',
        fontFamily: 'Arial, sans-serif'
      });
      panel.add(valueText);
      
      // Progress bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0x2c3e50, 0.8);
      barBg.fillRoundedRect(45, 83 + (index * 25), 80, 8, 4);
      panel.add(barBg);
      
      // Progress bar fill
      const bar = this.add.graphics();
      bar.fillStyle(Phaser.Display.Color.HexStringToColor(barColor).color, 0.8);
      const barWidth = Math.max((value / 100) * 76, 2);
      bar.fillRoundedRect(47, 85 + (index * 25), barWidth, 4, 2);
      panel.add(bar);
    });

    // Second column  
    statsColumn2.forEach((stat, index) => {
      const value = stat.value;
      const barColor = value > 70 ? '#27ae60' : value > 30 ? '#f39c12' : '#e74c3c';
      
      // Stat label
      const statText = this.add.text(140, 80 + (index * 25), `${stat.icon} ${stat.label}`, {
        fontSize: '10px',
        color: stat.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      });
      panel.add(statText);
      
      // Stat value  
      const valueText = this.add.text(140, 92 + (index * 25), `${value}`, {
        fontSize: '9px',
        color: '#ecf0f1',
        fontFamily: 'Arial, sans-serif'
      });
      panel.add(valueText);
      
      // Progress bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0x2c3e50, 0.8);
      barBg.fillRoundedRect(175, 83 + (index * 25), 80, 8, 4);
      panel.add(barBg);
      
      // Progress bar fill
      const bar = this.add.graphics();
      bar.fillStyle(Phaser.Display.Color.HexStringToColor(barColor).color, 0.8);
      const barWidth = Math.max((value / 100) * 76, 2);
      bar.fillRoundedRect(177, 85 + (index * 25), barWidth, 4, 2);
      panel.add(bar);
    });

    // Mood indicator at the bottom
    if (entityData.mood) {
      const moodBg = this.add.graphics();
      moodBg.fillStyle(0x2c3e50, 0.6);
      moodBg.fillRoundedRect(10, 155, 250, 15, 3);
      panel.add(moodBg);
      
      const moodText = this.add.text(135, 162, `💭 Humor: ${entityData.mood}`, {
        fontSize: '10px',
        color: color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      panel.add(moodText);
    }
  }

  // =================== HELPER METHODS ===================
  
  private createModernButton(x: number, y: number, width: number, height: number, text: string, color: string, callback: () => void) {
    const button = this.add.container(x, y);
    
    const bg = this.add.graphics();
    const colorValue = Phaser.Display.Color.HexStringToColor(color).color;
    bg.fillStyle(colorValue, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 3);
    button.add(bg);
    
    const label = this.add.text(width / 2, height / 2, text, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add(label);
    
    button.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', callback);
    button.on('pointerover', () => bg.setAlpha(1));
    button.on('pointerout', () => bg.setAlpha(0.8));
    
    return button;
  }
  
  private createCharacterPanel(character: string, x: number, y: number, color: string, title: string) {
    const panelContainer = this.add.container(x, y);
    const panelWidth = 270;
    const panelHeight = 175;
    
    // Enhanced character panel background with shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(2, 2, panelWidth, panelHeight, 6);
    panelContainer.add(shadow);
    
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 0.8, 0.8, 0.8, 0.8);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 6);
    panelBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 6);
    
    // Inner highlight
    panelBg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.4);
    panelBg.strokeRoundedRect(1, 1, panelWidth - 2, panelHeight - 2, 5);
    panelContainer.add(panelBg);
    
    // Character header
    const headerBg = this.add.graphics();
    const headerColor = Phaser.Display.Color.HexStringToColor(color).color;
    headerBg.fillGradientStyle(headerColor, headerColor, headerColor, headerColor, 0.3, 0.3, 0.1, 0.1);
    headerBg.fillRoundedRect(0, 0, panelWidth, 30, 6);
    panelContainer.add(headerBg);
    
    // Character title with better styling
    const charTitle = this.add.text(panelWidth / 2, 15, title, {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    panelContainer.add(charTitle);
    
    // Character portrait placeholder (could be sprite in future)
    const portrait = this.add.graphics();
    portrait.fillStyle(headerColor, 0.2);
    portrait.fillCircle(35, 55, 20);
    portrait.lineStyle(2, headerColor, 0.8);
    portrait.strokeCircle(35, 55, 20);
    panelContainer.add(portrait);
    
    // Portrait emoji
    const portraitEmoji = this.add.text(35, 55, character === 'isa' ? '👩' : '👨', {
      fontSize: '24px'
    }).setOrigin(0.5);
    panelContainer.add(portraitEmoji);
    
    // Activity status indicator
    const activityBg = this.add.graphics();
    activityBg.fillStyle(0x2c3e50, 0.7);
    activityBg.fillRoundedRect(65, 40, panelWidth - 75, 30, 4);
    panelContainer.add(activityBg);
    
    const activityLabel = this.add.text(70, 45, '🎯 Estado:', {
      fontSize: '10px',
      color: '#95a5a6',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    panelContainer.add(activityLabel);
    
    const activityText = this.add.text(70, 58, 'IDLE', {
      fontSize: '11px',
      color: color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    panelContainer.add(activityText);
    
    // Stats will be added dynamically by updateEntityStatsDisplay starting at y: 75
    panelContainer.setData('character', character);
    panelContainer.setData('activityText', activityText);
    
    this.leftPanel.add(panelContainer);
    
    // Store reference for updates
    if (character === 'isa') {
      this.leftPanel.setData('isaStatsPanel', panelContainer);
    } else {
      this.leftPanel.setData('stevStatsPanel', panelContainer);
    }
  }
  
  private updateCharacterPanels(entities: any) {
    if (entities.isa) {
      const isaPanel = this.leftPanel.getData('isaStatsPanel');
      if (isaPanel) {
        this.updateEntityStatsDisplay(isaPanel, entities.isa, '#e91e63');
      }
    }
    
    if (entities.stev) {
      const stevPanel = this.leftPanel.getData('stevStatsPanel');
      if (stevPanel) {
        this.updateEntityStatsDisplay(stevPanel, entities.stev, '#3498db');
      }
    }
  }
  
  private updateTopBarInfo(data: any) {
    // Update resonance indicator
    const resonanceContainer = this.topBar.list.find((child: any) => child.getData && child.getData('resonanceText'));
    if (resonanceContainer && data.resonance !== undefined) {
      const resonanceText = resonanceContainer.getData('resonanceText');
      if (resonanceText) {
        resonanceText.setText(`Resonancia: ${Math.round(data.resonance)}%`);
      }
    }
    
    // Update cycles indicator  
    const cyclesContainer = this.topBar.list.find((child: any) => child.getData && child.getData('cyclesText'));
    if (cyclesContainer && data.cycles !== undefined) {
      const cyclesText = cyclesContainer.getData('cyclesText');
      if (cyclesText) {
        cyclesText.setText(`Ciclos: ${data.cycles}`);
      }
    }
  }
  
  private updateBottomBarInfo(data: any) {
    // Update control mode visual feedback if needed
    // Could highlight active control buttons based on current mode
  }
  
  private updateMinimap(data: any) {
    // Update minimap with entity positions if needed
    // This is a placeholder for future minimap functionality
  }
  
  // =================== CONTROL METHODS ===================
  
  private setControlMode(mode: 'auto' | 'isa' | 'stev') {
    this.currentControlMode = mode;
    const mainScene = this.scene.get('MainScene');
    mainScene.events.emit('changeEntityControl', mode === 'auto' ? 'none' : mode);
    
    logAutopoiesis.info(`Control mode changed to: ${mode}`);
  }
  
  private setGameSpeed(speed: number) {
    this.scene.scene.setTimeScale(speed);
    logAutopoiesis.info(`Game speed set to: ${speed}x`);
  }
  
  private togglePause() {
    const mainScene = this.scene.get('MainScene');
    if (mainScene.scene.isPaused()) {
      mainScene.scene.resume();
      logAutopoiesis.info('Game resumed');
    } else {
      mainScene.scene.pause();
      logAutopoiesis.info('Game paused');
    }
  }
  
  private openSettings() {
    // Placeholder for settings menu
    logAutopoiesis.info('Settings menu requested');
  }
  
  private takeScreenshot() {
    // Placeholder for screenshot functionality
    logAutopoiesis.info('Screenshot requested');
  }
  
  private toggleGameMenu() {
    // Placeholder for game menu
    logAutopoiesis.info('Game menu toggle requested');
  }
  
  private toggleLeftPanel() {
    this.leftPanelExpanded = !this.leftPanelExpanded;
    const targetX = this.leftPanelExpanded ? 10 : -250;
    
    this.tweens.add({
      targets: this.leftPanel,
      x: targetX,
      duration: 300,
      ease: 'Power2'
    });
  }
  
  private toggleRightPanel() {
    this.rightPanelExpanded = !this.rightPanelExpanded;
    const panelWidth = 200;
    const targetX = this.rightPanelExpanded ? this.cameras.main.width - panelWidth - 10 : this.cameras.main.width + 10;
    
    this.tweens.add({
      targets: this.rightPanel,
      x: targetX,
      duration: 300,
      ease: 'Power2'
    });
  }
  
  private toggleMinimap() {
    this.showMinimap = !this.showMinimap;
    this.minimapContainer.setVisible(this.showMinimap);
  }
  
  /**
   * Limpieza al destruir la escena
   */
  destroy(): void {

    if (this.resonanceLabelPool) {
      this.resonanceLabelPool.destroy();
    }
    
    logAutopoiesis.debug('UIScene destroyed - pools cleaned up');
    super.destroy();
  }
}
