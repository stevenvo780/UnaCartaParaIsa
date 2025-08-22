import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export class FocusTrap {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private focusables: Phaser.GameObjects.GameObject[] = [];
    private current = 0;
    private enabled = false;
    private highlight?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
        this.collectFocusables();
        this.createHighlight();
        this.bindKeys();
    }

    private collectFocusables() {
        this.focusables = [];
        (this.container.list || []).forEach((child) => {
            const anyChild = child as any;
            if (
                anyChild?.input?.enabled ||
        typeof anyChild?.setInteractive === "function"
            ) {
                this.focusables.push(child);
            }
        });
    }

    private createHighlight() {
        this.highlight = this.scene.add.graphics();
        this.highlight.lineStyle(
            DS.ACCESSIBILITY.focusOutlineWidth,
            DS.ACCESSIBILITY.focusOutlineColor,
            1,
        );
        this.highlight.setScrollFactor(0);
        this.highlight.setVisible(false);
        this.container.add(this.highlight);
    }

    private bindKeys() {
        this.scene.input.keyboard?.on("keydown-TAB", (ev: KeyboardEvent) => {
            if (!this.enabled || !this.container.visible) return;
            ev.preventDefault?.();
            const backwards = (ev as any).shiftKey;
            this.move(backwards ? -1 : 1);
        });
        this.scene.input.keyboard?.on("keydown-ENTER", () => {
            if (!this.enabled || !this.container.visible) return;
            const target = this.focusables[this.current] as any;
            if (target) {
                // Emular click/activate
                target.emit?.("pointerdown");
            }
        });
    }

    private move(delta: number) {
        if (this.focusables.length === 0) return;
        this.current =
      (this.current + delta + this.focusables.length) % this.focusables.length;
        this.renderHighlight();
    }

    private renderHighlight() {
        if (!this.highlight) return;
        const target = this.focusables[this.current] as any;
        if (!target || !target.getBounds) return;
        const b = target.getBounds();
        const pad = 4;
        this.highlight.clear();
        this.highlight.lineStyle(
            DS.ACCESSIBILITY.focusOutlineWidth,
            DS.ACCESSIBILITY.focusOutlineColor,
            1,
        );
        this.highlight.strokeRoundedRect(
            b.x - this.container.x - pad,
            b.y - this.container.y - pad,
            b.width + pad * 2,
            b.height + pad * 2,
            DS.RADIUS.sm,
        );
        this.highlight.setVisible(true);
    }

    activate() {
        this.enabled = true;
        this.collectFocusables();
        this.current = 0;
        this.renderHighlight();
    }

    deactivate() {
        this.enabled = false;
        this.highlight?.setVisible(false);
    }
}
