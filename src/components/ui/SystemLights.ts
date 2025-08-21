import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export type LightStatus = "active" | "inactive" | "warning" | "error";

export interface SystemLight {
  name: string;
  status: LightStatus;
  details?: string;
  color: number;
}

export class SystemLights {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private rows = new Map<
    string,
    {
      dot: Phaser.GameObjects.Arc;
      name: Phaser.GameObjects.Text;
      details: Phaser.GameObjects.Text;
    }
  >();
  private width = 200;
  private height = 150;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);

    const bg = scene.add.graphics();
    bg.fillStyle(DS.COLORS.surfaceDark, 0.9);
    bg.fillRoundedRect(0, 0, this.width, this.height, DS.RADIUS.md);
    bg.lineStyle(1, DS.COLORS.border, 0.5);
    bg.strokeRoundedRect(0, 0, this.width, this.height, DS.RADIUS.md);
    this.container.add(bg);

    const title = scene.add.text(
      10,
      8,
      "SISTEMAS",
      DS.getTextStyle("sm", DS.COLORS.text, "bold"),
    );
    this.container.add(title);
  }

  getContainer() {
    return this.container;
  }

  upsert(light: SystemLight, order?: number) {
    const yBase = 28 + (order ?? this.rows.size) * 18;
    let row = this.rows.get(light.name);
    if (!row) {
      const dot = this.scene.add.circle(15, yBase, 4, light.color);
      const name = this.scene.add.text(
        25,
        yBase - 6,
        light.name,
        DS.getTextStyle("sm", DS.COLORS.text),
      );
      const details = this.scene.add.text(
        90,
        yBase - 6,
        light.details ?? "",
        DS.getTextStyle("xs", DS.COLORS.textSecondary),
      );
      this.container.add([dot, name, details]);
      row = { dot: dot as Phaser.GameObjects.Arc, name, details };
      this.rows.set(light.name, row);
    }
    row.dot.fillColor = light.color;
    row.details.setText(light.details ?? "");
    // brief blink for warning/error
    if (light.status === "warning" || light.status === "error") {
      this.scene.tweens.add({
        targets: row.dot,
        alpha: { from: 1, to: 0.3 },
        duration: 400,
        yoyo: true,
        repeat: 1,
      });
    }
  }
}
