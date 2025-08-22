import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export class SettingsModalContent {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = this.scene.add.container(0, 0);
        this.build();
    }

    getContainer() {
        return this.container;
    }

    private build() {
        const title = this.scene.add.text(
            0,
            0,
            "⚙️ Configuración",
            DS.getTextStyle("lg", DS.COLORS.text, "bold"),
        );
        this.container.add(title);

        // High contrast toggle
        const hcLabel = this.scene.add.text(
            0,
            26,
            "Alto contraste",
            DS.getTextStyle("base", DS.COLORS.text),
        );
        const hcToggle = this.makeToggle(
            220,
            28,
            () => DS.ACCESSIBILITY.highContrastEnabled === true,
            (next) => {
                DS.setAccessibilityPreferences({ highContrastEnabled: next });
            },
        );
        this.container.add(hcLabel);
        this.container.add(hcToggle);

        // Reduced motion toggle
        const rmLabel = this.scene.add.text(
            0,
            56,
            "Reducir movimiento",
            DS.getTextStyle("base", DS.COLORS.text),
        );
        const rmToggle = this.makeToggle(
            220,
            58,
            () => DS.ACCESSIBILITY.reducedMotion === true,
            (next) => {
                DS.setAccessibilityPreferences({ reducedMotion: next });
            },
        );
        this.container.add(rmLabel);
        this.container.add(rmToggle);

        // UI size info (hint)
        const hint = this.scene.add.text(
            0,
            92,
            "Los cambios aplican a nuevos elementos.",
            DS.getTextStyle("xs", DS.COLORS.textSecondary),
        );
        this.container.add(hint);
    }

    private makeToggle(
        x: number,
        y: number,
        isOn: () => boolean,
        onChange: (value: boolean) => void,
    ): Phaser.GameObjects.Container {
        const c = this.scene.add.container(x, y);
        const size = DS.ensureMinimumTouchSize(36, 20);

        const bg = this.scene.add.graphics();
        const draw = () => {
            const on = isOn();
            bg.clear();
            bg.fillStyle(on ? DS.COLORS.primary : DS.COLORS.surfaceLight, 0.9);
            bg.fillRoundedRect(
                0,
                -size.height / 2,
                size.width,
                size.height,
                size.height / 2,
            );
            const knobX = on ? size.width - size.height + 2 : 2;
            bg.fillStyle(DS.COLORS.text, 0.95);
            bg.fillCircle(knobX + size.height / 2 - 2, 0, size.height / 2 - 3);
            bg.lineStyle(1, DS.COLORS.border, 0.4);
            bg.strokeRoundedRect(
                0,
                -size.height / 2,
                size.width,
                size.height,
                size.height / 2,
            );
        };
        draw();
        c.add(bg);
        c.setSize(size.width, size.height);
        c.setInteractive(
            new Phaser.Geom.Rectangle(0, -size.height / 2, size.width, size.height),
            Phaser.Geom.Rectangle.Contains,
        );
        c.on("pointerdown", () => {
            const next = !isOn();
            onChange(next);
            draw();
        });

        const focus = DS.addFocusIndicator(
            this.scene,
      c as unknown as Phaser.GameObjects.GameObject,
      size.width,
      size.height,
        );
        c.add(focus);
        return c;
    }
}
