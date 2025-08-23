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
    // Posicionar en la esquina superior derecha con más espacio
    const panelWidth = 320;
    const panelHeight = 400;
    
    // Ajustar posición para evitar solapamiento con TopBar según análisis
    const TOPBAR_CLEAR_ZONE = 70 + 10; // TopBar height + margin
    
    this.container = this.scene.add.container(
      this.scene.cameras.main.width - panelWidth - 20,
      TOPBAR_CLEAR_ZONE, // Evitar solapamiento con TopBar
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(DS.Z_INDEX.content);

    // Fondo con glassmorphism mejorado
    const background = this.scene.add.graphics();
    
    // Sombra exterior
    background.fillStyle(DS.COLORS.shadow, 0.3);
    background.fillRoundedRect(4, 4, panelWidth, panelHeight, DS.RADIUS.lg);
    
    // Fondo principal con gradiente simulado
    background.fillStyle(DS.COLORS.surfaceDark, 0.95);
    background.fillRoundedRect(0, 0, panelWidth, panelHeight, DS.RADIUS.lg);
    
    // Highlight interior
    background.fillStyle(DS.COLORS.surface, 0.1);
    background.fillRoundedRect(2, 2, panelWidth - 4, panelHeight - 4, DS.RADIUS.lg - 2);
    
    // Bordes con brillo
    background.lineStyle(2, DS.COLORS.accent, 0.4);
    background.strokeRoundedRect(0, 0, panelWidth, panelHeight, DS.RADIUS.lg);
    background.lineStyle(1, DS.COLORS.secondary, 0.2);
    background.strokeRoundedRect(1, 1, panelWidth - 2, panelHeight - 2, DS.RADIUS.lg - 1);
    
    this.container.add(background);

    // Título con mejor tipografía
    const title = this.scene.add.text(
      panelWidth / 2,
      20,
      "⚡ ESTADO DE AGENTES",
      {
        ...DS.getTextStyle("xl", DS.COLORS.text, "bold"),
        align: "center"
      },
    );
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // Línea decorativa bajo el título
    const titleLine = this.scene.add.graphics();
    titleLine.lineStyle(2, DS.COLORS.accent, 0.6);
    titleLine.lineBetween(40, 45, panelWidth - 40, 45);
    this.container.add(titleLine);

    // Crear secciones para cada agente con más espacio
    this.createAgentSection("isa", "👩 Isa", 60, 0xe91e63);
    this.createAgentSection("stev", "👨 Stev", 220, 0x3498db);

    // Hacer el UI interactivo con área más grande
    background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, panelWidth, panelHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    background.on("pointerdown", () => {
      this.toggleVisibility();
    });
  }

  private createAgentSection(agentId: string, title: string, yOffset: number, color: number): void {
    const agentContainer = this.scene.add.container(0, yOffset);
    const sectionWidth = 300;
    const sectionHeight = 140;
    
    this.agentContainers.set(agentId, agentContainer);
    this.container.add(agentContainer);

    // Fondo de sección con glassmorphism
    const sectionBg = this.scene.add.graphics();
    sectionBg.fillStyle(color, 0.1);
    sectionBg.fillRoundedRect(10, -5, sectionWidth, sectionHeight, DS.RADIUS.md);
    sectionBg.lineStyle(2, color, 0.4);
    sectionBg.strokeRoundedRect(10, -5, sectionWidth, sectionHeight, DS.RADIUS.md);
    agentContainer.add(sectionBg);

    // Título del agente con mejor styling
    const agentTitle = this.scene.add.text(
      20,
      5,
      title,
      {
        ...DS.getTextStyle("lg", color, "bold"),
        fontSize: "16px"
      },
    );
    agentContainer.add(agentTitle);

    // Avatar/icono decorativo
    const avatar = this.scene.add.graphics();
    avatar.fillStyle(color, 0.2);
    avatar.fillCircle(270, 15, 12);
    avatar.lineStyle(2, color, 0.8);
    avatar.strokeCircle(270, 15, 12);
    agentContainer.add(avatar);

    // Crear barras de necesidades con mejor diseño
    const needs = [
      { key: "hunger", label: "🍖 Hambre", color: 0xd4763b },
      { key: "thirst", label: "💧 Sed", color: 0x4a90e2 },
      { key: "energy", label: "⚡ Energía", color: 0xf5a623 },
      { key: "mentalHealth", label: "🧠 Mental", color: 0x7ed321 },
    ];

    needs.forEach((need, index) => {
      const yPos = 30 + index * 24;
      const needKey = `${agentId}.${need.key}`;

      // Etiqueta mejorada
      const label = this.scene.add.text(
        20,
        yPos,
        need.label,
        {
          ...DS.getTextStyle("sm", DS.COLORS.text),
          fontSize: "12px"
        },
      );
      this.needsLabels.set(needKey, label);
      agentContainer.add(label);

      // Container de barra con sombra
      const barContainer = this.scene.add.graphics();
      // Sombra de barra
      barContainer.fillStyle(DS.COLORS.shadow, 0.3);
      barContainer.fillRoundedRect(102, yPos + 3, 140, 14, 7);
      // Fondo de barra
      barContainer.fillStyle(DS.COLORS.surfaceLight, 0.8);
      barContainer.fillRoundedRect(100, yPos + 1, 140, 14, 7);
      // Borde de barra
      barContainer.lineStyle(1, need.color, 0.3);
      barContainer.strokeRoundedRect(100, yPos + 1, 140, 14, 7);
      agentContainer.add(barContainer);

      // Barra de progreso
      const bar = this.scene.add.graphics();
      this.needsBars.set(needKey, bar);
      agentContainer.add(bar);
    });

    // Indicador de estado con mejor styling
    const emergencyBg = this.scene.add.graphics();
    emergencyBg.fillStyle(DS.COLORS.surface, 0.5);
    emergencyBg.fillRoundedRect(15, 120, 120, 18, 9);
    agentContainer.add(emergencyBg);

    const emergencyText = this.scene.add.text(
      25,
      125,
      "✅ Estado: Normal",
      {
        ...DS.getTextStyle("sm", DS.COLORS.text),
        fontSize: "11px"
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

      // Dibujar barra con valor actual con mejor diseño
      const barWidth = Math.max(0, (value / 100) * 138); // 138px max width
      const barYPos = 32 + index * 24; // Ajustar para nueva separación
      
      // Limpiar barra anterior
      bar.clear();
      
      // Barra principal con gradiente simulado
      bar.fillStyle(color);
      bar.fillRoundedRect(102, barYPos, barWidth, 12, 6);
      
      // Highlight en la barra para efecto de volumen
      if (barWidth > 4) {
        bar.fillStyle(0xffffff, 0.3);
        bar.fillRoundedRect(104, barYPos + 1, Math.max(0, barWidth - 4), 3, 3);
      }

      // Actualizar texto con valor numérico e iconos
      const needLabels: Record<string, string> = {
        hunger: "🍖 Hambre",
        thirst: "💧 Sed", 
        energy: "⚡ Energía",
        mentalHealth: "🧠 Mental",
      };

      // Mostrar con porcentaje y barra visual
      const percentage = Math.round(value);
      label.setText(`${needLabels[needKey]}: ${percentage}%`);

      // Cambiar color del texto basado en el estado
      if (value < 20) {
        label.setColor("#ff4757"); // Rojo crítico
      } else if (value < 40) {
        label.setColor("#ff9ff3"); // Naranja advertencia
      } else if (value < 60) {
        label.setColor("#ffa502"); // Amarillo cuidado
      } else {
        label.setColor(`#${DS.COLORS.text.toString(16).padStart(6, "0")}`); // Color normal
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
  
  public handleResize(screenWidth: number, screenHeight: number): void {
    // Reposicionar el panel en la esquina superior derecha
    const panelWidth = 320;
    const TOPBAR_CLEAR_ZONE = 70 + 10; // TopBar height + margin - consistente con createUI
    this.container.setPosition(screenWidth - panelWidth - 20, TOPBAR_CLEAR_ZONE);
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
