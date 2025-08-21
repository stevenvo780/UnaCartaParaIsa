import Phaser from "phaser";

export class WorldModalContent {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private infoZoneText?: Phaser.GameObjects.Text;
  private activitiesText?: Phaser.GameObjects.Text;
  private minimapGfx?: Phaser.GameObjects.Graphics;
  private dots?: { isa: Phaser.GameObjects.Arc; stev: Phaser.GameObjects.Arc };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.scene.add.container(0, 0);
    this.build();
  }

  getContainer() {
    return this.container;
  }

  update(data: any, timeString: string, gameState: any) {
    if (this.activitiesText) {
      const isa = data.entities?.find((e: any) => e.id === "isa");
      const stev = data.entities?.find((e: any) => e.id === "stev");
      this.activitiesText.setText(
        `👩 Isa: ${isa?.activity ?? "IDLE"}\n👨 Stev: ${stev?.activity ?? "IDLE"}\n\n⏱️ Tiempo: ${timeString || "00:00"}`,
      );
    }
    if (this.infoZoneText) {
      const z = (gameState?.zones || [])[0];
      if (z) {
        this.infoZoneText.setText(
          `Zona: ${z.name}\nTipo: ${z.type}\nBeneficio: ${Math.round((z.effects ? Object.values(z.effects)[0] || 0 : 0) as number)}\nDistancia: ---`,
        );
      }
    }
    if (this.minimapGfx) {
      const worldSize = gameState?.worldSize || { width: 1200, height: 800 };
      const contentX = 8;
      const contentY = 28;
      const contentW = 140 - 16;
      const contentH = 140 - 40;
      const scaleX = contentW / worldSize.width;
      const scaleY = contentH / worldSize.height;
      this.minimapGfx.clear();
      this.minimapGfx.fillStyle(0x27ae60, 0.4);
      this.minimapGfx.fillRoundedRect(0, 0, contentW + 16, contentH + 40, 4);
      const zones = gameState?.zones || [];
      zones.slice(0, 4).forEach((z: any, idx: number) => {
        const colrs = [0xe74c3c, 0xf39c12, 0x9b59b6, 0x1abc9c];
        const c = colrs[idx % colrs.length];
        const zx = contentX + z.bounds.x * scaleX;
        const zy = contentY + z.bounds.y * scaleY;
        const zw = Math.max(2, z.bounds.width * scaleX);
        const zh = Math.max(2, z.bounds.height * scaleY);
        this.minimapGfx!.fillStyle(c, 0.6);
        this.minimapGfx!.fillRoundedRect(
          zx - contentX,
          zy - contentY,
          zw,
          zh,
          2,
        );
      });
      if (!this.dots) {
        const isaDot = this.scene.add.circle(0, 0, 3, 0xff1744, 1);
        const stevDot = this.scene.add.circle(0, 0, 3, 0x00bcd4, 1);
        this.container.add(isaDot);
        this.container.add(stevDot);
        this.dots = { isa: isaDot, stev: stevDot };
      }
      const isa = data.entities?.find((e: any) => e.id === "isa");
      const stev = data.entities?.find((e: any) => e.id === "stev");
      if (isa && this.dots) {
        this.dots.isa.setPosition(
          contentX + isa.position.x * scaleX,
          contentY + isa.position.y * scaleY,
        );
      }
      if (stev && this.dots) {
        this.dots.stev.setPosition(
          contentX + stev.position.x * scaleX,
          contentY + stev.position.y * scaleY,
        );
      }
    }
  }

  private build() {
    const zoneTitle = this.scene.add.text(0, 0, "🗺️ ZONA ACTUAL", {
      fontSize: "11px",
      color: "#9b59b6",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    this.container.add(zoneTitle);
    this.infoZoneText = this.scene.add.text(
      0,
      16,
      "Zona: ---\nTipo: ---\nBeneficio: ---\nDistancia: ---",
      {
        fontSize: "10px",
        color: "#bdc3c7",
        fontFamily: "Arial, sans-serif",
        lineSpacing: 2,
      },
    );
    this.container.add(this.infoZoneText);

    const actTitle = this.scene.add.text(180, 0, "📋 ACTIVIDADES", {
      fontSize: "11px",
      color: "#f39c12",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    this.container.add(actTitle);
    this.activitiesText = this.scene.add.text(
      180,
      16,
      "👩 Isa: IDLE\n👨 Stev: IDLE\n\n⏱️ Tiempo: 00:00",
      {
        fontSize: "10px",
        color: "#ecf0f1",
        fontFamily: "Arial, sans-serif",
        lineSpacing: 3,
      },
    );
    this.container.add(this.activitiesText);

    const minimapBg = this.scene.add.graphics();
    minimapBg.fillStyle(0x2c3e50, 0.9);
    minimapBg.fillRoundedRect(0, 90, 160, 120, 6);
    minimapBg.lineStyle(2, 0x3498db, 0.7);
    minimapBg.strokeRoundedRect(0, 90, 160, 120, 6);
    this.container.add(minimapBg);

    this.minimapGfx = this.scene.add.graphics();
    this.minimapGfx.setPosition(0, 90);
    this.container.add(this.minimapGfx);
  }
}
