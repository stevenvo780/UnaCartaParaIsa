import Phaser from "phaser";
import { DialogueCardUI } from "../components/DialogueCardUI";
import {
  ExplorationUI,
  type ExplorationStats,
} from "../components/ExplorationUI";
import { FoodUI } from "../components/FoodUI";
import { ResonanceBar } from "../components/ResonanceBar";
import { SystemStatusUI } from "../components/SystemStatusUI";
import { BottomBar } from "../components/ui/BottomBar";
import { MessagesModalContent } from "../components/ui/MessagesModal";
import { ModalManager } from "../components/ui/ModalManager";
import { SettingsModalContent } from "../components/ui/SettingsModal";
import { StatsModalContent } from "../components/ui/StatsModal";
import { TopBar } from "../components/ui/TopBar";
import { createUIButton } from "../components/ui/UIButton";
import { WorldModalContent } from "../components/ui/WorldModal";
import { gameConfig } from "../config/gameConfig";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";
import { ResonanceLabel, UIElementPool } from "../managers/UIElementPool";
import type { TimeOfDay } from "../systems/DayNightSystem";
import type { GameLogicUpdateData } from "../types";
import { NeedsUI } from "../ui/NeedsUI";
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
  private resonanceBar?: ResonanceBar;

  // Modern UI system
  private topBar!: TopBar;
  private bottomBar!: BottomBar;
  // Paneles/minimapa legacy eliminados: UI sintetizada con modales
  private foodUI!: FoodUI;
  private explorationUI!: ExplorationUI;
  private dialogueCardUI!: DialogueCardUI;
  private systemStatusUI!: SystemStatusUI;
  private systemModal?: Phaser.GameObjects.Container;
  private modalManager!: ModalManager;
  private modalRegistry: Map<string, Phaser.GameObjects.Container> = new Map();
  private modalOrder: string[] = [];
  private worldModal?: Phaser.GameObjects.Container;
  private worldModalContent?: WorldModalContent;
  private statsModal?: Phaser.GameObjects.Container;
  private statsModalContent?: StatsModalContent;
  private messagesModal?: Phaser.GameObjects.Container;
  private settingsModal?: Phaser.GameObjects.Container;
  private needsUI?: NeedsUI;

  // Constants de layout
  private readonly TOP_BAR_HEIGHT = 70;
  private readonly BOTTOM_BAR_HEIGHT = 80;
  // Panel widths eliminados
  private readonly MODAL_MARGIN = 16;

  // Navigation and control
  private isDraggingCamera = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // UI state simplificado

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    logAutopoiesis.info("🚀 UIScene.create() iniciado");
    logAutopoiesis.info("🚀 UIScene.create() STARTED");
    try {
      // Indicador visual de debug sólo en modo debug
      if (gameConfig.debugMode) {
        this.createDebugIndicator();
      }
      logAutopoiesis.info("✅ Debug indicator created");

      // CRÍTICO: Activar UI de necesidades desde el inicio
      this.createNeedsUI();
      logAutopoiesis.info("✅ Needs UI activated - barras visibles");

      logAutopoiesis.info("🎨 Creating Modern Game UI");

      // Configurar como overlay sobre MainScene
      this.scene.bringToTop();
      logAutopoiesis.info("✅ Scene brought to top");

      this.initializePools();
      logAutopoiesis.info("✅ Pools initialized");

      // Crear ResonanceBar primero (parte superior)
      this.createResonanceBar();
      logAutopoiesis.info("✅ ResonanceBar created");

      // Create modern modular UI
      this.createTopBar();
      logAutopoiesis.info("✅ TopBar created");

      this.createBottomBar();
      logAutopoiesis.info("✅ BottomBar created");

      // Instanciar gestor de modales
      this.modalManager = new ModalManager(this);
      logAutopoiesis.info("✅ ModalManager created");

      // Colocar los diálogos en la UIScene para que no dependan del zoom
      this.dialogueCardUI = new DialogueCardUI(this, 50, 50);
      logAutopoiesis.info("✅ DialogueCardUI created");

      this.createFoodUI();
      logAutopoiesis.info("✅ FoodUI created");

      this.createExplorationUI();
      logAutopoiesis.info("✅ ExplorationUI created");

      // Setup modern navigation
      this.setupModernNavigation();
      logAutopoiesis.info("✅ Modern navigation setup complete");

      // Suscribirse a necesidades desde MainScene (UI + luces)
      const mainScene = this.scene.get("MainScene");
      mainScene.events.on("needsUpdated", (data: any) => {
        this.needsUI?.updateNeeds(data.entityData);
        const needs = data?.entityData?.needs as
          | Record<string, number>
          | undefined;
        if (needs) {
          const criticalCount = Object.entries(needs).filter(
            ([k, v]) => k !== "lastUpdate" && v < 20,
          ).length;
          const warningCount = Object.entries(needs).filter(
            ([k, v]) => k !== "lastUpdate" && v < 40 && v >= 20,
          ).length;
          this.systemStatusUI?.updateNeedsSummary(criticalCount, warningCount);
        }
      });
    } catch (error) {
      logAutopoiesis.error("❌ Error in UIScene.create():", error);
    }

    // (Sin toggles de borde; usar atajos en top bar)

    // Botones de la barra superior integrados en TopBar

    // Connect to game logic
    const mainScene = this.scene.get("MainScene");
    mainScene.events.on("gameLogicUpdate", this.updateUI, this);

    // Listen for time changes to update top bar y luces
    this.events.on("timeChanged", (timeData: TimeOfDay) => {
      this.updateTopBarTime(timeData);
      const timeString = `${timeData.hour.toString().padStart(2, "0")}:${timeData.minute
        .toString()
        .padStart(2, "0")}`;
      this.systemStatusUI?.updateTimeLight(timeString);
    });

    // Handle resize events
    this.scale.on("resize", this.handleResize, this);
    this.events.on("shutdown", this.destroy, this);

    logAutopoiesis.info("✅ UIScene created", {
      poolSize: this.resonanceLabelPool.getStats(),
    });
  }

  private createResonanceBar(): void {
    const centerX = this.cameras.main.width / 2;
    this.resonanceBar = new ResonanceBar(this, centerX, 30);

    logAutopoiesis.info("🎵 ResonanceBar añadida a UIScene");
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

    // Actualizar ResonanceBar con gameState
    if (this.resonanceBar && data.gameState) {
      this.resonanceBar.updateFromGameState(data.gameState);
      this.resonanceBar.update();
    }

    // Actualizar datos críticos siempre
    this.updateTopBarInfo(data);
    // (Panel de stats lateral eliminado; se actualiza el modal de stats)

    // Actualizar stats en el modal si está abierto
    this.updateStatsModal(data);
    // Actualizar mundo (modal) si está abierto
    this.updateWorldModal(data);

    // Actualizar UI pesada solo cada segundo
    if (now - this.lastUIUpdate > this.UI_UPDATE_INTERVAL) {
      this.updateBottomBarInfo(data);
      // Solo actualizar exploración UI cada 5 segundos
      if (now - this.lastUIUpdate > 5000) {
        this.updateExplorationUI(data);
      }
      this.lastUIUpdate = now;
    }
  }

  private updateStatsModal(data: GameLogicUpdateData) {
    if (!this.statsModal || !this.statsModal.visible) return;
    const texts = this.statsModal.list.filter((o) =>
      (o as any).getData?.("statKey"),
    ) as Phaser.GameObjects.Text[];
    const findVal = (path: string): number => {
      // path: "isa.health" etc
      const [id, stat] = path.split(".");
      const ent = data.entities?.find((e) => e.id === id);
      return Math.round((ent?.stats as any)?.[stat] ?? 0);
    };
    texts.forEach((t) => {
      const key = t.getData("statKey") as string;
      const label = t.text.split(":")[0];
      t.setText(`${label}: ${findVal(key)}`);
    });
  }

  // =================== MODERN UI CREATION METHODS ===================

  private createTopBar() {
    this.topBar = new TopBar(this, {
      onToggleStats: () => this.toggleStatsModal(),
      onToggleMessages: () => this.toggleMessagesModal(),
      onToggleSystem: () => this.toggleSystemModal(),
      onToggleWorld: () => this.toggleWorldModal(),
      onTogglePerformance: () => {
        // Emitir togglePerformanceMode a MainScene
        const mainScene = this.scene.get("MainScene");
        if (mainScene) {
          mainScene.events.emit("togglePerformanceMode");
          logAutopoiesis.info("⚡ Performance mode toggled");
        }
      },
      onOpenMenu: () => this.toggleGameMenu(),
      onToggleContrast: () => this.toggleHighContrast(),
    });
  }

  // Removed - UI elements handled by TopBar component

  // Removed - handled by TopBar component

  private createModernButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    return createUIButton(this, x, y, text, onClick, {
      width,
      height,
      color: Phaser.Display.Color.HexStringToColor(color).color,
    });
  }

  // Removed - handled by TopBar component

  private createBottomBar() {
    this.bottomBar = new BottomBar(this, {
      onSetControl: (mode) => this.setControlMode(mode),
      onTogglePause: () => this.togglePause(),
      onOpenSettings: () => this.openSettings(),
      onScreenshot: () => this.takeScreenshot(),
      onSetSpeed: (m) => this.setGameSpeed(m),
    });
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
        // Emitir a MainScene
        const mainScene = this.scene.get("MainScene");
        if (mainScene) {
          mainScene.events.emit("changeEntityControl", "none");
          logAutopoiesis.info("🎮 Control cambiado a AUTO");
        }
      },
    );
    // BottomBar ya maneja sus propios botones

    // Isa control button
    const isaBtn = this.createModernButton(
      startX + spacing,
      20,
      buttonWidth,
      buttonHeight,
      "👩 ISA",
      "#e74c3c",
      () => {
        // Emitir a MainScene
        const mainScene = this.scene.get("MainScene");
        if (mainScene) {
          mainScene.events.emit("changeEntityControl", "isa");
          logAutopoiesis.info("🎮 Control cambiado a ISA");
        }
      },
    );
    // BottomBar ya maneja sus propios botones

    // Stev control button
    const stevBtn = this.createModernButton(
      startX + spacing * 2,
      20,
      buttonWidth,
      buttonHeight,
      "👨 STEV",
      "#3498db",
      () => {
        // Emitir a MainScene
        const mainScene = this.scene.get("MainScene");
        if (mainScene) {
          mainScene.events.emit("changeEntityControl", "stev");
          logAutopoiesis.info("🎮 Control cambiado a STEV");
        }
      },
    );
    // BottomBar ya maneja sus propios botones
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
    // BottomBar ya maneja sus propios botones

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
    // BottomBar ya maneja sus propios botones

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
    // BottomBar ya maneja sus propios botones
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

    // BottomBar ya maneja sus propios botones
  }

  // (Legacy) createLeftPanel eliminado: reemplazado por modal de Estadísticas

  /*
   * (Eliminado) Panel derecho sustituido por modal de Mundo
   */
  // (Legacy) createRightPanel eliminado: reemplazado por modal de Mundo

  /*
   * (Eliminado) Minimapa independiente sustituido por minimapa en modal Mundo
   */
  // (Legacy) createMinimap eliminado: minimapa integrado en modal de Mundo

  // (Creación de toggles de borde eliminada para UI sintetizada)

  // (Legacy) createEdgeToggles eliminado

  private setupModernNavigation() {
    // Mouse drag navigation - improved bounds detection
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Calculate accurate UI bounds to avoid navigation conflicts
      const topBarHeight = 60;
      const bottomBarHeight = 80;
      const leftPanelWidth = 0;
      const rightPanelWidth = 0;

      // Check if clicking within navigable area (not on UI elements)
      // Excluir áreas de UI (barras, paneles, minimapa y cartas de diálogo)
      const isInNavigableArea =
        pointer.x > leftPanelWidth &&
        pointer.x < this.cameras.main.width - rightPanelWidth &&
        pointer.y > topBarHeight &&
        pointer.y < this.cameras.main.height - bottomBarHeight &&
        !this.isPointerOverAnyUI(pointer);

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

  private isPointerOverAnyUI(pointer: Phaser.Input.Pointer): boolean {
    const containers: Phaser.GameObjects.Container[] = [];
    if (this.topBar && this.topBar.getContainer)
      containers.push(this.topBar.getContainer());
    if (this.bottomBar) containers.push(this.bottomBar.getContainer());
    // Paneles/minimapa independientes ya no se usan
    // Modales visibles
    if (this.modalManager) {
      containers.push(...this.modalManager.getVisibleContainers());
    }
    // Cartas si estuvieran fuera de modal (fallback)
    if (this.dialogueCardUI)
      containers.push(this.dialogueCardUI.getContainer());

    return containers.some((c) => {
      const b = c.getBounds();
      return (
        pointer.x >= b.x &&
        pointer.x <= b.x + b.width &&
        pointer.y >= b.y &&
        pointer.y <= b.y + b.height
      );
    });
  }

  // =================== MODAL GRID SYSTEM ===================

  private createModalWindow(
    id: string,
    title: string,
    content: Phaser.GameObjects.Container,
    width = 360,
    height = 220,
  ): Phaser.GameObjects.Container {
    const modal = this.add.container(0, 0);
    modal.setScrollFactor(0);
    modal.setDepth(DS.Z_INDEX.modal);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(2, 0x3498db, 0.8);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    modal.add(bg);

    const titleBar = this.add.graphics();
    titleBar.fillStyle(0x0f3460, 0.9);
    titleBar.fillRoundedRect(0, 0, width, 28, 8);
    modal.add(titleBar);

    const titleText = this.add
      .text(12, 14, title, {
        fontSize: "12px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    modal.add(titleText);

    const closeBtn = this.createModernButton(
      width - 28,
      6,
      20,
      16,
      "×",
      "#e74c3c",
      () => {
        this.closeModal(id);
      },
    );
    modal.add(closeBtn);

    content.setPosition(12, 36);
    modal.add(content);

    // Registrar y distribuir
    this.modalRegistry.set(id, modal);
    if (!this.modalOrder.includes(id)) this.modalOrder.push(id);
    this.layoutModals();
    return modal;
  }

  private layoutModals() {
    const visibleIds = this.modalOrder.filter(
      (id) => this.modalRegistry.get(id)?.visible,
    );
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const availX = this.MODAL_MARGIN;
    const availW = width - this.MODAL_MARGIN * 2;
    const startY = this.TOP_BAR_HEIGHT + this.MODAL_MARGIN;
    const maxY = height - this.BOTTOM_BAR_HEIGHT - this.MODAL_MARGIN;

    let cursorX = availX;
    let cursorY = startY;
    let rowH = 0;

    visibleIds.forEach((id) => {
      const modal = this.modalRegistry.get(id)!;
      // Fallback para getBounds que puede no existir en Graphics
      const b = { x: 0, y: 0, width: 200, height: 150 };
      const w = b.width;
      const h = b.height;
      // Wrap si no cabe
      if (cursorX + w > availX + availW) {
        cursorX = availX;
        cursorY += rowH + this.MODAL_MARGIN;
        rowH = 0;
      }
      // Evitar invadir barra inferior
      if (cursorY + h > maxY) {
        // Si no cabe, forzar posición justo encima de bottom bar
        cursorY = Math.max(startY, maxY - h);
      }
      modal.setPosition(cursorX, cursorY);
      cursorX += w + this.MODAL_MARGIN;
      rowH = Math.max(rowH, h);
    });
  }

  private closeModal(id: string) {
    const modal = this.modalRegistry.get(id);
    if (modal) {
      modal.setVisible(false);
      this.layoutModals();
    }
  }

  private toggleStatsModal() {
    if (!this.statsModal) {
      this.statsModalContent = new StatsModalContent(this);
      this.statsModal = this.modalManager.createWindow(
        "stats",
        "📊 Estadísticas",
        this.statsModalContent.getContainer(),
        360,
        240,
      );
    } else {
      this.modalManager.toggle("stats");
    }
  }

  private toggleMessagesModal() {
    if (!this.messagesModal) {
      const content = new MessagesModalContent(this, this.dialogueCardUI);
      this.messagesModal = this.modalManager.createWindow(
        "messages",
        "💬 Mensajes",
        content.getContainer(),
        360,
        260,
      );
    } else {
      this.modalManager.toggle("messages");
    }
  }

  private toggleSystemModal() {
    if (!this.systemModal) {
      this.systemStatusUI = new SystemStatusUI(this, 0, 0, { embedded: true });
      const inner = this.systemStatusUI.getContainer();
      inner.setPosition(0, 0);
      this.systemModal = this.modalManager.createWindow(
        "system",
        "🌌 Sistema",
        inner,
        360,
        260,
      );
      // Actualizaciones se reciben desde UIScene.create; aquí ya no nos suscribimos
    } else {
      this.modalManager.toggle("system");
    }
  }

  private toggleWorldModal() {
    if (!this.worldModal) {
      this.worldModalContent = new WorldModalContent(this);
      this.worldModal = this.modalManager.createWindow(
        "world",
        "🌍 Mundo",
        this.worldModalContent.getContainer(),
        360,
        260,
      );
    } else {
      this.modalManager.toggle("world");
    }
  }

  private toggleSettingsModal() {
    if (!this.settingsModal) {
      const content = new SettingsModalContent(this);
      this.settingsModal = this.modalManager.createWindow(
        "settings",
        "⚙️ Configuración",
        content.getContainer(),
        360,
        160,
      );
    } else {
      this.modalManager.toggle("settings");
    }
  }

  // (World modal content extraído a WorldModalContent)

  // (Stats modal content extraído a StatsModalContent)

  // =================== HELPER METHODS ===================

  // Eliminado: usar createUIButton para evitar duplicación

  // (Legacy) createCharacterPanel / updateCharacterPanels eliminados (uso modal de Estadísticas)

  private updateTopBarInfo(data: GameLogicUpdateData) {
    if (this.topBar && data.resonance !== undefined) {
      (this.topBar as any).updateResonance(data.resonance);
    }
    if (this.topBar && data.cycles !== undefined) {
      (this.topBar as any).updateCycles(data.cycles);
    }
  }

  private updateTopBarTime(timeData: TimeOfDay) {
    const timeString = `${timeData.hour.toString().padStart(2, "0")}:${timeData.minute
      .toString()
      .padStart(2, "0")}`;
    if (this.topBar) (this.topBar as any).updateTime(timeString);
    (this as any)._currentTimeString = timeString;
  }

  private updateBottomBarInfo(_data: GameLogicUpdateData) {
    // Update control mode visual feedback if needed
    // Could highlight active control buttons based on current mode
  }

  private updateWorldModal(data: GameLogicUpdateData) {
    if (!this.worldModal || !this.worldModal.visible || !this.worldModalContent)
      return;
    const gameState = this.registry.get("gameState") as any;
    const timeStr = (this as any)._currentTimeString || "00:00";
    this.worldModalContent.update(data, timeStr, gameState);
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
    this.toggleSettingsModal();
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
    const newGameBtn = createUIButton(
      this,
      0,
      -40,
      "🎮 Nueva Partida",
      () => {
        this.startNewGame();
        menuContainer.destroy();
      },
      {
        width: 200,
        height: 30,
        color: Phaser.Display.Color.HexStringToColor("#e74c3c").color,
      },
    );

    // Botón Configuración
    const settingsBtn = createUIButton(
      this,
      0,
      0,
      "⚙️ Configuración",
      () => {
        this.openSettings();
        menuContainer.destroy();
      },
      {
        width: 200,
        height: 30,
        color: Phaser.Display.Color.HexStringToColor("#3498db").color,
      },
    );

    // Botón Cerrar
    const closeBtn = createUIButton(
      this,
      0,
      40,
      "❌ Cerrar",
      () => menuContainer.destroy(),
      {
        width: 200,
        height: 30,
        color: Phaser.Display.Color.HexStringToColor("#95a5a6").color,
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

  // (Toggles de paneles eliminados)

  /**
   * Handle screen resize events
   */
  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // Resize and reposition top bar controls
    if (this.topBar && (this.topBar as any).handleResize) {
      (this.topBar as any).handleResize(width);
    }

    // (Paneles laterales/minimapa eliminados en favor de modales)

    if (this.bottomBar) {
      this.bottomBar.handleResize(width, height);
    }

    if (this.foodUI) {
      this.foodUI.updatePosition();
    }
    if (this.needsUI) {
      this.needsUI.setPosition(this.cameras.main.width - 220, 80);
    }
  }

  private toggleHighContrast() {
    const now = !(this.registry.get("ui_high_contrast") as boolean);
    this.registry.set("ui_high_contrast", now);
    DS.setAccessibilityPreferences({ highContrastEnabled: now });
    // Redibujar TopBar
    (this.topBar as any)?.handleResize?.(this.cameras.main.width);
    // Redibujar BottomBar
    this.bottomBar?.handleResize(
      this.cameras.main.width,
      this.cameras.main.height,
    );
    // Redibujar estilos de modales
    this.modalManager?.refreshStyles();
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

  private createDebugIndicator(): void {
    // Crear indicador visual temporal para confirmar que UIScene está funcionando
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 0.9); // Verde brillante para confirmación
    graphics.fillRect(10, 10, 100, 50);
    graphics.fillStyle(0xffffff, 1.0);
    graphics.fillRect(15, 15, 90, 40);
    graphics.fillStyle(0x000000, 1.0);
    graphics.fillRect(20, 20, 80, 30);

    logAutopoiesis.info(
      "🔍 Debug indicator created - UIScene is active (green box visible)",
    );
  }

  // Crea y posiciona la UI de necesidades reutilizando el componente actual (no se elimina)
  private createNeedsUI(): void {
    try {
      this.needsUI = new NeedsUI(this);
      // Colocarla debajo del TopBar y sin solapar BottomBar
      this.needsUI.setPosition(this.cameras.main.width - 220, 80);
    } catch (e) {
      logAutopoiesis.error("Error creando NeedsUI en UIScene", e);
    }
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
