import Phaser from "phaser";
import {
  ExplorationUI,
  type ExplorationStats,
} from "../components/ExplorationUI";
import { FoodUI } from "../components/FoodUI";
import { ResonanceLabel, UIElementPool } from "../managers/UIElementPool";
import { DialogueCardUI } from "../components/DialogueCardUI";
import type { Entity, GameLogicUpdateData } from "../types";
import { randomInt } from "../utils/deterministicRandom";
import { logAutopoiesis } from "../utils/logger";

// Define interface at file level to be accessible
interface StatElement {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  barBg: Phaser.GameObjects.Graphics;
  bar: Phaser.GameObjects.Graphics;
  currentValue: number;
}

export class UIScene extends Phaser.Scene {
  private resonanceLabelPool!: UIElementPool<ResonanceLabel>;

  // Modern UI system
  private topBar!: Phaser.GameObjects.Container;
  private bottomBar!: Phaser.GameObjects.Container;
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private leftEdgeToggle?: Phaser.GameObjects.Container;
  private rightEdgeToggle?: Phaser.GameObjects.Container;
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapContent?: Phaser.GameObjects.Graphics;
  private minimapIsaDot?: Phaser.GameObjects.Arc;
  private minimapStevDot?: Phaser.GameObjects.Arc;
  private minimapToggleBtn?: Phaser.GameObjects.Container;
  private foodUI!: FoodUI;
  private explorationUI!: ExplorationUI;
  private dialogueCardUI!: DialogueCardUI;

  // Navigation and control
  private isDraggingCamera = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // UI state
  private leftPanelExpanded = false;
  private rightPanelExpanded = false;
  private showMinimap = false;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    logAutopoiesis.info("🎨 Creating Modern Game UI");

    this.initializePools();

    // Create modern modular UI
    this.createTopBar();
    this.createBottomBar();
    this.createLeftPanel();
    this.createRightPanel();
    this.createMinimap();
    // Colocar los diálogos en la UIScene para que no dependan del zoom
    this.dialogueCardUI = new DialogueCardUI(this, 50, 50);
    this.createFoodUI();
    this.createExplorationUI();

    // Setup modern navigation
    this.setupModernNavigation();

    // Edge toggles to reopen minimized panels
    this.createEdgeToggles();

    // Connect to game logic
    const mainScene = this.scene.get("MainScene");
    mainScene.events.on("gameLogicUpdate", this.updateUI, this);

    // Handle resize events
    this.scale.on("resize", this.handleResize, this);
    this.events.on("shutdown", this.destroy, this);

    logAutopoiesis.info("✅ Modern UI Scene created");
  }

  /**
   * Inicializar pools de elementos UI
   */
  private initializePools(): void {
    this.resonanceLabelPool = new UIElementPool<ResonanceLabel>(
      () => new ResonanceLabel(this),
      "ResonanceLabel",
      3,
    );

    logAutopoiesis.debug("UI element pools initialized");
  }

  /**
   * Actualizar label de resonancia usando pool
   */

  private lastUIUpdate = 0;
  private readonly UI_UPDATE_INTERVAL = 1000; // Actualizar UI solo cada segundo

  private updateUI(data: GameLogicUpdateData) {
    const now = Date.now();

    // Actualizar datos críticos siempre
    this.updateTopBarInfo(data);
    if (data.entities) {
      this.updateCharacterPanels(data.entities);
    }

    // Actualizar UI pesada solo cada segundo
    if (now - this.lastUIUpdate > this.UI_UPDATE_INTERVAL) {
      this.updateBottomBarInfo(data);
      this.updateMinimap(data);
      // Solo actualizar exploración UI cada 5 segundos
      if (now - this.lastUIUpdate > 5000) {
        this.updateExplorationUI(data);
      }
      this.lastUIUpdate = now;
    }
  }

  // =================== MODERN UI CREATION METHODS ===================

  private createTopBar() {
    this.topBar = this.add.container(0, 0);
    this.topBar.setScrollFactor(0);
    this.topBar.setDepth(1000);

    // Modern top bar background with glassmorphism effect
    const topBg = this.add.graphics();

    // Glassmorphism background
    topBg.fillStyle(0x1a1a2e, 0.85);
    topBg.fillRect(0, 0, this.cameras.main.width, 70);

    // Subtle gradient overlay
    topBg.fillGradientStyle(
      0x6c5ce7,
      0x74b9ff,
      0x6c5ce7,
      0x74b9ff,
      0.1,
      0.1,
      0.2,
      0.2,
    );
    topBg.fillRect(0, 0, this.cameras.main.width, 70);

    // Bottom accent line
    topBg.lineStyle(2, 0x74b9ff, 0.6);
    topBg.lineBetween(0, 68, this.cameras.main.width, 68);

    // Subtle shadow
    topBg.fillStyle(0x000000, 0.2);
    topBg.fillRect(0, 70, this.cameras.main.width, 4);

    this.topBar.add(topBg);
    this.topBar.setData("bg", topBg);

    // Modern game title with better typography
    const titleContainer = this.add.container(25, 35);

    const titleText = this.add
      .text(0, 0, "Una Carta Para Isa", {
        fontSize: "22px",
        color: "#FFFFFF",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
        stroke: "#6C5CE7",
        strokeThickness: 1,
      })
      .setOrigin(0, 0.5);

    const titleIcon = this.add
      .text(-30, 0, "💌", {
        fontSize: "24px",
      })
      .setOrigin(0.5, 0.5);

    titleContainer.add([titleIcon, titleText]);
    this.topBar.add(titleContainer);

    // Subtle breathing animation for the title
    this.tweens.add({
      targets: titleIcon,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Modern status indicators
    this.createModernTopBarIndicators();
  }

  private createModernTopBarIndicators() {
    const indicatorY = 35;
    const rightMargin = 30;

    // Create modern indicator pills
    const indicators = [
      {
        icon: "💫",
        label: "Resonancia",
        value: "0%",
        color: 0x74b9ff,
        dataKey: "resonanceText",
        width: 140,
      },
      {
        icon: "⚡",
        label: "Ciclos",
        value: "0",
        color: 0x00cec9,
        dataKey: "cyclesText",
        width: 110,
      },
      {
        icon: "⏰",
        label: "Tiempo",
        value: "00:00",
        color: 0xfdcb6e,
        dataKey: "timeText",
        width: 120,
      },
    ];

    let currentX = this.cameras.main.width - rightMargin;

    indicators.forEach((indicator, index) => {
      currentX -= indicator.width + 15;

      const container = this.add.container(currentX, indicatorY);

      // Modern pill background with glassmorphism
      const bg = this.add.graphics();
      bg.fillStyle(indicator.color, 0.15);
      bg.fillRoundedRect(0, -15, indicator.width, 30, 15);

      bg.lineStyle(1, indicator.color, 0.4);
      bg.strokeRoundedRect(0, -15, indicator.width, 30, 15);

      // Inner glow effect
      bg.fillStyle(indicator.color, 0.05);
      bg.fillRoundedRect(2, -13, indicator.width - 4, 26, 13);

      // Icon with subtle glow
      const iconContainer = this.add.container(18, 0);

      const iconGlow = this.add.graphics();
      iconGlow.fillStyle(indicator.color, 0.3);
      iconGlow.fillCircle(0, 0, 12);

      const iconText = this.add
        .text(0, 0, indicator.icon, {
          fontSize: "14px",
        })
        .setOrigin(0.5, 0.5);

      iconContainer.add([iconGlow, iconText]);

      // Value text
      const valueText = this.add
        .text(indicator.width / 2 + 20, 0, indicator.value, {
          fontSize: "11px",
          color: "#FFFFFF",
          fontFamily: "Arial, sans-serif",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);

      // Label text
      const labelText = this.add
        .text(indicator.width / 2 + 20, -8, indicator.label, {
          fontSize: "8px",
          color: "#B2BEC3",
          fontFamily: "Arial, sans-serif",
        })
        .setOrigin(0.5, 0.5);

      container.add([bg, iconContainer, labelText, valueText]);
      container.setData(indicator.dataKey, valueText);

      // Breathing animation for icons
      this.tweens.add({
        targets: iconText,
        alpha: { from: 0.8, to: 1 },
        scaleX: { from: 0.9, to: 1 },
        scaleY: { from: 0.9, to: 1 },
        duration: 2000 + index * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Hover effects
      container.setSize(indicator.width, 30);
      container.setInteractive();

      container.on("pointerover", () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: "Back.easeOut",
        });
      });

      container.on("pointerout", () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: "Back.easeOut",
        });
      });

      this.topBar.add(container);
    });

    // Add quick action menu button
    this.createModernMenuButton();
  }

  private createModernMenuButton() {
    const menuBtn = this.add.container(this.cameras.main.width - 45, 35);

    // Modern circular menu button with glow
    const menuBg = this.add.graphics();

    // Outer glow
    menuBg.fillStyle(0x6c5ce7, 0.3);
    menuBg.fillCircle(0, 0, 22);

    // Main button
    menuBg.fillStyle(0x6c5ce7, 0.9);
    menuBg.fillCircle(0, 0, 18);

    // Inner highlight
    menuBg.fillStyle(0x74b9ff, 0.4);
    menuBg.fillCircle(-3, -3, 8);

    const menuIcon = this.add
      .text(0, 0, "⚙️", {
        fontSize: "16px",
      })
      .setOrigin(0.5, 0.5);

    menuBtn.add([menuBg, menuIcon]);
    menuBtn.setSize(40, 40);
    menuBtn.setInteractive();

    // Modern hover effects
    menuBtn.on("pointerover", () => {
      this.tweens.add({
        targets: [menuBtn],
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        ease: "Back.easeOut",
      });

      this.tweens.add({
        targets: menuIcon,
        rotation: Math.PI * 0.25,
        duration: 300,
        ease: "Power2.easeOut",
      });
    });

    menuBtn.on("pointerout", () => {
      this.tweens.add({
        targets: [menuBtn],
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: "Back.easeOut",
      });

      this.tweens.add({
        targets: menuIcon,
        rotation: 0,
        duration: 300,
        ease: "Power2.easeOut",
      });
    });

    menuBtn.on("pointerdown", () => {
      // Scale down effect
      this.tweens.add({
        targets: menuBtn,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: "Power2.easeOut",
        onComplete: () => {
          this.toggleGameMenu();
        },
      });
    });

    this.topBar.add(menuBtn);

    // Subtle breathing animation
    this.tweens.add({
      targets: menuBg,
      alpha: { from: 0.9, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createBottomBar() {
    const barHeight = 80;
    this.bottomBar = this.add.container(
      0,
      this.cameras.main.height - barHeight,
    );
    this.bottomBar.setScrollFactor(0);

    // Bottom bar background
    const bottomBg = this.add.graphics();
    bottomBg.fillGradientStyle(
      0x34495e,
      0x34495e,
      0x2c3e50,
      0x2c3e50,
      0.9,
      0.9,
      1,
      1,
    );
    bottomBg.fillRect(0, 0, this.cameras.main.width, barHeight);
    bottomBg.lineStyle(2, 0x1abc9c, 0.8);
    bottomBg.lineBetween(0, 2, this.cameras.main.width, 2);
    this.bottomBar.add(bottomBg);
    this.bottomBar.setData("bg", bottomBg);

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
    const autoBtn = this.createModernButton(
      startX,
      20,
      buttonWidth,
      buttonHeight,
      "🤖 AUTO",
      "#95a5a6",
      () => {
        this.setControlMode("auto");
      },
    );
    this.bottomBar.add(autoBtn);

    // Isa control button
    const isaBtn = this.createModernButton(
      startX + spacing,
      20,
      buttonWidth,
      buttonHeight,
      "👩 ISA",
      "#e91e63",
      () => {
        this.setControlMode("isa");
      },
    );
    this.bottomBar.add(isaBtn);

    // Stev control button
    const stevBtn = this.createModernButton(
      startX + spacing * 2,
      20,
      buttonWidth,
      buttonHeight,
      "👨 STEV",
      "#3498db",
      () => {
        this.setControlMode("stev");
      },
    );
    this.bottomBar.add(stevBtn);
  }

  private createActionButtons() {
    const centerX = this.cameras.main.width / 2;
    const buttonWidth = 60;
    const buttonHeight = 35;
    const spacing = 70;

    // Pause/Play button
    const pauseBtn = this.createModernButton(
      centerX - spacing,
      20,
      buttonWidth,
      buttonHeight,
      "⏸️",
      "#f39c12",
      () => {
        this.togglePause();
      },
    );
    this.bottomBar.add(pauseBtn);

    // Settings button
    const settingsBtn = this.createModernButton(
      centerX,
      20,
      buttonWidth,
      buttonHeight,
      "⚙️",
      "#9b59b6",
      () => {
        this.openSettings();
      },
    );
    this.bottomBar.add(settingsBtn);

    // Screenshot button
    const screenshotBtn = this.createModernButton(
      centerX + spacing,
      20,
      buttonWidth,
      buttonHeight,
      "📷",
      "#1abc9c",
      () => {
        this.takeScreenshot();
      },
    );
    this.bottomBar.add(screenshotBtn);
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
    const speedLabel = this.add.text(10, 8, "⚡ Velocidad:", {
      fontSize: "10px",
      color: "#ecf0f1",
      fontFamily: "Arial",
    });
    speedContainer.add(speedLabel);

    // Speed buttons
    const slowBtn = this.createModernButton(
      10,
      20,
      25,
      15,
      "0.5x",
      "#e74c3c",
      () => {
        this.setGameSpeed(0.5);
      },
    );
    speedContainer.add(slowBtn);

    const normalBtn = this.createModernButton(
      40,
      20,
      25,
      15,
      "1x",
      "#95a5a6",
      () => {
        this.setGameSpeed(1);
      },
    );
    speedContainer.add(normalBtn);

    const fastBtn = this.createModernButton(
      70,
      20,
      25,
      15,
      "2x",
      "#f39c12",
      () => {
        this.setGameSpeed(2);
      },
    );
    speedContainer.add(fastBtn);

    const turboBtn = this.createModernButton(
      100,
      20,
      25,
      15,
      "5x",
      "#e67e22",
      () => {
        this.setGameSpeed(5);
      },
    );
    speedContainer.add(turboBtn);

    this.bottomBar.add(speedContainer);
  }

  private createLeftPanel() {
    const panelWidth = 300;
    const panelHeight = this.cameras.main.height - 140;

    // Start minimized by default
    const initialX = this.leftPanelExpanded ? 10 : -250;
    this.leftPanel = this.add.container(initialX, 70);
    this.leftPanel.setScrollFactor(0);

    // Enhanced panel background with shadow effect
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(3, 3, panelWidth, panelHeight, 8);
    this.leftPanel.add(shadow);

    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(
      0x34495e,
      0x2c3e50,
      0x34495e,
      0x2c3e50,
      0.96,
      0.96,
      0.96,
      0.96,
    );
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(3, 0x1abc9c, 0.8);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);

    // Add inner glow effect
    panelBg.lineStyle(1, 0x1abc9c, 0.3);
    panelBg.strokeRoundedRect(2, 2, panelWidth - 4, panelHeight - 4, 6);
    this.leftPanel.add(panelBg);

    // Enhanced panel header
    const headerBg = this.add.graphics();
    headerBg.fillGradientStyle(
      0x1abc9c,
      0x16a085,
      0x1abc9c,
      0x16a085,
      0.2,
      0.2,
      0.1,
      0.1,
    );
    headerBg.fillRoundedRect(0, 0, panelWidth, 35, 8);
    this.leftPanel.add(headerBg);

    // Panel title with better styling
    const title = this.add
      .text(panelWidth / 2, 18, "📊 ESTADÍSTICAS DE PERSONAJES", {
        fontSize: "14px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.leftPanel.add(title);

    // Character panels with improved spacing
    this.createCharacterPanel("isa", 15, 50, "#e91e63", "👩 ISA");
    this.createCharacterPanel("stev", 15, 235, "#3498db", "👨 STEV");

    // Enhanced toggle button
    const toggleBtn = this.createModernButton(
      panelWidth - 35,
      8,
      30,
      20,
      "◀",
      "#95a5a6",
      () => {
        this.toggleLeftPanel();
      },
    );
    this.leftPanel.add(toggleBtn);
  }

  private createRightPanel() {
    const panelWidth = 220;
    const panelHeight = this.cameras.main.height - 140;
    // Start minimized by default
    const panelX = this.rightPanelExpanded
      ? this.cameras.main.width - panelWidth - 10
      : this.cameras.main.width + 10;

    this.rightPanel = this.add.container(panelX, 70);
    this.rightPanel.setScrollFactor(0);

    // Enhanced panel background with shadow effect
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-3, 3, panelWidth, panelHeight, 8);
    this.rightPanel.add(shadow);

    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(
      0x34495e,
      0x2c3e50,
      0x34495e,
      0x2c3e50,
      0.96,
      0.96,
      0.96,
      0.96,
    );
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panelBg.lineStyle(3, 0x9b59b6, 0.8);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);

    // Add inner glow effect
    panelBg.lineStyle(1, 0x9b59b6, 0.3);
    panelBg.strokeRoundedRect(2, 2, panelWidth - 4, panelHeight - 4, 6);
    this.rightPanel.add(panelBg);

    // Enhanced panel header
    const headerBg = this.add.graphics();
    headerBg.fillGradientStyle(
      0x9b59b6,
      0x8e44ad,
      0x9b59b6,
      0x8e44ad,
      0.2,
      0.2,
      0.1,
      0.1,
    );
    headerBg.fillRoundedRect(0, 0, panelWidth, 35, 8);
    this.rightPanel.add(headerBg);

    // Panel title with better styling
    const title = this.add
      .text(panelWidth / 2, 18, "🎯 INFORMACIÓN DEL MUNDO", {
        fontSize: "12px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.rightPanel.add(title);

    // Zone info section with better layout
    const zoneSection = this.add.container(0, 45);
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x2c3e50, 0.6);
    zoneBg.fillRoundedRect(10, 0, panelWidth - 20, 80, 5);
    zoneSection.add(zoneBg);

    const zoneTitle = this.add.text(15, 10, "🗺️ ZONA ACTUAL", {
      fontSize: "11px",
      color: "#9b59b6",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    zoneSection.add(zoneTitle);

    const zoneInfo = this.add.text(
      15,
      25,
      "Zona: Ninguna\nTipo: ---\nBeneficio: ---\nDistancia: ---",
      {
        fontSize: "10px",
        color: "#bdc3c7",
        fontFamily: "Arial, sans-serif",
        lineSpacing: 2,
      },
    );
    zoneSection.add(zoneInfo);
    this.rightPanel.add(zoneSection);

    // Activities section with better layout
    const activitiesSection = this.add.container(0, 140);
    const activitiesBg = this.add.graphics();
    activitiesBg.fillStyle(0x2c3e50, 0.6);
    activitiesBg.fillRoundedRect(10, 0, panelWidth - 20, 90, 5);
    activitiesSection.add(activitiesBg);

    const activitiesTitle = this.add.text(15, 10, "📋 ACTIVIDADES", {
      fontSize: "11px",
      color: "#f39c12",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    activitiesSection.add(activitiesTitle);

    const activitiesText = this.add.text(
      15,
      25,
      "👩 Isa: IDLE\n👨 Stev: IDLE\n\n⏱️ Tiempo: 00:00",
      {
        fontSize: "10px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
        lineSpacing: 3,
      },
    );
    activitiesSection.add(activitiesText);
    this.rightPanel.add(activitiesSection);

    // Enhanced toggle button
    const toggleBtn = this.createModernButton(
      8,
      8,
      30,
      20,
      "▶",
      "#95a5a6",
      () => {
        this.toggleRightPanel();
      },
    );
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
    minimapBg.fillGradientStyle(
      0x2c3e50,
      0x34495e,
      0x2c3e50,
      0x34495e,
      0.95,
      0.95,
      0.95,
      0.95,
    );
    minimapBg.fillRoundedRect(0, 0, minimapSize, minimapSize, 8);
    minimapBg.lineStyle(2, 0x3498db, 0.7);
    minimapBg.strokeRoundedRect(0, 0, minimapSize, minimapSize, 8);
    this.minimapContainer.add(minimapBg);

    // Minimap title with better positioning
    const title = this.add
      .text(minimapSize / 2, 12, "🗺️ MAPA", {
        fontSize: "11px",
        color: "#3498db",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
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
    this.minimapContent = mapContent;

    // Improved toggle button
    const toggleBtn = this.createModernButton(
      minimapSize - 20,
      2,
      16,
      16,
      "×",
      "#e74c3c",
      () => {
        this.toggleMinimap();
      },
    );
    this.minimapContainer.add(toggleBtn);

    // Also add a small floating reopen button when minimap is hidden
    const reopenBtn = this.createModernButton(
      this.cameras.main.width - 45,
      this.cameras.main.height - 45,
      28,
      28,
      "🗺️",
      "#3498db",
      () => this.toggleMinimap(),
    );
    reopenBtn.setScrollFactor(0);
    reopenBtn.setDepth(1002);
    this.minimapToggleBtn = reopenBtn;
    // Hidden button is visible only when minimap is hidden
    this.minimapToggleBtn.setVisible(!this.showMinimap);

    // Apply initial visibility state
    this.minimapContainer.setVisible(this.showMinimap);
  }

  private createEdgeToggles() {
    // Left edge toggle (open/close left panel)
    const leftBtn = this.createModernButton(5, 90, 22, 40, "▶", "#95a5a6", () => {
      this.toggleLeftPanel();
    });
    leftBtn.setScrollFactor(0);
    leftBtn.setDepth(1001);
    this.leftEdgeToggle = leftBtn;

    // Right edge toggle
    const rightX = this.cameras.main.width - 27;
    const rightBtn = this.createModernButton(rightX, 90, 22, 40, "◀", "#95a5a6", () => {
      this.toggleRightPanel();
    });
    rightBtn.setScrollFactor(0);
    rightBtn.setDepth(1001);
    this.rightEdgeToggle = rightBtn;
  }

  private setupModernNavigation() {
    // Mouse drag navigation - improved bounds detection
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Calculate accurate UI bounds to avoid navigation conflicts
      const topBarHeight = 60;
      const bottomBarHeight = 80;
      const leftPanelWidth = this.leftPanelExpanded ? 300 : 50;
      const rightPanelWidth = this.rightPanelExpanded ? 220 : 50;

      // Check if clicking within navigable area (not on UI elements)
      // Excluir áreas de UI (barras, paneles, minimapa y cartas de diálogo)
      const isInNavigableArea =
        pointer.x > leftPanelWidth &&
        pointer.x < this.cameras.main.width - rightPanelWidth &&
        pointer.y > topBarHeight &&
        pointer.y < this.cameras.main.height - bottomBarHeight &&
        !this.isPointerOverDialogueUI(pointer);

      if (isInNavigableArea) {
        this.isDraggingCamera = true;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;

        // Visual feedback for dragging (removed setTint - not available on Camera)
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingCamera) {
        const mainScene = this.scene.get("MainScene");
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

    this.input.on("pointerup", () => {
      if (this.isDraggingCamera) {
        this.isDraggingCamera = false;
        // Remove visual feedback (removed clearTint - not available on Camera)
      }
    });

    // Enhanced keyboard camera controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys("W,S,A,D,SHIFT") as any;

    // Use UIScene's update loop for camera controls to avoid conflicts
    this.events.on("update", () => {
      const mainScene = this.scene.get("MainScene");
      if (
        mainScene &&
        mainScene.cameras &&
        mainScene.cameras.main &&
        !this.isDraggingCamera
      ) {
        const camera = mainScene.cameras.main;
        const baseSpeed = wasd?.SHIFT?.isDown ? 12 : 6; // Faster with shift

        // Keyboard navigation
        if (cursors?.up.isDown || wasd?.W?.isDown) {
          camera.scrollY = Phaser.Math.Clamp(
            camera.scrollY - baseSpeed,
            -500,
            2000,
          );
        }
        if (cursors?.down.isDown || wasd?.S?.isDown) {
          camera.scrollY = Phaser.Math.Clamp(
            camera.scrollY + baseSpeed,
            -500,
            2000,
          );
        }
        if (cursors?.left.isDown || wasd?.A?.isDown) {
          camera.scrollX = Phaser.Math.Clamp(
            camera.scrollX - baseSpeed,
            -500,
            2000,
          );
        }
        if (cursors?.right.isDown || wasd?.D?.isDown) {
          camera.scrollX = Phaser.Math.Clamp(
            camera.scrollX + baseSpeed,
            -500,
            2000,
          );
        }
      }
    });

    // Mouse wheel zoom (optional enhancement)
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        const mainScene = this.scene.get("MainScene");
        if (mainScene && mainScene.cameras && mainScene.cameras.main) {
          const camera = mainScene.cameras.main;
          const zoomSpeed = 0.1;
          const newZoom =
            deltaY < 0 ? camera.zoom + zoomSpeed : camera.zoom - zoomSpeed;
          camera.setZoom(Phaser.Math.Clamp(newZoom, 0.5, 2.0));
        }
      },
    );
  }

  private isPointerOverDialogueUI(pointer: Phaser.Input.Pointer): boolean {
    if (!this.dialogueCardUI) return false;
    const container = this.dialogueCardUI.getContainer();
    const bounds = container.getBounds();
    return (
      pointer.x >= bounds.x &&
      pointer.x <= bounds.x + bounds.width &&
      pointer.y >= bounds.y &&
      pointer.y <= bounds.y + bounds.height
    );
  }

  private updateEntityStatsDisplay(
    panel: Phaser.GameObjects.Container,
    entityData: Entity,
    color: string,
  ) {
    if (!entityData.stats) return;

    const { stats } = entityData;

    // Update activity text if it exists
    const activityText = panel.getData("activityText");
    if (activityText && entityData.activity) {
      activityText.setText(entityData.activity || "IDLE");
    }

    // Check if stats elements exist, if not create them
    let statsElements = panel.getData("statsElements");
    if (!statsElements) {
      statsElements = this.createStatsElements(panel);
      panel.setData("statsElements", statsElements);
    }

    // Define current stats data
    const statsColumn1 = [
      {
        icon: "❤️",
        label: "Salud",
        value: Math.round(stats.health || 0),
        color: "#e74c3c",
        key: "health",
      },
      {
        icon: "😊",
        label: "Felicidad",
        value: Math.round(stats.happiness || 0),
        color: "#f39c12",
        key: "happiness",
      },
      {
        icon: "⚡",
        label: "Energía",
        value: Math.round(stats.energy || 0),
        color: "#3498db",
        key: "energy",
      },
    ];

    const statsColumn2 = [
      {
        icon: "🍎",
        label: "Hambre",
        value: Math.round(stats.hunger || 0),
        color: "#27ae60",
        key: "hunger",
      },
      {
        icon: "😴",
        label: "Sueño",
        value: Math.round(stats.sleepiness || 0),
        color: "#9b59b6",
        key: "sleepiness",
      },
      {
        icon: "💰",
        label: "Dinero",
        value: Math.round(stats.money || 0),
        color: "#f1c40f",
        key: "money",
      },
    ];

    // Animate column 1 stats
    if (statsElements?.column1) {
      statsColumn1.forEach((stat, index) => {
        if (statsElements.column1[index]) {
          this.animateStatBar(statsElements.column1[index], stat);
        }
      });
    }

    // Animate column 2 stats
    if (statsElements?.column2) {
      statsColumn2.forEach((stat, index) => {
        if (statsElements.column2[index]) {
          this.animateStatBar(statsElements.column2[index], stat);
        }
      });
    }

    // Mood indicator at the bottom
    if (entityData.mood) {
      const moodBg = this.add.graphics();
      moodBg.fillStyle(0x2c3e50, 0.6);
      moodBg.fillRoundedRect(10, 155, 250, 15, 3);
      panel.add(moodBg);

      const moodText = this.add
        .text(135, 162, `💭 Humor: ${entityData.mood}`, {
          fontSize: "10px",
          color,
          fontFamily: "Arial, sans-serif",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      panel.add(moodText);
    }
  }

  /**
   * Creates persistent stat elements that can be animated instead of recreated
   */
  private createStatsElements(panel: Phaser.GameObjects.Container) {
    const column1Elements: StatElement[] = [];
    const column2Elements: StatElement[] = [];

    // Create column 1 stat elements (left side)
    for (let i = 0; i < 3; i++) {
      const statLabel = this.add.text(10, 80 + i * 25, "", {
        fontSize: "10px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      });

      const valueText = this.add.text(10, 92 + i * 25, "0", {
        fontSize: "9px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
      });

      const barBg = this.add.graphics();
      barBg.fillStyle(0x2c3e50, 0.8);
      barBg.fillRoundedRect(45, 83 + i * 25, 80, 8, 4);

      const bar = this.add.graphics();
      bar.fillStyle(0x27ae60, 0.8);
      bar.fillRoundedRect(47, 85 + i * 25, 2, 4, 2);

      panel.add([statLabel, valueText, barBg, bar]);

      column1Elements.push({
        label: statLabel,
        value: valueText,
        barBg: barBg,
        bar: bar,
        currentValue: 0,
      });
    }

    // Create column 2 stat elements (right side)
    for (let i = 0; i < 3; i++) {
      const statLabel = this.add.text(140, 80 + i * 25, "", {
        fontSize: "10px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      });

      const valueText = this.add.text(140, 92 + i * 25, "0", {
        fontSize: "9px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
      });

      const barBg = this.add.graphics();
      barBg.fillStyle(0x2c3e50, 0.8);
      barBg.fillRoundedRect(175, 83 + i * 25, 80, 8, 4);

      const bar = this.add.graphics();
      bar.fillStyle(0x27ae60, 0.8);
      bar.fillRoundedRect(177, 85 + i * 25, 2, 4, 2);

      panel.add([statLabel, valueText, barBg, bar]);

      column2Elements.push({
        label: statLabel,
        value: valueText,
        barBg: barBg,
        bar: bar,
        currentValue: 0,
      });
    }

    return { column1: column1Elements, column2: column2Elements };
  }

  /**
   * Animates a stat bar to new value with smooth tween
   */
  private animateStatBar(
    element: StatElement,
    stat: {
      icon: string;
      label: string;
      value: number;
      color: string;
      key: string;
    },
  ) {
    // Update label and color
    element.label.setText(`${stat.icon} ${stat.label}`);
    element.label.setStyle({ color: stat.color });

    // Animate value change
    if (element.currentValue !== stat.value) {
      this.tweens.addCounter({
        from: element.currentValue,
        to: stat.value,
        duration: 800, // 800ms smooth animation
        ease: "Power2",
        onUpdate: (tween) => {
          const value = Math.round(tween.getValue());
          element.value.setText(`${value}`);

          // Animate bar width
          let barColor = "#e74c3c";
          if (value > 70) {
            barColor = "#27ae60";
          } else if (value > 30) {
            barColor = "#f39c12";
          }

          const barWidth = Math.max((value / 100) * 76, 2);

          element.bar.clear();
          element.bar.fillStyle(
            Phaser.Display.Color.HexStringToColor(barColor).color,
            0.8,
          );

          // For column 1 or column 2 position
          const isColumn2 = element.label.x === 140;
          const barX = isColumn2 ? 177 : 47;
          const barY = element.label.y + 5; // Relative to label

          element.bar.fillRoundedRect(barX, barY, barWidth, 4, 2);
        },
        onComplete: () => {
          element.currentValue = stat.value;
        },
      });
    } else {
      // Just update text if value hasn't changed
      element.value.setText(`${stat.value}`);
    }
  }

  // =================== HELPER METHODS ===================

  private createModernButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: string,
    callback: () => void,
  ) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    const colorValue = Phaser.Display.Color.HexStringToColor(color).color;
    bg.fillStyle(colorValue, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 3);
    button.add(bg);

    const label = this.add
      .text(width / 2, height / 2, text, {
        fontSize: "11px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    button.add(label);

    button.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    button.on("pointerdown", callback);
    button.on("pointerover", () => bg.setAlpha(1));
    button.on("pointerout", () => bg.setAlpha(0.8));

    return button;
  }

  private createCharacterPanel(
    character: string,
    x: number,
    y: number,
    color: string,
    title: string,
  ) {
    const panelContainer = this.add.container(x, y);
    const panelWidth = 270;
    const panelHeight = 175;

    // Enhanced character panel background with shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(2, 2, panelWidth, panelHeight, 6);
    panelContainer.add(shadow);

    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(
      0x2c3e50,
      0x34495e,
      0x2c3e50,
      0x34495e,
      0.8,
      0.8,
      0.8,
      0.8,
    );
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 6);
    panelBg.lineStyle(
      2,
      Phaser.Display.Color.HexStringToColor(color).color,
      0.9,
    );
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 6);

    // Inner highlight
    panelBg.lineStyle(
      1,
      Phaser.Display.Color.HexStringToColor(color).color,
      0.4,
    );
    panelBg.strokeRoundedRect(1, 1, panelWidth - 2, panelHeight - 2, 5);
    panelContainer.add(panelBg);

    // Character header
    const headerBg = this.add.graphics();
    const headerColor = Phaser.Display.Color.HexStringToColor(color).color;
    headerBg.fillGradientStyle(
      headerColor,
      headerColor,
      headerColor,
      headerColor,
      0.3,
      0.3,
      0.1,
      0.1,
    );
    headerBg.fillRoundedRect(0, 0, panelWidth, 30, 6);
    panelContainer.add(headerBg);

    // Character title with better styling
    const charTitle = this.add
      .text(panelWidth / 2, 15, title, {
        fontSize: "13px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    panelContainer.add(charTitle);

    // Character portrait placeholder (could be sprite in future)
    const portrait = this.add.graphics();
    portrait.fillStyle(headerColor, 0.2);
    portrait.fillCircle(35, 55, 20);
    portrait.lineStyle(2, headerColor, 0.8);
    portrait.strokeCircle(35, 55, 20);
    panelContainer.add(portrait);

    // Portrait emoji
    const portraitEmoji = this.add
      .text(35, 55, character === "isa" ? "👩" : "👨", {
        fontSize: "24px",
      })
      .setOrigin(0.5);
    panelContainer.add(portraitEmoji);

    // Activity status indicator
    const activityBg = this.add.graphics();
    activityBg.fillStyle(0x2c3e50, 0.7);
    activityBg.fillRoundedRect(65, 40, panelWidth - 75, 30, 4);
    panelContainer.add(activityBg);

    const activityLabel = this.add.text(70, 45, "🎯 Estado:", {
      fontSize: "10px",
      color: "#95a5a6",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    panelContainer.add(activityLabel);

    const activityText = this.add.text(70, 58, "IDLE", {
      fontSize: "11px",
      color,
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    panelContainer.add(activityText);

    // Stats will be added dynamically by updateEntityStatsDisplay starting at y: 75
    panelContainer.setData("character", character);
    panelContainer.setData("activityText", activityText);

    this.leftPanel.add(panelContainer);

    // Store reference for updates
    if (character === "isa") {
      this.leftPanel.setData("isaStatsPanel", panelContainer);
    } else {
      this.leftPanel.setData("stevStatsPanel", panelContainer);
    }
  }

  private updateCharacterPanels(
    entities: Entity[] | { [key: string]: Entity },
  ) {
    // Handle both array format and object format
    let isaEntity = null;
    let stevEntity = null;

    if (Array.isArray(entities)) {
      isaEntity = entities.find((entity) => entity.id === "isa");
      stevEntity = entities.find((entity) => entity.id === "stev");
    } else if (entities && typeof entities === "object") {
      // Handle object format: { isa: {...}, stev: {...} }
      isaEntity = entities.isa;
      stevEntity = entities.stev;
    }

    if (isaEntity) {
      const isaPanel = this.leftPanel.getData("isaStatsPanel");
      if (isaPanel && isaEntity.stats) {
        // Create Entity-like object from the data
        const entityData = {
          id: "isa",
          stats: isaEntity.stats,
          activity: isaEntity.activity,
          mood: isaEntity.mood,
          position: isaEntity.position,
          state: "idle" as const,
          isDead: false,
          resonance: isaEntity.resonance || 0,
        };
        this.updateEntityStatsDisplay(isaPanel, entityData, "#e91e63");
      }
    }

    if (stevEntity) {
      const stevPanel = this.leftPanel.getData("stevStatsPanel");
      if (stevPanel && stevEntity.stats) {
        // Create Entity-like object from the data
        const entityData = {
          id: "stev",
          stats: stevEntity.stats,
          activity: stevEntity.activity,
          mood: stevEntity.mood,
          position: stevEntity.position,
          state: "idle" as const,
          isDead: false,
          resonance: stevEntity.resonance || 0,
        };
        this.updateEntityStatsDisplay(stevPanel, entityData, "#3498db");
      }
    }
  }

  private updateTopBarInfo(data: GameLogicUpdateData) {
    // Update resonance indicator
    const resonanceContainer = this.topBar.list.find(
      (child: Phaser.GameObjects.GameObject) =>
        (child as any).getData?.("resonanceText"),
    ) as Phaser.GameObjects.Container;
    if (resonanceContainer && data.resonance !== undefined) {
      const resonanceText = resonanceContainer.getData("resonanceText");
      if (resonanceText) {
        resonanceText.setText(`Resonancia: ${Math.round(data.resonance)}%`);
      }
    }

    // Update cycles indicator
    const cyclesContainer = this.topBar.list.find(
      (child: Phaser.GameObjects.GameObject) =>
        (child as any).getData?.("cyclesText"),
    ) as Phaser.GameObjects.Container;
    if (cyclesContainer && data.cycles !== undefined) {
      const cyclesText = cyclesContainer.getData("cyclesText");
      if (cyclesText) {
        cyclesText.setText(`Ciclos: ${data.cycles}`);
      }
    }
  }

  private updateBottomBarInfo(_data: GameLogicUpdateData) {
    // Update control mode visual feedback if needed
    // Could highlight active control buttons based on current mode
  }

  private updateMinimap(data: GameLogicUpdateData) {
    if (!this.minimapContainer || !this.minimapContent) return;
    // Obtain world size from registry to scale positions
    const gameState = this.registry.get("gameState") as any;
    const worldSize = gameState?.worldSize || { width: 1200, height: 800 };

    const minimapSize = 140;
    const contentX = 8;
    const contentY = 28;
    const contentW = minimapSize - 16;
    const contentH = minimapSize - 40;

    const scaleX = contentW / worldSize.width;
    const scaleY = contentH / worldSize.height;

    // Clear and redraw base terrain area
    this.minimapContent.clear();
    this.minimapContent.fillStyle(0x27ae60, 0.4);
    this.minimapContent.fillRoundedRect(contentX, contentY, contentW, contentH, 4);

    // Optional: draw a few zones from game state for orientation
    const zones = gameState?.zones || [];
    zones.slice(0, 4).forEach((z: any, idx: number) => {
      const colrs = [0xe74c3c, 0xf39c12, 0x9b59b6, 0x1abc9c];
      const c = colrs[idx % colrs.length];
      const zx = contentX + z.bounds.x * scaleX;
      const zy = contentY + z.bounds.y * scaleY;
      const zw = Math.max(2, z.bounds.width * scaleX);
      const zh = Math.max(2, z.bounds.height * scaleY);
      this.minimapContent.fillStyle(c, 0.6);
      this.minimapContent.fillRoundedRect(zx, zy, zw, zh, 2);
    });

    // Ensure dots exist
    if (!this.minimapIsaDot) {
      this.minimapIsaDot = this.add.circle(0, 0, 3, 0xff1744, 1);
      this.minimapContainer.add(this.minimapIsaDot);
    }
    if (!this.minimapStevDot) {
      this.minimapStevDot = this.add.circle(0, 0, 3, 0x00bcd4, 1);
      this.minimapContainer.add(this.minimapStevDot);
    }

    // Update entity markers
    const isa = data.entities?.find((e) => e.id === "isa");
    const stev = data.entities?.find((e) => e.id === "stev");
    if (isa) {
      this.minimapIsaDot.setPosition(
        contentX + isa.position.x * scaleX,
        contentY + isa.position.y * scaleY,
      );
    }
    if (stev) {
      this.minimapStevDot.setPosition(
        contentX + stev.position.x * scaleX,
        contentY + stev.position.y * scaleY,
      );
    }
  }

  // =================== CONTROL METHODS ===================

  private setControlMode(mode: "auto" | "isa" | "stev") {
    // this.currentControlMode = mode; // Comentado temporalmente
    const mainScene = this.scene.get("MainScene");
    mainScene.events.emit(
      "changeEntityControl",
      mode === "auto" ? "none" : mode,
    );

    logAutopoiesis.info(`Control mode changed to: ${mode}`);
  }

  private setGameSpeed(speed: number) {
    // Use GameLogicManager for speed control instead
    const mainScene = this.scene.get("MainScene") as any;
    if (mainScene?.gameLogicManager) {
      mainScene.gameLogicManager.setGameSpeed(speed);
    }
    logAutopoiesis.info(`Game speed set to: ${speed}x`);
  }

  private togglePause() {
    const mainScene = this.scene.get("MainScene");
    if (mainScene.scene.isPaused()) {
      mainScene.scene.resume();
      logAutopoiesis.info("Game resumed");
    } else {
      mainScene.scene.pause();
      logAutopoiesis.info("Game paused");
    }
  }

  private openSettings() {
    // Placeholder for settings menu
    logAutopoiesis.info("Settings menu requested");
  }

  private takeScreenshot() {
    // Capturar screenshot del canvas principal
    const mainScene = this.scene.get("MainScene");
    if (mainScene) {
      const canvas = mainScene.game.canvas;
      const link = document.createElement("a");
      link.download = `UnaCartaParaIsa_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
      link.href = canvas.toDataURL();
      link.click();
      logAutopoiesis.info("Screenshot captured");
    }
  }

  private toggleGameMenu() {
    // Crear panel de menú de juego con opciones
    const menuContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
    );
    menuContainer.setDepth(2000);

    // Fondo semi-transparente
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7,
    );
    overlay.setInteractive();

    // Panel del menú
    const menuPanel = this.add.rectangle(0, 0, 400, 300, 0x2c3e50, 0.95);
    menuPanel.setStrokeStyle(3, 0x1abc9c);

    // Título
    const title = this.add
      .text(0, -100, "MENÚ DE JUEGO", {
        fontSize: "24px",
        color: "#ecf0f1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Botón Nueva Partida
    const newGameBtn = this.createModernButton(
      0,
      -40,
      200,
      30,
      "🎮 Nueva Partida",
      "#e74c3c",
      () => {
        this.startNewGame();
        menuContainer.destroy();
      },
    );

    // Botón Configuración
    const settingsBtn = this.createModernButton(
      0,
      0,
      200,
      30,
      "⚙️ Configuración",
      "#3498db",
      () => {
        this.openSettings();
        menuContainer.destroy();
      },
    );

    // Botón Cerrar
    const closeBtn = this.createModernButton(
      0,
      40,
      200,
      30,
      "❌ Cerrar",
      "#95a5a6",
      () => {
        menuContainer.destroy();
      },
    );

    menuContainer.add([
      overlay,
      menuPanel,
      title,
      newGameBtn,
      settingsBtn,
      closeBtn,
    ]);

    // Cerrar con click en overlay
    overlay.on("pointerdown", () => {
      menuContainer.destroy();
    });

    logAutopoiesis.info("Game menu opened");
  }

  private startNewGame() {
    // Recargar la página para empezar una nueva partida
    logAutopoiesis.info("Starting new game - reloading page");
    window.location.reload();
  }

  private toggleLeftPanel() {
    this.leftPanelExpanded = !this.leftPanelExpanded;
    const targetX = this.leftPanelExpanded ? 10 : -250;

    this.tweens.add({
      targets: this.leftPanel,
      x: targetX,
      duration: 300,
      ease: "Power2",
    });
  }

  private toggleRightPanel() {
    this.rightPanelExpanded = !this.rightPanelExpanded;
    const panelWidth = 220;
    const targetX = this.rightPanelExpanded
      ? this.cameras.main.width - panelWidth - 10
      : this.cameras.main.width + 10;

    this.tweens.add({
      targets: this.rightPanel,
      x: targetX,
      duration: 300,
      ease: "Power2",
    });
  }

  private toggleMinimap() {
    this.showMinimap = !this.showMinimap;
    this.minimapContainer.setVisible(this.showMinimap);
    if (this.minimapToggleBtn) {
      this.minimapToggleBtn.setVisible(!this.showMinimap);
    }
  }

  /**
   * Handle screen resize events
   */
  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // Reposition panels based on new screen size
    if (this.leftPanel) {
      // Keep aligned below top bar, same as initial layout
      this.leftPanel.setPosition(10, 70);
    }

    if (this.rightPanel) {
      // Keep aligned below top bar; panel width is 220
      this.rightPanel.setPosition(width - 220 - 10, 70);
    }

    if (this.minimapContainer) {
      // Use same offsets as initial creation
      const minimapSize = 140;
      this.minimapContainer.setPosition(
        width - minimapSize - 15,
        height - minimapSize - 90,
      );
    }

    if (this.minimapToggleBtn) {
      this.minimapToggleBtn.setPosition(width - 45, height - 45);
    }

    // Reposition edge toggles
    if (this.leftEdgeToggle) {
      this.leftEdgeToggle.setPosition(5, 90);
    }
    if (this.rightEdgeToggle) {
      this.rightEdgeToggle.setPosition(width - 27, 90);
    }

    if (this.bottomBar) {
      // Anchor to bottom-left consistent with initial creation
      const barHeight = 80;
      this.bottomBar.setPosition(0, height - barHeight);

      // Resize bottom bar background to fit width
      const bg = this.bottomBar.getData("bg") as Phaser.GameObjects.Graphics;
      if (bg) {
        bg.clear();
        bg.fillGradientStyle(
          0x34495e,
          0x34495e,
          0x2c3e50,
          0x2c3e50,
          0.9,
          0.9,
          1,
          1,
        );
        bg.fillRect(0, 0, width, barHeight);
        bg.lineStyle(2, 0x1abc9c, 0.8);
        bg.lineBetween(0, 2, width, 2);
      }
    }

    if (this.foodUI) {
      this.foodUI.updatePosition();
    }
  }

  /**
   * Limpieza al destruir la escena
   */
  destroy(): void {
    if (this.resonanceLabelPool) {
      this.resonanceLabelPool.destroy();
    }

    logAutopoiesis.debug("UIScene destroyed - pools cleaned up");
  }

  /**
   * Crea la UI del sistema de comida
   */
  private createFoodUI(): void {
    this.foodUI = new FoodUI(this);
    logAutopoiesis.info("Food UI creada");
  }

  /**
   * Crea la UI de exploración
   */
  private createExplorationUI(): void {
    this.explorationUI = new ExplorationUI(this);

    // Añadir botón para abrir el atlas en el top bar
    this.addExplorationButton();

    logAutopoiesis.info("🗺️ Exploration UI creada");
  }

  /**
   * Añade botón de exploración al top bar
   */
  private addExplorationButton(): void {
    const button = this.add.text(this.cameras.main.width - 80, 20, "🗺️", {
      fontSize: "24px",
      fontStyle: "bold",
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.setScrollFactor(0);
    button.setDepth(1001);

    // Efectos de hover
    button.on("pointerover", () => {
      button.setScale(1.1);
      button.setTint(0x3498db);
    });

    button.on("pointerout", () => {
      button.setScale(1.0);
      button.clearTint();
    });

    // Abrir UI de exploración
    button.on("pointerdown", () => {
      this.explorationUI.toggle();

      // Actualizar con estadísticas simuladas
      const stats: ExplorationStats = {
        totalAssets: 714,
        discoveredAssets: randomInt(50, 250),
        biomesExplored: randomInt(1, 7),
        rarityBreakdown: {
          common: randomInt(20, 70),
          uncommon: randomInt(10, 40),
          rare: randomInt(5, 20),
          epic: randomInt(1, 6),
        },
        currentBiome: "Praderas Místicas",
      };

      this.explorationUI.updateStats(stats);
    });

    this.topBar.add(button);
  }

  /**
   * Actualiza la UI de exploración con datos reales del juego
   */
  updateExplorationUI(gameData: GameLogicUpdateData): void {
    if (!this.explorationUI) return;

    // Calcular estadísticas reales basadas en el estado del juego
    const stats: ExplorationStats = {
      totalAssets: 714,
      discoveredAssets: gameData.cycles * 2 + 50, // Simular descubrimiento progresivo
      biomesExplored: Math.min(Math.floor(gameData.cycles / 10) + 1, 6),
      rarityBreakdown: {
        common: Math.floor(gameData.cycles * 0.8) + 10,
        uncommon: Math.floor(gameData.cycles * 0.4) + 5,
        rare: Math.floor(gameData.cycles * 0.2) + 2,
        epic: Math.floor(gameData.cycles * 0.1) + 1,
      },
      currentBiome: this.getCurrentBiomeName(gameData),
    };

    this.explorationUI.updateStats(stats);
  }

  /**
   * Obtiene el nombre del bioma actual
   */
  private getCurrentBiomeName(gameData: GameLogicUpdateData): string {
    // Determinar bioma basado en resonancia y ciclos
    const resonance = gameData.resonance || 0;
    const cycles = gameData.cycles || 0;

    if (resonance > 50) return "Reino Místico";
    if (cycles > 50) return "Bosques Ancestrales";
    if (resonance > 25) return "Pantanos Serenos";
    if (cycles > 25) return "Montañas Rocosas";
    if (resonance > 10) return "Pueblos Acogedores";
    return "Praderas Verdes";
  }

  // ====== ANIMATION SYSTEM FOR STAT BARS ======

  public statsElements: {
    [key: string]: {
      label: Phaser.GameObjects.Text;
      value: Phaser.GameObjects.Text;
    };
  } = {};
}
