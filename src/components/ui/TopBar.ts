import Phaser from "phaser";

export interface TopBarCallbacks {
  onToggleStats: () => void;
  onToggleMessages: () => void;
  onToggleSystem: () => void;
  onToggleWorld: () => void;
  onTogglePerformance: () => void;
  onOpenMenu: () => void;
}

export class TopBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private centerGroup?: Phaser.GameObjects.Container;
  private resonanceText?: Phaser.GameObjects.Text;
  private cyclesText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private modalButtons: Phaser.GameObjects.Container[] = [];
  private menuBtn?: Phaser.GameObjects.Container;
  private callbacks: TopBarCallbacks;

  constructor(scene: Phaser.Scene, callbacks: TopBarCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.build();
  }

  getContainer() {
    return this.container;
  }

  updateResonance(v: number) {
    if (this.resonanceText) this.resonanceText.setText(`${Math.round(v)}%`);
  }

  updateCycles(v: number) {
    if (this.cyclesText) this.cyclesText.setText(`${v}`);
  }

  updateTime(hhmm: string) {
    if (this.timeText) this.timeText.setText(hhmm);
  }

  handleResize(width: number) {
    if (this.bg) {
      this.bg.clear();
      this.bg.fillStyle(0x1a1a2e, 0.85);
      this.bg.fillRect(0, 0, width, 70);
      this.bg.lineStyle(2, 0x74b9ff, 0.6);
      this.bg.lineBetween(0, 68, width, 68);
      this.bg.fillStyle(0x000000, 0.2);
      this.bg.fillRect(0, 70, width, 4);
    }
    if (this.centerGroup) this.centerGroup.setPosition(width / 2, 35);
    // Reposicionar botones de modales y menú a la derecha
    let currentX = width - 45 - 50;
    this.modalButtons.forEach((btn) => {
      btn.setPosition(currentX, 35);
      currentX -= 34;
    });
    if (this.menuBtn) this.menuBtn.setPosition(width - 45, 35);
  }

  private build() {
    this.bg = this.scene.add.graphics();
    this.container.add(this.bg);

    // Título
    const titleContainer = this.scene.add.container(25, 35);
    const titleText = this.scene.add
      .text(0, 0, "Una Carta Para Isa", {
        fontSize: "22px",
        color: "#FFFFFF",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
        stroke: "#6C5CE7",
        strokeThickness: 1,
      })
      .setOrigin(0, 0.5);
    const titleIcon = this.scene.add
      .text(-30, 0, "💌", { fontSize: "24px" })
      .setOrigin(0.5);
    titleContainer.add([titleIcon, titleText]);
    this.container.add(titleContainer);

    this.scene.tweens.add({
      targets: titleIcon,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Centro: badges Resonancia / Ciclos / Tiempo
    this.centerGroup = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      35,
    );
    let cursor = -160;
    const addBadge = (
      icon: string,
      label: string,
      value: string,
      color: number,
      width = 100,
    ) => {
      const c = this.scene.add.container(cursor, 0);
      const bg = this.scene.add.graphics();
      bg.fillStyle(color, 0.15);
      bg.fillRoundedRect(0, -14, width, 28, 14);
      bg.lineStyle(1, color, 0.4);
      bg.strokeRoundedRect(0, -14, width, 28, 14);
      const iconText = this.scene.add
        .text(14, 0, icon, { fontSize: "13px" })
        .setOrigin(0.5);
      const labelText = this.scene.add.text(28, -8, label, {
        fontSize: "8px",
        color: "#B2BEC3",
      });
      const valueText = this.scene.add.text(28, 4, value, {
        fontSize: "11px",
        color: "#FFFFFF",
        fontStyle: "bold",
      });
      c.add([bg, iconText, labelText, valueText]);
      this.centerGroup!.add(c);
      cursor += width + 20;
      return valueText;
    };
    this.resonanceText = addBadge("💫", "Resonancia", "0%", 0x74b9ff, 120);
    this.cyclesText = addBadge("⚡", "Ciclos", "0", 0x00cec9, 90);
    this.timeText = addBadge("⏰", "Tiempo", "00:00", 0xfdcb6e, 100);
    this.container.add(this.centerGroup);

    // Botones de modales: 📊, 💬, 🌌, 🌍
    const addModalBtn = (emoji: string, onClick: () => void) => {
      const c = this.scene.add.container(0, 35);
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x34495e, 0.2);
      bg.fillCircle(0, 0, 18);
      bg.lineStyle(1, 0x74b9ff, 0.6);
      bg.strokeCircle(0, 0, 18);
      const label = this.scene.add
        .text(0, 0, emoji, {
          fontSize: "16px",
        })
        .setOrigin(0.5);
      c.add([bg, label]);
      c.setInteractive(
        new Phaser.Geom.Circle(0, 0, 18),
        Phaser.Geom.Circle.Contains,
      );
      c.on("pointerdown", onClick);
      this.container.add(c);
      this.modalButtons.push(c);
    };
    addModalBtn("📊", this.callbacks.onToggleStats);
    addModalBtn("💬", this.callbacks.onToggleMessages);
    addModalBtn("🌌", this.callbacks.onToggleSystem);
    addModalBtn("🌍", this.callbacks.onToggleWorld);
    addModalBtn("⚡", this.callbacks.onTogglePerformance); // Botón de menú
    const menuBtn = this.scene.add.container(
      this.scene.cameras.main.width - 45,
      35,
    );
    const menuBg = this.scene.add.graphics();
    menuBg.fillStyle(0x6c5ce7, 0.3);
    menuBg.fillCircle(0, 0, 22);
    menuBg.fillStyle(0x6c5ce7, 0.9);
    menuBg.fillCircle(0, 0, 18);
    menuBg.fillStyle(0x74b9ff, 0.4);
    menuBg.fillCircle(-3, -3, 8);
    const menuIcon = this.scene.add
      .text(0, 0, "⚙️", { fontSize: "16px" })
      .setOrigin(0.5);
    menuBtn.add([menuBg, menuIcon]);
    menuBtn.setSize(40, 40);
    menuBtn.setInteractive();
    menuBtn.on("pointerdown", this.callbacks.onOpenMenu);
    this.container.add(menuBtn);
    this.menuBtn = menuBtn;
  }

  // Método para agregar elementos al TopBar container
  add(
    child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  ): this {
    this.container.add(child);
    return this;
  }
}
