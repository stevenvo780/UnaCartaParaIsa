import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export function createUIPill(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: number,
): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(color, 0.15);
    g.fillRoundedRect(0, -12, 120, 24, 12);
    g.lineStyle(1, color, 0.5);
    g.strokeRoundedRect(0, -12, 120, 24, 12);
    const t = scene.add
        .text(12, 0, text, { ...DS.getTextStyle("sm", DS.COLORS.text) })
        .setOrigin(0, 0.5);
    c.add([g, t]);
    c.setSize(120, 24);
    return c;
}
