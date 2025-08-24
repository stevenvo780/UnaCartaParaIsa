import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";

export class SettingsModalContent {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sliders: Phaser.GameObjects.Container[] = [];

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

    // ====== Needs tuning ======
    const needsTitle = this.scene.add.text(
      0,
      120,
      "🫀 Necesidades (tuning)",
      DS.getTextStyle("base", DS.COLORS.text, "bold"),
    );
    this.container.add(needsTitle);

    const glm = (this.scene.scene.get("MainScene") as any)?.registry?.get(
      "gameLogicManager",
    );
    const needsSystem = glm?.getNeedsSystem?.();

    const cfg = needsSystem?.getConfig?.() || {
      hungerDecayRate: 0.2,
      thirstDecayRate: 0.3,
      energyDecayRate: 0.15,
      mentalHealthDecayRate: 0.05,
      recoveryMultiplier: 5.0,
      criticalThreshold: 20,
      warningThreshold: 40,
    };

    const baseY = 144;
    const row = (i: number) => baseY + i * 28;

    this.addSlider(
      0,
      row(0),
      "Hambre (decay)",
      0.01,
      0.6,
      cfg.hungerDecayRate,
      (val) => needsSystem?.updateConfig?.({ hungerDecayRate: val }),
    );
    this.addSlider(
      0,
      row(1),
      "Sed (decay)",
      0.01,
      0.8,
      cfg.thirstDecayRate,
      (val) => needsSystem?.updateConfig?.({ thirstDecayRate: val }),
    );
    this.addSlider(
      0,
      row(2),
      "Energía (decay)",
      0.01,
      0.5,
      cfg.energyDecayRate,
      (val) => needsSystem?.updateConfig?.({ energyDecayRate: val }),
    );
    this.addSlider(
      0,
      row(3),
      "Mental (decay)",
      0.0,
      0.2,
      cfg.mentalHealthDecayRate,
      (val) => needsSystem?.updateConfig?.({ mentalHealthDecayRate: val }),
    );
    this.addSlider(
      0,
      row(4),
      "Recuperación (zonas)",
      0.5,
      10,
      cfg.recoveryMultiplier,
      (val) => needsSystem?.updateConfig?.({ recoveryMultiplier: val }),
      true,
    );
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

  private addSlider(
    x: number,
    y: number,
    label: string,
    min: number,
    max: number,
    value: number,
    onChange: (v: number) => void,
    integer = false,
  ) {
    const group = this.scene.add.container(x, y);
    const lab = this.scene.add.text(0, 0, label, DS.getTextStyle("base", DS.COLORS.text));
    group.add(lab);

    const sliderX = 160;
    const sliderW = 160;
    const sliderH = 12;
    const bg = this.scene.add.graphics();
    const draw = (val: number) => {
      bg.clear();
      bg.fillStyle(DS.COLORS.surfaceLight, 0.8);
      bg.fillRoundedRect(sliderX, 4, sliderW, sliderH, 6);
      // progress
      const t = (val - min) / (max - min);
      const pw = Math.max(4, Math.min(sliderW, t * sliderW));
      bg.fillStyle(DS.COLORS.primary, 0.9);
      bg.fillRoundedRect(sliderX, 4, pw, sliderH, 6);
      // border
      bg.lineStyle(1, DS.COLORS.border, 0.4);
      bg.strokeRoundedRect(sliderX, 4, sliderW, sliderH, 6);
    };
    draw(value);
    group.add(bg);

    const valText = this.scene.add.text(
      sliderX + sliderW + 6,
      0,
      integer ? `${Math.round(value)}` : value.toFixed(2),
      DS.getTextStyle("sm", DS.COLORS.textSecondary),
    );
    group.add(valText);

    // Hit area for slider
    const hit = this.scene.add.rectangle(sliderX, 4, sliderW, sliderH);
    hit.setOrigin(0, 0);
    hit.setInteractive(
      new Phaser.Geom.Rectangle(sliderX, 4, sliderW, sliderH),
      Phaser.Geom.Rectangle.Contains,
    );
    const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
      const localX = Phaser.Math.Clamp(pointer.x - group.x - sliderX, 0, sliderW);
      const t = localX / sliderW;
      let newVal = min + t * (max - min);
      if (integer) newVal = Math.round(newVal);
      draw(newVal);
      valText.setText(integer ? `${Math.round(newVal)}` : newVal.toFixed(2));
      onChange(newVal);
    };
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => updateFromPointer(p));
    hit.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) updateFromPointer(p);
    });
    group.add(hit);

    this.container.add(group);
    this.sliders.push(group);
  }
}
