import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";
import { FocusTrap } from "./FocusTrap";

export class ModalManager {
    private scene: Phaser.Scene;
    private registry = new Map<string, Phaser.GameObjects.Container>();
    private order: string[] = [];
    private traps = new Map<string, FocusTrap>();
    private readonly TOP_BAR_HEIGHT = 70;
    private readonly BOTTOM_BAR_HEIGHT = 80;
    private readonly MARGIN = 16;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // ESC cierra el último modal visible
        this.scene.input.keyboard?.on("keydown-ESC", () => {
            const visible = this.order.filter((id) => this.registry.get(id)?.visible);
            const last = visible[visible.length - 1];
            if (last) this.close(last);
        });
    }

    getVisibleContainers(): Phaser.GameObjects.Container[] {
        return Array.from(this.registry.values()).filter((c) => c.visible);
    }

    createWindow(
        id: string,
        title: string,
        content: Phaser.GameObjects.Container,
        width = 360,
        height = 220,
    ): Phaser.GameObjects.Container {
        const modal = this.scene.add.container(0, 0);
        modal.setScrollFactor(0);
        modal.setDepth(1003);
        modal.setData("w", width);
        modal.setData("h", height);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, 0x3498db, 0.8);
        bg.strokeRoundedRect(0, 0, width, height, 8);
        modal.add(bg);

        const titleBar = this.scene.add.graphics();
        titleBar.fillStyle(0x0f3460, 0.9);
        titleBar.fillRoundedRect(0, 0, width, 28, 8);
        modal.add(titleBar);

        const titleText = this.scene.add
            .text(12, 14, title, {
                fontSize: "12px",
                color: "#ecf0f1",
                fontFamily: "Arial, sans-serif",
                fontStyle: "bold",
            })
            .setOrigin(0, 0.5);
        modal.add(titleText);

        const closeBtn = this.scene.add.text(width - 18, 6, "×", {
            fontSize: "14px",
            color: "#e74c3c",
            fontStyle: "bold",
        });
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on("pointerdown", () => this.close(id));
        modal.add(closeBtn);

        content.setPosition(12, 36);
        modal.add(content);

        this.registry.set(id, modal);
        if (!this.order.includes(id)) this.order.push(id);
        // Focus trap por modal
        const trap = new FocusTrap(this.scene, modal);
        trap.activate();
        this.traps.set(id, trap);
        this.layout();
        return modal;
    }

    toggle(id: string) {
        const m = this.registry.get(id);
        if (!m) return;
        const next = !m.visible;
        m.setVisible(next);
        const trap = this.traps.get(id);
        if (trap) next ? trap.activate() : trap.deactivate();
        this.layout();
    }

    close(id: string) {
        const m = this.registry.get(id);
        if (!m) return;
        m.setVisible(false);
        const trap = this.traps.get(id);
        trap?.deactivate();
        this.layout();
    }

    layout() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const availX = this.MARGIN;
        const availW = width - this.MARGIN * 2;
        const startY = this.TOP_BAR_HEIGHT + this.MARGIN;
        const maxY = height - this.BOTTOM_BAR_HEIGHT - this.MARGIN;

        let cursorX = availX;
        let cursorY = startY;
        let rowH = 0;
        const visibleIds = this.order.filter(
            (id) => this.registry.get(id)?.visible,
        );
        visibleIds.forEach((id) => {
            const modal = this.registry.get(id)!;
            const w = (modal.getData("w") as number) ?? 200;
            const h = (modal.getData("h") as number) ?? 150;
            if (cursorX + w > availX + availW) {
                cursorX = availX;
                cursorY += rowH + this.MARGIN;
                rowH = 0;
            }
            if (cursorY + h > maxY) {
                cursorY = Math.max(startY, maxY - h);
            }
            modal.setPosition(cursorX, cursorY);
            cursorX += w + this.MARGIN;
            rowH = Math.max(rowH, h);
        });
    }

    // Re-dibuja fondos y barras de título con colores actuales del DS
    refreshStyles() {
        this.registry.forEach((modal) => {
            const width = (modal.getData("w") as number) ?? 200;
            const height = (modal.getData("h") as number) ?? 150;
            const bg = modal.list[0] as Phaser.GameObjects.Graphics | undefined;
            const titleBar = modal.list[1] as Phaser.GameObjects.Graphics | undefined;
            const titleText = modal.list[2] as Phaser.GameObjects.Text | undefined;
            if (bg) {
                bg.clear();
                bg.fillStyle(DS.COLORS.background, 0.95);
                bg.fillRoundedRect(0, 0, width, height, 8);
                bg.lineStyle(2, DS.COLORS.secondary, 0.8);
                bg.strokeRoundedRect(0, 0, width, height, 8);
            }
            if (titleBar) {
                titleBar.clear();
                titleBar.fillStyle(DS.COLORS.surface, 0.9);
                titleBar.fillRoundedRect(0, 0, width, 28, 8);
            }
            if (titleText) {
                titleText.setStyle({
                    ...DS.getTextStyle("sm", DS.COLORS.text, "bold"),
                });
            }
        });
        this.layout();
    }
}
