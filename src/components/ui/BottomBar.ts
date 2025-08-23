import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";
import { createUIButton } from "./UIButton";

export interface BottomBarCallbacks {
  onSetControl: (mode: "auto" | "isa" | "stev") => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
  onScreenshot: () => void;
  onSetSpeed: (mult: number) => void;
}

export class BottomBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private callbacks: BottomBarCallbacks;
  private height = 80;

  constructor(scene: Phaser.Scene, callbacks: BottomBarCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.container = this.scene.add.container(
      0,
      this.scene.cameras.main.height - this.height,
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(DS.Z_INDEX.content);
    this.build();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  handleResize(width: number, height: number) {
    // Reposition container to bottom of screen
    this.container.setPosition(0, height - this.height);
    
    // Redraw background with new width
    if (this.bg) {
      this.bg.clear();
      this.drawBackground(width);
    }
    
    // Update button positions for responsive layout
    this.updateButtonPositions(width);
  }
  
  private updateButtonPositions(width: number) {
    // Update action buttons positioning
    const centerX = width / 2;
    const actionButtons = this.container.list.filter(child => 
      child.getData && child.getData('buttonType') === 'action'
    );
    
    if (actionButtons.length >= 3) {
      const spacing = 70;
      actionButtons[0].setPosition(centerX - spacing, 20); // Pause
      actionButtons[1].setPosition(centerX, 20);           // Settings  
      actionButtons[2].setPosition(centerX + spacing, 20); // Screenshot
    }
    
    // Update speed control container position
    const speedControls = this.container.list.find(child => 
      child.getData && child.getData('containerType') === 'speedControls'
    );
    if (speedControls) {
      speedControls.setPosition(width - 150, 20);
    }
  }

  private drawBackground(width: number) {
    this.bg.fillStyle(DS.COLORS.surfaceDark, 0.9);
    this.bg.fillRect(0, 0, width, this.height);
    this.bg.lineStyle(2, DS.COLORS.accent, 0.8);
    this.bg.lineBetween(0, 2, width, 2);
  }

  private build() {
    this.bg = this.scene.add.graphics();
    this.container.add(this.bg);
    this.drawBackground(this.scene.cameras.main.width);

    this.buildControlButtons();
    this.buildActionButtons();
    this.buildSpeedControls();
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
  ) {
    const btn = createUIButton(this.scene, x, y, label, onClick, {
      width: w,
      height: h,
      color,
    });
    this.container.add(btn);
    return btn;
  }

  private buildControlButtons() {
    const startX = 20;
    const spacing = 90;
    const w = 80;
    const h = 36;
    this.makeButton(startX, 20, w, h, "🤖 AUTO", DS.COLORS.textMuted, () =>
      this.callbacks.onSetControl("auto"),
    );
    this.makeButton(startX + spacing, 20, w, h, "👩 ISA", 0xe74c3c, () =>
      this.callbacks.onSetControl("isa"),
    );
    this.makeButton(startX + spacing * 2, 20, w, h, "👨 STEV", 0x3498db, () =>
      this.callbacks.onSetControl("stev"),
    );
  }

  private buildActionButtons() {
    const centerX = this.scene.cameras.main.width / 2;
    const w = 60;
    const h = 36;
    const spacing = 70;
    
    const pauseBtn = this.makeButton(
      centerX - spacing,
      20,
      w,
      h,
      "⏸️",
      0xf39c12,
      this.callbacks.onTogglePause,
    );
    pauseBtn.setData('buttonType', 'action');
    
    const settingsBtn = this.makeButton(
      centerX,
      20,
      w,
      h,
      "⚙️",
      0x9b59b6,
      this.callbacks.onOpenSettings,
    );
    settingsBtn.setData('buttonType', 'action');
    
    const screenshotBtn = this.makeButton(
      centerX + spacing,
      20,
      w,
      h,
      "📷",
      0x1abc9c,
      this.callbacks.onScreenshot,
    );
    screenshotBtn.setData('buttonType', 'action');
  }

  private buildSpeedControls() {
    const rightX = this.scene.cameras.main.width - 150;
    const speedContainer = this.scene.add.container(rightX, 20);
    const bg = this.scene.add.graphics();
    bg.fillStyle(DS.COLORS.surface, 0.8);
    bg.fillRoundedRect(0, 0, 130, 40, 6);
    speedContainer.add(bg);
    const label = this.scene.add.text(10, 8, "⚡ Velocidad:", {
      ...DS.getTextStyle("xs", DS.COLORS.text),
    });
    speedContainer.add(label);
    const mk = (x: number, txt: string, mult: number, color: number) => {
      const btn = this.makeButton(x, 20, 28, 16, txt, color, () =>
        this.callbacks.onSetSpeed(mult),
      );
      speedContainer.add(btn);
    };
    mk(10, "0.5x", 0.5, 0xe74c3c);
    mk(42, "1x", 1, 0x95a5a6);
    mk(74, "2x", 2, 0xf39c12);
    mk(106, "5x", 5, 0xe67e22);
    
    speedContainer.setData('containerType', 'speedControls');
    this.container.add(speedContainer);
  }
}
