/**
 * UI para mostrar el estado de las necesidades del jugador
 */

import type { NeedsState, EntityNeedsData } from "../systems/NeedsSystem";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";

export class NeedsUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private agentContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private needsBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private needsLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private isVisible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    // Crear contenedor principal más grande para ambos agentes
    this.container = this.scene.add.container(
      this.scene.cameras.main.width - 260,
      80,
    );
    this.container.setScrollFactor(0); // Fijo en pantalla

    // Fondo expandido para dos agentes
    const background = this.scene.add.graphics();
    background.fillStyle(DS.COLORS.surfaceDark, 0.9);
    background.fillRoundedRect(-10, -10, 250, 280, DS.RADIUS.md);
    background.lineStyle(1, DS.COLORS.border, 0.6);
    background.strokeRoundedRect(-10, -10, 250, 280, DS.RADIUS.md);
    this.container.add(background);

    // Título general
    const title = this.scene.add.text(
      0,
      0,
      "NECESIDADES DE AGENTES",
      DS.getTextStyle("lg", DS.COLORS.text, "bold"),
    );
    this.container.add(title);

    // Crear sección para cada agente
    this.createAgentSection("isa", "👩 Isa", 20, 0xe91e63);
    this.createAgentSection("stev", "👨 Stev", 150, 0x3498db);

    // Hacer el UI interactivo (click para ocultar/mostrar)
    background.setInteractive(
      new Phaser.Geom.Rectangle(-10, -10, 250, 280),
      Phaser.Geom.Rectangle.Contains,
    );

    background.on("pointerdown", () => {
      this.toggleVisibility();
    });
  }

  private createAgentSection(agentId: string, title: string, yOffset: number, color: number): void {
    const agentContainer = this.scene.add.container(0, yOffset);
    this.agentContainers.set(agentId, agentContainer);
    this.container.add(agentContainer);

    // Título del agente
    const agentTitle = this.scene.add.text(
      5,
      0,
      title,
      {
        ...DS.getTextStyle("base", color, "bold"),
        fontSize: "13px"
      },
    );
    agentContainer.add(agentTitle);

    // Crear barras de necesidades para este agente
    const needs = [
      { key: "hunger", label: "Hambre", color: 0x8b4513 },
      { key: "thirst", label: "Sed", color: 0x4169e1 },
      { key: "energy", label: "Energía", color: 0xffd700 },
      { key: "mentalHealth", label: "Mental", color: 0x32cd32 },
    ];

    needs.forEach((need, index) => {
      const yPos = 20 + index * 22;
      const needKey = `${agentId}.${need.key}`;

      // Etiqueta
      const label = this.scene.add.text(
        5,
        yPos,
        need.label,
        {
          ...DS.getTextStyle("xs", DS.COLORS.text),
          fontSize: "10px"
        },
      );
      this.needsLabels.set(needKey, label);
      agentContainer.add(label);

      // Barra de fondo
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(DS.COLORS.surfaceLight, 1);
      barBg.fillRoundedRect(55, yPos + 1, 100, 10, 5);
      agentContainer.add(barBg);

      // Barra de progreso
      const bar = this.scene.add.graphics();
      this.needsBars.set(needKey, bar);
      agentContainer.add(bar);
    });

    // Indicador de estado de emergencia para este agente
    const emergencyText = this.scene.add.text(
      5,
      110,
      "Estado: Normal",
      {
        ...DS.getTextStyle("xs", DS.COLORS.text),
        fontSize: "9px"
      },
    );
    (emergencyText as any).isStatusIndicator = true;
    (emergencyText as any).agentId = agentId;
    agentContainer.add(emergencyText);
  }

  public updateNeeds(entityData: EntityNeedsData | EntityNeedsData[]): void {
    if (!this.isVisible) return;

    // Convertir a array si es un solo objeto
    const entitiesData = Array.isArray(entityData) ? entityData : [entityData];

    entitiesData.forEach((data) => {
      this.updateAgentNeeds(data);
    });
  }

  private updateAgentNeeds(entityData: EntityNeedsData): void {
    const agentId = entityData.entityId;
    const needs = entityData.needs;

    // Actualizar cada barra para este agente
    ["hunger", "thirst", "energy", "mentalHealth"].forEach((needKey, index) => {
      const value = needs[needKey as keyof NeedsState] as number;
      const fullNeedKey = `${agentId}.${needKey}`;
      const bar = this.needsBars.get(fullNeedKey);
      const label = this.needsLabels.get(fullNeedKey);

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
      const barWidth = Math.max(0, (value / 100) * 100);
      bar.fillStyle(color);
      bar.fillRoundedRect(55, 21 + index * 22, barWidth, 10, 5);

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

    // Mostrar nivel de emergencia para este agente
    this.updateAgentEmergencyStatus(agentId, entityData.emergencyLevel);
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

  private updateAgentEmergencyStatus(agentId: string, level: string): void {
    const agentContainer = this.agentContainers.get(agentId);
    if (!agentContainer) return;

    // Buscar indicador de estado de emergencia para este agente
    let statusText = agentContainer.list.find(
      (obj) =>
        obj instanceof Phaser.GameObjects.Text &&
        (obj as any).isStatusIndicator &&
        (obj as any).agentId === agentId,
    ) as Phaser.GameObjects.Text;

    if (!statusText) return; // Ya se creó en createAgentSection

    // Actualizar texto y color según nivel de emergencia
    switch (level) {
      case "dying":
        statusText.setText("⚠️ MURIENDO");
        statusText.setColor("#FF0000");
        break;
      case "critical":
        statusText.setText("🚨 CRÍTICO");
        statusText.setColor("#FF4444");
        break;
      case "warning":
        statusText.setText("⚠️ Atención");
        statusText.setColor("#FF8800");
        break;
      default:
        statusText.setText("✅ Normal");
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
    this.agentContainers.clear();
    this.needsBars.clear();
    this.needsLabels.clear();
  }
}
