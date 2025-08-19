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
    const panelWidth = 280;
    const panelHeight = this.cameras.main.height - 140;
    
    this.leftPanel = this.add.container(10, 70);
    this.leftPanel.setScrollFactor(0);
    
    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 0.95, 0.95, 0.95, 0.95);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(2, 0x1abc9c, 0.6);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    this.leftPanel.add(panelBg);
    
    // Panel title
    const title = this.add.text(15, 15, '📊 ESTADÍSTICAS', {
      fontSize: '16px',
      color: '#1abc9c',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.leftPanel.add(title);
    
    // Character panels
    this.createCharacterPanel('isa', 15, 45, '#e91e63', '👩 ISA');
    this.createCharacterPanel('stev', 15, 220, '#3498db', '👨 STEV');
    
    // Toggle button
    const toggleBtn = this.createModernButton(panelWidth - 35, 5, 30, 20, '◀', '#95a5a6', () => {
      this.toggleLeftPanel();
    });
    this.leftPanel.add(toggleBtn);
  }
  
  private createRightPanel() {
    const panelWidth = 200;
    const panelHeight = this.cameras.main.height - 140;
    const panelX = this.cameras.main.width - panelWidth - 10;
    
    this.rightPanel = this.add.container(panelX, 70);
    this.rightPanel.setScrollFactor(0);
    
    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 0.95, 0.95, 0.95, 0.95);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(2, 0x9b59b6, 0.6);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    this.rightPanel.add(panelBg);
    
    // Panel title
    const title = this.add.text(15, 15, '🎯 ZONA ACTUAL', {
      fontSize: '14px',
      color: '#9b59b6',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.rightPanel.add(title);
    
    // Zone info placeholder
    const zoneInfo = this.add.text(15, 45, 'Zona: Ninguna\nTipo: ---\nBeneficio: ---', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    });
    this.rightPanel.add(zoneInfo);
    
    // Activities section
    const activitiesTitle = this.add.text(15, 120, '📋 ACTIVIDADES', {
      fontSize: '14px',
      color: '#f39c12',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.rightPanel.add(activitiesTitle);
    
    const activitiesText = this.add.text(15, 150, 'Isa: IDLE\nStev: IDLE', {
      fontSize: '11px',
      color: '#bdc3c7',
      fontFamily: 'Arial'
    });
    this.rightPanel.add(activitiesText);
    
    // Toggle button
    const toggleBtn = this.createModernButton(5, 5, 30, 20, '▶', '#95a5a6', () => {
      this.toggleRightPanel();
    });
    this.rightPanel.add(toggleBtn);
  }
  
  private createMinimap() {
    const minimapSize = 150;
    const minimapX = this.cameras.main.width - minimapSize - 20;
    const minimapY = this.cameras.main.height - minimapSize - 100;
    
    this.minimapContainer = this.add.container(minimapX, minimapY);
    this.minimapContainer.setScrollFactor(0);
    
    // Minimap background
    const minimapBg = this.add.graphics();
    minimapBg.fillStyle(0x2c3e50, 0.9);
    minimapBg.fillRoundedRect(0, 0, minimapSize, minimapSize, 8);
    minimapBg.lineStyle(2, 0x3498db, 0.8);
    minimapBg.strokeRoundedRect(0, 0, minimapSize, minimapSize, 8);
    this.minimapContainer.add(minimapBg);
    
    // Minimap title
    const title = this.add.text(10, 8, '🗺️ MAPA', {
      fontSize: '12px',
      color: '#3498db',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.minimapContainer.add(title);
    
    // Placeholder minimap content
    const mapContent = this.add.graphics();
    mapContent.fillStyle(0x27ae60, 0.5);
    mapContent.fillRect(10, 25, minimapSize - 20, minimapSize - 35);
    
    // Add some sample zones
    mapContent.fillStyle(0xe74c3c, 0.7);
    mapContent.fillRect(20, 35, 30, 20);
    mapContent.fillStyle(0xf39c12, 0.7);
    mapContent.fillRect(60, 45, 25, 25);
    mapContent.fillStyle(0x9b59b6, 0.7);
    mapContent.fillRect(100, 35, 35, 30);
    
    this.minimapContainer.add(mapContent);
    
    // Toggle button
    const toggleBtn = this.createModernButton(minimapSize - 25, 2, 20, 15, '×', '#e74c3c', () => {
      this.toggleMinimap();
    });
    this.minimapContainer.add(toggleBtn);
  }
  
  private setupModernNavigation() {
    // Mouse drag navigation
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only enable dragging if clicking outside UI panels
      const leftPanelBounds = this.leftPanelExpanded ? 290 : 40;
      const rightPanelBounds = this.cameras.main.width - (this.rightPanelExpanded ? 210 : 40);
      
      if (pointer.x > leftPanelBounds && pointer.x < rightPanelBounds && pointer.y > 60 && pointer.y < this.cameras.main.height - 80) {
        this.isDraggingCamera = true;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingCamera) {
        const mainScene = this.scene.get('MainScene');
        if (mainScene) {
          const camera = mainScene.cameras.main;
          const deltaX = this.lastPointerX - pointer.x;
          const deltaY = this.lastPointerY - pointer.y;
          
          camera.scrollX += deltaX;
          camera.scrollY += deltaY;
          
          this.lastPointerX = pointer.x;
          this.lastPointerY = pointer.y;
        }
      }
    });
    
    this.input.on('pointerup', () => {
      this.isDraggingCamera = false;
    });
    
    // Keyboard camera controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as any;
    
    this.scene.get('MainScene').events.on('update', () => {
      const mainScene = this.scene.get('MainScene');
      if (mainScene) {
        const camera = mainScene.cameras.main;
        const speed = 8;
        
        if (cursors?.up.isDown || wasd?.W.isDown) camera.scrollY -= speed;
        if (cursors?.down.isDown || wasd?.S.isDown) camera.scrollY += speed;
        if (cursors?.left.isDown || wasd?.A.isDown) camera.scrollX -= speed;
        if (cursors?.right.isDown || wasd?.D.isDown) camera.scrollX += speed;
      }
    });
  }
  
  private updateCharacterStats(entities: any) {
    // Update character panels
    this.updateCharacterPanels(entities);
  }

  private updateEntityStatsDisplay(panel: Phaser.GameObjects.Container, entityData: any, color: string) {
    // Clear previous stats
    const existingStats = panel.list.filter((child: any) => child.type === 'Text' && child.y > 20);
    existingStats.forEach((stat: any) => stat.destroy());

    if (!entityData.stats) return;

    const stats = entityData.stats;
    const statsText = [
      `❤️ Salud: ${Math.round(stats.health || 0)}`,
      `😊 Felicidad: ${Math.round(stats.happiness || 0)}`,
      `⚡ Energía: ${Math.round(stats.energy || 0)}`,
      `🍎 Hambre: ${Math.round(stats.hunger || 0)}`,
      `😴 Sueño: ${Math.round(stats.sleepiness || 0)}`,
      `💰 Dinero: ${Math.round(stats.money || 0)}`
    ];

    statsText.forEach((text, index) => {
      const statText = this.add.text(5, 25 + (index * 18), text, {
        fontSize: '11px',
        color: '#ecf0f1',
        fontFamily: 'Arial'
      });
      panel.add(statText);
    });

    // Add activity and mood
    const activity = this.add.text(5, 135, `📋 ${entityData.activity || 'IDLE'}`, {
      fontSize: '10px',
      color: color,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    panel.add(activity);
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
    
    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x34495e, 0.6);
    panelBg.fillRoundedRect(0, 0, 250, 160, 5);
    panelBg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    panelBg.strokeRoundedRect(0, 0, 250, 160, 5);
    panelContainer.add(panelBg);
    
    // Character title
    const charTitle = this.add.text(10, 8, title, {
      fontSize: '14px',
      color: color,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    panelContainer.add(charTitle);
    
    // Stats will be added dynamically by updateEntityStatsDisplay
    panelContainer.setData('character', character);
    
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
