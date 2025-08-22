import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export interface UIButtonOptions {
  width?: number;
  height?: number;
  color?: number;
  labelStyle?: Phaser.Types.GameObjects.Text.TextStyle;
}

export function createUIButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    opts: UIButtonOptions = {},
): Phaser.GameObjects.Container {
    const w = Math.max(opts.width ?? 80, DS.ACCESSIBILITY.minimumTouchSize);
    const h = Math.max(opts.height ?? 36, DS.ACCESSIBILITY.minimumTouchSize);
    const color = opts.color ?? DS.COLORS.primary;

    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(color, 0.9);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.lineStyle(1, DS.COLORS.border, 0.4);
    g.strokeRoundedRect(0, 0, w, h, 6);

    const t = scene.add
        .text(w / 2, h / 2, label, {
            ...DS.getTextStyle("sm", DS.COLORS.text, "bold"),
            ...opts.labelStyle,
        })
        .setOrigin(0.5);

    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, w, h),
        Phaser.Geom.Rectangle.Contains,
    );
    c.on("pointerdown", onClick);
    c.on("pointerover", () => g.setAlpha(1));
    c.on("pointerout", () => g.setAlpha(0.9));

    // Focus ring
    const focus = scene.add.graphics();
    focus.lineStyle(
        DS.ACCESSIBILITY.focusOutlineWidth,
        DS.ACCESSIBILITY.focusOutlineColor,
        1,
    );
    focus.strokeRoundedRect(-2, -2, w + 4, h + 4, 8);
    focus.setVisible(false);
    c.add(focus);
    c.on("pointerover", () => focus.setVisible(true));
    c.on("pointerout", () => focus.setVisible(false));

    return c;
}
