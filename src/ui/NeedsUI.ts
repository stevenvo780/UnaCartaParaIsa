/**
 * UI para mostrar el estado de las necesidades del jugador
 */

import type { NeedsState, EntityNeedsData } from "../systems/NeedsSystem";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";

export class NeedsUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private needsBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private needsLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private currentEntityId: string | null = null;
  private isVisible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    // Crear contenedor principal en esquina superior derecha
    this.container = this.scene.add.container(
      this.scene.cameras.main.width - 220,
      20,
    );
    this.container.setScrollFactor(0); // Fijo en pantalla

    // Fondo con DS (glass + borde)
    const background = this.scene.add.graphics();
    background.fillStyle(DS.COLORS.surfaceDark, 0.9);
    background.fillRoundedRect(-10, -10, 200, 140, DS.RADIUS.md);
    background.lineStyle(1, DS.COLORS.border, 0.6);
    background.strokeRoundedRect(-10, -10, 200, 140, DS.RADIUS.md);
    this.container.add(background);

    // Título
    const title = this.scene.add.text(
      0,
      0,
      "NECESIDADES",
      DS.getTextStyle("lg", DS.COLORS.text, "bold"),
    );
    this.container.add(title);

    // Crear barras de necesidades
    const needs = [
      { key: "hunger", label: "Hambre", color: 0x8b4513 },
      { key: "thirst", label: "Sed", color: 0x4169e1 },
      { key: "energy", label: "Energía", color: 0xffd700 },
      { key: "mentalHealth", label: "Mental", color: 0x32cd32 },
    ];

    needs.forEach((need, index) => {
      const yPos = 25 + index * 25;

      // Etiqueta
      const label = this.scene.add.text(
        -5,
        yPos,
        need.label,
        DS.getTextStyle("sm", DS.COLORS.text),
      );
      this.needsLabels.set(need.key, label);
      this.container.add(label);

      // Barra de fondo
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(DS.COLORS.surfaceLight, 1);
      barBg.fillRoundedRect(50, yPos + 2, 120, 12, 6);
      this.container.add(barBg);

      // Barra de progreso
      const bar = this.scene.add.graphics();
      this.needsBars.set(need.key, bar);
      this.container.add(bar);
    });

    // Hacer el UI interactivo (click para ocultar/mostrar)
    background.setInteractive(
      new Phaser.Geom.Rectangle(-10, -10, 200, 140),
      Phaser.Geom.Rectangle.Contains,
    );

    background.on("pointerdown", () => {
      this.toggleVisibility();
    });
  }

  public updateNeeds(entityData: EntityNeedsData): void {
    if (!this.isVisible) return;

    this.currentEntityId = entityData.entityId;
    const needs = entityData.needs;

    // Actualizar cada barra
    ["hunger", "thirst", "energy", "mentalHealth"].forEach((needKey, index) => {
      const value = needs[needKey as keyof NeedsState] as number;
      const bar = this.needsBars.get(needKey);
      const label = this.needsLabels.get(needKey);

      if (!bar || !label) return;

      // Limpiar barra anterior
      bar.clear();

      // Determinar color basado en el valor
      let color: number;
      if (value < 20) {
        color = 0xff0000; // Rojo crítico
      } else if (value < 40) {
        color = 0xff6600; // Naranja advertencia
      } else if (value < 60) {
        color = 0xffff00; // Amarillo cuidado
      } else {
        color = this.getColorForNeed(needKey); // Color normal
      }

      // Dibujar barra con valor actual
      const barWidth = Math.max(0, (value / 100) * 120);
      bar.fillStyle(color);
      bar.fillRoundedRect(50, 27 + index * 25, barWidth, 12, 6);

      // Actualizar texto con valor numérico
      const needLabels: Record<string, string> = {
        hunger: "Hambre",
        thirst: "Sed",
        energy: "Energía",
        mentalHealth: "Mental",
      };

      label.setText(`${needLabels[needKey]}: ${Math.round(value)}`);

      // Cambiar color del texto si es crítico
      if (value < 20) {
        label.setColor("#FF0000");
      } else if (value < 40) {
        label.setColor("#FF6600");
      } else {
        label.setColor(`#${DS.COLORS.text.toString(16).padStart(6, "0")}`);
      }
    });

    // Mostrar nivel de emergencia
    this.updateEmergencyStatus(entityData.emergencyLevel);
  }

  private getColorForNeed(needKey: string): number {
    const colors: Record<string, number> = {
      hunger: 0x8b4513, // Marrón
      thirst: 0x4169e1, // Azul
      energy: 0xffd700, // Dorado
      mentalHealth: 0x32cd32, // Verde
    };
    return colors[needKey] || 0xffffff;
  }

  private updateEmergencyStatus(level: string): void {
    // Buscar o crear indicador de estado de emergencia
    let statusText = this.container.list.find(
      (obj) =>
        obj instanceof Phaser.GameObjects.Text &&
        (obj as any).isStatusIndicator,
    ) as Phaser.GameObjects.Text;

    if (!statusText) {
      statusText = this.scene.add.text(0, 115, "", {
        fontSize: "10px",
        fontStyle: "bold",
      });
      (statusText as any).isStatusIndicator = true;
      this.container.add(statusText);
    }

    // Actualizar texto y color según nivel de emergencia
    switch (level) {
      case "dying":
        statusText.setText("⚠️ CRÍTICO - MURIENDO");
        statusText.setColor("#FF0000");
        break;
      case "critical":
        statusText.setText("🚨 ESTADO CRÍTICO");
        statusText.setColor("#FF4444");
        break;
      case "warning":
        statusText.setText("⚠️ Necesita atención");
        statusText.setColor("#FF8800");
        break;
      default:
        statusText.setText("✅ Estado normal");
        statusText.setColor("#00FF00");
        break;
    }
  }

  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.container.setVisible(visible);
  }

  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
    this.needsBars.clear();
    this.needsLabels.clear();
  }
}
